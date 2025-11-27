// manuscriptRoutes.js
const express = require("express");
const router = express.Router();
const manuscriptController = require("../controllers/manuscriptController");
const auth = require("../middleware/auth");
const multer = require("multer");
const os = require("os");

// ---- Multer setup ----
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, os.tmpdir()),
    filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`)
});
const upload = multer({ storage });
// Manuscript routes
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
	"/manuscripts/my-submissions",
	auth,
	manuscriptController.getMySubmissions
);
router.get(
	"/manuscripts/:manuscriptId",
	auth,
	manuscriptController.getManuscriptById
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

module.exports = router;
