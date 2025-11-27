const mammoth = require('mammoth');
const puppeteer = require('puppeteer');
const chromium = require('chrome-aws-lambda');
const fs = require('fs').promises;
const path = require('path');
/**
 * Convert DOCX to PDF using Node.js libraries (no external software required)
 * @param {string} docxPath - Path to input DOCX file
 * @param {string} outputPath - Optional output PDF path
 * @returns {Promise<string>} - Path to generated PDF
 */
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
        // Step 2: Create a complete HTML document with basic styling
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
        .center {
            text-align: center;
        }
        .bold {
            font-weight: bold;
        }
        .italic {
            font-style: italic;
        }
    </style>
</head>
<body>
    ${html}
</body>
</html>`;
        // Step 3: Launch Puppeteer and generate PDF
        // Use chrome-aws-lambda only in explicit serverless environments (e.g. AWS Lambda)
        const isServerless =
            !!process.env.AWS_LAMBDA_FUNCTION_NAME ||
            process.env.IS_SERVERLESS === 'true';
        console.log(`[convertDocxToPdfNode] Environment check - NODE_ENV: ${process.env.NODE_ENV}, RENDER: ${process.env.RENDER}, isServerless: ${isServerless}`);
        if (isServerless) {
            console.log('[convertDocxToPdfNode] Using chrome-aws-lambda for serverless environment');
            try {
                const executablePath = await chromium.executablePath;
                if (!executablePath) {
                    throw new Error('chrome-aws-lambda executablePath is empty');
                }
                browser = await puppeteer.launch({
                    headless: true,
                    args: chromium.args,
                    defaultViewport: chromium.defaultViewport,
                    executablePath
                });
            } catch (e) {
                console.warn('[convertDocxToPdfNode] chrome-aws-lambda failed, falling back to regular Puppeteer:', e);
                browser = await puppeteer.launch({
                    headless: true,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-gpu',
                        '--disable-web-security',
                        '--disable-features=VizDisplayCompositor',
                        '--no-first-run',
                        '--no-zygote',
                        '--single-process'
                    ],
                executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
                });
            }
        } else {
            console.log('[convertDocxToPdfNode] Using regular Puppeteer for non-serverless environment');
            browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process'
                ],
                executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
            });
        }
        const page = await browser.newPage();
        await page.setContent(fullHtml, { waitUntil: 'networkidle0', timeout: 0 });
        // Generate PDF with appropriate settings
        await page.pdf({
            path: outputPath,
            format: 'A4',
            margin: {
                top: '1in',
                right: '1in',
                bottom: '1in',
                left: '1in'
            },
            printBackground: true
        });
        console.log(`[convertDocxToPdfNode] PDF created successfully: ${outputPath}`);
        // Verify the PDF was created and has content
        const stats = await fs.stat(outputPath);
        if (stats.size < 100) {
            throw new Error('Generated PDF is too small (likely empty)');
        }
        return outputPath;
    } catch (error) {
        console.error('[convertDocxToPdfNode] Error:', error);
        throw new Error(`DOCX to PDF conversion failed: ${error.message}`);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}
module.exports = { convertDocxToPdfNode };