// certificateHelper.js

function isCertificateAvailable(addedAt) {
  if (!addedAt) return false;
  const reviewDate = new Date(addedAt);
  const now = new Date();
  // Certificate available from 1st of next month onwards
  // e.g. reviewed in Jan 2026 → available from Feb 1 2026
  const availableFrom = new Date(
    reviewDate.getFullYear(),
    reviewDate.getMonth() + 1, // next month
    1, // 1st
  );
  return now >= availableFrom;
}

function getCertificateMonth(addedAt) {
  // Returns the month name + year to print on certificate
  // e.g. "January 2026"
  return new Date(addedAt).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
}

module.exports = { isCertificateAvailable, getCertificateMonth };
