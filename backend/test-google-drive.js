// Test script for file upload functionality (Google Drive + Local Storage)
const { uploadFile, testConnections } = require("./utils/fileUpload");
const fs = require("fs");
const path = require("path");

async function runTests() {
	console.log("=== File Upload Test Script ===\n");

	// Test 1: Connection test
	console.log("1. Testing connections...");
	const connectionResults = await testConnections();

	console.log("Connection results:");
	console.log(
		"- Google Drive:",
		connectionResults.googleDrive ? "✅ Connected" : "❌ Failed"
	);
	console.log(
		"- Local Storage:",
		connectionResults.localStorage ? "✅ Available" : "❌ Failed"
	);

	if (!connectionResults.googleDrive && !connectionResults.localStorage) {
		console.error("❌ No storage methods available. Exiting.");
		process.exit(1);
	}

	console.log("\n2. Testing file upload...");

	try {
		// Create a sample PDF-like file for testing
		const testFilePath = path.join(__dirname, "test-upload.txt");
		fs.writeFileSync(
			testFilePath,
			"This is a test file for file upload. Created at: " +
				new Date().toISOString()
		);

		console.log("Created test file:", testFilePath);

		// Upload the test file
		const uploadResult = await uploadFile(
			testFilePath,
			`test-upload-${Date.now()}.txt`
		);

		console.log("✅ Upload test passed!");
		console.log("Upload result:");
		console.log("- Storage Type:", uploadResult.storageType);
		console.log("- File ID:", uploadResult.fileId);
		console.log("- Web View Link:", uploadResult.webViewLink);
		console.log("- File Size:", uploadResult.fileSize, "bytes");

		// Clean up test file
		fs.unlinkSync(testFilePath);
		console.log("Test file cleaned up.");
	} catch (error) {
		console.error("❌ Upload test failed:", error.message);
		process.exit(1);
	}

	console.log(
		"\n🎉 All tests passed! File upload system is working correctly."
	);
}

// Run tests
runTests().catch((error) => {
	console.error("Test script failed:", error);
	process.exit(1);
});
