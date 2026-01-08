// jobs/invitationExpiryJob.js

const Manuscript = require('../models/Manuscript');
const sendEmail = require('../utils/sendEmail');

const runInvitationExpiryJob = async () => {
    console.log("Running Invitation Reminder + Auto Expire Job...");

    const now = new Date();
    let reminded = 0;
    let expired = 0;
    let expiryEmailsSent = 0;

    try {
        const manuscripts = await Manuscript.find({
            "invitations.status": "pending"
        });

        for (const manuscript of manuscripts) {
            let needSave = false;

            for (const inv of manuscript.invitations) {
                if (inv.status !== "pending") continue;

              
                const minutesSinceInvite = (now - new Date(inv.invitedAt)) / (1000 * 60);

                
                if (minutesSinceInvite >= 1440 && minutesSinceInvite < 2880 && !inv.remindedAt) {
                    await sendFinalReminder(manuscript, inv);
                    inv.remindedAt = now;
                    reminded++;
                    needSave = true;
                }

                
                if (minutesSinceInvite >= 2880 && !inv.expiredAt) {
                    inv.status = "expired";
                    inv.expiredAt = now;
                    expired++;
                    needSave = true;

                   
                    try {
                        await sendExpiryNotification(manuscript, inv);
                        expiryEmailsSent++;
                        console.log(`Expiry email sent to ${inv.email}`);
                    } catch (err) {
                        console.error(`Failed to send expiry email to ${inv.email}:`, err.message);
                    }
                }
            }

            if (needSave) {
                await manuscript.save();
            }
        }

        console.log(`Job Done → ${reminded} reminders | ${expired} expired | ${expiryEmailsSent} expiry emails sent`);
    } catch (err) {
        console.error("Invitation expiry job failed:", err);
    }
};


const sendFinalReminder = async (manuscript, inv) => {
    const html = `
       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
          <div style="background: #f8f9fa; padding: 25px; text-align: center; border-bottom: 1px solid #e9ecef;">
            <h2 style="margin: 0; color: #2c3e50; font-size: 24px; font-weight: 600;">Final Reminder: Review Invitation</h2>
            <p style="margin: 10px 0 0; color: #e74c3c; font-size: 18px; font-weight: 500;">Only 24 Hours Remaining</p>
          </div>
          <div style="padding: 35px 40px; color: #2c3e50; line-height: 1.7;">
            <p>Dear Reviewer,</p>
            <p>This is a final reminder about your pending review invitation for the following manuscript:</p>
            <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #3498db; border-radius: 0 8px 8px 0; margin: 25px 0;">
              <h3 style="margin: 0 0 8px 0; color: #2c3e50;">"${manuscript.title}"</h3>
              <p style="margin: 0; color: #555;"><strong>Manuscript ID:</strong> ${manuscript.customId || manuscript._id}</p>
            </div>
            <div style="background: #fff4f4; border: 1px solid #f5c6cb; padding: 20px; border-radius: 8px; margin: 30px 0;">
              <p style="margin: 0; color: #721c24; text-align: center;">
                This invitation will <strong>automatically expire in 24 hours</strong>.<br>
                After that, you will no longer be able to accept this review assignment.
              </p>
            </div>
            <div style="text-align: center; margin: 40px 0;">
              <a href="https://synergyworldpress.com/login" style="display: inline-block; background: #3498db; color: white; padding: 16px 40px; font-size: 18px; font-weight: 600; text-decoration: none; border-radius: 8px;">
                Accept Invitation Now
              </a>
            </div>
            <div style="margin-top: 40px; padding-top: 25px; border-top: 1px solid #e9ecef; text-align: center; color: #7f8c8d; font-size: 14px;">
              <p>Thank you for your contribution to scholarly publishing.</p>
              <p><strong>Synergy World Press Editorial Office</strong></p>
            </div>
          </div>
       </div>
    `;

    await sendEmail({
        to: inv.email,
          bcc: 'synergyworldpress@gmail.com', 
        subject: `LAST CHANCE: Review Invitation Expires in 24 Hours – ${manuscript.title}`,
        html
    });
};

const sendExpiryNotification = async (manuscript, inv) => {
    const html = `
       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
          <div style="background: #f8f9fa; padding: 25px; text-align: center; border-bottom: 1px solid #e9ecef;">
            <h2 style="margin: 0; color: #2c3e50; font-size: 24px; font-weight: 600;">Review Invitation Expired</h2>
            <p style="margin: 10px 0 0; color: #e74c3c; font-size: 18px; font-weight: 500;">This opportunity is no longer available</p>
          </div>
          <div style="padding: 35px 40px; color: #2c3e50; line-height: 1.7;">
            <p>Dear Reviewer,</p>
            <p>The review invitation for the following manuscript has now <strong>expired</strong> as it was not accepted within 48 hours:</p>
            <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #e74c3c; border-radius: 0 8px 8px 0; margin: 25px 0;">
              <h3 style="margin: 0 0 8px 0; color: #2c3e50;">"${manuscript.title}"</h3>
              <p style="margin: 0; color: #555;"><strong>Manuscript ID:</strong> ${manuscript.customId || manuscript._id}</p>
            </div>
            <div style="background: #fef5f5; border: 1px solid #fccece; padding: 20px; border-radius: 8px; margin: 30px 0;">
              <p style="margin: 0; color: #a02c2c; text-align: center;">
                ⛔ This invitation has been automatically closed.<br>
                You can no longer accept this review assignment.
              </p>
            </div>
            <p>We appreciate your willingness to contribute to scholarly peer review and hope to work with you on future manuscripts.</p>
            <div style="margin-top: 40px; padding-top: 25px; border-top: 1px solid #e9ecef; text-align: center; color: #7f8c8d; font-size: 14px;">
              <p>Thank you for your continued support.</p>
              <p><strong>Synergy World Press Editorial Office</strong></p>
            </div>
          </div>
       </div>
    `;

    await sendEmail({
        to: inv.email,
          bcc: 'synergyworldpress@gmail.com', 
        subject: `Review Invitation Expired – ${manuscript.title}`,
        html
    });
};

module.exports = runInvitationExpiryJob;