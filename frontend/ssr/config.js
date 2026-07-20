const DEFAULT_API_URL = "https://api.synergyworldpress.com";
export const DEFAULT_SITE_URL = "https://synergyworldpress.com";

export function normalizeSiteUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

export function buildCanonicalUrl(publicSiteUrl, pathname) {
  return `${normalizeSiteUrl(publicSiteUrl || DEFAULT_SITE_URL)}${pathname}`;
}

function positiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function createSsrConfig({ processEnv, viteEnv = {}, isProduction }) {
  const apiBaseUrl = normalizeSiteUrl(
    processEnv.SSR_BACKEND_URL ||
      viteEnv.SSR_BACKEND_URL ||
      (isProduction ? DEFAULT_API_URL : "http://localhost:5000"),
  );
  const publicSiteUrl = normalizeSiteUrl(
    processEnv.PUBLIC_SITE_URL ||
      viteEnv.PUBLIC_SITE_URL ||
      viteEnv.VITE_PUBLIC_SITE_URL ||
      DEFAULT_SITE_URL,
  );

  return {
    apiBaseUrl,
    publicSiteUrl,
    port: positiveInteger(processEnv.PORT || 4173, 4173),
    requestTimeoutMs: positiveInteger(
      processEnv.SSR_REQUEST_TIMEOUT_MS || viteEnv.SSR_REQUEST_TIMEOUT_MS,
      8_000,
    ),
  };
}
