

const Manuscript = require('../models/Manuscript');
const sendEmail = require('../utils/sendEmail');

const runStrictReviewDeadline = async () => {
    console.log("Review Deadline Monitor Activated → LIVE MODE (48 + 24 hours)");

    const now = new Date();
    let reminded = 0;
    let blocked = 0;

    try {
      const manuscripts = await Manuscript.find({
  invitations: {
    $elemMatch: {
      status: "accepted",
      reviewSubmittedAt: null,
      isReviewBlocked: false
    }
  }
});
      for (const manuscript of manuscripts) {
  let saveNeeded = false;

  for (const inv of manuscript.invitations) {
    if (inv.status !== "accepted") continue;
    if (inv.isReviewBlocked) continue;
    if (inv.reviewSubmittedAt) continue;
    if (!inv.acceptedAt) continue;

    const minutesSinceAccept = (now - new Date(inv.acceptedAt)) / (1000 * 60);

 if (minutesSinceAccept >= 2880  && !inv.reviewReminderSentAt) {
  await sendReminderEmail(manuscript, inv);
  inv.reviewReminderSentAt = now;
  reminded++;           // ✅ add this
  saveNeeded = true;
}

    if (minutesSinceAccept >= 4320 && !inv.isReviewBlocked) {
  await sendAccessRevokedEmail(manuscript, inv);
  inv.isReviewBlocked = true;
  inv.reviewBlockedAt = now;
  inv.status = "blocked";
  blocked++;            // ✅ add this
  saveNeeded = true;
}
  }

            if (saveNeeded) await manuscript.save();
        }

        console.log(`Review Deadline Monitor → ${reminded} reminders sent | ${blocked} assignments withdrawn today`);
    } catch (err) {
        console.error("Review deadline monitor error:", err);
    }
};

// Reminder Email (48 hours pe)
const sendReminderEmail = async (manuscript, inv) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 8px;">
            <div style="background: #496580; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h2 style="margin: 0; font-size: 24px;">Review Reminder</h2>
            </div>
            <div style="padding: 30px; background: white; border-radius: 0 0 8px 8px;">
                <p style="font-size: 16px; color: #333; line-height: 1.6;">Dear Reviewer,</p>
                <p style="font-size: 16px; color: #333; line-height: 1.6;">
                    This is a reminder that you agreed to review the manuscript:
                </p>
                <h3 style="color: #496580; margin: 20px 0;">"${manuscript.title}"</h3>
                <p style="font-size: 16px; color: #333;">
                    <strong>Manuscript ID:</strong> ${manuscript.customId || manuscript._id}
                </p>
                <div style="background: #fff3cd; padding: 20px; border-left: 5px solid #ffc107; margin: 25px 0; border-radius: 4px;">
                    <p style="margin: 0; font-size: 16px; color: #856404;">
                        <strong>Important:</strong> Your review is due within the next <strong>24 hours</strong>.<br>
                        Please submit your report as soon as possible to avoid withdrawal of the assignment.
                    </p>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://synergyworldpress.com/reviewer/dashboard" 
                       style="background: #496580; color: white; padding: 15px 35px; font-size: 18px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                        Submit Your Review
                    </a>
                </div>
                <p style="font-size: 14px; color: #666;">
                    Thank you for your contribution.<br><strong>Synergy World Press Editorial Team</strong>
                </p>
            </div>
        </div>
    `;

    await sendEmail({
        to: inv.email,
        subject: `Review Reminder: 24 Hours Remaining – "${manuscript.title}"`,
        html
    });
};


const sendAccessRevokedEmail = async (manuscript, inv) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 8px;">
            <div style="background: #721c24; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h2 style="margin: 0; font-size: 24px;">Review Assignment Withdrawn</h2>
            </div>
            <div style="padding: 30px; background: white; border-radius: 0 0 8px 8px;">
                <p style="font-size: 16px; color: #333; line-height: 1.6;">Dear Reviewer,</p>
                <p style="font-size: 16px; color: #333; line-height: 1.6;">
                    Your review assignment for the manuscript has been withdrawn due to non-submission within the allocated time:
                </p>
                <h3 style="color: #721c24; margin: 20px 0;">"${manuscript.title}"</h3>
                <p style="font-size: 16px; color: #333;">
                    <strong>Manuscript ID:</strong> ${manuscript.customId || manuscript._id}
                </p>
                <div style="background: #f8d7da; padding: 20px; border-left: 5px solid #dc3545; margin: 25px 0; border-radius: 4px;">
                    <p style="margin: 0; font-size: 16px; color: #721c24;">
                        As per journal policy, assignments are automatically withdrawn after 72 hours of acceptance if the review is not submitted.
                    </p>
                </div>
                <p style="font-size: 16px; color: #333; line-height: 1.6;">
                    We value your expertise and hope to collaborate with you on future submissions.
                </p>
                <p style="font-size: 14px; color: #666;">
                    Best regards,<br><strong>Synergy World Press Editorial Office</strong>
                </p>
            </div>
        </div>
    `;

    await sendEmail({
        to: inv.email,
        subject: `Review Assignment Withdrawn – "${manuscript.title}"`,
        html
    });
};

module.exports = runStrictReviewDeadline;