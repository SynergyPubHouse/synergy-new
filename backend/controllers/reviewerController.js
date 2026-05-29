const Manuscript = require("../models/Manuscript");
const Reviewer = require("../models/Reviewer");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail"); // Adjust the path as necessary
const generateCertificatePdf = require("../utils/generateCertificatePdf");

// Helper function to format full name including middle name if it exists
const formatFullName = (user) => {
  if (!user) return "Unknown";

  const { firstName, middleName, lastName } = user;
  let fullName = firstName || "";

  if (middleName && middleName.trim() !== "") {
    fullName += ` ${middleName}`;
  }

  if (lastName) {
    fullName += ` ${lastName}`;
  }

  return fullName.trim() || "Unknown";
};

// Register a new reviewer
exports.registerReviewer = async (req, res) => {
  try {
    const {
      title,
      firstName,
      middleName,
      lastName,
      email,
      username,
      password,
      specialization,
      experience,
    } = req.body;

    // Check if reviewer already exists
    const existingReviewer = await Reviewer.findOne({
      $or: [{ email }, { username }],
    });
    if (existingReviewer) {
      return res.status(400).json({
        message: "Reviewer with this email or username already exists",
      });
    }

    // Use the actual Reviewer document _id for assignments
    const reviewerId = reviewer._id;

    // Add reviewer to assignedReviewers if not already added
    if (!manuscript.assignedReviewers.includes(reviewerId)) {
      manuscript.assignedReviewers.push(reviewerId);
    }

    await manuscript.save();

    // Create new reviewer
    const reviewer = new Reviewer({
      title,
      firstName,
      middleName,
      lastName,
      email,
      username,
      password,
      specialization,
      experience,
    });

    await reviewer.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: reviewer._id, role: "reviewer" },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.status(201).json({
      message: "Reviewer registered successfully",
      token,
      user: {
        reviewer: {
          id: reviewer._id,
          title: reviewer.title,
          firstName: reviewer.firstName,
          lastName: reviewer.lastName,
          email: reviewer.email,
          username: reviewer.username,
          specialization: reviewer.specialization,
          experience: reviewer.experience,
          role: "reviewer",
        },
      },
    });
  } catch (error) {
    console.error("Reviewer registration error:", error);
    res.status(500).json({
      message: "Error registering reviewer",
      error: error.message,
    });
  }
};

// Login reviewer
exports.loginReviewer = async (req, res) => {
  try {
    const { email, password } = req.body;

    const reviewer = await Reviewer.findOne({ email });
    if (!reviewer) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await reviewer.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: reviewer._id, role: "reviewer" },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.json({
      token,
      reviewer: {
        _id: reviewer._id,
        id: reviewer._id,
        firstName: reviewer.firstName,
        lastName: reviewer.lastName,
        email: reviewer.email,
        username: reviewer.username,
        specialization: reviewer.specialization,
        experience: reviewer.experience,
        role: "reviewer",
      },
    });
  } catch (error) {
    console.error("Reviewer login error:", error);
    res.status(500).json({ message: "Error logging in" });
  }
};

// Get reviewer profile
exports.getProfile = async (req, res) => {
  try {
    const reviewer = await Reviewer.findById(req.user.id).select("-password");
    if (!reviewer) {
      return res.status(404).json({ message: "Reviewer not found" });
    }
    res.json(reviewer);
  } catch (error) {
    console.error("Get reviewer profile error:", error);
    res.status(500).json({
      message: "Error getting reviewer profile",
      error: error.message,
    });
  }
};

// Fetch manuscripts assigned to the reviewer
exports.getAssignedManuscripts = async (req, res) => {
  try {
    // Find reviewer
    let reviewer = await Reviewer.findById(req.user._id);
    console.log(reviewer, 'reviewer', req.user,)
    if (!reviewer && req.user?.email) {
      reviewer = await Reviewer.findOne({ email: req.user.email });
    }
    if (!reviewer) {
      return res.status(404).json({ message: "Reviewer not found" });
    }

    const reviewerEmail = reviewer.email.toLowerCase();
    const assignedIds = reviewer.assignedManuscripts || [];

    console.log(`[Debug] Fetching assigned manuscripts for reviewer: ${reviewerEmail}`);
    console.log(`[Debug] Assigned IDs from profile:`, assignedIds);

    if (!assignedIds || assignedIds.length === 0) {
      console.log(`[Debug] No assigned manuscripts found in profile.`);
      return res.json([]);
    }

    const manuscripts = await Manuscript.find({
      _id: { $in: assignedIds },
      invitations: {
        $elemMatch: {
          email: reviewerEmail,
          status: { $in: ["accepted", "expired"] },
        },
      },
    })

    console.log(`[Debug] Query returned ${manuscripts.length} manuscripts matching invitations.`);

    if (manuscripts.length === 0 && assignedIds.length > 0) {
      // Find them without the invitation filter to see what's actually in there
      const rawManuscripts = await Manuscript.find({ _id: { $in: assignedIds } });
      console.log(`[Debug] Found ${rawManuscripts.length} manuscripts by ID alone (ignoring invitations).`);
      rawManuscripts.forEach(m => {
        const hasInv = m.invitations.some(inv => inv.email.toLowerCase() === reviewerEmail);
        const matchingInv = m.invitations.find(inv => inv.email.toLowerCase() === reviewerEmail);
        console.log(`[Debug] Manuscript ${m._id}: Has invitation for ${reviewerEmail}? ${hasInv}. Status: ${matchingInv?.status || 'N/A'}`);
      });
    }

    const populatedManuscripts = await Manuscript.find({
      _id: { $in: manuscripts.map(m => m._id) }
    })
      .select(
        `
            customId 
            title 
            correspondingAuthor 
            authors 
            submissionDate 
            status 
            mergedFileUrl 
            reviewerNotes 
            editorNotes 
            invitations 
            authorResponse
            revisionCombinedPdfUrl 
            highlightedRevisionFileUrl
            currentRevisionRound
        `,
      )
      .populate({
        path: "correspondingAuthor",
        select: "firstName middleName lastName email",
      })
      .populate({
        path: "authors",
        select: "firstName middleName lastName email",
      });

    const formattedManuscripts = manuscripts.map((manuscript) => {
      // ═══════════════════════════════════════════════════════════════════
      // 👇 FIND LATEST ACCEPTED INVITATION
      // ═══════════════════════════════════════════════════════════════════
      const acceptedInvitations = manuscript.invitations.filter(
        (inv) =>
          inv.email.toLowerCase() === reviewerEmail &&
          inv.status === "accepted",
      );

      const latestAcceptedInvitation = acceptedInvitations.sort((a, b) => {
        const dateA = new Date(a.acceptedAt || a.invitedAt || 0);
        const dateB = new Date(b.acceptedAt || b.invitedAt || 0);
        return dateB - dateA;
      })[0];

      // ═══════════════════════════════════════════════════════════════════
      // 👇 CHECK REVISION ACCESS
      // ═══════════════════════════════════════════════════════════════════
      const currentRevisionRound = manuscript.currentRevisionRound || 0;
      const invitationRevisionRound =
        latestAcceptedInvitation?.revisionRound || 0;
      const isRevisionReview =
        latestAcceptedInvitation?.isRevisionReview || false;

      // Can see revision files if:
      // 1. isRevisionReview = true (explicitly marked)
      // 2. OR invitation's revisionRound >= manuscript's currentRevisionRound
      const canSeeRevisionFiles =
        isRevisionReview ||
        (currentRevisionRound > 0 &&
          invitationRevisionRound >= currentRevisionRound);

      // Debug log
      console.log(`Manuscript ${manuscript._id}:`, {
        currentRevisionRound,
        invitationRevisionRound,
        isRevisionReview,
        canSeeRevisionFiles,
      });

      // Author data
      let authorData = {
        _id: manuscript.correspondingAuthor?._id || null,
        firstName: manuscript.correspondingAuthor?.firstName || "",
        lastName: manuscript.correspondingAuthor?.lastName || "",
        email: manuscript.correspondingAuthor?.email || "",
        fullName: manuscript.correspondingAuthor
          ? formatFullName(manuscript.correspondingAuthor)
          : "Unknown Author",
      };

      // Fix PDF URL
      let pdfUrl = manuscript.mergedFileUrl || "";
      if (pdfUrl && !pdfUrl.startsWith("http")) {
        pdfUrl = `https://paper-sphere.vercel.app${pdfUrl}`;
      }

      // Filter notes
      const filteredReviewerNotes = manuscript.reviewerNotes.filter(
        (note) => note.addedBy?._id?.toString() === reviewer._id.toString(),
      );

      const visibleEditorNotes = manuscript.editorNotes.filter(
        (note) => note.visibility && note.visibility.includes("reviewer"),
      );

      // ═══════════════════════════════════════════════════════════════════
      // 👇 CONDITIONAL: Only include authorResponse if allowed
      // ═══════════════════════════════════════════════════════════════════
      let authorResponseData = null;

      if (manuscript.authorResponse) {
        const ar = manuscript.authorResponse;

        // Check if any file exists
        const hasFiles =
          ar.pdfUrl ||
          ar.docxUrl ||
          ar.highlightedFileUrl ||
          ar.withoutHighlightedFileUrl;

        if (hasFiles) {
          authorResponseData = {
            responseSheet: {
              pdfUrl: ar.pdfUrl || null,
              docxUrl: ar.docxUrl || null,
              uploadedAt: ar.uploadedAt || null,
            },
            highlightedDocument: {
              url: ar.highlightedFileUrl || null,
              uploadedAt: ar.highlightedUploadedAt || null,
            },
            cleanDocument: {
              url: ar.withoutHighlightedFileUrl || null,
              uploadedAt: ar.withoutHighlightedUploadedAt || null,
            },
            submissionCount: ar.submissionCount || 0,
            lastUpdated: ar.lastUpdated || null,
          };
        }
      }

      const authorsFull = (manuscript.authors || []).map((au) => ({
        _id: au._id,
        firstName: au.firstName || "",
        middleName: au.middleName || "",
        lastName: au.lastName || "",
        email: au.email || "",
        fullName: formatFullName(au),
      }));

      return {
        ...manuscript.toObject(),
        author: authorData,
        authors: authorsFull,
        mergedFileUrl: pdfUrl,
        reviewerNotes: filteredReviewerNotes,
        editorNotes: visibleEditorNotes,

        reviewRound: latestAcceptedInvitation?.reviewRound || 1,
        isRevisionReview: isRevisionReview,
        canSeeRevisionFiles: canSeeRevisionFiles,
        currentRevisionRound: currentRevisionRound,
        hasAuthorResponseFiles: !!authorResponseData,
        // 👇 Only if allowed
        authorResponse: authorResponseData,
        revisionCombinedPdfUrl: canSeeRevisionFiles
          ? manuscript.revisionCombinedPdfUrl || null
          : null,
        highlightedRevisionFileUrl: canSeeRevisionFiles
          ? manuscript.highlightedRevisionFileUrl || null
          : null,
      };
    });

    res.json(formattedManuscripts);
  } catch (error) {
    console.error("Error fetching manuscripts:", error);
    res.status(500).json({
      message: "Error fetching manuscripts",
      error: error.message,
    });
  }
};

// Submit a review for a manuscript
exports.submitReview = async (req, res) => {
  try {
    const { manuscriptId } = req.params;
    const { comments, recommendation } = req.body;

    const manuscript = await Manuscript.findById(manuscriptId)
      .populate("correspondingAuthor")
      .populate("authors")
      .select("+declarationFile +manuscriptFile +coverLetterFile");

    if (!manuscript) {
      return res.status(404).json({ message: "Manuscript not found" });
    }

    let reviewer = await Reviewer.findById(req.user._id);
    if (!reviewer && req.user?.email) {
      reviewer = await Reviewer.findOne({ email: req.user.email });
    }
    if (!reviewer) {
      return res.status(404).json({ message: "Reviewer not found" });
    }

    if (!manuscript.assignedReviewers.includes(reviewer._id)) {
      return res
        .status(403)
        .json({ message: "Not authorized to review this manuscript" });
    }

    let action;
    switch (recommendation) {
      case "Accept":
        action = "Accepted";
        break;
      case "Minor Revision":
      case "Major Revision":
        action = "Revision Required";
        break;
      case "Reject":
        action = "Rejected";
        break;
      default:
        action = "Reviewed";
    }

    const reviewerNote = {
      text: comments,
      action: action,
      visibility: ["editor", "reviewer"],
      addedBy: {
        _id: reviewer._id,
        name: formatFullName(reviewer),
        email: reviewer.email,
        role: "reviewer",
      },
      addedAt: new Date(),
    };

    const validActions = [
      "Under Review",
      "Reviewed",
      "Accepted",
      "Rejected",
      "Revision Required",
      "Revised",
    ];
    if (manuscript.reviewerNotes?.length > 0) {
      manuscript.reviewerNotes.forEach((note, index) => {
        if (note.action && !validActions.includes(note.action)) {
          manuscript.reviewerNotes[index].action = "Reviewed";
        }
      });
    }

    manuscript.reviewerNotes.push(reviewerNote);
    if (manuscript.status !== "Revision Required") {
      const decisionActions = ["Accepted", "Rejected", "Revision Required"];

      const reviewersWhoDecided = new Set(
        manuscript.reviewerNotes
          .filter((note) => decisionActions.includes(note.action))
          .map((note) => note.addedBy._id.toString()),
      );

      const allReviewersDecided =
        manuscript.assignedReviewers.length > 0 &&
        manuscript.assignedReviewers.every((id) =>
          reviewersWhoDecided.has(id.toString()),
        );

      if (allReviewersDecided) {
        manuscript.status = "Reviewed";
      }
    }
    manuscript.markModified("reviewerNotes");

    await manuscript.save();
    console.log("Step 1: reviewerNotes saved");
    const updateResult = await Manuscript.updateOne(
      { _id: manuscriptId },
      {
        $set: {
          "invitations.$[elem].reviewSubmittedAt": new Date(),
        },
      },
      {
        arrayFilters: [
          {
            "elem.email": reviewer.email.toLowerCase(),
            "elem.status": "accepted",
            "elem.reviewSubmittedAt": null,
            "elem.isReviewBlocked": { $ne: true },
          },
        ],
      },
    );

    console.log("Step 2: MongoDB Update Result:", {
      matched: updateResult.matchedCount,
      modified: updateResult.modifiedCount,
    });

    if (updateResult.modifiedCount === 0) {
      console.log(
        "WARNING: reviewSubmittedAt not updated - Check invitation status",
      );
    } else {
      console.log("SUCCESS: reviewSubmittedAt updated for:", reviewer.email);
    }

    res.json({
      message: "Review submitted successfully",
      manuscript: {
        _id: manuscript._id,
        status: manuscript.status,
        reviewerNotes: manuscript.reviewerNotes,
      },
    });

    // --- Certificate PDF email (fire-and-forget, after response) ---
    if (recommendation === "Accept") {
      (async () => {
        try {
          const reviewerName = formatFullName(reviewer);
          console.log(
            `[Certificate] Sending thank you email for reviewer: ${reviewerName} (${reviewer.email})`
          );

          await sendEmail({
            to: reviewer.email,
            subject: "Thank You for Reviewing – JICS",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              
                <div style="padding: 25px;">
                  <p style="color: #374151; font-size: 15px;">Dear ${reviewerName},</p>
                  <p style="color: #374151; font-size: 15px;">
                    Thank you for voluntarily contributing as a Reviewer of a Research Paper submitted
                    in the <strong>Journal of Intelligent Computing System (JICS)</strong>.
                  </p>
                  <p style="color: #374151; font-size: 15px;">
                    Your <strong>Monthly Certificate of Reviewing</strong> will be available to download from your Reviewer Dashboard on the 1st of the upcoming month, which aggregates your contributions for this month.
                  </p>
                  
                  <p style="color: #6B7280; font-size: 13px; margin-top: 30px;">
                    Warm regards,<br/>The Editorial Team<br/>Synergy World Press
                  </p>
                </div>
                <div style="background-color: #F3F4F6; padding: 15px; text-align: center; border-top: 1px solid #E5E7EB;">
                  <p style="color: #6B7280; font-size: 12px; margin: 0;">
                    Synergy World Press | <a href="mailto:support@synergyworldpress.com" style="color: #00796B;">support@synergyworldpress.com</a>
                  </p>
                </div>
              </div>
            `,
          });

          console.log(
            `[Certificate] Thank you email sent successfully to ${reviewer.email}`
          );
        } catch (emailErr) {
          console.error(
            "[Certificate] Failed to send thank you email:",
            emailErr
          );
        }
      })();
    }
  } catch (error) {
    console.error("Error submitting review:", error);
    res.status(500).json({
      message: "Error submitting review",
      error: error.message,
    });
  }
};

// Forgot Password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const reviewer = await Reviewer.findOne({ email });

    if (!reviewer) {
      return res.status(404).json({ message: "Reviewer not found" });
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    reviewer.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    reviewer.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await reviewer.save();

    const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${baseUrl}/reviewer/reset-password/${resetToken}`;

    const message = `
            <h1>You have requested a password reset</h1>
            <p>Please go to this link to reset your password:</p>
            <a href="${resetUrl}" clicktracking=off>${resetUrl}</a>
        `;

    try {
      await sendEmail({
        to: reviewer.email,
        subject: "Password Reset Request",
        text: message,
      });

      res.status(200).json({
        success: true,
        message: "Email sent successfully.",
      });
    } catch (err) {
      console.log(err);
      reviewer.resetPasswordToken = undefined;
      reviewer.resetPasswordExpires = undefined;
      await reviewer.save();
      return res.status(500).json({ message: "Email could not be sent" });
    }
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    console.log("Looking for token:", resetPasswordToken);
    console.log("Current time:", Date.now());

    const reviewer = await Reviewer.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!reviewer) {
      console.log("No reviewer found with valid token");
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    console.log("Found reviewer:", reviewer.email);
    console.log("Token expires at:", reviewer.resetPasswordExpires);

    // Update password and clear reset fields
    reviewer.password = req.body.password;
    reviewer.resetPasswordToken = undefined;
    reviewer.resetPasswordExpires = undefined;

    await reviewer.save();

    console.log("Password updated successfully for:", reviewer.email);

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Get pending invitations for logged-in reviewer
exports.getPendingInvitations = async (req, res) => {
  try {
    const reviewerEmail = req.user.email.toLowerCase().trim();

    console.log("Fetching pending invitations for:", reviewerEmail);

    const manuscriptsWithInvitations = await Manuscript.find({
      invitations: {
        $elemMatch: {
          email: reviewerEmail,
          status: "pending",
        },
      },
    })
      .select(
        `
            customId 
            title 
            type 
            abstract 
            keywords 
            submissionDate 
            status
            invitations 
            editorNotes 
            mergedFileUrl
            authorResponse
            revisionCombinedPdfUrl
            highlightedRevisionFileUrl
            currentRevisionRound
        `,
      )
      .lean();

    console.log("Found manuscripts:", manuscriptsWithInvitations.length);

    const invitations = manuscriptsWithInvitations.map((manuscript) => {
      // Find the pending invitation for this reviewer
      const relevantInvitation = manuscript.invitations.find(
        (inv) =>
          inv.email.toLowerCase() === reviewerEmail && inv.status === "pending",
      );

      // Filter visible editor notes
      const visibleEditorNotes = (manuscript.editorNotes || []).filter(
        (note) => {
          return (
            note.visibility &&
            Array.isArray(note.visibility) &&
            note.visibility.includes("reviewer")
          );
        },
      );

      // ═══════════════════════════════════════════════════════════════════
      // 👇 CHECK IF THIS IS A REVISION REVIEW
      // ═══════════════════════════════════════════════════════════════════
      const currentRevisionRound = manuscript.currentRevisionRound || 0;
      const invitationRevisionRound = relevantInvitation?.revisionRound || 0;
      const isRevisionReview =
        relevantInvitation?.isRevisionReview ||
        relevantInvitation?.reviewRound > 1 ||
        currentRevisionRound > 0;

      console.log(`Pending invitation for ${manuscript._id}:`, {
        currentRevisionRound,
        invitationRevisionRound,
        isRevisionReview,
      });

      // ═══════════════════════════════════════════════════════════════════
      // 👇 INCLUDE AUTHOR RESPONSE ONLY FOR REVISION REVIEWS
      // ═══════════════════════════════════════════════════════════════════
      let authorResponseData = null;

      if (manuscript.authorResponse) {
        const ar = manuscript.authorResponse;

        // Check if any file exists
        const hasFiles =
          ar.pdfUrl ||
          ar.docxUrl ||
          ar.highlightedFileUrl ||
          ar.withoutHighlightedFileUrl;

        if (hasFiles) {
          authorResponseData = {
            responseSheetUrl: ar.pdfUrl || ar.docxUrl || null,
            responseSheetUploadedAt: ar.uploadedAt || null,

            highlightedFileUrl: ar.highlightedFileUrl || null,
            highlightedUploadedAt: ar.highlightedUploadedAt || null,

            withoutHighlightedFileUrl: ar.withoutHighlightedFileUrl || null,
            withoutHighlightedUploadedAt:
              ar.withoutHighlightedUploadedAt || null,

            submissionCount: ar.submissionCount || 0,
            lastUpdated: ar.lastUpdated || null,
          };
        }
      }

      return {
        _id: manuscript._id,
        customId: manuscript.customId,
        title: manuscript.title,
        type: manuscript.type,
        abstract: manuscript.abstract,
        keywords: manuscript.keywords,
        submissionDate: manuscript.submissionDate,
        status: manuscript.status,

        // Invitation details
        invitedAt: relevantInvitation?.invitedAt,
        reviewRound: relevantInvitation?.reviewRound || 1,
        revisionRound: invitationRevisionRound,
        isRevisionReview: isRevisionReview,
        hasAuthorResponseFiles: !!authorResponseData,
        // Original manuscript
        mergedFileUrl: manuscript.mergedFileUrl,

        // Editor notes
        editorNotes: visibleEditorNotes,

        // Author response (only for revision reviews)
        authorResponse: authorResponseData,

        // Revision tracking
        currentRevisionRound: currentRevisionRound,

        // Additional revision files
        revisionCombinedPdfUrl: isRevisionReview
          ? manuscript.revisionCombinedPdfUrl || null
          : null,
        highlightedRevisionFileUrl: isRevisionReview
          ? manuscript.highlightedRevisionFileUrl || null
          : null,
      };
    });

    res.json(invitations);
  } catch (error) {
    console.error("Error getting pending invitations:", error);
    res.status(500).json({
      message: "Error fetching pending invitations",
      error: error.message,
    });
  }
};
// Accept invitation
exports.acceptInvitation = async (req, res) => {
  try {
    const { manuscriptId } = req.params;
    const reviewerEmail = req.user.email;

    // Update manuscript invitation status
    const manuscript = await Manuscript.findById(manuscriptId);
    if (!manuscript) {
      return res.status(404).json({ message: "Manuscript not found" });
    }

    // Find the invitation for this reviewer
    const invitation = manuscript.invitations.find(
      (inv) => inv.email === reviewerEmail && inv.status === "pending",
    );

    if (!invitation) {
      return res.status(404).json({
        message: "No pending invitation found for this manuscript",
      });
    }

    // Update invitation status
    invitation.status = "accepted";
    invitation.acceptedAt = new Date();

    // Add manuscript to reviewer's assignedManuscripts
    // Look up reviewer by ID first; if not found, fall back to email
    let reviewer = await Reviewer.findById(req.user._id);
    if (!reviewer) {
      reviewer = await Reviewer.findOne({ email: reviewerEmail });
    }

    if (!reviewer) {
      return res.status(404).json({
        message:
          "Reviewer account not found. Please ensure you are logged in as a reviewer.",
      });
    }

    // Add reviewer to manuscript's assignedReviewers if not already added
    if (!manuscript.assignedReviewers.includes(reviewer._id)) {
      manuscript.assignedReviewers.push(reviewer._id);
    }

    // Add manuscript to reviewer's assignedManuscripts if not already added
    if (!reviewer.assignedManuscripts.includes(manuscriptId)) {
      reviewer.assignedManuscripts.push(manuscriptId);
    }

    // Remove from pending invitations if exists
    reviewer.pendingInvitations = reviewer.pendingInvitations.filter(
      (inv) => inv.manuscriptId.toString() !== manuscriptId,
    );

    // Save both the manuscript and reviewer updates in a transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      await manuscript.save({ session });
      await reviewer.save({ session });
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

    res.json({
      message: "Invitation accepted successfully",
      manuscriptTitle: manuscript.title,
    });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    res.status(500).json({
      message: "Error accepting invitation",
      error: error.message,
    });
  }
};

// Reject invitation
exports.rejectInvitation = async (req, res) => {
  try {
    const { manuscriptId } = req.params;
    const { rejectionReason } = req.body;
    const reviewerEmail = req.user.email;

    // Validate that rejection reason is provided
    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({
        message: "Rejection reason is required",
      });
    }

    // Update manuscript invitation status
    const manuscript = await Manuscript.findById(manuscriptId);
    if (!manuscript) {
      return res.status(404).json({ message: "Manuscript not found" });
    }

    // Find the invitation for this reviewer
    const invitation = manuscript.invitations.find(
      (inv) => inv.email === reviewerEmail && inv.status === "pending",
    );

    if (!invitation) {
      return res.status(404).json({
        message: "No pending invitation found for this manuscript",
      });
    }

    // Update invitation status with rejection reason
    invitation.status = "rejected";
    invitation.rejectedAt = new Date();
    invitation.rejectionReason = rejectionReason.trim();

    await manuscript.save();

    // Remove from reviewer's pending invitations if exists
    let reviewer = await Reviewer.findById(req.user._id);
    if (!reviewer && req.user?.email) {
      reviewer = await Reviewer.findOne({ email: reviewerEmail });
    }

    if (!reviewer) {
      console.warn(
        `Reviewer account not found when rejecting invitation for ${reviewerEmail}`,
      );
      return res.status(404).json({
        message:
          "Reviewer account not found. Please ensure you are logged in as a reviewer.",
      });
    }

    reviewer.pendingInvitations = (reviewer.pendingInvitations || []).filter(
      (inv) => inv.manuscriptId.toString() !== manuscriptId,
    );
    await reviewer.save();

    res.json({
      message: "Invitation rejected successfully",
      manuscriptTitle: manuscript.title,
    });
  } catch (error) {
    console.error("Error rejecting invitation:", error);
    res.status(500).json({
      message: "Error rejecting invitation",
      error: error.message,
    });
  }
};

// Get completed reviews for certificates (Aggregated by month)
exports.getCompletedReviews = async (req, res) => {
  try {
    const reviewerEmail = req.user.email.toLowerCase().trim();

    // Find all manuscripts where this reviewer has a submitted review
    const manuscripts = await Manuscript.find({
      invitations: {
        $elemMatch: {
          email: reviewerEmail,
          status: "accepted",
          reviewSubmittedAt: { $ne: null }
        }
      }
    })
      .select("invitations customId")
      .lean();

    // Group reviews by month-year
    const monthlyGroups = {};

    manuscripts.forEach(manuscript => {
      // Find the specific invitation that corresponds to the submitted review
      const acceptedInvitations = manuscript.invitations.filter((inv) =>
        inv.email.toLowerCase() === reviewerEmail && inv.status === "accepted" && inv.reviewSubmittedAt
      );

      if (acceptedInvitations.length === 0) return;

      // Latest submitted invitation
      const latestInvitation = acceptedInvitations.sort((a, b) => {
        return new Date(b.reviewSubmittedAt) - new Date(a.reviewSubmittedAt);
      })[0];

      const submittedDate = new Date(latestInvitation.reviewSubmittedAt);

      const monthYearKey = `${submittedDate.getFullYear()}-${submittedDate.getMonth()}`;

      if (!monthlyGroups[monthYearKey]) {
        // Calculate unlock date: 1st of the month AFTER the next month
        const unlockDate = new Date(submittedDate.getFullYear(), submittedDate.getMonth() + 1, 1);

        monthlyGroups[monthYearKey] = {
          month: submittedDate.getMonth(), // 0-11
          year: submittedDate.getFullYear(),
          reviewCount: 0,
          unlockDate: unlockDate,
          isUnlocked: new Date() >= unlockDate
        };
      }

      monthlyGroups[monthYearKey].reviewCount += 1;
    });

    const completedReviews = Object.values(monthlyGroups);

    // Sort by newest month first
    completedReviews.sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return b.month - a.month;
    });

    res.json(completedReviews);
  } catch (error) {
    console.error("Error fetching completed reviews:", error);
    res.status(500).json({
      message: "Error fetching completed reviews",
      error: error.message
    });
  }
};

exports.downloadCertificate = async (req, res) => {
  try {
    const month = parseInt(req.query.month);
    const year = parseInt(req.query.year);
    const reviewerEmail = req.user.email.toLowerCase().trim();

    if (isNaN(month) || isNaN(year)) {
      return res.status(400).json({ message: "Valid month and year query parameters are required." });
    }

    const manuscripts = await Manuscript.find({
      invitations: {
        $elemMatch: {
          email: reviewerEmail,
          status: "accepted",
          reviewSubmittedAt: { $ne: null }
        }
      }
    }).lean();

    let reviewCount = 0;

    manuscripts.forEach(manuscript => {
      const acceptedInvitations = manuscript.invitations.filter((inv) =>
        inv.email.toLowerCase() === reviewerEmail && inv.status === "accepted" && inv.reviewSubmittedAt
      );

      if (acceptedInvitations.length === 0) return;

      const latestInvitation = acceptedInvitations.sort((a, b) => {
        return new Date(b.reviewSubmittedAt) - new Date(a.reviewSubmittedAt);
      })[0];

      const submittedDate = new Date(latestInvitation.reviewSubmittedAt);

      if (submittedDate.getFullYear() === year && submittedDate.getMonth() === month) {
        reviewCount += 1;
      }
    });

    if (reviewCount === 0) {
      return res.status(404).json({ message: "No submitted reviews found for this month and year." });
    }

    const unlockDate = new Date(year, month + 1, 1);

    if (new Date() < unlockDate) {
      return res.status(403).json({ message: "Certificate is not yet available for download" });
    }

    // Get reviewer name
    let reviewer = await Reviewer.findById(req.user._id);
    if (!reviewer) {
      reviewer = await Reviewer.findOne({ email: req.user.email });
    }
    const reviewerName = formatFullName(reviewer);

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    const monthName = monthNames[month];

    // Generate PDF
    const pdfBuffer = await generateCertificatePdf({
      reviewerName,
      date: new Date(year, month, 1),
      reviewCount
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="Certificate_of_Reviewing_${monthName}_${year}.pdf"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error("Error downloading certificate:", error);
    res.status(500).json({
      message: "Error downloading certificate",
      error: error.message
    });
  }
};
