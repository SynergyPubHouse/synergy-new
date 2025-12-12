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
  verifyEmailToken,
  resendVerificationEmail,
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
router.post("/verify-email-token", verifyEmailToken);
router.post("/resend-verification", resendVerificationEmail);
// Admin routes
router.get("/users", auth, getAllUsers);
router.delete("/users/:id", auth, deleteUser);
router.get("/orcid", (req, res) => {
  const redirectUri =
    "https://synergy-world-press-pq5k.onrender.com/api/auth/orcid/callback";
  const orcidUrl = `https://orcid.org/oauth/authorize?client_id=${
    process.env.ORCID_CLIENT_ID
  }&response_type=code&scope=/authenticate&redirect_uri=${encodeURIComponent(
    redirectUri
  )}`;
  res.json({ url: orcidUrl });
});
// Route 2: ORCID callback
router.get("/orcid/callback", orcidCallback);

module.exports = router;
