// jobs/invitationExpiryJob.js
const Manuscript = require('../models/Manuscript');
const sendEmail = require('../utils/sendEmail');

const runInvitationExpiryJob = async () => {
    console.log("Running Invitation Reminder + Auto Expire Job...");

    const now = new Date();
    let reminded = 0;
    let expired = 0;

    try {
        const manuscripts = await Manuscript.find({
            "invitations.status": "pending"
        });

        for (const manuscript of manuscripts) {
            let needSave = false;

            for (const inv of manuscript.invitations) {
                if (inv.status !== "pending") continue;

                const hoursSinceInvite = (now - new Date(inv.invitedAt)) / (1000 * 60 * 60);

                // Reminder exactly at 48 hours (if not sent yet)
                if (hoursSinceInvite >= 47.5 && hoursSinceInvite < 50 && !inv.remindedAt) {
                    await sendFinalReminder(manuscript, inv);
                    inv.remindedAt = now;
                    reminded++;
                    needSave = true;
                }

                // Auto Expire after 72 hours
                if (hoursSinceInvite >= 72 && (!inv.expiredAt)) {
                    inv.status = "expired";
                    inv.expiredAt = now;
                    expired++;
                    needSave = true;
                }
            }

            if (needSave) {
                await manuscript.save();
            }
        }

        console.log(`Job Done → ${reminded} reminders sent, ${expired} invitations expired today.`);
    } catch (err) {
        console.error("Invitation expiry job failed:", err);
    }
};


const sendFinalReminder = async (manuscript, inv) => {
    const html = `
       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">

  <!-- Header -->
  <div style="background: #f8f9fa; padding: 25px; text-align: center; border-bottom: 1px solid #e9ecef;">
    <h2 style="margin: 0; color: #2c3e50; font-size: 24px; font-weight: 600;">
      Final Reminder: Review Invitation
    </h2>
    <p style="margin: 10px 0 0; color: #e74c3c; font-size: 18px; font-weight: 500;">
      Only 24 Hours Remaining
    </p>
  </div>

  <!-- Body -->
  <div style="padding: 35px 40px; color: #2c3e50; line-height: 1.7;">
    <p style="margin: 0 0 20px 0; font-size: 16px;">
      Dear Reviewer,
    </p>
    
    <p style="margin: 0 0 25px 0; font-size: 16px;">
      This is a final reminder about your pending review invitation for the following manuscript:
    </p>

    <!-- Manuscript Info -->
    <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #3498db; border-radius: 0 8px 8px 0; margin: 25px 0;">
      <h3 style="margin: 0 0 8px 0; color: #2c3e50; font-size: 20px;">
        "${manuscript.title}"
      </h3>
      <p style="margin: 0; color: #555; font-size: 15px;">
        <strong>Manuscript ID:</strong> ${manuscript.customId || manuscript._id}
      </p>
    </div>

    <!-- Warning Message -->
    <div style="background: #fff4f4; border: 1px solid #f5c6cb; padding: 20px; border-radius: 8px; margin: 30px 0;">
      <p style="margin: 0; color: #721c24; font-size: 16px; font-weight: 500; text-align: center;">
        This invitation will <strong>automatically expire in 24 hours</strong>.<br>
        After that, you will no longer be able to accept this review assignment.
      </p>
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 40px 0;">
      <a href="https://synergyworldpress.com/login" 
         style="display: inline-block; background: #3498db; color: white; padding: 16px 40px; font-size: 18px; font-weight: 600; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 15px rgba(52,152,219,0.3);">
        Accept Invitation Now
      </a>
    </div>

    <!-- Footer -->
    <div style="margin-top: 40px; padding-top: 25px; border-top: 1px solid #e9ecef; text-align: center; color: #7f8c8d; font-size: 14px;">
      <p style="margin: 0;">
        Thank you for your contribution to scholarly publishing.
      </p>
      <p style="margin: 8px 0 0 0;">
        <strong>Synergy World Press Editorial Office</strong>
      </p>
    </div>
  </div>
</div>
    `;

    await sendEmail({
        to: inv.email,
        subject: `LAST CHANCE: Review Invitation Expires in 24 Hours – ${manuscript.title}`,
        html
    });
};

module.exports = runInvitationExpiryJob;