const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
	firstName: { type: String, required: true },
	middleName: { type: String },
	lastName: { type: String, required: true },
	email: { type: String, required: true, unique: true },
	username: { type: String, required: true, unique: true },
	password: { type: String, required: true },
	manuscripts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Manuscript" }],
	title: {
		type: String,
		enum: ["Mr", "Mrs", "Miss", "Dr", "Er"],
		default: null,
	},
	roles: [{
    type: String,
    enum: ["author", "corresponding_author", "editor", "reviewer"],
    default: ["author"]
}],

	// OAuth provider IDs
	googleId: { type: String, unique: true, sparse: true },
	orcidId: { type: String, unique: true, sparse: true },
	
	// Verification status
	isVerified: { type: Boolean, default: false }
});

// Create indexes for OAuth fields for better query performance
userSchema.index({ googleId: 1 });
userSchema.index({ orcidId: 1 });

module.exports = mongoose.model("User", userSchema);
