const os = require("os");
const DoiDeposit = require("../models/DoiDeposit");
const Manuscript = require("../models/Manuscript");
const {
  getCrossrefConfig,
  validateCrossrefConfig,
} = require("../config/crossrefConfig");
const { generateCrossrefXml } = require("../services/crossrefXmlGenerator");
const { submitCrossrefDeposit } = require("../services/crossrefDepositClient");
const { markDepositSubmitted } = require("../services/crossrefResultProcessor");
const { validateMetadataSnapshot } = require("../services/doiService");

const WORKER_ID = `${os.hostname()}-${process.pid}`;
const STALE_LOCK_MS = 15 * 60 * 1000;

function getBackoffMs(retryCount) {
  const base = 60 * 1000;
  const max = 60 * 60 * 1000;
  return Math.min(max, base * Math.pow(2, Math.max(0, retryCount)));
}

async function claimNextDeposit(now = new Date()) {
  const staleBefore = new Date(now.getTime() - STALE_LOCK_MS);

  return DoiDeposit.findOneAndUpdate(
    {
      status: { $in: ["queued", "retry_scheduled"] },
      nextRetryAt: { $lte: now },
      $or: [
        { lockedAt: null },
        { lockedAt: { $exists: false } },
        { lockedAt: { $lte: staleBefore } },
      ],
    },
    {
      $set: {
        status: "validating",
        lockedAt: now,
        lockedBy: WORKER_ID,
        lastAttemptAt: now,
      },
    },
    { new: true, sort: { nextRetryAt: 1, createdAt: 1 } },
  );
}

async function failOrRetry(deposit, error, permanent = false) {
  const nextRetryCount = deposit.retryCount + 1;
  const canRetry = !permanent && nextRetryCount <= deposit.maxRetries;

  deposit.retryCount = nextRetryCount;
  deposit.status = canRetry ? "retry_scheduled" : "failed";
  deposit.nextRetryAt = canRetry
    ? new Date(Date.now() + getBackoffMs(nextRetryCount))
    : null;
  deposit.lockedAt = null;
  deposit.lockedBy = "";
  deposit.errors.push({
    type: error.type || (permanent ? "permanent" : "unknown"),
    message: error.message || String(error),
    at: new Date(),
  });
  deposit.submissionLog.push({
    at: new Date(),
    status: deposit.status,
    type: error.type || "error",
    message: error.message || String(error),
    httpStatus: error.response?.status || null,
    responseSnippet: String(error.response?.data || "").slice(0, 2000),
    retryCount: deposit.retryCount,
  });

  await deposit.save();
  await Manuscript.findByIdAndUpdate(deposit.manuscriptId, {
    doiStatus: deposit.status,
    doiDepositId: deposit._id,
  });
}

async function processOneDeposit() {
  const config = getCrossrefConfig();
  const startupValidation = validateCrossrefConfig(config, {
    requireSubmission: config.enabled,
  });

  if (config.enabled && !startupValidation.valid) {
    console.error("[DOI Worker] Crossref configuration invalid", {
      errors: startupValidation.errors,
      warnings: startupValidation.warnings,
    });
    return null;
  }

  const deposit = await claimNextDeposit();
  if (!deposit) return null;

  console.log("[DOI Worker] Claimed DOI deposit", {
    depositId: deposit._id.toString(),
    manuscriptId: deposit.manuscriptId.toString(),
    doi: deposit.doi,
    workerId: WORKER_ID,
  });

  try {
    const metadataValidation = validateMetadataSnapshot(
      deposit.metadataSnapshot,
      config,
    );
    deposit.warnings = metadataValidation.warnings;
    deposit.errors = metadataValidation.errors;

    if (!metadataValidation.valid) {
      await failOrRetry(
        deposit,
        new Error("DOI metadata validation failed"),
        true,
      );
      return deposit;
    }

    deposit.status = "submitting";
    deposit.xmlPayload = generateCrossrefXml(deposit.metadataSnapshot, {
      batchId: deposit.batchId,
      depositorName: config.depositorName,
      depositorEmail: config.depositorEmail,
    });
    await deposit.save();

    if (!config.enabled) {
      await failOrRetry(
        deposit,
        Object.assign(new Error("Crossref submission is disabled"), {
          type: "disabled",
        }),
        false,
      );
      return deposit;
    }

    const result = await submitCrossrefDeposit({
      xmlPayload: deposit.xmlPayload,
      batchId: deposit.batchId,
      config,
    });

    if (!result.ok) {
      await failOrRetry(
        deposit,
        Object.assign(new Error("Crossref returned a non-success status"), {
          type: "crossref",
          response: { status: result.httpStatus, data: result.responseText },
        }),
      );
      return deposit;
    }

    await markDepositSubmitted(deposit, result);
    return deposit;
  } catch (error) {
    console.error("[DOI Worker] Deposit processing failed", {
      depositId: deposit._id.toString(),
      message: error.message,
      type: error.type || "unknown",
    });
    await failOrRetry(deposit, error);
    return deposit;
  }
}

function startDoiWorker() {
  const config = getCrossrefConfig();
  const validation = validateCrossrefConfig(config, {
    requireSubmission: config.enabled,
  });

  if (!config.enabled) {
    console.log("[DOI Worker] Crossref disabled; worker not started", {
      environment: config.environment,
    });
    return null;
  }

  if (!validation.valid) {
    console.error("[DOI Worker] Not started because Crossref config is invalid", {
      errors: validation.errors,
    });
    return null;
  }

  console.log("[DOI Worker] Starting", {
    enabled: config.enabled,
    environment: config.environment,
    intervalMs: config.workerIntervalMs,
    workerId: WORKER_ID,
  });

  const timer = setInterval(() => {
    processOneDeposit().catch((error) => {
      console.error("[DOI Worker] Tick failed", { message: error.message });
    });
  }, config.workerIntervalMs);

  timer.unref?.();
  return timer;
}

module.exports = {
  claimNextDeposit,
  getBackoffMs,
  processOneDeposit,
  startDoiWorker,
};
