const mammoth = require('mammoth');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

// ============================================
// 🚀 GLOBAL BROWSER INSTANCE (SINGLETON)
// Browser ko reuse karenge - har request pe naya launch nahi
// ============================================
let browserInstance = null;
let browserLastUsed = null;
let isLaunching = false;
let launchPromise = null;

const BROWSER_IDLE_TIMEOUT = 10 * 60 * 1000; // 🔥 10 minutes (increased)
const CONVERSION_TIMEOUT = 300000; // 🔥 5 minutes (was 30 seconds)

// Browser launch options - Optimized for LARGE FILES (50-100MB)
const LAUNCH_OPTIONS = {
    headless: 'new',
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
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
        // 🔥 INCREASED MEMORY FOR LARGE FILES - 1GB
        '--js-flags=--max-old-space-size=1024',
        '--disable-web-security',
        '--font-render-hinting=none',
        '--disable-font-subpixel-positioning',
        // 🔥 Additional memory optimizations for large files
        '--memory-pressure-off',
        '--max-old-space-size=1024'
    ],
    ignoreDefaultArgs: ['--disable-extensions'],
    timeout: 120000  // 🔥 2 minutes browser launch timeout
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
            // Check if browser is still connected
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
    console.log('[getBrowser] Launching new browser instance for large files...');
    
    launchPromise = (async () => {
        try {
            // Determine executable path for Render
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
            
            // Handle browser disconnect
            browserInstance.on('disconnected', () => {
                console.log('[getBrowser] Browser disconnected');
                browserInstance = null;
                isLaunching = false;
                launchPromise = null;
            });
            
            return browserInstance;
            
        } catch (error) {
            console.error('[getBrowser] Launch failed:', error.message);
            
            // Fallback: try without custom executable path
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
 * Convert DOCX to PDF - Optimized for LARGE FILES (50-100MB)
 */
async function convertDocxToPdfNode(docxPath, outputPath = null) {
    let page = null;
    const startTime = Date.now();
    
    try {
        // Generate output path if not provided
        if (!outputPath) {
            outputPath = docxPath.replace(/\.docx?$/i, '.pdf');
        }
        
        // 🔥 Check file size
        const fileStats = await fs.stat(docxPath);
        const fileSizeMB = Math.round(fileStats.size / (1024 * 1024));
        console.log(`[convertDocxToPdfNode] Starting conversion: ${path.basename(docxPath)} (${fileSizeMB} MB)`);
        
        // 🔥 Adjust timeout based on file size
        const dynamicTimeout = Math.max(CONVERSION_TIMEOUT, fileSizeMB * 5000); // 5 seconds per MB
        console.log(`[convertDocxToPdfNode] Using timeout: ${dynamicTimeout / 1000} seconds`);
        
        // ============================================
        // Step 1: Convert DOCX to HTML (May take time for large files)
        // ============================================
        const mammothStart = Date.now();
        console.log('[convertDocxToPdfNode] Converting DOCX to HTML with Mammoth...');
        
        const result = await mammoth.convertToHtml({ 
            path: docxPath,
            // 🔥 Options for large files
            convertImage: mammoth.images.imgElement(function(image) {
                return image.read("base64").then(function(imageBuffer) {
                    // Compress images for large files
                    return {
                        src: "data:" + image.contentType + ";base64," + imageBuffer
                    };
                });
            })
        });
        
        const html = result.value;
        const mammothTime = Date.now() - mammothStart;
        console.log(`[convertDocxToPdfNode] Mammoth HTML conversion: ${mammothTime}ms (${Math.round(html.length / 1024)} KB HTML)`);
        
        if (result.messages.length > 0) {
            console.log('[convertDocxToPdfNode] Mammoth warnings:', result.messages.length);
        }
        
        // ============================================
        // Step 2: Create HTML document with optimizations for large content
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
        
        // ============================================
        // Step 3: Get browser and create page
        // ============================================
        const browserStart = Date.now();
        const browser = await getBrowser();
        page = await browser.newPage();
        console.log(`[convertDocxToPdfNode] Browser ready: ${Date.now() - browserStart}ms`);
        
        // ============================================
        // Step 4: Optimize page for large files
        // ============================================
        
        // 🔥 For large files, allow images to load
        if (fileSizeMB > 20) {
            // Allow images for large documents
            await page.setRequestInterception(true);
            page.on('request', (req) => {
                const resourceType = req.resourceType();
                if (['stylesheet', 'font', 'media', 'websocket'].includes(resourceType)) {
                    req.abort();
                } else {
                    req.continue();
                }
            });
        } else {
            // Block all unnecessary resources for smaller files
            await page.setRequestInterception(true);
            page.on('request', (req) => {
                const resourceType = req.resourceType();
                if (['image', 'stylesheet', 'font', 'media', 'websocket'].includes(resourceType)) {
                    req.abort();
                } else {
                    req.continue();
                }
            });
        }
        
        // Disable JavaScript for faster rendering
        await page.setJavaScriptEnabled(false);
        
        // Set viewport
        await page.setViewport({ width: 800, height: 600 });
        
        // ============================================
        // Step 5: Set content with dynamic timeout
        // ============================================
        const contentStart = Date.now();
        console.log('[convertDocxToPdfNode] Setting page content...');
        
        await page.setContent(fullHtml, { 
            waitUntil: 'domcontentloaded',
            timeout: dynamicTimeout 
        });
        console.log(`[convertDocxToPdfNode] Content set: ${Date.now() - contentStart}ms`);
        
        // ============================================
        // Step 6: Generate PDF with dynamic timeout
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
        console.log(`[convertDocxToPdfNode] ✅ Total time: ${totalTime}ms (${Math.round(totalTime / 1000)} seconds)`);
        
        return outputPath;
        
    } catch (error) {
        const totalTime = Date.now() - startTime;
        console.error(`[convertDocxToPdfNode] ❌ Failed after ${totalTime}ms:`, error.message);
        throw new Error(`DOCX to PDF conversion failed: ${error.message}`);
        
    } finally {
        // Always close the page (but keep browser open)
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
 * Convert multiple DOCX files to PDF in sequence (for large files)
 * 🔥 Changed to sequential for large files to avoid memory issues
 */
async function convertMultipleDocxToPdf(docxPaths) {
    console.log(`[convertMultipleDocxToPdf] Converting ${docxPaths.length} files...`);
    const startTime = Date.now();
    
    // Pre-warm the browser
    await getBrowser();
    
    const results = [];
    
    // 🔥 Convert sequentially for large files (prevents memory overflow)
    for (const docxPath of docxPaths) {
        try {
            const result = await convertDocxToPdfNode(docxPath);
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
 * Gracefully close browser (call on server shutdown)
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
 * Pre-warm browser (call on server start)
 */
async function warmupBrowser() {
    try {
        console.log('[warmupBrowser] Pre-warming browser for large file conversion...');
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