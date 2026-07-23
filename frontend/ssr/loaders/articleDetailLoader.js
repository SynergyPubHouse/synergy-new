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
      `/api/manuscripts/${encodeURIComponent(routeId)}`,
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

  const articleData = body.data;
  const hasArticleId = [
    articleData?.customId,
    articleData?.custom_id,
    articleData?._id,
  ].some((value) => typeof value === "string" && value.trim());
  const hasArticleTitle =
    typeof articleData?.title === "string" && articleData.title.trim();

  if (
    !articleData ||
    typeof articleData !== "object" ||
    Array.isArray(articleData) ||
    !hasArticleId ||
    !hasArticleTitle
  ) {
    throw new BackendApiError(
      "Article API response is missing valid article data",
    );
  }

  return {
    status: 200,
    data: {
      article: sanitizeArticle(articleData),
    },
  };
}
