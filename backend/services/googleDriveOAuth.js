const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
const os = require("os");

// ═══════════════════════════════════════════════════════════════
// MimeType Helper Function
// ═══════════════════════════════════════════════════════════════
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  const mimeTypes = {
    // 📄 Documents
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.odt': 'application/vnd.oasis.opendocument.text',
    '.rtf': 'application/rtf',
    '.txt': 'text/plain',
    
    // 📊 Spreadsheets
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.csv': 'text/csv',
    '.ods': 'application/vnd.oasis.opendocument.spreadsheet',
    
    // 📽️ Presentations
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.odp': 'application/vnd.oasis.opendocument.presentation',
    
    // 🖼️ Images
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.bmp': 'image/bmp',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.tiff': 'image/tiff',
    '.tif': 'image/tiff',
    
    // 🎵 Audio
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.m4a': 'audio/mp4',
    '.flac': 'audio/flac',
    
    // 🎬 Video
    '.mp4': 'video/mp4',
    '.avi': 'video/x-msvideo',
    '.mov': 'video/quicktime',
    '.wmv': 'video/x-ms-wmv',
    '.mkv': 'video/x-matroska',
    '.webm': 'video/webm',
    '.flv': 'video/x-flv',
    
    // 📦 Archives
    '.zip': 'application/zip',
    '.rar': 'application/vnd.rar',
    '.7z': 'application/x-7z-compressed',
    '.tar': 'application/x-tar',
    '.gz': 'application/gzip',
    
    // 💻 Code/Data
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.html': 'text/html',
    '.htm': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.ts': 'application/typescript',
    '.py': 'text/x-python',
    '.java': 'text/x-java-source',
    '.php': 'application/x-php',
    '.sql': 'application/sql',
    '.md': 'text/markdown',
    
    // 📐 Design
    '.psd': 'image/vnd.adobe.photoshop',
    '.ai': 'application/illustrator',
    '.eps': 'application/postscript',
    
    // 📚 Ebooks
    '.epub': 'application/epub+zip',
    '.mobi': 'application/x-mobipocket-ebook',
    
    // 🔧 Others
    '.exe': 'application/x-msdownload',
    '.apk': 'application/vnd.android.package-archive',
    '.dmg': 'application/x-apple-diskimage',
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}

// ═══════════════════════════════════════════════════════════════
// Get File Extension from MimeType (for download)
// ═══════════════════════════════════════════════════════════════
function getExtensionFromMimeType(mimeType) {
  const extensions = {
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'application/vnd.ms-powerpoint': '.ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'video/mp4': '.mp4',
    'audio/mpeg': '.mp3',
    'application/zip': '.zip',
    'text/plain': '.txt',
    'text/csv': '.csv',
    'application/json': '.json',
  };
  
  return extensions[mimeType] || '';
}

// ═══════════════════════════════════════════════════════════════
// OAuth2 Client
// ═══════════════════════════════════════════════════════════════
function getOAuth2Client() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID_pdf,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  if (process.env.GOOGLE_REFRESH_TOKEN) {
    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });
  }

  return oauth2Client;
}
console.log("process.env.GOOGLE_CLIENT_ID_pdf",process.env.GOOGLE_CLIENT_ID_pdf)
console.log("process.env.GOOGLE_CLIENT_SECRET",process.env.GOOGLE_CLIENT_SECRET)
console.log(" process.env.GOOGLE_REDIRECT_URI", process.env.GOOGLE_REDIRECT_URI)

// Auth URL generate karo
function getAuthUrl() {
  const oauth2Client = getOAuth2Client();
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/drive'],
    prompt: 'consent'
  });
}

// Code se tokens lo
async function getTokensFromCode(code) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

// Drive client
function getDriveClient() {
  const oauth2Client = getOAuth2Client();
  return google.drive({ version: 'v3', auth: oauth2Client });
}

function buildDriveViewUrl(fileId) {
  return `https://drive.google.com/file/d/${fileId}/view`;
}

// ═══════════════════════════════════════════════════════════════
// 🚀 UNIVERSAL FILE UPLOAD FUNCTION
// ═══════════════════════════════════════════════════════════════
async function uploadFileToDrive(localFilePath, options = {}) {
  const drive = getDriveClient();
  let uploadedFileId = null;

  console.log("📤 Starting upload (OAuth2)...");
  console.log("📁 File:", localFilePath);

  // Check file exists
  if (!fs.existsSync(localFilePath)) {
    throw new Error(`File not found: ${localFilePath}`);
  }

  // Get file info
  const filename = options.filename || path.basename(localFilePath);
  const mimeType = options.mimeType || getMimeType(localFilePath);
  const folderId = options.folderId || process.env.GOOGLE_DRIVE_FOLDER_ID;

  console.log("📝 Filename:", filename);
  console.log("📋 MimeType:", mimeType);
  console.log("📂 Target Folder:", folderId || "Root");

  const fileMetadata = {
    name: filename,
    parents: folderId ? [folderId] : [],
  };

  const media = {
    mimeType: mimeType,
    body: fs.createReadStream(localFilePath),
  };

  try {
    console.log("⏳ Uploading...");

    const createResp = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: "id,webViewLink,webContentLink,name,size,mimeType",
    });

    const fileId = createResp?.data?.id;
    if (!fileId) throw new Error("Drive did not return file ID");
    uploadedFileId = fileId;

    console.log("✅ Uploaded! ID:", fileId);

    // Make public (optional - based on options)
    if (options.makePublic !== false) {
      await drive.permissions.create({
        fileId: fileId,
        requestBody: { role: "reader", type: "anyone" },
      });
      console.log("🌐 Made public");
    }

    // Get final file info
    const getResp = await drive.files.get({
      fileId: fileId,
      fields: "id,webViewLink,webContentLink,name,size,mimeType,createdTime",
    });

    console.log("✅ Upload Complete!");

    return {
      success: true,
      driveFileId: fileId,
      driveViewUrl: buildDriveViewUrl(fileId),
      webViewLink: getResp?.data?.webViewLink || null,
      webContentLink: getResp?.data?.webContentLink || null,
      name: getResp?.data?.name || filename,
      size: getResp?.data?.size || null,
      mimeType: getResp?.data?.mimeType || mimeType,
      createdTime: getResp?.data?.createdTime || null,
    };

  } catch (error) {
    if (uploadedFileId) {
      try {
        await drive.files.delete({ fileId: uploadedFileId });
        console.log("🗑️ Rolled back Drive upload:", uploadedFileId);
      } catch (cleanupError) {
        console.error(
          "❌ Drive rollback failed after upload error:",
          cleanupError.message,
        );
      }
    }

    console.error("❌ Upload Error:", error.message);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════
// 📥 UNIVERSAL FILE DOWNLOAD FUNCTION
// ═══════════════════════════════════════════════════════════════
// utils/googleDrive.js - Updated Download Function

async function downloadDriveFileToTemp(driveFileId, outBaseName = null) {
    const drive = getDriveClient();

    try {
        // First get file info
        const fileInfo = await drive.files.get({
            fileId: driveFileId,
            fields: "name,mimeType,size",
        });

        const originalName = fileInfo?.data?.name || `drive_${Date.now()}`;
        const mimeType = fileInfo?.data?.mimeType || '';
        const fileSize = fileInfo?.data?.size || 0;

        console.log("📥 Downloading from Drive:");
        console.log("   File ID:", driveFileId);
        console.log("   Name:", originalName);
        console.log("   MimeType:", mimeType);
        console.log("   Size:", fileSize, "bytes");

        // Get file extension
        let ext = path.extname(originalName);
        if (!ext) {
            ext = getExtensionFromMimeType(mimeType);
        }

        const fileName = (outBaseName || `drive_${Date.now()}`) + ext;
        const outPath = path.join(os.tmpdir(), fileName);

        // Download file content
        const resp = await drive.files.get(
            { fileId: driveFileId, alt: "media" },
            { responseType: "stream" }
        );

        // Write to file
        await new Promise((resolve, reject) => {
            const ws = fs.createWriteStream(outPath);
            resp.data
                .on("error", (err) => {
                    console.error("❌ Download stream error:", err);
                    reject(err);
                })
                .pipe(ws)
                .on("error", (err) => {
                    console.error("❌ Write stream error:", err);
                    reject(err);
                })
                .on("finish", () => {
                    console.log("✅ File written to:", outPath);
                    resolve();
                });
        });

        // ✅ VERIFY: Check if downloaded file is valid
        const stats = fs.statSync(outPath);
        console.log("📊 Downloaded file size:", stats.size, "bytes");

        if (stats.size === 0) {
            throw new Error("Downloaded file is empty (0 bytes)");
        }

        // ✅ VERIFY: Check if DOCX file is valid (DOCX is a ZIP file)
        if (ext === '.docx' || mimeType.includes('wordprocessingml')) {
            const fileBuffer = fs.readFileSync(outPath);
            const firstBytes = fileBuffer.slice(0, 4).toString('hex');
            
            // DOCX/ZIP files start with "504b0304" (PK..)
            if (firstBytes !== '504b0304') {
                console.error("❌ Invalid DOCX file. First bytes:", firstBytes);
                
                // Check if it's HTML (Google error page)
                const firstChars = fileBuffer.slice(0, 100).toString('utf8');
                if (firstChars.includes('<!DOCTYPE') || firstChars.includes('<html')) {
                    console.error("❌ Downloaded HTML instead of DOCX:");
                    console.error(firstChars);
                    throw new Error("Google Drive returned HTML page instead of file. Check file permissions.");
                }
                
                throw new Error("Downloaded file is not a valid DOCX file");
            }
            
            console.log("✅ DOCX file validation passed");
        }

        return {
            success: true,
            localPath: outPath,
            fileName: fileName,
            mimeType: mimeType,
            size: stats.size,
        };

    } catch (error) {
        console.error("❌ Download Error:", error.message);
        throw error;
    }
}

// ═══════════════════════════════════════════════════════════════
// 🗑️ DELETE FILE
// ═══════════════════════════════════════════════════════════════
async function deleteFileFromDrive(driveFileId) {
  const drive = getDriveClient();
  
  try {
    await drive.files.delete({ fileId: driveFileId });
    console.log("🗑️ Deleted:", driveFileId);
    return { success: true, deletedId: driveFileId };
  } catch (error) {
    console.error("❌ Delete Error:", error.message);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════
// 📋 GET FILE INFO
// ═══════════════════════════════════════════════════════════════
async function getFileInfo(driveFileId) {
  const drive = getDriveClient();
  
  const resp = await drive.files.get({
    fileId: driveFileId,
    fields: "id,name,size,mimeType,webViewLink,webContentLink,createdTime,modifiedTime",
  });

  return resp.data;
}

// ═══════════════════════════════════════════════════════════════
// 📂 LIST FILES IN FOLDER
// ═══════════════════════════════════════════════════════════════
async function listFilesInFolder(folderId = null) {
  const drive = getDriveClient();
  const targetFolder = folderId || process.env.GOOGLE_DRIVE_FOLDER_ID;
  
  let query = "trashed=false";
  if (targetFolder) {
    query += ` and '${targetFolder}' in parents`;
  }

  const resp = await drive.files.list({
    q: query,
    fields: "files(id,name,size,mimeType,webViewLink,createdTime)",
    orderBy: "createdTime desc",
  });

  return resp.data.files || [];
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════
module.exports = {
  // Auth
  getAuthUrl,
  getTokensFromCode,
  
  // File Operations
  uploadFileToDrive,          // ✅ Universal upload
  downloadDriveFileToTemp,    // ✅ Universal download
  deleteFileFromDrive,
  getFileInfo,
  listFilesInFolder,
  
  // Helpers
  buildDriveViewUrl,
  getMimeType,
  getExtensionFromMimeType,
  
  // Legacy (backward compatibility)
  uploadPdfToDrive: uploadFileToDrive,  // Old function name still works
};
