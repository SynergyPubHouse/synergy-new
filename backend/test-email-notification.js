const mongoose = require("mongoose");
const dotenv = require("dotenv");
const sendEmail = require("./utils/sendEmail");

// Load environment variables
dotenv.config();

const testEmailNotification = async () => {
	try {
		console.log("🧪 Testing email notification system...");

		// Test email content
		const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <div style="background: linear-gradient(135deg, #00796b 0%, #00acc1 100%); color: white; padding: 30px; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px;">Synergy World Press</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">Test Email Notification</p>
                </div>
                
                <div style="padding: 30px;">
                    <div style="background-color: #dcfce7; border-left: 4px solid #16a34a; padding: 20px; margin-bottom: 25px; border-radius: 4px;">
                        <h2 style="margin: 0 0 10px 0; color: #16a34a; font-size: 20px;">
                            🎉 Status Changed to: Accepted
                        </h2>
                        <p style="margin: 0; color: #374151; font-size: 14px;">
                            This is a test email to verify the notification system is working.
                        </p>
                    </div>

                    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                        <h3 style="margin: 0 0 15px 0; color: #374151; font-size: 16px;">📄 Test Details</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 30%;">Title:</td>
                                <td style="padding: 8px 0; color: #374151; font-size: 14px; font-weight: 500;">Test Manuscript Email Notification</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Status:</td>
                                <td style="padding: 8px 0; color: #16a34a; font-size: 14px; font-weight: 600;">Accepted</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Updated by:</td>
                                <td style="padding: 8px 0; color: #374151; font-size: 14px;">Test Editor</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Test Date:</td>
                                <td style="padding: 8px 0; color: #374151; font-size: 14px;">${new Date().toLocaleDateString(
									"en-US",
									{
										year: "numeric",
										month: "long",
										day: "numeric",
										hour: "2-digit",
										minute: "2-digit",
									}
								)}</td>
                            </tr>
                        </table>
                    </div>

                    <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 25px; border-radius: 4px;">
                        <h3 style="margin: 0 0 10px 0; color: #92400e; font-size: 16px;">📝 Test Note</h3>
                        <p style="margin: 0; color: #451a03; font-size: 14px; line-height: 1.6;">
                            This is a test email to verify that the manuscript status change notification system is working correctly.
                        </p>
                    </div>

                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; text-align: center;">
                        <p style="margin: 0;">This is an automated test notification from Synergy World Press.</p>
                        <p style="margin: 5px 0 0 0;">For questions, please contact: <a href="mailto:support@synergyworldpress.com" style="color: #00796b;">support@synergyworldpress.com</a></p>
                    </div>
                </div>
            </div>
        `;

		// Test sending an email
		await sendEmail({
			to: "test@example.com", // Change this to a real email for testing
			subject: "Test: Manuscript Status Change Notification",
			text: emailContent,
		});

		console.log("✅ Test email sent successfully!");
		console.log(
			"📧 Check the recipient email address for the notification."
		);
	} catch (error) {
		console.error("❌ Email test failed:", error);
		if (error.message.includes("EAUTH")) {
			console.log(
				"💡 Authentication failed. Please check your EMAIL_USER and EMAIL_PASS in .env file."
			);
		} else if (error.message.includes("ECONNREFUSED")) {
			console.log(
				"💡 Connection refused. Please check your EMAIL_HOST and EMAIL_PORT in .env file."
			);
		}
	}
};

// Run the test
if (require.main === module) {
	testEmailNotification()
		.then(() => {
			console.log("🔚 Test completed.");
			process.exit(0);
		})
		.catch((error) => {
			console.error("💥 Test failed:", error);
			process.exit(1);
		});
}

module.exports = testEmailNotification;
