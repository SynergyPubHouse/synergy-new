const fs = require("fs");
const { exec } = require("child_process");
const path = require("path");

async function convertToPdf(filePath) {
	const outputPath = path.join(
		path.dirname(filePath),
		`${path.basename(filePath, path.extname(filePath))}.pdf`
	);

	return new Promise((resolve, reject) => {
		if (path.extname(filePath).toLowerCase() === ".pdf") {
			resolve(filePath);
		} else {
			exec(
				`libreoffice --headless --convert-to pdf ${filePath} --outdir ${path.dirname(
					outputPath
				)}`,
				(error) => {
					if (error) {
						reject(error);
					} else {
						resolve(outputPath);
					}
				}
			);
		}
	});
}

module.exports = { convertToPdf };
