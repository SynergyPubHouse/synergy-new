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
	getPendingInvitations,
	acceptInvitation,
	rejectInvitation,
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
router.get("/pending-invitations", auth, getPendingInvitations);
router.post("/manuscripts/:manuscriptId/review", auth, submitReview);
router.post(
	"/manuscripts/:manuscriptId/accept-invitation",
	auth,
	acceptInvitation
);
router.post(
	"/manuscripts/:manuscriptId/reject-invitation",
	auth,
	rejectInvitation
);

module.exports = router;
