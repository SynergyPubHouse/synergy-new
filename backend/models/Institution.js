const mongoose = require("mongoose");

const InstitutionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    normalizedName: { type: String, required: true, unique: true, index: true },
  },
  { timestamps: true }
);

InstitutionSchema.pre("validate", function (next) {
  if (this.name) {
    this.normalizedName = this.name.trim().toLowerCase();
  }
  next();
});

module.exports = mongoose.model("Institution", InstitutionSchema);
