const mammoth = require('mammoth');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

async function convertDocxToPdfNode(docxPath, outputPath = null) {
    let browser = null;
    
    try {
        // Generate output path if not provided
        if (!outputPath) {
            outputPath = docxPath.replace(/\.docx?$/i, '.pdf');
        }
        
        console.log(`[convertDocxToPdfNode] Converting ${docxPath} to ${outputPath}`);
        
        // Step 1: Convert DOCX to HTML using mammoth
        const result = await mammoth.convertToHtml({ path: docxPath });
        const html = result.value;
        
        if (result.messages.length > 0) {
            console.log('[convertDocxToPdfNode] Mammoth messages:', result.messages);
        }
        
        // Step 2: Create a complete HTML document
        const fullHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: 'Times New Roman', serif;
            font-size: 12pt;
            line-height: 1.6;
            margin: 1in;
            color: #000;
        }
        h1, h2, h3, h4, h5, h6 {
            font-weight: bold;
            margin-top: 1em;
            margin-bottom: 0.5em;
        }
        h1 { font-size: 16pt; }
        h2 { font-size: 14pt; }
        h3 { font-size: 13pt; }
        p {
            margin-bottom: 1em;
            text-align: justify;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 1em 0;
        }
        table, th, td {
            border: 1px solid #000;
        }
        th, td {
            padding: 8px;
            text-align: left;
        }
        ul, ol {
            margin: 1em 0;
            padding-left: 2em;
        }
        li {
            margin-bottom: 0.5em;
        }
    </style>
</head>
<body>
    ${html}
</body>
</html>`;
        
        console.log('[convertDocxToPdfNode] Launching Puppeteer...');
        
        // Determine cache path based on environment
        const cacheDirectory = process.env.PUPPETEER_CACHE_DIR || 
                              (process.env.RENDER ? '/opt/render/project/.cache/puppeteer' : 
                               path.join(os.homedir(), '.cache', 'puppeteer'));
        
        // Set environment variable
        process.env.PUPPETEER_CACHE_DIR = cacheDirectory;
        
        // Launch options optimized for server environment
        const launchOptions = {
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
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process',
                '--disable-blink-features=AutomationControlled'
            ],
            ignoreDefaultArgs: ['--disable-extensions']
        };
        
        // Try to launch browser
        try {
            browser = await puppeteer.launch(launchOptions);
        } catch (launchError) {
            console.error('First launch attempt failed:', launchError.message);
            console.log('Attempting with alternate configuration...');
            
            // Fallback launch options
            launchOptions.executablePath = puppeteer.executablePath();
            browser = await puppeteer.launch(launchOptions);
        }
        
        const page = await browser.newPage();
        
        // Set viewport
        await page.setViewport({ width: 1920, height: 1080 });
        
        // Set content with longer timeout
        await page.setContent(fullHtml, { 
            waitUntil: ['domcontentloaded', 'networkidle0'],
            timeout: 60000 
        });
        
        // Wait a bit for rendering
        await page.evaluateHandle('document.fonts.ready');
        
        // Generate PDF
        await page.pdf({
            path: outputPath,
            format: 'A4',
            margin: {
                top: '1in',
                right: '1in',
                bottom: '1in',
                left: '1in'
            },
            printBackground: true,
            preferCSSPageSize: false
        });
        
        console.log(`[convertDocxToPdfNode] PDF created successfully: ${outputPath}`);
        
        // Verify the PDF was created
        const stats = await fs.stat(outputPath);
        if (stats.size < 100) {
            throw new Error('Generated PDF is too small (likely empty)');
        }
        
        return outputPath;
        
    } catch (error) {
        console.error('[convertDocxToPdfNode] Detailed error:', error);
        throw new Error(`DOCX to PDF conversion failed: ${error.message}`);
    } finally {
        if (browser) {
            try {
                await browser.close();
            } catch (closeError) {
                console.error('Error closing browser:', closeError);
            }
        }
    }
}

module.exports = { convertDocxToPdfNode };