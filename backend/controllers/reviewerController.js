const Manuscript = require("../models/Manuscript");
const Reviewer = require("../models/Reviewer");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail"); // Adjust the path as necessary

// Helper function to format full name including middle name if it exists
const formatFullName = (user) => {
	if (!user) return "Unknown";

	const { firstName, middleName, lastName } = user;
	let fullName = firstName || "";

	if (middleName && middleName.trim() !== "") {
		fullName += ` ${middleName}`;
	}

	if (lastName) {
		fullName += ` ${lastName}`;
	}

	return fullName.trim() || "Unknown";
};

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
				select: "firstName middleName lastName email",
			},
		});

		if (!reviewer) {
			return res.status(404).json({ message: "Reviewer not found" });
		}

		// Format the manuscripts data
		const formattedManuscripts = reviewer.assignedManuscripts.map(
			(manuscript) => {
				console.log(
					"Populated manuscript correspondingAuthor:",
					manuscript.correspondingAuthor
				);
				// Use correspondingAuthor for author data
				let authorData = {
					_id: manuscript.correspondingAuthor?._id || null,
					firstName: manuscript.correspondingAuthor?.firstName || "",
					lastName: manuscript.correspondingAuthor?.lastName || "",
					email: manuscript.correspondingAuthor?.email || "",
					fullName: manuscript.correspondingAuthor
						? formatFullName(manuscript.correspondingAuthor)
						: "Unknown Author",
				};

				// Ensure mergedFileUrl is properly formatted
				let pdfUrl = manuscript.mergedFileUrl || "";
				if (pdfUrl && !pdfUrl.startsWith("http")) {
					pdfUrl = `https://paper-sphere.vercel.app${pdfUrl}`;
				}

				// Filter reviewerNotes to only show notes from the current reviewer
				const filteredReviewerNotes = manuscript.reviewerNotes.filter(
					(note) =>
						note.addedBy._id.toString() === req.user._id.toString()
				);

				// Filter editorNotes to only show notes visible to reviewers
				const visibleEditorNotes = manuscript.editorNotes.filter(
					(note) =>
						note.visibility && note.visibility.includes("reviewer")
				);

				return {
					...manuscript.toObject(),
					author: authorData, // Continue to use 'author' in frontend for now for consistency
					mergedFileUrl: pdfUrl,
					reviewerNotes: filteredReviewerNotes, // Override with filtered notes
					editorNotes: visibleEditorNotes, // Include editor notes visible to reviewers
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
		const reviewer = await Reviewer.findById(req.user._id);
		if (!reviewer) {
			return res.status(404).json({ message: "Reviewer not found" });
		}

		if (!manuscript.assignedReviewers.includes(reviewer._id)) {
			return res
				.status(403)
				.json({ message: "Not authorized to review this manuscript" });
		}

		// Map recommendation to valid enum action values from the schema
		let action;
		switch (recommendation) {
			case "Accept":
				action = "Accepted";
				break;
			case "Minor Revision":
				action = "Revision Required";
				break;
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
				name: formatFullName(reviewer),
				email: reviewer.email,
				role: "reviewer",
			},
			addedAt: new Date(),
		};

		// Clean up any existing invalid action values before adding new one
		const validActions = [
			"Under Review",
			"Reviewed",
			"Accepted",
			"Rejected",
			"Revision Required",
			"Revised",
		];
		if (manuscript.reviewerNotes && manuscript.reviewerNotes.length > 0) {
			manuscript.reviewerNotes.forEach((note, index) => {
				if (note.action && !validActions.includes(note.action)) {
					console.log(
						`Fixing invalid action at index ${index}: ${note.action} -> Reviewed`
					);
					manuscript.reviewerNotes[index].action = "Reviewed";
				}
			});
		}

		// Add the review to reviewerNotes array only
		manuscript.reviewerNotes.push(reviewerNote);

		// Keep the manuscript status as "Under Review" - only editors can change the final status
		// Do NOT automatically change status to "Reviewed"

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

// Forgot Password
exports.forgotPassword = async (req, res) => {
	try {
		const { email } = req.body;
		const reviewer = await Reviewer.findOne({ email });

		if (!reviewer) {
			return res.status(404).json({ message: "Reviewer not found" });
		}

		const resetToken = crypto.randomBytes(20).toString("hex");
		reviewer.resetPasswordToken = crypto
			.createHash("sha256")
			.update(resetToken)
			.digest("hex");
		reviewer.resetPasswordExpires = Date.now() + 3600000; // 1 hour

		await reviewer.save();

		const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
		const resetUrl = `${baseUrl}/reviewer/reset-password/${resetToken}`;

		const message = `
            <h1>You have requested a password reset</h1>
            <p>Please go to this link to reset your password:</p>
            <a href="${resetUrl}" clicktracking=off>${resetUrl}</a>
        `;

		try {
			await sendEmail({
				to: reviewer.email,
				subject: "Password Reset Request",
				text: message,
			});

			res.status(200).json({
				success: true,
				message: "Email sent successfully.",
			});
		} catch (err) {
			console.log(err);
			reviewer.resetPasswordToken = undefined;
			reviewer.resetPasswordExpires = undefined;
			await reviewer.save();
			return res.status(500).json({ message: "Email could not be sent" });
		}
	} catch (error) {
		res.status(500).json({
			message: "Server error",
			error: error.message,
		});
	}
};

// Reset Password
exports.resetPassword = async (req, res) => {
	try {
		const resetPasswordToken = crypto
			.createHash("sha256")
			.update(req.params.token)
			.digest("hex");

		console.log("Looking for token:", resetPasswordToken);
		console.log("Current time:", Date.now());

		const reviewer = await Reviewer.findOne({
			resetPasswordToken,
			resetPasswordExpires: { $gt: Date.now() },
		});

		if (!reviewer) {
			console.log("No reviewer found with valid token");
			return res
				.status(400)
				.json({ message: "Invalid or expired token" });
		}

		console.log("Found reviewer:", reviewer.email);
		console.log("Token expires at:", reviewer.resetPasswordExpires);

		// Update password and clear reset fields
		reviewer.password = req.body.password;
		reviewer.resetPasswordToken = undefined;
		reviewer.resetPasswordExpires = undefined;

		await reviewer.save();

		console.log("Password updated successfully for:", reviewer.email);

		res.status(200).json({
			success: true,
			message: "Password updated successfully",
		});
	} catch (error) {
		console.error("Reset password error:", error);
		res.status(500).json({
			message: "Server error",
			error: error.message,
		});
	}
};

// Get pending invitations for logged-in reviewer
exports.getPendingInvitations = async (req, res) => {
	try {
		const reviewerEmail = req.user.email;

		// Find manuscripts with pending invitations for this reviewer
		const manuscriptsWithInvitations = await Manuscript.find({
			"invitations.email": reviewerEmail,
			"invitations.status": "pending",
		})
			.select(
				"title type abstract keywords submissionDate invitations editorNotes"
			)
			.lean();

		// Filter invitations for this specific reviewer
		const invitations = manuscriptsWithInvitations.map((manuscript) => {
			const relevantInvitation = manuscript.invitations.find(
				(inv) => inv.email === reviewerEmail && inv.status === "pending"
			);

			// Filter editor notes visible to reviewers
			const visibleEditorNotes = manuscript.editorNotes
				? manuscript.editorNotes.filter(
						(note) =>
							note.visibility &&
							note.visibility.includes("reviewer")
				  )
				: [];

			return {
				_id: manuscript._id,
				title: manuscript.title,
				type: manuscript.type,
				abstract: manuscript.abstract,
				keywords: manuscript.keywords,
				submissionDate: manuscript.submissionDate,
				invitedAt: relevantInvitation.invitedAt,
				editorNotes: visibleEditorNotes,
			};
		});

		res.json(invitations);
	} catch (error) {
		console.error("Error getting pending invitations:", error);
		res.status(500).json({
			message: "Error fetching pending invitations",
			error: error.message,
		});
	}
};

// Accept invitation
exports.acceptInvitation = async (req, res) => {
	try {
		const { manuscriptId } = req.params;
		const reviewerEmail = req.user.email;
		const reviewerId = req.user._id;

		// Update manuscript invitation status
		const manuscript = await Manuscript.findById(manuscriptId);
		if (!manuscript) {
			return res.status(404).json({ message: "Manuscript not found" });
		}

		// Find the invitation for this reviewer
		const invitation = manuscript.invitations.find(
			(inv) => inv.email === reviewerEmail && inv.status === "pending"
		);

		if (!invitation) {
			return res.status(404).json({
				message: "No pending invitation found for this manuscript",
			});
		}

		// Update invitation status
		invitation.status = "accepted";
		invitation.acceptedAt = new Date();

		// Add reviewer to assignedReviewers if not already added
		if (!manuscript.assignedReviewers.includes(reviewerId)) {
			manuscript.assignedReviewers.push(reviewerId);
		}

		await manuscript.save();

		// Add manuscript to reviewer's assignedManuscripts
		const reviewer = await Reviewer.findById(reviewerId);
		if (!reviewer.assignedManuscripts.includes(manuscriptId)) {
			reviewer.assignedManuscripts.push(manuscriptId);
		}

		// Remove from pending invitations if exists
		reviewer.pendingInvitations = reviewer.pendingInvitations.filter(
			(inv) => inv.manuscriptId.toString() !== manuscriptId
		);

		await reviewer.save();

		res.json({
			message: "Invitation accepted successfully",
			manuscriptTitle: manuscript.title,
		});
	} catch (error) {
		console.error("Error accepting invitation:", error);
		res.status(500).json({
			message: "Error accepting invitation",
			error: error.message,
		});
	}
};

// Reject invitation
exports.rejectInvitation = async (req, res) => {
	try {
		const { manuscriptId } = req.params;
		const { rejectionReason } = req.body;
		const reviewerEmail = req.user.email;

		// Validate that rejection reason is provided
		if (!rejectionReason || !rejectionReason.trim()) {
			return res.status(400).json({
				message: "Rejection reason is required",
			});
		}

		// Update manuscript invitation status
		const manuscript = await Manuscript.findById(manuscriptId);
		if (!manuscript) {
			return res.status(404).json({ message: "Manuscript not found" });
		}

		// Find the invitation for this reviewer
		const invitation = manuscript.invitations.find(
			(inv) => inv.email === reviewerEmail && inv.status === "pending"
		);

		if (!invitation) {
			return res.status(404).json({
				message: "No pending invitation found for this manuscript",
			});
		}

		// Update invitation status with rejection reason
		invitation.status = "rejected";
		invitation.rejectedAt = new Date();
		invitation.rejectionReason = rejectionReason.trim();

		await manuscript.save();

		// Remove from reviewer's pending invitations if exists
		const reviewer = await Reviewer.findById(req.user._id);
		reviewer.pendingInvitations = reviewer.pendingInvitations.filter(
			(inv) => inv.manuscriptId.toString() !== manuscriptId
		);
		await reviewer.save();

		res.json({
			message: "Invitation rejected successfully",
			manuscriptTitle: manuscript.title,
		});
	} catch (error) {
		console.error("Error rejecting invitation:", error);
		res.status(500).json({
			message: "Error rejecting invitation",
			error: error.message,
		});
	}
};
