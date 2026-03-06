

const Manuscript = require('../models/Manuscript');
const sendEmail = require('../utils/sendEmail');

const runStrictReviewDeadline = async () => {


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

                if (minutesSinceAccept >= 1440 && !inv.reviewReminderSentAt) {
                    await sendReminderEmail(manuscript, inv);
                    inv.reviewReminderSentAt = now;
                    reminded++;           // ✅ add this
                    saveNeeded = true;
                }

                if (minutesSinceAccept >= 7200 && !inv.isReviewBlocked) {
                    await sendAccessRevokedEmail(manuscript, inv);
                    inv.isReviewBlocked = true;
                    inv.reviewBlockedAt = now;
                    inv.status = "expired";
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


const sendReminderEmail = async (manuscript, inv) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 8px;">
            <div style="background: #496580; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h2 style="margin: 0; font-size: 24px;">Review Reminder</h2>
            </div>
            <div style="padding: 30px; background: white; border-radius: 0 0 8px 8px;">
                <p style="font-size: 16px; color: #333; line-height: 1.6;">Dear Reviewer,</p>
                <p style="font-size: 16px; color: #333; line-height: 1.6;">
                    This is a friendly reminder that you agreed to review the manuscript:
                </p>
                <h3 style="color: #496580; margin: 20px 0;">"${manuscript.title}"</h3>
                <p style="font-size: 16px; color: #333;">
                    <strong>Manuscript ID:</strong> ${manuscript.customId || manuscript._id}
                </p>
                <div style="background: #fff3cd; padding: 20px; border-left: 5px solid #ffc107; margin: 25px 0; border-radius: 4px;">
                    <p style="margin: 0; font-size: 16px; color: #856404;">
                        <strong>Important:</strong> You have <strong>4 days remaining</strong> to submit your review.<br><br>
                        Total deadline is <strong>5 days</strong> from the date of acceptance.<br>
                        Please submit your report before the deadline to avoid automatic withdrawal.
                    </p>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://synergyworldpress.com/reviewer/dashboard" 
                       style="background: #496580; color: white; padding: 15px 35px; font-size: 18px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                        Submit Your Review Now
                    </a>
                </div>
                <p style="font-size: 14px; color: #666;">
                    Thank you for your valuable contribution.<br>
                    <strong>Synergy World Press Editorial Team</strong>
                </p>
            </div>
        </div>
    `;

    await sendEmail({
        to: inv.email,
        bcc: 'synergyworldpress@gmail.com',
        subject: `Review Reminder: 4 Days Left  – "${manuscript.title}"`,
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
                    Unfortunately, your review assignment for the following manuscript has been automatically withdrawn:
                </p>
                <h3 style="color: #721c24; margin: 20px 0;">"${manuscript.title}"</h3>
                <p style="font-size: 16px; color: #333;">
                    <strong>Manuscript ID:</strong> ${manuscript.customId || manuscript._id}
                </p>
                <div style="background: #f8d7da; padding: 20px; border-left: 5px solid #dc3545; margin: 25px 0; border-radius: 4px;">
                    <p style="margin: 0; font-size: 16px; color: #721c24;">
                        As per journal policy, review assignments are automatically withdrawn after <strong>5 days</strong> of acceptance if the review is not submitted.
                    </p>
                </div>
                <p style="font-size: 16px; color: #333; line-height: 1.6;">
                    We truly value your expertise and hope to collaborate with you on future submissions.
                </p>
                <p style="font-size: 14px; color: #666;">
                    Best regards,<br><strong>Synergy World Press Editorial Office</strong>
                </p>
            </div>
        </div>
    `;

    await sendEmail({
        to: inv.email,
        bcc: 'synergyworldpress@gmail.com',
        subject: `Review Assignment Withdrawn – "${manuscript.title}"`,
        html
    });
};

module.exports = runStrictReviewDeadline;