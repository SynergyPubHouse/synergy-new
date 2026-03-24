const { google } = require("googleapis");
const http = require("http");
const url = require("url");

// ✅ Replace these with your Google Cloud Console credentials
const CLIENT_ID =
  "399654942628-vqbjbpspft5ic6rfmt29340itbf4vbu9.apps.googleusercontent.com";
const CLIENT_SECRET = "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";
const REDIRECT_URI = "http://localhost:5000/auth/google/callback";

// ✅ Add the scopes you need
const SCOPES = [
  "https://www.googleapis.com/auth/drive", // Full Drive access
];

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI,
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline", // Required to get refresh_token
  prompt: "consent", // Forces refresh token to be returned every time
  scope: SCOPES,
});

// Start a local server to catch the callback
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);

  if (parsedUrl.pathname === "/auth/google/callback") {
    const code = parsedUrl.query.code;

    if (!code) {
      res.end("No code found in callback.");
      return;
    }

    try {
      const { tokens } = await oauth2Client.getToken(code);

      res.end(`
        <h2>✅ Tokens Generated Successfully!</h2>
        <p>Check your terminal for the tokens.</p>
      `);

      console.log("\n✅ Tokens generated successfully!\n");
      console.log("Access Token:  ", tokens.access_token);
      console.log("Refresh Token: ", tokens.refresh_token);
      console.log(
        "Expiry Date:   ",
        new Date(tokens.expiry_date).toISOString(),
      );
      console.log("\nFull token object:\n", JSON.stringify(tokens, null, 2));
    } catch (err) {
      res.end("Error exchanging code for tokens: " + err.message);
      console.error("Error:", err.message);
    }

    server.close();
  }
});

server.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
  console.log("\n👇 Copy and open this URL in your browser:\n");
  console.log(authUrl);
  console.log("\n⏳ Waiting for authorization...\n");
});
