const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const SCOPES = ["https://www.googleapis.com/auth/drive"];

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
} catch (error) {
	console.error(
		"Failed to initialize Google Drive authentication:",
		error.message
	);
	throw error;
}

// Configuration - Use your shared folder ID
const MERGED_PDF_FOLDER_ID =
	process.env.GOOGLE_DRIVE_MERGED_FOLDER ||
	process.env.GOOGLE_DRIVE_FOLDER_ID ||
	"1FxiUnrnUn6HfaiB0s-ch6ChaEiDnj1E4";

console.log("Environment check:");
console.log(
	"GOOGLE_DRIVE_MERGED_FOLDER:",
	process.env.GOOGLE_DRIVE_MERGED_FOLDER
);
console.log("GOOGLE_DRIVE_FOLDER_ID:", process.env.GOOGLE_DRIVE_FOLDER_ID);
console.log("Final MERGED_PDF_FOLDER_ID:", MERGED_PDF_FOLDER_ID);

async function uploadMergedPdf(filePath, fileName) {
	try {
		console.log(
			`[GoogleDriveMerged] Starting upload: ${filePath} -> ${fileName}`
		);

		// Verify file exists and is readable
		if (!fs.existsSync(filePath)) {
			throw new Error(`File not found: ${filePath}`);
		}

		const fileStats = fs.statSync(filePath);
		if (fileStats.size === 0) {
			throw new Error(`File is empty: ${filePath}`);
		}

		console.log(`[GoogleDriveMerged] File size: ${fileStats.size} bytes`);
		console.log(
			`[GoogleDriveMerged] Target folder ID: ${MERGED_PDF_FOLDER_ID}`
		);

		const fileMetadata = {
			name: fileName,
			parents: [MERGED_PDF_FOLDER_ID], // Your shared folder ID
		};

		const media = {
			mimeType: "application/pdf",
			body: fs.createReadStream(filePath),
		};

		console.log("[GoogleDriveMerged] Creating file on Google Drive...");
		const response = await drive.files.create({
			resource: fileMetadata,
			media: media,
			fields: "id,webViewLink,webContentLink",
		});

		if (!response.data.id) {
			throw new Error(
				"Failed to create file on Google Drive: no file ID returned"
			);
		}

		console.log(
			`[GoogleDriveMerged] File created with ID: ${response.data.id}`
		);

		// Make the file publicly readable
		console.log("[GoogleDriveMerged] Setting file permissions...");
		await drive.permissions.create({
			fileId: response.data.id,
			requestBody: {
				role: "reader",
				type: "anyone",
			},
		});

		// Get the file details with links
		console.log("[GoogleDriveMerged] Getting file details...");
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

		console.log(
			"[GoogleDriveMerged] Upload completed successfully:",
			result
		);
		return result;
	} catch (error) {
		console.error("Error uploading merged PDF to Google Drive:", error);

		// Provide more specific error information
		if (error.response) {
			console.error("Google API Error Response:", {
				status: error.response.status,
				statusText: error.response.statusText,
				data: error.response.data,
			});
		}

		// Re-throw with more context
		throw new Error(`Google Drive upload failed: ${error.message}`);
	}
}

// Test Google Drive connection for merged PDF upload
async function testMergedConnection() {
	try {
		console.log("[GoogleDriveMerged] Testing connection...");
		const response = await drive.about.get({
			fields: "user(displayName,emailAddress),storageQuota(limit,usage)",
		});

		console.log("[GoogleDriveMerged] Connection successful!");
		console.log("User:", response.data.user);
		console.log("Storage:", response.data.storageQuota);

		// Test access to the specific folder
		if (MERGED_PDF_FOLDER_ID) {
			console.log(
				`[GoogleDriveMerged] Testing access to folder: ${MERGED_PDF_FOLDER_ID}`
			);
			const folderResponse = await drive.files.get({
				fileId: MERGED_PDF_FOLDER_ID,
				fields: "id,name,permissions",
			});
			console.log("Folder access successful:", folderResponse.data.name);
		}

		return true;
	} catch (error) {
		console.error(
			"[GoogleDriveMerged] Connection test failed:",
			error.message
		);
		if (error.response) {
			console.error("API Response:", error.response.data);
		}
		return false;
	}
}

module.exports = { uploadMergedPdf, testMergedConnection };
