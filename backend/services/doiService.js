const crypto = require("crypto");
const mongoose = require("mongoose");
const Manuscript = require("../models/Manuscript");
const DoiDeposit = require("../models/DoiDeposit");
const {
  getCrossrefConfig,
  validateCrossrefConfig,
} = require("../config/crossrefConfig");

const DOI_STATUSES = [
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
];

function normalizeDoiSuffix(customId, journalCode = "jics") {
  const id = String(customId || "").trim();
  const match = id.match(/^([A-Za-z]+)-(\d{2,4})-(\d+)$/);

  if (match) {
    return `${String(journalCode || match[1]).toLowerCase()}.${match[2]}.${match[3]}`;
  }

  const normalizedJournalCode = String(journalCode || "jics").toLowerCase();
  const normalizedId = id
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
  const suffixBody = normalizedId.startsWith(`${normalizedJournalCode}.`)
    ? normalizedId.slice(normalizedJournalCode.length + 1)
    : normalizedId;

  return `${normalizedJournalCode}.${suffixBody}`;
}

function generateDoi(customId, config = getCrossrefConfig()) {
  if (!config.doiPrefix) {
    throw new Error("CROSSREF_DOI_PREFIX is required to generate a DOI");
  }

  return `${config.doiPrefix}/${normalizeDoiSuffix(
    customId,
    config.journalCode,
  )}`;
}

function getArticleUrlId(manuscript) {
  return manuscript.customId || manuscript.custom_id || manuscript._id;
}

function buildResourceUrl(manuscript, config = getCrossrefConfig()) {
  return `${config.resourceBaseUrl}/${encodeURIComponent(
    String(getArticleUrlId(manuscript)),
  )}`;
}

function splitAuthorName(fullName) {
  const parts = String(fullName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return { givenName: "", familyName: "", fullName: "" };
  }

  if (parts.length === 1) {
    return { givenName: "", familyName: parts[0], fullName: parts[0] };
  }

  return {
    givenName: parts.slice(0, -1).join(" "),
    familyName: parts[parts.length - 1],
    fullName: parts.join(" "),
  };
}

function normalizeOrcid(orcid) {
  const value = String(orcid || "").trim();
  if (!value) return "";
  const id = value.replace(/^https?:\/\/orcid\.org\//i, "");
  return id ? `https://orcid.org/${id}` : "";
}

function buildAuthorFromUser(author, index) {
  const givenName = [author?.firstName, author?.middleName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const familyName = String(author?.lastName || "").trim();
  const fullName = [givenName, familyName].filter(Boolean).join(" ").trim();

  return {
    sequence: index === 0 ? "first" : "additional",
    givenName,
    familyName,
    fullName,
    orcid: normalizeOrcid(author?.orcidId),
    affiliations: [],
  };
}

function buildAuthorsSnapshot(manuscript) {
  if (
    Array.isArray(manuscript.pdfAuthors) &&
    manuscript.pdfAuthors.filter(Boolean).length > 0
  ) {
    return manuscript.pdfAuthors
      .filter((name) => name && String(name).trim())
      .map((name, index) => {
        const split = splitAuthorName(name);
        return {
          sequence: index === 0 ? "first" : "additional",
          ...split,
          orcid: "",
          affiliations: [],
        };
      });
  }

  if (Array.isArray(manuscript.authors)) {
    return manuscript.authors
      .filter(Boolean)
      .map((author, index) => buildAuthorFromUser(author, index))
      .filter((author) => author.fullName || author.familyName);
  }

  return [];
}

function buildMetadataSnapshot(manuscript, config = getCrossrefConfig()) {
  const articleUrl = manuscript.crossrefResourceUrl || buildResourceUrl(manuscript, config);
  const doi = manuscript.doi || generateDoi(manuscript.customId || manuscript._id, config);
  const publishedAt = manuscript.publishedAt
    ? new Date(manuscript.publishedAt)
    : null;

  return {
    manuscriptId: manuscript._id?.toString(),
    customId: manuscript.customId || "",
    title: manuscript.title || "",
    abstract: manuscript.abstract || "",
    keywords: manuscript.keywords || "",
    authors: buildAuthorsSnapshot(manuscript),
    publicationDate: publishedAt ? publishedAt.toISOString() : "",
    volume: manuscript.issueVolume || null,
    issue: manuscript.issueNumber || null,
    issueTitle: manuscript.issueTitle || "",
    firstPage: manuscript.pageStart || null,
    lastPage: manuscript.pageEnd || null,
    articleNumber: manuscript.articleNumber || "",
    journalTitle: config.journalTitle,
    journalAbbreviation: config.journalAbbreviation,
    issn: config.issn,
    issnMediaType: config.issnMediaType,
    doi,
    canonicalUrl: manuscript.canonicalUrl || articleUrl,
    crossrefResourceUrl: articleUrl,
    publicPdfUrl: manuscript.publishedFileUrl || "",
    specialIssue: manuscript.separateIssue === true,
    licenceUrl: "",
    fundingData: manuscript.funding || "",
    references: [],
  };
}

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_) {
    return false;
  }
}

function validateMetadataSnapshot(snapshot, config = getCrossrefConfig()) {
  const configValidation = validateCrossrefConfig(config);
  const errors = [...configValidation.errors];
  const warnings = [...configValidation.warnings];

  if (!/^10\.\d{4,9}\/\S+$/i.test(snapshot.doi || "")) {
    errors.push({ field: "doi", message: "DOI is missing or invalid." });
  }
  if (!snapshot.title) {
    errors.push({ field: "title", message: "Article title is required." });
  }
  if (!Array.isArray(snapshot.authors) || snapshot.authors.length === 0) {
    errors.push({
      field: "authors",
      message: "At least one author is required.",
    });
  }
  if (!snapshot.publicationDate) {
    errors.push({
      field: "publicationDate",
      message: "Publication date is required.",
    });
  }
  if (!snapshot.journalTitle) {
    errors.push({
      field: "journalTitle",
      message: "Journal title is required.",
    });
  }
  if (!snapshot.issn) {
    errors.push({ field: "issn", message: "ISSN is required." });
  }
  if (!isValidUrl(snapshot.canonicalUrl)) {
    errors.push({
      field: "canonicalUrl",
      message: "Canonical article URL must be absolute.",
    });
  }
  if (!isValidUrl(snapshot.crossrefResourceUrl)) {
    errors.push({
      field: "crossrefResourceUrl",
      message: "Crossref resource URL must be absolute.",
    });
  }
  if (!isValidUrl(snapshot.publicPdfUrl)) {
    errors.push({
      field: "publicPdfUrl",
      message: "Public PDF URL must be absolute.",
    });
  }
  if (!snapshot.articleNumber && !snapshot.firstPage) {
    warnings.push({
      field: "pages",
      message: "No page range or article number is available.",
    });
  }
  if (snapshot.lastPage && snapshot.firstPage && snapshot.lastPage < snapshot.firstPage) {
    errors.push({
      field: "pageEnd",
      message: "Last page cannot be before first page.",
    });
  }
  if ((snapshot.volume && !snapshot.issue) || (!snapshot.volume && snapshot.issue)) {
    warnings.push({
      field: "issue",
      message: "Volume and issue are usually deposited together.",
    });
  }

  for (const [index, author] of (snapshot.authors || []).entries()) {
    if (!author.fullName && !author.familyName) {
      errors.push({
        field: `authors.${index}`,
        message: "Author name is required.",
      });
    }
    if (
      author.orcid &&
      !/^https:\/\/orcid\.org\/\d{4}-\d{4}-\d{4}-[\dX]{4}$/i.test(
        author.orcid,
      )
    ) {
      errors.push({
        field: `authors.${index}.orcid`,
        message: "ORCID must be a valid ORCID URL.",
      });
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

function buildBatchId(doi) {
  const digest = crypto
    .createHash("sha1")
    .update(`${doi}:${Date.now()}:${Math.random()}`)
    .digest("hex")
    .slice(0, 12);
  return `swp_${Date.now()}_${digest}`;
}

async function assignDoiAndQueueDeposit(manuscript, options = {}) {
  const config = options.config || getCrossrefConfig();
  const session = options.session || null;
  const existingDoi = manuscript.doi;
  const doi = existingDoi || generateDoi(manuscript.customId || manuscript._id, config);
  const resourceUrl = buildResourceUrl(manuscript, config);

  const duplicate = await Manuscript.findOne({
    _id: { $ne: manuscript._id },
    doi,
  }).session(session);
  if (duplicate) {
    throw new Error(`Generated DOI already belongs to another manuscript: ${doi}`);
  }

  manuscript.doi = doi;
  manuscript.doiStatus = manuscript.doiStatus === "registered" ? "registered" : "queued";
  manuscript.canonicalUrl = manuscript.canonicalUrl || resourceUrl;
  manuscript.crossrefResourceUrl = manuscript.crossrefResourceUrl || resourceUrl;
  manuscript.customIdLocked = true;
  manuscript.customIdLockedAt = manuscript.customIdLockedAt || new Date();

  const snapshot = buildMetadataSnapshot(manuscript, config);
  const validation = validateMetadataSnapshot(snapshot, config);
  manuscript.crossrefMetadataSnapshot = snapshot;

  let deposit = await DoiDeposit.findOne({
    manuscriptId: manuscript._id,
    doi,
    depositType: "initial",
    environment: config.environment,
    status: { $nin: ["cancelled"] },
  }).session(session);

  if (!deposit) {
    deposit = new DoiDeposit({
      manuscriptId: manuscript._id,
      doi,
      batchId: buildBatchId(doi),
      depositType: "initial",
      environment: config.environment,
      status: validation.valid ? "queued" : "failed",
      metadataSnapshot: snapshot,
      warnings: validation.warnings,
      errors: validation.errors,
      retryCount: 0,
      maxRetries: config.maxRetries,
      nextRetryAt: new Date(),
    });
  } else if (!["registered", "submitted", "processing"].includes(deposit.status)) {
    deposit.metadataSnapshot = snapshot;
    deposit.status = validation.valid ? "queued" : "failed";
    deposit.warnings = validation.warnings;
    deposit.errors = validation.errors;
    deposit.nextRetryAt = new Date();
  }

  await deposit.save({ session });
  manuscript.doiDepositId = deposit._id;
  manuscript.doiStatus = deposit.status;

  return {
    doi,
    deposit,
    snapshot,
    validation,
    queued: deposit.status === "queued",
  };
}

async function retryDeposit(depositId) {
  if (!mongoose.Types.ObjectId.isValid(depositId)) {
    throw new Error("Invalid DOI deposit id");
  }

  return DoiDeposit.findByIdAndUpdate(
    depositId,
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

module.exports = {
  DOI_STATUSES,
  assignDoiAndQueueDeposit,
  buildMetadataSnapshot,
  buildResourceUrl,
  generateDoi,
  normalizeDoiSuffix,
  normalizeOrcid,
  retryDeposit,
  validateMetadataSnapshot,
};
