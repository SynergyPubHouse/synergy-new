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
isEditor: { 
    type: Boolean, 
    default: false 
},
    // OAuth provider IDs
    googleId: { type: String, unique: true, sparse: true },
    orcidId: { type: String, unique: true, sparse: true },
    
    // Verification status
    isVerified: { type: Boolean, default: false },
    
    // ══════════════════════════════════════════════════════════
    // 🆕 NEW FIELDS - Yeh 2 add karo
    // ══════════════════════════════════════════════════════════
    emailVerificationToken: { 
        type: String, 
        default: null 
    },
    emailVerificationExpiry: { 
        type: Date, 
        default: null 
    },
    // ══════════════════════════════════════════════════════════
    
    // ORCID specific verification fields
    orcidVerified: { type: Boolean, default: false },
    hasResearcherData: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    
    // Profile completeness
    profileCompleted: { type: Boolean, default: false },
    
    // Timestamps
    lastLogin: { type: Date, default: Date.now }
});

// Create indexes for OAuth fields for better query performance
userSchema.index({ googleId: 1 });
userSchema.index({ orcidId: 1 });
userSchema.index({ email: 1 });
userSchema.index({ emailVerificationToken: 1 });  // 🆕 NEW INDEX

module.exports = mongoose.model("User", userSchema);