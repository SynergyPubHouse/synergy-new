// manuscriptController.js
const Manuscript = require("../models/Manuscript");
const multer = require("multer");
const path = require("path");
const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");
const { FileUploadManager } = require("../utils/fileUpload");
const { uploadToSharedFolder } = require("../utils/sharedDriveUpload");
const fs = require("fs").promises;
const User = require("../models/User");
const Reviewer = require("../models/Reviewer");
const mongoose = require("mongoose");
const os = require("os");
const { convertDocxToPdfNode } = require("../utils/convertDocxToPdfNode");
const { PythonShell } = require("python-shell");
const { generateUniqueManuscriptId } = require("../utils/manuscriptIdGenerator");
const fsSync = require("fs"); // Add at the top if not already
// At the top of manuscriptController.js
const { uploadToCloudinary } = require("../utils/cloudinary");

// Configure multer for temporary file upload
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		// Use system temp directory instead of persistent uploads folder
		cb(null, os.tmpdir());
	},
	filename: function (req, file, cb) {
		// Add fieldname to ensure uniqueness
		cb(
			null,
			`temp_${file.fieldname}_${Date.now()}${path.extname(
				file.originalname
			)}`
		);
	},
});

const upload = multer({
	storage: storage,
	limits: { fileSize: 100 * 1024 * 1024 }, // 10MB limit
	fileFilter: (req, file, cb) => {
		const allowedTypes = /docx/;
		const extname = allowedTypes.test(
			path.extname(file.originalname).toLowerCase()
		);
		if (extname) {
			return cb(null, true);
		}
		cb(new Error("Only Word documents (.docx) are allowed!"));
	},
}).fields([
	{ name: "manuscript", maxCount: 1 },
	{ name: "coverLetter", maxCount: 1 },
	{ name: "declaration", maxCount: 1 },
]);

// Helper function to clean up temporary files
async function cleanupFiles(filePaths) {
	for (const filePath of filePaths) {
		try {
			if (filePath) {
				await fs.unlink(filePath);
			}
		} catch (error) {
			console.error(`Error cleaning up file ${filePath}:`, error);
		}
	}
}

// Helper: Check if a file is a valid PDF
function isValidPdf(filePath) {
	try {
		if (!fsSync.existsSync(filePath)) return false;
		const stat = fsSync.statSync(filePath);
		if (stat.size < 100) return false;
		const fd = fsSync.openSync(filePath, "r");
		const buffer = Buffer.alloc(5);
		fsSync.readSync(fd, buffer, 0, 5, 0);
		fsSync.closeSync(fd);
		return buffer.toString() === "%PDF-";
	} catch (e) {
		return false;
	}
}

// Helper: Convert DOCX to PDF using Node.js libraries (no external software required)
async function convertDocxToPdf(docxPath) {
	try {
		console.log(`[convertDocxToPdf] Converting ${docxPath} using Node.js libraries`);
		const outputPdf = await convertDocxToPdfNode(docxPath);
		console.log(`[convertDocxToPdf] PDF created successfully: ${outputPdf}`);
		return outputPdf;
	} catch (error) {
		console.error(`[convertDocxToPdf] Conversion failed: ${error.message}`);
		throw new Error(`DOCX to PDF conversion failed: ${error.message}`);
	}
}

// Helper: Extract text from DOCX using Python (working version)
async function extractTextFromDocx(docxPath) {
	const pythonPath = "python3"; // Use python3 instead of python for macOS compatibility
	return new Promise((resolve, reject) => {
		const scriptPath = path.join(__dirname, "../utils/textExtractor.py");
		const shell = new PythonShell(scriptPath, {
			args: [docxPath],
			pythonPath,
			env: { ...process.env, PYTHONIOENCODING: "utf-8" },
		});
		let output = [];
		let errorOutput = [];
		shell.on("message", (message) => {
			output.push(message);
		});
		shell.on("stderr", (stderr) => {
			console.error("[extractTextFromDocx] PythonShell stderr:", stderr);
			errorOutput.push(stderr);
		});
		shell.on("error", (err) => {
			console.error(
				"[extractTextFromDocx] PythonShell error event:",
				err
			);
		});
		shell.end((err, code, signal) => {
			if (err) {
				console.error(
					"[extractTextFromDocx] PythonShell end error:",
					err
				);
				if (errorOutput.length > 0) {
					console.error(
						"[extractTextFromDocx] PythonShell stderr collected:",
						errorOutput.join("\n")
					);
				}
				return reject(err);
			}
			// Join output and parse JSON
			const finalText = output.join("");
			let parsed;
			try {
				parsed = JSON.parse(finalText);
			} catch (e) {
				console.error(
					"[extractTextFromDocx] Failed to parse JSON:",
					e,
					finalText
				);
				return reject(
					new Error("Failed to parse extracted text as JSON")
				);
			}
			resolve(parsed);
		});
	});
}

// Helper: Create merged PDF with table and documents
async function createMergedPDFWithTable(manuscriptPath, coverLetterPath, declarationPath, formData, manuscriptId = null) {
    try {
        console.log('[createMergedPDFWithTable] Starting merge process...');
        
        // Convert DOCX files to PDF if needed
        const manuscriptPdf = manuscriptPath.endsWith('.pdf') ? manuscriptPath : await convertDocxToPdf(manuscriptPath);
        const coverLetterPdf = coverLetterPath.endsWith('.pdf') ? coverLetterPath : await convertDocxToPdf(coverLetterPath);
        const declarationPdf = declarationPath.endsWith('.pdf') ? declarationPath : await convertDocxToPdf(declarationPath);
        
        // Create table PDF with form data
        const tablePdf = await createTablePdf(formData, manuscriptId);
        
        // Create output path using manuscript ID or timestamp as fallback
        const fileName = manuscriptId ? `manuscript_${manuscriptId}.pdf` : `merged_${Date.now()}.pdf`;
        const outputPath = path.join(os.tmpdir(), fileName);
        
        // Merge all PDFs with line numbering
        await mergePdfs([tablePdf, manuscriptPdf, coverLetterPdf, declarationPdf], outputPath);
        
        // Clean up temporary table PDF
        try {
            await fs.unlink(tablePdf);
        } catch (e) {
            console.warn('[createMergedPDFWithTable] Failed to cleanup table PDF:', e.message);
        }
        
        console.log('[createMergedPDFWithTable] Merge completed successfully');
        
        return {
            localPath: outputPath,
            success: true
        };
        
    } catch (error) {
        console.error('[createMergedPDFWithTable] Error:', error);
        throw new Error(`Merged PDF creation failed: ${error.message}`);
    }
}

// Helper: Create table PDF with form data
async function createTablePdf(formData, manuscriptId = null) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // US Letter size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const margin = 50;
    let currentY = page.getHeight() - margin;

    // Draw title
    page.drawText("Manuscript Submission Details", {
        x: margin,
        y: currentY,
        size: 18,
        font: boldFont,
        color: rgb(0, 0, 0),
    });
    currentY -= 50;

    // Table configuration
    const tableWidth = page.getWidth() - 2 * margin;
    const labelWidth = tableWidth * 0.3; // 30% for labels
    const valueWidth = tableWidth * 0.7; // 70% for values
    const rowHeight = 25;
    const cellPadding = 8;

    // Helper function to draw a table row with better height management
    const drawTableRow = (label, value, isHeader = false) => {
        const displayValue = Array.isArray(value) ? value.join(", ") : (value || "");
        const useFont = isHeader ? boldFont : font;
        const fontSize = isHeader ? 14 : 11;
        
        // Calculate dynamic row height based on content
        const maxValueWidth = valueWidth - 2 * cellPadding;
        let valueText = displayValue.toString();
        let actualRowHeight = rowHeight;
        
        // Check if text needs wrapping and calculate required height
        if (font.widthOfTextAtSize(valueText, fontSize) > maxValueWidth) {
            const words = valueText.split(' ');
            let lines = 1;
            let line = '';
            
            for (const word of words) {
                const testLine = line + (line ? ' ' : '') + word;
                if (font.widthOfTextAtSize(testLine, fontSize) > maxValueWidth && line) {
                    lines++;
                    line = word;
                } else {
                    line = testLine;
                }
            }
            // Limit to maximum 3 lines and calculate height accordingly
            const maxLines = Math.min(lines, 3);
            actualRowHeight = Math.max(rowHeight, maxLines * 14 + 10); // 14px per line + padding
        }
        
        // Check if we have enough space on the page
        if (currentY - actualRowHeight < 50) { // 50px bottom margin
            console.log(`[createTablePdf] Truncating content for ${label} to fit on page`);
            // Truncate the value to fit in standard row height
            const maxChars = Math.floor(maxValueWidth / (fontSize * 0.6)); // Approximate chars per line
            if (valueText.length > maxChars) {
                valueText = valueText.substring(0, maxChars - 3) + '...';
            }
            actualRowHeight = rowHeight;
        }
        
        // Draw row background
        const bgColor = isHeader ? rgb(0.9, 0.9, 0.9) : rgb(0.98, 0.98, 0.98);
        page.drawRectangle({
            x: margin,
            y: currentY - actualRowHeight + 5,
            width: tableWidth,
            height: actualRowHeight,
            color: bgColor,
        });

        // Draw borders
        page.drawRectangle({
            x: margin,
            y: currentY - actualRowHeight + 5,
            width: tableWidth,
            height: actualRowHeight,
            borderColor: rgb(0.7, 0.7, 0.7),
            borderWidth: 1,
        });

        // Draw vertical separator
        page.drawLine({
            start: { x: margin + labelWidth, y: currentY - actualRowHeight + 5 },
            end: { x: margin + labelWidth, y: currentY + 5 },
            thickness: 1,
            color: rgb(0.7, 0.7, 0.7),
        });

        // Draw label (left column)
        page.drawText(label, {
            x: margin + cellPadding,
            y: currentY - actualRowHeight / 2 - 3,
            size: fontSize,
            font: useFont,
            color: rgb(0, 0, 0),
        });

        // Draw value (right column) with proper text wrapping
        
        if (font.widthOfTextAtSize(valueText, fontSize) > maxValueWidth) {
            // Text needs wrapping
            const words = valueText.split(' ');
            let lines = [];
            let currentLine = '';
            
            for (const word of words) {
                const testLine = currentLine + (currentLine ? ' ' : '') + word;
                if (font.widthOfTextAtSize(testLine, fontSize) > maxValueWidth && currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            }
            if (currentLine) {
                lines.push(currentLine);
            }
            
            // Limit to maximum 3 lines to prevent overflow
            if (lines.length > 3) {
                lines = lines.slice(0, 2);
                lines.push(lines[1].substring(0, Math.floor(maxValueWidth / (fontSize * 0.6)) - 3) + '...');
            }
            
            // Draw each line
            lines.forEach((line, index) => {
                page.drawText(line, {
                    x: margin + labelWidth + cellPadding,
                    y: currentY - actualRowHeight / 2 - 3 + (lines.length - 1 - index) * 12,
                    size: fontSize,
                    font: font,
                    color: rgb(0, 0, 0),
                });
            });
        } else {
            // Text fits in one line
            page.drawText(valueText, {
                x: margin + labelWidth + cellPadding,
                y: currentY - actualRowHeight / 2 - 3,
                size: fontSize,
                font: font,
                color: rgb(0, 0, 0),
            });
        }

        currentY -= actualRowHeight;
    };

    // Draw table rows with content truncation to fit on one page
    drawTableRow("Article Type", formData.type);
    drawTableRow("Title", formData.title ? formData.title.substring(0, 200) : ''); // Limit title length
    drawTableRow("Keywords", formData.keywords ? formData.keywords.substring(0, 150) : ''); // Limit keywords length
    
    // Truncate abstract to ensure it fits on page 1
    let abstractText = formData.abstract || '';
    if (abstractText.length > 300) {
        abstractText = abstractText.substring(0, 300) + '...';
    }
    drawTableRow("Abstract", abstractText);
    
    drawTableRow("Classification", formData.classification);
    drawTableRow("Additional Information", formData.additionalInfo ? formData.additionalInfo.substring(0, 100) : '');
    drawTableRow("Comments", formData.comments ? formData.comments.substring(0, 100) : '');
    drawTableRow("Funding", formData.funding);
    
    // Add billing information if funding is "Yes"
    if (formData.funding === "Yes" && formData.billingInfo) {
        drawTableRow("Award Number", formData.billingInfo.awardNumber || '');
        drawTableRow("Grant Recipient", formData.billingInfo.grantRecipient || '');
    }
    
    drawTableRow("Submission Date", new Date().toLocaleString());

    const tableFileName = manuscriptId ? `table_${manuscriptId}.pdf` : `table_${Date.now()}.pdf`;
    const tablePdfPath = path.join(os.tmpdir(), tableFileName);
    const pdfBytes = await pdfDoc.save();
    await fs.writeFile(tablePdfPath, pdfBytes);

    return tablePdfPath;
}

// Helper: Merge multiple PDFs (using pdf-lib)
async function mergePdfs(pdfPaths, outputPath) {
    const mergedPdf = await PDFDocument.create();
    
    // Merge all PDFs first
    for (const pdfPath of pdfPaths) {
        const pdfBytes = await fs.readFile(pdfPath);
        const pdf = await PDFDocument.load(pdfBytes);
        const copiedPages = await mergedPdf.copyPages(
            pdf,
            pdf.getPageIndices()
        );
        copiedPages.forEach((page) => mergedPdf.addPage(page));
    }
    
    // Add line numbering starting from page 2 (skip first page which is the table)
    const pages = mergedPdf.getPages();
    const font = await mergedPdf.embedFont(StandardFonts.Helvetica);
    
    for (let pageIndex = 1; pageIndex < pages.length; pageIndex++) { // Start from index 1 to skip first page
        const page = pages[pageIndex];
        const { width, height } = page.getSize();
        
        // Calculate number of lines based on page height
        const lineHeight = 14; // adjust as needed to match your sample
        const topMargin = 72; // 1 inch from top
        const bottomMargin = 72; // 1 inch from bottom
        const leftMargin = 20; // place numbers in left margin
        const usableHeight = height - topMargin - bottomMargin;
        const numberOfLines = Math.floor(usableHeight / lineHeight);

        // Per-page line numbering starting at 1
        for (let i = 0; i < numberOfLines; i++) {
            const yPosition = height - topMargin - (i * lineHeight);
            const lineNum = String(i + 1);
            const textWidth = font.widthOfTextAtSize(lineNum, 9);

            page.drawText(lineNum, {
                x: leftMargin - textWidth, // right-align to the left margin
                y: yPosition - 10,
                size: 9,
                font: font,
                color: rgb(0.2, 0.2, 0.2)
            });
        }

        // Add page number at bottom center (start from page 1 for display)
        page.drawText(`Page ${pageIndex}`, {
            x: width / 2 - 20,
            y: bottomMargin / 2,
            size: 9,
            font: font,
            color: rgb(0.3, 0.3, 0.3)
        });
    }

    const mergedPdfBytes = await mergedPdf.save();
    await fs.writeFile(outputPath, mergedPdfBytes);
    return outputPath;
}

exports.createManuscript = async (req, res) => {
    let tempFiles = [];
    try {
        upload(req, res, async (err) => {
            if (err) {
                console.error("[createManuscript] Multer error:", err);
                return res.status(400).json({ message: err.message });
            }

            // Check if all required files are present
            if (
                !req.files["manuscript"] ||
                !req.files["coverLetter"] ||
                !req.files["declaration"]
            ) {
                console.error("[createManuscript] Missing required files.");
                return res.status(400).json({
                    success: false,
                    message:
                        "All three files (manuscript, cover letter, and declaration) are required",
                });
            }

            // Track all temporary files for cleanup
            tempFiles = [
                req.files["manuscript"][0].path,
                req.files["coverLetter"][0].path,
                req.files["declaration"][0].path,
            ];

            // Convert additionalInfo array to string if it exists
            if (req.body.additionalInfo) {
                try {
                    const additionalInfoArray = JSON.parse(
                        req.body.additionalInfo
                    );
                    req.body.additionalInfo = additionalInfoArray.join(", ");
                } catch (e) {
                    console.error(
                        "[createManuscript] Error parsing additionalInfo:",
                        e
                    );
                }
            }

            // Handle authors and roles
            const authors = req.body.authors
                ? JSON.parse(req.body.authors)
                : [];
            const correspondingAuthorId = req.body.correspondingAuthorId;

            const isEditorSubmitter = !!req.editor;
            if (!isEditorSubmitter) {
                if (!authors.includes(req.user._id.toString())) {
                    authors.unshift(req.user._id.toString());
                }
            } else {
                if (!Array.isArray(authors) || authors.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: "At least one author is required when an editor submits on behalf of an author",
                    });
                }
                if (!correspondingAuthorId) {
                    return res.status(400).json({
                        success: false,
                        message: "correspondingAuthorId is required when an editor submits on behalf of an author",
                    });
                }
            }

            // Validate and convert author IDs to ObjectIds
            const authorObjectIds = [];
            for (const id of authors) {
                try {
                    if (mongoose.Types.ObjectId.isValid(id)) {
                        authorObjectIds.push(new mongoose.Types.ObjectId(id));
                    } else {
                        throw new Error(`Invalid author ID: ${id}`);
                    }
                } catch (error) {
                    console.error(
                        "[createManuscript] Error converting author ID:",
                        error
                    );
                    return res.status(400).json({
                        success: false,
                        message: `Invalid author ID format: ${id}`,
                    });
                }
            }

            // Validate and convert corresponding author ID
            let correspondingAuthorObjectId;
            try {
                if (
                    mongoose.Types.ObjectId.isValid(
                        correspondingAuthorId || (req.user && req.user._id)
                    )
                ) {
                    correspondingAuthorObjectId = new mongoose.Types.ObjectId(
                        correspondingAuthorId || (req.user && req.user._id)
                    );
                } else {
                    throw new Error(
                        `Invalid corresponding author ID: ${
                            correspondingAuthorId || (req.user && req.user._id)
                        }`
                    );
                }
            } catch (error) {
                console.error(
                    "[createManuscript] Error converting corresponding author ID:",
                    error
                );
                return res.status(400).json({
                    success: false,
                    message: `Invalid corresponding author ID format: ${
                        correspondingAuthorId || (req.user && req.user._id)
                    }`,
                });
            }

            // Extract text from all three uploaded DOCX files
            const manuscriptPath = req.files["manuscript"][0].path;
            const coverLetterPath = req.files["coverLetter"][0].path;
            const declarationPath = req.files["declaration"][0].path;
            let manuscriptText = "",
                coverLetterText = "",
                declarationText = "";
            let manuscriptTitle = "",
                manuscriptAbstract = "",
                manuscriptKeywords = "";
            try {
                const result = await extractTextFromDocx(manuscriptPath);
                manuscriptText = result.full_text || "";
                manuscriptTitle = result.title || "";
                manuscriptAbstract = result.abstract || "";
                manuscriptKeywords = result.keywords || "";
                console.log(
                    "[createManuscript] Extracted manuscript title:",
                    manuscriptTitle
                );
                console.log(
                    "[createManuscript] Extracted manuscript abstract:",
                    manuscriptAbstract
                );
                console.log(
                    "[createManuscript] Extracted manuscript keywords:",
                    manuscriptKeywords
                );
            } catch (err) {
                console.error(
                    "[createManuscript] Manuscript text extraction failed:",
                    err
                );
                manuscriptText = "";
            }
            try {
                const result = await extractTextFromDocx(coverLetterPath);
                coverLetterText = result.full_text || "";
            } catch (err) {
                console.error(
                    "[createManuscript] Cover letter text extraction failed:",
                    err
                );
                coverLetterText = "";
            }
            try {
                const result = await extractTextFromDocx(declarationPath);
                declarationText = result.full_text || "";
            } catch (err) {
                console.error(
                    "[createManuscript] Declaration text extraction failed:",
                    err
                );
                declarationText = "";
            }
            // Convert all DOCX files to PDF before proceeding
            let manuscriptPdfPath, coverLetterPdfPath, declarationPdfPath;
            try {
                manuscriptPdfPath = await convertDocxToPdf(manuscriptPath);
                if (!isValidPdf(manuscriptPdfPath)) {
                    console.error(
                        "[createManuscript] Manuscript PDF is invalid!"
                    );
                    return res.status(500).json({
                        success: false,
                        message: "Manuscript PDF is invalid after conversion.",
                    });
                }
                coverLetterPdfPath = await convertDocxToPdf(coverLetterPath);
                if (!isValidPdf(coverLetterPdfPath)) {
                    console.error(
                        "[createManuscript] Cover letter PDF is invalid!"
                    );
                    return res.status(500).json({
                        success: false,
                        message:
                            "Cover letter PDF is invalid after conversion.",
                    });
                }
                declarationPdfPath = await convertDocxToPdf(declarationPath);
                if (!isValidPdf(declarationPdfPath)) {
                    console.error(
                        "[createManuscript] Declaration PDF is invalid!"
                    );
                    return res.status(500).json({
                        success: false,
                        message: "Declaration PDF is invalid after conversion.",
                    });
                }
            } catch (err) {
                console.error(
                    "[createManuscript] DOCX to PDF conversion failed:",
                    err
                );
                return res.status(500).json({
                    success: false,
                    message: "DOCX to PDF conversion failed.",
                });
            }

            // Generate custom manuscript ID first using title
            let customManuscriptId;
            try {
                const manuscriptTitle = req.body.title || "Untitled";
                customManuscriptId = await generateUniqueManuscriptId(manuscriptTitle);
                console.log("[createManuscript] Generated custom ID:", customManuscriptId);
            } catch (err) {
                console.error("[createManuscript] Custom ID generation failed:", err);
                return res.status(500).json({
                    success: false,
                    message: "Manuscript ID generation failed.",
                });
            }

            // Upload individual PDFs to Cloudinary with custom filenames
            let manuscriptUpload, coverLetterUpload, declarationUpload;
            try {
                console.log(
                    "[createManuscript] Uploading individual files to Cloudinary..."
                );

                [manuscriptUpload, coverLetterUpload, declarationUpload] = await Promise.all([
                    uploadToCloudinary(
                        manuscriptPdfPath,
                        "manuscripts", // Folder in Cloudinary
                        "raw", // Resource type
                        `manuscript_${customManuscriptId}` // Custom filename
                    ),
                    uploadToCloudinary(
                        coverLetterPdfPath,
                        "coverLetters", // Folder in Cloudinary
                        "raw", // Resource type
                        `cover_letter_${customManuscriptId}` // Custom filename
                    ),
                    uploadToCloudinary(
                        declarationPdfPath,
                        "declarations", // Folder in Cloudinary
                        "raw", // Resource type
                        `declaration_${customManuscriptId}` // Custom filename
                    ),
                ]);

                console.log(
                    "[createManuscript] Individual files uploaded successfully to Cloudinary"
                );
            } catch (err) {
                console.error(
                    "[createManuscript] Cloudinary upload failed:",
                    err
                );
                return res.status(500).json({
                    success: false,
                    message: "File upload to Cloudinary failed.",
                });
            }

            // Create and save manuscript first to get the ID
            const manuscriptData = {
                ...req.body,
                customId: customManuscriptId,
                authors: authorObjectIds,
                correspondingAuthor: correspondingAuthorObjectId,
                manuscriptFile: manuscriptUpload.secure_url,
                coverLetterFile: coverLetterUpload.secure_url,
                declarationFile: declarationUpload.secure_url,
                status: "Saved",
                extractedText: manuscriptText,
                coverLetterText: coverLetterText,
                declarationText: declarationText,
                extractedTitle: manuscriptTitle,
                extractedAbstract: manuscriptAbstract,
                extractedKeywords: manuscriptKeywords,
            };

            let manuscript;
            try {
                manuscript = new Manuscript(manuscriptData);
                await manuscript.save();
                console.log("[createManuscript] Manuscript saved with custom ID:", customManuscriptId);
            } catch (err) {
                console.error(
                    "[createManuscript] Manuscript save failed:",
                    err
                );
                return res.status(500).json({
                    success: false,
                    message: "Manuscript save failed.",
                });
            }

            // Now create merged PDF with the manuscript ID
            let mergedPdfResult, mergedUpload;
            try {
                mergedPdfResult = await createMergedPDFWithTable(
                    manuscriptPdfPath,
                    coverLetterPdfPath,
                    declarationPdfPath,
                    {
                        ...req.body,
                        authors: authorObjectIds,
                        correspondingAuthor: correspondingAuthorObjectId,
                    },
                    customManuscriptId // Pass the custom manuscript ID for naming
                );
                // Track the merged PDF for cleanup
                tempFiles.push(mergedPdfResult.localPath);

                // Upload merged PDF to Cloudinary with custom filename
                mergedUpload = await uploadToCloudinary(
                    mergedPdfResult.localPath,
                    "merged_manuscripts", // Folder in Cloudinary
                    "raw", // Use 'raw' for PDF files to get a direct link
                    `manuscript_${customManuscriptId}` // Custom filename using manuscript ID
                );

                // Update manuscript with merged PDF URL
                manuscript.mergedFileUrl = mergedUpload.secure_url;
                await manuscript.save();

                console.log("[createManuscript] Merged PDF created and uploaded successfully");
            } catch (err) {
                console.error(
                    "[createManuscript] Merged PDF creation failed:",
                    err
                );
                return res.status(500).json({
                    success: false,
                    message: "Merged PDF creation failed.",
                });
            }

            // Update all authors' manuscripts array and roles
            try {
                for (const authorId of authors) {
                    await User.findByIdAndUpdate(
                        authorId,
                        {
                            $addToSet: {
                                manuscripts: manuscript._id,
                                roles:
                                    authorId === correspondingAuthorId
                                        ? ["author", "corresponding_author"]
                                        : ["author"],
                            },
                        },
                        { new: true }
                    );
                }
            } catch (err) {
                console.error("[createManuscript] Author update failed:", err);
            }

            // Clean up all temporary files
            try {
                await cleanupFiles(tempFiles);
                tempFiles = []; // Clear the array after successful cleanup
            } catch (err) {
                console.error("[createManuscript] Cleanup failed:", err);
            }

            res.status(201).json({
                success: true,
                data: manuscript,
                manuscriptId: customManuscriptId,
                mergedPdfUrl: manuscript.mergedFileUrl,
                extractedText: manuscriptText,
                coverLetterText: coverLetterText,
                declarationText: declarationText,
                extractedTitle: manuscriptTitle,
                extractedAbstract: manuscriptAbstract,
                extractedKeywords: manuscriptKeywords,
            });
        });
    } catch (error) {
        console.error("[createManuscript] Error in createManuscript:", error);
        // Clean up any remaining temporary files in case of error
        if (tempFiles.length > 0) {
            await cleanupFiles(tempFiles).catch((cleanupError) => {
                console.error(
                    "[createManuscript] Error during cleanup after failure:",
                    cleanupError
                );
            });
        }
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.previewManuscript = async (req, res) => {
    let tempFiles = [];

    try {
        upload(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ message: err.message });
            }

            // Convert additionalInfo array to string if it exists
            if (req.body.additionalInfo) {
                try {
                    const additionalInfoArray = JSON.parse(
                        req.body.additionalInfo
                    );
                    req.body.additionalInfo = additionalInfoArray.join(", ");
                } catch (e) {
                    console.error("Error parsing additionalInfo:", e);
                }
            }

            const manuscriptData = {
                ...req.body,
                manuscriptFile: req.files["manuscript"]
                    ? req.files["manuscript"][0].path
                    : null,
                coverLetterFile: req.files["coverLetter"]
                    ? req.files["coverLetter"][0].path
                    : null,
                declarationFile: req.files["declaration"]
                    ? req.files["declaration"][0].path
                    : null,
            };

            // Track temporary files for cleanup
            tempFiles = [
                ...(req.files["manuscript"]
                    ? [req.files["manuscript"][0].path]
                    : []),
                ...(req.files["coverLetter"]
                    ? [req.files["coverLetter"][0].path]
                    : []),
                ...(req.files["declaration"]
                    ? [req.files["declaration"][0].path]
                    : []),
            ];

            // Create merged PDF with form data table
            if (
                req.files["manuscript"] &&
                req.files["coverLetter"] &&
                req.files["declaration"]
            ) {
                const mergedPdfResult = await createMergedPDFWithTable(
                    req.files["manuscript"][0].path,
                    req.files["coverLetter"][0].path,
                    req.files["declaration"][0].path,
                    manuscriptData
                );

                // Track merged PDF for cleanup
                tempFiles.push(mergedPdfResult.localPath);

                // Upload preview to local storage
                const localFileUploadManager = new FileUploadManager();
                localFileUploadManager.useGoogleDrive = false;
                const driveUploadResult =
                    await localFileUploadManager.uploadFile(
                        mergedPdfResult.localPath,
                        `preview_${Date.now()}.pdf`,
                        "merged"
                    );

                // Clean up all temporary files
                await cleanupFiles(tempFiles);
                tempFiles = [];

                res.status(200).json({
                    success: true,
                    mergedPdfUrl:
                        driveUploadResult.webViewLink ||
                        driveUploadResult.webContentLink,
                });
            } else {
                throw new Error(
                    "All three files: manuscript, cover letter and declaration files are required"
                );
            }
        });
    } catch (error) {
        // Clean up any remaining temporary files in case of error
        if (tempFiles.length > 0) {
            await cleanupFiles(tempFiles).catch((cleanupError) => {
                console.error(
                    "Error during cleanup after failure:",
                    cleanupError
                );
            });
        }

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Assign reviewers to a manuscript (DEPRECATED - Use invitation system instead)
exports.assignReviewers = async (req, res) => {
    try {
        return res.status(400).json({
            success: false,
            message:
                "This endpoint is deprecated. Please use the invitation system: POST /api/editor/manuscripts/:manuscriptId/invite-reviewers followed by POST /api/editor/manuscripts/:manuscriptId/assign-reviewers",
        });
    } catch (error) {
        console.error("Error in deprecated assignReviewers:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Update manuscript status
exports.updateManuscriptStatus = async (req, res) => {
    try {
        const { manuscriptId } = req.params;
        const { status } = req.body;

        // First, get the current manuscript to check its current status
        const currentManuscript = await Manuscript.findById(manuscriptId);
        if (!currentManuscript) {
            return res.status(404).json({ message: "Manuscript not found" });
        }

        // Prevent any status changes if the manuscript is already rejected
        if (currentManuscript.status === "Rejected") {
            return res.status(403).json({
                message:
                    "Cannot modify status of a rejected manuscript. Rejected manuscripts are immutable.",
            });
        }

        const manuscript = await Manuscript.findByIdAndUpdate(
            manuscriptId,
            { status },
            { new: true }
        );

        res.status(200).json({
            success: true,
            data: manuscript,
        });
    } catch (error) {
        console.error("Error updating manuscript status:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Get user's submissions
exports.getMySubmissions = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate({
            path: "manuscripts",
            select: "customId title type status createdAt updatedAt mergedFileUrl", // Include only needed fields for author view
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user.manuscripts);
    } catch (error) {
        console.error("Error fetching manuscripts:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Withdraw manuscript
exports.withdrawManuscript = async (req, res) => {
    try {
        const { manuscriptId } = req.params;

        const manuscript = await Manuscript.findById(manuscriptId);
        if (!manuscript) {
            return res.status(404).json({
                success: false,
                message: "Manuscript not found",
            });
        }

        // Prevent withdrawal once submitted (allow only when status is 'Saved')
        if (manuscript.status !== "Saved") {
            return res.status(403).json({
                success: false,
                message: "Cannot withdraw a manuscript after submission.",
            });
        }

        // Authorization: only an author can withdraw
        const authorIds = manuscript.authors.map((id) => id.toString());
        const userId = (req.user && req.user._id && req.user._id.toString()) || null;
        if (!userId || !authorIds.includes(userId)) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to withdraw this manuscript",
            });
        }

        await User.updateMany(
            { _id: { $in: manuscript.authors } },
            { $pull: { manuscripts: manuscriptId } }
        );

        await Manuscript.findByIdAndDelete(manuscriptId);

        return res.json({
            success: true,
            message: "Manuscript withdrawn successfully",
        });
    } catch (error) {
        console.error("Detailed error in withdrawManuscript:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Error withdrawing manuscript",
            errorDetails: {
                name: error.name,
                message: error.message,
                code: error.code,
            },
        });
    }
};

// Get a single manuscript by ID
exports.getManuscriptById = async (req, res) => {
	try {
		const manuscript = await Manuscript.findById(req.params.manuscriptId)
			.populate("authors", "firstName middleName lastName email")
			.populate(
				"correspondingAuthor",
				"firstName middleName lastName email"
			)
			.populate(
				"assignedReviewers",
				"firstName middleName lastName email"
			)
			.select("-reviewerNotes"); // Exclude reviewer notes from author view

		if (!manuscript) {
			return res.status(404).json({
				success: false,
				message: "Manuscript not found",
			});
		}

		res.json({
			success: true,
			data: manuscript,
		});
	} catch (error) {
		console.error("Error fetching manuscript:", error);
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Endpoint: Build and download merged PDF (table + manuscript + cover letter + declaration)
exports.buildAndDownloadPdf = async (req, res) => {
	let tempFiles = [];
	try {
		upload(req, res, async (err) => {
			if (err) {
				console.error("[buildAndDownloadPdf] Multer error:", err);
				return res.status(400).json({ message: err.message });
			}
			if (
				!req.files["manuscript"] ||
				!req.files["coverLetter"] ||
				!req.files["declaration"]
			) {
				console.error("[buildAndDownloadPdf] Missing required files");
				return res.status(400).json({
					success: false,
					message:
						"All three files (manuscript, cover letter, and declaration) are required",
				});
			}

			try {
				// Track all temporary files for cleanup
				tempFiles = [
					req.files["manuscript"][0].path,
					req.files["coverLetter"][0].path,
					req.files["declaration"][0].path,
				];

				console.log(
					"[buildAndDownloadPdf] Starting DOCX to PDF conversion..."
				);

				// Convert DOCX files to PDF
				const manuscriptPdf = await convertDocxToPdf(
					req.files["manuscript"][0].path
				);
				console.log(
					"[buildAndDownloadPdf] Manuscript PDF created:",
					manuscriptPdf
				);

				const coverLetterPdf = await convertDocxToPdf(
					req.files["coverLetter"][0].path
				);
				console.log(
					"[buildAndDownloadPdf] Cover letter PDF created:",
					coverLetterPdf
				);

				const declarationPdf = await convertDocxToPdf(
					req.files["declaration"][0].path
				);
				console.log(
					"[buildAndDownloadPdf] Declaration PDF created:",
					declarationPdf
				);

				tempFiles.push(manuscriptPdf, coverLetterPdf, declarationPdf);

				// Extract text from manuscript
				console.log(
					"[buildAndDownloadPdf] Extracting text from manuscript..."
				);
				const manuscriptText = await extractTextFromDocx(
					req.files["manuscript"][0].path
				);
				console.log(
					"[buildAndDownloadPdf] Text extracted successfully"
				);

				// Create table PDF (reuse your existing function)
				console.log(
					"[buildAndDownloadPdf] Creating merged PDF with table..."
				);
				const tablePdfResult = await createMergedPDFWithTable(
					manuscriptPdf,
					coverLetterPdf,
					declarationPdf,
					req.body // or the relevant form data
				);
				const tablePdfPath = tablePdfResult.localPath;
				tempFiles.push(tablePdfPath);
				console.log(
					"[buildAndDownloadPdf] Table PDF created:",
					tablePdfPath
				);

				// Merge all four PDFs
				const mergedPdfPath = path.join(
					os.tmpdir(),
					`final_merged_${Date.now()}.pdf`
				);
				console.log("[buildAndDownloadPdf] Merging PDFs...");
				await mergePdfs(
					[
						tablePdfPath,
						manuscriptPdf,
						coverLetterPdf,
						declarationPdf,
					],
					mergedPdfPath
				);
				tempFiles.push(mergedPdfPath);
				console.log(
					"[buildAndDownloadPdf] Final merged PDF created:",
					mergedPdfPath
				);

				// Send merged PDF for download
				res.download(
					mergedPdfPath,
					"merged_manuscript.pdf",
					async (err) => {
						if (err) {
							console.error(
								"[buildAndDownloadPdf] Download error:",
								err
							);
						} else {
							console.log(
								"[buildAndDownloadPdf] Download sent successfully"
							);
						}
						// Clean up all temporary files after download (or error)
						await cleanupFiles(tempFiles);
					}
				);
			} catch (innerError) {
				console.error("[buildAndDownloadPdf] Inner error:", innerError);
				if (tempFiles.length > 0) {
					await cleanupFiles(tempFiles).catch(() => {});
				}
				return res.status(500).json({
					success: false,
					message: "PDF build failed: " + innerError.message,
				});
			}
		});
	} catch (error) {
		console.error("[buildAndDownloadPdf] Outer error:", error);
		if (tempFiles.length > 0) {
			await cleanupFiles(tempFiles).catch(() => {});
		}
		res.status(500).json({
			success: false,
			message: "PDF build failed: " + error.message,
		});
	}
};

exports.extractManuscriptInfo = async (req, res) => {
	// Use multer to handle the file upload
	const multer = require("multer");
	const os = require("os");
	const path = require("path");
	const fs = require("fs").promises;
	const storage = multer.diskStorage({
		destination: function (req, file, cb) {
			cb(null, os.tmpdir());
		},
		filename: function (req, file, cb) {
			cb(
				null,
				`temp_extract_${Date.now()}${path.extname(file.originalname)}`
			);
		},
	});
	const upload = multer({ storage: storage }).single("manuscript");

	upload(req, res, async function (err) {
		if (err) {
			return res
				.status(400)
				.json({ success: false, message: err.message });
		}
		if (!req.file) {
			return res.status(400).json({
				success: false,
				message: "No manuscript file uploaded.",
			});
		}
		try {
			const result = await extractTextFromDocx(req.file.path);
			// Clean up the temp file
			await fs.unlink(req.file.path);
			return res.status(200).json({
				success: true,
				extractedTitle: result.title || "",
				extractedAbstract: result.abstract || "",
				extractedKeywords: result.keywords || "",
				extractedText: result.full_text || "",
			});
		} catch (error) {
			return res.status(500).json({
				success: false,
				message: "Extraction failed.",
				error: error.message,
			});
		}
	});
};

// Get notes for author (only editorNotesForAuthor)
exports.getManuscriptNotesForAuthor = async (req, res) => {
	try {
		const { manuscriptId } = req.params;

		const manuscript = await Manuscript.findById(manuscriptId)
			.select("editorNotesForAuthor authors correspondingAuthor")
			.lean();

		if (!manuscript) {
			return res.status(404).json({
				message: "Manuscript not found",
			});
		}

		// Check if the user is an author of this manuscript
		const userObjectId = req.user._id;
		const isAuthor = manuscript.authors.some(
			(authorId) => authorId.toString() === userObjectId.toString()
		);
		const isCorrespondingAuthor =
			manuscript.correspondingAuthor &&
			manuscript.correspondingAuthor.toString() ===
				userObjectId.toString();

		if (!isAuthor && !isCorrespondingAuthor) {
			return res.status(403).json({
				message:
					"Access denied. You are not an author of this manuscript.",
			});
		}

		// Return only editor notes for author
		const editorNotesForAuthor = manuscript.editorNotesForAuthor || [];

		res.json({
			manuscriptId,
			notes: editorNotesForAuthor.map((note) => ({
				...note,
				type: "editorForAuthor",
			})),
			summary: {
				totalNotes: editorNotesForAuthor.length,
				editorNotesForAuthor: editorNotesForAuthor.length,
			},
		});
	} catch (error) {
		console.error("Error getting manuscript notes for author:", error);
		res.status(500).json({
			message: "Error fetching manuscript notes",
			error: error.message,
		});
	}
};

module.exports.convertDocxToPdf = convertDocxToPdf;
module.exports.isValidPdf = isValidPdf;
