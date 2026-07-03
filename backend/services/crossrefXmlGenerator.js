function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function dateParts(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;
  return {
    year: String(date.getUTCFullYear()),
    month: String(date.getUTCMonth() + 1).padStart(2, "0"),
    day: String(date.getUTCDate()).padStart(2, "0"),
  };
}

function renderPublicationDate(dateString) {
  const parts = dateParts(dateString);
  if (!parts) return "";
  return [
    '<publication_date media_type="online">',
    `<month>${parts.month}</month>`,
    `<day>${parts.day}</day>`,
    `<year>${parts.year}</year>`,
    "</publication_date>",
  ].join("");
}

function renderContributors(authors) {
  if (!Array.isArray(authors) || authors.length === 0) return "";

  const people = authors
    .map((author, index) => {
      const sequence = index === 0 ? "first" : "additional";
      const givenName = author.givenName
        ? `<given_name>${escapeXml(author.givenName)}</given_name>`
        : "";
      const surname = `<surname>${escapeXml(
        author.familyName || author.fullName,
      )}</surname>`;
      const orcid = author.orcid
        ? `<ORCID authenticated="false">${escapeXml(author.orcid)}</ORCID>`
        : "";
      const affiliations = (author.affiliations || [])
        .filter(Boolean)
        .map(
          (affiliation) =>
            `<affiliation>${escapeXml(affiliation)}</affiliation>`,
        )
        .join("");

      return `<person_name contributor_role="author" sequence="${sequence}">${givenName}${surname}${orcid}${affiliations}</person_name>`;
    })
    .join("");

  return `<contributors>${people}</contributors>`;
}

function renderPages(snapshot) {
  if (snapshot.firstPage) {
    return [
      "<pages>",
      `<first_page>${escapeXml(snapshot.firstPage)}</first_page>`,
      snapshot.lastPage
        ? `<last_page>${escapeXml(snapshot.lastPage)}</last_page>`
        : "",
      "</pages>",
    ].join("");
  }

  return "";
}

function renderPublisherItem(snapshot) {
  if (!snapshot.articleNumber) return "";

  return `<publisher_item><item_number item_number_type="article-number">${escapeXml(snapshot.articleNumber)}</item_number></publisher_item>`;
}

function renderAbstract(abstract) {
  if (!abstract) return "";

  return `<jats:abstract><jats:p>${escapeXml(abstract)}</jats:p></jats:abstract>`;
}

function renderIssue(snapshot) {
  if (!snapshot.volume && !snapshot.issue && !snapshot.issueTitle) return "";

  return [
    "<journal_issue>",
    renderPublicationDate(snapshot.publicationDate),
    snapshot.issueTitle
      ? `<titles><title>${escapeXml(snapshot.issueTitle)}</title></titles>`
      : "",
    snapshot.volume
      ? `<journal_volume><volume>${escapeXml(snapshot.volume)}</volume></journal_volume>`
      : "",
    snapshot.issue ? `<issue>${escapeXml(snapshot.issue)}</issue>` : "",
    "</journal_issue>",
  ].join("");
}

function generateCrossrefXml(snapshot, { batchId, depositorName, depositorEmail }) {
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:.TZ]/g, "")
    .slice(0, 14);

  return `<?xml version="1.0" encoding="UTF-8"?>
<doi_batch xmlns="http://www.crossref.org/schema/5.4.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:jats="http://www.ncbi.nlm.nih.gov/JATS1" version="5.4.0" xsi:schemaLocation="http://www.crossref.org/schema/5.4.0 https://www.crossref.org/schemas/crossref5.4.0.xsd">
  <head>
    <doi_batch_id>${escapeXml(batchId)}</doi_batch_id>
    <timestamp>${timestamp}</timestamp>
    <depositor>
      <depositor_name>${escapeXml(depositorName)}</depositor_name>
      <email_address>${escapeXml(depositorEmail)}</email_address>
    </depositor>
    <registrant>${escapeXml(depositorName)}</registrant>
  </head>
  <body>
    <journal>
      <journal_metadata language="en">
        <full_title>${escapeXml(snapshot.journalTitle)}</full_title>
        ${
          snapshot.journalAbbreviation
            ? `<abbrev_title>${escapeXml(snapshot.journalAbbreviation)}</abbrev_title>`
            : ""
        }
        <issn media_type="${escapeXml(snapshot.issnMediaType)}">${escapeXml(snapshot.issn)}</issn>
      </journal_metadata>
      ${renderIssue(snapshot)}
      <journal_article publication_type="full_text">
        <titles>
          <title>${escapeXml(snapshot.title)}</title>
        </titles>
        ${renderContributors(snapshot.authors)}
        ${renderAbstract(snapshot.abstract)}
        ${renderPublicationDate(snapshot.publicationDate)}
        ${renderPages(snapshot)}
        ${renderPublisherItem(snapshot)}
        <doi_data>
          <doi>${escapeXml(snapshot.doi)}</doi>
          <resource>${escapeXml(snapshot.crossrefResourceUrl)}</resource>
        </doi_data>
      </journal_article>
    </journal>
  </body>
</doi_batch>`;
}

module.exports = {
  escapeXml,
  generateCrossrefXml,
};
