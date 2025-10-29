const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT, // This is 587
        secure: false, // <-- THIS IS THE FIX. Port 587 uses STARTTLS
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS, // Your App Password
        },
    });

    const mailOptions = {
        from: "Synergy World Press <noreply@synergy.com>",
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
    };

    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
