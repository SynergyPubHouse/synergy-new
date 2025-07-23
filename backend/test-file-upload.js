const { FileUploadManager } = require("./utils/fileUpload");
const fs = require("fs");
const path = require("path");

async function testCompleteWorkflow() {
	try {
		console.log("🧪 Testing Complete File Upload Workflow\n");

		// Create test PDF content
		const testContent =
			"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF";

		// Create test files
		const testFiles = {
			manuscript: path.join(__dirname, "test-manuscript.pdf"),
			coverLetter: path.join(__dirname, "test-coverletter.pdf"),
			declaration: path.join(__dirname, "test-declaration.pdf"),
			merged: path.join(__dirname, "test-merged.pdf"),
		};

		// Write test files
		for (const [type, filePath] of Object.entries(testFiles)) {
			fs.writeFileSync(filePath, testContent);
			console.log(`📄 Created test ${type} file: ${filePath}`);
		}

		// Initialize file upload manager
		const fileUploadManager = new FileUploadManager();

		// Test uploads for each file type
		console.log("\n🚀 Testing uploads...\n");

		const results = {};

		for (const [type, filePath] of Object.entries(testFiles)) {
			console.log(`📤 Uploading ${type}...`);
			try {
				const result = await fileUploadManager.uploadFile(
					filePath,
					`test_${type}_${Date.now()}.pdf`,
					type === "coverLetter" ? "coverLetter" : type
				);

				console.log(
					`✅ ${type} upload successful:`,
					result.storageType
				);
				console.log(
					`🔗 URL: ${result.webViewLink || result.webContentLink}`
				);
				results[type] = result;
			} catch (error) {
				console.error(`❌ ${type} upload failed:`, error.message);
				results[type] = { error: error.message };
			}
			console.log();
		}

		// Clean up test files
		for (const filePath of Object.values(testFiles)) {
			try {
				fs.unlinkSync(filePath);
			} catch (e) {
				// Ignore cleanup errors
			}
		}

		console.log("📊 Upload Results Summary:");
		console.log("=".repeat(50));

		for (const [type, result] of Object.entries(results)) {
			if (result.error) {
				console.log(`❌ ${type}: Failed - ${result.error}`);
			} else {
				console.log(
					`✅ ${type}: ${result.storageType} - ${
						result.fileName || "Success"
					}`
				);
			}
		}

		console.log("\n🎉 Test completed!");

		// Show Google Drive folder link if available
		if (process.env.GOOGLE_DRIVE_FOLDER_ID) {
			console.log(
				`\n📁 Google Drive Folder: https://drive.google.com/drive/folders/${process.env.GOOGLE_DRIVE_FOLDER_ID}`
			);
		}
	} catch (error) {
		console.error("❌ Test failed:", error.message);
		throw error;
	}
}

// Run the test
if (require.main === module) {
	testCompleteWorkflow()
		.then(() => {
			console.log("Test completed successfully!");
		})
		.catch((error) => {
			console.error("Test failed:", error.message);
			process.exit(1);
		});
}

module.exports = { testCompleteWorkflow };
