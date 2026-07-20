const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { Readable, Writable } = require("node:stream");
const test = require("node:test");

let manuscriptResult = null;
let manuscriptListResult = [];
let lastFindQuery = null;
let lastS3Key = null;
let s3Error = null;
let findByIdResult = null;
let savedManuscript = null;
let duplicateArticleNumber = false;
let lastUploadedFilename = null;
let uploadedS3ObjectKey = null;
let lastDeletedS3Key = null;
let googleDriveUploadCallCount = 0;
let doiAssignCallCount = 0;
let doiDepositCreateCount = 0;
let saveCallCount = 0;
let doiAssignShouldFail = false;
let doiAssignErrorMessage = "DOI metadata validation failed";
const doiDepositRecords = new Map();

function createManuscript(overrides = {}) {
  return {
    _id: overrides._id || "507f1f77bcf86cd799439011",
    customId: overrides.customId || "JICS-26-003",
    status: overrides.status || "Accepted",
    publishedFileUrl: overrides.publishedFileUrl || "",
    publishedPdfObjectKey: overrides.publishedPdfObjectKey || "",
    async save() {
      saveCallCount += 1;
      savedManuscript = this;
      return this;
    },
    ...overrides,
  };
}

function makeQuery(result, leanResult = result) {
  return {
    select() {
      return this;
    },
    populate() {
      return this;
    },
    sort() {
      return this;
    },
    lean() {
      return Promise.resolve(leanResult);
    },
    then(resolve, reject) {
      return Promise.resolve(result).then(resolve, reject);
    },
    catch(reject) {
      return Promise.resolve(result).catch(reject);
    },
  };
}

const ManuscriptMock = {
  modelName: "Manuscript",
  findOne(query) {
    lastFindQuery = query;
    return makeQuery(manuscriptResult);
  },
  findById() {
    return makeQuery(findByIdResult);
  },
  find(query) {
    lastFindQuery = query;
    return makeQuery(manuscriptListResult);
  },
  exists() {
    return Promise.resolve(duplicateArticleNumber ? { _id: "duplicate" } : null);
  },
};

function buildPublishedManuscriptKey(filename) {
  return `published_manuscripts/${filename}`;
}

const s3ServiceMock = {
  buildPublishedManuscriptKey,
  deletePublishedManuscriptFromS3: async (objectKey) => {
    lastDeletedS3Key = objectKey;
    return { success: true };
  },
  getPublishedManuscriptFromS3: async (objectKey) => {
    lastS3Key = objectKey;
    if (s3Error) throw s3Error;

    const body = Readable.from([Buffer.from("%PDF-1.4\n")]);
    return {
      acceptRanges: "bytes",
      body,
      contentRange: null,
      contentLength: 9,
      contentType: "application/pdf",
      etag: '"test-etag"',
      lastModified: new Date("2026-01-01T00:00:00.000Z"),
    };
  },
  getPublishedManuscriptPublicUrl: (filename) =>
    `https://api.synergyworldpress.com/pdf/${filename}`,
  uploadPublishedManuscriptToS3: async (fileBody, filename) => {
    lastUploadedFilename = filename;
    if (fileBody?.[Symbol.asyncIterator]) {
      for await (const _chunk of fileBody) {
        // Consume the stream before the controller cleans up the temp file.
      }
    }
    return uploadedS3ObjectKey || buildPublishedManuscriptKey(filename);
  },
};

require.cache[require.resolve("../models/Manuscript")] = {
  exports: ManuscriptMock,
};
require.cache[require.resolve("../services/s3Service")] = {
  exports: s3ServiceMock,
};
require.cache[require.resolve("../utils/fileUpload")] = {
  exports: { FileUploadManager: class FileUploadManager {} },
};
require.cache[require.resolve("../utils/sharedDriveUpload")] = {
  exports: { uploadToSharedFolder: async () => ({}) },
};
require.cache[require.resolve("../models/User")] = { exports: {} };
require.cache[require.resolve("../models/Reviewer")] = { exports: {} };
require.cache[require.resolve("../utils/convertDocxToPdfNode")] = {
  exports: { convertDocxToPdfNode: async () => ({}) },
};
require.cache[require.resolve("python-shell")] = {
  exports: { PythonShell: class PythonShell {} },
};
require.cache[require.resolve("../utils/cloudinary")] = {
  exports: { uploadToCloudinary: async () => ({}) },
};
require.cache[require.resolve("../services/googleDriveOAuth")] = {
  exports: {
    uploadFileToDrive: async () => {
      googleDriveUploadCallCount += 1;
      return {
        success: true,
        driveFileId: "drive-file-id",
        webViewLink: "https://drive.example/view",
      };
    },
    deleteFileFromDrive: async () => ({ success: true }),
    downloadDriveFileToTemp: async () => "",
  },
};
require.cache[require.resolve("../utils/sendEmail")] = {
  exports: async () => ({ success: true }),
};
require.cache[require.resolve("pdf-parse")] = {
  exports: async () => ({ text: "" }),
};
require.cache[require.resolve("../utils/jobProcessor")] = {
  exports: {
    createJob: () => ({}),
    getJob: () => ({}),
    updateJob: () => ({}),
    completeJob: () => ({}),
    failJob: () => ({}),
    STATUS: {},
  },
};
require.cache[require.resolve("../services/doiService")] = {
  exports: {
    assignDoiAndQueueDeposit: async (manuscript) => {
      doiAssignCallCount += 1;
      if (doiAssignShouldFail) {
        throw new Error(doiAssignErrorMessage);
      }

      const doi =
        manuscript.doi ||
        `10.12345/jics.${String(
          manuscript.customId || manuscript.custom_id || manuscript._id,
        )
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, ".")
          .replace(/^\.+|\.+$/g, "")}`;
      const depositId =
        doiDepositRecords.get(doi) || `deposit-${doiDepositRecords.size + 1}`;

      if (!doiDepositRecords.has(doi)) {
        doiDepositRecords.set(doi, depositId);
        doiDepositCreateCount += 1;
      }

      manuscript.doi = doi;
      manuscript.doiStatus = "queued";
      manuscript.doiDepositId = depositId;

      return {
        queued: true,
        doi,
        deposit: { _id: depositId, status: "queued" },
      };
    },
  },
};

const {
  getManuscriptById,
  streamPublishedPdf,
  uploadPublishedPdf,
} = require("../controllers/manuscriptController");

class MockResponse extends Writable {
  constructor() {
    super();
    this.statusCode = 200;
    this.headers = {};
    this.chunks = [];
    this.headersSent = false;
    this.jsonBody = undefined;
  }

  _write(chunk, _encoding, callback) {
    this.headersSent = true;
    this.chunks.push(Buffer.from(chunk));
    callback();
  }

  status(statusCode) {
    this.statusCode = statusCode;
    return this;
  }

  setHeader(name, value) {
    this.headers[name.toLowerCase()] = value;
  }

  send(body) {
    this.headersSent = true;
    if (body !== undefined) this.chunks.push(Buffer.from(String(body)));
    this.end();
    return this;
  }

  json(body) {
    this.jsonBody = body;
    return this.send(JSON.stringify(body));
  }

  bodyText() {
    return Buffer.concat(this.chunks).toString("utf8");
  }
}

function makeReq(filename) {
  return {
    params: { filename },
    headers: {},
  };
}

function resetMocks() {
  manuscriptResult = null;
  manuscriptListResult = [];
  lastFindQuery = null;
  lastS3Key = null;
  s3Error = null;
  findByIdResult = null;
  savedManuscript = null;
  duplicateArticleNumber = false;
  lastUploadedFilename = null;
  uploadedS3ObjectKey = null;
  lastDeletedS3Key = null;
  googleDriveUploadCallCount = 0;
  doiAssignCallCount = 0;
  doiDepositCreateCount = 0;
  saveCallCount = 0;
  doiAssignShouldFail = false;
  doiAssignErrorMessage = "DOI metadata validation failed";
  doiDepositRecords.clear();
  delete process.env.PUBLIC_API_BASE_URL;
  delete process.env.API_BASE_URL;
  delete process.env.BACKEND_URL;
  delete process.env.SERVER_URL;
  delete process.env.APP_URL;
  delete process.env.BASE_URL;
  delete process.env.PUBLIC_SITE_BASE_URL;
  delete process.env.PUBLIC_SITE_URL;
  delete process.env.CLIENT_URL;
  delete process.env.FRONTEND_URL;
}

function makeUploadFixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "swp-pdf-test-"));
  const filePath = path.join(dir, "published.pdf");
  fs.writeFileSync(filePath, "%PDF-1.4\n");
  return filePath;
}

function makePublishReq(body = {}, manuscriptId = "507f1f77bcf86cd799439011") {
  return {
    params: { manuscriptId },
    body,
    file: { path: makeUploadFixture() },
  };
}

function createValidPublicationBody(overrides = {}) {
  return {
    issueVolume: "1",
    issueNumber: "1",
    issueYear: "2026",
    issueTitle: "Volume 1 Issue 1",
    section: "Research Article",
    separateIssue: "false",
    ...overrides,
  };
}

test("streams a valid published PDF by stored object key", async () => {
  resetMocks();
  manuscriptResult = {
    _id: "manuscript-id",
    customId: "JICS-26-003",
    status: "Published",
    publishedFileUrl:
      "https://api.synergyworldpress.com/pdf/published_JICS-26-003_1779338646857.pdf",
    publishedPdfObjectKey:
      "published_manuscripts/published_JICS-26-003_1779338646857.pdf",
  };

  const res = new MockResponse();
  await streamPublishedPdf(
    makeReq("published_JICS-26-003_1779338646857.pdf"),
    res,
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.headers["content-type"], "application/pdf");
  assert.equal(
    lastS3Key,
    "published_manuscripts/published_JICS-26-003_1779338646857.pdf",
  );
  assert.equal(res.bodyText(), "%PDF-1.4\n");
  assert.equal(lastFindQuery.status, "Published");
});

test("streams an existing legacy manuscript using publishedFileUrl", async () => {
  resetMocks();
  manuscriptResult = {
    _id: "legacy-id",
    customId: "JICS-legacy",
    status: "Published",
    publishedFileUrl:
      "https://synergyworldpress.com/pdf/published_JICS-legacy.pdf",
    publishedPdfObjectKey: "",
  };

  const res = new MockResponse();
  await streamPublishedPdf(makeReq("published_JICS-legacy.pdf"), res);

  assert.equal(res.statusCode, 200);
  assert.equal(lastS3Key, "published_manuscripts/published_JICS-legacy.pdf");
  assert.ok(
    lastFindQuery.$or.some((clause) =>
      clause.publishedFileUrl?.$in?.includes(
        "https://synergyworldpress.com/pdf/published_JICS-legacy.pdf",
      ),
    ),
  );
});

test("returns 404 when no manuscript matches the public PDF filename", async () => {
  resetMocks();

  const res = new MockResponse();
  await streamPublishedPdf(makeReq("missing.pdf"), res);

  assert.equal(res.statusCode, 404);
  assert.equal(res.bodyText(), "PDF not found");
  assert.equal(lastS3Key, null);
});

test("requires a published manuscript", async () => {
  resetMocks();

  const res = new MockResponse();
  await streamPublishedPdf(makeReq("unpublished.pdf"), res);

  assert.equal(res.statusCode, 404);
  assert.equal(lastFindQuery.status, "Published");
  assert.equal(lastS3Key, null);
});

test("returns 404 when the manuscript has no resolvable PDF key", async () => {
  resetMocks();
  manuscriptResult = {
    _id: "broken-id",
    customId: "JICS-broken",
    status: "Published",
    publishedFileUrl: "",
    publishedPdfObjectKey: "",
  };

  const res = new MockResponse();
  await streamPublishedPdf(makeReq("broken.pdf"), res);

  assert.equal(res.statusCode, 404);
  assert.equal(res.bodyText(), "PDF not found");
  assert.equal(lastS3Key, null);
});

test("returns 404 when S3 reports that the object is missing", async () => {
  resetMocks();
  manuscriptResult = {
    _id: "missing-s3-id",
    customId: "JICS-missing-s3",
    status: "Published",
    publishedFileUrl:
      "https://api.synergyworldpress.com/pdf/published_JICS-missing-s3.pdf",
    publishedPdfObjectKey:
      "published_manuscripts/published_JICS-missing-s3.pdf",
  };
  s3Error = Object.assign(new Error("No such key"), {
    name: "NoSuchKey",
    $metadata: { httpStatusCode: 404 },
  });

  const res = new MockResponse();
  await streamPublishedPdf(makeReq("published_JICS-missing-s3.pdf"), res);

  assert.equal(res.statusCode, 404);
  assert.equal(res.bodyText(), "PDF not found");
});

test("publishes article metadata with volume, issue, and page range", async () => {
  resetMocks();
  findByIdResult = createManuscript({ customId: "JICS-26-010" });

  const res = new MockResponse();
  await uploadPublishedPdf(
    makePublishReq(createValidPublicationBody({
      pageStart: "1",
      pageEnd: "10",
      articleNumber: "JICS-26-TEST",
      pdfAuthors: JSON.stringify(["Ada Lovelace"]),
      pdfCorrespondingAuthor: "Ada Lovelace",
    })),
    res,
  );

  assert.equal(res.statusCode, 200);
  assert.equal(savedManuscript.issueVolume, 1);
  assert.equal(savedManuscript.issueNumber, 1);
  assert.equal(savedManuscript.issueYear, 2026);
  assert.equal(savedManuscript.issueTitle, "Volume 1 Issue 1");
  assert.equal(savedManuscript.section, "Research Article");
  assert.equal(savedManuscript.pageStart, 1);
  assert.equal(savedManuscript.pageEnd, 10);
  assert.equal(savedManuscript.articleNumber, "");
  assert.equal(savedManuscript.status, "Published");
  assert.equal(doiAssignCallCount, 1);
  assert.equal(doiDepositCreateCount, 1);
  assert.equal(saveCallCount, 2);
  assert.equal(savedManuscript.doi, "10.12345/jics.jics.26.010");
  assert.equal(savedManuscript.doiDepositId, "deposit-1");
  assert.equal(savedManuscript.doiStatus, "queued");
  assert.equal(res.jsonBody.data.doi, "10.12345/jics.jics.26.010");
  assert.equal(res.jsonBody.data.doiDepositId, "deposit-1");
  assert.equal(res.jsonBody.data.doiStatus, "queued");
  assert.equal(res.jsonBody.data.doiQueued, true);
  assert.equal(res.jsonBody.data.doiQueueError, null);
});

test("publishes article without pages using stable customId articleNumber", async () => {
  resetMocks();
  findByIdResult = createManuscript({ customId: "JICS-26-011" });

  const res = new MockResponse();
  await uploadPublishedPdf(
    makePublishReq(createValidPublicationBody({
      separateIssue: "true",
      pageStart: "",
      pageEnd: "",
      articleNumber: "",
      pdfAuthors: JSON.stringify(["Grace Hopper"]),
      pdfCorrespondingAuthor: "Grace Hopper",
    })),
    res,
  );

  assert.equal(res.statusCode, 200);
  assert.equal(savedManuscript.pageStart, null);
  assert.equal(savedManuscript.pageEnd, null);
  assert.equal(savedManuscript.articleNumber, "JICS-26-011");
  assert.equal(res.jsonBody.data.doiQueued, true);
});

test("preserves special issue publication flow", async () => {
  resetMocks();
  findByIdResult = createManuscript({ customId: "JICS-26-S01" });

  const res = new MockResponse();
  await uploadPublishedPdf(
    makePublishReq({
      separateIssue: "true",
      issueYear: "2026",
      articleNumber: "JICS-26-S01",
      pdfAuthors: JSON.stringify(["Katherine Johnson"]),
      pdfCorrespondingAuthor: "Katherine Johnson",
    }),
    res,
  );

  assert.equal(res.statusCode, 200);
  assert.equal(savedManuscript.separateIssue, true);
  assert.equal(savedManuscript.articleNumber, "JICS-26-S01");
  assert.equal(res.jsonBody.data.doiQueued, true);
});

test("rejects invalid publication page range", async () => {
  resetMocks();
  findByIdResult = createManuscript({ customId: "JICS-26-012" });

  const res = new MockResponse();
  await uploadPublishedPdf(
    makePublishReq(createValidPublicationBody({
      pageStart: "20",
      pageEnd: "10",
      articleNumber: "JICS-26-TEST",
      pdfAuthors: JSON.stringify(["Alan Turing"]),
      pdfCorrespondingAuthor: "Alan Turing",
    })),
    res,
  );

  assert.equal(res.statusCode, 400);
  assert.equal(res.jsonBody.message, "pageEnd cannot be lower than pageStart");
  assert.equal(savedManuscript, null);
  assert.equal(lastUploadedFilename, null);
  assert.equal(googleDriveUploadCallCount, 0);
});

test("stores the exact S3 object key returned by upload", async () => {
  resetMocks();
  findByIdResult = createManuscript({ customId: "JICS-26-013" });
  uploadedS3ObjectKey = "mock-bucket-prefix/exact-object-key-from-s3.pdf";

  const res = new MockResponse();
  await uploadPublishedPdf(
    makePublishReq(createValidPublicationBody({
      pageStart: "1",
      pageEnd: "10",
      articleNumber: "JICS-26-013",
      pdfAuthors: JSON.stringify(["Mary Jackson"]),
      pdfCorrespondingAuthor: "Mary Jackson",
    })),
    res,
  );

  assert.equal(res.statusCode, 200);
  assert.equal(savedManuscript.publishedPdfObjectKey, uploadedS3ObjectKey);
  assert.equal(res.jsonBody.data.publishedPdfObjectKey, uploadedS3ObjectKey);
});

test("publishing reuses an existing DOI deposit and preserves existing DOI", async () => {
  resetMocks();
  const manuscript = createManuscript({
    customId: "JICS-26-016",
    doi: "10.12345/existing.doi",
    doiStatus: "queued",
    doiDepositId: "existing-deposit",
  });
  findByIdResult = manuscript;
  doiDepositRecords.set("10.12345/existing.doi", "existing-deposit");

  const firstRes = new MockResponse();
  await uploadPublishedPdf(
    makePublishReq(createValidPublicationBody({
      pageStart: "1",
      pageEnd: "5",
      pdfAuthors: JSON.stringify(["Emmy Noether"]),
    })),
    firstRes,
  );

  const secondRes = new MockResponse();
  await uploadPublishedPdf(
    makePublishReq(createValidPublicationBody({
      pageStart: "1",
      pageEnd: "5",
      pdfAuthors: JSON.stringify(["Emmy Noether"]),
    })),
    secondRes,
  );

  assert.equal(firstRes.statusCode, 200);
  assert.equal(secondRes.statusCode, 200);
  assert.equal(doiAssignCallCount, 2);
  assert.equal(doiDepositCreateCount, 0);
  assert.equal(savedManuscript.doi, "10.12345/existing.doi");
  assert.equal(savedManuscript.doiDepositId, "existing-deposit");
  assert.equal(secondRes.jsonBody.data.doi, "10.12345/existing.doi");
  assert.equal(secondRes.jsonBody.data.doiDepositId, "existing-deposit");
  assert.equal(secondRes.jsonBody.data.doiQueued, true);
});

test("DOI queue failure does not fail publication or roll back uploaded PDF", async () => {
  resetMocks();
  findByIdResult = createManuscript({ customId: "JICS-26-017" });
  doiAssignShouldFail = true;
  doiAssignErrorMessage = "Crossref submission is disabled";

  const res = new MockResponse();
  await uploadPublishedPdf(
    makePublishReq(createValidPublicationBody({
      pageStart: "1",
      pageEnd: "8",
      pdfAuthors: JSON.stringify(["Rosalind Franklin"]),
    })),
    res,
  );

  assert.equal(res.statusCode, 200);
  assert.equal(savedManuscript.status, "Published");
  assert.ok(savedManuscript.publishedFileUrl);
  assert.ok(savedManuscript.publishedPdfObjectKey);
  assert.equal(lastDeletedS3Key, null);
  assert.equal(doiAssignCallCount, 1);
  assert.equal(doiDepositCreateCount, 0);
  assert.equal(res.jsonBody.data.doiQueued, false);
  assert.equal(
    res.jsonBody.data.doiQueueError,
    "Crossref submission is disabled",
  );
  assert.equal(res.jsonBody.data.doi, null);
  assert.equal(res.jsonBody.data.doiStatus, "not_assigned");
  assert.equal(res.jsonBody.data.doiDepositId, null);
});

test("server-generated Scholar page outputs metadata only when values exist", async () => {
  resetMocks();
  process.env.PUBLIC_API_BASE_URL = "https://api.synergyworldpress.com";
  process.env.PUBLIC_SITE_BASE_URL = "http://localhost:3000";

  const article = {
    _id: "507f1f77bcf86cd799439099",
    customId: "JICS-26-014",
    title: "Scholar Metadata Test",
    abstract: "Testing Scholar metadata.",
    keywords: "metadata, scholar",
    status: "Published",
    issueVolume: 7,
    issueNumber: 3,
    pageStart: 101,
    pageEnd: 118,
    doi: "10.0000/jics.test",
    publishedAt: new Date("2026-06-01T00:00:00.000Z"),
    publishedPdfObjectKey: "published_manuscripts/published_JICS-26-014.pdf",
    pdfAuthors: ["Dorothy Vaughan"],
  };
  manuscriptResult = { status: "Published", toObject: () => article };

  const router = require("../routes/scholarRoutes");
  const layer = router.stack.find((item) => item.route?.path === "/article/:id");
  const handler = layer.route.stack[0].handle;
  const res = new MockResponse();

  await handler({ params: { id: "JICS-26-014" }, headers: {} }, res);
  const html = res.bodyText();

  assert.match(html, /citation_volume" content="7"/);
  assert.match(html, /citation_issue" content="3"/);
  assert.match(html, /citation_firstpage" content="101"/);
  assert.match(html, /citation_lastpage" content="118"/);
  assert.match(html, /citation_doi" content="10\.0000\/jics\.test"/);
  assert.match(
    html,
    /citation_pdf_url" content="https:\/\/api\.synergyworldpress\.com\/scholar\/article\/JICS-26-014\/fulltext\.pdf"/,
  );
  assert.match(
    html,
    /citation_public_url" content="http:\/\/localhost:3000\/journal\/jics\/articles\/JICS-26-014"/,
  );
  assert.match(
    html,
    /<link rel="canonical" href="https:\/\/api\.synergyworldpress\.com\/scholar\/article\/JICS-26-014">/,
  );
  assert.doesNotMatch(html, /Unknown Author/);

  const articleWithoutOptionalMetadata = {
    ...article,
    customId: "JICS-26-015",
    issueVolume: null,
    issueNumber: null,
    pageStart: null,
    pageEnd: null,
    doi: undefined,
  };
  manuscriptResult = {
    status: "Published",
    toObject: () => articleWithoutOptionalMetadata,
  };
  const resWithoutOptionalMetadata = new MockResponse();

  await handler(
    { params: { id: "JICS-26-015" }, headers: {} },
    resWithoutOptionalMetadata,
  );
  const htmlWithoutOptionalMetadata = resWithoutOptionalMetadata.bodyText();

  assert.doesNotMatch(htmlWithoutOptionalMetadata, /citation_volume"/);
  assert.doesNotMatch(htmlWithoutOptionalMetadata, /citation_issue"/);
  assert.doesNotMatch(htmlWithoutOptionalMetadata, /citation_firstpage"/);
  assert.doesNotMatch(htmlWithoutOptionalMetadata, /citation_lastpage"/);
  assert.doesNotMatch(htmlWithoutOptionalMetadata, /citation_doi"/);
});

test("Scholar page uses the forwarded public host instead of a localhost API base", async () => {
  resetMocks();
  process.env.API_BASE_URL = "http://localhost:5000";
  process.env.PUBLIC_SITE_BASE_URL = "https://synergyworldpress.com";

  const article = {
    _id: "507f1f77bcf86cd799439099",
    customId: "JICS-26-003",
    title: "Scholar Proxy Base URL Test",
    abstract: "Testing reverse proxy Scholar URLs.",
    status: "Published",
    publishedAt: new Date("2026-06-01T00:00:00.000Z"),
    publishedPdfObjectKey: "published_manuscripts/published_JICS-26-003.pdf",
    pdfAuthors: ["Grace Hopper"],
  };
  manuscriptResult = { status: "Published", toObject: () => article };

  const router = require("../routes/scholarRoutes");
  const layer = router.stack.find((item) => item.route?.path === "/article/:id");
  const handler = layer.route.stack[0].handle;
  const res = new MockResponse();

  await handler(
    {
      params: { id: "JICS-26-003" },
      headers: {
        "x-forwarded-proto": "https",
        "x-forwarded-host": "api.synergyworldpress.com",
        host: "localhost:5000",
      },
      protocol: "http",
    },
    res,
  );

  const html = res.bodyText();

  assert.match(
    html,
    /citation_pdf_url" content="https:\/\/api\.synergyworldpress\.com\/scholar\/article\/JICS-26-003\/fulltext\.pdf"/,
  );
  assert.match(
    html,
    /<link rel="canonical" href="https:\/\/api\.synergyworldpress\.com\/scholar\/article\/JICS-26-003">/,
  );
  assert.doesNotMatch(html, /localhost:5000/);
});

test("Scholar page falls back to the request host when no public API base env is set", async () => {
  resetMocks();
  process.env.PUBLIC_SITE_BASE_URL = "https://synergyworldpress.com";

  const article = {
    _id: "507f1f77bcf86cd799439099",
    custom_id: "JICS-26-099",
    title: "Scholar Request Host Fallback Test",
    abstract: "Testing request host fallback.",
    status: "Published",
    publishedAt: new Date("2026-06-01T00:00:00.000Z"),
    publishedPdfObjectKey: "published_manuscripts/published_JICS-26-099.pdf",
    pdfAuthors: ["Katherine Johnson"],
  };
  manuscriptResult = { status: "Published", toObject: () => article };

  const router = require("../routes/scholarRoutes");
  const layer = router.stack.find((item) => item.route?.path === "/article/:id");
  const handler = layer.route.stack[0].handle;
  const res = new MockResponse();

  await handler(
    {
      params: { id: "JICS-26-099" },
      headers: { host: "localhost:5000" },
      protocol: "http",
    },
    res,
  );

  const html = res.bodyText();

  assert.match(
    html,
    /citation_pdf_url" content="http:\/\/localhost:5000\/scholar\/article\/JICS-26-099\/fulltext\.pdf"/,
  );
  assert.match(
    html,
    /<link rel="canonical" href="http:\/\/localhost:5000\/scholar\/article\/JICS-26-099">/,
  );
});

test("Scholar fulltext PDF route streams the article PDF from S3", async () => {
  resetMocks();

  const article = {
    _id: "507f1f77bcf86cd799439099",
    customId: "JICS-26-014",
    title: "Scholar Metadata Test",
    status: "Published",
    publishedPdfObjectKey: "published_manuscripts/published_JICS-26-014.pdf",
  };
  manuscriptResult = article;

  const router = require("../routes/scholarRoutes");
  const layer = router.stack.find(
    (item) => item.route?.path === "/article/:id/fulltext.pdf",
  );
  const handler = layer.route.stack[0].handle;
  const res = new MockResponse();

  await handler({ params: { id: "JICS-26-014" }, headers: {} }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(
    lastS3Key,
    "published_manuscripts/published_JICS-26-014.pdf",
  );
  assert.equal(res.headers["content-type"], "application/pdf");
  assert.match(
    res.headers["content-disposition"],
    /inline; filename="published_JICS-26-014\.pdf"/,
  );
  assert.equal(res.bodyText(), "%PDF-1.4\n");
  assert.equal(lastFindQuery.status, "Published");
  assert.deepEqual(lastFindQuery.$or, [
    { customId: "JICS-26-014" },
    { custom_id: "JICS-26-014" },
  ]);
});

test("Scholar page rejects missing required citation metadata", async () => {
  resetMocks();

  const article = {
    _id: "507f1f77bcf86cd799439099",
    customId: "JICS-26-016",
    title: "No Author Test",
    status: "Published",
    publishedAt: new Date("2026-06-01T00:00:00.000Z"),
    pdfAuthors: [],
    authors: [],
  };
  manuscriptResult = { status: "Published", toObject: () => article };

  const router = require("../routes/scholarRoutes");
  const layer = router.stack.find((item) => item.route?.path === "/article/:id");
  const handler = layer.route.stack[0].handle;
  const res = new MockResponse();

  await handler({ params: { id: "JICS-26-016" } }, res);

  assert.equal(res.statusCode, 422);
  assert.doesNotMatch(res.bodyText(), /citation_author/);
});

test("sitemap article lastmod uses updatedAt or publishedAt instead of today for every article", async () => {
  resetMocks();
  process.env.API_BASE_URL = "https://api.synergyworldpress.com";
  manuscriptListResult = [
    {
      _id: "507f1f77bcf86cd799439091",
      customId: "JICS-26-003",
      updatedAt: new Date("2026-06-15T10:00:00.000Z"),
      publishedAt: new Date("2026-06-01T00:00:00.000Z"),
    },
    {
      _id: "507f1f77bcf86cd799439092",
      custom_id: "JICS-26-S01",
      updatedAt: null,
      publishedAt: new Date("2026-05-20T00:00:00.000Z"),
    },
  ];

  delete require.cache[require.resolve("../routes/sitemapRoutes")];
  const router = require("../routes/sitemapRoutes");
  const layer = router.stack.find((item) => item.route?.path === "/sitemap.xml");
  const handler = layer.route.stack[0].handle;
  const res = new MockResponse();

  await handler({ headers: {} }, res);
  const xml = res.bodyText();

  assert.equal(res.statusCode, 200);
  assert.match(
    xml,
    /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/,
  );
  assert.match(
    xml,
    /<loc>https:\/\/api\.synergyworldpress\.com\/scholar\/article\/JICS-26-003<\/loc>\s*<lastmod>2026-06-15<\/lastmod>/,
  );
  assert.match(
    xml,
    /<loc>https:\/\/api\.synergyworldpress\.com\/scholar\/article\/JICS-26-S01<\/loc>\s*<lastmod>2026-05-20<\/lastmod>/,
  );
});

test("robots.txt source keeps a single Scholar allow set without duplicate lines", async () => {
  resetMocks();

  const serverSource = fs.readFileSync(
    path.join(__dirname, "../server.js"),
    "utf8",
  );

  assert.equal(
    (serverSource.match(/^Allow: \/scholar\/$/gm) || []).length,
    1,
  );
  assert.equal(
    (serverSource.match(/^Allow: \/scholar\/article\/$/gm) || []).length,
    1,
  );
  assert.equal(
    (serverSource.match(/^Allow: \/scholar\/articles-listing$/gm) || []).length,
    1,
  );
  assert.equal(
    (serverSource.match(/^Allow: \/sitemap\.xml$/gm) || []).length,
    1,
  );
  assert.doesNotMatch(serverSource, /User-agent:\s+Googlebot/);
});

test("public manuscript lookup hides unpublished articles from anonymous requests", async () => {
  resetMocks();

  const unpublished = createManuscript({
    status: "Accepted",
    title: "Accepted Draft",
    toObject() {
      return {
        _id: this._id,
        customId: this.customId,
        status: this.status,
        title: this.title,
      };
    },
  });
  manuscriptResult = unpublished;
  const anonymousRes = new MockResponse();

  await getManuscriptById(
    { params: { manuscriptId: "JICS-26-003" } },
    anonymousRes,
  );

  assert.equal(anonymousRes.statusCode, 404);
  assert.equal(anonymousRes.jsonBody.success, false);

  const editorRes = new MockResponse();
  await getManuscriptById(
    {
      params: { manuscriptId: "JICS-26-003" },
      user: { roles: ["editor"] },
    },
    editorRes,
  );

  assert.equal(editorRes.statusCode, 200);
  assert.equal(editorRes.jsonBody.success, true);
  assert.equal(editorRes.jsonBody.data.status, "Accepted");
});
