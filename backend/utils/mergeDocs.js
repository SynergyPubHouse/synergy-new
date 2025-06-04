const PDFMerger = require("pdf-merger-js"); // Ensure you have this package installed
const { convertToPdf } = require("./pdfUtils"); // Import the PDF conversion utility
const { uploadFile } = require("./googleDrive"); // Import the Google Drive upload function
const fs = require("fs").promises; // Use promises for file system operations

const mergeDocs = async (files, formData) => {
	const merger = new PDFMerger();

	// Create a temporary PDF for the table
	const tablePdfPath = await createTablePdf(formData);
	await merger.add(tablePdfPath); // Add the table PDF

	// Convert and add each DOCX file to the merger
	for (const file of files) {
		const pdfFilePath = await convertToPdf(file); // Convert DOCX to PDF
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
		const pdfFilePath = await convertToPdf(file);
		await fs.unlink(pdfFilePath); // Remove the converted PDF files
	}

	return webViewLink; // Return the Google Drive link
};

// Function to create a PDF with the table data
const createTablePdf = async (formData) => {
	// Implement the logic to create a PDF with the table data
	// This can be similar to the createMergedPDFWithTable function you already have
	// For simplicity, let's assume it creates a PDF and returns the file path
	const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");
	const pdfDoc = await PDFDocument.create();
	const page = pdfDoc.addPage([612, 792]); // US Letter size
	const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
	const margin = 50;
	let currentY = page.getHeight() - margin;

	// Draw title
	page.drawText("Manuscript Submission Details", {
		x: margin,
		y: currentY,
		size: 18,
		font: font,
		color: rgb(0, 0, 0),
	});
	currentY -= 40;

	// Draw table rows
	const drawRow = (label, value) => {
		page.drawText(`${label}: ${value}`, {
			x: margin,
			y: currentY,
			size: 12,
			font: font,
			color: rgb(0, 0, 0),
		});
		currentY -= 20; // Move down for the next row
	};

	// Draw each form field
	drawRow("Type", formData.type);
	drawRow("Title", formData.title);
	drawRow("Authors", formData.authors.map((a) => a.authorId).join(", "));
	drawRow("Keywords", formData.keywords);
	drawRow("Abstract", formData.abstract);
	drawRow("Classification", formData.classification);
	drawRow("Comments", formData.comments);
	drawRow("Funding", formData.funding);
	drawRow("Submission Date", new Date().toLocaleString());

	const tablePdfPath = `uploads/table_${Date.now()}.pdf`;
	const pdfBytes = await pdfDoc.save();
	await fs.writeFile(tablePdfPath, pdfBytes); // Save the table PDF

	return tablePdfPath; // Return the path of the created table PDF
};

module.exports = mergeDocs;
