const axios = require("axios");
const FormData = require("form-data");

function redactConfig(config) {
  return {
    ...config,
    password: config.password ? "[redacted]" : "",
  };
}

async function submitCrossrefDeposit({ xmlPayload, batchId, config }) {
  if (!config.enabled) {
    const error = new Error("Crossref submission is disabled");
    error.type = "disabled";
    throw error;
  }

  if (config.environment === "production" && process.env.NODE_ENV === "test") {
    const error = new Error("Production Crossref submission is blocked in tests");
    error.type = "safety";
    throw error;
  }

  const form = new FormData();
  form.append("operation", "doMDUpload");
  form.append("login_id", config.username);
  form.append("login_passwd", config.password);
  form.append("fname", Buffer.from(xmlPayload, "utf8"), {
    filename: `${batchId}.xml`,
    contentType: "application/xml",
  });

  try {
    const response = await axios.post(config.depositUrl, form, {
      headers: form.getHeaders(),
      timeout: config.requestTimeoutMs,
      maxContentLength: 10 * 1024 * 1024,
      maxBodyLength: 10 * 1024 * 1024,
      validateStatus: () => true,
    });

    return {
      ok: response.status >= 200 && response.status < 300,
      httpStatus: response.status,
      responseText:
        typeof response.data === "string"
          ? response.data
          : JSON.stringify(response.data),
      submittedConfig: redactConfig(config),
    };
  } catch (error) {
    error.type = error.code === "ECONNABORTED" ? "timeout" : "network";
    throw error;
  }
}

module.exports = {
  redactConfig,
  submitCrossrefDeposit,
};
