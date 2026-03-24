const path = require("path");
const {
  DeleteObjectCommand,
  GetObjectCommand,
  S3Client,
} = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");

const PUBLISHED_MANUSCRIPTS_PREFIX = "published_manuscripts";

let s3Client;

function getRequiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getS3Client() {
  if (!s3Client) {
    s3Client = new S3Client({
      region: getRequiredEnv("AWS_REGION"),
      credentials: {
        accessKeyId: getRequiredEnv("AWS_ACCESS_KEY_ID"),
        secretAccessKey: getRequiredEnv("AWS_SECRET_ACCESS_KEY"),
      },
    });
  }

  return s3Client;
}

function getPublicSiteBaseUrl() {
  const configuredBaseUrl = (
    process.env.PUBLIC_SITE_URL ||
    process.env.BASE_URL ||
    "https://synergyworldpress.com"
  ).trim();

  return (
    configuredBaseUrl.startsWith("http://") ||
    configuredBaseUrl.startsWith("https://")
      ? configuredBaseUrl
      : `https://${configuredBaseUrl}`
  ).replace(/\/+$/, "");
}

function ensurePdfFilename(filename) {
  if (!filename || typeof filename !== "string") {
    throw new Error("A valid filename is required for S3 upload");
  }

  const normalizedName = path.basename(filename).trim();

  if (!normalizedName) {
    throw new Error("Filename cannot be empty");
  }

  return normalizedName.toLowerCase().endsWith(".pdf")
    ? normalizedName
    : `${normalizedName}.pdf`;
}

function buildPublishedManuscriptKey(filename) {
  const pdfFilename = ensurePdfFilename(filename);
  return `${PUBLISHED_MANUSCRIPTS_PREFIX}/${pdfFilename}`;
}

function getPublishedManuscriptPublicUrl(filename) {
  const pdfFilename = ensurePdfFilename(filename);
  return `${getPublicSiteBaseUrl()}/pdf/${pdfFilename}`;
}

async function uploadPublishedManuscriptToS3(fileBody, filename) {
  if (!fileBody) {
    throw new Error("A file buffer or stream is required for S3 upload");
  }

  const bucket = getRequiredEnv("AWS_S3_BUCKET");
  const key = buildPublishedManuscriptKey(filename);

  const upload = new Upload({
    client: getS3Client(),
    params: {
      Bucket: bucket,
      Key: key,
      Body: fileBody,
      ContentType: "application/pdf",
    },
  });

  await upload.done();

  return key;
}

async function getPublishedManuscriptFromS3(objectKey, options = {}) {
  const bucket = getRequiredEnv("AWS_S3_BUCKET");
  const normalizedKey = objectKey.replace(/^\/+/, "");
  const response = await getS3Client().send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: normalizedKey,
      Range: options.byteRange || undefined,
    }),
  );

  if (!response.Body) {
    throw new Error(`S3 object body missing for key: ${normalizedKey}`);
  }

  return {
    acceptRanges: response.AcceptRanges || null,
    body: response.Body,
    contentRange: response.ContentRange || null,
    contentLength: response.ContentLength || null,
    contentType: response.ContentType || "application/pdf",
    etag: response.ETag || null,
    statusCode: response.$metadata?.httpStatusCode || 200,
    lastModified: response.LastModified || null,
  };
}

async function deletePublishedManuscriptFromS3(objectKey) {
  const bucket = getRequiredEnv("AWS_S3_BUCKET");
  const normalizedKey = objectKey.replace(/^\/+/, "");

  await getS3Client().send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: normalizedKey,
    }),
  );

  return { success: true, deletedKey: normalizedKey };
}

function getCloudFrontUrl(objectKey) {
  if (!objectKey || typeof objectKey !== "string") {
    throw new Error("A valid S3 object key is required");
  }

  const configuredDomain = getRequiredEnv("CLOUD_FRONT_DOMAIN").trim();
  const cloudFrontDomain = (
    configuredDomain.startsWith("http://") ||
    configuredDomain.startsWith("https://")
      ? configuredDomain
      : `https://${configuredDomain}`
  ).replace(/\/+$/, "");
  const normalizedKey = objectKey.replace(/^\/+/, "");

  return `${cloudFrontDomain}/${normalizedKey}`;
}

function getPublishedManuscriptCloudFrontUrl(objectKey) {
  const normalizedKey = objectKey.replace(/^\/+/, "");
  const publicFilename = normalizedKey.startsWith(
    `${PUBLISHED_MANUSCRIPTS_PREFIX}/`,
  )
    ? normalizedKey.slice(PUBLISHED_MANUSCRIPTS_PREFIX.length + 1)
    : normalizedKey;

  return getCloudFrontUrl(publicFilename);
}

module.exports = {
  PUBLISHED_MANUSCRIPTS_PREFIX,
  buildPublishedManuscriptKey,
  deletePublishedManuscriptFromS3,
  getPublishedManuscriptFromS3,
  uploadPublishedManuscriptToS3,
  getPublishedManuscriptPublicUrl,
  getCloudFrontUrl,
  getPublishedManuscriptCloudFrontUrl,
};
