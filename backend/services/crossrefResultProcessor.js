const Manuscript = require("../models/Manuscript");

async function markDepositSubmitted(deposit, result, session = null) {
  deposit.status = result.ok ? "submitted" : "failed";
  deposit.submittedAt = result.ok ? new Date() : deposit.submittedAt;
  deposit.crossrefReceipt = {
    httpStatus: result.httpStatus,
    responseText: result.responseText,
  };
  deposit.submissionLog.push({
    at: new Date(),
    status: deposit.status,
    type: result.ok ? "submitted" : "crossref",
    message: result.ok
      ? "Crossref accepted deposit for processing"
      : "Crossref deposit request failed",
    httpStatus: result.httpStatus,
    responseSnippet: String(result.responseText || "").slice(0, 2000),
    retryCount: deposit.retryCount,
  });
  deposit.lockedAt = null;
  deposit.lockedBy = "";
  await deposit.save({ session });

  await Manuscript.findByIdAndUpdate(
    deposit.manuscriptId,
    { doiStatus: deposit.status, doiDepositId: deposit._id },
    { session },
  );
}

async function markDepositRegistered(deposit, receipt, session = null) {
  deposit.status = "registered";
  deposit.registeredAt = new Date();
  deposit.crossrefReceipt = receipt;
  deposit.lockedAt = null;
  deposit.lockedBy = "";
  await deposit.save({ session });

  await Manuscript.findByIdAndUpdate(
    deposit.manuscriptId,
    { doiStatus: "registered", doiDepositId: deposit._id },
    { session },
  );
}

module.exports = {
  markDepositRegistered,
  markDepositSubmitted,
};
