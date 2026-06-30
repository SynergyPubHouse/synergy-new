const express = require('express');
const router = express.Router();
const { getAuthUrl, getTokensFromCode } = require('../services/googleDriveOAuth');

// Get Auth URL
router.get('/google/url', (req, res) => {
  const url = getAuthUrl();
  console.log("\n🔗 Auth URL generated");
  res.json({ authUrl: url });
});

// Callback
router.get('/google/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).send('No code provided');
  }

  try {
    const tokens = await getTokensFromCode(code);
    
    console.log("\n" + "=".repeat(60));
    console.log("✅ SUCCESS! TOKEN RECEIVED!");
    console.log("=".repeat(60));
    console.log("\nRefresh token value suppressed; store it securely.");
    console.log("Google refresh token received:", Boolean(tokens.refresh_token));
    console.log("\n" + "=".repeat(60));
    
    res.send(`
      <html>
        <body style="font-family: Arial; padding: 50px; text-align: center;">
          <h1>✅ Authorization Successful!</h1>
          <p>Google returned a refresh token successfully.</p>
          <p>Store it securely in your environment configuration.</p>
          <p>Then restart your server!</p>
        </body>
      </html>
    `);
    
  } catch (error) {
    console.error("❌ Auth Error:", error.message);
    res.status(500).send('Authorization failed: ' + error.message);
  }
});

module.exports = router;