const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Manuscript = require("../models/Manuscript");

const BATCH_SIZE = parsePositiveInt(process.env.COPY_BATCH_SIZE, 100);
const LIMIT = parsePositiveInt(process.env.COPY_LIMIT, 0);
const DRY_RUN = /^true$/i.test(process.env.DRY_RUN || "false");

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

  console.log(serialized);
}

function buildQuery(lastProcessedId) {
  const query = {
    publishedFileUrl: {
      $exists: true,
      $type: "string",
      $nin: ["", null],
    },
    $or: [
      { publishedFileUrlOld: { $exists: false } },
      { publishedFileUrlOld: null },
      { publishedFileUrlOld: "" },
    ],
  };

  if (lastProcessedId) {
    query._id = { $gt: lastProcessedId };
  }

  return query;
}

async function connectToDatabase() {
  await mongoose.connect(requireEnv("MONGO_URI"), {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 60000,
  });
}

async function copyPublishedFileUrl(manuscript) {
  const manuscriptId = manuscript._id.toString();
  const publishedFileUrl = String(manuscript.publishedFileUrl || "").trim();

  if (!publishedFileUrl) {
    return {
      manuscriptId,
      status: "skipped",
      reason: "missing_published_file_url",
    };
  }

  if (DRY_RUN) {
    return {
      manuscriptId,
      publishedFileUrl,
      publishedFileUrlOld: publishedFileUrl,
      status: "dry_run",
    };
  }

  const result = await Manuscript.collection.updateOne(
    {
      _id: manuscript._id,
      publishedFileUrl,
      $or: [
        { publishedFileUrlOld: { $exists: false } },
        { publishedFileUrlOld: null },
        { publishedFileUrlOld: "" },
      ],
    },
    {
      $set: {
        publishedFileUrlOld: publishedFileUrl,
      },
    },
  );

  if (result.modifiedCount === 1) {
    return {
      manuscriptId,
      publishedFileUrl,
      publishedFileUrlOld: publishedFileUrl,
      status: "success",
    };
  }

  const latest = await Manuscript.collection.findOne(
    { _id: manuscript._id },
    {
      projection: {
        publishedFileUrl: 1,
        publishedFileUrlOld: 1,
      },
    },
  );

  if (latest?.publishedFileUrlOld === publishedFileUrl) {
    return {
      manuscriptId,
      publishedFileUrl,
      publishedFileUrlOld: latest.publishedFileUrlOld,
      status: "skipped",
      reason: "already_copied",
    };
  }

  throw new Error("Database update was not applied");
}

async function run() {
  requireEnv("MONGO_URI");
  await connectToDatabase();

  const totalCandidates = await Manuscript.collection.countDocuments(
    buildQuery(),
  );
  const totalToProcess =
    LIMIT > 0 ? Math.min(totalCandidates, LIMIT) : totalCandidates;

  const summary = {
    totalCandidates,
    totalToProcess,
    processed: 0,
    success: 0,
    skipped: 0,
    failed: 0,
    dryRun: DRY_RUN,
  };

  let lastProcessedId = null;

  log("info", "copy_published_file_url_old.started", {
    totalCandidates,
    totalToProcess,
    batchSize: BATCH_SIZE,
    dryRun: DRY_RUN,
    dbName: mongoose.connection?.name || null,
  });

  while (summary.processed < summary.totalToProcess) {
    const batchLimit = Math.min(
      BATCH_SIZE,
      summary.totalToProcess - summary.processed,
    );

    const batch = await Manuscript.collection
      .find(buildQuery(lastProcessedId), {
        projection: {
          _id: 1,
          publishedFileUrl: 1,
          publishedFileUrlOld: 1,
        },
      })
      .sort({ _id: 1 })
      .limit(batchLimit)
      .toArray();

    if (!batch.length) {
      break;
    }

    lastProcessedId = batch[batch.length - 1]._id;

    for (const manuscript of batch) {
      try {
        const result = await copyPublishedFileUrl(manuscript);

        summary.processed += 1;

        if (result.status === "success") {
          summary.success += 1;
        } else {
          summary.skipped += 1;
        }

        log("info", "copy_published_file_url_old.record", {
          manuscriptId: result.manuscriptId,
          publishedFileUrl: result.publishedFileUrl || null,
          publishedFileUrlOld: result.publishedFileUrlOld || null,
          status: result.status,
          reason: result.reason || null,
          progress: `${summary.processed}/${summary.totalToProcess}`,
        });
      } catch (error) {
        summary.processed += 1;
        summary.failed += 1;

        log("error", "copy_published_file_url_old.record_failed", {
          manuscriptId: manuscript._id.toString(),
          publishedFileUrl: manuscript.publishedFileUrl || null,
          status: "failed",
          error: error.message,
          progress: `${summary.processed}/${summary.totalToProcess}`,
        });
      }
    }
  }

  log("info", "copy_published_file_url_old.summary", summary);
}

async function main() {
  try {
    await run();
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    log("error", "copy_published_file_url_old.fatal", {
      error: error.message,
      stack: error.stack,
    });
    await mongoose.connection.close().catch(() => {});
    process.exit(1);
  }
}

main();
