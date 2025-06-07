const express = require("express");
const router = express.Router();
const editorController = require("../controllers/editorController");
const auth = require("../middleware/auth");

// Public routes
router.post("/register", editorController.registerEditor);
router.post("/login", editorController.loginEditor);

// Protected routes
router.get("/profile", auth, editorController.getProfile);
router.put("/profile", auth, editorController.updateProfile);
router.get("/reviewers", auth, editorController.getReviewers);
router.get("/users-with-manuscripts", auth, editorController.getUsersWithManuscripts);
router.get("/manuscripts/:author", auth, editorController.getManuscriptsByAuthor);
router.post("/manuscripts/:manuscriptId/notes", auth, editorController.addNote);
router.patch("/manuscripts/:manuscriptId/status", auth, editorController.updateManuscriptStatus);

module.exports = router;
