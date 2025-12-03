const mammoth = require('mammoth');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// ============================================
// 🚀 GLOBAL BROWSER INSTANCE (SINGLETON)
// Browser ko reuse karenge - har request pe naya launch nahi
// ============================================
let browserInstance = null;
let browserLastUsed = null;
let isLaunching = false;
let launchPromise = null;

const BROWSER_IDLE_TIMEOUT = 10 * 60 * 1000; // 10 minutes
const CONVERSION_TIMEOUT = 300000; // 5 minutes

// 🔥 FIXED: Browser launch options - Removed problematic args
const LAUNCH_OPTIONS = {
    headless: 'new',
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        // ❌ REMOVED: '--single-process' - causes crashes
        '--disable-gpu',
        '--disable-extensions',
        '--disable-software-rasterizer',
        '--disable-background-networking',
        '--disable-default-apps',
        '--disable-sync',
        '--disable-translate',
        '--hide-scrollbars',
        '--metrics-recording-only',
        '--mute-audio',
        '--no-default-browser-check',
        '--safebrowsing-disable-auto-update',
        // 🔥 FIXED: Only valid memory flag
        '--js-flags=--max-old-space-size=512',
        '--disable-web-security',
        '--font-render-hinting=none',
        '--disable-font-subpixel-positioning'
        // ❌ REMOVED: '--memory-pressure-off' - invalid
        // ❌ REMOVED: '--max-old-space-size=1024' - not valid Chrome arg
    ],
    timeout: 120000  // 2 minutes browser launch timeout
};

/**
 * Get or create browser instance (Singleton Pattern)
 */
async function getBrowser() {
    const now = Date.now();
    
    // If browser is idle for too long, close it
    if (browserInstance && browserLastUsed && (now - browserLastUsed > BROWSER_IDLE_TIMEOUT)) {
        console.log('[getBrowser] Closing idle browser...');
        try {
            await browserInstance.close();
        } catch (e) {
            console.error('[getBrowser] Error closing idle browser:', e.message);
        }
        browserInstance = null;
        isLaunching = false;
        launchPromise = null;
    }
    
    // Return existing browser if available
    if (browserInstance) {
        try {
            if (browserInstance.isConnected()) {
                browserLastUsed = now;
                return browserInstance;
            }
        } catch (e) {
            console.log('[getBrowser] Browser disconnected, will relaunch');
            browserInstance = null;
        }
    }
    
    // If already launching, wait for it
    if (isLaunching && launchPromise) {
        console.log('[getBrowser] Waiting for browser launch...');
        return await launchPromise;
    }
    
    // Launch new browser
    isLaunching = true;
    console.log('[getBrowser] Launching new browser instance...');
    
    launchPromise = (async () => {
        try {
            const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || 
                                   process.env.CHROMIUM_PATH ||
                                   puppeteer.executablePath();
            
            console.log('[getBrowser] Using executable:', executablePath);
            
            browserInstance = await puppeteer.launch({
                ...LAUNCH_OPTIONS,
                executablePath: executablePath
            });
            
            browserLastUsed = Date.now();
            console.log('[getBrowser] Browser launched successfully');
            
            browserInstance.on('disconnected', () => {
                console.log('[getBrowser] Browser disconnected');
                browserInstance = null;
                isLaunching = false;
                launchPromise = null;
            });
            
            return browserInstance;
            
        } catch (error) {
            console.error('[getBrowser] Launch failed:', error.message);
            
            try {
                console.log('[getBrowser] Trying fallback launch...');
                browserInstance = await puppeteer.launch(LAUNCH_OPTIONS);
                browserLastUsed = Date.now();
                return browserInstance;
            } catch (fallbackError) {
                console.error('[getBrowser] Fallback launch failed:', fallbackError.message);
                throw fallbackError;
            }
        } finally {
            isLaunching = false;
        }
    })();
    
    return await launchPromise;
}

/**
 * 🔥 NEW: Image handler with size limits for large files
 */
function createImageHandler(fileSizeMB) {
    const MAX_IMAGE_SIZE_KB = fileSizeMB > 20 ? 100 : 300; // Smaller limit for large files
    
    return mammoth.images.imgElement(async function(image) {
        try {
            const imageBuffer = await image.read("base64");
            const imageSizeKB = imageBuffer.length / 1024;
            
            // Skip large images to save memory
            if (imageSizeKB > MAX_IMAGE_SIZE_KB) {
                console.log(`[ImageHandler] Skipping large image: ${Math.round(imageSizeKB)}KB`);
                return { src: '' };
            }
            
            return {
                src: "data:" + image.contentType + ";base64," + imageBuffer
            };
        } catch (e) {
            console.log('[ImageHandler] Error reading image:', e.message);
            return { src: '' };
        }
    });
}

/**
 * Convert DOCX to PDF - Optimized for LARGE FILES
 * 🔥 ADDED: onProgress callback for status updates
 */
async function convertDocxToPdfNode(docxPath, outputPath = null, onProgress = null) {
    let page = null;
    const startTime = Date.now();
    
    // Helper to report progress
    const reportProgress = (percent, step) => {
        if (onProgress && typeof onProgress === 'function') {
            onProgress(percent, step);
        }
    };
    
    try {
        if (!outputPath) {
            outputPath = docxPath.replace(/\.docx?$/i, '.pdf');
        }
        
        const fileStats = await fs.stat(docxPath);
        const fileSizeMB = Math.round(fileStats.size / (1024 * 1024));
        console.log(`[convertDocxToPdfNode] Starting: ${path.basename(docxPath)} (${fileSizeMB} MB)`);
        
        reportProgress(5, 'Reading file...');
        
        const dynamicTimeout = Math.max(CONVERSION_TIMEOUT, fileSizeMB * 5000);
        console.log(`[convertDocxToPdfNode] Timeout: ${dynamicTimeout / 1000}s`);
        
        // ============================================
        // Step 1: Convert DOCX to HTML
        // ============================================
        const mammothStart = Date.now();
        console.log('[convertDocxToPdfNode] Converting DOCX to HTML...');
        reportProgress(10, 'Converting DOCX to HTML...');
        
        const result = await mammoth.convertToHtml({ 
            path: docxPath,
            convertImage: createImageHandler(fileSizeMB)
        });
        
        let html = result.value;
        const mammothTime = Date.now() - mammothStart;
        const htmlSizeKB = Math.round(html.length / 1024);
        console.log(`[convertDocxToPdfNode] Mammoth done: ${mammothTime}ms (${htmlSizeKB} KB HTML)`);
        
        reportProgress(35, 'HTML conversion complete');
        
        // 🔥 NEW: Truncate extremely large HTML to prevent memory crash
        const MAX_HTML_SIZE = 4 * 1024 * 1024; // 4MB
        if (html.length > MAX_HTML_SIZE) {
            console.log(`[convertDocxToPdfNode] ⚠️ Truncating HTML from ${htmlSizeKB}KB`);
            html = html.substring(0, MAX_HTML_SIZE);
            html += '<div style="page-break-before:always;color:red;text-align:center;padding:20px;">';
            html += '<strong>⚠️ Document truncated due to size limits</strong></div>';
        }
        
        // ============================================
        // Step 2: Create full HTML document
        // ============================================
        const fullHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            line-height: 1.6;
            padding: 0.5in;
            color: #000;
            background: #fff;
        }
        h1, h2, h3, h4, h5, h6 {
            font-weight: bold;
            margin: 1em 0 0.5em 0;
            page-break-after: avoid;
        }
        h1 { font-size: 16pt; }
        h2 { font-size: 14pt; }
        h3 { font-size: 13pt; }
        p {
            margin-bottom: 0.8em;
            text-align: justify;
            orphans: 2;
            widows: 2;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 1em 0;
            page-break-inside: avoid;
        }
        th, td {
            border: 1px solid #000;
            padding: 6px 8px;
            text-align: left;
        }
        th { background-color: #f0f0f0; }
        ul, ol {
            margin: 0.5em 0;
            padding-left: 1.5em;
        }
        li { margin-bottom: 0.3em; }
        img { 
            max-width: 100%; 
            height: auto;
            page-break-inside: avoid;
        }
        @media print {
            body { padding: 0; }
        }
    </style>
</head>
<body>${html}</body>
</html>`;
        
        reportProgress(40, 'Preparing browser...');
        
        // ============================================
        // Step 3: Get browser and create page
        // ============================================
        const browserStart = Date.now();
        const browser = await getBrowser();
        page = await browser.newPage();
        console.log(`[convertDocxToPdfNode] Browser ready: ${Date.now() - browserStart}ms`);
        
        reportProgress(50, 'Browser ready');
        
        // ============================================
        // Step 4: Optimize page for large files
        // ============================================
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const resourceType = req.resourceType();
            if (fileSizeMB > 20) {
                // Large files: block only heavy resources
                if (['stylesheet', 'font', 'media', 'websocket'].includes(resourceType)) {
                    req.abort();
                } else {
                    req.continue();
                }
            } else {
                // Smaller files: block images too
                if (['image', 'stylesheet', 'font', 'media', 'websocket'].includes(resourceType)) {
                    req.abort();
                } else {
                    req.continue();
                }
            }
        });
        
        await page.setJavaScriptEnabled(false);
        await page.setViewport({ width: 800, height: 600 });
        
        // ============================================
        // Step 5: Set content
        // ============================================
        const contentStart = Date.now();
        console.log('[convertDocxToPdfNode] Setting page content...');
        reportProgress(55, 'Loading content...');
        
        await page.setContent(fullHtml, { 
            waitUntil: 'domcontentloaded',
            timeout: dynamicTimeout 
        });
        console.log(`[convertDocxToPdfNode] Content set: ${Date.now() - contentStart}ms`);
        
        reportProgress(70, 'Generating PDF...');
        
        // ============================================
        // Step 6: Generate PDF
        // ============================================
        const pdfStart = Date.now();
        console.log('[convertDocxToPdfNode] Generating PDF...');
        
        await page.pdf({
            path: outputPath,
            format: 'A4',
            margin: {
                top: '1in',
                right: '1in',
                bottom: '1in',
                left: '1in'
            },
            printBackground: false,
            preferCSSPageSize: false,
            timeout: dynamicTimeout
        });
        console.log(`[convertDocxToPdfNode] PDF generated: ${Date.now() - pdfStart}ms`);
        
        reportProgress(90, 'Verifying output...');
        
        // ============================================
        // Step 7: Verify PDF
        // ============================================
        const stats = await fs.stat(outputPath);
        if (stats.size < 100) {
            throw new Error('Generated PDF is too small (likely empty)');
        }
        
        const outputSizeMB = Math.round(stats.size / (1024 * 1024) * 100) / 100;
        const totalTime = Date.now() - startTime;
        
        console.log(`[convertDocxToPdfNode] ✅ Complete: ${path.basename(outputPath)}`);
        console.log(`[convertDocxToPdfNode] ✅ Input: ${fileSizeMB} MB → Output: ${outputSizeMB} MB`);
        console.log(`[convertDocxToPdfNode] ✅ Total time: ${totalTime}ms`);
        
        reportProgress(100, 'Complete!');
        
        return outputPath;
        
    } catch (error) {
        const totalTime = Date.now() - startTime;
        console.error(`[convertDocxToPdfNode] ❌ Failed after ${totalTime}ms:`, error.message);
        throw new Error(`DOCX to PDF conversion failed: ${error.message}`);
        
    } finally {
        if (page) {
            try {
                await page.close();
            } catch (closeError) {
                console.error('[convertDocxToPdfNode] Error closing page:', closeError.message);
            }
        }
    }
}

/**
 * Convert multiple DOCX files to PDF in sequence
 */
async function convertMultipleDocxToPdf(docxPaths, onProgress = null) {
    console.log(`[convertMultipleDocxToPdf] Converting ${docxPaths.length} files...`);
    const startTime = Date.now();
    
    await getBrowser();
    
    const results = [];
    
    for (let i = 0; i < docxPaths.length; i++) {
        const docxPath = docxPaths[i];
        try {
            const result = await convertDocxToPdfNode(docxPath, null, (percent, step) => {
                if (onProgress) {
                    const overallPercent = Math.round((i / docxPaths.length) * 100 + (percent / docxPaths.length));
                    onProgress(overallPercent, `File ${i + 1}/${docxPaths.length}: ${step}`);
                }
            });
            results.push(result);
        } catch (err) {
            results.push({
                error: true,
                path: docxPath,
                message: err.message
            });
        }
    }
    
    console.log(`[convertMultipleDocxToPdf] All done in ${Date.now() - startTime}ms`);
    return results;
}

/**
 * Gracefully close browser
 */
async function closeBrowser() {
    if (browserInstance) {
        console.log('[closeBrowser] Closing browser...');
        try {
            await browserInstance.close();
            browserInstance = null;
            isLaunching = false;
            launchPromise = null;
            console.log('[closeBrowser] Browser closed');
        } catch (error) {
            console.error('[closeBrowser] Error:', error.message);
        }
    }
}

/**
 * Pre-warm browser
 */
async function warmupBrowser() {
    try {
        console.log('[warmupBrowser] Pre-warming browser...');
        await getBrowser();
        console.log('[warmupBrowser] Browser ready');
        return true;
    } catch (error) {
        console.error('[warmupBrowser] Failed:', error.message);
        return false;
    }
}

// ============================================
// Cleanup on process exit
// ============================================
const cleanup = async () => {
    await closeBrowser();
};

process.on('exit', cleanup);
process.on('SIGINT', async () => {
    await cleanup();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    await cleanup();
    process.exit(0);
});
process.on('uncaughtException', async (error) => {
    console.error('[uncaughtException]', error);
    await cleanup();
    process.exit(1);
});

// ============================================
// Exports
// ============================================
module.exports = { 
    convertDocxToPdfNode,
    convertMultipleDocxToPdf,
    closeBrowser,
    warmupBrowser,
    getBrowser
};