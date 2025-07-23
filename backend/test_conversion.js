const { PythonShell } = require("python-shell");
const path = require("path");
const fs = require("fs");
const os = require("os");

// Create a test DOCX file path (you can replace this with an actual DOCX file path)
const testDocxPath = path.join(__dirname, "public", "sample.docx");

// Check if test file exists
if (!fs.existsSync(testDocxPath)) {
	console.error("Test DOCX file not found at:", testDocxPath);
	console.log("Please provide a valid DOCX file path to test conversion.");
	process.exit(1);
}

console.log("Testing LibreOffice conversion...");
console.log("Input file:", testDocxPath);

const scriptPath = path.join(__dirname, "utils/convertToPdf.py");
const outputPdf = testDocxPath.replace(/\.docx?$/, ".pdf");

console.log("Script path:", scriptPath);
console.log("Output PDF:", outputPdf);

const shell = new PythonShell(scriptPath, {
	args: [testDocxPath, outputPdf],
	pythonPath: "python",
	env: { ...process.env, PYTHONIOENCODING: "utf-8" },
});

let output = [];
let errorOutput = [];

shell.on("message", (message) => {
	console.log("[Python Output]:", message);
	output.push(message);
});

shell.on("stderr", (stderr) => {
	console.error("[Python Error]:", stderr);
	errorOutput.push(stderr);
});

shell.on("error", (err) => {
	console.error("[PythonShell Error]:", err);
});

shell.end((err, code, signal) => {
	console.log("\n=== Conversion Result ===");
	if (err) {
		console.error("Conversion failed:", err);
		if (errorOutput.length > 0) {
			console.error("Error output:", errorOutput.join("\n"));
		}
	} else {
		console.log("Conversion completed successfully");
		console.log("Output:", output.join("\n"));

		// Check if PDF was created
		if (fs.existsSync(outputPdf)) {
			const stats = fs.statSync(outputPdf);
			console.log(`PDF created: ${outputPdf} (${stats.size} bytes)`);
		} else {
			console.error("PDF file was not created");
		}
	}

	console.log("Exit code:", code);
	console.log("Signal:", signal);
});
