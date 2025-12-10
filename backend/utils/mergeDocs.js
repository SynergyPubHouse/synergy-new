const PDFMerger = require("pdf-merger-js"); // Ensure you have this package installed
const { PythonShell } = require('python-shell');
const { uploadFile } = require("./googleDrive"); // Import the Google Drive upload function
const fs = require("fs").promises; // Use promises for file system operations
const path = require("path");

// Helper to convert DOCX to PDF using Python
async function convertDocxToPdfPython(docxPath) {
	return new Promise((resolve, reject) => {
		const outputPdf = docxPath.replace(/\.docx?$/, '.pdf');
		PythonShell.run(
			path.join(__dirname, 'convertToPdf.py'),
			{ args: [docxPath, outputPdf] },
			function (err) {
				if (err) return reject(err);
				resolve(outputPdf);
			}
		);
	});
}

const mergeDocs = async (files, formData) => {
	const merger = new PDFMerger();

	// Create a temporary PDF for the table
	const tablePdfPath = await createTablePdf(formData);
	await merger.add(tablePdfPath); // Add the table PDF

	// Convert DOCX to PDF using Python, add PDFs
	for (const file of files) {
		let pdfFilePath = file;
		if (file.endsWith('.doc') || file.endsWith('.docx')) {
			pdfFilePath = await convertDocxToPdfPython(file);
		}
		await merger.add(pdfFilePath); // Add the converted PDF
	}

	const mergedFilePath = `uploads/merged_${Date.now()}.pdf`; // Specify the output path
	await merger.save(mergedFilePath); // Save the merged PDF

	// Upload the merged PDF to Google Drive
	const { webViewLink } = await uploadFile(
		mergedFilePath,
		`merged_${Date.now()}.pdf`
	);

	// Clean up temporary files
	await fs.unlink(tablePdfPath); // Remove the temporary table PDF
	for (const file of files) {
		if (file.endsWith('.doc') || file.endsWith('.docx')) {
			const pdfFilePath = file.replace(/\.docx?$/, '.pdf');
			await fs.unlink(pdfFilePath).catch(() => {}); // Remove the converted PDF files
		}
	}

	return webViewLink; // Return the Google Drive link
};

// Function to create a PDF with the table data
const createTablePdf = async (formData, manuscriptId = null) => {
    const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // US Letter size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const margin = 50;
    let currentY = page.getHeight() - margin;

    console.log('[createTablePdf] Creating table PDF with form data...');

    // 🔥 Helper function to sanitize text for PDF (remove special characters)
    const sanitizeText = (text) => {
        if (!text) return "";
        if (typeof text !== 'string') {
            text = String(text);
        }
        return text
            .replace(/\r\n/g, ' ')           // Windows line endings
            .replace(/\r/g, ' ')              // Carriage returns
            .replace(/\n/g, ' ')              // Newlines
            .replace(/\t/g, ' ')              // Tabs
            .replace(/[\x00-\x1F\x7F]/g, '')  // All control characters
            .replace(/\s+/g, ' ')             // Multiple spaces to single space
            .trim();
    };

    // 🔥 Safely get and sanitize values
    const safeGet = (value, fallback = '', maxLength = null) => {
        if (value === null || value === undefined) return fallback;
        let result = sanitizeText(String(value));
        if (maxLength && result.length > maxLength) {
            result = result.substring(0, maxLength) + '...';
        }
        return result;
    };

    // Draw title
    page.drawText("Manuscript Submission Details", {
        x: margin,
        y: currentY,
        size: 18,
        font: boldFont,
        color: rgb(0, 0, 0),
    });
    currentY -= 40;

    // 🔥 Updated drawRow function with error handling
    const drawRow = (label, value) => {
        try {
            // Sanitize both label and value
            const sanitizedLabel = sanitizeText(label) || 'Unknown';
            let sanitizedValue = '';

            // Handle different value types
            if (Array.isArray(value)) {
                sanitizedValue = value.map(v => sanitizeText(String(v))).join(", ");
            } else if (typeof value === 'object' && value !== null) {
                sanitizedValue = sanitizeText(JSON.stringify(value));
            } else {
                sanitizedValue = sanitizeText(value);
            }

            // Truncate if too long (to prevent overflow)
            const maxLength = 80;
            if (sanitizedValue.length > maxLength) {
                sanitizedValue = sanitizedValue.substring(0, maxLength) + '...';
            }

            const text = `${sanitizedLabel}: ${sanitizedValue}`;
            
            page.drawText(text, {
                x: margin,
                y: currentY,
                size: 12,
                font: font,
                color: rgb(0, 0, 0),
            });
            currentY -= 20;
        } catch (error) {
            console.error(`[createTablePdf] Error drawing row for ${label}:`, error);
            // Skip this row if error occurs
            currentY -= 20;
        }
    };

    // 🔥 Draw each form field with safe values
    drawRow("Type", safeGet(formData.type));
    drawRow("Title", safeGet(formData.title, '', 100));
    
    // 🔥 Handle authors properly
    let authorsText = '';
    if (formData.authorNamesForPdf) {
        authorsText = safeGet(formData.authorNamesForPdf);
    } else if (formData.authorsForPdf) {
        try {
            const authorsArray = typeof formData.authorsForPdf === 'string' 
                ? JSON.parse(formData.authorsForPdf) 
                : formData.authorsForPdf;
            authorsText = authorsArray.map(a => {
                const name = a.fullName || `${a.firstName || ''} ${a.lastName || ''}`.trim();
                return sanitizeText(name);
            }).join(", ");
        } catch (e) {
            console.error('[createTablePdf] Error parsing authorsForPdf:', e);
        }
    } else if (formData.authorsData) {
        try {
            const authorsArray = typeof formData.authorsData === 'string' 
                ? JSON.parse(formData.authorsData) 
                : formData.authorsData;
            authorsText = authorsArray.map(a => {
                const name = `${a.firstName || ''} ${a.lastName || ''}`.trim();
                return sanitizeText(name);
            }).join(", ");
        } catch (e) {
            console.error('[createTablePdf] Error parsing authorsData:', e);
        }
    } else if (Array.isArray(formData.authors)) {
        // Handle old format where authors might be ObjectIds or objects
        authorsText = formData.authors.map(a => {
            if (typeof a === 'string') return a;
            if (a.authorId) return sanitizeText(a.authorId);
            if (a.firstName) return sanitizeText(`${a.firstName} ${a.lastName || ''}`);
            return '';
        }).filter(Boolean).join(", ");
    }
    drawRow("Authors", authorsText || 'Not specified');

    // 🔥 Handle corresponding author
    let correspondingText = '';
    if (formData.correspondingNamesForPdf) {
        correspondingText = safeGet(formData.correspondingNamesForPdf);
    } else if (formData.correspondingAuthorsForPdf) {
        try {
            const corrArray = typeof formData.correspondingAuthorsForPdf === 'string'
                ? JSON.parse(formData.correspondingAuthorsForPdf)
                : formData.correspondingAuthorsForPdf;
            correspondingText = corrArray.map(a => {
                const name = a.fullName || `${a.firstName || ''} ${a.lastName || ''}`.trim();
                const email = a.email ? ` (${a.email})` : '';
                return sanitizeText(`${name}${email}`);
            }).join(", ");
        } catch (e) {
            console.error('[createTablePdf] Error parsing correspondingAuthorsForPdf:', e);
        }
    }
    if (correspondingText) {
        drawRow("Corresponding Author", correspondingText);
    }

    drawRow("Keywords", safeGet(formData.keywords, '', 150));
    drawRow("Abstract", safeGet(formData.abstract, '', 200));
    
    // 🔥 Handle classification (could be array or string)
    let classificationText = '';
    if (Array.isArray(formData.classification)) {
        classificationText = formData.classification.map(c => sanitizeText(c)).join(", ");
    } else {
        classificationText = safeGet(formData.classification);
    }
    drawRow("Classification", classificationText);
    
    drawRow("Additional Info", safeGet(formData.additionalInfo, '', 100));
    drawRow("Comments", safeGet(formData.comments, '', 100));
    drawRow("Funding", safeGet(formData.funding));
    
    // 🔥 Handle billing info if funding is Yes
    if (formData.funding === "Yes" && formData.billingInfo) {
        let billingInfo = formData.billingInfo;
        if (typeof billingInfo === 'string') {
            try {
                billingInfo = JSON.parse(billingInfo);
            } catch (e) {
                billingInfo = {};
            }
        }
        if (billingInfo.findFunder) {
            drawRow("Funder", safeGet(billingInfo.findFunder));
        }
        if (billingInfo.awardNumber) {
            drawRow("Award Number", safeGet(billingInfo.awardNumber));
        }
        if (billingInfo.grantRecipient) {
            drawRow("Grant Recipient", safeGet(billingInfo.grantRecipient));
        }
    }
    
    drawRow("Submission Date", new Date().toLocaleString());

    // 🔥 Save to temp directory instead of uploads folder
    const tableFileName = manuscriptId ? `table_${manuscriptId}.pdf` : `table_${Date.now()}.pdf`;
    const tablePdfPath = path.join(os.tmpdir(), tableFileName);
    
    const pdfBytes = await pdfDoc.save();
    await fs.writeFile(tablePdfPath, pdfBytes);

    console.log('[createTablePdf] Table PDF created:', tablePdfPath);
    return tablePdfPath;
};
module.exports = mergeDocs;
