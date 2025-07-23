const {
	uploadToSharedFolder,
	testSharedFolderUpload,
} = require("./utils/sharedDriveUpload");
const fs = require("fs");
const path = require("path");

async function testSharedUpload() {
	console.log("🧪 Testing Shared Google Drive Folder Upload\n");

	try {
		// Test connection first
		console.log("1. Testing Google Drive connection...");
		const connectionOk = await testSharedFolderUpload();

		if (!connectionOk) {
			console.log("❌ Connection test failed.");
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
/Length 55
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test PDF - Synergy World Press) Tj
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
284
%%EOF`;

		const testFilePath = path.join(__dirname, "test-shared-upload.pdf");
		fs.writeFileSync(testFilePath, testPdfContent);
		console.log("✅ Test PDF created\n");

		// Upload to shared folder
		console.log("3. Uploading to shared Google Drive folder...");
		const result = await uploadToSharedFolder(
			testFilePath,
			`test-shared-${Date.now()}.pdf`
		);

		console.log("🎉 Upload successful!");
		console.log("📁 File ID:", result.fileId);
		console.log("🔗 View Link:", result.webViewLink);
		console.log("📥 Download Link:", result.webContentLink);
		console.log("📊 File Size:", result.fileSize, "bytes");
		console.log("💾 Storage Type:", result.storageType);

		// Clean up test file
		fs.unlinkSync(testFilePath);
		console.log("🧹 Local test file cleaned up");

		console.log(
			"\n✨ Success! Your merged PDFs will be uploaded to the shared folder."
		);
		console.log("📂 Folder ID: 1FxiUnrnUn6HfaiB0s-ch6ChaEiDnj1E4");
		console.log(
			"🔗 Access your files at: https://drive.google.com/drive/folders/1FxiUnrnUn6HfaiB0s-ch6ChaEiDnj1E4"
		);

		return result;
	} catch (error) {
		console.error("❌ Test failed:", error.message);

		console.log("\n🔧 Troubleshooting:");
		console.log(
			"1. Verify the folder is shared with: synergyworldpresstest@synergy-world-press.iam.gserviceaccount.com"
		);
		console.log(
			'2. Make sure the service account has "Editor" or "Writer" permissions'
		);
		console.log(
			"3. Check the folder ID: 1FxiUnrnUn6HfaiB0s-ch6ChaEiDnj1E4"
		);
		console.log(
			"4. The folder should be accessible at: https://drive.google.com/drive/folders/1FxiUnrnUn6HfaiB0s-ch6ChaEiDnj1E4"
		);

		throw error;
	}
}

// Run the test
if (require.main === module) {
	testSharedUpload()
		.then(() => {
			console.log(
				"\n🚀 Ready for manuscript submissions with Google Drive!"
			);
			process.exit(0);
		})
		.catch((error) => {
			console.error(
				"\n💥 Please fix the issues above before proceeding."
			);
			process.exit(1);
		});
}

module.exports = { testSharedUpload };
