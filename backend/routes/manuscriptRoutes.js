// manuscriptRoutes.js
const express = require("express");
const router = express.Router();
const manuscriptController = require("../controllers/manuscriptController");
const auth = require("../middleware/auth");

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

module.exports = router;
