const {
	uploadFile: uploadToGoogleDrive,
	testConnection,
} = require("./googleDrive");
const { LocalFileStorage } = require("./localStorage");

class FileUploadManager {
	constructor() {
		this.localStorage = new LocalFileStorage();
		this.useGoogleDrive = process.env.USE_GOOGLE_DRIVE !== "false"; // Default to true
	}

	async uploadFile(filePath, fileName, fileType = "merged") {
		console.log(
			`[FileUploadManager] Starting upload for: ${fileName} (type: ${fileType})`
		);

		// Try Google Drive first if enabled
		if (this.useGoogleDrive) {
			try {
				console.log(
					"[FileUploadManager] Attempting Google Drive upload..."
				);
				const result = await uploadToGoogleDrive(
					filePath,
					fileName,
					fileType
				);
				console.log(
					"[FileUploadManager] Google Drive upload successful"
				);
				return { ...result, storageType: "googledrive" };
			} catch (error) {
				console.warn(
					"[FileUploadManager] Google Drive upload failed, falling back to local storage:",
					error.message
				);
				// Continue to local storage fallback
			}
		} else {
			console.log(
				"[FileUploadManager] Google Drive disabled, using local storage"
			);
		}

		// Fallback to local storage
		try {
			console.log("[FileUploadManager] Using local storage...");
			const result = await this.localStorage.uploadFile(
				filePath,
				fileName
			);
			console.log("[FileUploadManager] Local storage upload successful");
			return { ...result, storageType: "local" };
		} catch (error) {
			console.error(
				"[FileUploadManager] Both Google Drive and local storage failed"
			);
			throw new Error(
				`All upload methods failed. Last error: ${error.message}`
			);
		}
	}

	async testConnections() {
		const results = {
			googleDrive: false,
			localStorage: true, // Local storage should always work
		};

		// Test Google Drive
		if (this.useGoogleDrive) {
			try {
				results.googleDrive = await testConnection();
			} catch (error) {
				console.warn(
					"Google Drive connection test failed:",
					error.message
				);
			}
		}

		return results;
	}
}

// Export both the class and singleton instance
const fileUploadManager = new FileUploadManager();

module.exports = {
	FileUploadManager,
	uploadFile: (filePath, fileName, fileType) =>
		fileUploadManager.uploadFile(filePath, fileName, fileType),
	testConnections: () => fileUploadManager.testConnections(),
};
