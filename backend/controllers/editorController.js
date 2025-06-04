const Editor = require("../models/Editor");
const jwt = require("jsonwebtoken");
const Manuscript = require("../models/Manuscript");
const User = require("../models/User");
const Reviewer = require("../models/Reviewer");

// Register a new editor
exports.registerEditor = async (req, res) => {
	try {
		const {
			title,
			firstName,
			middleName,
			lastName,
			email,
			username,
			password,
			specialization,
			experience,
		} = req.body;

		// Check if editor already exists
		const existingEditor = await Editor.findOne({
			$or: [{ email }, { username }],
		});
		if (existingEditor) {
			return res.status(400).json({
				message: "Editor with this email or username already exists",
			});
		}

		// Create new editor
		const editor = new Editor({
			title,
			firstName,
			middleName,
			lastName,
			email,
			username,
			password,
			specialization,
			experience,
		});

		await editor.save();

		res.status(201).json({
			message: "Editor registered successfully",
			editor: {
				id: editor._id,
				title: editor.title,
				firstName: editor.firstName,
				lastName: editor.lastName,
				email: editor.email,
				username: editor.username,
				role: "editor",
			},
		});
	} catch (error) {
		console.error("Editor registration error:", error);
		res.status(500).json({
			message: "Error registering editor",
			error: error.message,
		});
	}
};

// Login editor
exports.loginEditor = async (req, res) => {
	try {
		const { email, password } = req.body;

		// Find editor by email
		const editor = await Editor.findOne({ email });
		if (!editor) {
			return res.status(401).json({
				message: "Invalid email or password",
			});
		}

		// Verify password
		const isMatch = await editor.comparePassword(password);
		if (!isMatch) {
			return res.status(401).json({
				message: "Invalid email or password",
			});
		}

		// Generate JWT token
		const token = jwt.sign(
			{ id: editor._id, role: "editor" },
			process.env.JWT_SECRET,
			{ expiresIn: "24h" }
		);

		res.json({
			message: "Login successful",
			token,
			editor: {
				id: editor._id,
				firstName: editor.firstName,
				lastName: editor.lastName,
				email: editor.email,
				username: editor.username,
				specialization: editor.specialization,
				experience: editor.experience,
				role: "editor",
			},
		});
	} catch (error) {
		console.error("Editor login error:", error);
		res.status(500).json({
			message: "Error logging in",
			error: error.message,
		});
	}
};

// Get editor profile
exports.getProfile = async (req, res) => {
	try {
		const editor = await Editor.findById(req.editor.id).select("-password");
		if (!editor) {
			return res.status(404).json({
				message: "Editor not found",
			});
		}
		res.json(editor);
	} catch (error) {
		console.error("Get editor profile error:", error);
		res.status(500).json({
			message: "Error getting editor profile",
			error: error.message,
		});
	}
};

// Update editor profile
exports.updateProfile = async (req, res) => {
	try {
		const updates = req.body;
		delete updates.password; // Prevent password update through this route

		const editor = await Editor.findByIdAndUpdate(
			req.editor.id,
			{ $set: updates },
			{ new: true, runValidators: true }
		).select("-password");

		if (!editor) {
			return res.status(404).json({
				message: "Editor not found",
			});
		}

		res.json({
			message: "Profile updated successfully",
			editor,
		});
	} catch (error) {
		console.error("Update editor profile error:", error);
		res.status(500).json({
			message: "Error updating editor profile",
			error: error.message,
		});
	}
};

// Get all authors who have submitted manuscripts
exports.getAuthors = async (req, res) => {
	try {
		const authors = await Manuscript.distinct("author");
		res.json(authors);
	} catch (error) {
		console.error("Error fetching authors:", error);
		res.status(500).json({
			message: "Error fetching authors",
			error: error.message,
		});
	}
};

// Get all manuscripts by author
exports.getManuscriptsByAuthor = async (req, res) => {
	try {
		const { author } = req.params;
		const manuscripts = await Manuscript.find({ author })
			.select("title type status submissionDate mergedFileUrl")
			.sort({ submissionDate: -1 });

		res.json(manuscripts);
	} catch (error) {
		console.error("Error fetching manuscripts:", error);
		res.status(500).json({
			message: "Error fetching manuscripts",
			error: error.message,
		});
	}
};

// Get all users who have submitted manuscripts
exports.getUsersWithManuscripts = async (req, res) => {
	try {
		// Find all users who have manuscripts
		const users = await User.find({
			manuscripts: { $exists: true, $ne: [] },
		})
			.select("firstName lastName middleName email manuscripts")
			.lean();

		// For each user, populate their manuscripts
		const usersWithManuscripts = await Promise.all(
			users.map(async (user) => {
				const manuscripts = await Manuscript.find({
					_id: { $in: user.manuscripts },
				})
					.select(
						"title type status submissionDate mergedFile mergedFileUrl authorNotes editorNotes reviewerNotes"
					)
					.lean();

				// Ensure each manuscript has the correct mergedFileUrl
				const processedManuscripts = manuscripts.map((manuscript) => {
					if (manuscript.mergedFile && !manuscript.mergedFileUrl) {
						// If mergedFile exists but mergedFileUrl doesn't, create the URL
						const filename = manuscript.mergedFile.split("/").pop();
						manuscript.mergedFileUrl = `/uploads/${filename}`;
					}
					return manuscript;
				});

				return {
					...user,
					manuscripts: processedManuscripts,
				};
			})
		);

		res.json(usersWithManuscripts);
	} catch (error) {
		console.error("Error in getUsersWithManuscripts:", error);
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Add note to manuscript
exports.addNote = async (req, res) => {
	try {
		const { manuscriptId } = req.params;
		const { text, noteType, action, visibility } = req.body;

		const note = {
			text,
			action,
			visibility: visibility || ["author", "editor"],
			addedBy: {
				_id: req.editor._id,
				name: `${req.editor.firstName} ${req.editor.lastName}`,
				email: req.editor.email,
				role: "editor",
			},
			addedAt: new Date(),
		};

		// Update the appropriate notes array based on the user role
		const updateField = "editorNotes";

		const manuscript = await Manuscript.findByIdAndUpdate(
			manuscriptId,
			{ $push: { [updateField]: note } },
			{ new: true }
		);

		if (!manuscript) {
			return res.status(404).json({ message: "Manuscript not found" });
		}

		res.json(note);
	} catch (error) {
		console.error("Error adding note:", error);
		res.status(500).json({
			message: "Error adding note",
			error: error.message,
		});
	}
};

// Get all reviewers
exports.getReviewers = async (req, res) => {
	try {
		const reviewers = await Reviewer.find()
			.select("firstName lastName email specialization experience")
			.sort({ lastName: 1, firstName: 1 });

		res.json(reviewers);
	} catch (error) {
		console.error("Error fetching reviewers:", error);
		res.status(500).json({
			message: "Error fetching reviewers",
			error: error.message,
		});
	}
};

// Update manuscript status
exports.updateManuscriptStatus = async (req, res) => {
	try {
		const { manuscriptId } = req.params;
		const { status } = req.body;

		const manuscript = await Manuscript.findByIdAndUpdate(
			manuscriptId,
			{ status },
			{ new: true }
		);

		if (!manuscript) {
			return res.status(404).json({ message: "Manuscript not found" });
		}

		res.json(manuscript);
	} catch (error) {
		res.status(500).json({
			message: "Error updating status",
			error: error.message,
		});
	}
};
