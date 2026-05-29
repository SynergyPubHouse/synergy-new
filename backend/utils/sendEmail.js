const nodemailer = require("nodemailer");

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

// Create reusable transporter
const createTransporter = () => {
    const port = parseInt(process.env.EMAIL_PORT) || 465;
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || "smtp.hostinger.com",
        port,
        secure: port === 465, // true for port 465 (implicit TLS), false for 587 (STARTTLS)
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        // Extra settings for better deliverability
        tls: {
            rejectUnauthorized: false,
        },
    });
};

const sendEmail = async (options) => {
    try {
        const fromEmail = process.env.EMAIL_USER || process.env.EMAIL_FROM || "noreply@synergyworldpress.com";
        const fromName = process.env.EMAIL_FROM_NAME || "Synergy World Press";
        const replyTo = process.env.EMAIL_REPLY_TO || undefined;

        // Backward compatibility: if caller supplied `text` as HTML, treat it as html
        const html = options.html || options.text || "";
        const text = options.plainText || htmlToText(html);

        const transporter = createTransporter();

        const mailOptions = {
            from: `"${fromName}" <${fromEmail}>`,
            to: options.to,
            subject: options.subject,
            html: html,
            text: text,
        };

        // Add replyTo if exists
        if (replyTo) {
            mailOptions.replyTo = replyTo;
        }

        // Add CC if exists
        if (options.cc) {
            mailOptions.cc = options.cc;
        }

        // Add BCC if exists
        if (options.bcc) {
            mailOptions.bcc = options.bcc;
        }

        // Add attachments if exists
        if (options.attachments) {
            mailOptions.attachments = options.attachments;
        }

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent successfully to: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Message ID: ${info.messageId}`);

        return info;
    } catch (error) {
        console.error(`❌ Email sending error for recipient ${options.to || 'Unknown'}:`, error);
        throw error;
    }
};

module.exports = sendEmail;