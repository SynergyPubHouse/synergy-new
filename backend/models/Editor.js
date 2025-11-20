const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const editorSchema = new mongoose.Schema({
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
    required: true,
    trim: true,
  },
  experience: {
    type: Number,
    required: true,
    min: 0,
  },
  specialKey: {
    type: String,
    required: true, // Every editor must have one
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password and specialKey before saving
editorSchema.pre("save", async function (next) {
  try {
    if (this.isModified("password")) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }

    if (this.isModified("specialKey")) {
      const salt = await bcrypt.genSalt(10);
      this.specialKey = await bcrypt.hash(this.specialKey, salt);
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Compare password
editorSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Compare special key
editorSchema.methods.compareSpecialKey = async function (candidateKey) {
  try {
    return await bcrypt.compare(candidateKey, this.specialKey);
  } catch (error) {
    throw error;
  }
};

const Editor = mongoose.model("Editor", editorSchema);

module.exports = Editor;
