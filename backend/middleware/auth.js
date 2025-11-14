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

		// With unified login, we need to check all possible account types
		// Try to find the user in all three models
		const [user, editor, reviewer] = await Promise.all([
			User.findById(decoded.id),
			Editor.findById(decoded.id),
			Reviewer.findById(decoded.id)
		]);

		// Set the appropriate user object and continue
		if (editor) {
			req.editor = editor;
			req.user = editor; // Also set as user for compatibility
			req.token = token;
			return next();
		}

		if (reviewer) {
			req.user = reviewer;
			req.user._id = reviewer._id; // Ensure _id is set
			req.token = token;
			return next();
		}

		if (user) {
			req.user = user;
			req.token = token;
			return next();
		}

		throw new Error("User not found in any account type");
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
