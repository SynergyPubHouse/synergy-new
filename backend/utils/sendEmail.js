const sgMail = require("@sendgrid/mail");

// Set the API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (options) => {
	try {
		const msg = {
			to: options.to,
			from: {
				email: process.env.SENDGRID_FROM_EMAIL || "noreply@synergy.com",
				name: "Synergy World Press",
			},
			subject: options.subject,
			html: options.text,
		};

		await sgMail.send(msg);
		console.log("Email sent successfully via SendGrid");
	} catch (error) {
		console.error("SendGrid email error:", error);
		if (error.response) {
			console.error("SendGrid error details:", error.response.body);
		}
		throw error;
	}
};

module.exports = sendEmail;
