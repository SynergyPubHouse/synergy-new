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
		enum: ["author", "corresponding_author"],
		default: ["author"]
	}],
	googleId: { type: String, unique: true, sparse: true },
  	isVerified: { type: Boolean, default: false }
});

module.exports = mongoose.model("User", userSchema);
