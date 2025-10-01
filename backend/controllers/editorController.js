const Editor = require("../models/Editor");
const jwt = require("jsonwebtoken");
const Manuscript = require("../models/Manuscript");
const User = require("../models/User");
const Reviewer = require("../models/Reviewer");
const sendEmail = require("../utils/sendEmail");

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
		const manuscripts = await Manuscript.find({
			author,
			status: { $nin: ["Saved", "Rejected"] }, // Exclude manuscripts with "Saved" and "Rejected" status
		})
			.select(
				"title type status submissionDate mergedFileUrl authorNotes editorNotes editorNotesForAuthor reviewerNotes createdAt updatedAt"
			)
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

		// For each user, populate their manuscripts (excluding "Saved" status)
		const usersWithManuscripts = await Promise.all(
			users.map(async (user) => {
				const manuscripts = await Manuscript.find({
					_id: { $in: user.manuscripts },
					status: { $nin: ["Saved", "Rejected"] }, // Exclude manuscripts with "Saved" and "Rejected" status
				})
					.select(
						"title type status submissionDate mergedFile mergedFileUrl authorNotes editorNotes editorNotesForAuthor reviewerNotes createdAt updatedAt"
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

		// Filter out users who have no manuscripts after excluding "Saved" ones
		const filteredUsers = usersWithManuscripts.filter(
			(user) => user.manuscripts.length > 0
		);

		res.json(filteredUsers);
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
		const { status, note } = req.body;

		// First, get the current manuscript to check its current status
		const currentManuscript = await Manuscript.findById(manuscriptId);
		if (!currentManuscript) {
			return res.status(404).json({ message: "Manuscript not found" });
		}

		// Prevent any status changes if the manuscript is already rejected
		if (currentManuscript.status === "Rejected") {
			return res.status(403).json({
				message:
					"Cannot modify status of a rejected manuscript. Rejected manuscripts are immutable.",
			});
		}

		// Validate status
		const validStatuses = [
			"Pending",
			"Under Review",
			"Reviewed",
			"Revision Required",
			"Accepted",
			"Rejected",
		];
		if (!validStatuses.includes(status)) {
			return res.status(400).json({
				message:
					"Invalid status. Must be one of: " +
					validStatuses.join(", "),
			});
		}

		const manuscript = await Manuscript.findByIdAndUpdate(
			manuscriptId,
			{ status },
			{ new: true }
		);

		// If a note is provided, add it to the appropriate notes array
		if (note && note.trim()) {
			const editorNote = {
				text: note,
				action: status,
				addedBy: {
					_id: req.editor._id,
					name: `${req.editor.firstName} ${req.editor.lastName}`,
					email: req.editor.email,
					role: "editor",
				},
				addedAt: new Date(),
			};

			// For acceptance and rejection, add to editorNotesForAuthor so authors can see them
			// For other status changes, add to regular editorNotes
			if (status === "Accepted" || status === "Rejected") {
				manuscript.editorNotesForAuthor.push(editorNote);
			} else {
				// Add visibility for internal editor notes
				editorNote.visibility = ["editor", "reviewer"];
				manuscript.editorNotes.push(editorNote);
			}
			await manuscript.save();
		}

		res.json({
			message: `Manuscript status updated to ${status}`,
			manuscript,
		});
	} catch (error) {
		console.error("Error updating manuscript status:", error);
		res.status(500).json({
			message: "Error updating status",
			error: error.message,
		});
	}
};

// Bulk update manuscript status (for multiple manuscripts)
exports.bulkUpdateManuscriptStatus = async (req, res) => {
	try {
		const { manuscriptIds, status, note } = req.body;

		// Validate status
		const validStatuses = [
			"Pending",
			"Under Review",
			"Reviewed",
			"Revision Required",
			"Accepted",
			"Rejected",
		];
		if (!validStatuses.includes(status)) {
			return res.status(400).json({
				message:
					"Invalid status. Must be one of: " +
					validStatuses.join(", "),
			});
		}

		const results = [];

		for (const manuscriptId of manuscriptIds) {
			// First check if the manuscript exists and its current status
			const currentManuscript = await Manuscript.findById(manuscriptId);

			if (!currentManuscript) {
				results.push({
					manuscriptId,
					success: false,
					error: "Manuscript not found",
				});
				continue;
			}

			// Prevent any status changes if the manuscript is already rejected
			if (currentManuscript.status === "Rejected") {
				results.push({
					manuscriptId,
					success: false,
					error: "Cannot modify status of a rejected manuscript",
				});
				continue;
			}

			const manuscript = await Manuscript.findByIdAndUpdate(
				manuscriptId,
				{ status },
				{ new: true }
			);

			if (manuscript) {
				// If a note is provided, add it to the appropriate notes array
				if (note && note.trim()) {
					const editorNote = {
						text: note,
						action: status,
						addedBy: {
							_id: req.editor._id,
							name: `${req.editor.firstName} ${req.editor.lastName}`,
							email: req.editor.email,
							role: "editor",
						},
						addedAt: new Date(),
					};

					// For acceptance and rejection, add to editorNotesForAuthor so authors can see them
					// For other status changes, add to regular editorNotes
					if (status === "Accepted" || status === "Rejected") {
						manuscript.editorNotesForAuthor.push(editorNote);
					} else {
						// Add visibility for internal editor notes
						editorNote.visibility = ["editor", "reviewer"];
						manuscript.editorNotes.push(editorNote);
					}
					await manuscript.save();
				}
				results.push({ manuscriptId, success: true });
			} else {
				results.push({
					manuscriptId,
					success: false,
					error: "Manuscript not found",
				});
			}
		}

		res.json({
			message: `Bulk status update completed. Updated ${
				results.filter((r) => r.success).length
			} of ${manuscriptIds.length} manuscripts.`,
			results,
		});
	} catch (error) {
		console.error("Error in bulk update:", error);
		res.status(500).json({
			message: "Error updating statuses",
			error: error.message,
		});
	}
};

// Add revision required note and update status
exports.addRevisionRequiredNote = async (req, res) => {
	try {
		const { manuscriptId } = req.params;
		const { text } = req.body;

		if (!text || !text.trim()) {
			return res.status(400).json({
				message: "Revision note text is required",
			});
		}

		// First, get the current manuscript to check its current status
		const currentManuscript = await Manuscript.findById(manuscriptId);
		if (!currentManuscript) {
			return res.status(404).json({ message: "Manuscript not found" });
		}

		// Prevent any status changes if the manuscript is already rejected
		if (currentManuscript.status === "Rejected") {
			return res.status(403).json({
				message:
					"Cannot modify status of a rejected manuscript. Rejected manuscripts are immutable.",
			});
		}

		const note = {
			text: text.trim(),
			action: "Revision Required",
			visibility: ["author", "editor"],
			addedBy: {
				_id: req.editor._id,
				name: `${req.editor.firstName} ${req.editor.lastName}`,
				email: req.editor.email,
				role: "editor",
			},
			addedAt: new Date(),
		};

		// Update the manuscript with the new note and status
		const manuscript = await Manuscript.findByIdAndUpdate(
			manuscriptId,
			{
				$push: { editorNotesForAuthor: note },
				status: "Revision Required",
			},
			{ new: true }
		);

		if (!manuscript) {
			return res.status(404).json({ message: "Manuscript not found" });
		}

		res.json({
			message:
				"Revision required note added and status updated successfully",
			note,
			manuscript: {
				_id: manuscript._id,
				status: manuscript.status,
			},
		});
	} catch (error) {
		console.error("Error adding revision required note:", error);
		res.status(500).json({
			message: "Error adding revision required note",
			error: error.message,
		});
	}
};

// Get all notes for a specific manuscript
exports.getManuscriptNotes = async (req, res) => {
	try {
		const { manuscriptId } = req.params;

		const manuscript = await Manuscript.findById(manuscriptId)
			.select(
				"authorNotes editorNotes editorNotesForAuthor reviewerNotes"
			)
			.lean();

		if (!manuscript) {
			return res.status(404).json({
				message: "Manuscript not found",
			});
		}

		// Combine all notes with type information
		const allNotes = [
			...(manuscript.authorNotes || []).map((note) => ({
				...note,
				type: "author",
			})),
			...(manuscript.editorNotes || []).map((note) => ({
				...note,
				type: "editor",
			})),
			...(manuscript.editorNotesForAuthor || []).map((note) => ({
				...note,
				type: "editorForAuthor",
			})),
			...(manuscript.reviewerNotes || []).map((note) => ({
				...note,
				type: "reviewer",
			})),
		].sort((a, b) => new Date(a.addedAt) - new Date(b.addedAt));

		res.json({
			manuscriptId,
			notes: allNotes,
			summary: {
				totalNotes: allNotes.length,
				authorNotes: manuscript.authorNotes?.length || 0,
				editorNotes: manuscript.editorNotes?.length || 0,
				editorNotesForAuthor:
					manuscript.editorNotesForAuthor?.length || 0,
				reviewerNotes: manuscript.reviewerNotes?.length || 0,
			},
		});
	} catch (error) {
		console.error("Error getting manuscript notes:", error);
		res.status(500).json({
			message: "Error fetching manuscript notes",
			error: error.message,
		});
	}
};

// Send invitation to reviewers
exports.sendInvitation = async (req, res) => {
	try {
		console.log("=== INVITATION REQUEST START ===");
		console.log("Request body:", JSON.stringify(req.body, null, 2));
		console.log("Request params:", req.params);
		console.log("Editor info:", {
			id: req.editor?._id,
			name: req.editor
				? `${req.editor.firstName} ${req.editor.lastName}`
				: "Not found",
			email: req.editor?.email,
		});

		const { manuscriptId } = req.params;
		const { emails, editorNote } = req.body;

		if (!emails || !Array.isArray(emails) || emails.length === 0) {
			return res.status(400).json({
				message: "Please provide an array of reviewer emails",
			});
		}

		const manuscript = await Manuscript.findById(manuscriptId);
		if (!manuscript) {
			return res.status(404).json({ message: "Manuscript not found" });
		}

		// Add editor note if provided
		if (editorNote && editorNote.trim()) {
			console.log("Adding editor note:", editorNote.trim());
			console.log("Editor info:", {
				id: req.editor._id,
				name: `${req.editor.firstName} ${req.editor.lastName}`,
				email: req.editor.email,
			});

			const note = {
				text: editorNote.trim(),
				action: "Reviewer Invitation",
				visibility: ["editor", "reviewer"],
				addedBy: {
					_id: req.editor._id,
					name: `${req.editor.firstName} ${req.editor.lastName}`,
					email: req.editor.email,
					role: "editor",
				},
				addedAt: new Date(),
			};

			manuscript.editorNotes.push(note);
			console.log(
				"Editor note added to manuscript. Total editor notes:",
				manuscript.editorNotes.length
			);
		} else {
			console.log("No editor note provided or empty note");
		}

		// Add invitations to manuscript
		const newInvitations = emails.map((email) => ({
			email: email.toLowerCase().trim(),
			invitedAt: new Date(),
			status: "pending",
		}));

		manuscript.invitations.push(...newInvitations);

		console.log(
			"Before save - manuscript editorNotes length:",
			manuscript.editorNotes.length
		);
		await manuscript.save();
		console.log("After save - manuscript saved successfully");

		// Verify the note was saved
		const savedManuscript = await Manuscript.findById(manuscriptId).select(
			"editorNotes"
		);
		console.log(
			"Verified saved manuscript editorNotes length:",
			savedManuscript.editorNotes.length
		);

		// Send emails to reviewers
		for (const email of emails) {
			// Debug log to check environment variable
			console.log("FRONTEND_URL:", process.env.FRONTEND_URL);

			const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
			const registrationUrl = `${baseUrl}/journal/jics/reviewer/register`;

			console.log("Generated registration URL:", registrationUrl);

			// Include editor note in email if provided
			const editorNoteSection =
				editorNote && editorNote.trim()
					? `
					<div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-left: 4px solid #496580;">
						<h4 style="color: #496580; margin-top: 0;">Editor's Note:</h4>
						<p style="margin-bottom: 0;">${editorNote.trim()}</p>
					</div>
				`
					: "";

			const emailContent = `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<h2 style="color: #496580;">Reviewer Invitation - Synergy World Press</h2>
					<p>Dear Reviewer,</p>
					<p>You have been invited to review a manuscript titled: <strong>"${manuscript.title}"</strong></p>
					<p><strong>Manuscript ID:</strong> ${manuscriptId}</p>
					<p><strong>Your Email:</strong> ${email}</p>
					${editorNoteSection}
					<p>To accept or reject this invitation, please:</p>
					<ol>
						<li>Register as a reviewer (if you haven't already)</li>
						<li>Login to your reviewer dashboard</li>
						<li>View and respond to the invitation</li>
					</ol>
					<div style="text-align: center; margin: 30px 0;">
						<a href="${registrationUrl}" 
						   style="background-color: #496580; color: white; padding: 12px 24px; 
						          text-decoration: none; border-radius: 5px; display: inline-block;">
							Register/Login as Reviewer
						</a>
					</div>
					<p>If you're already registered, you can login directly at: <a href="${baseUrl}/journal/jics/reviewer/login">Reviewer Login</a></p>
					<p>Best regards,<br>Synergy World Press Editorial Team</p>
				</div>
			`;

			await sendEmail({
				to: email,
				subject: `Reviewer Invitation: ${manuscript.title}`,
				text: emailContent,
			});
		}

		res.json({
			message: `Invitations sent to ${emails.length} reviewers successfully`,
			invitedEmails: emails,
			editorNoteAdded: editorNote && editorNote.trim() ? true : false,
		});
	} catch (error) {
		console.error("Error sending invitations:", error);
		res.status(500).json({
			message: "Error sending invitations",
			error: error.message,
		});
	}
};

// Get accepted invitations for a manuscript
exports.getAcceptedInvitations = async (req, res) => {
	try {
		const { manuscriptId } = req.params;

		const manuscript = await Manuscript.findById(manuscriptId);
		if (!manuscript) {
			return res.status(404).json({ message: "Manuscript not found" });
		}

		// Get accepted invitations
		const acceptedInvitations = manuscript.invitations.filter(
			(inv) => inv.status === "accepted"
		);

		// Get reviewer details for accepted invitations
		const reviewersWithDetails = await Promise.all(
			acceptedInvitations.map(async (invitation) => {
				const reviewer = await Reviewer.findOne({
					email: invitation.email,
				}).select("firstName lastName email specialization experience");

				return {
					email: invitation.email,
					acceptedAt: invitation.acceptedAt,
					reviewer: reviewer || null,
					isAssigned: manuscript.assignedReviewers.some(
						(reviewerId) =>
							reviewer &&
							reviewerId.toString() === reviewer._id.toString()
					),
				};
			})
		);

		res.json({
			manuscriptId,
			manuscriptTitle: manuscript.title,
			acceptedInvitations: reviewersWithDetails,
			totalAccepted: acceptedInvitations.length,
		});
	} catch (error) {
		console.error("Error getting accepted invitations:", error);
		res.status(500).json({
			message: "Error fetching accepted invitations",
			error: error.message,
		});
	}
};

// Assign reviewers from accepted invitations
exports.assignReviewersFromInvitations = async (req, res) => {
	try {
		const { manuscriptId } = req.params;
		const { reviewerEmails } = req.body;

		if (
			!reviewerEmails ||
			!Array.isArray(reviewerEmails) ||
			reviewerEmails.length === 0
		) {
			return res.status(400).json({
				message: "Please provide an array of reviewer emails to assign",
			});
		}

		const manuscript = await Manuscript.findById(manuscriptId);
		if (!manuscript) {
			return res.status(404).json({ message: "Manuscript not found" });
		}

		const results = [];

		for (const email of reviewerEmails) {
			// Check if invitation exists and is accepted
			const invitation = manuscript.invitations.find(
				(inv) => inv.email === email && inv.status === "accepted"
			);

			if (!invitation) {
				results.push({
					email,
					success: false,
					error: "No accepted invitation found for this email",
				});
				continue;
			}

			// Find the reviewer
			const reviewer = await Reviewer.findOne({ email });
			if (!reviewer) {
				results.push({
					email,
					success: false,
					error: "Reviewer not found in database",
				});
				continue;
			}

			// Check if already assigned
			if (manuscript.assignedReviewers.includes(reviewer._id)) {
				results.push({
					email,
					success: false,
					error: "Reviewer already assigned to this manuscript",
				});
				continue;
			}

			// Add to assignedReviewers
			manuscript.assignedReviewers.push(reviewer._id);

			// Add manuscript to reviewer's assignedManuscripts
			if (!reviewer.assignedManuscripts.includes(manuscriptId)) {
				reviewer.assignedManuscripts.push(manuscriptId);
				await reviewer.save();
			}

			results.push({
				email,
				success: true,
				reviewerName: `${reviewer.firstName} ${reviewer.lastName}`,
			});
		}

		// Update manuscript status to "Under Review" if any reviewers were assigned
		const successfulAssignments = results.filter((r) => r.success);
		if (successfulAssignments.length > 0) {
			manuscript.status = "Under Review";
		}

		await manuscript.save();

		res.json({
			message: `Successfully assigned ${successfulAssignments.length} of ${reviewerEmails.length} reviewers`,
			results,
			manuscriptStatus: manuscript.status,
		});
	} catch (error) {
		console.error("Error assigning reviewers:", error);
		res.status(500).json({
			message: "Error assigning reviewers",
			error: error.message,
		});
	}
};
