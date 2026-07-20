const DoiDeposit = require("../models/DoiDeposit");

async function getDoiStatus(manuscriptId) {
  return DoiDeposit.find({ manuscriptId })
    .sort({ createdAt: -1 })
    .select("-xmlPayload")
    .lean();
}

async function inspectDeposit(depositId, { includeXml = false } = {}) {
  const projection = includeXml ? undefined : "-xmlPayload";
  return DoiDeposit.findById(depositId).select(projection).lean();
}

async function retryFailedDeposit(depositId) {
  return DoiDeposit.findOneAndUpdate(
    {
      _id: depositId,
      status: { $in: ["failed", "retry_scheduled"] },
    },
    {
      $set: {
        status: "queued",
        nextRetryAt: new Date(),
        lockedAt: null,
        lockedBy: "",
      },
    },
    { new: true },
  );
}

async function cancelQueuedDeposit(depositId, reason = "") {
  return DoiDeposit.findOneAndUpdate(
    {
      _id: depositId,
      status: { $in: ["queued", "validating", "retry_scheduled"] },
    },
    {
      $set: {
        status: "cancelled",
        lockedAt: null,
        lockedBy: "",
      },
      $push: {
        submissionLog: {
          at: new Date(),
          status: "cancelled",
          type: "admin",
          message: reason || "Cancelled by administrator",
        },
      },
    },
    { new: true },
  );
}

module.exports = {
  cancelQueuedDeposit,
  getDoiStatus,
  inspectDeposit,
  retryFailedDeposit,
};
