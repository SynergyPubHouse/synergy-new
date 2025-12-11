const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const reviewerSchema = new mongoose.Schema({
	title: {
		type: String,
		enum: ["Mr", "Mrs", "Miss", "Dr", "Er"],
		default: null,
	},
	firstName: {
		type: String,
		required: true,
		trim: true,
	},
	middleName: {
		type: String,
		trim: true,
	},
	lastName: {
		type: String,
		required: true,
		trim: true,
	},
	email: {
		type: String,
		required: true,
		unique: true,
		trim: true,
		lowercase: true,
	},
	username: {
		type: String,
		required: true,
		unique: true,
		trim: true,
	},
	password: {
		type: String,
		required: true,
	},
	specialization: { 
  type: String, 
  required: false,  // ✅ Fixed
  default: null
},
experience: { 
  type: Number, 
  required: false,  // ✅ Fixed
  default: null
},
	assignedManuscripts: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Manuscript",
			required: false,
		},
	],
	pendingInvitations: [
		{
			manuscriptId: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "Manuscript",
				required: true,
			},
			invitedAt: {
				type: Date,
				default: Date.now,
			},
		},
	],
	resetPasswordToken: {
		type: String,
	},
	resetPasswordExpires: {
		type: Date,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

// Hash password before saving
reviewerSchema.pre("save", async function (next) {
	if (!this.isModified("password")) return next();

	try {
		const salt = await bcrypt.genSalt(10);
		this.password = await bcrypt.hash(this.password, salt);
		next();
	} catch (error) {
		next(error);
	}
});

// Method to compare password
reviewerSchema.methods.comparePassword = async function (candidatePassword) {
	try {
		return await bcrypt.compare(candidatePassword, this.password);
	} catch (error) {
		throw error;
	}
};

const Reviewer = mongoose.model("Reviewer", reviewerSchema);

module.exports = Reviewer;
