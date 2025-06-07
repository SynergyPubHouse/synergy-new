const Manuscript = require("../models/Manuscript");
const Reviewer = require("../models/Reviewer");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

// Register a new reviewer
exports.registerReviewer = async (req, res) => {
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

		// Check if reviewer already exists
		const existingReviewer = await Reviewer.findOne({
			$or: [{ email }, { username }],
		});
		if (existingReviewer) {
			return res.status(400).json({
				message: "Reviewer with this email or username already exists",
			});
		}

		// Create new reviewer
		const reviewer = new Reviewer({
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

		await reviewer.save();

		// Generate JWT token
		const token = jwt.sign(
			{ id: reviewer._id, role: "reviewer" },
			process.env.JWT_SECRET,
			{ expiresIn: "24h" }
		);

		res.status(201).json({
			message: "Reviewer registered successfully",
			token,
			user: {
				reviewer: {
					id: reviewer._id,
					title: reviewer.title,
					firstName: reviewer.firstName,
					lastName: reviewer.lastName,
					email: reviewer.email,
					username: reviewer.username,
					specialization: reviewer.specialization,
					experience: reviewer.experience,
					role: "reviewer",
				},
			},
		});
	} catch (error) {
		console.error("Reviewer registration error:", error);
		res.status(500).json({
			message: "Error registering reviewer",
			error: error.message,
		});
	}
};

// Login reviewer
exports.loginReviewer = async (req, res) => {
	try {
		const { email, password } = req.body;

		const reviewer = await Reviewer.findOne({ email });
		if (!reviewer) {
			return res
				.status(401)
				.json({ message: "Invalid email or password" });
		}

		const isMatch = await reviewer.comparePassword(password);
		if (!isMatch) {
			return res
				.status(401)
				.json({ message: "Invalid email or password" });
		}

		const token = jwt.sign(
			{ id: reviewer._id, role: "reviewer" },
			process.env.JWT_SECRET,
			{ expiresIn: "24h" }
		);

		res.json({
			token,
			reviewer: {
				_id: reviewer._id,
				id: reviewer._id,
				firstName: reviewer.firstName,
				lastName: reviewer.lastName,
				email: reviewer.email,
				username: reviewer.username,
				specialization: reviewer.specialization,
				experience: reviewer.experience,
				role: "reviewer",
			},
		});
	} catch (error) {
		console.error("Reviewer login error:", error);
		res.status(500).json({ message: "Error logging in" });
	}
};

// Get reviewer profile
exports.getProfile = async (req, res) => {
	try {
		const reviewer = await Reviewer.findById(req.user.id).select(
			"-password"
		);
		if (!reviewer) {
			return res.status(404).json({ message: "Reviewer not found" });
		}
		res.json(reviewer);
	} catch (error) {
		console.error("Get reviewer profile error:", error);
		res.status(500).json({
			message: "Error getting reviewer profile",
			error: error.message,
		});
	}
};

// Fetch manuscripts assigned to the reviewer
exports.getAssignedManuscripts = async (req, res) => {
	try {
		console.log("Fetching manuscripts for reviewer:", req.user._id);

		// Find the reviewer and populate their assigned manuscripts with corresponding author information
		const reviewer = await Reviewer.findById(req.user._id).populate({
			path: "assignedManuscripts",
			select: "title correspondingAuthor submissionDate status mergedFileUrl reviewerNotes editorNotes",
			populate: {
				path: "correspondingAuthor",
				select: "firstName lastName email"
			}
		});

		if (!reviewer) {
			return res.status(404).json({ message: "Reviewer not found" });
		}

		// Format the manuscripts data
		const formattedManuscripts = reviewer.assignedManuscripts.map(
			(manuscript) => {
				console.log("Populated manuscript correspondingAuthor:", manuscript.correspondingAuthor);
				// Use correspondingAuthor for author data
				let authorData = {
					_id: manuscript.correspondingAuthor?._id || null,
					firstName: manuscript.correspondingAuthor?.firstName || "",
					lastName: manuscript.correspondingAuthor?.lastName || "",
					email: manuscript.correspondingAuthor?.email || "",
					fullName: manuscript.correspondingAuthor?.firstName && manuscript.correspondingAuthor?.lastName
						? `${manuscript.correspondingAuthor.firstName} ${manuscript.correspondingAuthor.lastName}`
						: "Unknown Author",
				};

				// Ensure mergedFileUrl is properly formatted
				let pdfUrl = manuscript.mergedFileUrl || "";
				if (pdfUrl && !pdfUrl.startsWith("http")) {
					pdfUrl = `https://paper-sphere.vercel.app${pdfUrl}`;
				}

				return {
					...manuscript.toObject(),
					author: authorData, // Continue to use 'author' in frontend for now for consistency
					mergedFileUrl: pdfUrl,
				};
			}
		);

		console.log("Found manuscripts:", formattedManuscripts.length);
		res.json(formattedManuscripts);
	} catch (error) {
		console.error("Error fetching manuscripts:", error);
		res.status(500).json({
			message: "Error fetching manuscripts",
			error: error.message,
		});
	}
};

// Submit a review for a manuscript
exports.submitReview = async (req, res) => {
	try {
		const { manuscriptId } = req.params;
		const { comments, recommendation } = req.body;

		// Get the manuscript first to preserve required fields
		const manuscript = await Manuscript.findById(manuscriptId)
			.populate("correspondingAuthor")
			.populate("authors")
			.select("+declarationFile +manuscriptFile +coverLetterFile");

		if (!manuscript) {
			return res.status(404).json({ message: "Manuscript not found" });
		}

		// Get the reviewer's information
		const reviewer = await Reviewer.findById(req.user.id);
		if (!reviewer) {
			return res.status(404).json({ message: "Reviewer not found" });
		}

		if (!manuscript.assignedReviewers.includes(reviewer._id)) {
			return res
				.status(403)
				.json({ message: "Not authorized to review this manuscript" });
		}

		// Map recommendation to appropriate action
		let action;
		switch (recommendation) {
			case "Accept":
				action = "Accepted";
				break;
			case "Minor Revision":
			case "Major Revision":
				action = "Revision Required";
				break;
			case "Reject":
				action = "Rejected";
				break;
			default:
				action = "Reviewed";
		}

		// Create the reviewer note with all required fields
		const reviewerNote = {
			text: comments,
			action: action,
			visibility: ["editor", "reviewer"],
			addedBy: {
				_id: reviewer._id,
				name: `${reviewer.firstName} ${reviewer.lastName}`,
				email: reviewer.email,
				role: "reviewer",
			},
			addedAt: new Date(),
		};

		// Add the review to reviews array
		manuscript.reviews.push({
			reviewerId: reviewer._id,
			comments: comments,
			recommendation: recommendation,
			submittedAt: new Date(),
		});

		// Update the manuscript with the review note
		manuscript.reviewerNotes.push(reviewerNote);
		manuscript.status = "Reviewed";

		// Save the changes
		await manuscript.save();

		// Return the updated manuscript data
		res.json({
			message: "Review submitted successfully",
			manuscript: {
				_id: manuscript._id,
				status: manuscript.status,
				reviewerNotes: manuscript.reviewerNotes,
			},
		});
	} catch (error) {
		console.error("Error submitting review:", error);
		res.status(500).json({
			message: "Error submitting review",
			error: error.message,
		});
	}
};
