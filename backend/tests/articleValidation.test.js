const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

// Mocking Manuscript model before requiring manuscriptController
const Manuscript = require("../models/Manuscript");

require.cache[require.resolve("../models/User")] = { exports: {} };
require.cache[require.resolve("../models/Reviewer")] = { exports: {} };
require.cache[require.resolve("../services/s3Service")] = {
  exports: {
    buildPublishedManuscriptKey: (filename) => `published_manuscripts/${filename}`,
    deletePublishedManuscriptFromS3: async () => ({ success: true }),
    getPublishedManuscriptFromS3: async () => {
      throw new Error("S3 should not be used by article validation tests");
    },
    getPublishedManuscriptPublicUrl: (filename) =>
      `https://api.synergyworldpress.com/pdf/${filename}`,
    uploadPublishedManuscriptToS3: async () => {
      throw new Error("S3 should not be used by article validation tests");
    },
  },
};
require.cache[require.resolve("../services/googleDriveOAuth")] = {
  exports: {
    uploadFileToDrive: async () => {
      throw new Error("Google Drive should not be used by article validation tests");
    },
    deleteFileFromDrive: async () => ({ success: true }),
    downloadDriveFileToTemp: async () => "",
  },
};
require.cache[require.resolve("../utils/fileUpload")] = {
  exports: { FileUploadManager: class FileUploadManager {} },
};
require.cache[require.resolve("../utils/sharedDriveUpload")] = {
  exports: { uploadToSharedFolder: async () => ({}) },
};
require.cache[require.resolve("../utils/convertDocxToPdfNode")] = {
  exports: { convertDocxToPdfNode: async () => ({}) },
};
require.cache[require.resolve("python-shell")] = {
  exports: { PythonShell: class PythonShell {} },
};
require.cache[require.resolve("../utils/cloudinary")] = {
  exports: { uploadToCloudinary: async () => ({}) },
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
    assignDoiAndQueueDeposit: async () => ({ queued: false }),
  },
};

const { buildPublicationMetadata } = require("../controllers/manuscriptController");

// Mock helper to intercept Manuscript.find calls
let mockFindResults = [];
const originalFind = Manuscript.find;
Manuscript.find = function (query) {
  return {
    select(fields) {
      return Promise.resolve(mockFindResults);
    }
  };
};

// Replicated Frontend Sorting Functions for testing (since they are frontend-isolated ESM)
const getArticleIssueDate = (article) => {
  const rawDate = article?.publishedAt || article?.submissionDate || article?.updatedAt;
  if (!rawDate) return null;

  const date = new Date(rawDate);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getIssueWindow = (date = new Date()) => {
  const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const ISSUE_START_YEAR = 2026;
  const year = date.getFullYear();
  const startMonth = Math.floor(date.getMonth() / 4) * 4;
  const endMonth = startMonth + 3;
  const issueNumber = Math.floor(startMonth / 4) + 1;
  const volume = Math.max(1, year - ISSUE_START_YEAR + 1);
  const rangeLabel = `${MONTH_NAMES[startMonth]}-${MONTH_NAMES[endMonth]} ${year}`;

  return {
    startDate: new Date(year, startMonth, 1),
    endDate: new Date(year, startMonth + 4, 1),
    label: `Vol. ${volume}, Issue ${issueNumber} • ${rangeLabel}`,
    rangeLabel,
  };
};

const getPageStart = (article) => {
  if (article && article.pageStart !== null && article.pageStart !== undefined) {
    const page = Number(article.pageStart);
    if (!Number.isNaN(page)) return page;
  }
  return null;
};

const getIssueKey = (article) => {
  if (
    article.issueYear != null &&
    article.issueVolume != null &&
    article.issueNumber != null
  ) {
    return `year-${article.issueYear}-volume-${article.issueVolume}-issue-${article.issueNumber}`;
  }

  const date = getArticleIssueDate(article);
  if (date) {
    return `legacy-${getIssueWindow(date).label}`;
  }

  return "unassigned-issue";
};

const sortArticles = (articles, archive) => {
  if (archive) {
    const initialSorted = [...articles].sort((a, b) => {
      return (getArticleIssueDate(b)?.getTime() || 0) - (getArticleIssueDate(a)?.getTime() || 0);
    });

    const issueGroups = {};
    const issueOrder = [];

    for (const article of initialSorted) {
      const key = getIssueKey(article);
      if (!issueGroups[key]) {
        issueGroups[key] = [];
        issueOrder.push(key);
      }
      issueGroups[key].push(article);
    }

    const sortedResult = [];
    for (const key of issueOrder) {
      const group = issueGroups[key];
      const sortedGroup = [...group].map((item, index) => ({ item, index }))
        .sort((a, b) => {
          const pageA = getPageStart(a.item);
          const pageB = getPageStart(b.item);

          if (pageA !== null && pageB !== null) {
            if (pageA !== pageB) return pageA - pageB;
          } else if (pageA !== null && pageB === null) {
            return -1;
          } else if (pageA === null && pageB !== null) {
            return 1;
          }
          return a.index - b.index;
        })
        .map(x => x.item);

      sortedResult.push(...sortedGroup);
    }

    return sortedResult;
  }

  // Current Issue Sorting
  return [...articles].sort((a, b) => {
    const aPage = a.pageStart;
    const bPage = b.pageStart;

    if (aPage != null && bPage != null) return aPage - bPage;
    if (aPage != null && bPage == null) return -1;
    if (aPage == null && bPage != null) return 1;
    return (getArticleIssueDate(b)?.getTime() || 0) - (getArticleIssueDate(a)?.getTime() || 0);
  });
};

// ----------------------------------------------------
// RUNNING THE 10 SPECIFIED TEST CASES
// ----------------------------------------------------

test("1. First article starts on page 1 — accepted", async () => {
  mockFindResults = []; // No existing articles
  const mockManuscript = { _id: "m1", customId: "JICS-26-001" };
  const metadata = await buildPublicationMetadata({
    issueYear: "2026",
    issueVolume: "1",
    issueNumber: "1",
    pageStart: "1",
    pageEnd: "10",
    separateIssue: false
  }, mockManuscript);

  assert.equal(metadata.pageStart, 1);
  assert.equal(metadata.pageEnd, 10);
});

test("2. First article starts on page 2 (no existing articles) — rejected", async () => {
  mockFindResults = []; // No existing articles
  const mockManuscript = { _id: "m1", customId: "JICS-26-001" };
  
  await assert.rejects(
    async () => {
      await buildPublicationMetadata({
        issueYear: "2026",
        issueVolume: "1",
        issueNumber: "1",
        pageStart: "2",
        pageEnd: "10",
        separateIssue: false
      }, mockManuscript);
    },
    /The first article in this issue must start on page 1/
  );
});

test("3. Next article starts at previous pageEnd + 1 — accepted", async () => {
  mockFindResults = [{ pageStart: 1, pageEnd: 13 }]; // Existing ends at 13
  const mockManuscript = { _id: "m2", customId: "JICS-26-002" };
  
  const metadata = await buildPublicationMetadata({
    issueYear: "2026",
    issueVolume: "1",
    issueNumber: "1",
    pageStart: "14",
    pageEnd: "25",
    separateIssue: false
  }, mockManuscript);

  assert.equal(metadata.pageStart, 14);
  assert.equal(metadata.pageEnd, 25);
});

test("4. Page ranges overlap — rejected", async () => {
  mockFindResults = [{ pageStart: 1, pageEnd: 13 }]; // Existing ends at 13
  const mockManuscript = { _id: "m2", customId: "JICS-26-002" };
  
  await assert.rejects(
    async () => {
      await buildPublicationMetadata({
        issueYear: "2026",
        issueVolume: "1",
        issueNumber: "1",
        pageStart: "12", // Overlaps (starts before 14)
        pageEnd: "25",
        separateIssue: false
      }, mockManuscript);
    },
    /The next article in Volume 1, Issue 1 must start on page 14/
  );
});

test("5. A page gap exists — rejected", async () => {
  mockFindResults = [{ pageStart: 1, pageEnd: 13 }]; // Existing ends at 13
  const mockManuscript = { _id: "m2", customId: "JICS-26-002" };
  
  await assert.rejects(
    async () => {
      await buildPublicationMetadata({
        issueYear: "2026",
        issueVolume: "1",
        issueNumber: "1",
        pageStart: "15", // Gap (should start at 14)
        pageEnd: "25",
        separateIssue: false
      }, mockManuscript);
    },
    /The next article in Volume 1, Issue 1 must start on page 14/
  );
});

test("6. pageEnd is smaller than pageStart — rejected", async () => {
  mockFindResults = [];
  const mockManuscript = { _id: "m1", customId: "JICS-26-001" };
  
  await assert.rejects(
    async () => {
      await buildPublicationMetadata({
        issueYear: "2026",
        issueVolume: "1",
        issueNumber: "1",
        pageStart: "10",
        pageEnd: "5", // Valid positive integer, but lower than pageStart
        separateIssue: false
      }, mockManuscript);
    },
    /pageEnd cannot be lower than pageStart/
  );
});

test("7. Archive articles are returned in a random order but displayed by pageStart", async () => {
  const articles = [
    { title: "Art 3", pageStart: 91, pageEnd: 101, issueYear: 2025, issueVolume: 1, issueNumber: 1, publishedAt: "2025-06-01" },
    { title: "Art 1", pageStart: 1, pageEnd: 82, issueYear: 2025, issueVolume: 1, issueNumber: 1, publishedAt: "2025-06-01" },
    { title: "Art 2", pageStart: 83, pageEnd: 90, issueYear: 2025, issueVolume: 1, issueNumber: 1, publishedAt: "2025-06-01" },
  ];

  const sorted = sortArticles(articles, true);
  
  assert.equal(sorted[0].title, "Art 1");
  assert.equal(sorted[1].title, "Art 2");
  assert.equal(sorted[2].title, "Art 3");
});

test("8. Multiple issues from the same year remain separated", async () => {
  const articles = [
    { title: "Issue 2 - Art 2", pageStart: 15, pageEnd: 20, issueYear: 2025, issueVolume: 1, issueNumber: 2, publishedAt: "2025-06-01" },
    { title: "Issue 1 - Art 2", pageStart: 10, pageEnd: 15, issueYear: 2025, issueVolume: 1, issueNumber: 1, publishedAt: "2025-02-01" },
    { title: "Issue 2 - Art 1", pageStart: 1, pageEnd: 14, issueYear: 2025, issueVolume: 1, issueNumber: 2, publishedAt: "2025-06-01" },
    { title: "Issue 1 - Art 1", pageStart: 1, pageEnd: 9, issueYear: 2025, issueVolume: 1, issueNumber: 1, publishedAt: "2025-02-01" },
  ];

  const sorted = sortArticles(articles, true);

  // Group 1 (Issue 2 - June 2025) should appear before Group 2 (Issue 1 - Feb 2025) due to descending pub dates.
  // Within Issue 2, Art 1 should start before Art 2.
  // Within Issue 1, Art 1 should start before Art 2.
  assert.equal(sorted[0].title, "Issue 2 - Art 1");
  assert.equal(sorted[1].title, "Issue 2 - Art 2");
  assert.equal(sorted[2].title, "Issue 1 - Art 1");
  assert.equal(sorted[3].title, "Issue 1 - Art 2");
});

test("9. Current Issue behaviour remains unaffected", async () => {
  const articles = [
    { title: "Current Art 2", pageStart: 15, pageEnd: 20, publishedAt: "2026-06-01" },
    { title: "Current Art 1", pageStart: 1, pageEnd: 14, publishedAt: "2026-06-01" },
  ];

  // For archive = false, sortArticles does not group by issue key, just sorts by pageStart ascending.
  const sorted = sortArticles(articles, false);
  
  assert.equal(sorted[0].title, "Current Art 1");
  assert.equal(sorted[1].title, "Current Art 2");
});

test("10. Articles with legacy missing page numbers appear last", async () => {
  const articles = [
    { title: "Art Null", pageStart: null, pageEnd: null, issueYear: 2025, issueVolume: 1, issueNumber: 1, publishedAt: "2025-06-01" },
    { title: "Art 2", pageStart: 11, pageEnd: 20, issueYear: 2025, issueVolume: 1, issueNumber: 1, publishedAt: "2025-06-01" },
    { title: "Art 1", pageStart: 1, pageEnd: 10, issueYear: 2025, issueVolume: 1, issueNumber: 1, publishedAt: "2025-06-01" },
  ];

  const sorted = sortArticles(articles, true);

  assert.equal(sorted[0].title, "Art 1");
  assert.equal(sorted[1].title, "Art 2");
  assert.equal(sorted[2].title, "Art Null");
});

// Restore original Manuscript.find
test.after(() => {
  Manuscript.find = originalFind;
});
