// config/publicBaseUrls.js
//
// Single source of truth for the public base URLs used in SEO-facing output:
// canonical links, citation_* meta tags, og:url, sitemap.xml, robots.txt,
// and stored public PDF URLs.
//
//   PUBLIC_API_BASE_URL  -> where this Express app is publicly reachable
//                           (serves /scholar/*, /sitemap.xml, /pdf/*)
//   PUBLIC_SITE_BASE_URL -> where the reader-facing React site is served
//
// BASE_URL is intentionally NOT read here. It configures file-upload URLs
// (utils/localStorage.js) and is set to a localhost value in some
// environments; reading it for SEO URLs is what leaked http://localhost:5000
// into production citation/canonical tags.

const PROD_API_BASE_URL = "https://api.synergyworldpress.com";
const PROD_SITE_BASE_URL = "https://synergyworldpress.com";

// Dev-only fallbacks. isProduction() gates every path that could return
// these, so a localhost URL can never be emitted when NODE_ENV=production.
const DEV_API_BASE_URL = "http://localhost:5000";
const DEV_SITE_BASE_URL = "http://localhost:5173";

const LOCAL_HOSTNAME_PATTERN =
  /^(localhost|127(?:\.\d{1,3}){3}|0\.0\.0\.0|::1|\[::1\])$/i;

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function normalizeBaseUrl(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";

  const withProtocol =
    trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`;

  return withProtocol.replace(/\/+$/, "");
}

function isLocalBaseUrl(baseUrl) {
  try {
    return LOCAL_HOSTNAME_PATTERN.test(new URL(baseUrl).hostname);
  } catch (_) {
    return false;
  }
}

const warnedKeys = new Set();

function warnOnce(key, message) {
  if (warnedKeys.has(key)) return;
  warnedKeys.add(key);
  console.error(message);
}

function resolvePublicBaseUrl({ envName, prodDefault, devDefault }) {
  const configured = normalizeBaseUrl(process.env[envName]);

  if (!isProduction()) {
    return configured || normalizeBaseUrl(devDefault);
  }

  if (!configured) {
    warnOnce(
      `${envName}:missing`,
      `[publicBaseUrls] ${envName} is not set but NODE_ENV=production. ` +
        `Falling back to ${prodDefault}. Set ${envName} in the production .env.`,
    );
    return prodDefault;
  }

  if (isLocalBaseUrl(configured)) {
    warnOnce(
      `${envName}:local`,
      `[publicBaseUrls] ${envName}="${configured}" is a local URL but ` +
        `NODE_ENV=production. Ignoring it and using ${prodDefault}. ` +
        `Fix ${envName} in the production .env.`,
    );
    return prodDefault;
  }

  return configured;
}

function getPublicApiBaseUrl() {
  return resolvePublicBaseUrl({
    envName: "PUBLIC_API_BASE_URL",
    prodDefault: PROD_API_BASE_URL,
    devDefault: DEV_API_BASE_URL,
  });
}

function getPublicSiteBaseUrl() {
  return resolvePublicBaseUrl({
    envName: "PUBLIC_SITE_BASE_URL",
    prodDefault: PROD_SITE_BASE_URL,
    devDefault: DEV_SITE_BASE_URL,
  });
}

module.exports = {
  getPublicApiBaseUrl,
  getPublicSiteBaseUrl,
  isLocalBaseUrl,
  normalizeBaseUrl,
};
