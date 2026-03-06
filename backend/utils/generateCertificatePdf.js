const fs = require("fs");
const path = require("path");
const os = require("os");
const { PDFDocument, rgb } = require("pdf-lib");
const fontkit = require("@pdf-lib/fontkit");

/**
 * Generate a Certificate of Reviewing PDF for a reviewer.
 *
 * Uses the Reviewer_Certificate.pdf template directly.
 * Uses pdf-lib to mask the placeholders with white boxes
 * and draw the new names and dates using custom fonts.
 *
 * @param {Object} options
 * @param {string} options.reviewerName - Full name of the reviewer
 * @param {Date}   [options.date]       - Date for the certificate (defaults to now)
 * @returns {Promise<Buffer>} PDF file as a Buffer
 */
async function generateCertificatePdf({ reviewerName, date }) {
    const templatePath = path.join(
        __dirname,
        "..",
        "templates",
        "Reviewer_Certificate.pdf"
    );

    if (!fs.existsSync(templatePath)) {
        throw new Error(`Certificate template not found: ${templatePath}`);
    }

    // Format date as "Month, Year" (e.g., "March, 2026")
    const d = date ? new Date(date) : new Date();
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
    ];
    const formattedDate = `${monthNames[d.getMonth()]}, ${d.getFullYear()}`.toUpperCase();

    // Load PDF
    const pdfBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    pdfDoc.registerFontkit(fontkit);

    const page = pdfDoc.getPages()[0];
    const { width } = page.getSize();

    // Load and embed custom fonts
    const alexBrushPath = path.join(__dirname, "..", "templates", "fonts", "AlexBrush-Regular.ttf");
    const petronaPath = path.join(__dirname, "..", "templates", "fonts", "Petrona-Regular.ttf");

    if (!fs.existsSync(alexBrushPath)) throw new Error(`Missing AlexBrush font at ${alexBrushPath}`);
    if (!fs.existsSync(petronaPath)) throw new Error(`Missing Petrona font at ${petronaPath}`);

    const alexBrush = await pdfDoc.embedFont(fs.readFileSync(alexBrushPath));
    const petrona = await pdfDoc.embedFont(fs.readFileSync(petronaPath));

    // ============================================
    // EDIT COORDINATES HERE (PDF origin 0,0 is Bottom-Left)
    // ============================================

    // 1. Cover 'NAME' placeholder
    page.drawRectangle({
        x: 250, y: 191, width: 342, height: 42,
        color: rgb(1, 1, 1), // White
    });

    // 2. Draw Reviewer Name
    const nameSize = 34; // Font size for name
    const nameWidth = alexBrush.widthOfTextAtSize(reviewerName, nameSize);
    const nameX = (width - nameWidth) / 2; // Horizontally center
    page.drawText(reviewerName, {
        x: nameX, y: 195,
        size: nameSize,
        font: alexBrush,
        color: rgb(0.0, 0.29, 0.34), // Teal color
    });

    // 3. Cover 'MONTH, YEAR' placeholder (Top right)
    page.drawRectangle({
        x: 380, y: 510, width: 220, height: 55,
        color: rgb(1, 1, 1), // White
    });

    // 4. Draw Date
    const dateSize = 18; // Font size for date
    page.drawText(formattedDate, {
        x: 410, y: 540,
        size: dateSize,
        font: petrona,
        color: rgb(0.0, 0.29, 0.34),
    });

    // ============================================

    // Save and return buffer
    const modifiedPdfBytes = await pdfDoc.save();
    return Buffer.from(modifiedPdfBytes);
}

module.exports = generateCertificatePdf;
