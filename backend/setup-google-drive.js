const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

async function setupGoogleDrive() {
	try {
		console.log("🚀 Setting up Google Drive for Synergy World Press...\n");

		// Initialize Google Auth
		const credentialsPath = path.join(__dirname, "google-credentials.json");

		if (!fs.existsSync(credentialsPath)) {
			throw new Error("❌ Google credentials file not found!");
		}

		const auth = new google.auth.GoogleAuth({
			keyFile: credentialsPath,
			scopes: ["https://www.googleapis.com/auth/drive"],
		});

		const drive = google.drive({ version: "v3", auth });

		// Test connection
		console.log("🔍 Testing Google Drive connection...");
		const aboutResponse = await drive.about.get({
			fields: "user(displayName,emailAddress),storageQuota(limit,usage)",
		});

		console.log("✅ Connected successfully!");
		console.log(
			"📧 Service Account:",
			aboutResponse.data.user.emailAddress
		);
		console.log("💾 Storage:", aboutResponse.data.storageQuota);
		console.log();

		// Create main folder for Synergy World Press
		console.log("📁 Creating main folder...");
		const folderResponse = await drive.files.create({
			resource: {
				name: "Synergy World Press Documents",
				mimeType: "application/vnd.google-apps.folder",
			},
			fields: "id,webViewLink",
		});

		const folderId = folderResponse.data.id;
		const folderLink = folderResponse.data.webViewLink;

		console.log("✅ Main folder created!");
		console.log("📁 Folder ID:", folderId);
		console.log("🔗 Folder Link:", folderLink);
		console.log();

		// Create subfolders
		const subfolders = [
			"Manuscripts",
			"Cover Letters",
			"Declarations",
			"Merged PDFs",
		];

		const subfolderIds = {};

		for (const subfolderName of subfolders) {
			console.log(`📂 Creating ${subfolderName} subfolder...`);
			const subfolderResponse = await drive.files.create({
				resource: {
					name: subfolderName,
					mimeType: "application/vnd.google-apps.folder",
					parents: [folderId],
				},
				fields: "id,webViewLink",
			});

			subfolderIds[subfolderName] = subfolderResponse.data.id;
			console.log(`✅ ${subfolderName} ID:`, subfolderResponse.data.id);
		}

		// Make the main folder publicly accessible
		console.log("\n🌐 Setting folder permissions...");
		await drive.permissions.create({
			fileId: folderId,
			requestBody: {
				role: "reader",
				type: "anyone",
			},
		});

		console.log("✅ Folder permissions set!");

		// Generate .env configuration
		console.log("\n📋 Configuration for your .env file:");
		console.log("=".repeat(50));
		console.log(`USE_GOOGLE_DRIVE=true`);
		console.log(`GOOGLE_DRIVE_FOLDER_ID=${folderId}`);
		console.log(
			`GOOGLE_DRIVE_MANUSCRIPTS_FOLDER=${subfolderIds.Manuscripts}`
		);
		console.log(
			`GOOGLE_DRIVE_COVERLETTERS_FOLDER=${subfolderIds["Cover Letters"]}`
		);
		console.log(
			`GOOGLE_DRIVE_DECLARATIONS_FOLDER=${subfolderIds.Declarations}`
		);
		console.log(
			`GOOGLE_DRIVE_MERGED_FOLDER=${subfolderIds["Merged PDFs"]}`
		);
		console.log("=".repeat(50));

		console.log("\n📝 Instructions:");
		console.log("1. Copy the above configuration to your .env file");
		console.log("2. The main folder link is:", folderLink);
		console.log("3. You can share this folder with others if needed");
		console.log(
			"4. All uploaded files will be stored in the respective subfolders"
		);

		return {
			mainFolderId: folderId,
			folderLink,
			subfolderIds,
		};
	} catch (error) {
		console.error("❌ Error setting up Google Drive:", error.message);
		if (error.response) {
			console.error("API Error:", error.response.data);
		}
		throw error;
	}
}

// Test file upload
async function testUpload(folderId) {
	try {
		console.log("\n🧪 Testing file upload...");

		// Create a test PDF file
		const testContent =
			"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF";
		const testFilePath = path.join(__dirname, "test.pdf");
		fs.writeFileSync(testFilePath, testContent);

		const auth = new google.auth.GoogleAuth({
			keyFile: path.join(__dirname, "google-credentials.json"),
			scopes: ["https://www.googleapis.com/auth/drive"],
		});

		const drive = google.drive({ version: "v3", auth });

		const response = await drive.files.create({
			resource: {
				name: "test-upload.pdf",
				parents: [folderId],
			},
			media: {
				mimeType: "application/pdf",
				body: fs.createReadStream(testFilePath),
			},
			fields: "id,webViewLink",
		});

		// Make it publicly readable
		await drive.permissions.create({
			fileId: response.data.id,
			requestBody: {
				role: "reader",
				type: "anyone",
			},
		});

		console.log("✅ Test file uploaded successfully!");
		console.log("📄 File ID:", response.data.id);
		console.log("🔗 File Link:", response.data.webViewLink);

		// Clean up test file
		fs.unlinkSync(testFilePath);

		// Delete test file from Drive
		await drive.files.delete({
			fileId: response.data.id,
		});
		console.log("🧹 Test file cleaned up");
	} catch (error) {
		console.error("❌ Test upload failed:", error.message);
	}
}

// Run setup
if (require.main === module) {
	setupGoogleDrive()
		.then(async (result) => {
			await testUpload(result.subfolderIds["Merged PDFs"]);
			console.log("\n🎉 Google Drive setup completed successfully!");
		})
		.catch((error) => {
			console.error("Setup failed:", error.message);
			process.exit(1);
		});
}

module.exports = { setupGoogleDrive, testUpload };
