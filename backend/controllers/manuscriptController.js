const Manuscript = require("../models/Manuscript");
const multer = require("multer");
const path = require("path");
const { pipeline } = require("stream");
const { promisify } = require("util");
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
const {
  generateUniqueManuscriptId,
} = require("../utils/manuscriptIdGenerator");
const fsSync = require("fs"); // Add at the top if not already
const axios = require("axios");
const FormData = require("form-data");
// At the top of manuscriptController.js
const { uploadToCloudinary } = require("../utils/cloudinary");
const {
  buildPublishedManuscriptKey,
  deletePublishedManuscriptFromS3,
  getPublishedManuscriptFromS3,
  getPublishedManuscriptPublicUrl,
  uploadPublishedManuscriptToS3,
} = require("../services/s3Service");
const {
  uploadFileToDrive,
  deleteFileFromDrive,
  downloadDriveFileToTemp,
} = require("../services/googleDriveOAuth");
const sendEmail = require("../utils/sendEmail");
const pdfParse = require("pdf-parse");
// const { console } = require("inspector");
const {
  createJob,
  getJob,
  updateJob,
  completeJob,
  failJob,
  STATUS,
} = require("../utils/jobProcessor");

const streamPipeline = promisify(pipeline);

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
      `temp_${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`,
    );
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    // 🔥 Allow both PDF and DOCX
    const allowedTypes = /docx|pdf/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );

    if (extname) {
      return cb(null, true);
    }

    cb(
      new Error("Only Word documents (.docx) or PDF files (.pdf) are allowed!"),
    );
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
      path.extname(file.originalname).toLowerCase(),
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

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
    `${prefix}_${Date.now()}${extension}`,
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

const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);

async function convertDocxToPdf(docxPath, onProgress) {
  console.log("\n" + "=".repeat(70));
  console.log("📄 DOCX TO PDF CONVERSION");
  console.log("=".repeat(70));

  if (!fsSync.existsSync(docxPath)) {
    throw new Error(`File not found: ${docxPath}`);
  }

  const fileStats = fsSync.statSync(docxPath);
  const fileSizeMB = (fileStats.size / (1024 * 1024)).toFixed(2);

  console.log("Input file:", path.basename(docxPath));
  console.log("File size:", fileSizeMB, "MB");
  console.log("Platform:", process.platform);

  const errors = [];
  const progress = (percent, step) => {
    console.log(`[${percent}%] ${step}`);
    try {
      if (typeof onProgress === "function") {
        onProgress(
          Math.max(0, Math.min(100, Math.round(percent))),
          step || "Converting...",
        );
      }
    } catch (_) { }
  };

  const outputDir = path.dirname(docxPath);
  const fileName = path.basename(docxPath, path.extname(docxPath));
  const expectedPdfPath = path.join(outputDir, `${fileName}.pdf`);

  // ========================================================
  // 🥇 METHOD 1: LOCAL LibreOffice
  // ========================================================
  console.log("\n┌─────────────────────────────────────────┐");
  console.log("│   METHOD 1: LOCAL LibreOffice           │");
  console.log("└─────────────────────────────────────────┘");

  progress(5, "Checking local LibreOffice...");

  try {
    let workingPath = null;

    if (process.platform === "win32") {
      // Windows paths
      const windowsPaths = [
        "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
        "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
        "C:\\Program Files\\LibreOffice 7\\program\\soffice.exe",
        "C:\\Program Files\\LibreOffice 24\\program\\soffice.exe",
        process.env.LIBREOFFICE_PATH,
      ].filter(Boolean);

      for (const p of windowsPaths) {
        console.log(`Checking: ${p}`);
        if (fsSync.existsSync(p)) {
          workingPath = p;
          console.log("✅ Found at:", p);
          break;
        }
      }
    } else {
      // 🔥🔥🔥 LINUX/DOCKER: Use EXACT same approach as test-docx-convert
      // Just use the path directly - we KNOW it works from test!
      const loPath = "/usr/bin/libreoffice";
      console.log(`Using Docker path: ${loPath}`);
      workingPath = loPath; // 🔥 Direct assignment - no check needed!
    }

    if (workingPath) {
      progress(10, "Starting local conversion...");

      // 🔥 EXACT same profile setup as test-docx-convert
      const profileDir = path.join(
        os.tmpdir(),
        `lo-profile-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      );

      try {
        let command;

        if (process.platform === "win32") {
          command = `"${workingPath}" --headless --invisible --nodefault --nofirststartwizard --nolockcheck --nologo --norestore --convert-to pdf --outdir "${outputDir}" "${docxPath}"`;
        } else {
          // 🔥🔥🔥 EXACT same command as test-docx-convert (PROVEN TO WORK!)
          command = `${workingPath} --headless --nofirststartwizard --norestore "-env:UserInstallation=file://${profileDir}" --convert-to pdf --outdir "${outputDir}" "${docxPath}"`;
        }

        console.log("Command:", command);

        progress(30, `Converting ${fileSizeMB}MB file...`);

        const startTime = Date.now();

        // 🔥🔥🔥 EXACT same exec options as test-docx-convert
        const { stdout, stderr } = await execPromise(command, {
          timeout: 120000,
          maxBuffer: 10 * 1024 * 1024,
          env: {
            ...process.env,
            HOME: process.env.HOME || "/tmp",
          },
        });

        const duration = Date.now() - startTime;
        console.log("✅ Command completed in", duration, "ms");
        if (stdout) console.log("stdout:", stdout.trim());
        if (stderr) console.log("stderr:", stderr.trim());

        progress(70, "Verifying PDF...");

        // Wait for file system
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Cleanup profile
        try {
          fsSync.rmSync(profileDir, { recursive: true, force: true });
        } catch (e) { }

        // Check PDF
        if (fsSync.existsSync(expectedPdfPath)) {
          const pdfStats = fsSync.statSync(expectedPdfPath);
          console.log(
            "✅ PDF created:",
            (pdfStats.size / 1024).toFixed(2),
            "KB",
          );

          if (pdfStats.size > 500 && isValidPdf(expectedPdfPath)) {
            console.log("✅ PDF is valid!");
            progress(100, "Conversion complete!");
            console.log("\n🎉 LOCAL LIBREOFFICE SUCCESS!\n");
            return expectedPdfPath;
          } else {
            console.log("❌ PDF invalid or too small");
            errors.push("local: PDF invalid");
          }
        } else {
          console.log("❌ PDF not found at:", expectedPdfPath);
          const files = fsSync.readdirSync(outputDir);
          console.log("Files in dir:", files);
          errors.push("local: PDF not created");
        }
      } catch (cmdError) {
        console.error("❌ Command failed:", cmdError.message);
        if (cmdError.stderr) console.error("stderr:", cmdError.stderr);
        errors.push(`local: ${cmdError.message}`);

        // Cleanup
        try {
          fsSync.rmSync(profileDir, { recursive: true, force: true });
        } catch (e) { }
      }
    } else {
      errors.push("local: LibreOffice path not set");
    }
  } catch (error) {
    console.error("❌ Local method error:", error.message);
    errors.push(`local: ${error.message}`);
  }

  // ========================================================
  // 🥈 METHOD 2: Remote Service
  // ========================================================
  console.log("\n┌─────────────────────────────────────────┐");
  console.log("│   METHOD 2: REMOTE Converter            │");
  console.log("└─────────────────────────────────────────┘");

  const useRemote =
    (process.env.USE_REMOTE_CONVERTER || "true").toLowerCase() !== "false";

  if (useRemote) {
    progress(40, "Trying remote converter...");

    const url = "https://power-gw9d.onrender.com/api/convert/docx-to-pdf";
    console.log("Trying:", url);

    try {
      const formData = new FormData();
      formData.append(
        "file",
        fsSync.createReadStream(docxPath),
        path.basename(docxPath),
      );

      progress(50, "Uploading...");

      const response = await axios.post(url, formData, {
        headers: {
          ...formData.getHeaders(),
          Accept: "application/pdf",
        },
        responseType: "arraybuffer",
        timeout: 180000,
        maxContentLength: 100 * 1024 * 1024,
        maxBodyLength: 100 * 1024 * 1024,
      });

      const contentType = (
        response.headers?.["content-type"] || ""
      ).toLowerCase();

      if (contentType.includes("pdf")) {
        progress(70, "Saving PDF...");

        const pdfBuffer = Buffer.from(response.data);
        await fs.writeFile(expectedPdfPath, pdfBuffer);

        console.log("✅ Remote conversion successful");
        progress(100, "Conversion complete!");
        return expectedPdfPath;
      }

      errors.push("remote: wrong content type");
    } catch (error) {
      console.log("❌ Remote failed:", error.message);
      errors.push(`remote: ${error.message}`);
    }
  }

  // All failed
  console.error("\n❌ ALL METHODS FAILED");
  console.error("Errors:", errors.join(" | "));

  throw new Error(`PDF conversion failed: ${errors.join(" | ")}`);
}

// Helper function to extract abstract from text
function extractAbstract(text) {
  const lines = text.split("\n").filter((line) => line.trim());
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (line.startsWith("abstract")) {
      if (line.split(" ").length > 1) {
        return line.substring(8).trim(": .-");
      } else {
        // Abstract is on next lines
        const abstractLines = [];
        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j].toLowerCase();
          if (
            nextLine === "" ||
            nextLine.startsWith(
              ("keywords", "key words", "introduction", "background"),
            )
          ) {
            break;
          }
          abstractLines.push(lines[j]);
        }
        return abstractLines.join(" ");
      }
    }
  }
  return "Document abstract could not be extracted automatically.";
}

// Helper function to extract keywords from text
function extractKeywords(text) {
  const lines = text.split("\n").filter((line) => line.trim());
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
  console.log("extractTextFromDocx");
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
      console.error("[extractTextFromDocx] PythonShell error event:", err);
    });
    shell.end((err, code, signal) => {
      if (err) {
        console.error("[extractTextFromDocx] PythonShell end error:", err);
        if (errorOutput.length > 0) {
          console.error(
            "[extractTextFromDocx] PythonShell stderr collected:",
            errorOutput.join("\n"),
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
          finalText,
        );
        return reject(new Error("Failed to parse extracted text as JSON"));
      }
      resolve(parsed);
    });
  });
}

// Helper: Create merged PDF with table and documents
async function createMergedPDFWithTable(
  manuscriptPath,
  coverLetterPath,
  declarationPath,
  formData,
  manuscriptId = null,
) {
  try {
    console.log("[createMergedPDFWithTable] Starting merge process...");

    // Convert DOCX files to PDF if needed
    const manuscriptPdf = manuscriptPath.endsWith(".pdf")
      ? manuscriptPath
      : await convertDocxToPdf(manuscriptPath);
    const coverLetterPdf = coverLetterPath.endsWith(".pdf")
      ? coverLetterPath
      : await convertDocxToPdf(coverLetterPath);
    const declarationPdf = declarationPath.endsWith(".pdf")
      ? declarationPath
      : await convertDocxToPdf(declarationPath);

    // Create table PDF with form data
    const tablePdf = await createTablePdf(formData, manuscriptId);

    // Create output path using manuscript ID or timestamp as fallback
    const fileName = manuscriptId
      ? `manuscript_${manuscriptId}.pdf`
      : `merged_${Date.now()}.pdf`;
    const outputPath = path.join(os.tmpdir(), fileName);

    // Merge all PDFs with line numbering
    await mergePdfs(
      [tablePdf, manuscriptPdf, coverLetterPdf, declarationPdf],
      outputPath,
    );

    // Clean up temporary table PDF
    try {
      await fs.unlink(tablePdf);
    } catch (e) {
      console.warn(
        "[createMergedPDFWithTable] Failed to cleanup table PDF:",
        e.message,
      );
    }

    console.log("[createMergedPDFWithTable] Merge completed successfully");

    return {
      localPath: outputPath,
      success: true,
    };
  } catch (error) {
    console.error("[createMergedPDFWithTable] Error:", error);
    throw new Error(`Merged PDF creation failed: ${error.message}`);
  }
}

// Helper: Create table PDF with form data
// Helper: Create table PDF with form data
async function createTablePdf(formData, manuscriptId = null) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // US Letter size
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const margin = 50;
  let currentY = page.getHeight() - margin;

  console.log("[createTablePdf] Creating table PDF with form data...");
  console.log(
    "[createTablePdf] authorNamesForPdf:",
    formData.authorNamesForPdf,
  );
  console.log(
    "[createTablePdf] correspondingNamesForPdf:",
    formData.correspondingNamesForPdf,
  );

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
  const labelWidth = tableWidth * 0.3;
  const valueWidth = tableWidth * 0.7;
  const rowHeight = 25;
  const cellPadding = 8;

  // Helper function to draw a table row with better height management
  const drawTableRow = (label, value, isHeader = false) => {
    const displayValue = Array.isArray(value) ? value.join(", ") : value || "";
    const useFont = isHeader ? boldFont : font;
    const fontSize = isHeader ? 14 : 11;

    const maxValueWidth = valueWidth - 2 * cellPadding;
    let valueText = displayValue.toString();
    let actualRowHeight = rowHeight;

    if (font.widthOfTextAtSize(valueText, fontSize) > maxValueWidth) {
      const words = valueText.split(" ");
      let lines = 1;
      let line = "";

      for (const word of words) {
        const testLine = line + (line ? " " : "") + word;
        if (
          font.widthOfTextAtSize(testLine, fontSize) > maxValueWidth &&
          line
        ) {
          lines++;
          line = word;
        } else {
          line = testLine;
        }
      }
      const maxLines = Math.min(lines, 3);
      actualRowHeight = Math.max(rowHeight, maxLines * 14 + 10);
    }

    if (currentY - actualRowHeight < 50) {
      console.log(
        `[createTablePdf] Truncating content for ${label} to fit on page`,
      );
      const maxChars = Math.floor(maxValueWidth / (fontSize * 0.6));
      if (valueText.length > maxChars) {
        valueText = valueText.substring(0, maxChars - 3) + "...";
      }
      actualRowHeight = rowHeight;
    }

    const bgColor = isHeader ? rgb(0.9, 0.9, 0.9) : rgb(0.98, 0.98, 0.98);
    page.drawRectangle({
      x: margin,
      y: currentY - actualRowHeight + 5,
      width: tableWidth,
      height: actualRowHeight,
      color: bgColor,
    });

    page.drawRectangle({
      x: margin,
      y: currentY - actualRowHeight + 5,
      width: tableWidth,
      height: actualRowHeight,
      borderColor: rgb(0.7, 0.7, 0.7),
      borderWidth: 1,
    });

    page.drawLine({
      start: { x: margin + labelWidth, y: currentY - actualRowHeight + 5 },
      end: { x: margin + labelWidth, y: currentY + 5 },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });

    page.drawText(label, {
      x: margin + cellPadding,
      y: currentY - actualRowHeight / 2 - 3,
      size: fontSize,
      font: useFont,
      color: rgb(0, 0, 0),
    });

    if (font.widthOfTextAtSize(valueText, fontSize) > maxValueWidth) {
      const words = valueText.split(" ");
      let lines = [];
      let currentLine = "";

      for (const word of words) {
        const testLine = currentLine + (currentLine ? " " : "") + word;
        if (
          font.widthOfTextAtSize(testLine, fontSize) > maxValueWidth &&
          currentLine
        ) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        lines.push(currentLine);
      }

      if (lines.length > 3) {
        lines = lines.slice(0, 2);
        lines.push(
          lines[1].substring(
            0,
            Math.floor(maxValueWidth / (fontSize * 0.6)) - 3,
          ) + "...",
        );
      }

      lines.forEach((line, index) => {
        page.drawText(line, {
          x: margin + labelWidth + cellPadding,
          y:
            currentY -
            actualRowHeight / 2 -
            3 +
            (lines.length - 1 - index) * 12,
          size: fontSize,
          font: font,
          color: rgb(0, 0, 0),
        });
      });
    } else {
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

  // Draw table rows
  drawTableRow("Article Type", formData.type);
  drawTableRow("Title", formData.title ? formData.title.substring(0, 200) : "");
  drawTableRow(
    "Keywords",
    formData.keywords ? formData.keywords.substring(0, 150) : "",
  );

  let abstractText = formData.abstract || "";
  if (abstractText.length > 300) {
    abstractText = abstractText.substring(0, 300) + "...";
  }
  drawTableRow("Abstract", abstractText);

  drawTableRow("Classification", formData.classification);
  drawTableRow(
    "Additional Information",
    formData.additionalInfo ? formData.additionalInfo.substring(0, 100) : "",
  );
  drawTableRow(
    "Comments",
    formData.comments ? formData.comments.substring(0, 100) : "",
  );
  drawTableRow("Funding", formData.funding);

  if (formData.funding === "Yes" && formData?.billingInfo) {
    drawTableRow(
      "Find a Funder",
      formData?.billingInfo?.findFunder || "Not provided",
    );
    drawTableRow(
      "Award Number",
      formData?.billingInfo?.awardNumber || "Not provided",
    );
    drawTableRow(
      "Grant Recipient",
      formData?.billingInfo?.grantRecipient || "Not provided",
    );
  }

  drawTableRow("Submission Date", new Date().toLocaleString());

  // ===================================
  // 🔥 FIXED AUTHOR LOGIC START
  // ===================================

  // Priority 1: Use new frontend fields (authorNamesForPdf, correspondingNamesForPdf)
  if (formData.authorNamesForPdf) {
    console.log(
      "[createTablePdf] Using authorNamesForPdf:",
      formData.authorNamesForPdf,
    );
    drawTableRow("Authors", formData.authorNamesForPdf);
  }
  // Priority 2: Use authorsForPdf array
  else if (formData.authorsForPdf) {
    try {
      const authorsForPdf =
        typeof formData.authorsForPdf === "string"
          ? JSON.parse(formData.authorsForPdf)
          : formData.authorsForPdf;

      console.log("[createTablePdf] Using authorsForPdf array:", authorsForPdf);

      const authorNames = authorsForPdf
        .map((author) => {
          return (
            author.fullName ||
            `${author.firstName || ""} ${author.lastName || ""}`.trim()
          );
        })
        .join(", ");

      drawTableRow("Authors", authorNames);
    } catch (e) {
      console.error("[createTablePdf] Error parsing authorsForPdf:", e);
    }
  }
  // Priority 3: Fallback to old authorsData (for backward compatibility)
  else if (formData.authorsData) {
    try {
      const authors =
        typeof formData.authorsData === "string"
          ? JSON.parse(formData.authorsData)
          : formData.authorsData;

      console.log("[createTablePdf] Fallback: Using authorsData");

      // 🔥 NO EMAILS - Only names
      const authorNames = authors
        .map((author) => {
          const name =
            `${author.firstName || ""} ${author.lastName || ""}`.trim();
          return name;
        })
        .join(", ");

      drawTableRow("Authors", authorNames);
    } catch (error) {
      console.error("[createTablePdf] Error processing authorsData:", error);
    }
  }

  // Corresponding Author(s)
  // Priority 1: Use correspondingNamesForPdf (multiple corresponding authors with emails)
  if (formData.correspondingNamesForPdf) {
    console.log(
      "[createTablePdf] Using correspondingNamesForPdf:",
      formData.correspondingNamesForPdf,
    );
    drawTableRow("Corresponding Author(s)", formData.correspondingNamesForPdf);
  }
  // Priority 2: Use correspondingAuthorsForPdf array
  else if (formData.correspondingAuthorsForPdf) {
    try {
      const correspondingAuthors =
        typeof formData.correspondingAuthorsForPdf === "string"
          ? JSON.parse(formData.correspondingAuthorsForPdf)
          : formData.correspondingAuthorsForPdf;

      console.log(
        "[createTablePdf] Using correspondingAuthorsForPdf array:",
        correspondingAuthors,
      );

      const correspondingNames = correspondingAuthors
        .map((author) => {
          const name =
            author.fullName ||
            `${author.firstName || ""} ${author.lastName || ""}`.trim();
          const email = author.email ? ` (${author.email})` : "";
          return `${name}${email}`;
        })
        .join(", ");

      drawTableRow("Corresponding Author(s)", correspondingNames);
    } catch (e) {
      console.error(
        "[createTablePdf] Error parsing correspondingAuthorsForPdf:",
        e,
      );
    }
  }
  // Priority 3: Fallback to single correspondingAuthorId
  else if (formData.authorsData && formData.correspondingAuthorId) {
    try {
      const authors =
        typeof formData.authorsData === "string"
          ? JSON.parse(formData.authorsData)
          : formData.authorsData;

      const correspondingAuthor = authors.find(
        (a) => a._id?.toString() === formData.correspondingAuthorId?.toString(),
      );

      if (correspondingAuthor) {
        const corrName =
          `${correspondingAuthor.firstName || ""} ${correspondingAuthor.lastName || ""}`.trim();
        const corrEmail = correspondingAuthor.email
          ? ` (${correspondingAuthor.email})`
          : "";
        drawTableRow("Corresponding Author", `${corrName}${corrEmail}`);
      }
    } catch (error) {
      console.error(
        "[createTablePdf] Error finding corresponding author:",
        error,
      );
    }
  }

  // ===================================
  // 🔥 FIXED AUTHOR LOGIC END
  // ===================================

  const tableFileName = manuscriptId
    ? `table_${manuscriptId}.pdf`
    : `table_${Date.now()}.pdf`;
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
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  // Add line numbering and page numbers starting from the second page
  // First page is the metadata table and should remain unnumbered.
  const pages = mergedPdf.getPages();
  const font = await mergedPdf.embedFont(StandardFonts.Helvetica);

  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    const page = pages[pageIndex];
    const { width, height } = page.getSize();
    const isTablePage = pageIndex === 0;

    if (!isTablePage) {
      // Calculate number of lines based on page height
      const lineHeight = 14; // adjust as needed to match your sample
      const topMargin = 72; // 1 inch from top
      const bottomMargin = 72; // 1 inch from bottom
      const leftMargin = 20; // place numbers in left margin
      const usableHeight = height - topMargin - bottomMargin;
      const numberOfLines = Math.floor(usableHeight / lineHeight);

      // Per-page line numbering starting at 1 on each content page
      for (let i = 0; i < numberOfLines; i++) {
        const yPosition = height - topMargin - i * lineHeight;
        const lineNum = String(i + 1);
        const textWidth = font.widthOfTextAtSize(lineNum, 9);

        page.drawText(lineNum, {
          x: leftMargin - textWidth, // right-align to the left margin
          y: yPosition - 10,
          size: 9,
          font: font,
          color: rgb(0.2, 0.2, 0.2),
        });
      }

      // Add page number at bottom center.
      // Physical page index 1 (second page) should display "Page 2", etc.
      page.drawText(`Page ${pageIndex + 1}`, {
        x: width / 2 - 20,
        y: bottomMargin / 2,
        size: 9,
        font: font,
        color: rgb(0.3, 0.3, 0.3),
      });
    }
  }

  const mergedPdfBytes = await mergedPdf.save();
  await fs.writeFile(outputPath, mergedPdfBytes);
  return outputPath;
}

exports.createManuscript = async (req, res) => {
  let tempFiles = [];

  console.log("[createManuscript] Request body:", req.body);
  console.log("[createManuscript] Request files:", req.files);

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

      // ═══════════════════════════════════════════════════════════
      // 🔥 Store original DOCX paths for uploading
      // ═══════════════════════════════════════════════════════════
      const manuscriptDocxPath = req.files["manuscript"][0].path;
      const coverLetterDocxPath = req.files["coverLetter"][0].path;
      const declarationDocxPath = req.files["declaration"][0].path;

      // Convert additionalInfo array to string if it exists
      if (req.body.additionalInfo) {
        try {
          const additionalInfoArray = JSON.parse(req.body.additionalInfo);
          req.body.additionalInfo = additionalInfoArray.join(", ");
        } catch (e) {
          console.error("[createManuscript] Error parsing additionalInfo:", e);
        }
      }

      // Parse billingInfo if it exists
      if (req.body.billingInfo) {
        try {
          req.body.billingInfo = JSON.parse(req.body.billingInfo);
          console.log(
            "[createManuscript] Parsed billingInfo:",
            req.body.billingInfo,
          );
        } catch (e) {
          console.error("[createManuscript] Error parsing billingInfo:", e);
          req.body.billingInfo = {};
        }
      }

      // Handle authors and roles
      const authors = req.body.authors ? JSON.parse(req.body.authors) : [];
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
            message:
              "At least one author is required when an editor submits on behalf of an author",
          });
        }
        if (!correspondingAuthorId) {
          return res.status(400).json({
            success: false,
            message:
              "correspondingAuthorId is required when an editor submits on behalf of an author",
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
            error,
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
            correspondingAuthorId || (req.user && req.user._id),
          )
        ) {
          correspondingAuthorObjectId = new mongoose.Types.ObjectId(
            correspondingAuthorId || (req.user && req.user._id),
          );
        } else {
          throw new Error(
            `Invalid corresponding author ID: ${correspondingAuthorId || (req.user && req.user._id)}`,
          );
        }
      } catch (error) {
        console.error(
          "[createManuscript] Error converting corresponding author ID:",
          error,
        );
        return res.status(400).json({
          success: false,
          message: `Invalid corresponding author ID format: ${correspondingAuthorId || (req.user && req.user._id)}`,
        });
      }

      // ═══════════════════════════════════════════════════════════
      // 🔥 Extract text from DOCX files
      // ═══════════════════════════════════════════════════════════
      let manuscriptText = "",
        coverLetterText = "",
        declarationText = "";
      let manuscriptTitle = "",
        manuscriptAbstract = "",
        manuscriptKeywords = "";

      try {
        const result = await extractTextFromDocx(manuscriptDocxPath);
        manuscriptText = result.full_text || "";
        manuscriptTitle = result.title || "";
        manuscriptAbstract = result.abstract || "";
        manuscriptKeywords = result.keywords || "";
        console.log(
          "[createManuscript] Extracted manuscript title:",
          manuscriptTitle,
        );
      } catch (err) {
        console.error(
          "[createManuscript] Manuscript text extraction failed:",
          err,
        );
      }

      try {
        const result = await extractTextFromDocx(coverLetterDocxPath);
        coverLetterText = result.full_text || "";
      } catch (err) {
        console.error(
          "[createManuscript] Cover letter text extraction failed:",
          err,
        );
      }

      try {
        const result = await extractTextFromDocx(declarationDocxPath);
        declarationText = result.full_text || "";
      } catch (err) {
        console.error(
          "[createManuscript] Declaration text extraction failed:",
          err,
        );
      }

      // ═══════════════════════════════════════════════════════════
      // 🔥 Convert DOCX to PDF (ONLY for merged PDF creation)
      // Individual files are stored as DOCX, but PDF needed for merging
      // ═══════════════════════════════════════════════════════════
      let manuscriptPdfPath, coverLetterPdfPath, declarationPdfPath;
      try {
        console.log("[createManuscript] Converting DOCX to PDF for merging...");

        manuscriptPdfPath = await convertDocxToPdf(manuscriptDocxPath);
        if (!isValidPdf(manuscriptPdfPath)) {
          console.error("[createManuscript] Manuscript PDF is invalid!");
          return res.status(500).json({
            success: false,
            message: "Manuscript PDF is invalid after conversion.",
          });
        }

        coverLetterPdfPath = await convertDocxToPdf(coverLetterDocxPath);
        if (!isValidPdf(coverLetterPdfPath)) {
          console.error("[createManuscript] Cover letter PDF is invalid!");
          return res.status(500).json({
            success: false,
            message: "Cover letter PDF is invalid after conversion.",
          });
        }

        declarationPdfPath = await convertDocxToPdf(declarationDocxPath);
        if (!isValidPdf(declarationPdfPath)) {
          console.error("[createManuscript] Declaration PDF is invalid!");
          return res.status(500).json({
            success: false,
            message: "Declaration PDF is invalid after conversion.",
          });
        }

        // Track generated PDFs for cleanup
        tempFiles.push(manuscriptPdfPath);
        tempFiles.push(coverLetterPdfPath);
        tempFiles.push(declarationPdfPath);

        console.log("[createManuscript] PDF conversion completed for merging");
      } catch (err) {
        console.error("[createManuscript] DOCX to PDF conversion failed:", err);
        return res.status(500).json({
          success: false,
          message: err.message || "DOCX to PDF conversion failed.",
        });
      }

      // Generate custom manuscript ID using title
      let customManuscriptId;
      try {
        const manuscriptTitleForId = req.body.title || "Untitled";
        customManuscriptId =
          await generateUniqueManuscriptId(manuscriptTitleForId);
        console.log(
          "[createManuscript] Generated custom ID:",
          customManuscriptId,
        );
      } catch (err) {
        console.error("[createManuscript] Custom ID generation failed:", err);
        return res.status(500).json({
          success: false,
          message: "Manuscript ID generation failed.",
        });
      }

      // ═══════════════════════════════════════════════════════════
      // 🔥 UPDATED: Upload DOCX files to Google Drive (not PDF)
      // Individual files are stored as DOCX format
      // ═══════════════════════════════════════════════════════════
      let manuscriptDriveMeta, coverLetterDriveMeta, declarationDriveMeta;
      try {
        console.log(
          "[createManuscript] Uploading DOCX files to Google Drive...",
        );

        [manuscriptDriveMeta, coverLetterDriveMeta, declarationDriveMeta] =
          await Promise.all([
            // 🔥 Upload original DOCX files (not PDF)
            uploadFileToDrive(manuscriptDocxPath, {
              filename: `manuscript_${customManuscriptId}.docx`, // 🔥 .docx extension
            }),
            uploadFileToDrive(coverLetterDocxPath, {
              filename: `cover_letter_${customManuscriptId}.docx`, // 🔥 .docx extension
            }),
            uploadFileToDrive(declarationDocxPath, {
              filename: `declaration_${customManuscriptId}.docx`, // 🔥 .docx extension
            }),
          ]);

        console.log("[createManuscript] DOCX files uploaded to Drive", {
          manuscript: manuscriptDriveMeta.driveFileId,
          coverLetter: coverLetterDriveMeta.driveFileId,
          declaration: declarationDriveMeta.driveFileId,
        });
      } catch (err) {
        console.error("[createManuscript] Drive upload failed:", err);
        return res.status(500).json({
          success: false,
          message: "File upload to Google Drive failed.",
        });
      }

      // Create manuscript data object
      const manuscriptData = {
        ...req.body,
        customId: customManuscriptId,
        authors: authorObjectIds,
        correspondingAuthor: correspondingAuthorObjectId,

        // 🔥 DOCX URLs for individual files
        manuscriptFile: manuscriptDriveMeta.driveViewUrl,
        coverLetterFile: coverLetterDriveMeta.driveViewUrl,
        declarationFile: declarationDriveMeta.driveViewUrl,

        // Drive file IDs
        manuscriptDriveFileId: manuscriptDriveMeta.driveFileId,
        manuscriptDriveViewUrl: manuscriptDriveMeta.driveViewUrl,
        coverLetterDriveFileId: coverLetterDriveMeta.driveFileId,
        coverLetterDriveViewUrl: coverLetterDriveMeta.driveViewUrl,
        declarationDriveFileId: declarationDriveMeta.driveFileId,
        declarationDriveViewUrl: declarationDriveMeta.driveViewUrl,

        status: "Saved",
        extractedText: manuscriptText,
        coverLetterText: coverLetterText,
        declarationText: declarationText,
        extractedTitle: manuscriptTitle,
        extractedAbstract: manuscriptAbstract,
        extractedKeywords: manuscriptKeywords,
      };

      // Save manuscript to database
      let manuscript;
      try {
        manuscript = new Manuscript(manuscriptData);
        await manuscript.save();
        console.log(
          "[createManuscript] Manuscript saved with custom ID:",
          customManuscriptId,
        );
      } catch (err) {
        console.error("[createManuscript] Manuscript save failed:", err);
        return res.status(500).json({
          success: false,
          message: "Manuscript save failed.",
        });
      }

      // ═══════════════════════════════════════════════════════════
      // 🔥 Create merged PDF (using converted PDFs)
      // Merged PDF is still in PDF format for proper merging
      // ═══════════════════════════════════════════════════════════
      let mergedPdfResult;
      try {
        console.log("[createManuscript] Creating merged PDF...");

        mergedPdfResult = await createMergedPDFWithTable(
          manuscriptPdfPath, // PDF for merging
          coverLetterPdfPath, // PDF for merging
          declarationPdfPath, // PDF for merging
          {
            ...req.body,
            authors: authorObjectIds,
            correspondingAuthor: correspondingAuthorObjectId,
          },
          customManuscriptId,
        );

        // Track the merged PDF for cleanup
        tempFiles.push(mergedPdfResult.localPath);

        // 🔥 Upload merged PDF to Google Drive (merged file stays as PDF)
        const mergedDriveMeta = await uploadFileToDrive(
          mergedPdfResult.localPath,
          { filename: `manuscript_${customManuscriptId}_merged.pdf` }, // Merged is PDF
        );

        // Update manuscript with merged PDF Drive info
        manuscript.mergedFileUrl = mergedDriveMeta.driveViewUrl;
        manuscript.mergedDriveFileId = mergedDriveMeta.driveFileId;
        manuscript.mergedDriveViewUrl = mergedDriveMeta.driveViewUrl;
        await manuscript.save();

        console.log(
          "[createManuscript] Merged PDF created and uploaded:",
          mergedDriveMeta.driveViewUrl,
        );
      } catch (err) {
        console.error("[createManuscript] Merged PDF creation failed:", err);
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
            { new: true },
          );
        }
      } catch (err) {
        console.error("[createManuscript] Author update failed:", err);
      }

      // Clean up all temporary files
      try {
        await cleanupFiles(tempFiles);
        tempFiles = [];
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
    if (tempFiles.length > 0) {
      await cleanupFiles(tempFiles).catch((cleanupError) => {
        console.error(
          "[createManuscript] Error during cleanup after failure:",
          cleanupError,
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
          const additionalInfoArray = JSON.parse(req.body.additionalInfo);
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
        ...(req.files["declaration"] ? [req.files["declaration"][0].path] : []),
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
          manuscriptData,
        );

        // Track merged PDF for cleanup
        tempFiles.push(mergedPdfResult.localPath);

        // Upload preview to local storage
        const localFileUploadManager = new FileUploadManager();
        localFileUploadManager.useGoogleDrive = false;
        const driveUploadResult = await localFileUploadManager.uploadFile(
          mergedPdfResult.localPath,
          `preview_${Date.now()}.pdf`,
          "merged",
        );

        // Clean up all temporary files
        await cleanupFiles(tempFiles);
        tempFiles = [];

        res.status(200).json({
          success: true,
          mergedPdfUrl:
            driveUploadResult.webViewLink || driveUploadResult.webContentLink,
        });
      } else {
        throw new Error(
          "All three files: manuscript, cover letter and declaration files are required",
        );
      }
    });
  } catch (error) {
    // Clean up any remaining temporary files in case of error
    if (tempFiles.length > 0) {
      await cleanupFiles(tempFiles).catch((cleanupError) => {
        console.error("Error during cleanup after failure:", cleanupError);
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
      if ((currentManuscript.revisionAttempts || 0) >= maxAttempts) {
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
      { new: true },
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
    const userId =
      (req.user && req.user._id && req.user._id.toString()) || null;
    if (!userId || !authorIds.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to withdraw this manuscript",
      });
    }

    await User.updateMany(
      { _id: { $in: manuscript.authors } },
      { $pull: { manuscripts: manuscriptId } },
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
const extractAuthorsFromPdfUrl = async (pdfUrl) => {
  try {
    if (!pdfUrl) return { authors: [], correspondingAuthor: null };

    let downloadUrl = pdfUrl;

    // Handle Google Drive URLs
    if (pdfUrl.includes("drive.google.com")) {
      const fileIdMatch = pdfUrl.match(/\/d\/([^\/]+)/);
      if (fileIdMatch) {
        downloadUrl = `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
      }
    }

    console.log("📥 Downloading PDF:", downloadUrl);

    const response = await axios.get(downloadUrl, {
      responseType: "arraybuffer",
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    const pdfBuffer = Buffer.from(response.data);
    const data = await pdfParse(pdfBuffer);
    const text = data.text;

    console.log("📝 PDF Text Sample:", text.substring(0, 1500));

    let authors = [];
    let correspondingAuthor = null;

    // ✅ Pattern for "AuthorsMr Gaganjot Kaur, Dr Meenu Gupta, Rakesh Kumar"
    const authorsMatch = text.match(
      /Authors([A-Za-z\s,\.]+?)(?=Corresponding|$)/i,
    );
    if (authorsMatch) {
      const authorsText = authorsMatch[1].trim();
      authors = authorsText
        .split(",")
        .map((a) => a.trim())
        .filter((a) => a && a.length > 2);

      console.log("🔍 Raw Authors Match:", authorsText);
    }

    // ✅ Pattern for "Corresponding Author(s)Rakesh Kumar"
    const correspondingMatch = text.match(
      /Corresponding\s*Author\(s\)([A-Za-z\s\.]+?)(?=\n|$)/i,
    );
    if (correspondingMatch) {
      correspondingAuthor = correspondingMatch[1].trim();
      console.log("🔍 Raw Corresponding Match:", correspondingAuthor);
    }

    console.log("✅ Final Authors:", authors);
    console.log("✅ Final Corresponding Author:", correspondingAuthor);

    return { authors, correspondingAuthor };
  } catch (error) {
    console.error("❌ PDF extraction error:", error.message);
    return { authors: [], correspondingAuthor: null };
  }
};

// Get a single manuscript by ID
exports.getManuscriptById = async (req, res) => {
  try {
    const manuscript = await Manuscript.findById(req.params.manuscriptId)
      .populate("authors", "firstName middleName lastName email")
      .populate("correspondingAuthor", "firstName middleName lastName email")
      .populate("assignedReviewers", "firstName middleName lastName email")
      .select("-reviewerNotes -uniqueViewers");

    if (!manuscript) {
      return res.status(404).json({
        success: false,
        message: "Manuscript not found",
      });
    }

    const doc = manuscript.toObject();

    // ✅ Extract PDF authors if mergedFileUrl exists

    res.json({
      success: true,
      data: doc,
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

        console.log("[buildAndDownloadPdf] Starting DOCX to PDF conversion...");

        // Convert DOCX files to PDF
        const manuscriptPdf = await convertDocxToPdf(
          req.files["manuscript"][0].path,
        );
        console.log(
          "[buildAndDownloadPdf] Manuscript PDF created:",
          manuscriptPdf,
        );

        const coverLetterPdf = await convertDocxToPdf(
          req.files["coverLetter"][0].path,
        );
        console.log(
          "[buildAndDownloadPdf] Cover letter PDF created:",
          coverLetterPdf,
        );

        const declarationPdf = await convertDocxToPdf(
          req.files["declaration"][0].path,
        );
        console.log(
          "[buildAndDownloadPdf] Declaration PDF created:",
          declarationPdf,
        );

        tempFiles.push(manuscriptPdf, coverLetterPdf, declarationPdf);

        // Extract text from manuscript
        console.log("[buildAndDownloadPdf] Extracting text from manuscript...");
        const manuscriptText = await extractTextFromDocx(
          req.files["manuscript"][0].path,
        );
        console.log("[buildAndDownloadPdf] Text extracted successfully");

        // Create table PDF (reuse your existing function)
        console.log("[buildAndDownloadPdf] Creating merged PDF with table...");
        const tablePdfResult = await createMergedPDFWithTable(
          manuscriptPdf,
          coverLetterPdf,
          declarationPdf,
          req.body, // or the relevant form data
        );
        const tablePdfPath = tablePdfResult.localPath;
        tempFiles.push(tablePdfPath);
        console.log("[buildAndDownloadPdf] Table PDF created:", tablePdfPath);

        // Merge all four PDFs
        const mergedPdfPath = path.join(
          os.tmpdir(),
          `final_merged_${Date.now()}.pdf`,
        );
        console.log("[buildAndDownloadPdf] Merging PDFs...");
        await mergePdfs(
          [tablePdfPath, manuscriptPdf, coverLetterPdf, declarationPdf],
          mergedPdfPath,
        );
        tempFiles.push(mergedPdfPath);
        console.log(
          "[buildAndDownloadPdf] Final merged PDF created:",
          mergedPdfPath,
        );

        // Send merged PDF for download
        res.download(mergedPdfPath, "merged_manuscript.pdf", async (err) => {
          if (err) {
            console.error("[buildAndDownloadPdf] Download error:", err);
          } else {
            console.log("[buildAndDownloadPdf] Download sent successfully");
          }
          // Clean up all temporary files after download (or error)
          await cleanupFiles(tempFiles);
        });
      } catch (innerError) {
        console.error("[buildAndDownloadPdf] Inner error:", innerError);
        if (tempFiles.length > 0) {
          await cleanupFiles(tempFiles).catch(() => { });
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
      await cleanupFiles(tempFiles).catch(() => { });
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
      cb(null, `temp_extract_${Date.now()}${path.extname(file.originalname)}`);
    },
  });
  const upload = multer({ storage: storage }).single("manuscript");

  upload(req, res, async function (err) {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
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
      (authorId) => authorId.toString() === userObjectId.toString(),
    );
    const isCorrespondingAuthor =
      manuscript.correspondingAuthor &&
      manuscript.correspondingAuthor.toString() === userObjectId.toString();

    if (!isAuthor && !isCorrespondingAuthor) {
      return res.status(403).json({
        message: "Access denied. You are not an author of this manuscript.",
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
        await fs.unlink(req.file.path).catch(() => { });
        return res.status(404).json({
          success: false,
          message: "Manuscript not found",
        });
      }

      if (manuscript.revisionLocked || manuscript.status === "Rejected") {
        await fs.unlink(req.file.path).catch(() => { });
        return res.status(403).json({
          success: false,
          message:
            "All revision attempts have been exhausted. You can no longer upload responses for this manuscript.",
        });
      }

      if (!isUserAuthor(manuscript, req.user?._id)) {
        await fs.unlink(req.file.path).catch(() => { });
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
        "responses",
      );

      tempPdfPath = await convertDocxToPdf(req.file.path);
      if (!isValidPdf(tempPdfPath)) {
        throw new Error("Response PDF failed validation");
      }

      const pdfUpload = await uploadToCloudinary(
        tempPdfPath,
        "responses",
        "raw",
        responsePdfName,
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

      await fs.unlink(req.file.path).catch(() => { });
      if (tempPdfPath) {
        await fs.unlink(tempPdfPath).catch(() => { });
      }

      return res.json({
        success: true,
        message: "Response document uploaded successfully",
        authorResponse: manuscript.authorResponse,
      });
    } catch (error) {
      console.error("[uploadResponseDoc]", error);
      await fs.unlink(req.file.path).catch(() => { });
      if (tempPdfPath) {
        await fs.unlink(tempPdfPath).catch(() => { });
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

  console.log("Uploading review notes for manuscript ID:", manuscriptId);
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, os.tmpdir()),
    filename: (req, file, cb) =>
      cb(null, `notes_${Date.now()}${path.extname(file.originalname)}`),
  });
  const upload = multer({ storage }).single("file");
  upload(req, res, async (err) => {
    if (err)
      return res.status(400).json({ success: false, message: err.message });
    if (!req.file)
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    try {
      // Get manuscript to extract customId for filename
      const manuscript = await Manuscript.findById(manuscriptId)
        .populate("authors", "firstName middleName lastName email")
        .populate("correspondingAuthor", "firstName middleName lastName email");
      if (!manuscript) {
        await fs.unlink(req.file.path);
        return res
          .status(404)
          .json({ success: false, message: "Manuscript not found" });
      }

      // 🔥 CHANGE 1: Generate UNIQUE filename with timestamp
      const timestamp = Date.now();
      let fileName = "review.docx";
      if (manuscript.customId) {
        const prefix = manuscript.customId.split("-")[0];
        fileName = `${prefix}-review-${timestamp}.docx`; // 🔥 Added timestamp
      } else {
        // Fallback: use first letters of title if no customId
        const titleWords = manuscript.title
          .split(" ")
          .filter((w) => w.length > 0);
        const prefix = titleWords
          .slice(0, 3)
          .map((w) => w.charAt(0).toUpperCase())
          .join("");
        fileName = `${prefix || "REV"}-review-${timestamp}.docx`; // 🔥 Added timestamp
      }

      // 🔥 CHANGE 2: Upload to Google Drive instead of Cloudinary
      console.log("[uploadNotesWord] Uploading to Google Drive:", fileName);

      const driveResult = await uploadFileToDrive(req.file.path, {
        filename: fileName,
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        makePublic: true,
      });

      if (!driveResult || !driveResult.success) {
        await fs.unlink(req.file.path);
        return res.status(500).json({
          success: false,
          message: "Google Drive upload failed",
        });
      }

      const docxUrl = driveResult.driveViewUrl || driveResult.webViewLink;

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
      if (
        manuscript.correspondingAuthor &&
        manuscript.correspondingAuthor.email
      ) {
        authorEmails.add(manuscript.correspondingAuthor.email.toLowerCase());
      }
      const emailList = Array.from(authorEmails);

      // Send email to all authors
      if (emailList.length > 0) {
        const emailSubject = `Review Comments Available - ${manuscript.title}`;
        const emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FFFFFF;">
            <div style="background: linear-gradient(135deg, #00796B 0%, #00ACC1 100%); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;color: black;">Synergy World Press</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9; color: black;">Review Comments Available</p>
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
                <a href="https://synergyworldpress.com/journal/jics/my-submissions"
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
            console.error(
              `Failed to send review DOCX notification to ${email}:`,
              emailError,
            );
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
      try {
        await fs.unlink(req.file.path);
      } catch (_) { }
      res.status(500).json({
        success: false,
        message: "Upload failed",
        error: error.message,
      });
    }
  });
};

exports.buildRevisionPdf = async (req, res) => {
  const { manuscriptId } = req.params;
  const tempFiles = [];
  try {
    const manuscript = await Manuscript.findById(manuscriptId)
      .populate("authors", "firstName middleName lastName _id")
      .populate(
        "correspondingAuthor",
        "firstName middleName lastName _id email",
      );

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
      `manuscript_${customId}`,
    );
    const coverLetterPdfPath = await downloadFileToTemp(
      manuscript.coverLetterFile,
      `coverLetter_${customId}`,
    );
    const declarationPdfPath = await downloadFileToTemp(
      manuscript.declarationFile,
      `declaration_${customId}`,
    );
    const responsePdfPath = await downloadFileToTemp(
      manuscript.authorResponse.pdfUrl,
      `response_${customId}`,
    );

    tempFiles.push(
      manuscriptPdfPath,
      coverLetterPdfPath,
      declarationPdfPath,
      responsePdfPath,
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
      `revision_${customId}_${Date.now()}.pdf`,
    );
    await mergePdfs(
      [
        tablePdfPath,
        responsePdfPath,
        manuscriptPdfPath,
        coverLetterPdfPath,
        declarationPdfPath,
      ],
      mergedPdfPath,
    );
    tempFiles.push(mergedPdfPath);

    const mergedUpload = await uploadToCloudinary(
      mergedPdfPath,
      "merged_manuscripts",
      "raw",
      `manuscript_${customId}_revision_${Date.now()}`,
    );

    manuscript.revisionCombinedPdfUrl =
      mergedUpload.secure_url || mergedUpload.url;
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
    if (!manuscript)
      return res.status(404).json({ message: "Manuscript not found" });

    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    // Example: Cloudinary upload
    const uploadedFile = await uploadToCloudinary(
      req.file.path,
      "highlighted_revisions",
      "raw",
      `highlighted_${manuscript.customId}_${Date.now()}`,
    );

    manuscript.highlightedRevisionFileUrl =
      uploadedFile.secure_url || uploadedFile.url;
    await manuscript.save();

    return res.json({
      success: true,
      highlightedRevisionFileUrl: manuscript.highlightedRevisionFileUrl,
    });
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
    if (
      file.fieldname === "responseSheet" ||
      file.fieldname === "highlightedDoc"
    ) {
      // Only PDF for response sheet and highlighted doc
      const isPdf = /pdf/.test(path.extname(file.originalname).toLowerCase());
      if (isPdf) {
        return cb(null, true);
      }
      cb(
        new Error("Response Sheet and Highlighted Document must be PDF files!"),
      );
    } else if (file.fieldname === "withoutHighlightedDoc") {
      // DOCX or LaTeX (.tex, .zip) for without highlighted doc
      const allowedTypes = /docx|tex|zip/;
      const extname = allowedTypes.test(
        path.extname(file.originalname).toLowerCase(),
      );
      if (extname) {
        return cb(null, true);
      }
      cb(
        new Error(
          "Without Highlighted Document must be DOCX, LaTeX (.tex), or ZIP file!",
        ),
      );
    }
    cb(new Error("Invalid file field"));
  },
}).fields([
  { name: "responseSheet", maxCount: 1 },
  { name: "highlightedDoc", maxCount: 1 },
  { name: "withoutHighlightedDoc", maxCount: 1 },
]);

exports.uploadRevisionFiles = async (req, res) => {
  let tempFiles = [];
  let uploadedDriveFileIds = [];

  revisionUpload(req, res, async (err) => {
    if (err) {
      console.error("[uploadRevisionFiles] Multer error:", err);
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    try {
      const { manuscriptId } = req.params;
      const { fileType } = req.body;

      // Find manuscript
      const manuscript = await Manuscript.findById(manuscriptId)
        .populate("authors", "_id firstName lastName email")
        .populate("correspondingAuthor", "_id firstName lastName email");

      if (!manuscript) {
        return res.status(404).json({
          success: false,
          message: "Manuscript not found",
        });
      }

      // Check authorization
      if (!isUserAuthor(manuscript, req.user?._id)) {
        return res.status(403).json({
          success: false,
          message:
            "You are not authorized to upload revision files for this manuscript",
        });
      }

      // Check if manuscript is locked
      if (manuscript.revisionLocked || manuscript.status === "Rejected") {
        return res.status(403).json({
          success: false,
          message:
            "All revision attempts have been exhausted. Cannot upload files.",
        });
      }

      // Check if all required files are present
      if (
        !req.files ||
        !req.files.responseSheet ||
        !req.files.highlightedDoc ||
        !req.files.withoutHighlightedDoc
      ) {
        return res.status(400).json({
          success: false,
          message: "All three files are required",
        });
      }

      // Track temporary files
      tempFiles = [
        req.files.responseSheet[0].path,
        req.files.highlightedDoc[0].path,
        req.files.withoutHighlightedDoc[0].path,
      ];

      const customId = manuscript.customId || manuscript._id.toString();
      const timestamp = Date.now();

      // Initialize authorResponse
      if (!manuscript.authorResponse) {
        manuscript.authorResponse = { submissionCount: 0 };
      }

      // ========== 1. Upload Response Sheet (PDF) ==========
      console.log("[uploadRevisionFiles] Uploading Response Sheet...");

      const responseSheetResult = await uploadFileToDrive(
        req.files.responseSheet[0].path,
        {
          filename: `response_sheet_${customId}_${timestamp}.pdf`,
          mimeType: "application/pdf",
          makePublic: true,
        },
      );

      if (!responseSheetResult?.success) {
        throw new Error("Failed to upload Response Sheet");
      }
      uploadedDriveFileIds.push(responseSheetResult.driveFileId);

      manuscript.authorResponse.docxUrl = responseSheetResult.driveViewUrl;
      manuscript.authorResponse.pdfUrl = responseSheetResult.driveViewUrl;
      manuscript.authorResponse.responseDriveFileId =
        responseSheetResult.driveFileId;
      manuscript.authorResponse.responseDriveViewUrl =
        responseSheetResult.driveViewUrl;
      manuscript.authorResponse.uploadedAt = new Date();

      console.log(
        "[uploadRevisionFiles] Response Sheet uploaded:",
        responseSheetResult.driveFileId,
      );

      // ========== 2. Upload Highlighted Document (PDF) ==========
      console.log("[uploadRevisionFiles] Uploading Highlighted Document...");

      const highlightedResult = await uploadFileToDrive(
        req.files.highlightedDoc[0].path,
        {
          filename: `highlighted_${customId}_${timestamp}.pdf`,
          mimeType: "application/pdf",
          makePublic: true,
        },
      );

      if (!highlightedResult?.success) {
        throw new Error("Failed to upload Highlighted Document");
      }
      uploadedDriveFileIds.push(highlightedResult.driveFileId);

      // Store in existing field (URL contains file ID for download)
      manuscript.authorResponse.highlightedFileUrl =
        highlightedResult.driveViewUrl;
      manuscript.authorResponse.highlightedUploadedAt = new Date();

      console.log(
        "[uploadRevisionFiles] Highlighted Document uploaded:",
        highlightedResult.driveFileId,
      );

      // ========== 3. Upload Without Highlighted Document (DOCX/LaTeX) ==========
      console.log("[uploadRevisionFiles] Uploading Clean Document...");

      const withoutHighlightedFile = req.files.withoutHighlightedDoc[0];
      const fileExtension =
        path.extname(withoutHighlightedFile.originalname) || ".docx";

      // Determine mime type
      let mimeType =
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      if (fileExtension === ".tex" || fileType === "latex") {
        mimeType = "application/x-tex";
      } else if (fileExtension === ".zip") {
        mimeType = "application/zip";
      }

      const withoutHighlightedResult = await uploadFileToDrive(
        withoutHighlightedFile.path,
        {
          filename: `clean_${customId}_${timestamp}${fileExtension}`,
          mimeType: mimeType,
          makePublic: true,
        },
      );

      if (!withoutHighlightedResult?.success) {
        throw new Error("Failed to upload Clean Document");
      }
      uploadedDriveFileIds.push(withoutHighlightedResult.driveFileId);

      manuscript.authorResponse.withoutHighlightedFileUrl =
        withoutHighlightedResult.driveViewUrl;
      manuscript.authorResponse.withoutHighlightedUploadedAt = new Date();

      console.log(
        "[uploadRevisionFiles] Clean Document uploaded:",
        withoutHighlightedResult.driveFileId,
      );

      // ========== Update Metadata ==========
      manuscript.authorResponse.lastUpdated = new Date();
      manuscript.authorResponse.submissionCount =
        (manuscript.authorResponse.submissionCount || 0) + 1;

      // Save
      await manuscript.save();

      // Cleanup temp files
      await cleanupFiles(tempFiles);
      tempFiles = [];

      console.log(`[uploadRevisionFiles] All files uploaded for: ${customId}`);

      // ========== EMAIL TO EDITORS ==========
      try {
        const editors = await User.find({ roles: "editor" }).select(
          "firstName lastName email",
        );

        if (editors?.length > 0) {
          const authorName = manuscript.correspondingAuthor
            ? `${manuscript.correspondingAuthor.firstName || ""} ${manuscript.correspondingAuthor.lastName || ""}`.trim()
            : "Author";

          const frontendUrl = "https://synergyworldpress.com";

          const emailSubject = `Revision Submitted - ${customId}`;

          const emailHtml = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <div style="background: linear-gradient(135deg, #00796B, #00ACC1); color: white; padding: 25px; text-align: center;">
                                <h1 style="margin: 0; font-size: 22px;">📄 Revision Submitted</h1>
                            </div>
                            <div style="padding: 25px;">
                                <p><strong>${authorName}</strong> has submitted Revision #${manuscript.authorResponse.submissionCount}.</p>
                                
                                <div style="background: #F0FDFA; padding: 15px; border-left: 4px solid #00796B; margin: 20px 0;">
                                    <p style="margin: 0 0 8px 0;"><strong>ID:</strong> ${customId}</p>
                                    <p style="margin: 0;"><strong>Title:</strong> ${manuscript.title || "Untitled"}</p>
                                </div>
                                
                                <p><strong>📁 Submitted Files:</strong></p>
                                <ul>
                                    <li><a href="${responseSheetResult.driveViewUrl}">Response Sheet (PDF)</a></li>
                                    <li><a href="${highlightedResult.driveViewUrl}">Highlighted Document (PDF)</a></li>
                                    <li><a href="${withoutHighlightedResult.driveViewUrl}">Clean Document (${(fileType || "docx").toUpperCase()})</a></li>
                                </ul>
                                
                                <div style="text-align: center; margin: 25px 0;">
                                    <a href="${frontendUrl}/editor-dashboard" 
                                       style="background: #00796B; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px;">
                                        Review Manuscript
                                    </a>
                                </div>
                            </div>
                        </div>
                    `;

          for (const editor of editors) {
            try {
              await sendEmail({
                to: editor.email,
                subject: emailSubject,
                html: emailHtml,
              });
            } catch (e) {
              console.error(`Email failed for ${editor.email}:`, e);
            }
          }
        }
      } catch (emailError) {
        console.error("[uploadRevisionFiles] Email error:", emailError);
      }

      // ========== Success Response ==========
      return res.json({
        success: true,
        message: "All revision files uploaded successfully",
        data: {
          responseSheetUrl: manuscript.authorResponse.docxUrl,
          highlightedDocumentUrl: manuscript.authorResponse.highlightedFileUrl,
          withoutHighlightedDocumentUrl:
            manuscript.authorResponse.withoutHighlightedFileUrl,
          submissionCount: manuscript.authorResponse.submissionCount,
          uploadedAt: manuscript.authorResponse.uploadedAt,
        },
      });
    } catch (error) {
      console.error("[uploadRevisionFiles] Error:", error);

      // Cleanup Drive files on error
      for (const fileId of uploadedDriveFileIds) {
        try {
          await deleteFileFromDrive(fileId);
        } catch (e) {
          console.error(`Cleanup failed for ${fileId}:`, e);
        }
      }

      // Cleanup temp files
      if (tempFiles.length > 0) {
        await cleanupFiles(tempFiles).catch(console.error);
      }

      return res.status(500).json({
        success: false,
        message: "Failed to upload revision files",
        error: error.message,
      });
    }
  });
};

exports.uploadPublishedPdf = async (req, res) => {
  let tempFiles = [];
  let s3ObjectKey = null;
  let driveFileId = null;
  let manuscriptSaved = false;
  let previousPublishedFileUrl = "";
  let publishedPdfUrl = "";

  try {
    const { manuscriptId } = req.params;

    // NEW: Yeh fields ab frontend se aayenge
    const {
      issueVolume,
      issueNumber,
      issueYear,
      issueTitle,
      pageStart,
      pageEnd,
      section,
      pdfAuthors,
      pdfCorrespondingAuthor,
    } = req.body;

    let authorsArray = [];
    if (pdfAuthors) {
      try {
        authorsArray =
          typeof pdfAuthors === "string" ? JSON.parse(pdfAuthors) : pdfAuthors;
      } catch (e) {
        authorsArray = pdfAuthors
          .split(",")
          .map((a) => a.trim())
          .filter((a) => a);
      }
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Published PDF file is required",
      });
    }

    tempFiles = [req.file.path];

    const manuscript = await Manuscript.findById(manuscriptId)
      .populate("authors", "firstName lastName email")
      .populate("correspondingAuthor", "firstName lastName email");

    if (!manuscript) {
      return res.status(404).json({
        success: false,
        message: "Manuscript not found",
      });
    }

    previousPublishedFileUrl = manuscript.publishedFileUrl || "";

    const customId = manuscript.customId || manuscript._id.toString();
    const timestamp = Date.now();
    const fileName = "published_" + customId + "_" + timestamp + ".pdf";
    publishedPdfUrl = getPublishedManuscriptPublicUrl(fileName);

    s3ObjectKey = await uploadPublishedManuscriptToS3(
      fsSync.createReadStream(req.file.path),
      fileName,
    );
    const driveResult = await uploadFileToDrive(req.file.path, {
      filename: fileName,
      mimeType: "application/pdf",
      makePublic: true,
    });

    if (!driveResult?.success || !driveResult.driveFileId) {
      throw new Error("Google Drive upload failed");
    }

    driveFileId = driveResult.driveFileId;

    const publishedDate = new Date();

    // Update manuscript
    manuscript.publishedFileUrl = publishedPdfUrl;
    manuscript.publishedDriveFileId = driveResult.driveFileId;
    manuscript.publishedDriveViewUrl = driveResult.webViewLink || "";
    manuscript.status = "Published";
    manuscript.publishedAt = publishedDate;

    // Issue info
    if (issueVolume) manuscript.issueVolume = parseInt(issueVolume);
    if (issueNumber) manuscript.issueNumber = parseInt(issueNumber);
    if (issueYear) manuscript.issueYear = parseInt(issueYear);
    if (issueTitle) manuscript.issueTitle = issueTitle;
    if (pageStart) manuscript.pageStart = parseInt(pageStart);
    if (pageEnd) manuscript.pageEnd = parseInt(pageEnd);
    if (section) manuscript.section = section;

    manuscript.pdfAuthors = authorsArray;
    manuscript.pdfCorrespondingAuthor = pdfCorrespondingAuthor?.trim() || null;

    await manuscript.save();
    manuscriptSaved = true;

    return res.json({
      success: true,
      message: "Manuscript published successfully",
      data: {
        manuscriptId: manuscript._id,
        customId,
        publishedFileUrl: manuscript.publishedFileUrl,
        publishedAt: manuscript.publishedAt,
        status: manuscript.status,
        issueVolume: manuscript.issueVolume,
        issueNumber: manuscript.issueNumber,
        issueYear: manuscript.issueYear,
        issueTitle: manuscript.issueTitle,
        section: manuscript.section,
        pageStart: manuscript.pageStart,
        pageEnd: manuscript.pageEnd,
        pdfAuthors: manuscript.pdfAuthors,
        pdfCorrespondingAuthor: manuscript.pdfCorrespondingAuthor,
      },
    });
  } catch (error) {
    console.error("[uploadPublishedPdf] Error:", error);

    if (!manuscriptSaved) {
      if (driveFileId) {
        await deleteFileFromDrive(driveFileId).catch((cleanupError) => {
          console.error(
            "[uploadPublishedPdf] Failed to delete Drive file during rollback:",
            cleanupError,
          );
        });
      }

      if (s3ObjectKey && previousPublishedFileUrl !== publishedPdfUrl) {
        await deletePublishedManuscriptFromS3(s3ObjectKey).catch(
          (cleanupError) => {
            console.error(
              "[uploadPublishedPdf] Failed to delete S3 object during rollback:",
              cleanupError,
            );
          },
        );
      }
    }

    return res.status(500).json({
      success: false,
      message: "Failed to publish manuscript",
      error: error.message,
    });
  } finally {
    if (tempFiles.length > 0) {
      await cleanupFiles(tempFiles).catch(() => { });
    }
  }
};

exports.streamPublishedPdf = async (req, res) => {
  try {
    const requestedFilename = String(req.params.filename || "").trim();
    const normalizedFilename = path.basename(requestedFilename);

    if (
      !normalizedFilename ||
      normalizedFilename !== requestedFilename ||
      !normalizedFilename.toLowerCase().endsWith(".pdf")
    ) {
      return res.status(404).send("PDF not found");
    }

    const escapedFilename = escapeRegex(normalizedFilename);
    const filenamePattern = new RegExp(`${escapedFilename}$`);

    console.log("[streamPublishedPdf] Lookup debug", {
      requestedFilename: normalizedFilename,
      escapedFilename,
      regex: filenamePattern.toString(),
      dbName: mongoose.connection?.name || null,
      modelName: Manuscript.modelName,
    });

    const manuscript = await Manuscript.findOne({
      publishedFileUrl: { $regex: filenamePattern },
    })
      .select("_id publishedFileUrl")
      .lean();

    console.log("[streamPublishedPdf] Matched manuscript", {
      manuscriptId: manuscript?._id?.toString() || null,
      publishedFileUrl: manuscript?.publishedFileUrl || null,
    });

    if (!manuscript) {
      return res.status(404).send("PDF not found");
    }

    const s3ObjectKey = buildPublishedManuscriptKey(normalizedFilename);
    const pdfObject = await getPublishedManuscriptFromS3(s3ObjectKey, {
      byteRange: req.headers.range,
    });

    if (pdfObject.contentRange) {
      res.status(206);
      res.setHeader("Content-Range", pdfObject.contentRange);
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${normalizedFilename.replace(/"/g, "")}"`,
    );

    if (pdfObject.acceptRanges) {
      res.setHeader("Accept-Ranges", pdfObject.acceptRanges);
    }

    if (pdfObject.contentLength !== null) {
      res.setHeader("Content-Length", String(pdfObject.contentLength));
    }

    if (pdfObject.etag) {
      res.setHeader("ETag", pdfObject.etag);
    }

    if (pdfObject.lastModified) {
      res.setHeader(
        "Last-Modified",
        new Date(pdfObject.lastModified).toUTCString(),
      );
    }

    await streamPipeline(pdfObject.body, res);
  } catch (error) {
    console.error("[streamPublishedPdf] Error:", error);

    const isNotFound =
      error?.name === "NoSuchKey" || error?.$metadata?.httpStatusCode === 404;

    if (res.headersSent) {
      res.destroy(error);
      return;
    }

    return res
      .status(isNotFound ? 404 : 500)
      .send(isNotFound ? "PDF not found" : "Failed to load PDF");
  }
};

// Controller
exports.getPublishedManuscripts = async (req, res) => {
  try {
    const manuscripts = await Manuscript.find({ status: "Published" })
      .populate("authors", "firstName middleName lastName email")
      .populate("correspondingAuthor", "firstName middleName lastName email")
      .populate("assignedReviewers", "firstName middleName lastName email")
      .select("-reviewerNotes -uniqueViewers");

    if (!manuscripts || manuscripts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No published manuscripts found",
      });
    }

    // Sort by pageStart
    const sortedManuscripts = manuscripts.sort((a, b) => {
      const aPage = a.pageStart;
      const bPage = b.pageStart;

      if (aPage !== null && bPage !== null) return aPage - bPage;
      if (aPage !== null && bPage === null) return -1;
      if (aPage === null && bPage !== null) return 1;
      return new Date(b.publishedAt) - new Date(a.publishedAt);
    });

    // ✅ Extract PDF authors for each manuscript
    const manuscriptsWithPdfAuthors = sortedManuscripts.map((manuscript) =>
      manuscript.toObject(),
    );

    res.json({
      success: true,
      count: manuscriptsWithPdfAuthors.length,
      data: manuscriptsWithPdfAuthors,
    });
  } catch (error) {
    console.error("Error fetching published manuscripts:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// ============================================
// 🔥 NEW: JOB-BASED MANUSCRIPT CREATION
// ============================================

/**
 * 🔥 NEW: Create manuscript with background processing
 * Returns immediately with jobId, processes in background
 */
exports.createManuscriptAsync = async (req, res) => {
  console.log("createManuscriptAsync");
  let tempFiles = [];

  try {
    upload(req, res, async (err) => {
      if (err) {
        console.error("[createManuscriptAsync] Multer error:", err);
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      // Check required files
      if (
        !req.files["manuscript"] ||
        !req.files["coverLetter"] ||
        !req.files["declaration"]
      ) {
        return res.status(400).json({
          success: false,
          message:
            "All three files (manuscript, cover letter, and declaration) are required",
        });
      }

      // Track temp files
      tempFiles = [
        req.files["manuscript"][0].path,
        req.files["coverLetter"][0].path,
        req.files["declaration"][0].path,
      ];

      // Create job with all necessary data
      const jobId = createJob({
        files: {
          manuscript: req.files["manuscript"][0].path,
          coverLetter: req.files["coverLetter"][0].path,
          declaration: req.files["declaration"][0].path,
        },
        body: req.body,
        user: req.user ? { _id: req.user._id, token: req.user.token } : null,
        editor: req.editor || null,
      });

      // ⚡ RESPOND IMMEDIATELY
      res.status(202).json({
        success: true,
        message: "Manuscript upload received, processing started",
        jobId: jobId,
      });

      // 🔥 PROCESS IN BACKGROUND
      setImmediate(() => {
        processManuscriptJob(jobId, tempFiles).catch((error) => {
          console.error(`[createManuscriptAsync] Background error:`, error);
          failJob(jobId, error);
        });
      });
    });
  } catch (error) {
    console.error("[createManuscriptAsync] Error:", error);
    if (tempFiles.length > 0) {
      await cleanupFiles(tempFiles).catch(() => { });
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * 🔥 Process manuscript in background
 */
async function processManuscriptJob(jobId, tempFiles) {
  console.log("processManuscriptJob");
  const job = getJob(jobId);
  if (!job) return;

  const { files, body, user, editor } = job.data;

  try {
    updateJob(jobId, {
      status: STATUS.PROCESSING,
      progress: 5,
      step: "Starting processing...",
    });

    // Parse additionalInfo
    let additionalInfo = body.additionalInfo;
    if (additionalInfo) {
      try {
        const arr = JSON.parse(additionalInfo);
        additionalInfo = arr.join(", ");
      } catch (e) { }
    }

    // Parse billingInfo
    let billingInfo = body.billingInfo;
    if (billingInfo && typeof billingInfo === "string") {
      try {
        billingInfo = JSON.parse(billingInfo);
      } catch (e) {
        billingInfo = {};
      }
    }

    // Parse authors
    const authors = body.authors ? JSON.parse(body.authors) : [];
    const correspondingAuthorId = body.correspondingAuthorId;

    const isEditorSubmitter = !!editor;
    if (!isEditorSubmitter && user) {
      if (!authors.includes(user._id.toString())) {
        authors.unshift(user._id.toString());
      }
    }

    // Validate author IDs
    const authorObjectIds = [];
    for (const id of authors) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        authorObjectIds.push(new mongoose.Types.ObjectId(id));
      }
    }

    let correspondingAuthorObjectId;
    if (
      mongoose.Types.ObjectId.isValid(
        correspondingAuthorId || (user && user._id),
      )
    ) {
      correspondingAuthorObjectId = new mongoose.Types.ObjectId(
        correspondingAuthorId || (user && user._id),
      );
    }

    updateJob(jobId, {
      progress: 10,
      step: "Extracting text from documents...",
    });

    // Extract text from DOCX files
    let manuscriptText = "",
      coverLetterText = "",
      declarationText = "";
    let manuscriptTitle = "",
      manuscriptAbstract = "",
      manuscriptKeywords = "";

    try {
      const result = await extractTextFromDocx(files.manuscript);
      manuscriptText = result.full_text || "";
      manuscriptTitle = result.title || "";
      manuscriptAbstract = result.abstract || "";
      manuscriptKeywords = result.keywords || "";
    } catch (err) {
      console.error(
        "[processManuscriptJob] Manuscript extraction failed:",
        err,
      );
    }

    try {
      const result = await extractTextFromDocx(files.coverLetter);
      coverLetterText = result.full_text || "";
    } catch (err) { }

    try {
      const result = await extractTextFromDocx(files.declaration);
      declarationText = result.full_text || "";
    } catch (err) { }

    updateJob(jobId, { progress: 20, step: "Converting manuscript to PDF..." });

    // Convert DOCX to PDF
    let manuscriptPdfPath, coverLetterPdfPath, declarationPdfPath;

    manuscriptPdfPath = await convertDocxToPdf(files.manuscript, (p, step) => {
      const mapped = 20 + Math.round((p / 100) * 15); // 20 → 35
      updateJob(jobId, {
        progress: mapped,
        step: step || "Converting manuscript to PDF...",
      });
    });
    if (!isValidPdf(manuscriptPdfPath)) {
      throw new Error("Manuscript PDF is invalid after conversion.");
    }

    updateJob(jobId, {
      progress: 35,
      step: "Converting cover letter to PDF...",
    });

    coverLetterPdfPath = await convertDocxToPdf(
      files.coverLetter,
      (p, step) => {
        const mapped = 35 + Math.round((p / 100) * 15); // 35 → 50
        updateJob(jobId, {
          progress: mapped,
          step: step || "Converting cover letter to PDF...",
        });
      },
    );
    if (!isValidPdf(coverLetterPdfPath)) {
      throw new Error("Cover letter PDF is invalid after conversion.");
    }

    updateJob(jobId, {
      progress: 50,
      step: "Converting declaration to PDF...",
    });

    declarationPdfPath = await convertDocxToPdf(
      files.declaration,
      (p, step) => {
        const mapped = 50 + Math.round((p / 100) * 10); // 50 → 60
        updateJob(jobId, {
          progress: mapped,
          step: step || "Converting declaration to PDF...",
        });
      },
    );
    if (!isValidPdf(declarationPdfPath)) {
      throw new Error("Declaration PDF is invalid after conversion.");
    }

    updateJob(jobId, { progress: 60, step: "Generating manuscript ID..." });

    // Generate custom manuscript ID
    const manuscriptTitleForId = body.title || "Untitled";
    const customManuscriptId =
      await generateUniqueManuscriptId(manuscriptTitleForId);

    updateJob(jobId, { progress: 65, step: "Uploading files to cloud..." });

    // Upload PDFs to Google Drive
    const [manuscriptDrive, coverLetterDrive, declarationDrive] =
      await Promise.all([
        uploadFileToDrive(files.manuscript, {
          filename: `manuscript_${customManuscriptId}.docx`,
        }),
        uploadFileToDrive(files.coverLetter, {
          filename: `cover_letter_${customManuscriptId}.docx`,
        }),
        uploadFileToDrive(files.declaration, {
          filename: `declaration_${customManuscriptId}.docx`,
        }),
      ]);

    updateJob(jobId, { progress: 75, step: "Creating merged PDF..." });

    // Create manuscript data
    const manuscriptData = {
      ...body,
      additionalInfo: additionalInfo,
      billingInfo: billingInfo,
      customId: customManuscriptId,
      authors: authorObjectIds,
      correspondingAuthor: correspondingAuthorObjectId,
      // Legacy URL fields set to Drive view URLs
      manuscriptFile: manuscriptDrive.driveViewUrl,
      coverLetterFile: coverLetterDrive.driveViewUrl,
      declarationFile: declarationDrive.driveViewUrl,
      // New Drive fields
      manuscriptDriveFileId: manuscriptDrive.driveFileId,
      manuscriptDriveViewUrl: manuscriptDrive.driveViewUrl,
      coverLetterDriveFileId: coverLetterDrive.driveFileId,
      coverLetterDriveViewUrl: coverLetterDrive.driveViewUrl,
      declarationDriveFileId: declarationDrive.driveFileId,
      declarationDriveViewUrl: declarationDrive.driveViewUrl,
      status: "Saved",
      extractedText: manuscriptText,
      coverLetterText: coverLetterText,
      declarationText: declarationText,
      extractedTitle: manuscriptTitle,
      extractedAbstract: manuscriptAbstract,
      extractedKeywords: manuscriptKeywords,
    };

    // Save manuscript first
    const manuscript = new Manuscript(manuscriptData);
    await manuscript.save();

    updateJob(jobId, {
      progress: 85,
      step: "Creating merged PDF with table...",
    });

    // Create merged PDF
    const mergedPdfResult = await createMergedPDFWithTable(
      manuscriptPdfPath,
      coverLetterPdfPath,
      declarationPdfPath,
      {
        ...body,
        billingInfo: billingInfo,
        authors: authorObjectIds,
        correspondingAuthor: correspondingAuthorObjectId,
      },
      customManuscriptId,
    );

    tempFiles.push(mergedPdfResult.localPath);

    updateJob(jobId, { progress: 90, step: "Uploading merged PDF..." });

    // Upload merged PDF
    const mergedDrive = await uploadFileToDrive(mergedPdfResult.localPath, {
      filename: `manuscript_${customManuscriptId}.pdf`,
    });
    manuscript.mergedFileUrl = mergedDrive.driveViewUrl;
    manuscript.mergedDriveFileId = mergedDrive.driveFileId;
    manuscript.mergedDriveViewUrl = mergedDrive.driveViewUrl;
    await manuscript.save();

    updateJob(jobId, { progress: 95, step: "Updating author records..." });

    // Update authors
    for (const authorId of authors) {
      if (mongoose.Types.ObjectId.isValid(authorId)) {
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
          { new: true },
        );
      }
    }

    // Cleanup temp files
    await cleanupFiles(tempFiles);

    // Complete job with result
    completeJob(jobId, {
      manuscriptId: manuscript._id,
      customId: customManuscriptId,
      mergedPdfUrl: manuscript.mergedFileUrl, // Drive view URL
      manuscriptFile:
        manuscript.manuscriptDriveViewUrl || manuscript.manuscriptFile,
      coverLetterFile:
        manuscript.coverLetterDriveViewUrl || manuscript.coverLetterFile,
      declarationFile:
        manuscript.declarationDriveViewUrl || manuscript.declarationFile,
      extractedTitle: manuscriptTitle,
      extractedAbstract: manuscriptAbstract,
      extractedKeywords: manuscriptKeywords,
    });
  } catch (error) {
    console.error(`[processManuscriptJob] Error:`, error);

    // Cleanup on error
    await cleanupFiles(tempFiles).catch(() => { });

    failJob(jobId, error);
  }
}

/**
 * 🔥 NEW: Get job status
 */
exports.getJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = getJob(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: "Job not found",
      });
    }

    res.json({
      success: true,
      id: job.id,
      status: job.status,
      progress: job.progress,
      step: job.step,
      result: job.result,
      error: job.error,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
    });
  } catch (error) {
    console.error("[getJobStatus] Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
exports.updateDraft = async (req, res) => {
  let tempFiles = [];

  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      try {
        const { manuscriptId } = req.params;

        const existingManuscript = await Manuscript.findById(manuscriptId);
        if (!existingManuscript) {
          return res
            .status(404)
            .json({ success: false, message: "Manuscript not found" });
        }

        const isAuthor =
          existingManuscript.authors.some(
            (a) => a.toString() === req.user._id.toString(),
          ) ||
          existingManuscript.correspondingAuthor?.toString() ===
          req.user._id.toString();

        if (!isAuthor) {
          return res.status(403).json({
            success: false,
            message: "You don't have permission to edit this manuscript",
          });
        }

        if (!["Pending", "Saved"].includes(existingManuscript.status)) {
          return res.status(403).json({
            success: false,
            message: "This manuscript cannot be edited anymore",
          });
        }

        if (req.files) {
          if (req.files["manuscript"])
            tempFiles.push(req.files["manuscript"][0].path);
          if (req.files["coverLetter"])
            tempFiles.push(req.files["coverLetter"][0].path);
          if (req.files["declaration"])
            tempFiles.push(req.files["declaration"][0].path);
        }

        // --- Parse additional info ---
        let additionalInfo = req.body.additionalInfo;
        if (additionalInfo) {
          if (typeof additionalInfo === "string") {
            try {
              const parsed = JSON.parse(additionalInfo);
              additionalInfo = Array.isArray(parsed)
                ? parsed.join(", ")
                : additionalInfo;
            } catch { }
          } else if (Array.isArray(additionalInfo)) {
            additionalInfo = additionalInfo.join(", ");
          }
        } else {
          additionalInfo = existingManuscript.additionalInfo || "";
        }

        // --- Parse billing info ---
        let billingInfo = req.body.billingInfo;
        if (billingInfo && typeof billingInfo === "string") {
          try {
            billingInfo = JSON.parse(billingInfo);
          } catch {
            billingInfo = existingManuscript.billingInfo || {};
          }
        }
        if (!billingInfo) {
          billingInfo = existingManuscript.billingInfo || {};
        }

        // --- Parse classification ---
        let classification = req.body.classification;
        if (classification) {
          if (typeof classification === "string") {
            try {
              const parsed = JSON.parse(classification);
              if (Array.isArray(parsed)) classification = parsed.join(", ");
            } catch { }
          } else if (Array.isArray(classification)) {
            classification = classification.join(", ");
          }
        } else {
          classification = existingManuscript.classification || "";
        }

        // --- Parse authors ---
        let authors = [];
        if (req.body.authors) {
          try {
            authors = JSON.parse(req.body.authors);
          } catch {
            authors = [];
          }
        }

        const correspondingAuthorId =
          req.body.correspondingAuthorId || req.user._id;

        if (!authors.includes(req.user._id.toString())) {
          authors.unshift(req.user._id.toString());
        }

        const authorObjectIds = authors
          .filter((id) => mongoose.Types.ObjectId.isValid(id))
          .map((id) => new mongoose.Types.ObjectId(id));

        let correspondingAuthorObjectId = mongoose.Types.ObjectId.isValid(
          correspondingAuthorId,
        )
          ? new mongoose.Types.ObjectId(correspondingAuthorId)
          : req.user._id;

        const customManuscriptId = existingManuscript.customId;

        // ═══════════════════════════════════════════════════════════
        // 🔥 GOOGLE DRIVE UPLOAD WITH OLD FILE DELETE
        // ═══════════════════════════════════════════════════════════

        // 📄 Handle Manuscript File
        let manuscriptFile = existingManuscript.manuscriptFile;
        let manuscriptDriveFileId = existingManuscript.manuscriptDriveFileId;
        let manuscriptDriveViewUrl = existingManuscript.manuscriptDriveViewUrl;

        if (req.files?.manuscript) {
          console.log(
            "[updateDraft] 📤 Uploading new manuscript to Google Drive...",
          );

          // 🗑️ Delete old file from Drive
          if (existingManuscript.manuscriptDriveFileId) {
            try {
              await deleteFileFromDrive(
                existingManuscript.manuscriptDriveFileId,
              );
              console.log("[updateDraft] 🗑️ Old manuscript deleted");
            } catch (deleteErr) {
              console.warn(
                "[updateDraft] ⚠️ Could not delete old manuscript:",
                deleteErr.message,
              );
            }
          }

          // 📤 Upload new file
          const manuscriptResult = await uploadFileToDrive(
            req.files.manuscript[0].path,
            {
              filename: `manuscript_${customManuscriptId}_updated_${Date.now()}_${req.files.manuscript[0].originalname}`,
              folderId: process.env.GOOGLE_DRIVE_MANUSCRIPTS_FOLDER_ID,
              makePublic: true,
            },
          );

          manuscriptFile =
            manuscriptResult.webViewLink || manuscriptResult.driveViewUrl;
          manuscriptDriveFileId = manuscriptResult.driveFileId;
          manuscriptDriveViewUrl = manuscriptResult.driveViewUrl;

          console.log(
            "[updateDraft] ✅ New manuscript uploaded:",
            manuscriptDriveViewUrl,
          );
        }

        // 📄 Handle Cover Letter File
        let coverLetterFile = existingManuscript.coverLetterFile;
        let coverLetterDriveFileId = existingManuscript.coverLetterDriveFileId;
        let coverLetterDriveViewUrl =
          existingManuscript.coverLetterDriveViewUrl;

        if (req.files?.coverLetter) {
          console.log(
            "[updateDraft] 📤 Uploading new cover letter to Google Drive...",
          );

          // 🗑️ Delete old file from Drive
          if (existingManuscript.coverLetterDriveFileId) {
            try {
              await deleteFileFromDrive(
                existingManuscript.coverLetterDriveFileId,
              );
              console.log("[updateDraft] 🗑️ Old cover letter deleted");
            } catch (deleteErr) {
              console.warn(
                "[updateDraft] ⚠️ Could not delete old cover letter:",
                deleteErr.message,
              );
            }
          }

          // 📤 Upload new file
          const coverLetterResult = await uploadFileToDrive(
            req.files.coverLetter[0].path,
            {
              filename: `cover_letter_${customManuscriptId}_updated_${Date.now()}_${req.files.coverLetter[0].originalname}`,
              folderId: process.env.GOOGLE_DRIVE_COVER_LETTERS_FOLDER_ID,
              makePublic: true,
            },
          );

          coverLetterFile =
            coverLetterResult.webViewLink || coverLetterResult.driveViewUrl;
          coverLetterDriveFileId = coverLetterResult.driveFileId;
          coverLetterDriveViewUrl = coverLetterResult.driveViewUrl;

          console.log(
            "[updateDraft] ✅ New cover letter uploaded:",
            coverLetterDriveViewUrl,
          );
        }

        // 📄 Handle Declaration File
        let declarationFile = existingManuscript.declarationFile;
        let declarationDriveFileId = existingManuscript.declarationDriveFileId;
        let declarationDriveViewUrl =
          existingManuscript.declarationDriveViewUrl;

        if (req.files?.declaration) {
          console.log(
            "[updateDraft] 📤 Uploading new declaration to Google Drive...",
          );

          // 🗑️ Delete old file from Drive
          if (existingManuscript.declarationDriveFileId) {
            try {
              await deleteFileFromDrive(
                existingManuscript.declarationDriveFileId,
              );
              console.log("[updateDraft] 🗑️ Old declaration deleted");
            } catch (deleteErr) {
              console.warn(
                "[updateDraft] ⚠️ Could not delete old declaration:",
                deleteErr.message,
              );
            }
          }

          // 📤 Upload new file
          const declarationResult = await uploadFileToDrive(
            req.files.declaration[0].path,
            {
              filename: `declaration_${customManuscriptId}_updated_${Date.now()}_${req.files.declaration[0].originalname}`,
              folderId: process.env.GOOGLE_DRIVE_DECLARATIONS_FOLDER_ID,
              makePublic: true,
            },
          );

          declarationFile =
            declarationResult.webViewLink || declarationResult.driveViewUrl;
          declarationDriveFileId = declarationResult.driveFileId;
          declarationDriveViewUrl = declarationResult.driveViewUrl;

          console.log(
            "[updateDraft] ✅ New declaration uploaded:",
            declarationDriveViewUrl,
          );
        }

        // ═══════════════════════════════════════════════════════════
        // 📝 UPDATE DATA (Schema ke according)
        // ═══════════════════════════════════════════════════════════

        const updateData = {
          type: req.body.type || existingManuscript.type,
          title: req.body.title || existingManuscript.title,
          abstract: req.body.abstract || existingManuscript.abstract,
          keywords: req.body.keywords || existingManuscript.keywords,
          classification,
          additionalInfo,
          comments: req.body.comments ?? existingManuscript.comments,
          funding: req.body.funding || existingManuscript.funding,
          billingInfo,
          authors: authorObjectIds,
          correspondingAuthor: correspondingAuthorObjectId,

          // 📁 Manuscript file fields
          manuscriptFile: manuscriptFile,
          manuscriptDriveFileId: manuscriptDriveFileId,
          manuscriptDriveViewUrl: manuscriptDriveViewUrl,

          // 📁 Cover letter file fields
          coverLetterFile: coverLetterFile,
          coverLetterDriveFileId: coverLetterDriveFileId,
          coverLetterDriveViewUrl: coverLetterDriveViewUrl,

          // 📁 Declaration file fields
          declarationFile: declarationFile,
          declarationDriveFileId: declarationDriveFileId,
          declarationDriveViewUrl: declarationDriveViewUrl,

          status: "Pending",
          updatedAt: new Date(),
        };

        const updatedManuscript = await Manuscript.findByIdAndUpdate(
          manuscriptId,
          updateData,
          { new: true },
        );

        // 🧹 Cleanup temp files
        await cleanupFiles(tempFiles);
        tempFiles = [];

        console.log(
          "[updateDraft] ✅ Draft updated successfully:",
          customManuscriptId,
        );

        return res.status(200).json({
          success: true,
          message: "Draft updated successfully",
          data: updatedManuscript,
        });
      } catch (innerErr) {
        console.error("[updateDraft] ❌ Inner error:", innerErr);
        await cleanupFiles(tempFiles);
        throw innerErr;
      }
    });
  } catch (err) {
    console.error("[updateDraft] ❌ Error:", err);
    await cleanupFiles(tempFiles);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.saveDraft = async (req, res) => {
  let tempFiles = [];

  try {
    upload(req, res, async (err) => {
      if (err) {
        console.error("[saveDraft] Multer error:", err);
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      try {
        // Track temporary files
        if (req.files) {
          if (req.files["manuscript"])
            tempFiles.push(req.files["manuscript"][0].path);
          if (req.files["coverLetter"])
            tempFiles.push(req.files["coverLetter"][0].path);
          if (req.files["declaration"])
            tempFiles.push(req.files["declaration"][0].path);
        }

        // Parse form data
        let additionalInfo = req.body.additionalInfo;
        if (additionalInfo) {
          try {
            additionalInfo = JSON.parse(additionalInfo);
            if (Array.isArray(additionalInfo)) {
              additionalInfo = additionalInfo.join(", ");
            }
          } catch (e) { }
        }

        let billingInfo = req.body.billingInfo;
        if (billingInfo && typeof billingInfo === "string") {
          try {
            billingInfo = JSON.parse(billingInfo);
          } catch (e) {
            billingInfo = {};
          }
        }

        let classification = req.body.classification;
        if (classification && typeof classification === "string") {
          try {
            const parsed = JSON.parse(classification);
            if (Array.isArray(parsed)) {
              classification = parsed.join(", ");
            } else {
              classification = String(parsed);
            }
          } catch (e) {
            classification = "";
          }
        } else if (Array.isArray(classification)) {
          classification = classification.join(", ");
        } else {
          classification = classification ? String(classification) : "";
        }

        // Parse authors
        const authors = req.body.authors ? JSON.parse(req.body.authors) : [];
        const correspondingAuthorId =
          req.body.correspondingAuthorId || req.user._id;

        if (!authors.includes(req.user._id.toString())) {
          authors.unshift(req.user._id.toString());
        }

        const authorObjectIds = authors
          .filter((id) => mongoose.Types.ObjectId.isValid(id))
          .map((id) => new mongoose.Types.ObjectId(id));

        let correspondingAuthorObjectId;
        if (mongoose.Types.ObjectId.isValid(correspondingAuthorId)) {
          correspondingAuthorObjectId = new mongoose.Types.ObjectId(
            correspondingAuthorId,
          );
        } else {
          correspondingAuthorObjectId = req.user._id;
        }

        // Generate custom ID
        const manuscriptTitle = req.body.title || "Untitled";
        const customManuscriptId =
          await generateUniqueManuscriptId(manuscriptTitle);

        // ═══════════════════════════════════════════════════════════
        // 📝 BUILD MANUSCRIPT DATA (According to Schema)
        // ═══════════════════════════════════════════════════════════
        const manuscriptData = {
          customId: customManuscriptId,
          type: req.body.type || "Manuscript",
          title: req.body.title || "",
          abstract: req.body.abstract || "",
          keywords: req.body.keywords || "",
          classification: classification || "",
          additionalInfo: additionalInfo || "",
          comments: req.body.comments || "",
          funding: req.body.funding || "No",
          billingInfo: billingInfo || {},
          authors: authorObjectIds,
          correspondingAuthor: correspondingAuthorObjectId,
          status: "Saved",

          // 📁 Initialize file fields
          manuscriptFile: "",
          manuscriptDriveFileId: "",
          manuscriptDriveViewUrl: "",

          coverLetterFile: "",
          coverLetterDriveFileId: "",
          coverLetterDriveViewUrl: "",

          declarationFile: "",
          declarationDriveFileId: "",
          declarationDriveViewUrl: "",
        };

        // ═══════════════════════════════════════════════════════════
        // 🔥 GOOGLE DRIVE UPLOAD
        // ═══════════════════════════════════════════════════════════

        // 📄 Handle Manuscript File
        if (req.files && req.files["manuscript"]) {
          console.log("[saveDraft] 📤 Uploading manuscript to Google Drive...");

          const manuscriptResult = await uploadFileToDrive(
            req.files["manuscript"][0].path,
            {
              filename: `manuscript_${customManuscriptId}_${req.files["manuscript"][0].originalname}`,
              folderId: process.env.GOOGLE_DRIVE_MANUSCRIPTS_FOLDER_ID,
              makePublic: true,
            },
          );

          // ✅ Schema ke according fields
          manuscriptData.manuscriptFile =
            manuscriptResult.webViewLink || manuscriptResult.driveViewUrl;
          manuscriptData.manuscriptDriveFileId = manuscriptResult.driveFileId;
          manuscriptData.manuscriptDriveViewUrl = manuscriptResult.driveViewUrl;

          console.log(
            "[saveDraft] ✅ Manuscript uploaded:",
            manuscriptResult.driveViewUrl,
          );
        } else if (req.body.existingManuscriptFile) {
          manuscriptData.manuscriptFile = req.body.existingManuscriptFile;
          manuscriptData.manuscriptDriveFileId =
            req.body.existingManuscriptDriveFileId || "";
          manuscriptData.manuscriptDriveViewUrl =
            req.body.existingManuscriptDriveViewUrl || "";
        }

        // 📄 Handle Cover Letter File
        if (req.files && req.files["coverLetter"]) {
          console.log(
            "[saveDraft] 📤 Uploading cover letter to Google Drive...",
          );

          const coverLetterResult = await uploadFileToDrive(
            req.files["coverLetter"][0].path,
            {
              filename: `cover_letter_${customManuscriptId}_${req.files["coverLetter"][0].originalname}`,
              folderId: process.env.GOOGLE_DRIVE_COVER_LETTERS_FOLDER_ID,
              makePublic: true,
            },
          );

          // ✅ Schema ke according fields
          manuscriptData.coverLetterFile =
            coverLetterResult.webViewLink || coverLetterResult.driveViewUrl;
          manuscriptData.coverLetterDriveFileId = coverLetterResult.driveFileId;
          manuscriptData.coverLetterDriveViewUrl =
            coverLetterResult.driveViewUrl;

          console.log(
            "[saveDraft] ✅ Cover letter uploaded:",
            coverLetterResult.driveViewUrl,
          );
        } else if (req.body.existingCoverLetterFile) {
          manuscriptData.coverLetterFile = req.body.existingCoverLetterFile;
          manuscriptData.coverLetterDriveFileId =
            req.body.existingCoverLetterDriveFileId || "";
          manuscriptData.coverLetterDriveViewUrl =
            req.body.existingCoverLetterDriveViewUrl || "";
        }

        // 📄 Handle Declaration File
        if (req.files && req.files["declaration"]) {
          console.log(
            "[saveDraft] 📤 Uploading declaration to Google Drive...",
          );

          const declarationResult = await uploadFileToDrive(
            req.files["declaration"][0].path,
            {
              filename: `declaration_${customManuscriptId}_${req.files["declaration"][0].originalname}`,
              folderId: process.env.GOOGLE_DRIVE_DECLARATIONS_FOLDER_ID,
              makePublic: true,
            },
          );

          // ✅ Schema ke according fields
          manuscriptData.declarationFile =
            declarationResult.webViewLink || declarationResult.driveViewUrl;
          manuscriptData.declarationDriveFileId = declarationResult.driveFileId;
          manuscriptData.declarationDriveViewUrl =
            declarationResult.driveViewUrl;

          console.log(
            "[saveDraft] ✅ Declaration uploaded:",
            declarationResult.driveViewUrl,
          );
        } else if (req.body.existingDeclarationFile) {
          manuscriptData.declarationFile = req.body.existingDeclarationFile;
          manuscriptData.declarationDriveFileId =
            req.body.existingDeclarationDriveFileId || "";
          manuscriptData.declarationDriveViewUrl =
            req.body.existingDeclarationDriveViewUrl || "";
        }

        // Save manuscript
        const manuscript = new Manuscript(manuscriptData);
        await manuscript.save();

        // Update user's manuscripts array
        await User.findByIdAndUpdate(
          req.user._id,
          { $addToSet: { manuscripts: manuscript._id } },
          { new: true },
        );

        // Cleanup temp files
        await cleanupFiles(tempFiles);
        tempFiles = [];

        console.log(
          "[saveDraft] ✅ Draft saved successfully:",
          manuscript.customId,
        );

        res.status(201).json({
          success: true,
          message: "Draft saved successfully",
          data: manuscript,
        });
      } catch (innerError) {
        console.error("[saveDraft] Inner error:", innerError);
        await cleanupFiles(tempFiles);
        throw innerError;
      }
    });
  } catch (error) {
    console.error("[saveDraft] Error:", error);
    await cleanupFiles(tempFiles).catch(() => { });
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateDraftAndBuildPdfAsync = async (req, res) => {
  let tempFiles = [];

  try {
    upload(req, res, async (err) => {
      if (err) {
        console.error("[updateDraftAndBuildPdfAsync] Multer error:", err);
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      try {
        const { manuscriptId } = req.params;

        // ═══════════════════════════════════════════════════════════
        // 🔥 QUICK VALIDATIONS (before creating job)
        // ═══════════════════════════════════════════════════════════

        // Find existing manuscript
        const existingManuscript = await Manuscript.findById(manuscriptId);
        if (!existingManuscript) {
          return res.status(404).json({
            success: false,
            message: "Manuscript not found",
          });
        }

        // Check authorization
        const isAuthor =
          existingManuscript.authors.some(
            (author) => author.toString() === req.user._id.toString(),
          ) ||
          existingManuscript.correspondingAuthor?.toString() ===
          req.user._id.toString();

        if (!isAuthor) {
          return res.status(403).json({
            success: false,
            message: "You don't have permission to edit this manuscript",
          });
        }

        // Check status
        if (!["Pending", "Saved"].includes(existingManuscript.status)) {
          return res.status(403).json({
            success: false,
            message: "This manuscript cannot be edited anymore",
          });
        }

        // ═══════════════════════════════════════════════════════════
        // 🔥 TRACK TEMP FILES
        // ═══════════════════════════════════════════════════════════
        if (req.files) {
          if (req.files["manuscript"])
            tempFiles.push(req.files["manuscript"][0].path);
          if (req.files["coverLetter"])
            tempFiles.push(req.files["coverLetter"][0].path);
          if (req.files["declaration"])
            tempFiles.push(req.files["declaration"][0].path);
        }

        // ═══════════════════════════════════════════════════════════
        // 🔥 CREATE JOB
        // ═══════════════════════════════════════════════════════════
        const jobId = createJob({
          type: "UPDATE_DRAFT",
          manuscriptId: manuscriptId,
          existingManuscript: {
            _id: existingManuscript._id,
            customId: existingManuscript.customId,
            manuscriptDriveFileId: existingManuscript.manuscriptDriveFileId,
            manuscriptFile: existingManuscript.manuscriptFile,
            coverLetterDriveFileId: existingManuscript.coverLetterDriveFileId,
            coverLetterFile: existingManuscript.coverLetterFile,
            declarationDriveFileId: existingManuscript.declarationDriveFileId,
            declarationFile: existingManuscript.declarationFile,
            mergedDriveFileId: existingManuscript.mergedDriveFileId,
            extractedText: existingManuscript.extractedText,
            coverLetterText: existingManuscript.coverLetterText,
            declarationText: existingManuscript.declarationText,
            extractedTitle: existingManuscript.extractedTitle,
            extractedAbstract: existingManuscript.extractedAbstract,
            extractedKeywords: existingManuscript.extractedKeywords,
          },
          files: {
            manuscript: req.files?.["manuscript"]?.[0]?.path || null,
            coverLetter: req.files?.["coverLetter"]?.[0]?.path || null,
            declaration: req.files?.["declaration"]?.[0]?.path || null,
            manuscriptOriginalName:
              req.files?.["manuscript"]?.[0]?.originalname || null,
            coverLetterOriginalName:
              req.files?.["coverLetter"]?.[0]?.originalname || null,
            declarationOriginalName:
              req.files?.["declaration"]?.[0]?.originalname || null,
          },
          body: req.body,
          user: req.user ? { _id: req.user._id } : null,
          editor: req.editor || null,
        });

        // ═══════════════════════════════════════════════════════════
        // ⚡ RESPOND IMMEDIATELY
        // ═══════════════════════════════════════════════════════════
        res.status(202).json({
          success: true,
          message: "Draft update received, processing started",
          jobId: jobId,
          manuscriptId: manuscriptId,
        });

        // ═══════════════════════════════════════════════════════════
        // 🔥 PROCESS IN BACKGROUND
        // ═══════════════════════════════════════════════════════════
        setImmediate(() => {
          processUpdateDraftJob(jobId, tempFiles).catch((error) => {
            console.error(
              `[updateDraftAndBuildPdfAsync] Background error:`,
              error,
            );
            failJob(jobId, error);
          });
        });
      } catch (innerError) {
        console.error("[updateDraftAndBuildPdfAsync] Inner error:", innerError);
        if (tempFiles.length > 0) {
          await cleanupFiles(tempFiles).catch(() => { });
        }
        return res.status(500).json({
          success: false,
          message: innerError.message,
        });
      }
    });
  } catch (error) {
    console.error("[updateDraftAndBuildPdfAsync] Error:", error);
    if (tempFiles.length > 0) {
      await cleanupFiles(tempFiles).catch(() => { });
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

async function processUpdateDraftJob(jobId, tempFiles) {
  const job = getJob(jobId);
  if (!job) return;

  const { manuscriptId, existingManuscript, files, body, user, editor } =
    job.data;

  try {
    updateJob(jobId, {
      status: STATUS.PROCESSING,
      progress: 5,
      step: "Starting draft update...",
    });

    // ═══════════════════════════════════════════════════════════
    // 🔥 GET FILES - With proper validation
    // ═══════════════════════════════════════════════════════════
    updateJob(jobId, { progress: 10, step: "Preparing files..." });

    let manuscriptDocxPath, coverLetterDocxPath, declarationDocxPath;
    let hasNewManuscript = false,
      hasNewCoverLetter = false,
      hasNewDeclaration = false;

    // 📄 Handle Manuscript File
    console.log("[processUpdateDraftJob] Processing manuscript file...");
    if (files.manuscript) {
      // New file uploaded
      manuscriptDocxPath = files.manuscript;
      hasNewManuscript = true;
      console.log(
        "[processUpdateDraftJob] Using new manuscript:",
        manuscriptDocxPath,
      );

      // Validate uploaded file
      if (!fsSync.existsSync(manuscriptDocxPath)) {
        throw new Error("Uploaded manuscript file not found");
      }
    } else if (existingManuscript.manuscriptDriveFileId) {
      // Download from Google Drive
      updateJob(jobId, {
        progress: 12,
        step: "Downloading manuscript from Drive...",
      });
      console.log(
        "[processUpdateDraftJob] Downloading manuscript from Drive:",
        existingManuscript.manuscriptDriveFileId,
      );

      try {
        const downloadResult = await downloadDriveFileToTemp(
          existingManuscript.manuscriptDriveFileId,
          `manuscript_${existingManuscript.customId}`,
        );
        manuscriptDocxPath = downloadResult.localPath;
        tempFiles.push(manuscriptDocxPath);
        console.log(
          "[processUpdateDraftJob] Downloaded manuscript:",
          manuscriptDocxPath,
          "Size:",
          downloadResult.size,
        );
      } catch (downloadErr) {
        console.error(
          "[processUpdateDraftJob] Manuscript download failed:",
          downloadErr,
        );
        throw new Error(
          `Failed to download manuscript: ${downloadErr.message}`,
        );
      }
    } else if (existingManuscript.manuscriptFile) {
      // Fallback: Download from URL
      updateJob(jobId, { progress: 12, step: "Downloading manuscript..." });
      console.log(
        "[processUpdateDraftJob] Downloading manuscript from URL:",
        existingManuscript.manuscriptFile,
      );

      try {
        manuscriptDocxPath = await downloadFileToTemp(
          existingManuscript.manuscriptFile,
          "manuscript",
          ".docx",
        );
        tempFiles.push(manuscriptDocxPath);

        // Validate downloaded file
        const stats = await fs.stat(manuscriptDocxPath);
        if (stats.size < 100) {
          throw new Error("Downloaded manuscript is too small/empty");
        }
        console.log(
          "[processUpdateDraftJob] Downloaded manuscript from URL, size:",
          stats.size,
        );
      } catch (downloadErr) {
        console.error(
          "[processUpdateDraftJob] Manuscript URL download failed:",
          downloadErr,
        );
        throw new Error(
          `Failed to download manuscript from URL: ${downloadErr.message}`,
        );
      }
    } else {
      throw new Error("Manuscript file is required");
    }

    // 📄 Handle Cover Letter File
    console.log("[processUpdateDraftJob] Processing cover letter file...");
    if (files.coverLetter) {
      coverLetterDocxPath = files.coverLetter;
      hasNewCoverLetter = true;
      console.log(
        "[processUpdateDraftJob] Using new cover letter:",
        coverLetterDocxPath,
      );
    } else if (existingManuscript.coverLetterDriveFileId) {
      updateJob(jobId, {
        progress: 14,
        step: "Downloading cover letter from Drive...",
      });
      console.log(
        "[processUpdateDraftJob] Downloading cover letter from Drive:",
        existingManuscript.coverLetterDriveFileId,
      );

      try {
        const downloadResult = await downloadDriveFileToTemp(
          existingManuscript.coverLetterDriveFileId,
          `coverLetter_${existingManuscript.customId}`,
        );
        coverLetterDocxPath = downloadResult.localPath;
        tempFiles.push(coverLetterDocxPath);
        console.log(
          "[processUpdateDraftJob] Downloaded cover letter:",
          coverLetterDocxPath,
        );
      } catch (downloadErr) {
        console.error(
          "[processUpdateDraftJob] Cover letter download failed:",
          downloadErr,
        );
        throw new Error(
          `Failed to download cover letter: ${downloadErr.message}`,
        );
      }
    } else if (existingManuscript.coverLetterFile) {
      updateJob(jobId, { progress: 14, step: "Downloading cover letter..." });

      try {
        coverLetterDocxPath = await downloadFileToTemp(
          existingManuscript.coverLetterFile,
          "coverLetter",
          ".docx",
        );
        tempFiles.push(coverLetterDocxPath);
      } catch (downloadErr) {
        throw new Error(
          `Failed to download cover letter: ${downloadErr.message}`,
        );
      }
    } else {
      throw new Error("Cover letter file is required");
    }

    // 📄 Handle Declaration File
    console.log("[processUpdateDraftJob] Processing declaration file...");
    if (files.declaration) {
      declarationDocxPath = files.declaration;
      hasNewDeclaration = true;
      console.log(
        "[processUpdateDraftJob] Using new declaration:",
        declarationDocxPath,
      );
    } else if (existingManuscript.declarationDriveFileId) {
      updateJob(jobId, {
        progress: 16,
        step: "Downloading declaration from Drive...",
      });
      console.log(
        "[processUpdateDraftJob] Downloading declaration from Drive:",
        existingManuscript.declarationDriveFileId,
      );

      try {
        const downloadResult = await downloadDriveFileToTemp(
          existingManuscript.declarationDriveFileId,
          `declaration_${existingManuscript.customId}`,
        );
        declarationDocxPath = downloadResult.localPath;
        tempFiles.push(declarationDocxPath);
        console.log(
          "[processUpdateDraftJob] Downloaded declaration:",
          declarationDocxPath,
        );
      } catch (downloadErr) {
        console.error(
          "[processUpdateDraftJob] Declaration download failed:",
          downloadErr,
        );
        throw new Error(
          `Failed to download declaration: ${downloadErr.message}`,
        );
      }
    } else if (existingManuscript.declarationFile) {
      updateJob(jobId, { progress: 16, step: "Downloading declaration..." });

      try {
        declarationDocxPath = await downloadFileToTemp(
          existingManuscript.declarationFile,
          "declaration",
          ".docx",
        );
        tempFiles.push(declarationDocxPath);
      } catch (downloadErr) {
        throw new Error(
          `Failed to download declaration: ${downloadErr.message}`,
        );
      }
    } else {
      throw new Error("Declaration file is required");
    }

    // ═══════════════════════════════════════════════════════════
    // 🔥 VALIDATE ALL FILES BEFORE CONVERSION
    // ═══════════════════════════════════════════════════════════
    updateJob(jobId, { progress: 18, step: "Validating files..." });

    const validateDocxFile = async (filePath, fileName) => {
      if (!fsSync.existsSync(filePath)) {
        throw new Error(`${fileName} file not found at ${filePath}`);
      }

      const stats = await fs.stat(filePath);
      if (stats.size < 100) {
        throw new Error(`${fileName} file is too small (${stats.size} bytes)`);
      }

      // Check DOCX signature (ZIP format)
      const fd = fsSync.openSync(filePath, "r");
      const buffer = Buffer.alloc(4);
      fsSync.readSync(fd, buffer, 0, 4, 0);
      fsSync.closeSync(fd);

      // DOCX files are ZIP files - they start with PK (0x50 0x4B)
      if (buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
        // Check if it's a PDF
        if (buffer.toString().startsWith("%PDF")) {
          console.log(`[validateDocxFile] ${fileName} is a PDF, not DOCX`);
          return { isDocx: false, isPdf: true };
        }
        throw new Error(
          `${fileName} is not a valid DOCX file (invalid signature: ${buffer.toString("hex")})`,
        );
      }

      console.log(`[validateDocxFile] ✅ ${fileName} is valid DOCX`);
      return { isDocx: true, isPdf: false };
    };

    const manuscriptValidation = await validateDocxFile(
      manuscriptDocxPath,
      "Manuscript",
    );
    const coverLetterValidation = await validateDocxFile(
      coverLetterDocxPath,
      "Cover Letter",
    );
    const declarationValidation = await validateDocxFile(
      declarationDocxPath,
      "Declaration",
    );

    // ═══════════════════════════════════════════════════════════
    // 🔥 PARSE FORM DATA
    // ═══════════════════════════════════════════════════════════
    updateJob(jobId, { progress: 20, step: "Parsing form data..." });

    let additionalInfo = body.additionalInfo;
    if (additionalInfo) {
      try {
        const arr = JSON.parse(additionalInfo);
        additionalInfo = arr.join(", ");
      } catch (e) { }
    }

    let billingInfo = body.billingInfo;
    if (billingInfo && typeof billingInfo === "string") {
      try {
        billingInfo = JSON.parse(billingInfo);
      } catch (e) {
        billingInfo = {};
      }
    }

    const authors = body.authors ? JSON.parse(body.authors) : [];
    const correspondingAuthorId = body.correspondingAuthorId;

    const isEditorSubmitter = !!editor;
    if (!isEditorSubmitter && user) {
      if (!authors.includes(user._id.toString())) {
        authors.unshift(user._id.toString());
      }
    }

    const authorObjectIds = [];
    for (const id of authors) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        authorObjectIds.push(new mongoose.Types.ObjectId(id));
      }
    }

    let correspondingAuthorObjectId;
    if (
      mongoose.Types.ObjectId.isValid(
        correspondingAuthorId || (user && user._id),
      )
    ) {
      correspondingAuthorObjectId = new mongoose.Types.ObjectId(
        correspondingAuthorId || (user && user._id),
      );
    }

    // ═══════════════════════════════════════════════════════════
    // 🔥 EXTRACT TEXT FROM DOCX (if new files and they are DOCX)
    // ═══════════════════════════════════════════════════════════
    updateJob(jobId, {
      progress: 22,
      step: "Extracting text from documents...",
    });

    let manuscriptText = existingManuscript.extractedText || "";
    let coverLetterText = existingManuscript.coverLetterText || "";
    let declarationText = existingManuscript.declarationText || "";
    let manuscriptTitle = existingManuscript.extractedTitle || "";
    let manuscriptAbstract = existingManuscript.extractedAbstract || "";
    let manuscriptKeywords = existingManuscript.extractedKeywords || "";

    if (hasNewManuscript && manuscriptValidation.isDocx) {
      try {
        const result = await extractTextFromDocx(manuscriptDocxPath);
        manuscriptText = result.full_text || "";
        manuscriptTitle = result.title || "";
        manuscriptAbstract = result.abstract || "";
        manuscriptKeywords = result.keywords || "";
        console.log("[processUpdateDraftJob] Extracted text from manuscript");
      } catch (err) {
        console.error(
          "[processUpdateDraftJob] Manuscript text extraction failed:",
          err,
        );
      }
    }

    if (hasNewCoverLetter && coverLetterValidation.isDocx) {
      try {
        const result = await extractTextFromDocx(coverLetterDocxPath);
        coverLetterText = result.full_text || "";
      } catch (err) { }
    }

    if (hasNewDeclaration && declarationValidation.isDocx) {
      try {
        const result = await extractTextFromDocx(declarationDocxPath);
        declarationText = result.full_text || "";
      } catch (err) { }
    }

    // ═══════════════════════════════════════════════════════════
    // 🔥 CONVERT DOCX TO PDF
    // ═══════════════════════════════════════════════════════════
    let manuscriptPdfPath, coverLetterPdfPath, declarationPdfPath;

    // Convert manuscript
    updateJob(jobId, { progress: 25, step: "Converting manuscript to PDF..." });

    if (manuscriptValidation.isPdf) {
      // Already a PDF
      manuscriptPdfPath = manuscriptDocxPath;
      console.log("[processUpdateDraftJob] Manuscript is already PDF");
    } else if (manuscriptValidation.isDocx) {
      try {
        manuscriptPdfPath = await convertDocxToPdf(
          manuscriptDocxPath,
          (p, step) => {
            const mapped = 25 + Math.round((p / 100) * 10);
            updateJob(jobId, {
              progress: mapped,
              step: step || "Converting manuscript to PDF...",
            });
          },
        );

        if (!isValidPdf(manuscriptPdfPath)) {
          throw new Error("Manuscript PDF is invalid after conversion.");
        }
        tempFiles.push(manuscriptPdfPath);
        console.log(
          "[processUpdateDraftJob] Manuscript converted to PDF:",
          manuscriptPdfPath,
        );
      } catch (convErr) {
        console.error(
          "[processUpdateDraftJob] Manuscript conversion failed:",
          convErr,
        );
        throw new Error(`Manuscript PDF conversion failed: ${convErr.message}`);
      }
    }

    // Convert cover letter
    updateJob(jobId, {
      progress: 35,
      step: "Converting cover letter to PDF...",
    });

    if (coverLetterValidation.isPdf) {
      coverLetterPdfPath = coverLetterDocxPath;
      console.log("[processUpdateDraftJob] Cover letter is already PDF");
    } else if (coverLetterValidation.isDocx) {
      try {
        coverLetterPdfPath = await convertDocxToPdf(
          coverLetterDocxPath,
          (p, step) => {
            const mapped = 35 + Math.round((p / 100) * 10);
            updateJob(jobId, {
              progress: mapped,
              step: step || "Converting cover letter to PDF...",
            });
          },
        );

        if (!isValidPdf(coverLetterPdfPath)) {
          throw new Error("Cover letter PDF is invalid after conversion.");
        }
        tempFiles.push(coverLetterPdfPath);
      } catch (convErr) {
        throw new Error(
          `Cover letter PDF conversion failed: ${convErr.message}`,
        );
      }
    }

    // Convert declaration
    updateJob(jobId, {
      progress: 45,
      step: "Converting declaration to PDF...",
    });

    if (declarationValidation.isPdf) {
      declarationPdfPath = declarationDocxPath;
      console.log("[processUpdateDraftJob] Declaration is already PDF");
    } else if (declarationValidation.isDocx) {
      try {
        declarationPdfPath = await convertDocxToPdf(
          declarationDocxPath,
          (p, step) => {
            const mapped = 45 + Math.round((p / 100) * 10);
            updateJob(jobId, {
              progress: mapped,
              step: step || "Converting declaration to PDF...",
            });
          },
        );

        if (!isValidPdf(declarationPdfPath)) {
          throw new Error("Declaration PDF is invalid after conversion.");
        }
        tempFiles.push(declarationPdfPath);
      } catch (convErr) {
        throw new Error(
          `Declaration PDF conversion failed: ${convErr.message}`,
        );
      }
    }

    const customManuscriptId = existingManuscript.customId;

    // ═══════════════════════════════════════════════════════════
    // 🔥 UPLOAD DOCX FILES TO GOOGLE DRIVE
    // ═══════════════════════════════════════════════════════════
    updateJob(jobId, {
      progress: 55,
      step: "Uploading files to Google Drive...",
    });

    // Initialize with existing values
    let manuscriptFile = existingManuscript.manuscriptFile;
    let manuscriptDriveFileId = existingManuscript.manuscriptDriveFileId;
    let manuscriptDriveViewUrl = existingManuscript.manuscriptDriveViewUrl;

    let coverLetterFile = existingManuscript.coverLetterFile;
    let coverLetterDriveFileId = existingManuscript.coverLetterDriveFileId;
    let coverLetterDriveViewUrl = existingManuscript.coverLetterDriveViewUrl;

    let declarationFile = existingManuscript.declarationFile;
    let declarationDriveFileId = existingManuscript.declarationDriveFileId;
    let declarationDriveViewUrl = existingManuscript.declarationDriveViewUrl;

    // Upload new manuscript
    if (hasNewManuscript) {
      updateJob(jobId, {
        progress: 58,
        step: "Uploading manuscript to Drive...",
      });

      // Delete old file
      if (existingManuscript.manuscriptDriveFileId) {
        try {
          await deleteFileFromDrive(existingManuscript.manuscriptDriveFileId);
          console.log(
            "[processUpdateDraftJob] Deleted old manuscript from Drive",
          );
        } catch (delErr) {
          console.warn(
            "[processUpdateDraftJob] Could not delete old manuscript:",
            delErr.message,
          );
        }
      }

      const manuscriptResult = await uploadFileToDrive(manuscriptDocxPath, {
        filename: `manuscript_${customManuscriptId}_updated_${Date.now()}.docx`,
      });

      manuscriptFile = manuscriptResult.driveViewUrl;
      manuscriptDriveFileId = manuscriptResult.driveFileId;
      manuscriptDriveViewUrl = manuscriptResult.driveViewUrl;

      console.log("[processUpdateDraftJob] Uploaded new manuscript");
    }

    // Upload new cover letter
    if (hasNewCoverLetter) {
      updateJob(jobId, {
        progress: 62,
        step: "Uploading cover letter to Drive...",
      });

      // Delete old file
      if (existingManuscript.coverLetterDriveFileId) {
        try {
          await deleteFileFromDrive(existingManuscript.coverLetterDriveFileId);
        } catch (delErr) { }
      }

      const coverLetterResult = await uploadFileToDrive(coverLetterDocxPath, {
        filename: `cover_letter_${customManuscriptId}_updated_${Date.now()}.docx`,
      });

      coverLetterFile = coverLetterResult.driveViewUrl;
      coverLetterDriveFileId = coverLetterResult.driveFileId;
      coverLetterDriveViewUrl = coverLetterResult.driveViewUrl;

      console.log("[processUpdateDraftJob] Uploaded new cover letter");
    }

    // Upload new declaration
    if (hasNewDeclaration) {
      updateJob(jobId, {
        progress: 66,
        step: "Uploading declaration to Drive...",
      });

      // Delete old file
      if (existingManuscript.declarationDriveFileId) {
        try {
          await deleteFileFromDrive(existingManuscript.declarationDriveFileId);
        } catch (delErr) { }
      }

      const declarationResult = await uploadFileToDrive(declarationDocxPath, {
        filename: `declaration_${customManuscriptId}_updated_${Date.now()}.docx`,
      });

      declarationFile = declarationResult.driveViewUrl;
      declarationDriveFileId = declarationResult.driveFileId;
      declarationDriveViewUrl = declarationResult.driveViewUrl;

      console.log("[processUpdateDraftJob] Uploaded new declaration");
    }

    // ═══════════════════════════════════════════════════════════
    // 🔥 CREATE MERGED PDF
    // ═══════════════════════════════════════════════════════════
    updateJob(jobId, { progress: 70, step: "Creating merged PDF..." });

    const mergedPdfResult = await createMergedPDFWithTable(
      manuscriptPdfPath,
      coverLetterPdfPath,
      declarationPdfPath,
      {
        ...body,
        billingInfo: billingInfo,
        authors: authorObjectIds,
        correspondingAuthor: correspondingAuthorObjectId,
      },
      customManuscriptId,
    );

    tempFiles.push(mergedPdfResult.localPath);

    // ═══════════════════════════════════════════════════════════
    // 🔥 UPLOAD MERGED PDF
    // ═══════════════════════════════════════════════════════════
    updateJob(jobId, { progress: 80, step: "Uploading merged PDF..." });

    // Delete old merged file
    if (existingManuscript.mergedDriveFileId) {
      try {
        await deleteFileFromDrive(existingManuscript.mergedDriveFileId);
        console.log("[processUpdateDraftJob] Deleted old merged PDF");
      } catch (delErr) { }
    }

    const mergedResult = await uploadFileToDrive(mergedPdfResult.localPath, {
      filename: `merged_${customManuscriptId}_${Date.now()}.pdf`,
    });

    const mergedFileUrl = mergedResult.driveViewUrl;
    const mergedDriveFileId = mergedResult.driveFileId;
    const mergedDriveViewUrl = mergedResult.driveViewUrl;

    console.log("[processUpdateDraftJob] Uploaded merged PDF");

    // ═══════════════════════════════════════════════════════════
    // 🔥 UPDATE MANUSCRIPT IN DATABASE
    // ═══════════════════════════════════════════════════════════
    updateJob(jobId, {
      progress: 90,
      step: "Updating manuscript in database...",
    });

    const updateData = {
      type: body.type || undefined,
      title: body.title || undefined,
      abstract: body.abstract || undefined,
      keywords: body.keywords || undefined,
      classification: body.classification || undefined,
      additionalInfo: additionalInfo || undefined,
      comments: body.comments ?? undefined,
      funding: body.funding || undefined,
      billingInfo: billingInfo || undefined,
      authors: authorObjectIds,
      correspondingAuthor: correspondingAuthorObjectId,

      // File URLs
      manuscriptFile: manuscriptFile,
      manuscriptDriveFileId: manuscriptDriveFileId,
      manuscriptDriveViewUrl: manuscriptDriveViewUrl,

      coverLetterFile: coverLetterFile,
      coverLetterDriveFileId: coverLetterDriveFileId,
      coverLetterDriveViewUrl: coverLetterDriveViewUrl,

      declarationFile: declarationFile,
      declarationDriveFileId: declarationDriveFileId,
      declarationDriveViewUrl: declarationDriveViewUrl,

      mergedFileUrl: mergedFileUrl,
      mergedDriveFileId: mergedDriveFileId,
      mergedDriveViewUrl: mergedDriveViewUrl,

      // Extracted text
      extractedText: manuscriptText,
      coverLetterText: coverLetterText,
      declarationText: declarationText,
      extractedTitle: manuscriptTitle,
      extractedAbstract: manuscriptAbstract,
      extractedKeywords: manuscriptKeywords,

      status: "Saved",
      updatedAt: new Date(),
    };

    // Remove undefined values
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const updatedManuscript = await Manuscript.findByIdAndUpdate(
      manuscriptId,
      updateData,
      { new: true },
    );

    // ═══════════════════════════════════════════════════════════
    // 🔥 UPDATE AUTHORS
    // ═══════════════════════════════════════════════════════════
    updateJob(jobId, { progress: 95, step: "Updating author records..." });

    for (const authorId of authors) {
      if (mongoose.Types.ObjectId.isValid(authorId)) {
        await User.findByIdAndUpdate(
          authorId,
          {
            $addToSet: {
              manuscripts: updatedManuscript._id,
              roles:
                authorId === correspondingAuthorId
                  ? ["author", "corresponding_author"]
                  : ["author"],
            },
          },
          { new: true },
        );
      }
    }

    // ═══════════════════════════════════════════════════════════
    // 🔥 CLEANUP & COMPLETE
    // ═══════════════════════════════════════════════════════════
    await cleanupFiles(tempFiles);

    completeJob(jobId, {
      manuscriptId: updatedManuscript._id,
      customId: customManuscriptId,
      manuscriptDriveViewUrl: manuscriptDriveViewUrl,
      coverLetterDriveViewUrl: coverLetterDriveViewUrl,
      declarationDriveViewUrl: declarationDriveViewUrl,
      mergedDriveViewUrl: mergedDriveViewUrl,
      extractedTitle: manuscriptTitle,
      extractedAbstract: manuscriptAbstract,
      extractedKeywords: manuscriptKeywords,
    });

    console.log("[processUpdateDraftJob] ✅ Job completed successfully");
  } catch (error) {
    console.error(`[processUpdateDraftJob] Error:`, error);

    // Cleanup on error
    await cleanupFiles(tempFiles).catch(() => { });

    failJob(jobId, error);
  }
}

exports.deleteManuscript = async (req, res) => {
  try {
    const { id } = req.params;

    const manuscript = await Manuscript.findById(id);
    if (!manuscript) {
      return res.status(404).json({ message: "Manuscript not found" });
    }

    await Manuscript.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Manuscript deleted successfully",
    });
  } catch (error) {
    console.error("Delete Error:", error);
    return res.status(500).json({
      message: "Server error while deleting manuscript",
    });
  }
};

// manuscriptController.js - Add these functions

// Increment view count (No Auth Required)
// controllers/manuscriptController.js

exports.incrementViewCount = async (req, res) => {
  try {
    const { manuscriptId } = req.params;
    const visitorId = req.headers["x-visitor-id"] || req.ip || "anonymous";

    // 🔍 Debug Log 1
    console.log("📊 INCREMENT VIEW REQUEST:", {
      manuscriptId,
      visitorId,
    });

    const manuscript = await Manuscript.findById(manuscriptId);

    if (!manuscript) {
      console.log("❌ Manuscript NOT FOUND");
      return res.status(404).json({
        success: false,
        message: "Manuscript not found",
      });
    }

    // 🔍 Debug Log 2 - Check Status
    console.log("📄 MANUSCRIPT FOUND:", {
      title: manuscript.title,
      status: manuscript.status,
      currentViewCount: manuscript.viewCount,
    });

    // Only count views for published manuscripts
    if (manuscript.status !== "Published") {
      console.log("⚠️ NOT PUBLISHED - Status:", manuscript.status);
      return res.status(400).json({
        success: false,
        message: "View count only applies to published manuscripts",
        currentStatus: manuscript.status,
      });
    }

    // Check if this visitor has viewed in the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentView = manuscript.uniqueViewers?.find(
      (viewer) =>
        viewer.visitorId === visitorId &&
        new Date(viewer.viewedAt) > twentyFourHoursAgo,
    );

    if (!recentView) {
      console.log("✅ NEW VIEW - Incrementing...");

      const updatedManuscript = await Manuscript.findByIdAndUpdate(
        manuscriptId,
        {
          $inc: { viewCount: 1 },
          $push: {
            uniqueViewers: {
              $each: [{ visitorId: visitorId, viewedAt: new Date() }],
              $slice: -1000,
            },
          },
          $set: { lastViewedAt: new Date() },
        },
        { new: true },
      );

      console.log("✅ VIEW COUNT UPDATED:", updatedManuscript.viewCount);

      return res.json({
        success: true,
        message: "View count incremented",
        isNewView: true,
        viewCount: updatedManuscript.viewCount,
      });
    }

    console.log("⏭️ Already viewed in last 24h");

    return res.json({
      success: true,
      message: "View already counted",
      isNewView: false,
      viewCount: manuscript.viewCount,
    });
  } catch (error) {
    console.error("❌ ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get most viewed manuscripts (No Auth Required)
exports.getMostViewedManuscripts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const manuscripts = await Manuscript.find({ status: "Published" })
      .sort({ viewCount: -1 })
      .limit(parseInt(limit))
      .populate("authors", "firstName middleName lastName")
      .select(
        "title customId viewCount publishedAt issueVolume issueNumber issueYear",
      );

    res.json({
      success: true,
      count: manuscripts.length,
      data: manuscripts,
    });
  } catch (error) {
    console.error("Error fetching most viewed manuscripts:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports.convertDocxToPdf = convertDocxToPdf;
module.exports.isValidPdf = isValidPdf;
