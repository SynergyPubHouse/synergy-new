/**
 * Script to send historical certificates to reviewers who submitted reviews
 * before the monthly aggregated certificate system was implemented.
 * 
 * This script aggregates historical reviews by MONTH (e.g. one email for all Jan reviews).
 * 
 * Usage: 
 * 1. Set DRY_RUN = true to test without sending emails.
 * 2. Set DRY_RUN = false to actually send emails.
 * 3. Run with: node scripts/sendHistoricalCertificates.js
 */

const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const Manuscript = require('../models/Manuscript');
const Reviewer = require('../models/Reviewer');
const sendEmail = require('../utils/sendEmail');
const generateCertificatePdf = require('../utils/generateCertificatePdf');

// CONFIGURATION
const DRY_RUN = false; // 🔥 Set to false to actually send emails
const CUTOFF_DATE = new Date('2026-03-01');

const formatFullName = (user) => {
  if (!user) return "Valued Reviewer";
  const { firstName, middleName, lastName } = user;
  let fullName = firstName || "";
  if (middleName && middleName.trim() !== "") fullName += ` ${middleName}`;
  if (lastName) fullName += ` ${lastName}`;
  return fullName.trim() || "Valued Reviewer";
};

const getMonthName = (monthIndex) => {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return months[monthIndex];
};

async function run() {
  try {
    await connectDB();
    console.log('🚀 Starting Historical (Monthly Aggregated) Certificate Script...');
    if (DRY_RUN) console.log('⚠️  DRY RUN ENABLED - No emails will be sent.');

    const manuscripts = await Manuscript.find({
      invitations: {
        $elemMatch: {
          status: 'accepted',
          reviewSubmittedAt: { $ne: null, $lt: CUTOFF_DATE }
        }
      }
    }).lean();

    console.log(`🔍 Found ${manuscripts.length} manuscripts with historical reviews.`);

    // 1. Flatten and filter all historical reviews
    const allHistoricalReviews = [];
    for (const ms of manuscripts) {
      const historicalInvitations = ms.invitations.filter(inv =>
        inv.status === 'accepted' &&
        inv.reviewSubmittedAt &&
        new Date(inv.reviewSubmittedAt) < CUTOFF_DATE
      );

      for (const inv of historicalInvitations) {
        const date = new Date(inv.reviewSubmittedAt);

        // 🐛 DEBUG: Log raw email from invitation
        console.log(`  📧 Raw invitation email: "${inv.email}" | length: ${inv.email?.length} | lowercased: "${inv.email?.toLowerCase()}"`);

        allHistoricalReviews.push({
          reviewerEmail: inv.email.toLowerCase().trim(), // trim + lowercase for safety
          month: date.getMonth(),
          year: date.getFullYear(),
          manuscriptTitle: ms.title,
          submittedAt: date
        });
      }
    }

    console.log(`📊 Total historical reviews to process: ${allHistoricalReviews.length}`);

    // 2. Group reviews by Reviewer Email + Month + Year
    const groups = {};
    for (const review of allHistoricalReviews) {
      const key = `${review.reviewerEmail}_${review.year}_${review.month}`;
      if (!groups[key]) {
        groups[key] = {
          email: review.reviewerEmail,
          month: review.month,
          year: review.year,
          reviews: []
        };
      }
      groups[key].reviews.push(review);
    }

    const groupKeys = Object.keys(groups);
    console.log(`📦 Grouped into ${groupKeys.length} monthly certificates.`);

    let emailCount = 0;

    // 3. Process each group
    for (const key of groupKeys) {
      const group = groups[key];
      const monthName = getMonthName(group.month);

      console.log(`\n📄 Processing: ${group.email} | ${monthName} ${group.year} | Count: ${group.reviews.length}`);

      // 🐛 DEBUG: Log exact query being made
      console.log(`🔎 Looking up reviewer in DB with email: "${group.email}" (length: ${group.email.length})`);

      // Case-insensitive + trimmed email lookup
      let reviewer = await Reviewer.findOne({
        email: { $regex: new RegExp(`^${group.email.trim()}$`, 'i') }
      });

      // 🐛 DEBUG: Log result of DB lookup
      if (reviewer) {
        console.log(`✅ Reviewer found: firstName="${reviewer.firstName}", lastName="${reviewer.lastName}", dbEmail="${reviewer.email}"`);
      } else {
        console.log(`❌ Reviewer NOT found in DB for email: "${group.email}"`);

        // 🐛 DEBUG: Try a loose search to see what's in the DB near this email
        const loosMatch = await Reviewer.findOne({
          email: { $regex: group.email.split('@')[0], $options: 'i' }
        });
        if (loosMatch) {
          console.log(`🔍 Loose match found: "${loosMatch.email}" — possible mismatch!`);
        } else {
          console.log(`🔍 No loose match found either — reviewer may not exist in Reviewer collection.`);
        }
      }

      const reviewerName = reviewer ? formatFullName(reviewer) : "Valued Reviewer";
      console.log(`👤 Reviewer name to use on certificate: "${reviewerName}"`);

      if (!DRY_RUN) {
        try {
          const pdfBuffer = await generateCertificatePdf({
            reviewerName,
            date: new Date(group.year, group.month, 1),
            reviewCount: group.reviews.length
          });

          await sendEmail({
            to: group.email,
            subject: `Monthly Certificate of Reviewing (${monthName} ${group.year}) – JICS`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #1a3a6e 0%, #2563EB 100%); color: white; padding: 25px; text-align: center;">
                  <h1 style="margin: 0; font-size: 22px;">🎓 Monthly Certificate of Reviewing</h1>
                </div>
                <div style="padding: 25px;">
                  <p style="color: #374151; font-size: 15px;">Dear ${reviewerName},</p>
                  <p style="color: #374151; font-size: 15px;">
                    Thank you for your valuable contribution as a Reviewer in the <strong>Journal of Intelligent Computing System (JICS)</strong>.
                  </p>
                  <p style="color: #374151; font-size: 15px;">
                    During <strong>${monthName} ${group.year}</strong>, you successfully reviewed <strong>${group.reviews.length}</strong> manuscript(s).
                  </p>
                  <p style="color: #374151; font-size: 15px;">
                    Please find your aggregated Monthly Certificate of Reviewing attached to this email.
                  </p>
                  <p style="color: #6B7280; font-size: 13px; margin-top: 30px;">
                    Warm regards,<br/>The Editorial Team<br/>Synergy World Press
                  </p>
                </div>
              </div>
            `,
            attachments: [
              {
                filename: `Certificate_of_Reviewing_${monthName}_${group.year}.pdf`,
                content: pdfBuffer,
                contentType: "application/pdf",
              },
            ],
          });
          emailCount++;
          console.log(`✅ Email sent to ${group.email}`);
        } catch (err) {
          console.error(`❌ Failed to send to ${group.email}:`, err.message);
        }
      } else {
        console.log(`📝 [DRY RUN] Would send ${monthName} ${group.year} certificate (${group.reviews.length} reviews) to ${group.email}`);
        emailCount++;
      }
    }

    console.log('\n--- Summary ---');
    console.log(`Total monthly certificates ${DRY_RUN ? 'would have been sent' : 'sent'}: ${emailCount}`);
    console.log('--- Done ---');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error in script:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

run();