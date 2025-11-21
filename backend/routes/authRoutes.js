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
  getOrcidLoginUrl,
  orcidCallback,
  sendLoginDetails,
  resetPassword,
  switchRole,
} = require("../controllers/authController");

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleAuth);
router.get("/google-client-id", getGoogleClientId);
router.post("/send-login-details", sendLoginDetails);
router.post("/reset-password", resetPassword);

// ORCID OAuth routes
router.get("/orcid/login-url", getOrcidLoginUrl);
router.get("/orcid/callback", orcidCallback);

// Protected routes
router.get("/profile", auth, getUserProfile);
router.put("/profile", auth, updateUserProfile);
router.post("/verify-email", auth, verifyEmail);
router.post("/switch-role", auth, switchRole);

// Admin routes
router.get("/users", auth, getAllUsers);
router.delete("/users/:id", auth, deleteUser);

module.exports = router;
