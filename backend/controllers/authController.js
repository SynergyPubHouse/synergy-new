const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const axios = require("axios");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const { OAuth2Client } = require("google-auth-library");
const Editor = require("../models/Editor");
const Reviewer = require("../models/Reviewer");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT
// Find this function:
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// Add these 2 functions after it:

// Generate Email Verification Token
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// Send Verification Email Helper Function
const sendVerificationEmail = async (user, token) => {
  const frontendUrl =  "https://synergyworldpress.com";
  
  let verificationLink;
  let buttonText = "Verify Email Address";
  let buttonColor = "#4F46E5";
  let subjectLine = "Verify Your Email - Synergy World Press";

  if (user.roles && user.roles.includes("editor")) {
    verificationLink = `${frontendUrl}/journal/jics/editor/dashboard?verify=${token}`;
    buttonText = "Access Editor Dashboard →";
    buttonColor = "#dc2626"; // red for editor
    subjectLine = "Welcome Editor! Verify Your Email - Synergy World Press";
  } else {
    verificationLink = `${frontendUrl}/verify-email/${token}`;
  }

  const fullName = [user.title, user.firstName, user.middleName, user.lastName]
    .filter(Boolean)
    .join(" ");

  const emailHtml = `
    <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #111; line-height: 1.6; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #4F46E5; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0;">Synergy World Press</h1>
      </div>
      
      <div style="padding: 30px; background-color: #f9f9f9;">
        <p>Dear ${fullName},</p>
        
        <p>Thank you for registering at Synergy World Press. To complete your registration and activate your account, please verify your email address.</p>
        
        ${user.roles?.includes("editor") 
          ? `<p style="font-weight: bold; color: #dc2626;">🎉 Congratulations! You have been registered as an <strong>Editor</strong>.</p>
             <p>Click the button below to verify your email and access your Editor Dashboard immediately.</p>`
          : `<p>After verification, you will be able to log in and submit manuscripts or review papers.</p>`
        }

        <div style="text-align: center; margin: 35px 0;">
          <a href="${verificationLink}" 
             style="background-color: ${buttonColor}; color: #ffffff; padding: 16px 36px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
            ${buttonText}
          </a>
        </div>
        
        <p>Or copy and paste this link in your browser:</p>
        <p style="background-color: #e9e9e9; padding: 12px; border-radius: 6px; word-break: break-all; font-size: 13px; font-family: monospace;">
          ${verificationLink}
        </p>
        
        <p><strong>This link will expire in 10 minutes for security.</strong></p>
        
        <p>If you did not register, please ignore this email.</p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />
        
        <p>With best regards,<br/>
        <strong>Synergy World Press</strong><br/>
        Editorial Office</p>
      </div>
      
      <div style="background-color: #333; color: #fff; padding: 15px; text-align: center; font-size: 12px;">
        <p style="margin: 0;">This is an automated message. Please do not reply to this email.</p>
      </div>
    </div>
  `;

  await sendEmail({
    to: user.email,
    subject: subjectLine,
    html: emailHtml,  // ← html: use kar (text: nahi)
  });
};

// @desc    Reset password using token
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res
        .status(400)
        .json({ message: "Token and new password are required" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    if (decoded.purpose !== "password_reset" || !decoded.id) {
      return res.status(400).json({ message: "Invalid token payload" });
    }

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    return res.json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.error("resetPassword error:", error);
    return res.status(500).json({ message: "Failed to reset password" });
  }
};

// @desc    Send login details email to existing user
// @route   POST /api/auth/send-login-details
// @access  Public
exports.sendLoginDetails = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ message: "No account found with this email" });
    }

    const frontendUrl =
       "https://synergyworldpress.com";
    const fullName = [
      user.title,
      user.firstName,
      user.middleName,
      user.lastName,
    ]
      .filter(Boolean)
      .join(" ");

    // Generate a short-lived password reset token and link
    const resetToken = jwt.sign(
      { id: user._id.toString(), purpose: "password_reset" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    const resetLink = `${frontendUrl}/reset-password/${resetToken}`;
    const profileLink = `${frontendUrl}/account`;

    const emailHtml = `
      <div style="font-family:Arial,Helvetica,sans-serif; font-size:14px; color:#111; line-height:1.6">
        <p>Dear ${fullName},</p>
        <p>You have registered as a user on the Synergy World Press site.</p>
        <p><strong>Your username is:</strong> ${user.username}</p>
        <p>When you registered, you created your own password. For security reasons, passwords are never sent by email. If you need to reset your password, please click this link (valid for 1 hour):<br/>
        <a href="${resetLink}">${resetLink}</a></p>
        <p>You can change your password and other personal information at:<br/>
        <a href="${profileLink}">${profileLink}</a></p>
        <p>With best regards,<br/>Synergy World Press, Editorial Office</p>
        <hr/>
        <p style="font-size:12px; color:#555">This letter contains confidential information, is for your own use, and should not be forwarded to third parties.</p>
      </div>
    `;

    await sendEmail({
      to: user.email,
      subject: "Registration Welcome Notification for Synergy World Press",
      text: emailHtml,
    });

    return res.json({ message: "Login details email sent" });
  } catch (error) {
    console.error("sendLoginDetails error:", error);
    return res.status(500).json({ message: "Failed to send email" });
  }
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
  const {
    title,
    firstName,
    middleName,
    lastName,
    email,
    username,
    password,
    role,
    specialization,
    experience,
    specialKey,
  } = req.body;

  try {
    // Check email/username in User collection
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser)
      return res
        .status(400)
        .json({ message: "Email or Username already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const normalizedRole = role
      ? role.toLowerCase().replace(" ", "_")
      : "author";

    // Determine roles based on selection
    let assignedRoles;
    let isEditor = false;

    if (normalizedRole === "editor") {
      assignedRoles = ["editor"];
      isEditor = true;
    } else {
      assignedRoles = ["author", "reviewer"];
      isEditor = false;
    }

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const verificationExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // Create User entry
    const userData = {
      title,
      firstName,
      middleName,
      lastName,
      email,
      username,
      password: hashedPassword,
      roles: assignedRoles,
      isEditor: isEditor,
      isVerified: false,
      emailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpiry: verificationExpiry,
    };

    // ═══════════════════════════════════════════════════════════════
    // EDITOR: Special key + Specialization + Experience required
    // ═══════════════════════════════════════════════════════════════
    if (normalizedRole === "editor") {
      const HARDCODED_EDITOR_KEY = "myTestEditorKey123";
      if (!specialKey)
        return res.status(400).json({ message: "Editor key required" });
      if (specialKey !== HARDCODED_EDITOR_KEY)
        return res.status(401).json({ message: "Invalid editor key" });
      if (!specialization || !experience)
        return res
          .status(400)
          .json({ message: "Specialization and experience required" });

      userData.specialization = specialization;
      userData.experience = experience;
      userData.specialKey = specialKey;

      await Editor.create({ ...userData });
    }

    // ═══════════════════════════════════════════════════════════════
    // REVIEWER: Specialization + Experience required
    // ═══════════════════════════════════════════════════════════════
    if (normalizedRole === "reviewer") {
      if (!specialization || !experience)
        return res
          .status(400)
          .json({ message: "Specialization and experience required" });

      userData.specialization = specialization;
      userData.experience = experience;

      await Reviewer.create({ ...userData });
    }

    // ═══════════════════════════════════════════════════════════════
    // AUTHOR: No specialization/experience required
    // But still save to Reviewer collection (without specialization)
    // ═══════════════════════════════════════════════════════════════
    if (normalizedRole === "author") {
      await Reviewer.create({ ...userData });
    }

    const newUser = await User.create(userData);

    // Send verification email
    try {
      await sendVerificationEmail(newUser, verificationToken);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
    }

    res.status(201).json({
      success: true,
      message: "Registration successful! Please check your email to verify your account.",
      user: {
        _id: newUser._id,
        title: newUser.title,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        username: newUser.username,
        roles: newUser.roles,
        isEditor: newUser.isEditor,
        isVerified: newUser.isVerified,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
// @desc    Verify email with token
// @route   POST /api/auth/verify-email-token
// @access  Public
exports.verifyEmailToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Verification token is required" });
    }

    // Find user with this token
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired verification link. Please request a new one.",
        expired: true,
      });
    }

    // Update user verification status
    user.isVerified = true;
    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpiry = null;
    await user.save();

    // Generate login token after verification
    const authToken = generateToken(user._id);

    res.json({
      success: true,
      message: "Email verified successfully! You can now login.",
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username,
        roles: user.roles,
        isVerified: user.isVerified,
      },
      token: authToken,
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({ message: "Failed to verify email", error: error.message });
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
exports.resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "No account found with this email" });
    }

    if (user.isVerified) {
      return res.status(400).json({
        message: "This email is already verified. You can login directly.",
        alreadyVerified: true,
      });
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();
    const verificationExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpiry = verificationExpiry;
    await user.save();

    await sendVerificationEmail(user, verificationToken);

    res.json({
      success: true,
      message: "Verification email sent! Please check your inbox.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({ message: "Failed to send verification email", error: error.message });
  }
};
// @desc    Authenticate user & get token (unified login for all roles)
// @route   POST /api/auth/login
// @access  Public
const HARDCODED_EDITOR_KEY = "myTestEditorKey123";

exports.loginUser = async (req, res) => {
  const { email, password, passKey } = req.body;

  try {
    // Import optional models
    const Reviewer = require("../models/Reviewer");

    // ══════════════════════════════════════════════════════════
    // 🆕 UPDATED: Find user by Email OR Username
    // ══════════════════════════════════════════════════════════
    const user = await User.findOne({
      $or: [
        { email: email },
        { username: email }  // email field mein username bhi aa sakta hai
      ]
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid email/username or password" });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email/username or password" });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in.",
        needsVerification: true,
        email: user.email,
      });
    }

    // Determine current role
    let currentRole = null;

    // If user has editor role, check passKey
    if (user.roles.includes("editor")) {
      if (passKey !== HARDCODED_EDITOR_KEY) {
        return res.status(401).json({ message: "Editor key required" });
      }
      currentRole = "editor";
    } else if (user.roles.includes("reviewer")) {
      currentRole = "reviewer";
    } else {
      currentRole = "author"; // default role for normal user
    }

    // Collect all roles from user.roles
    const availableRoles = [...user.roles];

    // ══════════════════════════════════════════════════════════
    // 🆕 OPTIONAL: Update last login time
    // ══════════════════════════════════════════════════════════
    user.lastLogin = new Date();
    await user.save();

    // Respond with user info
    return res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
      token: generateToken(user._id),
      accountType: currentRole,
      availableRoles: availableRoles,
      currentRole: currentRole,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server Error", error });
  }
};

// @desc    Switch user role (for users with multiple roles)
// @route   POST /api/auth/switch-role
// @access  Private
exports.switchRole = async (req, res) => {
  const { email, targetRole } = req.body;

  try {
    // Import models
    const Editor = require("../models/Editor");
    const Reviewer = require("../models/Reviewer");

    let targetAccount = null;
    let newToken = null;

    // Find the account for the target role
    switch (targetRole) {
      case "author":
        targetAccount = await User.findOne({ email });
        break;
      case "editor":
        targetAccount = await Editor.findOne({ email });
        break;
      case "reviewer":
        targetAccount = await Reviewer.findOne({ email });
        break;
      default:
        return res.status(400).json({ message: "Invalid role specified" });
    }

    if (!targetAccount) {
      return res.status(404).json({
        message: `No ${targetRole} account found for this email`,
      });
    }

    // Generate new token for the target account
    newToken = generateToken(targetAccount._id);

    res.json({
      _id: targetAccount._id,
      firstName: targetAccount.firstName,
      lastName: targetAccount.lastName,
      email: targetAccount.email,
      username: targetAccount.username,
      token: newToken,
      accountType: targetRole,
      currentRole: targetRole,
      message: `Successfully switched to ${targetRole} role`,
    });
  } catch (error) {
    console.error("Role switch error:", error);
    res.status(500).json({ message: "Server Error", error });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.firstName = req.body.firstName || user.firstName;
      user.middleName = req.body.middleName || user.middleName;
      user.lastName = req.body.lastName || user.lastName;
      user.email = req.body.email || user.email;
      user.username = req.body.username || user.username;

      if (req.body.password) {
        user.password = await bcrypt.hash(req.body.password, 10);
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        username: updatedUser.username,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

// @desc    Get all users
// @route   GET /api/auth/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

// @desc    Delete user
// @route   DELETE /api/auth/user/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      await user.remove();
      res.json({ message: "User removed" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

// @desc    Verify if email exists in database
// @route   POST /api/auth/verify-email
// @access  Private
exports.verifyEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (user) {
      res.json({
        exists: true,
        message: "Email exists in database",
        user: {
          _id: user._id,
          title: user.title,
          firstName: user.firstName,
          middleName: user.middleName,
          lastName: user.lastName,
          email: user.email,
          institution: user.institution,
          country: user.country,
          academicDegree: user.academicDegree,
        },
      });
    } else {
      res.json({
        exists: false,
        message: "Email does not exist in database",
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.googleAuth = async (req, res) => {
  try {
    const { token } = req.body;

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, given_name, family_name, picture } = payload;

    // Check if user exists
    let user = await User.findOne({
      $or: [{ email }, { googleId }],
    });

    if (!user) {
      // Create new user with Google info
      user = await User.create({
        firstName: given_name,
        lastName: family_name || ".",
        email,
        googleId,
        username: email.split("@")[0] + "_" + googleId.slice(0, 4),
        password: await bcrypt.hash(googleId + process.env.JWT_SECRET, 10),
        // ═══════════════════════════════════════════════════════════
        // 🆕 NEW: Add these fields
        // ═══════════════════════════════════════════════════════════
        roles: ["author", "reviewer"],
        isEditor: false,
        isVerified: true,
        emailVerified: true,
      });

      // 🆕 NEW: Save to Reviewer collection also
      await Reviewer.create({
        firstName: given_name,
        lastName: family_name || ".",
        email,
        username: email.split("@")[0] + "_" + googleId.slice(0, 4),
        password: await bcrypt.hash(googleId + process.env.JWT_SECRET, 10),
        roles: ["author", "reviewer"],
      });

    } else if (!user.googleId) {
      // Update existing user with Google ID
      user.googleId = googleId;
      user.isVerified = true;
      user.emailVerified = true;
      
      // 🆕 NEW: Add reviewer role if not present
      if (!user.roles.includes("reviewer")) {
        user.roles.push("reviewer");
      }
      
      await user.save();
    }

    // Generate JWT
    const authToken = generateToken(user._id);

    // 🔄 CHANGED: Updated response with roles
    res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
      token: authToken,
      // ═══════════════════════════════════════════════════════════
      // 🆕 NEW: Add these to response
      // ═══════════════════════════════════════════════════════════
      roles: user.roles,
      availableRoles: user.roles,
      isEditor: user.isEditor || false,
      isVerified: user.isVerified,
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(401).json({
      message: "Google authentication failed",
      error: error.message,
    });
  }
};

exports.getGoogleClientId = async (req, res) => {
  res.json({ clientId: process.env.GOOGLE_CLIENT_ID });
};

// @desc    Get ORCID OAuth login URL
// @route   GET /api/auth/orcid/login-url
// @access  Public
exports.getOrcidLoginUrl = async (req, res) => {
  try {
    const redirectUri = process.env.ORCID_REDIRECT_URI || 
      (process.env.NODE_ENV === "production"
        ? "https://synergyworldpress.com/api/auth/orcid/callback"
        : "http://localhost:5000/api/auth/orcid/callback");

    const orcidUrl = `https://orcid.org/oauth/authorize?client_id=${
      process.env.ORCID_CLIENT_ID
    }&response_type=code&scope=/authenticate&redirect_uri=${encodeURIComponent(
      redirectUri
    )}`;

    res.json({ url: orcidUrl });
  } catch (error) {
    console.error("ORCID login URL generation error:", error);
    res.status(500).json({ 
      message: "Failed to generate ORCID login URL", 
      error: error.message 
    });
  }
};

// @desc    Handle ORCID OAuth callback
// @route   GET /api/auth/orcid/callback
// @access  Public
exports.orcidCallback = async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).json({ message: "No code provided" });
    
    const ORCID_REDIRECT_URI = process.env.ORCID_REDIRECT_URI ||
      "https://synergy-world-press-pq5k.onrender.com/api/auth/orcid/callback";
    
    // Exchange code for access token
    const tokenResponse = await axios.post(
      "https://orcid.org/oauth/token",
      new URLSearchParams({
        client_id: process.env.ORCID_CLIENT_ID,
        client_secret: process.env.ORCID_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: ORCID_REDIRECT_URI,
      }).toString(),
      { 
        headers: { 
          "Content-Type": "application/x-www-form-urlencoded", 
          "Accept": "application/json" 
        } 
      }
    );

    const { access_token, orcid: orcidFromToken } = tokenResponse.data;
    if (!access_token || !orcidFromToken) {
      return res.status(500).json({ message: "Invalid token response from ORCID", details: tokenResponse.data });
    }
    const orcid = orcidFromToken;

    // Validate ORCID format
    if (!orcid.match(/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/)) {
      return res.status(400).json({ message: "Invalid ORCID format" });
    }

    // Get user info from ORCID
    const userResponse = await axios.get(
      `https://pub.orcid.org/v3.0/${encodeURIComponent(orcid)}/person`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          Accept: "application/vnd.orcid+json",
        },
      }
    );

    const orcidData = userResponse.data;

    // Extract names with fallbacks
    const givenName = orcidData.name?.["given-names"]?.value?.trim() || 
                     orcidData.name?.givenNames?.value?.trim() || 
                     orcidData.name?.["given-names"]?.trim() || 
                     orcidData.name?.givenNames?.trim() || 
                     "ORCID";

    const familyName = orcidData.name?.["family-name"]?.value?.trim() || 
                      orcidData.name?.familyName?.value?.trim() || 
                      orcidData.name?.["family-name"]?.trim() || 
                      orcidData.name?.familyName?.trim() || 
                      orcid.slice(-4);

    // Generate username
    let username;
    try {
      const cleanGivenName = givenName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanFamilyName = familyName.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      if (cleanGivenName && cleanFamilyName && cleanGivenName !== 'orcid') {
        username = `${cleanGivenName}_${cleanFamilyName}`;
      } else {
        username = `orcid_${orcid.slice(-6)}`;
      }
      
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        username = `${username}_${orcid.slice(-4)}`;
      }
    } catch (err) {
      username = `orcid_${orcid.slice(-6)}`;
    }

    // Try to get email from ORCID
    let primaryEmail = null;
    let emailVerified = false;
    
    try {
      const emailResponse = await axios.get(`https://pub.orcid.org/v3.0/${encodeURIComponent(orcid)}/email`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          Accept: "application/vnd.orcid+json",
        },
      });

      const emails = emailResponse.data?.email || emailResponse.data?.emails || [];
      const primaryEmailObj = emails.find(e => e.primary && e.verified);
      const unverifiedPrimaryEmail = emails.find(e => e.primary);
      
      if (primaryEmailObj && primaryEmailObj.email) {
        primaryEmail = primaryEmailObj.email.trim();
        emailVerified = primaryEmailObj.verified;
      } else if (unverifiedPrimaryEmail && unverifiedPrimaryEmail.email) {
        primaryEmail = unverifiedPrimaryEmail.email.trim();
        emailVerified = false;
      }
    } catch (emailErr) {
      console.log("ORCID email not available:", emailErr.message);
    }

    if (!primaryEmail || !emailVerified) {
      primaryEmail = `orcid_${orcid.slice(-6)}@example.com`;
      emailVerified = false;
    }

    console.log(`ORCID Login: ${orcid} -> ${username} (${givenName} ${familyName})`);

    // Check if user exists by ORCID iD
    let user = await User.findOne({ orcidId: orcid });

    if (!user) {
      // Check if user exists with same email
      if (primaryEmail && !primaryEmail.includes('@example.com')) {
        const existingEmailUser = await User.findOne({ email: primaryEmail });
        if (existingEmailUser && !existingEmailUser.orcidId) {
          // Link ORCID to existing account
          existingEmailUser.orcidId = orcid;
          existingEmailUser.orcidVerified = true;
          existingEmailUser.isVerified = true;
          
          // 🆕 Add reviewer role if not present
          if (!existingEmailUser.roles.includes("reviewer")) {
            existingEmailUser.roles.push("reviewer");
          }
          
          user = await existingEmailUser.save();
        }
      }
      
      if (!user) {
        // Create new user with ORCID
        const userData = {
          firstName: givenName,
          lastName: familyName,
          email: primaryEmail,
          username: username,
          password: await bcrypt.hash(orcid + (process.env.JWT_SECRET || "secret"), 10),
          // 🆕 Both roles assigned
          roles: ["author", "reviewer"],
          isEditor: false,
          isVerified: true,
          emailVerified: emailVerified,
          orcidId: orcid,
          orcidVerified: true,
          profileCompleted: emailVerified
        };

        user = await User.create(userData);

        // 🆕 Save to Reviewer collection also
        await Reviewer.create({
          firstName: givenName,
          lastName: familyName,
          email: primaryEmail,
          username: username,
          password: await bcrypt.hash(orcid + (process.env.JWT_SECRET || "secret"), 10),
          roles: ["author", "reviewer"],
          orcidId: orcid,
        });

        console.log(`Created new user: ${username} with ORCID ${orcid}`);
      }
    } else {
      // Update last login
      user.lastLogin = new Date();
      
      // 🆕 Add reviewer role if not present
      if (!user.roles.includes("reviewer")) {
        user.roles.push("reviewer");
      }
      
      await user.save();
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Return user data
    const userData = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
      roles: user.roles,
      token,
      accountType: "author",
      currentRole: "author",
      availableRoles: user.roles,
      isEditor: user.isEditor || false,
      orcidId: user.orcidId,
      isVerified: user.isVerified,
      orcidVerified: user.orcidVerified,
      profileCompleted: user.profileCompleted,
      needsProfileCompletion: !emailVerified
    };

    // Check if request expects HTML or JSON
    if (req.headers.accept && req.headers.accept.includes('text/html')) {
      const frontendUrl =  'https://synergyworldpress.com';
      const redirectUrl = `${frontendUrl}/orcid-callback?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`;
      
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Logging in...</title>
          <script>
            setTimeout(function() {
              window.location.href = '${redirectUrl}';
            }, 100);
          </script>
        </head>
        <body>
          <p>Successfully authenticated with ORCID... Redirecting to your dashboard.</p>
          <p>If you are not redirected, <a href="${redirectUrl}">click here</a>.</p>
        </body>
        </html>
      `);
    } else {
      res.json(userData);
    }

  } catch (error) {
    console.error("ORCID callback error:", error.response?.data || error.message || error);
    return res.status(500).json({
      message: "ORCID authentication failed",
      error: error.response?.data || error.message,
    });
  }
};
