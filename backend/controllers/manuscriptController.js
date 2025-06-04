// manuscriptController.js
const Manuscript = require("../models/Manuscript");
const multer = require("multer");
const path = require("path");
const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");
const { uploadFile } = require("../utils/googleDrive");
const fs = require("fs").promises;
const User = require("../models/User");
const Reviewer = require("../models/Reviewer");
const mongoose = require("mongoose");
const os = require("os");

// Configure multer for temporary file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Use system temp directory instead of persistent uploads folder
    cb(null, os.tmpdir());
  },
  filename: function (req, file, cb) {
    cb(null, `temp_${Date.now()}${path.extname(file.originalname)}`);
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
    cb(new Error("Only Word documents and PDFs are allowed!"));
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
        console.log(`Cleaned up temporary file: ${filePath}`);
      }
    } catch (error) {
      console.error(`Error cleaning up file ${filePath}:`, error);
    }
  }
}

exports.createManuscript = async (req, res) => {
  let tempFiles = [];
  
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

      // Track all temporary files for cleanup
      tempFiles = [
        req.files["manuscript"][0].path,
        req.files["coverLetter"][0].path,
        req.files["declaration"][0].path
      ];

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

      // Create merged PDF with form data table
      const mergedPdfResult = await createMergedPDFWithTable(
        req.files["manuscript"][0].path,
        req.files["coverLetter"][0].path,
        req.files["declaration"][0].path,
        {
          ...req.body,
          authors: authorObjectIds,
          correspondingAuthor: correspondingAuthorObjectId
        }
      );

      // Track the merged PDF for cleanup
      tempFiles.push(mergedPdfResult.localPath);

      // Upload all files to Google Drive
      const [manuscriptUrl, coverLetterUrl, declarationUrl, mergedUrl] = await Promise.all([
        uploadFile(req.files["manuscript"][0].path, `manuscript_${Date.now()}_${path.basename(req.files["manuscript"][0].originalname)}`),
        uploadFile(req.files["coverLetter"][0].path, `cover_letter_${Date.now()}_${path.basename(req.files["coverLetter"][0].originalname)}`),
        uploadFile(req.files["declaration"][0].path, `declaration_${Date.now()}_${path.basename(req.files["declaration"][0].originalname)}`),
        uploadFile(mergedPdfResult.localPath, `merged_manuscript_${Date.now()}.pdf`)
      ]);

      const manuscriptData = {
        ...req.body,
        authors: authorObjectIds,
        correspondingAuthor: correspondingAuthorObjectId,
        manuscriptFile: manuscriptUrl.webViewLink,
        coverLetterFile: coverLetterUrl.webViewLink,
        declarationFile: declarationUrl.webViewLink,
        mergedFileUrl: mergedUrl.webViewLink,
        status: "Pending",
      };

      const manuscript = new Manuscript(manuscriptData);
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

      // Clean up all temporary files
      await cleanupFiles(tempFiles);
      tempFiles = []; // Clear the array after successful cleanup

      res.status(201).json({
        success: true,
        data: manuscript,
        mergedPdfUrl: manuscriptData.mergedFileUrl,
      });
    });
  } catch (error) {
    console.error("Error in createManuscript:", error);
    
    // Clean up any remaining temporary files in case of error
    if (tempFiles.length > 0) {
      await cleanupFiles(tempFiles).catch(cleanupError => {
        console.error("Error during cleanup after failure:", cleanupError);
      });
    }
    
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
    if (formData.authors) {
      try {
        const authorIds = Array.isArray(formData.authors) ? formData.authors : [formData.authors];
        const authors = await User.find({
          _id: { $in: authorIds }
        }).select('title firstName middleName lastName');

        if (authors && authors.length > 0) {
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
    const [pdf1Bytes, pdf2Bytes, pdf3Bytes] = await Promise.all([
      fs.readFile(file1Path),
      fs.readFile(file2Path),
      fs.readFile(file3Path)
    ]);

    const [pdf1, pdf2, pdf3] = await Promise.all([
      PDFDocument.load(pdf1Bytes),
      PDFDocument.load(pdf2Bytes),
      PDFDocument.load(pdf3Bytes)
    ]);

    const [pdf1Pages, pdf2Pages, pdf3Pages] = await Promise.all([
      mergedPdf.copyPages(pdf1, pdf1.getPageIndices()),
      mergedPdf.copyPages(pdf2, pdf2.getPageIndices()),
      mergedPdf.copyPages(pdf3, pdf3.getPageIndices())
    ]);

    // Add the pages from the original PDFs
    pdf1Pages.forEach((page) => mergedPdf.addPage(page));
    pdf2Pages.forEach((page) => mergedPdf.addPage(page));
    pdf3Pages.forEach((page) => mergedPdf.addPage(page));

    const mergedPdfBytes = await mergedPdf.save();

    // Generate unique filename in temp directory
    const mergedFilename = `merged_${Date.now()}.pdf`;
    const mergedFilePath = path.join(os.tmpdir(), mergedFilename);

    await fs.writeFile(mergedFilePath, mergedPdfBytes);

    return {
      localPath: mergedFilePath,
    };
  } catch (error) {
    console.error("Error in createMergedPDFWithTable:", error);
    throw new Error(
      "Error creating merged PDF with table: " + error.message
    );
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
        ...(req.files["manuscript"] ? [req.files["manuscript"][0].path] : []),
        ...(req.files["coverLetter"] ? [req.files["coverLetter"][0].path] : []),
        ...(req.files["declaration"] ? [req.files["declaration"][0].path] : [])
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

        // Upload to Google Drive for preview
        const driveUploadResult = await uploadFile(
          mergedPdfResult.localPath,
          `preview_${Date.now()}.pdf`
        );

        // Clean up all temporary files
        await cleanupFiles(tempFiles);
        tempFiles = [];

        res.status(200).json({
          success: true,
          mergedPdfUrl: driveUploadResult.webViewLink,
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
      await cleanupFiles(tempFiles).catch(cleanupError => {
        console.error("Error during cleanup after failure:", cleanupError);
      });
    }
    
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

// Get user's submissions
exports.getMySubmissions = async (req, res) => {
  try {
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

// Withdraw manuscript
exports.withdrawManuscript = async (req, res) => {
  try {
    const { manuscriptId } = req.params;

    // Find the manuscript first to get its file URLs
    const manuscript = await Manuscript.findById(manuscriptId);
    
    if (!manuscript) {
      return res.status(404).json({ 
        success: false, 
        message: "Manuscript not found" 
      });
    }

    // Check if the user is authorized to delete this manuscript
    const authorIds = manuscript.authors.map(id => id.toString());
    const userId = req.user._id.toString();

    if (!authorIds.includes(userId)) {
      return res.status(403).json({ 
        success: false, 
        message: "Not authorized to withdraw this manuscript" 
      });
    }

    // Remove manuscript reference from all authors
    await User.updateMany(
      { _id: { $in: manuscript.authors } },
      { $pull: { manuscripts: manuscriptId } }
    );

    // Delete the manuscript from the database
    await Manuscript.findByIdAndDelete(manuscriptId);

    res.json({ 
      success: true, 
      message: "Manuscript withdrawn successfully" 
    });
  } catch (error) {
    console.error("Detailed error in withdrawManuscript:", error);
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