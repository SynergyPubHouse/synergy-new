const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

const SCOPES = ["https://www.googleapis.com/auth/drive"];

const auth = new google.auth.GoogleAuth({
	keyFile: path.join(__dirname, "../google-credentials.json"),
	scopes: SCOPES,
});

const drive = google.drive({ version: "v3", auth });

async function uploadFile(filePath, fileName) {
	try {
		const fileMetadata = {
			name: fileName,
		};

		const media = {
			mimeType: "application/pdf",
			body: fs.createReadStream(filePath),
		};

		const response = await drive.files.create({
			resource: fileMetadata,
			media: media,
			fields: "id,webViewLink",
		});

		await drive.permissions.create({
			fileId: response.data.id,
			requestBody: {
				role: "reader",
				type: "anyone",
			},
		});

		const fileData = await drive.files.get({
			fileId: response.data.id,
			fields: "webViewLink",
		});

		return {
			fileId: response.data.id,
			webViewLink: fileData.data.webViewLink,
		};
	} catch (error) {
		console.error("Error uploading file to Google Drive:", error);
		throw error;
	}
}

module.exports = { uploadFile };
