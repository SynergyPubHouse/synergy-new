const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const SCOPES = ["https://www.googleapis.com/auth/drive"];

// Your shared folder ID
const SHARED_FOLDER_ID = "1FxiUnrnUn6HfaiB0s-ch6ChaEiDnj1E4";

// Initialize Google Auth
let auth;
let drive;

try {
	const credentialsPath = path.join(__dirname, "../google-credentials.json");

	// Check if credentials file exists
	if (!fs.existsSync(credentialsPath)) {
		throw new Error(
			`Google credentials file not found at: ${credentialsPath}`
		);
	}

	// Validate credentials file
	const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));
	if (!credentials.private_key || !credentials.client_email) {
		throw new Error(
			"Invalid Google credentials file: missing required fields"
		);
	}

	auth = new google.auth.GoogleAuth({
		keyFile: credentialsPath,
		scopes: SCOPES,
	});

	drive = google.drive({ version: "v3", auth });
	console.log("Google Drive authentication initialized successfully");
	console.log("Service Account:", credentials.client_email);
	console.log("Target Folder ID:", SHARED_FOLDER_ID);
} catch (error) {
	console.error(
		"Failed to initialize Google Drive authentication:",
		error.message
	);
	throw error;
}

async function uploadToSharedFolder(filePath, fileName) {
	try {
		console.log(
			`[SharedDriveUpload] Starting upload: ${filePath} -> ${fileName}`
		);

		// Verify file exists and is readable
		if (!fs.existsSync(filePath)) {
			throw new Error(`File not found: ${filePath}`);
		}

		const fileStats = fs.statSync(filePath);
		if (fileStats.size === 0) {
			throw new Error(`File is empty: ${filePath}`);
		}

		console.log(`[SharedDriveUpload] File size: ${fileStats.size} bytes`);

		// First, try to verify access to the shared folder
		try {
			const folderInfo = await drive.files.get({
				fileId: SHARED_FOLDER_ID,
				fields: "id,name,owners,permissions",
			});
			console.log(
				`[SharedDriveUpload] Folder access verified: ${folderInfo.data.name}`
			);
		} catch (folderError) {
			console.error(
				"[SharedDriveUpload] Cannot access shared folder:",
				folderError.message
			);
			throw new Error(
				`Cannot access shared folder. Make sure folder ${SHARED_FOLDER_ID} is shared with the service account.`
			);
		}

		const fileMetadata = {
			name: fileName,
			parents: [SHARED_FOLDER_ID],
		};

		const media = {
			mimeType: "application/pdf",
			body: fs.createReadStream(filePath),
		};

		console.log("[SharedDriveUpload] Uploading file to shared folder...");

		// Try the upload with error handling
		let response;
		try {
			response = await drive.files.create({
				resource: fileMetadata,
				media: media,
				fields: "id,webViewLink,webContentLink,name,size",
			});
		} catch (uploadError) {
			if (
				uploadError.code === 403 &&
				uploadError.message.includes("storageQuotaExceeded")
			) {
				console.log(
					"[SharedDriveUpload] Service account quota exceeded, trying alternative method..."
				);

				// Alternative: Upload to root and then move to shared folder
				const rootFileMetadata = {
					name: fileName,
				};

				const rootResponse = await drive.files.create({
					resource: rootFileMetadata,
					media: media,
					fields: "id,webViewLink,webContentLink,name,size",
				});

				// Now try to move to shared folder
				try {
					await drive.files.update({
						fileId: rootResponse.data.id,
						addParents: SHARED_FOLDER_ID,
						fields: "id,parents",
					});
					response = rootResponse;
					console.log(
						"[SharedDriveUpload] File moved to shared folder successfully"
					);
				} catch (moveError) {
					console.warn(
						"[SharedDriveUpload] Could not move to shared folder, but file uploaded to root"
					);
					response = rootResponse;
				}
			} else {
				throw uploadError;
			}
		}

		if (!response.data.id) {
			throw new Error("Failed to upload file: no file ID returned");
		}

		console.log(
			`[SharedDriveUpload] File uploaded with ID: ${response.data.id}`
		);

		// Make the file publicly readable
		try {
			console.log("[SharedDriveUpload] Setting file permissions...");
			await drive.permissions.create({
				fileId: response.data.id,
				requestBody: {
					role: "reader",
					type: "anyone",
				},
			});
			console.log("[SharedDriveUpload] File made publicly accessible");
		} catch (permError) {
			console.warn(
				"[SharedDriveUpload] Could not set public permissions, file may be private"
			);
		}

		// Get updated file details
		const fileData = await drive.files.get({
			fileId: response.data.id,
			fields: "id,webViewLink,webContentLink,name,size,mimeType",
		});

		const result = {
			fileId: response.data.id,
			webViewLink: fileData.data.webViewLink,
			webContentLink: fileData.data.webContentLink,
			fileName: fileData.data.name,
			fileSize: fileData.data.size,
			storageType: "googledrive",
		};

		console.log("[SharedDriveUpload] Upload completed successfully!");
		console.log("File details:", result);
		return result;
	} catch (error) {
		console.error("Error uploading to shared folder:", error);
		throw new Error(`Shared folder upload failed: ${error.message}`);
	}
}

// Test the shared folder upload
async function testSharedFolderUpload() {
	try {
		console.log("[SharedDriveUpload] Testing shared folder upload...");

		// Test connection
		const aboutResponse = await drive.about.get({
			fields: "user(displayName,emailAddress),storageQuota(limit,usage)",
		});

		console.log("[SharedDriveUpload] Connection successful!");
		console.log("User:", aboutResponse.data.user);

		return true;
	} catch (error) {
		console.error("[SharedDriveUpload] Test failed:", error.message);
		return false;
	}
}

module.exports = { uploadToSharedFolder, testSharedFolderUpload };
