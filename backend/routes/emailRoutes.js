const express = require("express");
const sendEmail = require("../utils/sendEmail");
const router = express.Router();

// POST /api/send-email - Send email endpoint
router.post("/", async (req, res) => {
  try {
    const { to, subject, html, text } = req.body;

    // Validate required fields
    if (!to || !subject) {
      return res.status(400).json({
        success: false,
        message: "Email recipient and subject are required",
      });
    }

    // Prepare email options
    const emailOptions = {
      to,
      subject,
    };

    // Add content (prefer HTML over text)
    if (html) {
      emailOptions.html = html;
    } else if (text) {
      emailOptions.text = text;
    } else {
      return res.status(400).json({
        success: false,
        message: "Email content (html or text) is required",
      });
    }

    // Send email using existing sendEmail utility
    await sendEmail(emailOptions);

    console.log(`Email sent successfully to: ${to}`);
    res.status(200).json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send email",
      error: error.message,
    });
  }
});

module.exports = router;
