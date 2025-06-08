const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  deleteUser,
  verifyEmail,
  googleAuth,
  getGoogleClientId,
  orcidCallback
} = require("../controllers/authController");

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleAuth);
router.get("/google-client-id", getGoogleClientId);
router.post("/orcid/callback", orcidCallback);

// Protected routes
router.get("/profile", auth, getUserProfile);
router.put("/profile", auth, updateUserProfile);
router.post("/verify-email", auth, verifyEmail);

// Admin routes
router.get("/users", auth, getAllUsers);
router.delete("/users/:id", auth, deleteUser);

module.exports = router;
