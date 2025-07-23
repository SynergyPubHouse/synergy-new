const {
	uploadMergedPdf,
	testMergedConnection,
} = require("./utils/googleDriveMerged");
const fs = require("fs");
const path = require("path");

async function testGoogleDriveUpload() {
	console.log("🧪 Testing Google Drive Upload for Merged PDFs\n");

	try {
		// Test connection first
		console.log("1. Testing Google Drive connection...");
		const connectionOk = await testMergedConnection();

		if (!connectionOk) {
			console.log(
				"❌ Connection test failed. Please check your credentials and folder permissions."
			);
			return;
		}

		console.log("✅ Connection test passed!\n");

		// Create a test PDF
		console.log("2. Creating test PDF...");
		const testPdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test PDF from Synergy) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000074 00000 n 
0000000120 00000 n 
0000000179 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
273
%%EOF`;

		const testFilePath = path.join(__dirname, "test-merged.pdf");
		fs.writeFileSync(testFilePath, testPdfContent);
		console.log("✅ Test PDF created\n");

		// Upload to Google Drive
		console.log("3. Uploading to Google Drive...");
		const result = await uploadMergedPdf(
			testFilePath,
			`test-upload-${Date.now()}.pdf`
		);

		console.log("✅ Upload successful!");
		console.log("📁 File ID:", result.fileId);
		console.log("🔗 View Link:", result.webViewLink);
		console.log("📥 Download Link:", result.webContentLink);
		console.log("📊 File Size:", result.fileSize, "bytes");

		// Clean up test file
		fs.unlinkSync(testFilePath);
		console.log("🧹 Test file cleaned up locally");

		console.log("\n🎉 Google Drive upload test completed successfully!");
		console.log(
			"📝 Your merged PDFs will be uploaded to:",
			result.webViewLink.split("/")[5]
		);

		return result;
	} catch (error) {
		console.error("❌ Test failed:", error.message);
		if (error.response) {
			console.error("API Error:", error.response.data);
		}

		console.log("\n🔧 Troubleshooting tips:");
		console.log(
			"1. Make sure you shared the folder with: synergyworldpresstest@synergy-world-press.iam.gserviceaccount.com"
		);
		console.log(
			"2. Check that the folder ID in .env is correct: 1FxiUnrnUn6HfaiB0s-ch6ChaEiDnj1E4"
		);
		console.log(
			"3. Verify the service account has write permissions to the folder"
		);

		throw error;
	}
}

// Run the test
if (require.main === module) {
	testGoogleDriveUpload()
		.then(() => {
			console.log(
				"\n✨ Ready to process manuscript submissions with Google Drive!"
			);
		})
		.catch((error) => {
			console.error("\n💥 Setup needs attention before proceeding.");
			process.exit(1);
		});
}

module.exports = { testGoogleDriveUpload };
