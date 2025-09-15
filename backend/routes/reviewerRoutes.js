const express = require("express");

const router = express.Router();
const {
	registerReviewer,
	loginReviewer,
	getProfile,
	getAssignedManuscripts,
	submitReview,
	forgotPassword,
	resetPassword,
} = require("../controllers/reviewerController");
const auth = require("../middleware/auth");

// Public routes
router.post("/register", registerReviewer);
router.post("/login", loginReviewer);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// Protected routes
router.get("/profile", auth, getProfile);
router.get("/assigned-manuscripts", auth, getAssignedManuscripts);
router.post("/manuscripts/:manuscriptId/review", auth, submitReview);

module.exports = router;
