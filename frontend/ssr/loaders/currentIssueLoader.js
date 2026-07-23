import { BackendApiError } from "../apiClient.js";
import { sanitizeArticle } from "../publicArticle.js";

function positiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function publicationTimestamp(article) {
  for (const value of [
    article.publishedAt,
    article.publishedDate,
    article.publicationDate,
  ]) {
    const timestamp = Date.parse(value);
    if (Number.isFinite(timestamp)) {
      return timestamp;
    }
  }
  return 0;
}

function isValidPublishedArticle(article) {
  if (!article || typeof article !== "object" || Array.isArray(article)) {
    return false;
  }

  const articleId = article.customId || article.custom_id || article._id;
  return (
    article.status === "Published" &&
    typeof articleId === "string" &&
    Boolean(articleId.trim()) &&
    typeof article.title === "string" &&
    Boolean(article.title.trim())
  );
}

function getIssueDetails(article) {
  const volume = positiveNumber(article.issueVolume ?? article.volume);
  const issue = positiveNumber(article.issueNumber ?? article.issue);

  if (volume === null || issue === null) {
    return null;
  }

  const publishedAt = publicationTimestamp(article);
  const explicitYear = positiveNumber(article.issueYear ?? article.year);
  const year =
    explicitYear ||
    (publishedAt ? new Date(publishedAt).getUTCFullYear() : null);

  return {
    volume,
    issue,
    year,
    publishedAt,
    title:
      typeof article.issueTitle === "string" ? article.issueTitle.trim() : "",
  };
}

export async function loadCurrentIssue({ apiClient }) {
  const body = await apiClient.getJson("/api/manuscripts/published");
  const articles = Array.isArray(body?.data) ? body.data : [];
  const publishedArticles = articles.filter(isValidPublishedArticle);

  if (publishedArticles.length === 0) {
    return {
      status: 404,
      data: { issue: null, articles: [] },
      error: "No published current issue found.",
    };
  }

  const issueGroups = new Map();

  for (const article of publishedArticles) {
    const details = getIssueDetails(article);
    if (!details) continue;

    const key = `${details.volume}:${details.issue}`;
    const group = issueGroups.get(key) || {
      volume: details.volume,
      issue: details.issue,
      year: details.year,
      title: details.title,
      latestPublication: details.publishedAt,
      articles: [],
    };

    group.year = Math.max(group.year || 0, details.year || 0) || null;
    group.title ||= details.title;
    group.latestPublication = Math.max(
      group.latestPublication,
      details.publishedAt,
    );
    group.articles.push(
      sanitizeArticle({
        ...article,
        issueVolume: details.volume,
        issueNumber: details.issue,
        issueYear: details.year,
        publishedAt:
          article.publishedAt ||
          article.publishedDate ||
          article.publicationDate,
      }),
    );
    issueGroups.set(key, group);
  }

  const latestIssue = [...issueGroups.values()].sort(
    (left, right) =>
      right.volume - left.volume ||
      right.issue - left.issue ||
      right.latestPublication - left.latestPublication,
  )[0];

  if (!latestIssue) {
    throw new BackendApiError(
      "Published manuscripts are missing numeric volume and issue data",
    );
  }

  const title = latestIssue.title || "Current Issue";
  const yearSuffix = latestIssue.year ? ` • ${latestIssue.year}` : "";

  return {
    status: 200,
    data: {
      issue: {
        volume: latestIssue.volume,
        issue: latestIssue.issue,
        year: latestIssue.year,
        title,
        issueNumber: latestIssue.issue,
        label: `Vol. ${latestIssue.volume}, Issue ${latestIssue.issue}${yearSuffix}`,
      },
      articles: latestIssue.articles.filter(Boolean),
    },
    error: null,
  };
}
