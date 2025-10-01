const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
	text: {
		type: String,
		required: true,
	},
	addedBy: {
		_id: { type: mongoose.Schema.Types.ObjectId, required: true },
		name: { type: String, required: true },
		email: { type: String, required: true },
		role: { type: String, required: true },
	},
	addedAt: {
		type: Date,
		default: Date.now,
	},
	action: {
		type: String,
		enum: [
			"Under Review",
			"Reviewed",
			"Accepted",
			"Rejected",
			"Revision Required",
			"Revised",
			"Reviewer Invitation",
		],
		required: false,
	},
	visibility: {
		type: [String],
		enum: ["author", "editor", "reviewer"],
		default: ["author", "editor"],
	},
});

const manuscriptSchema = new mongoose.Schema(
	{
		type: {
			type: String,
			required: true,
			enum: ["Research Article", "Review Article"],
		},
		classification: {
			type: String,
			required: true,
		},
		additionalInfo: {
			type: String,
			default: "",
		},
		comments: String,
		title: {
			type: String,
			required: true,
		},
		keywords: {
			type: String,
			required: true,
		},
		abstract: {
			type: String,
			required: true,
		},
		authors: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
				required: true,
			},
		],
		correspondingAuthor: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		funding: {
			type: String,
			enum: ["Yes", "No"],
			required: true,
		},
		manuscriptFile: {
			type: String,
			required: true,
		},
		coverLetterFile: {
			type: String,
			required: true,
		},
		declarationFile: {
			type: String,
			required: true,
		},
		mergedFile: {
			type: String,
			required: false,
		},
		mergedFileUrl: {
			type: String,
			required: false,
		},
		submissionDate: {
			type: Date,
			default: Date.now,
		},
		status: {
			type: String,
			enum: [
				"Saved",
				"Pending",
				"Under Review",
				"Reviewed",
				"Accepted",
				"Rejected",
				"Revision Required",
			],
			default: "Saved",
		},
		assignedReviewers: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Reviewer",
				required: false, // Reviewers assigned by editors
			},
		],
		invitations: [
			{
				email: {
					type: String,
					required: true,
				},
				invitedAt: {
					type: Date,
					default: Date.now,
				},
				status: {
					type: String,
					enum: ["pending", "accepted", "rejected"],
					default: "pending",
				},
				acceptedAt: {
					type: Date,
				},
				rejectedAt: {
					type: Date,
				},
			},
		],
		authorNotes: [noteSchema],
		editorNotes: [noteSchema],
		editorNotesForAuthor: [noteSchema],
		reviewerNotes: [noteSchema],
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Manuscript", manuscriptSchema);
