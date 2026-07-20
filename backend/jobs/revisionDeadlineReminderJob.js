const Manuscript = require("../models/Manuscript");
const sendEmail = require("../utils/sendEmail");

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function getReminderSenderEmail() {
  return process.env.EMAIL_USER || process.env.EMAIL_FROM;
}

function getAuthorEmails(manuscript) {
  const emails = new Set();

  if (manuscript?.correspondingAuthor?.email) {
    emails.add(String(manuscript.correspondingAuthor.email).toLowerCase());
  }

  if (Array.isArray(manuscript?.authors)) {
    manuscript.authors.forEach((author) => {
      if (author?.email) {
        emails.add(String(author.email).toLowerCase());
      }
    });
  }

  return Array.from(emails);
}

function formatDateTime(dateValue) {
  return new Date(dateValue).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function runRevisionDeadlineReminderJob() {
  const now = new Date();
  const manuscripts = await Manuscript.find({
    status: "Revision Required",
    "revisionRequest.isActive": true,
    "revisionRequest.dueDate": { $exists: true, $ne: null },
    "revisionRequest.reminderSentAt": null,
    "revisionRequest.submittedAt": null,
  })
    .populate("authors", "firstName middleName lastName email")
    .populate("correspondingAuthor", "firstName middleName lastName email");

  let reminded = 0;
  let skipped = 0;
  let failed = 0;

  for (const manuscript of manuscripts) {
    try {
      const dueDate = manuscript?.revisionRequest?.dueDate;
      if (!dueDate) {
        skipped += 1;
        continue;
      }

      const daysRemaining = Math.ceil((new Date(dueDate) - now) / ONE_DAY_MS);
      if (daysRemaining < 0 || daysRemaining > 3) {
        skipped += 1;
        continue;
      }

      const emails = getAuthorEmails(manuscript);
      if (!emails.length) {
        skipped += 1;
        continue;
      }

      const subject = `Reminder: Revision Due Soon for Manuscript ${
        manuscript.customId || manuscript._id
      }`;
      const frontendUrl =
        process.env.FRONTEND_URL || "https://synergyworldpress.com";
      const dashboardUrl = `${frontendUrl.replace(/\/+$/, "")}/journal/jics/my-submissions`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
          <h2 style="color: #b45309;">Revision Due Soon</h2>
          <p>Dear Author,</p>
          <p>Your revised manuscript is due soon.</p>
          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0 0 8px 0;"><strong>Manuscript ID:</strong> ${
              manuscript.customId || manuscript._id
            }</p>
            <p style="margin: 0 0 8px 0;"><strong>Manuscript title:</strong> ${
              manuscript.title || "Untitled"
            }</p>
            <p style="margin: 0 0 8px 0;"><strong>Revision deadline date:</strong> ${formatDateTime(
              dueDate,
            )}</p>
            <p style="margin: 0;"><strong>Days remaining:</strong> ${daysRemaining}</p>
          </div>
          <p>Please log in to your author dashboard and submit the revised manuscript.</p>
          <p><a href="${dashboardUrl}" style="display: inline-block; background-color: #00796b; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 6px;">Open Author Dashboard</a></p>
          <p style="font-size: 12px; color: #6b7280;">This is an automated reminder email. Please do not reply to this message.</p>
        </div>
      `;

      const emailOptions = {
        to: emails,
        subject,
        html,
      };
      const reminderSenderEmail = getReminderSenderEmail();
      if (reminderSenderEmail) {
        emailOptions.from = {
          name: "Synergy World Press",
          email: reminderSenderEmail,
        };
      }

      await sendEmail(emailOptions);

      manuscript.revisionRequest.reminderSentAt = new Date();
      await manuscript.save();
      reminded += 1;
    } catch (error) {
      failed += 1;
      console.error(
        `Revision reminder failed for manuscript ${manuscript.customId || manuscript._id}:`,
        error.message,
      );
    }
  }

  console.log(
    `Revision deadline reminder job completed: ${reminded} reminder(s) sent, ${skipped} skipped, ${failed} failed`,
  );

}

module.exports = runRevisionDeadlineReminderJob;
