const os = require("os");
const path = require("path");
const fs = require("fs");
const fsp = require("fs/promises");
const { pipeline } = require("stream");
const { promisify } = require("util");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const axios = require("axios");
const { HeadObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Manuscript = require("../models/Manuscript");

const streamPipeline = promisify(pipeline);

const CLOUDINARY_URL_PATTERN = /res\.cloudinary\.com/i;
const PUBLISHED_MANUSCRIPTS_PREFIX = "published_manuscripts";

const BATCH_SIZE = parsePositiveInt(process.env.MIGRATION_BATCH_SIZE, 10);
const REQUEST_DELAY_MS = parsePositiveInt(process.env.MIGRATION_DELAY_MS, 250);
const RETRY_ATTEMPTS = Math.max(
  2,
  parsePositiveInt(process.env.MIGRATION_RETRY_ATTEMPTS, 2),
);
const RETRY_DELAY_MS = parsePositiveInt(
  process.env.MIGRATION_RETRY_DELAY_MS,
  1500,
);
const DOWNLOAD_TIMEOUT_MS = parsePositiveInt(
  process.env.MIGRATION_DOWNLOAD_TIMEOUT_MS,
  30000,
);
const MIGRATION_LIMIT = parsePositiveInt(process.env.MIGRATION_LIMIT, 0);
const DRY_RUN = /^true$/i.test(process.env.DRY_RUN || "false");

let s3Client;

function parsePositiveInt(value, fallbackValue) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackValue;
}

function requireEnv(name) {
  const value = process.env[name];

  if (!value || !String(value).trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return String(value).trim();
}

function getS3Client() {
  if (!s3Client) {
    s3Client = new S3Client({
      region: requireEnv("AWS_REGION"),
      credentials: {
        accessKeyId: requireEnv("AWS_ACCESS_KEY_ID"),
        secretAccessKey: requireEnv("AWS_SECRET_ACCESS_KEY"),
      },
    });
  }

  return s3Client;
}

function buildS3Key(filename) {
  return `${PUBLISHED_MANUSCRIPTS_PREFIX}/${filename}`;
}

function buildMigrationQuery() {
  return {
    publishedFileUrl: { $regex: CLOUDINARY_URL_PATTERN },
  };
}

function buildBatchQuery(lastProcessedId) {
  const query = buildMigrationQuery();

  if (lastProcessedId) {
    query._id = { $gt: lastProcessedId };
  }

  return query;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function log(level, event, details = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...details,
  };

  const serialized = JSON.stringify(entry);

  if (level === "error") {
    console.error(serialized);
    return;
  }

  if (level === "warn") {
    console.warn(serialized);
    return;
  }

  console.log(serialized);
}

async function delay(ms) {
  if (ms <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeContentType(contentType) {
  return String(contentType || "")
    .split(";")[0]
    .trim()
    .toLowerCase();
}

function serializeError(error) {
  return {
    error: error?.message || "Unknown error",
    errorName: error?.name || null,
    errorCode: error?.code || error?.Code || null,
    httpStatusCode:
      error?.response?.status || error?.statusCode || error?.$metadata?.httpStatusCode || null,
    httpStatusText: error?.response?.statusText || null,
    awsRequestId: error?.$metadata?.requestId || null,
    awsExtendedRequestId: error?.$metadata?.extendedRequestId || null,
    awsAttempts: error?.$metadata?.attempts || null,
    contentType: error?.contentType || null,
    fileSignature: error?.fileSignature || null,
    reason: error?.reason || null,
  };
}

function extractFilename(fileUrl) {
  let parsedUrl;

  try {
    parsedUrl = new URL(fileUrl);
  } catch (error) {
    throw new Error(`Invalid URL: ${fileUrl}`);
  }

  const filename = path.basename(parsedUrl.pathname);

  if (!filename || !filename.toLowerCase().endsWith(".pdf")) {
    throw new Error(`Could not extract PDF filename from URL: ${fileUrl}`);
  }

  return filename;
}

async function findFilenameCollisions(manuscriptId, filename) {
  const filenamePattern = new RegExp(`${escapeRegex(filename)}$`);

  return Manuscript.find({
    _id: { $ne: manuscriptId },
    publishedFileUrl: { $regex: filenamePattern },
  })
    .select("_id publishedFileUrl")
    .lean();
}

async function getS3ObjectState(key) {
  try {
    const response = await getS3Client().send(
      new HeadObjectCommand({
        Bucket: requireEnv("AWS_S3_BUCKET"),
        Key: key,
      }),
    );

    return {
      exists: true,
      contentLength: response.ContentLength || 0,
      contentType: normalizeContentType(response.ContentType),
      etag: response.ETag || null,
      lastModified: response.LastModified || null,
    };
  } catch (error) {
    const awsStatusCode = error?.$metadata?.httpStatusCode || null;
    const awsErrorCode = error?.name || error?.Code || error?.code || null;

    if (
      awsStatusCode === 404 ||
      awsErrorCode === "NotFound" ||
      awsErrorCode === "NoSuchKey"
    ) {
      return {
        exists: false,
      };
    }

    throw error;
  }
}

function validateExistingS3Object(s3ObjectState, key) {
  if (!s3ObjectState?.exists) {
    return;
  }

  const isSupportedContentType =
    !s3ObjectState.contentType ||
    s3ObjectState.contentType === "application/pdf" ||
    s3ObjectState.contentType === "application/octet-stream" ||
    s3ObjectState.contentType === "binary/octet-stream";

  if (!s3ObjectState.contentLength || !isSupportedContentType) {
    const error = new Error(
      `Existing S3 object is not safe to reuse for key: ${key}`,
    );
    error.reason = "invalid_existing_s3_object";
    error.nonRetryable = true;
    error.contentType = s3ObjectState.contentType || null;
    error.fileSignature = null;
    throw error;
  }
}

async function validateDownloadedPdf(localFilePath, contentType) {
  const normalizedContentType = normalizeContentType(contentType);
  const fileHandle = await fsp.open(localFilePath, "r");
  const signatureBuffer = Buffer.alloc(5);
  let bytesRead = 0;

  try {
    const readResult = await fileHandle.read(signatureBuffer, 0, 5, 0);
    bytesRead = readResult.bytesRead;
  } finally {
    await fileHandle.close();
  }

  const fileSignature = signatureBuffer.slice(0, bytesRead).toString("ascii");
  const isSupportedContentType =
    !normalizedContentType ||
    normalizedContentType === "application/pdf" ||
    normalizedContentType === "application/octet-stream" ||
    normalizedContentType === "binary/octet-stream";

  if (!fileSignature.startsWith("%PDF-")) {
    const error = new Error("Downloaded file does not have a valid PDF signature");
    error.reason = "invalid_pdf_signature";
    error.contentType = normalizedContentType || null;
    error.fileSignature = fileSignature || null;
    throw error;
  }

  if (!isSupportedContentType) {
    log("warn", "migration.download_content_type_unexpected", {
      contentType: normalizedContentType || null,
      fileSignature,
      localFilePath,
    });
  }

  return {
    contentType: normalizedContentType || null,
    fileSignature,
  };
}

async function downloadFile(fileUrl, filename) {
  const tempFilePath = path.join(
    os.tmpdir(),
    `migrate_pdf_${Date.now()}_${Math.random().toString(36).slice(2)}_${filename}`,
  );

  const response = await axios({
    method: "get",
    url: fileUrl,
    responseType: "stream",
    timeout: DOWNLOAD_TIMEOUT_MS,
    maxRedirects: 5,
    validateStatus: (status) => status >= 200 && status < 300,
  });

  try {
    await streamPipeline(response.data, fs.createWriteStream(tempFilePath));
    const stats = await fsp.stat(tempFilePath);

    if (!stats.size) {
      throw new Error("Downloaded file is empty");
    }

    return {
      tempFilePath,
      fileSize: stats.size,
      contentType: response.headers["content-type"] || null,
    };
  } catch (error) {
    await fsp.unlink(tempFilePath).catch(() => {});
    throw error;
  }
}

async function uploadToS3(localFilePath, filename) {
  const key = buildS3Key(filename);

  const upload = new Upload({
    client: getS3Client(),
    params: {
      Bucket: requireEnv("AWS_S3_BUCKET"),
      Key: key,
      Body: fs.createReadStream(localFilePath),
      ContentType: "application/pdf",
    },
  });

  const result = await upload.done();

  return {
    key,
    etag: result?.ETag || null,
  };
}

async function processManuscript(manuscript) {
  const manuscriptId = manuscript._id.toString();
  const oldUrl = manuscript.publishedFileUrl || "";
  let filename = null;
  let newS3Key = null;
  let s3UploadStatus = null;
  let downloadContentType = null;
  let fileSignature = null;

  if (!oldUrl) {
    return {
      manuscriptId,
      oldUrl,
      status: "skipped",
      reason: "missing_published_file_url",
    };
  }

  if (!CLOUDINARY_URL_PATTERN.test(oldUrl)) {
    return {
      manuscriptId,
      oldUrl,
      status: "skipped",
      reason: "not_cloudinary_url",
    };
  }

  let tempFilePath = null;
  let downloadedFileSize = null;

  try {
    filename = extractFilename(oldUrl);
    newS3Key = buildS3Key(filename);

    const collisions = await findFilenameCollisions(manuscript._id, filename);

    if (collisions.length > 0) {
      return {
        manuscriptId,
        oldUrl,
        filename,
        newS3Key,
        status: "failed",
        reason: "filename_collision",
        nonRetryable: true,
        error: `Filename collision detected for ${filename}`,
        conflictingManuscriptIds: collisions.map((item) => item._id.toString()),
        conflictingUrls: collisions.map((item) => item.publishedFileUrl || ""),
      };
    }

    const existingS3Object = await getS3ObjectState(newS3Key);

    if (existingS3Object.exists) {
      validateExistingS3Object(existingS3Object, newS3Key);
      s3UploadStatus = "already_exists";
    }

    if (DRY_RUN) {
      return {
        manuscriptId,
        oldUrl,
        filename,
        newS3Key,
        s3UploadStatus: s3UploadStatus || "would_upload",
        status: "skipped",
        reason: "dry_run",
      };
    }

    if (!existingS3Object.exists) {
      const downloadResult = await downloadFile(oldUrl, filename);
      tempFilePath = downloadResult.tempFilePath;
      downloadedFileSize = downloadResult.fileSize;

      const pdfValidation = await validateDownloadedPdf(
        tempFilePath,
        downloadResult.contentType,
      );
      downloadContentType = pdfValidation.contentType;
      fileSignature = pdfValidation.fileSignature;

      await uploadToS3(tempFilePath, filename);
      s3UploadStatus = "uploaded";
    }

    return {
      manuscriptId,
      oldUrl,
      filename,
      newS3Key,
      fileSize: downloadedFileSize,
      downloadContentType,
      fileSignature,
      s3UploadStatus,
      status: "success",
    };
  } catch (error) {
    const errorDetails = serializeError(error);

    return {
      manuscriptId,
      oldUrl,
      filename,
      newS3Key,
      fileSize: downloadedFileSize,
      downloadContentType,
      fileSignature,
      s3UploadStatus,
      status: "failed",
      nonRetryable: error?.nonRetryable || false,
      ...errorDetails,
    };
  } finally {
    if (tempFilePath) {
      await fsp.unlink(tempFilePath).catch((cleanupError) => {
        log("warn", "migration.temp_file_cleanup_failed", {
          manuscriptId,
          tempFilePath,
          error: cleanupError.message,
        });
      });
    }
  }
}

async function processWithRetry(manuscript) {
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt += 1) {
    log("info", "migration.record_attempt", {
      manuscriptId: manuscript._id.toString(),
      oldUrl: manuscript.publishedFileUrl || "",
      attempt,
      maxAttempts: RETRY_ATTEMPTS,
    });

    const result = await processManuscript(manuscript);

    if (result.status !== "failed") {
      return {
        ...result,
        attempts: attempt,
      };
    }

    log("error", "migration.record_failed", {
      manuscriptId: result.manuscriptId,
      oldUrl: result.oldUrl,
      filename: result.filename,
      newS3Key: result.newS3Key,
      s3UploadStatus: result.s3UploadStatus || null,
      status: result.status,
      reason: result.reason || null,
      attempt,
      maxAttempts: RETRY_ATTEMPTS,
      error: result.error,
      errorCode: result.errorCode || null,
      httpStatusCode: result.httpStatusCode || null,
      awsRequestId: result.awsRequestId || null,
      conflictingManuscriptIds: result.conflictingManuscriptIds || null,
    });

    if (result.nonRetryable) {
      return {
        ...result,
        attempts: attempt,
      };
    }

    if (attempt < RETRY_ATTEMPTS) {
      await delay(RETRY_DELAY_MS);
    } else {
      return {
        ...result,
        attempts: attempt,
      };
    }
  }

  throw new Error("Retry loop exited unexpectedly");
}

async function connectToDatabase() {
  const mongoUri = requireEnv("MONGO_URI");

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 60000,
  });
}

async function run() {
  requireEnv("AWS_ACCESS_KEY_ID");
  requireEnv("AWS_SECRET_ACCESS_KEY");
  requireEnv("AWS_REGION");
  requireEnv("AWS_S3_BUCKET");
  requireEnv("MONGO_URI");

  await connectToDatabase();

  const totalCandidates = await Manuscript.countDocuments(buildMigrationQuery());
  const totalToProcess =
    MIGRATION_LIMIT > 0
      ? Math.min(totalCandidates, MIGRATION_LIMIT)
      : totalCandidates;

  const summary = {
    totalCandidates,
    totalToProcess,
    processed: 0,
    success: 0,
    failure: 0,
    skipped: 0,
  };
  let lastProcessedId = null;

  log("info", "migration.started", {
    totalCandidates,
    totalToProcess,
    batchSize: BATCH_SIZE,
    retryAttempts: RETRY_ATTEMPTS,
    requestDelayMs: REQUEST_DELAY_MS,
    retryDelayMs: RETRY_DELAY_MS,
    dryRun: DRY_RUN,
  });

  while (summary.processed < summary.totalToProcess) {
    const remaining = summary.totalToProcess - summary.processed;
    const batchLimit = Math.min(BATCH_SIZE, remaining);

    const batch = await Manuscript.find(buildBatchQuery(lastProcessedId))
      .sort({ _id: 1 })
      .select("_id publishedFileUrl")
      .lean()
      .limit(batchLimit);

    if (!batch.length) {
      break;
    }

    lastProcessedId = batch[batch.length - 1]._id;

    log("info", "migration.batch_started", {
      batchSize: batch.length,
      processed: summary.processed,
      totalToProcess: summary.totalToProcess,
    });

    for (const manuscript of batch) {
      const result = await processWithRetry(manuscript);

      summary.processed += 1;

      if (result.status === "success") {
        summary.success += 1;
      } else if (result.status === "failed") {
        summary.failure += 1;
      } else {
        summary.skipped += 1;
      }

      log(
        result.status === "failed" ? "error" : "info",
        "migration.record_completed",
        {
          manuscriptId: result.manuscriptId,
          oldUrl: result.oldUrl,
          filename: result.filename,
          newS3Key: result.newS3Key,
          s3UploadStatus: result.s3UploadStatus || null,
          status: result.status,
          reason: result.reason || null,
          error: result.error || null,
          errorCode: result.errorCode || null,
          httpStatusCode: result.httpStatusCode || null,
          awsRequestId: result.awsRequestId || null,
          downloadContentType: result.downloadContentType || null,
          fileSignature: result.fileSignature || null,
          conflictingManuscriptIds: result.conflictingManuscriptIds || null,
          attempts: result.attempts,
          progress: `${summary.processed}/${summary.totalToProcess}`,
        },
      );

      log("info", "migration.progress", {
        processed: summary.processed,
        totalToProcess: summary.totalToProcess,
        success: summary.success,
        failure: summary.failure,
        skipped: summary.skipped,
        message: `Processed ${summary.processed}/${summary.totalToProcess}`,
      });

      await delay(REQUEST_DELAY_MS);
    }
  }

  log("info", "migration.summary", summary);
}

async function main() {
  try {
    await run();
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    log("error", "migration.fatal", {
      error: error.message,
      stack: error.stack,
    });
    await mongoose.connection.close().catch(() => {});
    process.exit(1);
  }
}

main();
