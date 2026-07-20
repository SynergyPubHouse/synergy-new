import { loadArticleDetail } from "./loaders/articleDetailLoader.js";
import { loadCurrentIssue } from "./loaders/currentIssueLoader.js";

const STATIC_CACHE = "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400";
const CONTENT_CACHE = "public, max-age=0, s-maxage=300, stale-while-revalidate=1800";

function exactPath(path) {
  const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const expression = new RegExp(`^${escaped}/?$`);
  return (pathname) => (expression.test(pathname) ? {} : null);
}

export class InvalidSsrRouteError extends Error {
  constructor(message, options = {}) {
    super(message, options);
    this.name = "InvalidSsrRouteError";
    this.statusCode = 400;
  }
}

export const ssrRoutes = [
  {
    routeName: "journalRedirect",
    match: exactPath("/journal/jics"),
    redirectTo: "/journal/jics/about/overview",
    redirectStatus: 308,
  },
  {
    routeName: "home",
    match: exactPath("/"),
    cacheControl: STATIC_CACHE,
  },
  {
    routeName: "journalOverview",
    match: exactPath("/journal/jics/about/overview"),
    cacheControl: STATIC_CACHE,
  },
  {
    routeName: "journalEthics",
    match: exactPath("/journal/jics/authors/ethics"),
    cacheControl: STATIC_CACHE,
  },
  {
    routeName: "currentIssue",
    match: exactPath("/journal/jics/articles/current"),
    loader: loadCurrentIssue,
    cacheControl: CONTENT_CACHE,
  },
  {
    routeName: "articleDetail",
    match(pathname) {
      const match = pathname.match(/^\/journal\/jics\/articles\/([^/]+)\/?$/);
      if (!match) return null;

      try {
        const id = decodeURIComponent(match[1]).trim();
        if (!id) throw new InvalidSsrRouteError("Invalid article URL");
        return { id };
      } catch (error) {
        if (error instanceof InvalidSsrRouteError) throw error;
        throw new InvalidSsrRouteError("Invalid article URL", { cause: error });
      }
    },
    loader: loadArticleDetail,
    cacheControl: CONTENT_CACHE,
  },
];

export function matchSsrRoute(pathname) {
  for (const route of ssrRoutes) {
    const params = route.match(pathname);
    if (params !== null) return { ...route, params };
  }
  return null;
}
