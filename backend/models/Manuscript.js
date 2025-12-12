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
		customId: {
			type: String,
			unique: true,
			sparse: true, // Allow null values but ensure uniqueness when present
		},
		type: {
			type: String,
			required: true,
			enum: ["Manuscript", "Research Article", "Review Article"],
			default: "Manuscript",
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
		billingInfo: {
			name: { type: String, default: "" },
			organization: { type: String, default: "" },
			address: { type: String, default: "" },
			city: { type: String, default: "" },
			state: { type: String, default: "" },
			postalCode: { type: String, default: "" },
			country: { type: String, default: "" },
			awardNumber: { type: String, default: "" },
			grantRecipient: { type: String, default: "" },
			findFunder: { type: String, default: "" },
		},
		manuscriptFile: {
			type: String,
			required: true,
		},
		// Google Drive fields for manuscript PDF
		manuscriptDriveFileId: { type: String, default: "" },
		manuscriptDriveViewUrl: { type: String, default: "" },
		coverLetterFile: {
			type: String,
			required: true,
		},
		// Google Drive fields for cover letter PDF
		coverLetterDriveFileId: { type: String, default: "" },
		coverLetterDriveViewUrl: { type: String, default: "" },
		declarationFile: {
			type: String,
			required: true,
		},
		// Google Drive fields for declaration PDF
		declarationDriveFileId: { type: String, default: "" },
		declarationDriveViewUrl: { type: String, default: "" },
		mergedFile: {
			type: String,
			required: false,
		},
		mergedFileUrl: {
			type: String,
			required: false,
		},
		// Google Drive fields for merged PDF (table + docs)
		mergedDriveFileId: { type: String, default: "" },
		mergedDriveViewUrl: { type: String, default: "" },
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
				"Published",
			],
			default: "Saved",
		},
		

		
       revisionAttempts: {
            type: Number,
            default: 0,
            min: 0,
        },
        maxRevisionAttempts: {
            type: Number,
            default: 3,
            min: 1,
        },
        revisionLocked: {
            type: Boolean,
            default: false,
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
					enum: ["pending", "accepted", "rejected", ],
					default: "pending",
				},
				acceptedAt: {
					type: Date,
				},
				rejectedAt: {
					type: Date,
				},
				rejectionReason: {
					type: String,
					default: "",
				},
				  // 👇 NEW: Track which round of review this is
        reviewRound: {
            type: Number,
            default: 1,
        },
        // 👇 NEW: Track if this is a re-review after revision
        isRevisionReview: {
            type: Boolean,
            default: false,
        },
			},
		],
		authorNotes: [noteSchema],
		editorNotes: [noteSchema],
		editorNotesForAuthor: [noteSchema],
		reviewerNotes: [noteSchema],
		reviewDocxUrl: {
    type: String,
    default: "",
},
	authorResponse: {
		// Response Sheet (Author Response) - now stored as PDF
		docxUrl: { type: String, default: "" },
		pdfUrl: { type: String, default: "" },
		// Google Drive fields for response PDF
		responseDriveFileId: { type: String, default: "" },
		responseDriveViewUrl: { type: String, default: "" },
		uploadedAt: { type: Date },
		
		// Highlighted Document - PDF format
		highlightedFileUrl: { type: String, default: "" },
		highlightedUploadedAt: { type: Date },
		
		// Without Highlighted Document - DOCX format
		withoutHighlightedFileUrl: { type: String, default: "" },
		withoutHighlightedUploadedAt: { type: Date },
		
		// Metadata
		lastUpdated: { type: Date, default: Date.now },
		submissionCount: { type: Number, default: 0 },
	},

		revisionCombinedPdfUrl: { type: String, default: "" },
		// Google Drive fields for combined revision PDF
		revisionCombinedDriveFileId: { type: String, default: "" },
		revisionCombinedDriveViewUrl: { type: String, default: "" },
		highlightedRevisionFileUrl: { type: String, default: "" },
publishedFileUrl: {
    type: String,
    default: "",
},
	// Google Drive fields for published PDF
	publishedDriveFileId: { type: String, default: "" },
	publishedDriveViewUrl: { type: String, default: "" },
	publishedAt: {
			type: Date,
			default: null,
		},

		issueVolume: {
    type: Number,
    default: null,
},
issueNumber: {
    type: Number,
    default: null,
},
issueYear: {
    type: Number,
    default: null,
},
issueTitle: {
    type: String,
    default: "",
},
pageStart: {
    type: Number,
    default: null,
},
pageEnd: {
    type: Number,
    default: null,
},
section: {
    type: String,
    default: "Manuscript",
},


	},
	{ timestamps: true }
);

module.exports = mongoose.model("Manuscript", manuscriptSchema);
