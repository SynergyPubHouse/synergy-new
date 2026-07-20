const mongoose = require("mongoose");

const attemptSchema = new mongoose.Schema(
  {
    at: { type: Date, default: Date.now },
    status: { type: String, default: "" },
    type: { type: String, default: "" },
    message: { type: String, default: "" },
    httpStatus: { type: Number, default: null },
    responseSnippet: { type: String, default: "" },
    retryCount: { type: Number, default: 0 },
  },
  { _id: false },
);

const doiDepositSchema = new mongoose.Schema(
  {
    manuscriptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Manuscript",
      required: true,
      index: true,
    },
    doi: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    batchId: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    depositType: {
      type: String,
      enum: ["initial", "metadata_update"],
      default: "initial",
    },
    environment: {
      type: String,
      enum: ["test", "production"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: [
        "not_assigned",
        "queued",
        "validating",
        "submitting",
        "submitted",
        "processing",
        "registered",
        "warning",
        "failed",
        "retry_scheduled",
        "cancelled",
      ],
      default: "queued",
      index: true,
    },
    metadataSnapshot: { type: mongoose.Schema.Types.Mixed, required: true },
    xmlPayload: { type: String, default: "" },
    crossrefReceipt: { type: mongoose.Schema.Types.Mixed, default: null },
    submissionLog: { type: [attemptSchema], default: [] },
    warnings: { type: [mongoose.Schema.Types.Mixed], default: [] },
    errors: { type: [mongoose.Schema.Types.Mixed], default: [] },
    retryCount: { type: Number, default: 0, min: 0 },
    maxRetries: { type: Number, default: 5, min: 0 },
    nextRetryAt: { type: Date, default: Date.now, index: true },
    lastAttemptAt: { type: Date, default: null },
    submittedAt: { type: Date, default: null },
    registeredAt: { type: Date, default: null, index: true },
    lockedAt: { type: Date, default: null, index: true },
    lockedBy: { type: String, default: "", index: true },
  },
  { timestamps: true, suppressReservedKeysWarning: true },
);

doiDepositSchema.index({ status: 1, nextRetryAt: 1 });
doiDepositSchema.index({ lockedAt: 1, lockedBy: 1 });
doiDepositSchema.index({ manuscriptId: 1, depositType: 1, environment: 1 });

module.exports = mongoose.model("DoiDeposit", doiDepositSchema);
