// manuscriptRoutes.js
const express = require("express");
const router = express.Router();
const manuscriptController = require("../controllers/manuscriptController");
const auth = require("../middleware/auth");
const requireEditor = require("../middleware/requireEditor");
const multer = require("multer");
const os = require("os");


// ---- Multer setup ----
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, os.tmpdir()),
    filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`)
});
const upload = multer({ storage });

const optionalAuth = (req, res, next) => {
    const authorization = req.header("Authorization") || "";
    if (!authorization.startsWith("Bearer ")) {
        return next();
    }

    return auth(req, res, next);
};

// Manuscript routes
router.get("/manuscripts/published", manuscriptController.getPublishedManuscripts);
router.get("/manuscripts/special-issue", manuscriptController.getSpecialIssueManuscripts);
router.get(
	"/manuscripts/my-submissions",
	auth,
	manuscriptController.getMySubmissions
);
	router.get("/manuscripts/most-viewed", manuscriptController.getMostViewedManuscripts);
	router.post("/manuscripts/:manuscriptId/view", manuscriptController.incrementViewCount);
router.get(
	"/manuscripts/:manuscriptId",
	optionalAuth,
	manuscriptController.getManuscriptById
);

router.post("/manuscripts", auth, manuscriptController.createManuscript);
router.post(
	"/manuscripts/preview",
	auth,
	manuscriptController.previewManuscript
);
router.post(
	"/manuscripts/build-pdf",
	auth,
	manuscriptController.buildAndDownloadPdf
);


router.get(
	"/manuscripts/:manuscriptId/notes",
	auth,
	manuscriptController.getManuscriptNotesForAuthor
);
router.delete(
	"/manuscripts/:manuscriptId",
	auth,
	manuscriptController.withdrawManuscript
);
router.put(
	"/manuscripts/:manuscriptId/assign-reviewers",
	auth,
	manuscriptController.assignReviewers
);
router.put(
	"/manuscripts/:manuscriptId/status",
	auth,
	manuscriptController.updateManuscriptStatus
);
router.post(
	"/manuscripts/extract",
	auth,
	manuscriptController.extractManuscriptInfo
);
router.post(
  "/manuscripts/:manuscriptId/upload-notes-word",
  auth,
  manuscriptController.uploadNotesWord
);
router.post(
	"/manuscripts/:manuscriptId/upload-response",
	auth,
	manuscriptController.uploadResponseDoc
);
router.post(
	"/manuscripts/:manuscriptId/build-revision-pdf",
	auth,
	manuscriptController.buildRevisionPdf
);

router.post(
    "/manuscripts/:id/upload-highlighted",
    auth,
    upload.single("highlightedFile"), 
    manuscriptController.uploadHighlightedFile
);

// manuscriptRoutes.js mein
router.post(
    '/manuscripts/:manuscriptId/upload-revision-files',
    auth,
    manuscriptController.uploadRevisionFiles
);


router.post(
    "/manuscript/publish/:manuscriptId",
    auth,
    requireEditor,
    upload.single("pdfFile"), 
    manuscriptController.uploadPublishedPdf
);
// 🔥 NEW: Async manuscript creation with job tracking
router.post("/manuscripts/async", auth, manuscriptController.createManuscriptAsync);

// 🔥 NEW: Get job status
router.get("/jobs/:jobId", auth, manuscriptController.getJobStatus);

router.post('/draft', auth, manuscriptController.saveDraft);
router.put("/manuscripts/:manuscriptId/draft", auth, manuscriptController.updateDraft);
router.delete("/:id", manuscriptController.deleteManuscript);

router.put(
    "/manuscripts/:manuscriptId/update-and-build",
    auth,
    manuscriptController.updateDraftAndBuildPdfAsync
);

// Async version (new)
router.put(
    "/manuscripts/:manuscriptId/update-async",
    auth,
    manuscriptController.updateDraftAndBuildPdfAsync
);
module.exports = router;
