const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
const os = require("os");

// Scopes for Drive access
const SCOPES = ["https://www.googleapis.com/auth/drive"];

let driveClient = null;

function getPrivateKeyFromEnv(raw) {
  if (!raw) return null;
  return raw.replace(/\\n/g, "\n");
}

function getDriveClient() {
  console.log("=== ENV CHECK ===");
  console.log("Email:", process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL ? "✅" : "❌");
  console.log("Key:", process.env.GOOGLE_DRIVE_PRIVATE_KEY ? "✅" : "❌");
  console.log("Folder:", process.env.GOOGLE_DRIVE_PDFS_FOLDER_ID || "❌ Missing");
  console.log("=================");

  if (driveClient) return driveClient;

  const clientEmail = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = getPrivateKeyFromEnv(process.env.GOOGLE_DRIVE_PRIVATE_KEY);

  if (!clientEmail || !privateKey) {
    throw new Error(
      "Google Drive service account credentials are missing. Set GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL and GOOGLE_DRIVE_PRIVATE_KEY."
    );
  }

  const jwt = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: SCOPES,
  });

  driveClient = google.drive({ version: "v3", auth: jwt });
  return driveClient;
}

function buildDriveViewUrl(fileId) {
  return `https://drive.google.com/file/d/${fileId}/view`;
}

// ✅ SIMPLIFIED UPLOAD FUNCTION
async function uploadPdfToDrive(localPdfPath, options = {}) {
  const drive = getDriveClient();

  console.log("📤 Starting upload...");
  console.log("📁 File:", localPdfPath);

  if (!fs.existsSync(localPdfPath)) {
    throw new Error(`Local PDF not found: ${localPdfPath}`);
  }

  const filename = options.filename || path.basename(localPdfPath);
  const folderId = process.env.GOOGLE_DRIVE_PDFS_FOLDER_ID;

  console.log("📂 Target Folder:", folderId);

  if (!folderId) {
    throw new Error("GOOGLE_DRIVE_PDFS_FOLDER_ID is not set in .env!");
  }

  // Simple file metadata - always upload to shared folder
  const fileMetadata = {
    name: filename,
    parents: [folderId],
  };

  const media = {
    mimeType: "application/pdf",
    body: fs.createReadStream(localPdfPath),
  };

  try {
    console.log("⏳ Uploading to Google Drive...");

    const createResp = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: "id,webViewLink,webContentLink",
    });

    const fileId = createResp?.data?.id;
    if (!fileId) throw new Error("Drive did not return file ID on upload");

    console.log("✅ File uploaded! ID:", fileId);

    // Make file public (anyone with link can view)
    console.log("🔓 Setting public access...");
    await drive.permissions.create({
      fileId: fileId,
      requestBody: { 
        role: "reader", 
        type: "anyone" 
      },
    });

    // Retrieve links
    const getResp = await drive.files.get({
      fileId: fileId,
      fields: "id,webViewLink,webContentLink,name,size,mimeType",
    });

    console.log("✅ Upload complete!");

    return {
      driveFileId: fileId,
      driveViewUrl: buildDriveViewUrl(fileId),
      webViewLink: getResp?.data?.webViewLink || null,
      webContentLink: getResp?.data?.webContentLink || null,
      name: getResp?.data?.name || filename,
      size: getResp?.data?.size || null,
    };

  } catch (error) {
    console.error("❌ Upload Error:", error.message);
    throw error;
  }
}

// ✅ SIMPLIFIED DOWNLOAD FUNCTION
async function downloadDriveFileToTemp(driveFileId, outBaseName = null) {
  const drive = getDriveClient();
  const fileName = (outBaseName || `drive_${Date.now()}`) + ".pdf";
  const outPath = path.join(os.tmpdir(), fileName);

  console.log("📥 Downloading file:", driveFileId);

  try {
    const resp = await drive.files.get(
      { fileId: driveFileId, alt: "media" },
      { responseType: "stream" }
    );

    await new Promise((resolve, reject) => {
      const ws = fs.createWriteStream(outPath);
      resp.data
        .on("error", (err) => reject(err))
        .pipe(ws)
        .on("error", (err) => reject(err))
        .on("finish", () => resolve());
    });

    console.log("✅ Downloaded to:", outPath);
    return outPath;

  } catch (error) {
    console.error("❌ Download Error:", error.message);
    throw error;
  }
}

// ✅ SIMPLIFIED DELETE FUNCTION
async function deleteFileFromDrive(driveFileId) {
  const drive = getDriveClient();
  
  console.log("🗑️ Deleting file:", driveFileId);

  try {
    await drive.files.delete({ fileId: driveFileId });
    console.log("✅ File deleted!");
  } catch (error) {
    console.error("❌ Delete Error:", error.message);
    throw error;
  }
}

module.exports = {
  uploadPdfToDrive,
  buildDriveViewUrl,
  downloadDriveFileToTemp,
  deleteFileFromDrive,
};