export class BackendApiError extends Error {
  constructor(message, { statusCode = 502, ...options } = {}) {
    super(message, options);
    this.name = "BackendApiError";
    this.statusCode = statusCode;
  }
}

export class BackendValidationError extends BackendApiError {
  constructor(message, options = {}) {
    super(message, { ...options, statusCode: 400 });
    this.name = "BackendValidationError";
  }
}

export class BackendNotFoundError extends BackendApiError {
  constructor(message, options = {}) {
    super(message, { ...options, statusCode: 404 });
    this.name = "BackendNotFoundError";
  }
}

export class BackendTimeoutError extends BackendApiError {
  constructor(message, options = {}) {
    super(message, { ...options, statusCode: 504 });
    this.name = "BackendTimeoutError";
  }
}

function isJsonObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function createBackendApiClient({
  baseUrl,
  timeoutMs,
  fetchImpl = globalThis.fetch,
}) {
  if (!baseUrl) {
    throw new Error("SSR_BACKEND_URL is required");
  }

  if (typeof fetchImpl !== "function") {
    throw new Error("A fetch implementation is required");
  }

  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error("A positive timeoutMs is required");
  }

  const normalizedBaseUrl = String(baseUrl).replace(/\/+$/, "");

  return {
    async getJson(pathname) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      let response;

      try {
        response = await fetchImpl(`${normalizedBaseUrl}${pathname}`, {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
      } catch (error) {
        if (error?.name === "AbortError") {
          throw new BackendTimeoutError("Backend API request timed out", {
            cause: error,
          });
        }
        throw new BackendApiError("Backend API is unavailable", {
          cause: error,
        });
      } finally {
        clearTimeout(timeout);
      }

      let body;
      try {
        body = await response.json();
      } catch (error) {
        throw new BackendApiError("Backend API returned invalid JSON", {
          cause: error,
        });
      }

      if (!isJsonObject(body)) {
        throw new BackendApiError("Backend API returned an invalid JSON body");
      }

      if (response.status === 400) {
        throw new BackendValidationError(
          body.message || "Backend request was invalid",
        );
      }

      if (response.status === 404) {
        throw new BackendNotFoundError(
          body.message || "Backend resource was not found",
        );
      }

      if (!response.ok) {
        throw new BackendApiError(
          `Backend API returned ${response.status}`,
          { statusCode: response.status === 503 ? 503 : 502 },
        );
      }

      return body;
    },
  };
}
