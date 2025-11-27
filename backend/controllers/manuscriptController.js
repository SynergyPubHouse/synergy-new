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
const axios = require("axios");
// At the top of manuscriptController.js
const { uploadToCloudinary } = require("../utils/cloudinary");
const sendEmail = require("../utils/sendEmail");
const { console } = require("inspector");

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

const responseUpload = multer({
	storage: storage,
	limits: { fileSize: 50 * 1024 * 1024 },
	fileFilter: (req, file, cb) => {
		const allowedTypes = /docx/;
		const extname = allowedTypes.test(
			path.extname(file.originalname).toLowerCase()
		);
		if (extname) {
			return cb(null, true);
		}
		cb(new Error("Only Word documents (.docx) are allowed for responses!"));
	},
}).single("responseDoc");

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

const isUserAuthor = (manuscript, userId) => {
	if (!manuscript || !userId) return false;
	const userIdStr = userId.toString();

	const hasAuthor =
		Array.isArray(manuscript.authors) &&
		manuscript.authors.some((author) => {
			const authorId = author?._id ? author._id.toString() : author?.toString();
			return authorId === userIdStr;
		});

	if (hasAuthor) return true;

	if (manuscript.correspondingAuthor) {
		const correspondingId = manuscript.correspondingAuthor._id
			? manuscript.correspondingAuthor._id.toString()
			: manuscript.correspondingAuthor.toString();
		if (correspondingId === userIdStr) {
			return true;
		}
	}

	return false;
};

async function downloadFileToTemp(fileUrl, prefix, fallbackExt = ".pdf") {
	if (!fileUrl) {
		throw new Error("File URL is required");
	}
	const response = await axios.get(fileUrl, {
		responseType: "arraybuffer",
	});

	let extension = fallbackExt;
	try {
		const parsed = new URL(fileUrl);
		const ext = path.extname(parsed.pathname);
		if (ext) {
			extension = ext;
		}
	} catch (error) {
		// ignore parsing issues and use fallback extension
	}

	const tempPath = path.join(
		os.tmpdir(),
		`${prefix}_${Date.now()}${extension}`
	);
	await fs.writeFile(tempPath, response.data);
	return tempPath;
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

// Helper function to extract abstract from text
function extractAbstract(text) {
	const lines = text.split('\n').filter(line => line.trim());
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].toLowerCase();
		if (line.startsWith('abstract')) {
			if (line.split(' ').length > 1) {
				return line.substring(8).trim(': .-');
			} else {
				// Abstract is on next lines
				const abstractLines = [];
				for (let j = i + 1; j < lines.length; j++) {
					const nextLine = lines[j].toLowerCase();
					if (nextLine === '' || nextLine.startsWith(('keywords', 'key words', 'introduction', 'background'))) {
						break;
					}
					abstractLines.push(lines[j]);
				}
				return abstractLines.join(' ');
			}
		}
	}
	return "Document abstract could not be extracted automatically.";
}

// Helper function to extract keywords from text
function extractKeywords(text) {
	const lines = text.split('\n').filter(line => line.trim());
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const match = line.match(/^(keywords?|key words?)[:\-\. ]*(.*)$/i);
		if (match) {
			const keywords = match[2].trim();
			if (keywords) {
				return keywords;
			} else if (i + 1 < lines.length) {
				return lines[i + 1].trim();
			}
		}
	}
	return "document, manuscript, research";
}

// Helper: Extract text from DOCX using Python (original working version)
async function extractTextFromDocx(docxPath) {
	const pythonPath = "python3"; // Use python3 for production compatibility
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
				if (parsed.error) {
					return reject(new Error(parsed.error));
				}
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
console.log('[createTablePdf] Creating table PDF with form data:', formData);
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
    if (formData.funding === "Yes" && formData?.billingInfo) {
        drawTableRow("Find a Funder", formData?.billingInfo?.findFunder || 'Not provided');
        drawTableRow("Award Number", formData?.billingInfo?.awardNumber || 'Not provided');
        drawTableRow("Grant Recipient", formData?.billingInfo?.grantRecipient || 'Not provided');
    }
    
drawTableRow("Submission Date", new Date().toLocaleString());

// Add author information to the PDF
if (formData.authorsData) {
    try {
        const authors = JSON.parse(formData.authorsData);
        console.log('[createTablePdf] All authors:', authors);
        console.log('[createTablePdf] Corresponding Author ID:', formData.correspondingAuthorId);
        
        // Show all authors (main author + co-authors) in Authors list
        const authorNames = authors.map(author => {
            const name = `${author.firstName || ''} ${author.lastName || ''}`.trim();
            const email = author.email ? ` (${author.email})` : '';
            const orcid = author.orcid ? ` [ORCID: ${author.orcid}]` : '';
            return `${name}${email}${orcid}`;
        }).join(', '); // Use comma instead of newline to avoid PDF encoding issues
        drawTableRow("Authors", authorNames);

        // Show corresponding author only if it's different from main author OR if user explicitly changed it
        const correspondingAuthor = authors.find(a => a._id?.toString() === formData.correspondingAuthorId?.toString());
        console.log('[createTablePdf] Found corresponding author:', correspondingAuthor);
        
        if (correspondingAuthor) {
            const corrName = `${correspondingAuthor.firstName || ''} ${correspondingAuthor.lastName || ''}`.trim();
            const corrEmail = correspondingAuthor.email ? ` (${correspondingAuthor.email})` : '';
            drawTableRow("Corresponding Author", `${corrName}${corrEmail}`);
        }
    } catch (error) {
        console.error("Error processing author data:", error);
        // Better fallback: try to extract names from available data
        if (formData.authors && Array.isArray(formData.authors)) {
            // If authors array contains IDs, try to find them in the authors array
            const authorNames = formData.authors.map(authorId => {
                const author = authors.find(a => a._id?.toString() === authorId.toString());
                if (author) {
                    const name = `${author.firstName || ''} ${author.lastName || ''}`.trim();
                    return author.email ? `${name} (${author.email})` : name;
                }
                return authorId; // Fallback to ID if not found
            }).join(', ');
            drawTableRow("Authors", authorNames);
        }
        if (formData.correspondingAuthorId) {
            // Try to find corresponding author by ID
            const corrAuthor = authors.find(a => a._id?.toString() === formData.correspondingAuthorId.toString());
            if (corrAuthor) {
                const corrName = `${corrAuthor.firstName || ''} ${corrAuthor.lastName || ''}`.trim();
                const corrEmail = corrAuthor.email ? ` (${corrAuthor.email})` : '';
                drawTableRow("Corresponding Author", `${corrName}${corrEmail}`);
            } else {
                drawTableRow("Corresponding Author ID", formData.correspondingAuthorId);
            }
        }
    }
}

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

    console.log("[createManuscript] Request body:", req.body);
    console.log("[createManuscript] Request files:", req);
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

            // Parse billingInfo if it exists
            if (req.body.billingInfo) {
                try {
                    req.body.billingInfo = JSON.parse(req.body.billingInfo);
                    console.log('[createManuscript] Parsed billingInfo:', req.body.billingInfo);
                } catch (e) {
                    console.error(
                        "[createManuscript] Error parsing billingInfo:",
                        e
                    );
                    req.body.billingInfo = {};
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
                    // message: "DOCX to PDF conversion failed.",
                    message: err.message || "DOCX to PDF conversion failed.",

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

		if (currentManuscript.revisionLocked && status !== "Rejected") {
			return res.status(403).json({
				success: false,
				message:
					"All revision attempts have been exhausted. You can no longer update this manuscript.",
			});
		}

        // Prevent any status changes if the manuscript is already rejected
        if (currentManuscript.status === "Rejected") {
            return res.status(403).json({
                message:
                    "Cannot modify status of a rejected manuscript. Rejected manuscripts are immutable.",
            });
        }

		if (
			status === "Pending" &&
			currentManuscript.status === "Revision Required"
		) {
			const maxAttempts = currentManuscript.maxRevisionAttempts || 3;
			if (
				(currentManuscript.revisionAttempts || 0) >= maxAttempts
			) {
				return res.status(403).json({
					success: false,
					message:
						"All revision attempts have been exhausted. This manuscript has been rejected.",
				});
			}
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
			select:
				"customId title type status createdAt updatedAt mergedFileUrl reviewDocxUrl editorNotesForAuthor authorResponse revisedPdfBuiltAt revisionAttempts maxRevisionAttempts revisionLocked revisionCombinedPdfUrl",
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

exports.uploadResponseDoc = async (req, res) => {
	const { manuscriptId } = req.params;

	responseUpload(req, res, async (err) => {
		if (err) {
			return res.status(400).json({
				success: false,
				message: err.message,
			});
		}

		if (!req.file) {
			return res.status(400).json({
				success: false,
				message: "No response document uploaded",
			});
		}

		let tempPdfPath;
		try {
			const manuscript = await Manuscript.findById(manuscriptId)
				.populate("authors", "_id")
				.populate("correspondingAuthor", "_id");

			if (!manuscript) {
				await fs.unlink(req.file.path).catch(() => {});
				return res.status(404).json({
					success: false,
					message: "Manuscript not found",
				});
			}

			if (manuscript.revisionLocked || manuscript.status === "Rejected") {
				await fs.unlink(req.file.path).catch(() => {});
				return res.status(403).json({
					success: false,
					message:
						"All revision attempts have been exhausted. You can no longer upload responses for this manuscript.",
				});
			}

			if (!isUserAuthor(manuscript, req.user?._id)) {
				await fs.unlink(req.file.path).catch(() => {});
				return res.status(403).json({
					success: false,
					message:
						"You are not authorized to upload responses for this manuscript",
				});
			}

			const customId = manuscript.customId || manuscript._id.toString();
			const timestamp = Date.now();
			const responseFileName = `${customId}_response_${timestamp}.docx`;
			const responsePdfName = `response_${customId}_${timestamp}`;

			const fileUploadManager = new FileUploadManager();
			fileUploadManager.useGoogleDrive =
				process.env.USE_GOOGLE_DRIVE === "true";

			const driveResult = await fileUploadManager.uploadFile(
				req.file.path,
				responseFileName,
				"responses"
			);

			tempPdfPath = await convertDocxToPdf(req.file.path);
			if (!isValidPdf(tempPdfPath)) {
				throw new Error("Response PDF failed validation");
			}

			const pdfUpload = await uploadToCloudinary(
				tempPdfPath,
				"responses",
				"raw",
				responsePdfName
			);

			manuscript.authorResponse = {
				docxUrl:
					driveResult?.webViewLink ||
					driveResult?.webContentLink ||
					driveResult?.url,
				pdfUrl: pdfUpload.secure_url || pdfUpload.url,
				uploadedAt: new Date(),
			};

			await manuscript.save();

			await fs.unlink(req.file.path).catch(() => {});
			if (tempPdfPath) {
				await fs.unlink(tempPdfPath).catch(() => {});
			}

			return res.json({
				success: true,
				message: "Response document uploaded successfully",
				authorResponse: manuscript.authorResponse,
			});
		} catch (error) {
			console.error("[uploadResponseDoc]", error);
			await fs.unlink(req.file.path).catch(() => {});
			if (tempPdfPath) {
				await fs.unlink(tempPdfPath).catch(() => {});
			}
			return res.status(500).json({
				success: false,
				message: "Failed to upload response document",
				error: error.message,
			});
		}
	});
};

exports.uploadNotesWord = async (req, res) => {
  const manuscriptId = req.params.manuscriptId;


  console .log("Uploading review notes for manuscript ID:", manuscriptId);
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, os.tmpdir()),
    filename: (req, file, cb) =>
      cb(null, `notes_${Date.now()}${path.extname(file.originalname)}`),
  });
  const upload = multer({ storage }).single("file");
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
    try {
      // Get manuscript to extract customId for filename
      const manuscript = await Manuscript.findById(manuscriptId)
        .populate("authors", "firstName middleName lastName email")
        .populate("correspondingAuthor", "firstName middleName lastName email");
      if (!manuscript) {
        await fs.unlink(req.file.path);
        return res.status(404).json({ success: false, message: "Manuscript not found" });
      }
      // Generate filename from manuscript customId (extract prefix before first hyphen)
      // Format: customId is like "ART-25-001", we want "ART-review.docx"
      let fileName = "review.docx";
      if (manuscript.customId) {
        const prefix = manuscript.customId.split("-")[0];
        fileName = `${prefix}-review.docx`;
      } else {
        // Fallback: use first letters of title if no customId
        const titleWords = manuscript.title.split(" ").filter(w => w.length > 0);
        const prefix = titleWords.slice(0, 3).map(w => w.charAt(0).toUpperCase()).join("");
        fileName = `${prefix || "REV"}-review.docx`;
      }
      // Upload directly to Cloudinary (like PDF files)
      const cloudinary = require('cloudinary').v2;
      const uploadResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload(
              req.file.path,
              {
                  resource_type: 'raw',
                  public_id: `review-documents/${fileName}`,
                  format: 'docx',
                  access_mode: 'public'
              },
              (error, result) => {
                  if (error) reject(error);
                  else resolve(result);
              }
          );
      });
      const docxUrl = uploadResult.secure_url;

      // Store the link in manuscript
      manuscript.reviewDocxUrl = docxUrl;
      await manuscript.save();
      console.log("Updated reviewDocxUrl:", manuscript.reviewDocxUrl);
      // Cleanup temp file (async version)
      await fs.unlink(req.file.path);
      // Collect all unique author emails
      const authorEmails = new Set();
      if (manuscript.authors && manuscript.authors.length > 0) {
        manuscript.authors.forEach((author) => {
          if (author && author.email) {
            authorEmails.add(author.email.toLowerCase());
          }
        });
      }
      if (manuscript.correspondingAuthor && manuscript.correspondingAuthor.email) {
        authorEmails.add(manuscript.correspondingAuthor.email.toLowerCase());
      }
      const emailList = Array.from(authorEmails);
      // Send email to all authors
      if (emailList.length > 0) {
        const emailSubject = `Review Comments Available - ${manuscript.title}`;
        const emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FFFFFF;">
            <div style="background: linear-gradient(135deg, #00796B 0%, #00ACC1 100%); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">Synergy World Press</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Review Comments Available</p>
            </div>
            <div style="padding: 30px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                Dear Author,
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                The review comments and notes for your manuscript have been compiled into a Word document and are now available for download.
              </p>
              <div style="background-color: #F3F4F6; padding: 20px; margin: 25px 0; border-radius: 8px; border-left: 4px solid #00796B;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6B7280; font-size: 14px; font-weight: 600;">Manuscript Title:</td>
                    <td style="padding: 8px 0; color: #374151; font-size: 14px;">${manuscript.title}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6B7280; font-size: 14px; font-weight: 600;">Manuscript ID:</td>
                    <td style="padding: 8px 0; color: #374151; font-size: 14px;">${manuscript.customId || manuscript._id}</td>
                  </tr>
                </table>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${docxUrl}"
                   style="display: inline-block; background-color: #00796B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                  Download Review Comments (DOCX)
                </a>
              </div>
              <p style="color: #374151; font-size: 14px; line-height: 1.6;">
                This document contains all review comments and notes from editors and reviewers. Please review the feedback and take necessary actions.
              </p>
              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/journal/jics/my-submissions"
                   style="display: inline-block; background-color: #F3F4F6; color: #00796B; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; border: 1px solid #00796B;">
                  View Your Submissions
                </a>
              </div>
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB; color: #6B7280; font-size: 12px; text-align: center;">
                <p style="margin: 0;">This is an automated notification from Synergy World Press.</p>
                <p style="margin: 5px 0 0 0;">For questions, please contact: <a href="mailto:support@synergyworldpress.com" style="color: #00796B;">support@synergyworldpress.com</a></p>
              </div>
            </div>
          </div>
        `;
        // Send emails to all authors
        for (const email of emailList) {
          try {
            await sendEmail({
              to: email,
              subject: emailSubject,
              html: emailContent,
            });
            console.log(`Review DOCX notification sent to: ${email}`);
          } catch (emailError) {
            console.error(`Failed to send review DOCX notification to ${email}:`, emailError);
          }
        }
      }
      res.json({
        success: true,
        message: "Notes uploaded successfully and authors have been notified",
        link: docxUrl,
      });
    } catch (error) {
      console.error("[uploadNotesWord]", error);
      // Attempt cleanup even if upload failed
      try { await fs.unlink(req.file.path); } catch (_) {}
      res.status(500).json({ success: false, message: "Upload failed", error: error.message });
    }
  });
};

exports.buildRevisionPdf = async (req, res) => {
	const { manuscriptId } = req.params;
	const tempFiles = [];
	try {
		const manuscript = await Manuscript.findById(manuscriptId)
			.populate("authors", "firstName middleName lastName _id")
			.populate("correspondingAuthor", "firstName middleName lastName _id email");

		if (!manuscript) {
			return res.status(404).json({
				success: false,
				message: "Manuscript not found",
			});
		}

		if (manuscript.revisionLocked || manuscript.status === "Rejected") {
			return res.status(403).json({
				success: false,
				message:
					"All revision attempts have been exhausted. The manuscript has been rejected and cannot be rebuilt.",
			});
		}

		if (!isUserAuthor(manuscript, req.user?._id)) {
			return res.status(403).json({
				success: false,
				message: "You are not allowed to build this manuscript PDF",
			});
		}

		if (!manuscript.authorResponse?.pdfUrl) {
			return res.status(400).json({
				success: false,
				message: "Please upload a response document before building the PDF",
			});
		}

		const customId = manuscript.customId || manuscript._id.toString();

		const manuscriptPdfPath = await downloadFileToTemp(
			manuscript.manuscriptFile,
			`manuscript_${customId}`
		);
		const coverLetterPdfPath = await downloadFileToTemp(
			manuscript.coverLetterFile,
			`coverLetter_${customId}`
		);
		const declarationPdfPath = await downloadFileToTemp(
			manuscript.declarationFile,
			`declaration_${customId}`
		);
		const responsePdfPath = await downloadFileToTemp(
			manuscript.authorResponse.pdfUrl,
			`response_${customId}`
		);

		tempFiles.push(
			manuscriptPdfPath,
			coverLetterPdfPath,
			declarationPdfPath,
			responsePdfPath
		);

		const tableData = {
			type: manuscript.type,
			title: manuscript.title,
			keywords: manuscript.keywords,
			abstract: manuscript.abstract,
			classification: manuscript.classification,
			additionalInfo: manuscript.additionalInfo,
			comments: manuscript.comments,
			funding: manuscript.funding,
			billingInfo: manuscript.billingInfo,
		};

		const tablePdfPath = await createTablePdf(tableData, customId);
		tempFiles.push(tablePdfPath);

		const mergedPdfPath = path.join(
			os.tmpdir(),
			`revision_${customId}_${Date.now()}.pdf`
		);
		await mergePdfs(
			[
				tablePdfPath,
				responsePdfPath,
				manuscriptPdfPath,
				coverLetterPdfPath,
				declarationPdfPath,
			],
			mergedPdfPath
		);
		tempFiles.push(mergedPdfPath);

		const mergedUpload = await uploadToCloudinary(
			mergedPdfPath,
			"merged_manuscripts",
			"raw",
			`manuscript_${customId}_revision_${Date.now()}`
		);

		manuscript.revisionCombinedPdfUrl = mergedUpload.secure_url || mergedUpload.url;
console.log("Before save:", manuscript.revisionCombinedPdfUrl);
		manuscript.revisedPdfBuiltAt = new Date();
		await manuscript.save();
console.log("After save:", manuscript.revisionCombinedPdfUrl);
	return res.json({
    success: true,
    revisionUrl: manuscript.revisionCombinedPdfUrl,
});
	} catch (error) {
		console.error("[buildRevisionPdf]", error);
		return res.status(500).json({
			success: false,
			message: "Failed to build revision PDF",
			error: error.message,
		});
	} finally {
		await cleanupFiles(tempFiles);
	}
};
exports.uploadHighlightedFile = async (req, res) => {
    try {
        const manuscript = await Manuscript.findById(req.params.id);
        if (!manuscript) return res.status(404).json({ message: "Manuscript not found" });

        if (!req.file) return res.status(400).json({ message: "No file uploaded" });

        // Example: Cloudinary upload
      const uploadedFile = await uploadToCloudinary(
  req.file.path,
  "highlighted_revisions",
  "raw",
  `highlighted_${manuscript.customId}_${Date.now()}`
);

manuscript.highlightedRevisionFileUrl = uploadedFile.secure_url || uploadedFile.url;
await manuscript.save();


        return res.json({ success: true, highlightedRevisionFileUrl: manuscript.highlightedRevisionFileUrl });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Configure multer for revision file uploads
const revisionUpload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'responseSheet' || file.fieldname === 'highlightedDoc') {
            // Only PDF for response sheet and highlighted doc
            const isPdf = /pdf/.test(path.extname(file.originalname).toLowerCase());
            if (isPdf) {
                return cb(null, true);
            }
            cb(new Error('Response Sheet and Highlighted Document must be PDF files!'));
        } else if (file.fieldname === 'withoutHighlightedDoc') {
            // DOCX or LaTeX (.tex, .zip) for without highlighted doc
            const allowedTypes = /docx|tex|zip/;
            const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
            if (extname) {
                return cb(null, true);
            }
            cb(new Error('Without Highlighted Document must be DOCX, LaTeX (.tex), or ZIP file!'));
        }
        cb(new Error('Invalid file field'));
    },
}).fields([
    { name: 'responseSheet', maxCount: 1 },
    { name: 'highlightedDoc', maxCount: 1 },
    { name: 'withoutHighlightedDoc', maxCount: 1 }
]);

exports.uploadRevisionFiles = async (req, res) => {
    let tempFiles = [];
    
    revisionUpload(req, res, async (err) => {
        if (err) {
            console.error("[uploadRevisionFiles] Multer error:", err);
            return res.status(400).json({ 
                success: false, 
                message: err.message 
            });
        }

        try {
            const { manuscriptId } = req.params;
            const { fileType } = req.body; // 'docx' or 'latex'

            // Find manuscript
            const manuscript = await Manuscript.findById(manuscriptId)
                .populate("authors", "_id firstName lastName email")
                .populate("correspondingAuthor", "_id firstName lastName email");

            if (!manuscript) {
                return res.status(404).json({ 
                    success: false, 
                    message: "Manuscript not found" 
                });
            }

            // Check authorization
            if (!isUserAuthor(manuscript, req.user?._id)) {
                return res.status(403).json({
                    success: false,
                    message: "You are not authorized to upload revision files for this manuscript"
                });
            }

            // Check if manuscript is locked
            if (manuscript.revisionLocked || manuscript.status === "Rejected") {
                return res.status(403).json({
                    success: false,
                    message: "All revision attempts have been exhausted. Cannot upload files."
                });
            }

            // Check if all required files are present
            if (!req.files || !req.files.responseSheet || !req.files.highlightedDoc || !req.files.withoutHighlightedDoc) {
                return res.status(400).json({ 
                    success: false, 
                    message: "All three files are required: Response Sheet (PDF), Highlighted Document (PDF), and Without Highlighted Document (DOCX/LaTeX)" 
                });
            }

            // Track temporary files for cleanup
            tempFiles = [
                req.files.responseSheet[0].path,
                req.files.highlightedDoc[0].path,
                req.files.withoutHighlightedDoc[0].path
            ];

            const customId = manuscript.customId || manuscript._id.toString();
            const timestamp = Date.now();

            // Initialize authorResponse if it doesn't exist
            if (!manuscript.authorResponse) {
                manuscript.authorResponse = {
                    submissionCount: 0
                };
            }

            // 1. Upload Response Sheet (PDF only)
            console.log("[uploadRevisionFiles] Uploading Response Sheet...");
            const responseSheetUpload = await uploadToCloudinary(
                req.files.responseSheet[0].path,
                "author_responses",
                "raw",
                `response_sheet_${customId}_${timestamp}`
            );
            manuscript.authorResponse.docxUrl = responseSheetUpload.secure_url || responseSheetUpload.url;
            manuscript.authorResponse.pdfUrl = responseSheetUpload.secure_url || responseSheetUpload.url;
            manuscript.authorResponse.uploadedAt = new Date();
            console.log("[uploadRevisionFiles] Response Sheet uploaded successfully");

            // 2. Upload Highlighted Document (PDF only)
            console.log("[uploadRevisionFiles] Uploading Highlighted Document...");
            const highlightedUpload = await uploadToCloudinary(
                req.files.highlightedDoc[0].path,
                "highlighted_revisions",
                "raw",
                `highlighted_${customId}_${timestamp}`
            );
            manuscript.authorResponse.highlightedFileUrl = highlightedUpload.secure_url || highlightedUpload.url;
            manuscript.authorResponse.highlightedUploadedAt = new Date();
            console.log("[uploadRevisionFiles] Highlighted Document uploaded successfully");

            // 3. Upload Without Highlighted Document (DOCX or LaTeX)
            console.log("[uploadRevisionFiles] Uploading Without Highlighted Document...");
            const withoutHighlightedFile = req.files.withoutHighlightedDoc[0];
            const fileExtension = path.extname(withoutHighlightedFile.originalname);
            
            const withoutHighlightedUpload = await uploadToCloudinary(
                withoutHighlightedFile.path,
                "clean_revisions",
                "raw",
                `clean_${customId}_${timestamp}${fileExtension}`
            );
            manuscript.authorResponse.withoutHighlightedFileUrl = withoutHighlightedUpload.secure_url || withoutHighlightedUpload.url;
            manuscript.authorResponse.withoutHighlightedUploadedAt = new Date();
            
            // Store file type information
            manuscript.authorResponse.fileType = fileType || 'docx';
            
            console.log("[uploadRevisionFiles] Without Highlighted Document uploaded successfully");

            // Update metadata
            manuscript.authorResponse.lastUpdated = new Date();
            manuscript.authorResponse.submissionCount = (manuscript.authorResponse.submissionCount || 0) + 1;
            manuscript.updatedAt = new Date();

            // Save manuscript
            await manuscript.save();

            // Clean up temporary files
            await cleanupFiles(tempFiles);
            tempFiles = [];

            console.log(`[uploadRevisionFiles] All revision files uploaded successfully for manuscript: ${customId}`);

            // Send success response
            return res.json({ 
                success: true, 
                message: "All revision files have been successfully uploaded and submitted to the editor",
                data: {
                    responseSheetUrl: manuscript.authorResponse.docxUrl,
                    highlightedDocumentUrl: manuscript.authorResponse.highlightedFileUrl,
                    withoutHighlightedDocumentUrl: manuscript.authorResponse.withoutHighlightedFileUrl,
                    fileType: manuscript.authorResponse.fileType,
                    submissionCount: manuscript.authorResponse.submissionCount,
                    uploadedAt: manuscript.authorResponse.uploadedAt
                }
            });

        } catch (error) {
            console.error("[uploadRevisionFiles] Error:", error);
            
            // Clean up temporary files on error
            if (tempFiles.length > 0) {
                await cleanupFiles(tempFiles).catch((cleanupError) => {
                    console.error("[uploadRevisionFiles] Cleanup error:", cleanupError);
                });
            }
            
            return res.status(500).json({ 
                success: false, 
                message: "Failed to upload revision files. Please try again.",
                error: error.message
            });
        }
    });
};

module.exports.convertDocxToPdf = convertDocxToPdf;
module.exports.isValidPdf = isValidPdf;
