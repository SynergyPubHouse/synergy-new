const DEFAULTS = {
  CROSSREF_ENABLED: "false",
  CROSSREF_ENV: "test",
  CROSSREF_TEST_DEPOSIT_URL: "",
  CROSSREF_PRODUCTION_DEPOSIT_URL: "",
  CROSSREF_USERNAME: "",
  CROSSREF_PASSWORD: "",
  CROSSREF_DOI_PREFIX: "",
  CROSSREF_DEPOSITOR_NAME: "Synergy World Press",
  CROSSREF_DEPOSITOR_EMAIL: "",
  CROSSREF_JOURNAL_TITLE: "",
  CROSSREF_JOURNAL_ABBREVIATION: "JICS",
  CROSSREF_ISSN: "3139-3616",
  CROSSREF_ISSN_MEDIA_TYPE: "electronic",
  CROSSREF_RESOURCE_BASE_URL:
    "https://synergyworldpress.com/journal/jics/articles",
  CROSSREF_MAX_RETRIES: "5",
  CROSSREF_WORKER_INTERVAL_MS: "60000",
  CROSSREF_JOURNAL_CODE: "109319",
  CROSSREF_REQUEST_TIMEOUT_MS: "30000",
};

function bool(value) {
  return String(value || "").toLowerCase() === "true";
}

function intValue(value, fallback) {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function cleanUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function getCrossrefConfig(env = process.env) {
  const merged = { ...DEFAULTS };
  for (const key of Object.keys(DEFAULTS)) {
    if (env[key] != null) merged[key] = env[key];
  }

  const environment =
    String(merged.CROSSREF_ENV || "test").toLowerCase() === "production"
      ? "production"
      : "test";

  return {
    enabled: bool(merged.CROSSREF_ENABLED),
    environment,
    depositUrl:
      environment === "production"
        ? cleanUrl(merged.CROSSREF_PRODUCTION_DEPOSIT_URL)
        : cleanUrl(merged.CROSSREF_TEST_DEPOSIT_URL),
    username: String(merged.CROSSREF_USERNAME || "").trim(),
    password: String(merged.CROSSREF_PASSWORD || ""),
    doiPrefix: String(merged.CROSSREF_DOI_PREFIX || "").trim(),
    depositorName: String(merged.CROSSREF_DEPOSITOR_NAME || "").trim(),
    depositorEmail: String(merged.CROSSREF_DEPOSITOR_EMAIL || "").trim(),
    journalTitle: String(merged.CROSSREF_JOURNAL_TITLE || "").trim(),
    journalAbbreviation: String(
      merged.CROSSREF_JOURNAL_ABBREVIATION || "",
    ).trim(),
    issn: String(merged.CROSSREF_ISSN || "").trim(),
    issnMediaType: String(
      merged.CROSSREF_ISSN_MEDIA_TYPE || "electronic",
    ).trim(),
    resourceBaseUrl: cleanUrl(merged.CROSSREF_RESOURCE_BASE_URL),
    maxRetries: intValue(merged.CROSSREF_MAX_RETRIES, 5),
    workerIntervalMs: Math.max(
      10000,
      intValue(merged.CROSSREF_WORKER_INTERVAL_MS, 60000),
    ),
    journalCode: String(merged.CROSSREF_JOURNAL_CODE || "jics")
      .trim()
      .toLowerCase(),
    requestTimeoutMs: Math.max(
      5000,
      intValue(merged.CROSSREF_REQUEST_TIMEOUT_MS, 30000),
    ),
  };
}

function validateCrossrefConfig(config, { requireSubmission = false } = {}) {
  const errors = [];
  const warnings = [];

  if (!/^10\.\d{4,9}$/.test(config.doiPrefix)) {
    errors.push({
      field: "CROSSREF_DOI_PREFIX",
      message: "DOI prefix must look like 10.xxxx.",
    });
  }
  if (!config.journalTitle) {
    errors.push({
      field: "CROSSREF_JOURNAL_TITLE",
      message: "Journal title is required for Crossref metadata.",
    });
  }
  if (!/^\d{4}-\d{3}[\dXx]$/.test(config.issn)) {
    errors.push({
      field: "CROSSREF_ISSN",
      message: "ISSN must use the format 1234-567X.",
    });
  }
  if (!["print", "electronic"].includes(config.issnMediaType)) {
    errors.push({
      field: "CROSSREF_ISSN_MEDIA_TYPE",
      message: "ISSN media type must be print or electronic.",
    });
  }
  if (!/^https?:\/\//i.test(config.resourceBaseUrl)) {
    errors.push({
      field: "CROSSREF_RESOURCE_BASE_URL",
      message: "Resource base URL must be an absolute HTTP(S) URL.",
    });
  }

  if (requireSubmission) {
    if (!config.enabled) {
      warnings.push({
        field: "CROSSREF_ENABLED",
        message: "Crossref submission is disabled.",
      });
    }
    if (!config.depositUrl) {
      errors.push({
        field:
          config.environment === "production"
            ? "CROSSREF_PRODUCTION_DEPOSIT_URL"
            : "CROSSREF_TEST_DEPOSIT_URL",
        message: "Deposit URL is required when the worker submits jobs.",
      });
    }
    if (!config.username) {
      errors.push({
        field: "CROSSREF_USERNAME",
        message: "Crossref username is required for submission.",
      });
    }
    if (!config.password) {
      errors.push({
        field: "CROSSREF_PASSWORD",
        message: "Crossref password is required for submission.",
      });
    }
    if (!config.depositorEmail) {
      errors.push({
        field: "CROSSREF_DEPOSITOR_EMAIL",
        message: "Depositor email is required for submission.",
      });
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

module.exports = {
  DEFAULTS,
  getCrossrefConfig,
  validateCrossrefConfig,
};
