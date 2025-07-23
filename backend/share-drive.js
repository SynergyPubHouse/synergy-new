const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

async function shareWithPersonalAccount(personalEmail) {
	try {
		console.log("🔗 Sharing folder with your personal Google account...\n");

		const auth = new google.auth.GoogleAuth({
			keyFile: path.join(__dirname, "google-credentials.json"),
			scopes: ["https://www.googleapis.com/auth/drive"],
		});

		const drive = google.drive({ version: "v3", auth });

		// Get the main folder ID from .env
		const folderId = "15dLYN-Jac0E2Zh2bJJzLKOjsnwTd64LU"; // Main folder ID

		console.log(`📁 Sharing folder (${folderId}) with ${personalEmail}...`);

		// Share with personal account as editor
		await drive.permissions.create({
			fileId: folderId,
			requestBody: {
				role: "writer", // Give write access to personal account
				type: "user",
				emailAddress: personalEmail,
			},
			sendNotificationEmail: true,
		});

		console.log("✅ Folder shared successfully!");
		console.log("📧 Check your email for the sharing notification");

		// Also share all subfolders
		const subfolders = {
			Manuscripts: "1CYy0lfBR_P_VvE6mc7fzO9QFHcCgj6tM",
			"Cover Letters": "1-EcrZMvZJMcrmAO-rnMso5Rt4zqDeBz6",
			Declarations: "1rM3UGNJMsaHjCkZikGhhkiDwl4t2VxSd",
			"Merged PDFs": "16kzquFbBWZKszbbKdR1-2-mZYr98icY9",
		};

		for (const [name, id] of Object.entries(subfolders)) {
			console.log(`📂 Sharing ${name} subfolder...`);
			await drive.permissions.create({
				fileId: id,
				requestBody: {
					role: "writer",
					type: "user",
					emailAddress: personalEmail,
				},
				sendNotificationEmail: false, // Don't spam with notifications
			});
		}

		console.log("\n✅ All folders shared with your personal account!");
		console.log("\n📝 Next steps:");
		console.log(
			"1. Check your personal Gmail for the sharing notification"
		);
		console.log("2. Accept the sharing invitation");
		console.log(
			"3. The files will now use your personal Google Drive storage"
		);
		console.log(
			"4. Your backend will upload files via the service account to your personal Drive"
		);

		return true;
	} catch (error) {
		console.error("❌ Error sharing folder:", error.message);
		if (error.response) {
			console.error("API Error:", error.response.data);
		}
		throw error;
	}
}

// Get email from command line argument
const personalEmail = process.argv[2];

if (!personalEmail) {
	console.log("❌ Please provide your personal Google email address");
	console.log("Usage: node share-drive.js your-email@gmail.com");
	process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(personalEmail)) {
	console.log("❌ Please provide a valid email address");
	process.exit(1);
}

shareWithPersonalAccount(personalEmail)
	.then(() => {
		console.log("\n🎉 Drive sharing setup completed successfully!");
	})
	.catch((error) => {
		console.error("Sharing failed:", error.message);
		process.exit(1);
	});
