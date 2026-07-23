import { sanitizeArticle } from "../publicArticle.js";

function getArticleTimestamp(article) {
  for (const value of [
    article.publishedAt,
    article.publishedDate,
    article.publicationDate,
    article.submissionDate,
    article.updatedAt,
  ]) {
    const timestamp = Date.parse(value);
    if (Number.isFinite(timestamp)) return timestamp;
  }
  return 0;
}

function normalizeArticle(article) {
  return sanitizeArticle({
    ...article,
    issueVolume: article.issueVolume ?? article.volume,
    issueNumber: article.issueNumber ?? article.issue,
    issueYear: article.issueYear ?? article.year,
    publishedAt:
      article.publishedAt ||
      article.publishedDate ||
      article.publicationDate,
  });
}

export async function loadPastIssues({ apiClient }) {
  const body = await apiClient.getJson("/api/manuscripts/published");
  const articles = Array.isArray(body?.data) ? body.data : [];
  const now = new Date();
  const currentIssueStart = Date.UTC(
    now.getUTCFullYear(),
    Math.floor(now.getUTCMonth() / 4) * 4,
    1,
  );

  const pastArticles = articles
    .filter(
      (article) =>
        article &&
        typeof article === "object" &&
        !Array.isArray(article) &&
        article.status === "Published" &&
        getArticleTimestamp(article) < currentIssueStart,
    )
    .map(normalizeArticle)
    .filter(Boolean)
    .sort(
      (left, right) =>
        Number(right.issueYear || 0) - Number(left.issueYear || 0) ||
        Number(right.issueVolume || 0) - Number(left.issueVolume || 0) ||
        Number(right.issueNumber || 0) - Number(left.issueNumber || 0) ||
        Number(left.pageStart || 0) - Number(right.pageStart || 0) ||
        getArticleTimestamp(right) - getArticleTimestamp(left),
    );

  return {
    status: 200,
    data: {
      issue: null,
      articles: pastArticles,
    },
    error: null,
  };
}
