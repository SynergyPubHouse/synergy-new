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
} = require("../controllers/authController");

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected routes
router.get("/profile", auth, getUserProfile);
router.put("/profile", auth, updateUserProfile);
router.post("/verify-email", auth, verifyEmail);

// Admin routes (optional)
router.get("/users", auth, getAllUsers);
router.delete("/user/:id", auth, deleteUser);

// Google Auth routes
router.post("/google", googleAuth);
router.get("/google/client-id", getGoogleClientId);

module.exports = router;
