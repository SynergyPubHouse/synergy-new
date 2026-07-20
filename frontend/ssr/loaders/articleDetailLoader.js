import {
  BackendApiError,
  BackendNotFoundError,
  BackendValidationError,
} from "../apiClient.js";
import { sanitizeArticle } from "../publicArticle.js";

export async function loadArticleDetail({ apiClient, params }) {
  const routeId = params.id;
  let body;

  try {
    body = await apiClient.getJson(
      `/api/public/manuscripts/${encodeURIComponent(routeId)}`,
    );
  } catch (error) {
    if (
      error instanceof BackendNotFoundError ||
      error instanceof BackendValidationError
    ) {
      return {
        status: 404,
        data: {
          article: null,
        },
        error:
          error instanceof BackendValidationError
            ? "Invalid article URL."
            : "Article not found.",
      };
    }
    throw error;
  }

  if (!body.data || typeof body.data !== "object") {
    throw new BackendApiError(
      "Article API response is missing its article data",
    );
  }

  return {
    status: 200,
    data: {
      article: sanitizeArticle(body.data),
    },
  };
}
