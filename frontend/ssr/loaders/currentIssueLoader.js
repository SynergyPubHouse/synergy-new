import { BackendApiError, BackendNotFoundError } from "../apiClient.js";
import { sanitizeArticle } from "../publicArticle.js";

export async function loadCurrentIssue({ apiClient }) {
  let body;

  try {
    body = await apiClient.getJson("/api/manuscripts/issues/current");
  } catch (error) {
    if (error instanceof BackendNotFoundError) {
      return {
        status: 404,
        data: { issue: null, articles: [] },
        error: "No published current issue found.",
      };
    }
    throw error;
  }

  if (!Array.isArray(body.articles)) {
    throw new BackendApiError(
      "Current issue API response is missing its articles array",
    );
  }

  return {
    status: 200,
    data: {
      issue: body.issue || null,
      articles: body.articles.map(sanitizeArticle).filter(Boolean),
    },
  };
}
