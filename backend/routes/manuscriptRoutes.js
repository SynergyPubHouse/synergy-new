// manuscriptRoutes.js
const express = require("express");
const router = express.Router();
const manuscriptController = require("../controllers/manuscriptController");
const auth = require("../middleware/auth");

// Routes for manuscript submission (accessible to both users and editors)
router.post("/manuscripts", auth, manuscriptController.createManuscript);
router.post("/manuscripts/preview", manuscriptController.previewManuscript);
router.get(
	"/manuscripts/my-submissions",
	auth,
	manuscriptController.getMySubmissions
);

// Add withdrawal route
router.delete(
	"/manuscripts/:manuscriptId",
	auth,
	manuscriptController.withdrawManuscript
);

// Routes for manuscript management
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

module.exports = router;
