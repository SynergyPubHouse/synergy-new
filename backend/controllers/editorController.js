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
        console.log("=== getManuscriptsByAuthor Debug ===");
        console.log("Author ID:", author);
        
       const manuscripts = await Manuscript.find({
    status: { $nin: ["Saved", "Pending"] },
    $or: [
        { correspondingAuthor: author },
        { authors: author },
    ],
})
            .select(
                "customId title type status submissionDate mergedFileUrl authorNotes editorNotes editorNotesForAuthor reviewerNotes createdAt updatedAt revisionAttempts maxRevisionAttempts revisionLocked reviewDocxUrl authorResponse revisedPdfBuiltAt revisionCombinedPdfUrl highlightedRevisionFileUrl authors correspondingAuthor invitations manuscriptFile"
            )
            .populate("authors", "firstName lastName middleName email")
            .populate("correspondingAuthor", "firstName lastName middleName email")
            .sort({ submissionDate: -1 });

        console.log("Found manuscripts count:", manuscripts.length);
        manuscripts.forEach(manuscript => {
            console.log(`- ${manuscript.customId || manuscript.title} (${manuscript.status})`);
            console.log(`  Authors: ${manuscript.authors?.map(a => `${a.firstName} ${a.lastName}`).join(', ') || 'None'}`);
            console.log(`  Corresponding Author: ${manuscript.correspondingAuthor ? `${manuscript.correspondingAuthor.firstName} ${manuscript.correspondingAuthor.lastName}` : 'None'}`);
        });
        console.log("=== End Debug ===");

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
		// Find all manuscripts (excluding "Saved" and "Rejected" status)
		const manuscripts = await Manuscript.find({
			status: { $nin: ["Saved",  "Pending"] },	
		})
			.select("authors correspondingAuthor customId title type status submissionDate mergedFileUrl invitations manuscriptFile updatedAt")
			.populate("authors", "firstName lastName middleName email")
			.populate("correspondingAuthor", "firstName lastName middleName email")
			.lean();

		console.log("=== Backend Debug ===");
		console.log("Total manuscripts found:", manuscripts.length);

		// Create a map of user IDs to their manuscripts
		const userManuscriptMap = new Map();

		manuscripts.forEach((manuscript) => {
			console.log(`Processing manuscript: ${manuscript.customId}`);
			console.log(`Authors: ${manuscript.authors?.map(a => a._id).join(', ')}`);
			console.log(`Corresponding Author: ${manuscript.correspondingAuthor?._id}`);
			
			// Add manuscript to all authors
			const allAuthors = [
				...manuscript.authors,
				manuscript.correspondingAuthor
			].filter(author => author); // Remove null/undefined

			// Remove duplicate authors from this manuscript
			const uniqueAuthors = allAuthors.filter((author, index, self) =>
				index === self.findIndex((a) => a._id.toString() === author._id.toString())
			);

			console.log(`Unique authors for this manuscript: ${uniqueAuthors.length}`);

			uniqueAuthors.forEach((author) => {
				const authorId = author._id.toString();
				
				if (!userManuscriptMap.has(authorId)) {
					userManuscriptMap.set(authorId, {
						...author,
						manuscripts: []
					});
				}

				// Check if manuscript already exists for this author (avoid duplicates)
				const existingManuscriptIds = userManuscriptMap.get(authorId).manuscripts.map(m => m._id.toString());
				if (!existingManuscriptIds.includes(manuscript._id.toString())) {
					userManuscriptMap.get(authorId).manuscripts.push({
						...manuscript,
						authorName: formatFullName(author)
					});
					console.log(`Added manuscript ${manuscript.customId} to author ${author.firstName} ${author.lastName}`);
				} else {
					console.log(`Skipping duplicate manuscript ${manuscript.customId} for author ${author.firstName} ${author.lastName}`);
				}
			});
		});

		// Convert map to array and filter users with manuscripts
		const usersWithManuscripts = Array.from(userManuscriptMap.values())
			.filter(user => user.manuscripts.length > 0);

		console.log("=== Final User Summary ===");
		usersWithManuscripts.forEach(user => {
			console.log(`User: ${user.firstName} ${user.lastName} - Manuscripts: ${user.manuscripts.length}`);
		});

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

        // Get manuscript with author details for email
        const currentManuscript = await Manuscript.findById(manuscriptId)
            .populate("authors", "firstName lastName email")
            .populate("correspondingAuthor", "firstName lastName email");
            
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

        // ===================================
        // 🔥 EMAIL NOTIFICATION TO AUTHORS
        // ===================================
        try {
            // Collect all author emails
            const authorEmails = new Set();
            
            if (currentManuscript.correspondingAuthor?.email) {
                authorEmails.add(currentManuscript.correspondingAuthor.email.toLowerCase());
            }
            
            if (currentManuscript.authors && currentManuscript.authors.length > 0) {
                currentManuscript.authors.forEach((author) => {
                    if (author?.email) {
                        authorEmails.add(author.email.toLowerCase());
                    }
                });
            }

            if (authorEmails.size > 0) {
                const customId = currentManuscript.customId || currentManuscript._id.toString();
                const revisionNumber = updatedManuscript.revisionAttempts || 1;
                const remainingAttempts = maxAttempts - revisionNumber;
                const frontendUrl = process.env.FRONTEND_URL || "https://synergyworldpress.com";
                const editorName = `${actor.firstName || ''} ${actor.lastName || ''}`.trim() || 'Editor';

                const emailSubject = attemptsExhausted
                    ? `Manuscript Rejected - ${customId}`
                    : `Revision Required - ${customId}`;

                const emailHtml = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FFFFFF;">
                        
                        <!-- Header -->
                        <div style="background: ${attemptsExhausted 
                            ? 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)' 
                            : 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)'}; color: black; padding: 25px; text-align: center;">
                            <h1 style="margin: 0; font-size: 22px;">
                                ${attemptsExhausted ? '❌ Manuscript Rejected' : '📝 Revision Required'}
                            </h1>
                        </div>

                        <!-- Content -->
                        <div style="padding: 25px;">
                            <p style="color: #374151; font-size: 15px; margin-bottom: 20px;">
                                Dear Author,
                            </p>
                            
                            <p style="color: #374151; font-size: 15px; margin-bottom: 20px;">
                                ${attemptsExhausted 
                                    ? `Your manuscript has been <strong>rejected</strong> after ${maxAttempts} revision attempts.`
                                    : `Your manuscript requires <strong>revision</strong>. (Attempt ${revisionNumber}/${maxAttempts})`
                                }
                            </p>

                            <!-- Manuscript Info -->
                            <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; border-left: 4px solid ${attemptsExhausted ? '#DC2626' : '#F59E0B'}; margin-bottom: 20px;">
                                <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>ID:</strong> ${customId}</p>
                                <p style="margin: 0; font-size: 14px;"><strong>Title:</strong> ${currentManuscript.title || 'Untitled'}</p>
                            </div>

                            <!-- Editor's Comments -->
                            <div style="background-color: #FEF3C7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                                <p style="font-weight: 600; color: #92400E; margin: 0 0 10px 0;">💬 Editor's Comments:</p>
                                <p style="color: #78350F; font-size: 14px; margin: 0; line-height: 1.6;">
                                    "${text.trim()}"
                                </p>
                                <p style="color: #92400E; font-size: 12px; margin: 10px 0 0 0; font-style: italic;">
                                    - ${editorName}
                                </p>
                            </div>

                            ${!attemptsExhausted ? `
                                <!-- Remaining Attempts -->
                                <div style="background-color: #DBEAFE; padding: 12px 15px; border-radius: 8px; margin-bottom: 20px;">
                                    <p style="color: #1E40AF; font-size: 14px; margin: 0;">
                                        ⚠️ Remaining attempts: <strong>${remainingAttempts}</strong>
                                    </p>
                                </div>

                                <!-- Action Button -->
                                <div style="text-align: center; margin: 25px 0;">
                                    <a href="${frontendUrl}/journal/jics/my-submissions" 
                                       style="display: inline-block; background-color: #00796B; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                                        Submit Revision
                                    </a>
                                </div>
                            ` : `
                                <p style="color: #6B7280; font-size: 14px; text-align: center;">
                                    For questions, contact the editorial office.
                                </p>
                            `}
                        </div>

                        <!-- Footer -->
                        <div style="background-color: #F3F4F6; padding: 15px; text-align: center; border-top: 1px solid #E5E7EB;">
                            <p style="color: #6B7280; font-size: 12px; margin: 0;">
                                Synergy World Press | <a href="mailto:support@synergyworldpress.com" style="color: #00796B;">support@synergyworldpress.com</a>
                            </p>
                        </div>
                    </div>
                `;

                // Send email to all authors
                for (const email of authorEmails) {
                    try {
                        await sendEmail({
                            to: email,
                            subject: emailSubject,
                            html: emailHtml,
                        });
                        console.log(`[addRevisionRequiredNote] Email sent to: ${email}`);
                    } catch (emailError) {
                        console.error(`[addRevisionRequiredNote] Failed to send to ${email}:`, emailError);
                    }
                }

                console.log(`[addRevisionRequiredNote] Notified ${authorEmails.size} author(s)`);
            }
        } catch (emailError) {
            console.error("[addRevisionRequiredNote] Email error:", emailError);
            // Continue even if email fails
        }
        // ===================================
        // END EMAIL NOTIFICATION
        // ===================================

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
// ═══════════════════════════════════════════════════════════════════════
// FIX: sendInvitation controller mein revisionRound properly set karo
// ═══════════════════════════════════════════════════════════════════════

exports.sendInvitation = async (req, res) => {
    try {
        console.log("=== INVITATION REQUEST START ===");

        const { manuscriptId } = req.params;
        const { emails, editorNote, isRevisionReview } = req.body;

        // Validation
        if (!emails || !Array.isArray(emails) || emails.length === 0) {
            return res.status(400).json({
                message: "Please provide an array of reviewer emails",
            });
        }

        const manuscript = await Manuscript.findById(manuscriptId);
		console.log("Manuscript:", manuscript);
        if (!manuscript) {
            return res.status(404).json({ message: "Manuscript not found" });
        }

        // Initialize arrays if needed
        if (!manuscript.editorNotes) manuscript.editorNotes = [];
        if (!manuscript.invitations) manuscript.invitations = [];

        // ═══════════════════════════════════════════════════════════════════════
        // 👇 GET CURRENT REVISION ROUND
        // ═══════════════════════════════════════════════════════════════════════
        const currentRevisionRound = manuscript.revisionAttempts || 0;
		console.log("Current revision round:", currentRevisionRound);
        
        console.log(`📊 Current revision round: ${currentRevisionRound}`);
        console.log(`📄 Has author response files:`, {
            pdfUrl: !!manuscript.authorResponse?.pdfUrl,
            docxUrl: !!manuscript.authorResponse?.docxUrl,
            highlightedFileUrl: !!manuscript.authorResponse?.highlightedFileUrl,
            withoutHighlightedFileUrl: !!manuscript.authorResponse?.withoutHighlightedFileUrl
        });

        // Calculate review round for each email
        const existingInvitationsForEmail = (email) => {
            return manuscript.invitations.filter(
                inv => inv.email.toLowerCase() === email.toLowerCase()
            ).length;
        };

        // Add editor note if provided
        let editorNoteAdded = false;
        if (editorNote && typeof editorNote === 'string' && editorNote.trim()) {
            const note = {
                text: editorNote.trim(),
                action: "Reviewer Invitation",
                visibility: ["editor", "reviewer"],
                addedBy: {
                    _id: req.user._id,
                    name: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
                    email: req.user.email,
                    role: "editor"
                },
                addedAt: new Date(),
            };
            manuscript.editorNotes.push(note);
            editorNoteAdded = true;
        }

        // ═══════════════════════════════════════════════════════════════════════
        // 👇 CREATE INVITATIONS WITH REVISION TRACKING - PROPERLY SET revisionRound
        // ═══════════════════════════════════════════════════════════════════════
        const newInvitations = emails.map((email) => {
            const normalizedEmail = email.toLowerCase().trim();
            const previousInvitations = existingInvitationsForEmail(normalizedEmail);
            
            // 🔥 KEY FIX: Explicitly set revisionRound field
            const invitation = {
                email: normalizedEmail,
                invitedAt: new Date(),
                status: "pending",
                
                expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), 
                remindedAt: null,
                expiredAt: null,

                reviewRound: previousInvitations + 1,
                
                // 🔥 CRITICAL: Set revisionRound from manuscript's currentRevisionRound
                revisionRound: currentRevisionRound,
                
                // Set isRevisionReview flag
                isRevisionReview: currentRevisionRound > 0 || previousInvitations > 0,
            };

            console.log(`📧 Creating invitation for ${normalizedEmail}:`, {
                reviewRound: invitation.reviewRound,
                revisionRound: invitation.revisionRound,
                isRevisionReview: invitation.isRevisionReview
            });

            return invitation;
        });

        console.log("✅ New invitations created:", newInvitations.length);

        manuscript.invitations.push(...newInvitations);
        
        // Mark as modified and save
        manuscript.markModified('editorNotes');
        manuscript.markModified('invitations');
        
        // Save database first
        await manuscript.save();
        console.log("✅ Invitations saved to database successfully");

        // Check if author has submitted revision response
        const hasAuthorResponseFiles = !!(
            manuscript.authorResponse?.pdfUrl ||
            manuscript.authorResponse?.docxUrl ||
            manuscript.authorResponse?.highlightedFileUrl ||
            manuscript.authorResponse?.withoutHighlightedFileUrl
        );

        console.log("📄 Author Response Files Available:", hasAuthorResponseFiles);

        // ═══════════════════════════════════════════════════════════════════════
        // 📧 SEND EMAILS - Non-blocking
        // ═══════════════════════════════════════════════════════════════════════
        let emailsSent = 0;
        let emailsFailed = 0;
        const emailErrors = [];

        for (const email of emails) {
            try {
                const baseUrl = "https://synergyworldpress.com";
                const registrationUrl = `${baseUrl}/register`;

                // Build editor note section
                const editorNoteSection = editorNoteAdded
                    ? `
                    <div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-left: 4px solid #496580;">
                        <h4 style="color: #496580; margin-top: 0;">Editor's Note:</h4>
                        <p style="margin-bottom: 0;">${editorNote.trim()}</p>
                    </div>
                    `
                    : "";

                // Build revision info section for email
                const revisionInfoSection = hasAuthorResponseFiles
                    ? `
                    <div style="background-color: #fff3cd; padding: 15px; margin: 20px 0; border-left: 4px solid #ffc107;">
                        <h4 style="color: #856404; margin-top: 0;">📝 Revision ${currentRevisionRound} Submitted</h4>
                        <p style="margin-bottom: 0;">
                            The author has submitted a revised version of this manuscript. 
                            You will be able to view the following in your dashboard:
                        </p>
                        <ul style="margin-top: 10px;">
                            ${manuscript.authorResponse?.pdfUrl ? '<li>Author Response Sheet (PDF)</li>' : ''}
                            ${manuscript.authorResponse?.highlightedFileUrl ? '<li>Highlighted Document (showing changes)</li>' : ''}
                            ${manuscript.authorResponse?.withoutHighlightedFileUrl ? '<li>Clean Revised Document</li>' : ''}
                        </ul>
                    </div>
                    `
                    : "";

                const emailContent = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #496580;">Reviewer Invitation - Synergy World Press</h2>
                        <p>Dear Reviewer,</p>
                        <p>You have been invited to review a manuscript titled: <strong>"${manuscript.title}"</strong></p>
                        <p><strong>Manuscript ID:</strong> ${manuscript.customId || manuscriptId}</p>
                        ${currentRevisionRound > 0 ? `<p><strong>Revision:</strong> ${currentRevisionRound}</p>` : ''}
                        ${revisionInfoSection}
                        ${editorNoteSection}
                        <p>To respond to this invitation, please register/login:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${registrationUrl}" 
                               style="background-color: #496580; color: white; padding: 12px 24px; 
                                      text-decoration: none; border-radius: 5px; display: inline-block;">
                                Register/Login as Reviewer
                            </a>
                        </div>
                        <p>Best regards,<br>Synergy World Press Editorial Team</p>
                    </div>
                `;

                await sendEmail({
                    to: email,
                    subject: `${hasAuthorResponseFiles ? '[Revision Review] ' : ''}Reviewer Invitation: ${manuscript.title}`,
                    html: emailContent,
                });

                emailsSent++;
                console.log(`✅ Email sent successfully to: ${email}`);

            } catch (emailError) {
                emailsFailed++;
                emailErrors.push({
                    email: email,
                    error: emailError.message,
                });
                console.error(`❌ Failed to send email to ${email}:`, emailError.message);
            }
        }

        // Respond with status
        const response = {
            success: true,
            message: emailsFailed === 0 
                ? `Invitations sent to ${emails.length} reviewers successfully`
                : `Invitations created for ${emails.length} reviewers. ${emailsSent} emails sent, ${emailsFailed} failed.`,
            invitedEmails: emails,
            editorNoteAdded: editorNoteAdded,
            isRevisionReview: hasAuthorResponseFiles,
            currentRevisionRound: currentRevisionRound,
            emailStatus: {
                total: emails.length,
                sent: emailsSent,
                failed: emailsFailed,
            },
        };

        if (emailsFailed > 0 && process.env.NODE_ENV === 'development') {
            response.emailErrors = emailErrors;
        }

        if (emailsFailed > 0) {
            response.note = "Some emails failed to send, but invitations are saved. Reviewers can still see the invitation in their dashboard.";
        }

        res.json(response);

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




exports.notifyEditorsOnNewManuscript = async (req, res) => {
    try {
        const {
            manuscriptId,
            manuscriptTitle,
            submittedBy,
            submitterEmail,
            submissionDate,
            status,
          
        } = req.body;

        // Validate required fields
        if (!manuscriptId || !manuscriptTitle) {
            return res.status(400).json({
                success: false,
                message: "Manuscript ID and Title are required"
            });
        }

        console.log("=== NOTIFY EDITORS START ===");
        console.log("Manuscript ID:", manuscriptId);
        console.log("Title:", manuscriptTitle);
        console.log("Submitted By:", submittedBy);

        // Fetch all editors from database
     const editors = await User.find({ roles: "editor" }).select(
    "firstName middleName lastName email title"
);

console.log("Editors to notify:", editors.map(e => e.email));


        if (!editors || editors.length === 0) {
            console.log("No editors found in database");
            return res.status(200).json({
                success: true,
                message: "No editors found in database",
                editorsNotified: 0
            });
        }

        console.log(`Found ${editors.length} editor(s)`);

        // Frontend URL for dashboard link
        const frontendUrl = "https://synergyworldpress.com";

        // Track successful and failed emails
        const emailResults = {
            success: [],
            failed: []
        };

        // Send email to each editor
        const emailPromises = editors.map(async (editor) => {
            const editorName = formatFullName(editor);

            const emailContent = `
<div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 0;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #00796b 0%, #004d40 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">📄 New Journal Submission</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">A new journal manuscript has been submitted by an author</p>
    </div>

    <!-- Body -->
    <div style="padding: 30px; border: 1px solid #e0e0e0; border-top: none; background-color: #ffffff;">

        <p style="font-size: 16px; color: #333;">Dear ${editor.title || ''} ${editorName},</p>

        <p style="font-size: 16px; color: #333; line-height: 1.6;">
            A new journal manuscript has been submitted by an author, and it is now assigned to you for editorial review.
            Kindly log in to your dashboard and proceed with evaluation.
        </p>

        <!-- Manuscript Details -->
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #00796b;">
            <h3 style="margin: 0 0 15px 0; color: #00796b; font-size: 18px;">📋 Manuscript Details</h3>

            <table style="width: 100%; border-collapse: collapse;">
                
               

                <tr>
                    <td style="padding: 10px 0; font-weight: bold; color: #555;">Manuscript ID:</td>
                    <td style="padding: 10px 0; color: #333;"><strong style="color: #00796b;">${manuscriptId}</strong></td>
                </tr>

                <tr>
                    <td style="padding: 10px 0; font-weight: bold; color: #555;">Title:</td>
                    <td style="padding: 10px 0; color: #333;">${manuscriptTitle}</td>
                </tr>

                <tr>
                    <td style="padding: 10px 0; font-weight: bold; color: #555;">Author Name:</td>
                    <td style="padding: 10px 0; color: #333;">${submittedBy || "N/A"}</td>
                </tr>

                <tr>
                    <td style="padding: 10px 0; font-weight: bold; color: #555;">Author Email:</td>
                    <td style="padding: 10px 0; color: #333;">${submitterEmail || "N/A"}</td>
                </tr>

                <tr>
                    <td style="padding: 10px 0; font-weight: bold; color: #555;">Submission Date:</td>
                    <td style="padding: 10px 0; color: #333;">
                        ${submissionDate || new Date().toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric"
                        })}
                    </td>
                </tr>

                <tr>
                    <td style="padding: 10px 0; font-weight: bold; color: #555;">Status:</td>
                    <td style="padding: 10px 0;">
                        <span style="background-color: #fff3cd; color: #856404; padding: 5px 12px; border-radius: 20px; font-size: 14px; font-weight: bold;">
                            ${status || "Awaiting Editor Review"}
                        </span>
                    </td>
                </tr>

            </table>
        </div>

        <!-- Action Required -->
        <div style="background-color: #fff8e1; padding: 15px; border-radius: 8px; margin: 25px 0; border: 1px solid #ffcc02;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>⚠️ Action Required:</strong> Please review the newly submitted journal manuscript.
            </p>
        </div>

        <!-- Button -->
        <div style="text-align: center; margin: 30px 0;">
            <a href="${frontendUrl}/journal/jics/editor/dashboard"
               style="background: linear-gradient(135deg, #00796b 0%, #004d40 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; display: inline-block;">
                🔗 Open Editor Dashboard
            </a>
        </div>

        <p style="font-size: 14px; color: #666; line-height: 1.6;">
            If you need help, please contact the editorial office.
        </p>

        <!-- Signature -->
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="margin: 0; color: #333;">Best regards,</p>
            <p style="margin: 5px 0 0 0; font-weight: bold; color: #00796b;">Synergy World Press</p>
            <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Editorial Management System</p>
        </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f5f5f5; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0; border-top: none;">
        <p style="margin: 0; font-size: 12px; color: #666;">This is an automated notification email.</p>
        <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">
            © ${new Date().getFullYear()} Synergy World Press. All rights reserved.
        </p>
    </div>

</div>
`;

            try {
                await sendEmail({
                    to: editor.email,
                    subject: `🔔 New Manuscript Submitted: ${manuscriptId} - ${manuscriptTitle}`,
                    text: emailContent,
                });

                console.log(`✅ Email sent to editor: ${editor.email}`);
                emailResults.success.push({
                    email: editor.email,
                    name: editorName
                });
            } catch (emailError) {
                console.error(`❌ Failed to send email to ${editor.email}:`, emailError.message);
                emailResults.failed.push({
                    email: editor.email,
                    name: editorName,
                    error: emailError.message
                });
            }
        });

        // Wait for all emails to be sent
        await Promise.all(emailPromises);

        console.log(`=== NOTIFY EDITORS END ===`);
        console.log(`Success: ${emailResults.success.length}, Failed: ${emailResults.failed.length}`);

        return res.status(200).json({
            success: true,
            message: `Notifications sent to ${emailResults.success.length} editor(s)`,
            editorsNotified: emailResults.success.length,
            totalEditors: editors.length,
            results: {
                success: emailResults.success,
                failed: emailResults.failed
            }
        });

    } catch (error) {
        console.error("Error in notifyEditorsOnNewManuscript:", error);
        return res.status(500).json({
            success: false,
            message: "Error sending notifications to editors",
            error: error.message
        });
    }
};

// @desc    Get all editors (for admin/testing purposes)
// @route   GET /api/editors/all
// @access  Private
exports.getAllEditors = async (req, res) => {
    try {
        // Sirf un users ko fetch karo jinke roles me "editor" ho
        const editors = await User.find({ roles: "editor" }).select(
            "firstName middleName lastName email title manuscripts roles createdAt"
        );

        return res.status(200).json({
            success: true,
            count: editors.length,
            editors: editors.map(editor => ({
                _id: editor._id,
                name: formatFullName(editor),
                title: editor.title,
                email: editor.email,
                manuscripts: editor.manuscripts,
                roles: editor.roles,
                createdAt: editor.createdAt
            }))
        });
    } catch (error) {
        console.error("Error fetching editors:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching editors",
            error: error.message
        });
    }
};