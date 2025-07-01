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
const { PythonShell } = require('python-shell');
const fsSync = require('fs'); // Add at the top if not already

// Configure multer for temporary file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Use system temp directory instead of persistent uploads folder
    cb(null, os.tmpdir());
  },
  filename: function (req, file, cb) {
    // Add fieldname to ensure uniqueness
    cb(null, `temp_${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
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
    const fd = fsSync.openSync(filePath, 'r');
    const buffer = Buffer.alloc(5);
    fsSync.readSync(fd, buffer, 0, 5, 0);
    fsSync.closeSync(fd);
    return buffer.toString() === '%PDF-';
  } catch (e) {
    return false;
  }
}

// Helper: Convert DOCX to PDF
async function convertDocxToPdf(docxPath) {
  const pythonPath = 'python'; // Change to full path if needed
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '../utils/convertToPdf.py');
    const outputPdf = docxPath.replace(/\.docx?$/, '.pdf');
    const shell = new PythonShell(
      scriptPath,
      { args: [docxPath, outputPdf], pythonPath, env: { ...process.env, PYTHONIOENCODING: 'utf-8' } }
    );
    let output = [];
    let errorOutput = [];
    shell.on('message', (message) => {
      output.push(message);
    });
    shell.on('stderr', (stderr) => {
      console.error('[convertDocxToPdf] PythonShell stderr:', stderr);
      errorOutput.push(stderr);
    });
    shell.on('error', (err) => {
      console.error('[convertDocxToPdf] PythonShell error event:', err);
    });
    shell.end(async (err, code, signal) => {
      if (err) {
        console.error('[convertDocxToPdf] PythonShell end error:', err);
        if (errorOutput.length > 0) {
          console.error('[convertDocxToPdf] PythonShell stderr collected:', errorOutput.join('\n'));
        }
        return reject(err);
      }
      // Wait for the PDF to exist and be non-empty
      let tries = 0;
      const maxTries = 10;
      const waitMs = 300;
      while (tries < maxTries) {
        try {
          if (fsSync.existsSync(outputPdf) && fsSync.statSync(outputPdf).size > 100) {
            break;
          }
        } catch (e) {}
        await new Promise(res => setTimeout(res, waitMs));
        tries++;
      }
      if (!fsSync.existsSync(outputPdf) || fsSync.statSync(outputPdf).size < 100) {
        return reject(new Error('PDF file was not created or is empty after conversion.'));
      }
      resolve(outputPdf);
    });
  });
}

// Helper: Extract text from DOCX
async function extractTextFromDocx(docxPath) {
  const pythonPath = 'python';
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '../utils/textExtractor.py');
    const shell = new PythonShell(
      scriptPath,
      { args: [docxPath], pythonPath, env: { ...process.env, PYTHONIOENCODING: 'utf-8' } }
    );
    let output = [];
    let errorOutput = [];
    shell.on('message', (message) => {
      output.push(message);
    });
    shell.on('stderr', (stderr) => {
      console.error('[extractTextFromDocx] PythonShell stderr:', stderr);
      errorOutput.push(stderr);
    });
    shell.on('error', (err) => {
      console.error('[extractTextFromDocx] PythonShell error event:', err);
    });
    shell.end((err, code, signal) => {
      if (err) {
        console.error('[extractTextFromDocx] PythonShell end error:', err);
        if (errorOutput.length > 0) {
          console.error('[extractTextFromDocx] PythonShell stderr collected:', errorOutput.join('\n'));
        }
        return reject(err);
      }
      // Join output and parse JSON
      const finalText = output.join('');
      let parsed;
      try {
        parsed = JSON.parse(finalText);
      } catch (e) {
        console.error('[extractTextFromDocx] Failed to parse JSON:', e, finalText);
        return reject(new Error('Failed to parse extracted text as JSON'));
      }
      resolve(parsed);
    });
  });
}

// Helper: Merge multiple PDFs (using pdf-lib)
async function mergePdfs(pdfPaths, outputPath) {
  const mergedPdf = await PDFDocument.create();
  for (const pdfPath of pdfPaths) {
    const pdfBytes = await fs.readFile(pdfPath);
    const pdf = await PDFDocument.load(pdfBytes);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
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
      if (!req.files["manuscript"] || !req.files["coverLetter"] || !req.files["declaration"]) {
        console.error("[createManuscript] Missing required files.");
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
          console.error("[createManuscript] Error parsing additionalInfo:", e);
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
          console.error("[createManuscript] Error converting author ID:", error);
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
        console.error("[createManuscript] Error converting corresponding author ID:", error);
        return res.status(400).json({
          success: false,
          message: `Invalid corresponding author ID format: ${correspondingAuthorId || req.user._id}`
        });
      }

      // Extract text from all three uploaded DOCX files
      const manuscriptPath = req.files["manuscript"][0].path;
      const coverLetterPath = req.files["coverLetter"][0].path;
      const declarationPath = req.files["declaration"][0].path;
      let manuscriptText = '', coverLetterText = '', declarationText = '';
      let manuscriptTitle = '', manuscriptAbstract = '', manuscriptKeywords = '';
      try {
        const result = await extractTextFromDocx(manuscriptPath);
        manuscriptText = result.full_text || '';
        manuscriptTitle = result.title || '';
        manuscriptAbstract = result.abstract || '';
        manuscriptKeywords = result.keywords || '';
        console.log('[createManuscript] Extracted manuscript title:', manuscriptTitle);
        console.log('[createManuscript] Extracted manuscript abstract:', manuscriptAbstract);
        console.log('[createManuscript] Extracted manuscript keywords:', manuscriptKeywords);
      } catch (err) {
        console.error('[createManuscript] Manuscript text extraction failed:', err);
        manuscriptText = '';
      }
      try {
        const result = await extractTextFromDocx(coverLetterPath);
        coverLetterText = result.full_text || '';
      } catch (err) {
        console.error('[createManuscript] Cover letter text extraction failed:', err);
        coverLetterText = '';
      }
      try {
        const result = await extractTextFromDocx(declarationPath);
        declarationText = result.full_text || '';
      } catch (err) {
        console.error('[createManuscript] Declaration text extraction failed:', err);
        declarationText = '';
      }
      // Convert all DOCX files to PDF before proceeding
      let manuscriptPdfPath, coverLetterPdfPath, declarationPdfPath;
      try {
        manuscriptPdfPath = await convertDocxToPdf(manuscriptPath);
        if (!isValidPdf(manuscriptPdfPath)) {
          console.error('[createManuscript] Manuscript PDF is invalid!');
          return res.status(500).json({ success: false, message: 'Manuscript PDF is invalid after conversion.' });
        }
        coverLetterPdfPath = await convertDocxToPdf(coverLetterPath);
        if (!isValidPdf(coverLetterPdfPath)) {
          console.error('[createManuscript] Cover letter PDF is invalid!');
          return res.status(500).json({ success: false, message: 'Cover letter PDF is invalid after conversion.' });
        }
        declarationPdfPath = await convertDocxToPdf(declarationPath);
        if (!isValidPdf(declarationPdfPath)) {
          console.error('[createManuscript] Declaration PDF is invalid!');
          return res.status(500).json({ success: false, message: 'Declaration PDF is invalid after conversion.' });
        }
      } catch (err) {
        console.error('[createManuscript] DOCX to PDF conversion failed:', err);
        return res.status(500).json({ success: false, message: 'DOCX to PDF conversion failed.' });
      }

      // Create merged PDF with form data table (use the converted PDFs)
      let mergedPdfResult;
      try {
        mergedPdfResult = await createMergedPDFWithTable(
          manuscriptPdfPath,
          coverLetterPdfPath,
          declarationPdfPath,
          {
            ...req.body,
            authors: authorObjectIds,
            correspondingAuthor: correspondingAuthorObjectId
          }
        );
        // Track the merged PDF for cleanup
        tempFiles.push(mergedPdfResult.localPath);
      } catch (err) {
        console.error('[createManuscript] Merged PDF creation failed:', err);
        return res.status(500).json({ success: false, message: 'Merged PDF creation failed.' });
      }

      // Upload all files to Google Drive
      let manuscriptUrl, coverLetterUrl, declarationUrl, mergedUrl;
      try {
        [manuscriptUrl, coverLetterUrl, declarationUrl, mergedUrl] = await Promise.all([
          uploadFile(manuscriptPdfPath, `manuscript_${Date.now()}_${path.basename(req.files["manuscript"][0].originalname)}`),
          uploadFile(coverLetterPdfPath, `cover_letter_${Date.now()}_${path.basename(req.files["coverLetter"][0].originalname)}`),
          uploadFile(declarationPdfPath, `declaration_${Date.now()}_${path.basename(req.files["declaration"][0].originalname)}`),
          uploadFile(mergedPdfResult.localPath, `merged_manuscript_${Date.now()}.pdf`)
        ]);
      } catch (err) {
        console.error('[createManuscript] File upload to Google Drive failed:', err);
        return res.status(500).json({ success: false, message: 'File upload to Google Drive failed.' });
      }

      const manuscriptData = {
        ...req.body,
        authors: authorObjectIds,
        correspondingAuthor: correspondingAuthorObjectId,
        manuscriptFile: manuscriptUrl.webViewLink,
        coverLetterFile: coverLetterUrl.webViewLink,
        declarationFile: declarationUrl.webViewLink,
        mergedFileUrl: mergedUrl.webViewLink,
        status: "Pending",
        extractedText: manuscriptText, // Store extracted text
        coverLetterText: coverLetterText, // Store cover letter text
        declarationText: declarationText, // Store declaration text
        extractedTitle: manuscriptTitle,
        extractedAbstract: manuscriptAbstract,
        extractedKeywords: manuscriptKeywords,
      };

      let manuscript;
      try {
        manuscript = new Manuscript(manuscriptData);
        await manuscript.save();
      } catch (err) {
        console.error('[createManuscript] Manuscript save failed:', err);
        return res.status(500).json({ success: false, message: 'Manuscript save failed.' });
      }

      // Update all authors' manuscripts array and roles
      try {
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
      } catch (err) {
        console.error('[createManuscript] Author update failed:', err);
      }

      // Clean up all temporary files
      try {
        await cleanupFiles(tempFiles);
        tempFiles = []; // Clear the array after successful cleanup
      } catch (err) {
        console.error('[createManuscript] Cleanup failed:', err);
      }

      res.status(201).json({
        success: true,
        data: manuscript,
        mergedPdfUrl: manuscriptData.mergedFileUrl,
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
      await cleanupFiles(tempFiles).catch(cleanupError => {
        console.error("[createManuscript] Error during cleanup after failure:", cleanupError);
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

// Get a single manuscript by ID
exports.getManuscriptById = async (req, res) => {
  try {
    const manuscript = await Manuscript.findById(req.params.manuscriptId)
      .populate('authors', 'firstName lastName email')
      .populate('correspondingAuthor', 'firstName lastName email')
      .populate('assignedReviewers', 'firstName lastName email');

    if (!manuscript) {
      return res.status(404).json({ 
        success: false, 
        message: "Manuscript not found" 
      });
    }

    res.json({
      success: true,
      data: manuscript
    });
  } catch (error) {
    console.error("Error fetching manuscript:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Endpoint: Build and download merged PDF (table + manuscript + cover letter + declaration)
exports.buildAndDownloadPdf = async (req, res) => {
  let tempFiles = [];
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
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
      // Convert DOCX files to PDF
      const manuscriptPdf = await convertDocxToPdf(req.files["manuscript"][0].path);
      const coverLetterPdf = await convertDocxToPdf(req.files["coverLetter"][0].path);
      const declarationPdf = await convertDocxToPdf(req.files["declaration"][0].path);
      tempFiles.push(manuscriptPdf, coverLetterPdf, declarationPdf);
      // Extract text from manuscript
      const manuscriptText = await extractTextFromDocx(req.files["manuscript"][0].path);
      // Create table PDF (reuse your existing function)
      const tablePdfResult = await createMergedPDFWithTable(
        manuscriptPdf,
        coverLetterPdf,
        declarationPdf,
        req.body // or the relevant form data
      );
      const tablePdfPath = tablePdfResult.localPath;
      tempFiles.push(tablePdfPath);
      // Merge all four PDFs
      const mergedPdfPath = path.join(os.tmpdir(), `final_merged_${Date.now()}.pdf`);
      await mergePdfs([
        tablePdfPath,
        manuscriptPdf,
        coverLetterPdf,
        declarationPdf
      ], mergedPdfPath);
      tempFiles.push(mergedPdfPath);
      // Send merged PDF for download
      res.download(mergedPdfPath, 'merged_manuscript.pdf', async (err) => {
        // Clean up all temporary files after download (or error)
        await cleanupFiles(tempFiles);
      });
    });
  } catch (error) {
    if (tempFiles.length > 0) {
      await cleanupFiles(tempFiles).catch(() => {});
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.extractManuscriptInfo = async (req, res) => {
  // Use multer to handle the file upload
  const multer = require('multer');
  const os = require('os');
  const path = require('path');
  const fs = require('fs').promises;
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, os.tmpdir());
    },
    filename: function (req, file, cb) {
      cb(null, `temp_extract_${Date.now()}${path.extname(file.originalname)}`);
    },
  });
  const upload = multer({ storage: storage }).single('manuscript');

  upload(req, res, async function (err) {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No manuscript file uploaded.' });
    }
    try {
      const result = await extractTextFromDocx(req.file.path);
      // Clean up the temp file
      await fs.unlink(req.file.path);
      return res.status(200).json({
        success: true,
        extractedTitle: result.title || '',
        extractedAbstract: result.abstract || '',
        extractedKeywords: result.keywords || '',
        extractedText: result.full_text || ''
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Extraction failed.', error: error.message });
    }
  });
};

module.exports.convertDocxToPdf = convertDocxToPdf;
module.exports.isValidPdf = isValidPdf;