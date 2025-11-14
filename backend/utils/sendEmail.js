const sgMail = require("@sendgrid/mail");

// Set the API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Very simple HTML to text fallback
function htmlToText(html = "") {
    try {
        return html
            .replace(/<style[\s\S]*?<\/style>/gi, " ")
            .replace(/<script[\s\S]*?<\/script>/gi, " ")
            .replace(/<\/(p|div|li|br|h[1-6])>/gi, "\n")
            .replace(/<li>/gi, "• ")
            .replace(/<[^>]+>/g, " ")
            .replace(/\n{2,}/g, "\n")
            .replace(/\s{2,}/g, " ")
            .trim();
    } catch (_) {
        return "";
    }
}

const sendEmail = async (options) => {
    try {
        const fromEmail = process.env.SENDGRID_FROM_EMAIL || "noreply@synergy.com";
        const fromName = process.env.SENDGRID_FROM_NAME || "Synergy World Press";
        const replyTo = process.env.SENDGRID_REPLY_TO || undefined;

        // Backward compatibility: if caller supplied `text` as HTML, treat it as html
        const html = options.html || options.text || "";
        const text = options.plainText || htmlToText(html);

        const msg = {
            to: options.to,
            from: { email: fromEmail, name: fromName },
            subject: options.subject,
            html,
            text,
            replyTo,
            // Reduce spam signals for transactional mail
            trackingSettings: {
                clickTracking: { enable: false, enableText: false },
                openTracking: { enable: false },
            },
        };

        // Optional categories for better deliverability analytics
        if (options.categories) msg.categories = options.categories;

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
