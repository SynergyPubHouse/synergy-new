const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Editor = require("../models/Editor");
const Reviewer = require("../models/Reviewer");

const auth = async (req, res, next) => {
	try {
		// Get token from header
		const token = req.header("Authorization")?.replace("Bearer ", "");

		if (!token) {
			return res
				.status(401)
				.json({ message: "No authentication token, access denied" });
		}

		// Verify token
		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		// Check if it's an editor
		if (decoded.role === "editor") {
			const editor = await Editor.findById(decoded.id);
			if (!editor) {
				throw new Error("Editor not found");
			}
			req.editor = editor;
			req.token = token;
			return next();
		}

		// If not an editor, check if it's a reviewer
		if (decoded.role === "reviewer") {
			const reviewer = await Reviewer.findById(decoded.id);
			if (!reviewer) {
				throw new Error("Reviewer not found");
			}
			req.user = reviewer;
			req.user._id = reviewer._id; // Ensure _id is set
			req.token = token;
			return next();
		}

		// If not a reviewer, check if it's a user
		const user = await User.findById(decoded.id);
		if (user) {
			req.user = user;
			req.token = token;
			return next();
		}

		throw new Error("Not authorized");
	} catch (error) {
		console.error("Auth middleware error:", error.message);
		if (
			error.message === "jwt malformed" ||
			error.message === "jwt expired"
		) {
			return res
				.status(401)
				.json({ message: "Token is invalid or expired" });
		}
		return res.status(401).json({ message: error.message });
	}
};

module.exports = auth;
