const fs = require("fs");
const path = require("path");
const os = require("os");

// Local file storage utility as fallback for Google Drive
class LocalFileStorage {
	constructor() {
		// Create uploads directory if it doesn't exist
		this.uploadDir = path.join(__dirname, "../uploads");
		if (!fs.existsSync(this.uploadDir)) {
			fs.mkdirSync(this.uploadDir, { recursive: true });
			console.log(`Created upload directory: ${this.uploadDir}`);
		}
	}

	async uploadFile(filePath, fileName) {
		try {
			console.log(
				`[LocalStorage] Starting upload: ${filePath} -> ${fileName}`
			);

			// Verify source file exists
			if (!fs.existsSync(filePath)) {
				throw new Error(`Source file not found: ${filePath}`);
			}

			const fileStats = fs.statSync(filePath);
			if (fileStats.size === 0) {
				throw new Error(`Source file is empty: ${filePath}`);
			}

			// Generate unique filename
			const timestamp = Date.now();
			const uniqueFileName = `${timestamp}_${fileName}`;
			const destPath = path.join(this.uploadDir, uniqueFileName);

			// Copy file to uploads directory
			fs.copyFileSync(filePath, destPath);

			// Verify the copy was successful
			if (!fs.existsSync(destPath) || fs.statSync(destPath).size === 0) {
				throw new Error("Failed to copy file to uploads directory");
			}

			// Generate accessible URLs (assuming you have a static file server)
			const baseUrl = process.env.BASE_URL || "http://localhost:5000";
			const webViewLink = `${baseUrl}/uploads/${uniqueFileName}`;
			const webContentLink = webViewLink; // Same for local storage

			const result = {
				fileId: uniqueFileName, // Use filename as ID
				webViewLink: webViewLink,
				webContentLink: webContentLink,
				fileName: uniqueFileName,
				fileSize: fileStats.size,
				localPath: destPath,
			};

			console.log(
				"[LocalStorage] Upload completed successfully:",
				result
			);
			return result;
		} catch (error) {
			console.error("Error uploading file to local storage:", error);
			throw new Error(`Local storage upload failed: ${error.message}`);
		}
	}

	// Clean up old files (optional)
	async cleanupOldFiles(maxAgeHours = 24) {
		try {
			const files = fs.readdirSync(this.uploadDir);
			const now = Date.now();
			const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert to milliseconds

			for (const file of files) {
				const filePath = path.join(this.uploadDir, file);
				const stats = fs.statSync(filePath);

				if (now - stats.mtime.getTime() > maxAge) {
					fs.unlinkSync(filePath);
					console.log(`[LocalStorage] Cleaned up old file: ${file}`);
				}
			}
		} catch (error) {
			console.error("Error cleaning up old files:", error);
		}
	}
}

module.exports = { LocalFileStorage };
