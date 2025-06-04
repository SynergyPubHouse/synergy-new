const express = require("express");
const router = express.Router();
const editorController = require("../controllers/editorController");
const auth = require("../middleware/auth");

// Public routes
router.post("/register", editorController.registerEditor);
router.post("/login", editorController.loginEditor);

// Protected routes (require authentication)
router.get("/profile", auth, editorController.getProfile);
router.put("/profile", auth, editorController.updateProfile);
router.get("/authors", auth, editorController.getAuthors);
router.get(
	"/manuscripts/:author",
	auth,
	editorController.getManuscriptsByAuthor
);

// Add new route for fetching users with manuscripts
router.get(
	"/users-with-manuscripts",
	auth,
	editorController.getUsersWithManuscripts
);

router.post("/manuscripts/:manuscriptId/notes", auth, editorController.addNote);
router.patch(
	"/manuscripts/:manuscriptId/status",
	auth,
	editorController.updateManuscriptStatus
);

router.get("/reviewers", auth, editorController.getReviewers);

module.exports = router;
