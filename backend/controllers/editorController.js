const Editor = require("../models/Editor");
const jwt = require("jsonwebtoken");
const Manuscript = require("../models/Manuscript");
const User = require("../models/User");
const Reviewer = require("../models/Reviewer");
const sendEmail = require("../utils/sendEmail");

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

const buildRevisionExhaustedMessage = (maxAttempts) =>
	`All ${maxAttempts} revision attempts have been exhausted. Manuscript automatically rejected.`;

const applyRevisionRequiredUpdate = async ({ manuscript, text, editor }) => {
	if (!manuscript) {
		throw new Error("MANUSCRIPT_NOT_FOUND");
	}

	// Ensure editor is provided
	if (!editor) {
		const err = new Error("Editor authentication required");
		err.code = "EDITOR_REQUIRED";
		throw err;
	}

	if (manuscript.revisionLocked) {
		const error = new Error(
			"All revision attempts have already been exhausted for this manuscript."
		);
		error.code = "REVISION_LOCKED";
		throw error;
	}

	const trimmedText = text.trim();
	const maxAttempts = manuscript.maxRevisionAttempts || 3;
	const nextAttempt = (manuscript.revisionAttempts || 0) + 1;
	const attemptsExhausted = nextAttempt >= maxAttempts;

	const annotatedNoteText = `${trimmedText} (Revision attempt ${Math.min(
		nextAttempt,
		maxAttempts
	)}/${maxAttempts})`;

	const baseNote = {
		text: annotatedNoteText,
		action: "Revision Required",
		visibility: ["author", "editor"],
		addedBy: {
			_id: editor._id,
			name: formatFullName(editor),
			email: editor.email,
			role: "editor",
		},
		addedAt: new Date(),
	};

	const notesToAdd = [baseNote];

	if (attemptsExhausted) {
		notesToAdd.push({
			text: buildRevisionExhaustedMessage(maxAttempts),
			action: "Rejected",
			visibility: ["author", "editor"],
			addedBy: {
				_id: editor._id,
				name: formatFullName(editor),
				email: editor.email,
				role: "editor",
			},
			addedAt: new Date(),
		});
	}

	const updatedManuscript = await Manuscript.findByIdAndUpdate(
		manuscript._id,
		{
			$push: {
				editorNotesForAuthor: {
					$each: notesToAdd,
				},
			},
			revisionAttempts: nextAttempt,
			revisionLocked: attemptsExhausted,
			status: attemptsExhausted ? "Rejected" : "Revision Required",
		},
		{ new: true }
	);

	return {
		updatedManuscript,
		attemptsExhausted,
		maxAttempts,
		noteText: annotatedNoteText,
	};
};

// Helper function to send status change notification emails to manuscript authors
const sendStatusChangeNotification = async (
	manuscript,
	newStatus,
	editorNote = "",
	editorInfo
) => {
	try {
		// Get all authors' emails from the manuscript
		const populatedManuscript = await Manuscript.findById(manuscript._id)
			.populate("authors", "firstName middleName lastName email")
			.populate(
				"correspondingAuthor",
				"firstName middleName lastName email"
			);

		if (!populatedManuscript) {
			console.error("Manuscript not found for email notification");
			return;
		}

		// Collect all unique author emails
		const authorEmails = new Set();

		// Add all authors
		if (
			populatedManuscript.authors &&
			populatedManuscript.authors.length > 0
		) {
			populatedManuscript.authors.forEach((author) => {
				if (author && author.email) {
					authorEmails.add(author.email.toLowerCase());
				}
			});
		}

		// Add corresponding author (if different)
		if (
			populatedManuscript.correspondingAuthor &&
			populatedManuscript.correspondingAuthor.email
		) {
			authorEmails.add(
				populatedManuscript.correspondingAuthor.email.toLowerCase()
			);
		}

		// Convert Set to Array
		const emailList = Array.from(authorEmails);

		if (emailList.length === 0) {
			console.error(
				"No author emails found for manuscript:",
				manuscript._id
			);
			return;
		}

		// Get status color and icon for email styling
		const getStatusStyle = (status) => {
			const styles = {
				Pending: { color: "#2563eb", icon: "🔄", bg: "#dbeafe" },
				"Under Review": { color: "#dc2626", icon: "👥", bg: "#fef2f2" },
				Reviewed: { color: "#7c3aed", icon: "✅", bg: "#f3e8ff" },
				"Revision Required": {
					color: "#ea580c",
					icon: "📝",
					bg: "#fed7aa",
				},
				Accepted: { color: "#16a34a", icon: "🎉", bg: "#dcfce7" },
				Rejected: { color: "#dc2626", icon: "❌", bg: "#fef2f2" },
			};
			return (
				styles[status] || {
					color: "#6b7280",
					icon: "📄",
					bg: "#f9fafb",
				}
			);
		};

		const statusStyle = getStatusStyle(newStatus);
		const editorName = formatFullName(editorInfo);

		// Create email content
		const emailSubject = `Manuscript Status Update: ${populatedManuscript.title}`;

		const emailContent = `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
				<div style="background: linear-gradient(135deg, #00796b 0%, #00acc1 100%); color: white; padding: 30px; text-align: center;">
					<h1 style="margin: 0; font-size: 24px;">Synergy World Press</h1>
					<p style="margin: 10px 0 0 0; opacity: 0.9;">Manuscript Status Update</p>
				</div>
				
				<div style="padding: 30px;">
					<div style="background-color: ${statusStyle.bg}; border-left: 4px solid ${
			statusStyle.color
		}; padding: 20px; margin-bottom: 25px; border-radius: 4px;">
						<h2 style="margin: 0 0 10px 0; color: ${statusStyle.color}; font-size: 20px;">
							${statusStyle.icon} Status Changed to: ${newStatus}
						</h2>
						<p style="margin: 0; color: #374151; font-size: 14px;">
							Your manuscript status has been updated by the editor.
						</p>
					</div>

					<div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
						<h3 style="margin: 0 0 15px 0; color: #374151; font-size: 16px;">📄 Manuscript Details</h3>
						<table style="width: 100%; border-collapse: collapse;">
							<tr>
								<td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 30%;">Manuscript ID:</td>
								<td style="padding: 8px 0; color: #374151; font-size: 14px; font-weight: 500;">${
									populatedManuscript.customId || populatedManuscript._id
								}</td>
							</tr>
							<tr>
								<td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Title:</td>
								<td style="padding: 8px 0; color: #374151; font-size: 14px; font-weight: 500;">${
									populatedManuscript.title
								}</td>
							</tr>
							<tr>
								<td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Type:</td>
								<td style="padding: 8px 0; color: #374151; font-size: 14px;">${
									populatedManuscript.type
								}</td>
							</tr>
							<tr>
								<td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Status:</td>
								<td style="padding: 8px 0; color: ${
									statusStyle.color
								}; font-size: 14px; font-weight: 600;">${newStatus}</td>
							</tr>
							<tr>
								<td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Updated by:</td>
								<td style="padding: 8px 0; color: #374151; font-size: 14px;">${editorName}</td>
							</tr>
							<tr>
								<td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Update Date:</td>
								<td style="padding: 8px 0; color: #374151; font-size: 14px;">${new Date().toLocaleDateString(
									"en-US",
									{
										year: "numeric",
										month: "long",
										day: "numeric",
										hour: "2-digit",
										minute: "2-digit",
									}
								)}</td>
							</tr>
						</table>
					</div>

					${
						editorNote && editorNote.trim()
							? `
						<div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 25px; border-radius: 4px;">
							<h3 style="margin: 0 0 10px 0; color: #92400e; font-size: 16px;">📝 Editor's Note</h3>
							<p style="margin: 0; color: #451a03; font-size: 14px; line-height: 1.6;">
								${editorNote.trim()}
							</p>
						</div>
					`
							: ""
					}

					<div style="text-align: center; margin-top: 30px;">
						<a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/my-submissions" 
						   style="display: inline-block; background-color: #00796b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
							View Your Submissions
						</a>
					</div>

					<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; text-align: center;">
						<p style="margin: 0;">This is an automated notification from Synergy World Press.</p>
						<p style="margin: 5px 0 0 0;">For questions, please contact: <a href="mailto:support@synergyworldpress.com" style="color: #00796b;">support@synergyworldpress.com</a></p>
					</div>
				</div>
			</div>
		`;

		// Send emails to all authors
		for (const email of emailList) {
			try {
				await sendEmail({
					to: email,
					subject: emailSubject,
					text: emailContent,
				});
				console.log(`Status change notification sent to: ${email}`);
			} catch (emailError) {
				console.error(
					`Failed to send status change notification to ${email}:`,
					emailError
				);
			}
		}

		console.log(
			`Status change notifications sent for manuscript ${manuscript._id} (${newStatus}) to ${emailList.length} authors`
		);
	} catch (error) {
		console.error("Error sending status change notification:", error);
	}
};

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
				"title type status submissionDate mergedFileUrl authorNotes editorNotes editorNotesForAuthor reviewerNotes createdAt updatedAt revisionAttempts maxRevisionAttempts revisionLocked reviewDocxUrl authorResponse revisedPdfBuiltAt"
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
						"customId title type status submissionDate mergedFile mergedFileUrl authorNotes editorNotes editorNotesForAuthor reviewerNotes createdAt updatedAt invitations reviewDocxUrl authorResponse revisedPdfBuiltAt revisionAttempts maxRevisionAttempts revisionLocked revisionCombinedPdfUrl highlightedRevisionFileUrl"
					)
					.lean();

				// Ensure each manuscript has the correct mergedFileUrl
				const processedManuscripts = manuscripts.map((manuscript) => {
					if (manuscript.mergedFile && !manuscript.mergedFileUrl) {
						// If mergedFile exists but mergedFileUrl doesn't, create the URL
						const filename = manuscript.mergedFile.split("/").pop();
						manuscript.mergedFileUrl = `/uploads/${filename}`;
					}
					manuscript.authorName = formatFullName(user);
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

		// Determine actor (prefer editor, fall back to generic user/reviewer)
		const actor = req.editor || req.user;
		if (!actor) {
			return res.status(401).json({ message: "Not authenticated" });
		}

		const note = {
			text,
			action,
			visibility: visibility || ["author", "editor"],
			addedBy: {
				_id: actor._id,
				name: formatFullName(actor),
				email: actor.email,
				role: req.editor ? "editor" : actor.role || "user",
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
			.select(
				"firstName middleName lastName email specialization experience"
			)
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
		// Require authentication (editor or other account types)
		if (!req.editor && !req.user) {
			return res.status(401).json({ message: "Authentication required" });
		}
		const actor = req.editor || req.user;
		const { manuscriptId } = req.params;
		const { status, note } = req.body;

		// First, get the current manuscript to check its current status
		const currentManuscript = await Manuscript.findById(manuscriptId);
		if (!currentManuscript) {
			return res.status(404).json({ message: "Manuscript not found" });
		}

		if (currentManuscript.revisionLocked) {
			return res.status(403).json({
				message:
					"All revision attempts have been exhausted. This manuscript has been automatically rejected.",
			});
		}

		// Store old status for comparison
		const oldStatus = currentManuscript.status;

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

		if (status === "Revision Required") {
			const revisionText =
				(note && note.trim().length > 0
					? note.trim()
					: "Revision required by editor.");
			try {
				const {
					updatedManuscript,
					attemptsExhausted,
					maxAttempts,
				} = await applyRevisionRequiredUpdate({
					manuscript: currentManuscript,
					text: revisionText,
					editor: actor,
				});

				if (oldStatus !== updatedManuscript.status) {
					try {
						await sendStatusChangeNotification(
							updatedManuscript,
							updatedManuscript.status,
							attemptsExhausted
								? buildRevisionExhaustedMessage(maxAttempts)
								: revisionText,
							actor
						);
					} catch (emailError) {
						console.error(
							"Failed to send revision required email:",
							emailError
						);
					}
				}

				return res.json({
					message: attemptsExhausted
						? `Revision attempts exhausted. Manuscript rejected after ${maxAttempts} rounds.`
						: "Revision required note added and status updated successfully",
					manuscript: updatedManuscript,
				});
			} catch (error) {
				if (error.code === "REVISION_LOCKED") {
					return res.status(403).json({
						message:
							"All revision attempts have been exhausted. This manuscript has already been rejected.",
					});
				}
				throw error;
			}
		}

		const manuscript = await Manuscript.findByIdAndUpdate(
			manuscriptId,
			{ status },
			{ new: true }
		);

		// If a note is provided, add it to the appropriate notes array
		if (note && note.trim()) {
			const actorForNote = req.editor || req.user;
			const editorNote = {
				text: note,
				action: status,
				addedBy: {
					_id: actorForNote._id,
					name: formatFullName(actorForNote),
					email: actorForNote.email,
					role: req.editor ? "editor" : actorForNote.role || "user",
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

		// Send email notification to authors if status has changed
		if (oldStatus !== status) {
			try {
				await sendStatusChangeNotification(
					manuscript,
					status,
					note && note.trim() ? note.trim() : "",
					req.editor
				);
			} catch (emailError) {
				console.error(
					"Failed to send status change email:",
					emailError
				);
				// Continue execution even if email fails
			}
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
		// Require authentication (editor or other account types)
		if (!req.editor && !req.user) {
			return res.status(401).json({ message: "Authentication required" });
		}
		const actor = req.editor || req.user;
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

			// Store old status for comparison
			const oldStatus = currentManuscript.status;

			// Prevent any status changes if the manuscript is already rejected
			if (currentManuscript.status === "Rejected") {
				results.push({
					manuscriptId,
					success: false,
					error: "Cannot modify status of a rejected manuscript",
				});
				continue;
			}

			if (status === "Revision Required") {
				const revisionText =
					(note && note.trim().length > 0
						? note.trim()
						: "Revision required by editor.");
				try {
					const {
						updatedManuscript,
						attemptsExhausted,
						maxAttempts,
					} = await applyRevisionRequiredUpdate({
						manuscript: currentManuscript,
						text: revisionText,
						editor: actor,
					});

					if (oldStatus !== updatedManuscript.status) {
						try {
							await sendStatusChangeNotification(
								updatedManuscript,
								updatedManuscript.status,
								attemptsExhausted
									? buildRevisionExhaustedMessage(maxAttempts)
									: revisionText,
								actor
							);
						} catch (emailError) {
							console.error(
								`Failed to send status change email for manuscript ${manuscriptId}:`,
								emailError
							);
						}
					}

					results.push({ manuscriptId, success: true });
				} catch (error) {
					if (error.code === "REVISION_LOCKED") {
						results.push({
							manuscriptId,
							success: false,
							error: "All revision attempts exhausted. Manuscript already rejected.",
						});
					} else {
						results.push({
							manuscriptId,
							success: false,
							error: error.message || "Failed to set revision required status",
						});
					}
				}
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
							name: formatFullName(req.editor),
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

				// Send email notification to authors if status has changed
				if (oldStatus !== status) {
					try {
						await sendStatusChangeNotification(
							manuscript,
							status,
							note && note.trim() ? note.trim() : "",
							req.editor
						);
					} catch (emailError) {
						console.error(
							`Failed to send status change email for manuscript ${manuscriptId}:`,
							emailError
						);
						// Continue execution even if email fails
					}
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
		// Require editor authentication for adding revision notes
	if (!req.editor && !req.user) {
			return res.status(401).json({ message: "Authentication required" });
		}
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

		// Store old status for comparison
		const oldStatus = currentManuscript.status;

		// Prevent any status changes if the manuscript is already rejected
		if (currentManuscript.status === "Rejected") {
			return res.status(403).json({
				message:
					"Cannot modify status of a rejected manuscript. Rejected manuscripts are immutable.",
			});
		}

		const actor = req.editor || req.user;
		const {
			updatedManuscript,
			attemptsExhausted,
			maxAttempts,
		} = await applyRevisionRequiredUpdate({
			manuscript: currentManuscript,
			text: text.trim(),
			editor: actor,
		});
		const notificationText = attemptsExhausted
			? buildRevisionExhaustedMessage(maxAttempts)
			: text.trim();

		// Send email notification to authors if status has changed
		if (oldStatus !== updatedManuscript.status) {
			try {
				await sendStatusChangeNotification(
					updatedManuscript,
					updatedManuscript.status,
					notificationText,
					actor
				);
			} catch (emailError) {
				console.error(
					"Failed to send revision required email:",
					emailError
				);
				// Continue execution even if email fails
			}
		}

		res.json({
			message: attemptsExhausted
				? `Revision attempts exhausted. Manuscript rejected after ${maxAttempts} rounds.`
				: "Revision required note added and status updated successfully",
			manuscript: {
				_id: updatedManuscript._id,
				status: updatedManuscript.status,
				revisionAttempts: updatedManuscript.revisionAttempts,
				maxRevisionAttempts: updatedManuscript.maxRevisionAttempts,
				revisionLocked: updatedManuscript.revisionLocked,
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
			name: req.editor ? formatFullName(req.editor) : "Not found",
			email: req.editor?.email,
		});

		console.log("req.editor:", req);

		const { manuscriptId } = req.params;
		const { emails, editorNote,id, fullName, editorEmail } = req.body;

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
			console.log("Editor info:", req.user);

			const note = {
				text: editorNote.trim(),
				action: "Reviewer Invitation",
				visibility: ["editor", "reviewer"],
				addedBy: {
   _id: req.user._id,
   name:  req.user.firstName + " " + (req.user.lastName || ""),
   email: req.user.email,
   role: "editor"
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
					<p><strong>Manuscript ID:</strong> ${manuscript.customId || manuscriptId}</p>
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
				}).select(
					"firstName middleName lastName email specialization experience"
				);

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
				reviewerName: formatFullName(reviewer),
			});
		}

		// Update manuscript status to "Under Review" if any reviewers were assigned
		const successfulAssignments = results.filter((r) => r.success);
		if (successfulAssignments.length > 0) {
			const oldStatus = manuscript.status;
			manuscript.status = "Under Review";

			// Send email notification to authors if status has changed
			if (oldStatus !== "Under Review") {
				try {
					await sendStatusChangeNotification(
						manuscript,
						"Under Review",
						"", // No specific note for reviewer assignment
						req.editor
					);
				} catch (emailError) {
					console.error(
						"Failed to send status change email for reviewer assignment:",
						emailError
					);
					// Continue execution even if email fails
				}
			}
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
