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
router.get(
	"/users-with-manuscripts",
	auth,
	editorController.getUsersWithManuscripts
);
router.get(
	"/manuscripts/:author",
	auth,
	editorController.getManuscriptsByAuthor
);
router.post("/manuscripts/:manuscriptId/notes", auth, editorController.addNote);
router.post(
	"/manuscripts/:manuscriptId/revision-required",
	auth,
	editorController.addRevisionRequiredNote
);
router.get(
	"/manuscripts/:manuscriptId/notes",
	auth,
	editorController.getManuscriptNotes
);
router.patch(
	"/manuscripts/:manuscriptId/status",
	auth,
	editorController.updateManuscriptStatus
);
router.patch(
	"/manuscripts/bulk-update-status",
	auth,
	editorController.bulkUpdateManuscriptStatus
);
router.post(
	"/manuscripts/:manuscriptId/invite-reviewers",
	auth,
	editorController.sendInvitation
);
router.get(
	"/manuscripts/:manuscriptId/accepted-invitations",
	auth,
	editorController.getAcceptedInvitations
);
router.post(
	"/manuscripts/:manuscriptId/assign-reviewers",
	auth,
	editorController.assignReviewersFromInvitations
);
router.post(
    "/notify-new-manuscript",
    auth,
    editorController.notifyEditorsOnNewManuscript
);


router.get(
    "/all",
    auth,
    editorController.getAllEditors
);
module.exports = router;
