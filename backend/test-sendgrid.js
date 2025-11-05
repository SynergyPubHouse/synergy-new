const sendEmail = require("./utils/sendEmail");
require("dotenv").config();

async function testSendGrid() {
	console.log("🔍 Checking SendGrid configuration...");

	// Check if API key is set
	if (!process.env.SENDGRID_API_KEY) {
		console.error(
			"❌ SENDGRID_API_KEY is not set in environment variables"
		);
		return;
	}

	// Check if API key format is correct
	if (!process.env.SENDGRID_API_KEY.startsWith("SG.")) {
		console.error(
			'❌ SENDGRID_API_KEY does not start with "SG." - please check your API key'
		);
		console.log(
			"Current API key starts with:",
			process.env.SENDGRID_API_KEY.substring(0, 10) + "..."
		);
		return;
	}

	// Check if from email is set
	if (!process.env.SENDGRID_FROM_EMAIL) {
		console.error(
			"❌ SENDGRID_FROM_EMAIL is not set in environment variables"
		);
		return;
	}

	console.log("✅ API key format looks correct");
	console.log("✅ From email is set:", process.env.SENDGRID_FROM_EMAIL);
	console.log("");

	try {
		console.log("📧 Testing SendGrid email functionality...");

		await sendEmail({
			to: "synergypubhouse@gmail.com", // Send to your own email for testing
			subject:
				"SendGrid Integration Test - " + new Date().toLocaleString(),
			text: `
                <h1>🎉 SendGrid Integration Successful!</h1>
                <p>This is a test email to verify that SendGrid is working correctly with your Synergy World Press application.</p>
                <p><strong>Test Details:</strong></p>
                <ul>
                    <li>Sent at: ${new Date().toLocaleString()}</li>
                    <li>From: ${process.env.SENDGRID_FROM_EMAIL}</li>
                    <li>API Key: ${process.env.SENDGRID_API_KEY.substring(
						0,
						10
					)}...</li>
                </ul>
                <p>If you receive this email, the integration is working perfectly!</p>
                <br>
                <p>Best regards,<br><strong>Synergy World Press Team</strong></p>
            `,
		});

		console.log("✅ Test email sent successfully!");
		console.log("📬 Check your email inbox at: synergypubhouse@gmail.com");
	} catch (error) {
		console.error("❌ Error sending test email:");
		console.error("Error message:", error.message);

		if (error.code === 401) {
			console.error("");
			console.error("🔑 AUTHENTICATION ERROR:");
			console.error(
				"- Your API key is invalid, expired, or doesn't have the right permissions"
			);
			console.error("- Go to SendGrid dashboard > Settings > API Keys");
			console.error(
				'- Create a new API key with "Mail Send" permissions'
			);
			console.error("- Make sure to verify your sender email address");
		} else if (error.code === 403) {
			console.error("");
			console.error("🚫 PERMISSION ERROR:");
			console.error("- Your sender email might not be verified");
			console.error(
				"- Go to SendGrid dashboard > Settings > Sender Authentication"
			);
			console.error("- Verify your sender email address");
		}

		if (error.response && error.response.body) {
			console.error("");
			console.error(
				"📋 SendGrid error details:",
				JSON.stringify(error.response.body, null, 2)
			);
		}
	}
}

console.log("🚀 Starting SendGrid test...");
console.log("=====================================");
testSendGrid();
