function sanitizePerson(person) {
  if (!person || typeof person !== "object") return null;

  return {
    _id: person._id,
    firstName: person.firstName,
    middleName: person.middleName,
    lastName: person.lastName,
  };
}

export function sanitizeArticle(article) {
  if (!article || typeof article !== "object") return null;

  return {
    _id: article._id,
    customId: article.customId,
    custom_id: article.custom_id,
    title: article.title,
    type: article.type,
    status: article.status,
    abstract: article.abstract,
    keywords: article.keywords,
    classification: article.classification,
    additionalInfo: article.additionalInfo,
    ...(Array.isArray(article.authors)
      ? { authors: article.authors.map(sanitizePerson).filter(Boolean) }
      : {}),
    ...(article.correspondingAuthor
      ? { correspondingAuthor: sanitizePerson(article.correspondingAuthor) }
      : {}),
    pdfAuthors: Array.isArray(article.pdfAuthors) ? article.pdfAuthors : [],
    pdfCorrespondingAuthor: article.pdfCorrespondingAuthor,
    submissionDate: article.submissionDate,
    publishedAt: article.publishedAt,
    updatedAt: article.updatedAt,
    issueVolume: article.issueVolume,
    issueNumber: article.issueNumber,
    issueYear: article.issueYear,
    issueTitle: article.issueTitle,
    pageStart: article.pageStart,
    pageEnd: article.pageEnd,
    section: article.section,
    publishedFileUrl: article.publishedFileUrl,
    doi: article.doi,
    viewCount: article.viewCount,
    citationCount: article.citationCount,
    separateIssue: Boolean(article.separateIssue),
  };
}
