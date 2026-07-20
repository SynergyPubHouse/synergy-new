const mongoose = require("mongoose");

const doiSequenceCounterSchema = new mongoose.Schema(
  {
    prefix: { type: String, required: true, trim: true },
    journalCode: { type: String, required: true, trim: true },
    volume: { type: Number, required: true, min: 1 },
    issue: { type: Number, required: true, min: 1 },
    sequence: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true },
);

doiSequenceCounterSchema.index(
  { prefix: 1, journalCode: 1, volume: 1, issue: 1 },
  { unique: true },
);

module.exports = mongoose.model("DoiSequenceCounter", doiSequenceCounterSchema);
