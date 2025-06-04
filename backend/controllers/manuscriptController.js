// manuscriptController.js
const Manuscript = require("../models/Manuscript");
const multer = require("multer");
const path = require("path");
const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");
const { uploadFile } = require("../utils/googleDrive");
const fs = require("fs").promises;
const User = require("../models/User"); // Import User model
const Reviewer = require("../models/Reviewer"); // Import Reviewer model
const mongoose = require("mongoose");

// Configure multer for file upload
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, "uploads/");
	},
	filename: function (req, file, cb) {
		cb(null, Date.now() + path.extname(file.originalname));
	},
});

const upload = multer({
	storage: storage,
	limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
	fileFilter: (req, file, cb) => {
		const allowedTypes = /pdf|doc|docx/;
		const extname = allowedTypes.test(
			path.extname(file.originalname).toLowerCase()
		);
		if (extname) {
			return cb(null, true);
		}
		cb(new Error("Only Word documents are allowed!"));
	},
}).fields([
	{ name: "manuscript", maxCount: 1 },
	{ name: "coverLetter", maxCount: 1 },
	{ name: "declaration", maxCount: 1 },
]);

exports.createManuscript = async (req, res) => {
	try {
		upload(req, res, async (err) => {
			if (err) {
				return res.status(400).json({ message: err.message });
			}

			// Check if all required files are present
			if (!req.files["manuscript"] || !req.files["coverLetter"] || !req.files["declaration"]) {
				return res.status(400).json({ 
					success: false, 
					message: "All three files (manuscript, cover letter, and declaration) are required" 
				});
			}

			// Convert additionalInfo array to string if it exists
			if (req.body.additionalInfo) {
				try {
					const additionalInfoArray = JSON.parse(req.body.additionalInfo);
					req.body.additionalInfo = additionalInfoArray.join(", ");
				} catch (e) {
					console.error("Error parsing additionalInfo:", e);
				}
			}

			// Handle authors and roles
			const authors = req.body.authors ? JSON.parse(req.body.authors) : [];
			const correspondingAuthorId = req.body.correspondingAuthorId;

			// Add current user as author if not in the list
			if (!authors.includes(req.user._id.toString())) {
				authors.unshift(req.user._id.toString());
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
					console.error("Error converting author ID:", error);
					return res.status(400).json({
						success: false,
						message: `Invalid author ID format: ${id}`
					});
				}
			}

			// Validate and convert corresponding author ID
			let correspondingAuthorObjectId;
			try {
				if (mongoose.Types.ObjectId.isValid(correspondingAuthorId || req.user._id)) {
					correspondingAuthorObjectId = new mongoose.Types.ObjectId(correspondingAuthorId || req.user._id);
				} else {
					throw new Error(`Invalid corresponding author ID: ${correspondingAuthorId || req.user._id}`);
				}
			} catch (error) {
				console.error("Error converting corresponding author ID:", error);
				return res.status(400).json({
					success: false,
					message: `Invalid corresponding author ID format: ${correspondingAuthorId || req.user._id}`
				});
			}

			const manuscriptData = {
				...req.body,
				authors: authorObjectIds,
				correspondingAuthor: correspondingAuthorObjectId,
				manuscriptFile: req.files["manuscript"][0].path,
				coverLetterFile: req.files["coverLetter"][0].path,
				declarationFile: req.files["declaration"][0].path,
				status: "Pending",
			};

			console.log("Initial manuscriptData:", manuscriptData);

			// Create merged PDF with form data table
			console.log("Creating merged PDF...");
			const mergedPdfResult = await createMergedPDFWithTable(
				req.files["manuscript"][0].path,
				req.files["coverLetter"][0].path,
				req.files["declaration"][0].path,
				manuscriptData
			);

			console.log("Merged PDF result:", mergedPdfResult);

			// Upload merged PDF to Google Drive
			const driveUploadResult = await uploadFile(
				mergedPdfResult.localPath,
				`manuscript_${Date.now()}.pdf`
			);

			// Store both local path and Google Drive URL
			manuscriptData.mergedFile = mergedPdfResult.localPath;
			manuscriptData.mergedFileUrl = driveUploadResult.webViewLink;

			console.log("Updated manuscriptData with URLs:", {
				mergedFile: manuscriptData.mergedFile,
				mergedFileUrl: manuscriptData.mergedFileUrl,
			});

			const manuscript = new Manuscript(manuscriptData);
			console.log("Saving manuscript to database:", manuscript);
			await manuscript.save();

			// Update all authors' manuscripts array and roles
			for (const authorId of authors) {
				await User.findByIdAndUpdate(
					authorId,
					{
						$addToSet: {
							manuscripts: manuscript._id,
							roles: authorId === correspondingAuthorId ? ["author", "corresponding_author"] : ["author"]
						}
					},
					{ new: true }
				);
			}

			// Verify the saved manuscript
			const savedManuscript = await Manuscript.findById(manuscript._id);
			console.log("Saved manuscript from database:", savedManuscript);

			res.status(201).json({
				success: true,
				data: manuscript,
				mergedPdfPath: manuscriptData.mergedFile,
				mergedPdfUrl: manuscriptData.mergedFileUrl,
			});
		});
	} catch (error) {
		console.error("Error in createManuscript:", error);
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

const createMergedPDFWithTable = async (
	file1Path,
	file2Path,
	file3Path,
	formData
) => {
	try {
		console.log("Starting PDF merge process...");
		console.log("Received formData:", formData);
		const mergedPdf = await PDFDocument.create();

		// Add a new page for the table
		const tablePage = mergedPdf.addPage([612, 792]); // US Letter size

		// Embed the standard font
		const font = await mergedPdf.embedFont(StandardFonts.Helvetica);
		const boldFont = await mergedPdf.embedFont(StandardFonts.HelveticaBold);

		// Set up table parameters
		const margin = 50;
		const tableWidth = tablePage.getWidth() - 2 * margin;
		const rowHeight = 25;
		let currentY = tablePage.getHeight() - margin;

		// Draw title
		tablePage.drawText("Manuscript Submission Details", {
			x: margin,
			y: currentY,
			size: 18,
			font: boldFont,
			color: rgb(0, 0, 0),
		});

		currentY -= 40;

		// Function to draw a table row
		const drawRow = (label, value) => {
			// Draw cell borders
			tablePage.drawRectangle({
				x: margin,
				y: currentY - rowHeight,
				width: tableWidth / 3,
				height: rowHeight,
				borderColor: rgb(0, 0, 0),
				borderWidth: 1,
			});

			tablePage.drawRectangle({
				x: margin + tableWidth / 3,
				y: currentY - rowHeight,
				width: (2 * tableWidth) / 3,
				height: rowHeight,
				borderColor: rgb(0, 0, 0),
				borderWidth: 1,
			});

			// Draw text
			tablePage.drawText(label, {
				x: margin + 5,
				y: currentY - rowHeight / 2 - 6,
				size: 10,
				font: boldFont,
				color: rgb(0, 0, 0),
			});

			// Truncate long text
			let displayValue = value ? value.toString() : "N/A";
			if (displayValue.length > 60) {
				displayValue = displayValue.substring(0, 57) + "...";
			}

			tablePage.drawText(displayValue, {
				x: margin + tableWidth / 3 + 5,
				y: currentY - rowHeight / 2 - 6,
				size: 10,
				font: font,
				color: rgb(0, 0, 0),
			});

			currentY -= rowHeight;
		};

		// Draw table header
		tablePage.drawRectangle({
			x: margin,
			y: currentY - rowHeight,
			width: tableWidth,
			height: rowHeight,
			borderColor: rgb(0, 0, 0),
			borderWidth: 1,
			color: rgb(0.9, 0.9, 0.9),
		});

		tablePage.drawText("Manuscript Information", {
			x: margin + tableWidth / 2 - 70,
			y: currentY - rowHeight / 2 - 6,
			size: 12,
			font: boldFont,
			color: rgb(0, 0, 0),
		});

		currentY -= rowHeight;

		// Get authors information
		let authorsInfo = "";
		console.log("Authors from formData:", formData.authors);
		
		if (formData.authors) {
			try {
				// Ensure we're working with an array of ObjectIds
				const authorIds = Array.isArray(formData.authors) ? formData.authors : [formData.authors];
				console.log("Author IDs:", authorIds);

				// Find all authors in one query
				const authors = await User.find({
					_id: { $in: authorIds }
				}).select('title firstName middleName lastName');

				console.log("Found authors:", authors);

				if (authors && authors.length > 0) {
					// Sort authors to match the original order
					const authorMap = new Map(authors.map(a => [a._id.toString(), a]));
					const orderedAuthors = authorIds
						.map(id => authorMap.get(id.toString()))
						.filter(Boolean);

					authorsInfo = orderedAuthors
						.map(author => {
							const parts = [
								author.title,
								author.firstName,
								author.middleName,
								author.lastName
							].filter(Boolean);
							return parts.join(" ");
						})
						.join(", ");
				}
			} catch (error) {
				console.error("Error getting authors info:", error);
				authorsInfo = "Error retrieving authors";
			}
		}

		console.log("Final authorsInfo:", authorsInfo);

		// Draw table rows for each form field
		drawRow("Type", formData.type);
		drawRow("Title", formData.title);
		drawRow("Authors", authorsInfo || "N/A");
		drawRow("Keywords", formData.keywords);
		drawRow("Abstract", formData.abstract);
		drawRow("Classification", formData.classification);
		drawRow("Comments", formData.comments);
		drawRow("Funding", formData.funding);
		drawRow("Submission Date", new Date().toLocaleString());

		// Now add the original PDFs
		const pdf1Bytes = await fs.readFile(file1Path);
		const pdf2Bytes = await fs.readFile(file2Path);
		const pdf3Bytes = await fs.readFile(file3Path);

		const pdf1 = await PDFDocument.load(pdf1Bytes);
		const pdf2 = await PDFDocument.load(pdf2Bytes);
		const pdf3 = await PDFDocument.load(pdf3Bytes);

		const pdf1Pages = await mergedPdf.copyPages(
			pdf1,
			pdf1.getPageIndices()
		);
		const pdf2Pages = await mergedPdf.copyPages(
			pdf2,
			pdf2.getPageIndices()
		);
		const pdf3Pages = await mergedPdf.copyPages(
			pdf3,
			pdf3.getPageIndices()
		);

		// Add the pages from the original PDFs
		pdf1Pages.forEach((page) => mergedPdf.addPage(page));
		pdf2Pages.forEach((page) => mergedPdf.addPage(page));
		pdf3Pages.forEach((page) => mergedPdf.addPage(page));

		const mergedPdfBytes = await mergedPdf.save();

		// Generate unique filename
		const timestamp = Date.now();
		const mergedFilename = `merged_${timestamp}.pdf`;
		const mergedFilePath = path.join("uploads", mergedFilename);

		console.log("Saving merged PDF to:", mergedFilePath);
		await fs.writeFile(mergedFilePath, mergedPdfBytes);

		// Create a URL for the file
		const url = `/uploads/${mergedFilename}`;
		console.log("Generated URL for merged PDF:", url);

		return {
			localPath: mergedFilePath,
			url: url,
		};
	} catch (error) {
		console.error("Error in createMergedPDFWithTable:", error);
		throw new Error(
			"Error creating merged PDF with table: " + error.message
		);
	}
};

// manuscriptController.js - Add this new function
exports.previewManuscript = async (req, res) => {
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

				res.status(200).json({
					success: true,
					mergedPdfPath: mergedPdfResult.localPath,
					mergedPdfUrl: mergedPdfResult.url,
				});
			} else {
				throw new Error(
					"All three files: manuscript, cover letter and declaration files are required"
				);
			}
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Assign reviewers to a manuscript
exports.assignReviewers = async (req, res) => {
	try {
		const { manuscriptId } = req.params;
		const { reviewers } = req.body;

		// Update the manuscript with assigned reviewers
		const manuscript = await Manuscript.findByIdAndUpdate(
			manuscriptId,
			{
				$set: {
					assignedReviewers: reviewers,
					status: "Under Review",
				},
			},
			{ new: true }
		);

		if (!manuscript) {
			return res.status(404).json({ message: "Manuscript not found" });
		}

		// Update each reviewer's assignedManuscripts array
		await Reviewer.updateMany(
			{ _id: { $in: reviewers } },
			{ $addToSet: { assignedManuscripts: manuscriptId } }
		);

		res.status(200).json({
			success: true,
			data: manuscript,
		});
	} catch (error) {
		console.error("Error assigning reviewers:", error);
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

		const manuscript = await Manuscript.findByIdAndUpdate(
			manuscriptId,
			{ status },
			{ new: true }
		);

		if (!manuscript) {
			return res.status(404).json({ message: "Manuscript not found" });
		}

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

// Add this new controller method
exports.getMySubmissions = async (req, res) => {
	try {
		// Find the user and populate their manuscripts array
		const user = await User.findById(req.user._id).populate("manuscripts");

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

// Add this new controller method for withdrawing manuscripts
exports.withdrawManuscript = async (req, res) => {
	try {
		console.log("Starting manuscript withdrawal process...");
		console.log("Request params:", req.params);
		console.log("User ID:", req.user._id);

		const { manuscriptId } = req.params;
		console.log("Manuscript ID to withdraw:", manuscriptId);

		// Find the manuscript first to get its file paths
		const manuscript = await Manuscript.findById(manuscriptId);
		console.log("Found manuscript:", manuscript ? "Yes" : "No");
		
		if (!manuscript) {
			console.log("Manuscript not found in database");
			return res.status(404).json({ 
				success: false, 
				message: "Manuscript not found" 
			});
		}

		// Check if the user is authorized to delete this manuscript
		const authorIds = manuscript.authors.map(id => id.toString());
		const userId = req.user._id.toString();
		console.log("Author IDs in manuscript:", authorIds);
		console.log("Current user ID:", userId);
		console.log("Is user an author?", authorIds.includes(userId));

		if (!authorIds.includes(userId)) {
			console.log("User is not authorized to withdraw this manuscript");
			return res.status(403).json({ 
				success: false, 
				message: "Not authorized to withdraw this manuscript" 
			});
		}

		// Delete the files from the uploads directory
		const filesToDelete = [
			manuscript.manuscriptFile,
			manuscript.coverLetterFile,
			manuscript.declarationFile,
			manuscript.mergedFile
		].filter(Boolean);
		console.log("Files to delete:", filesToDelete);

		for (const filePath of filesToDelete) {
			try {
				console.log("Attempting to delete file:", filePath);
				await fs.unlink(filePath);
				console.log("Successfully deleted file:", filePath);
			} catch (error) {
				console.error(`Error deleting file ${filePath}:`, error);
				// Continue with other deletions even if one fails
			}
		}

		// Remove manuscript reference from all authors
		console.log("Removing manuscript reference from authors");
		const updateResult = await User.updateMany(
			{ _id: { $in: manuscript.authors } },
			{ $pull: { manuscripts: manuscriptId } }
		);
		console.log("Update result:", updateResult);

		// Delete the manuscript from the database
		console.log("Deleting manuscript from database");
		const deleteResult = await Manuscript.findByIdAndDelete(manuscriptId);
		console.log("Delete result:", deleteResult ? "Success" : "Failed");

		console.log("Manuscript withdrawal completed successfully");
		res.json({ 
			success: true, 
			message: "Manuscript withdrawn successfully" 
		});
	} catch (error) {
		console.error("Detailed error in withdrawManuscript:", {
			name: error.name,
			message: error.message,
			stack: error.stack,
			code: error.code,
			path: error.path,
			syscall: error.syscall
		});
		res.status(500).json({
			success: false,
			message: error.message || "Error withdrawing manuscript",
			errorDetails: {
				name: error.name,
				message: error.message,
				code: error.code
			}
		});
	}
};
