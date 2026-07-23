import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../App";
import PropTypes from "prop-types";
import PageMetadata from "../components/PageMetadata";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const ISSUE_START_YEAR = 2026;

const getIssueWindow = (date = new Date()) => {
  const year = date.getFullYear();
  const startMonth = Math.floor(date.getMonth() / 4) * 4;
  const endMonth = startMonth + 3;
  const issueNumber = Math.floor(startMonth / 4) + 1;
  const volume = Math.max(1, year - ISSUE_START_YEAR + 1);
  const rangeLabel = `${MONTH_NAMES[startMonth]}-${MONTH_NAMES[endMonth]} ${year}`;

  return {
    startDate: new Date(year, startMonth, 1),
    endDate: new Date(year, startMonth + 4, 1),
    label: `Vol. ${volume}, Issue ${issueNumber} • ${rangeLabel}`,
    rangeLabel,
  };
};

const getArticleIssueDate = (article) => {
  const rawDate = article?.publishedAt || article?.submissionDate || article?.updatedAt;
  if (!rawDate) return null;

  const date = new Date(rawDate);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getPageStart = (article) => {
  if (article && article.pageStart !== null && article.pageStart !== undefined) {
    const page = Number(article.pageStart);
    if (!Number.isNaN(page)) return page;
  }
  return null;
};

const getIssueKey = (article) => {
  if (
    article.issueYear != null &&
    article.issueVolume != null &&
    article.issueNumber != null
  ) {
    return `year-${article.issueYear}-volume-${article.issueVolume}-issue-${article.issueNumber}`;
  }

  const date = getArticleIssueDate(article);
  if (date) {
    return `legacy-${getIssueWindow(date).label}`;
  }

  return "unassigned-issue";
};

const sortArticles = (articles, archive) => {
  if (archive) {
    // 1. Sort all articles by issue date descending to keep the overall issue order (newest issues first)
    const initialSorted = [...articles].sort((a, b) => {
      return (getArticleIssueDate(b)?.getTime() || 0) - (getArticleIssueDate(a)?.getTime() || 0);
    });

    // 2. Group articles by their respective issues
    const issueGroups = {};
    const issueOrder = [];

    for (const article of initialSorted) {
      const key = getIssueKey(article);
      if (!issueGroups[key]) {
        issueGroups[key] = [];
        issueOrder.push(key);
      }
      issueGroups[key].push(article);
    }

    // 3. Sort articles inside each issue by starting page ascending (using stable sort)
    const sortedResult = [];
    for (const key of issueOrder) {
      const group = issueGroups[key];
      const sortedGroup = [...group].map((item, index) => ({ item, index }))
        .sort((a, b) => {
          const pageA = getPageStart(a.item);
          const pageB = getPageStart(b.item);

          if (pageA !== null && pageB !== null) {
            if (pageA !== pageB) return pageA - pageB;
          } else if (pageA !== null && pageB === null) {
            return -1;
          } else if (pageA === null && pageB !== null) {
            return 1;
          }
          return a.index - b.index; // Stable sort fallback to preserve original order
        })
        .map(x => x.item);

      sortedResult.push(...sortedGroup);
    }

    return sortedResult;
  }

  // Current Issue page sorting (unaffected)
  return [...articles].sort((a, b) => {
    const aPage = a.pageStart;
    const bPage = b.pageStart;

    if (aPage != null && bPage != null) return aPage - bPage;
    if (aPage != null && bPage == null) return -1;
    if (aPage == null && bPage != null) return 1;
    return (getArticleIssueDate(b)?.getTime() || 0) - (getArticleIssueDate(a)?.getTime() || 0);
  });
};

const filterArticlesByIssueWindow = (articles, archive) => {
  const issueWindow = getIssueWindow();

  return sortArticles(
    articles.filter((article) => {
      const issueDate = getArticleIssueDate(article);
      if (!issueDate) return archive;

      return archive
        ? issueDate < issueWindow.startDate
        : issueDate >= issueWindow.startDate && issueDate < issueWindow.endDate;
    }),
    archive,
  );
};

const getArticleUrlId = (article) => article?.customId || article?.custom_id || article?._id;

const getArticlePath = (article, fromArchives = false) => {
  const articleUrlId = getArticleUrlId(article);
  const articlePath = articleUrlId
    ? `/journal/jics/articles/${encodeURIComponent(articleUrlId)}`
    : "/journal/jics/articles/current";
  return fromArchives ? `${articlePath}?from=archives` : articlePath;
};

const CurrentIssue = ({ separateIssue = false, archive = false, initialData = null }) => {
  const hasMatchingSsrRoute =
    (!separateIssue &&
      !archive &&
      initialData?.routeName === "currentIssue") ||
    (archive && initialData?.routeName === "pastIssues");
  const ssrData = hasMatchingSsrRoute ? initialData.data : null;
  const { user, loading: authLoading } = useAuth();
  const [articles, setArticles] = useState(() =>
    Array.isArray(ssrData?.articles) ? ssrData.articles : [],
  );
  const [issue, setIssue] = useState(() =>
    ssrData?.issue || null,
  );
  const [loading, setLoading] = useState(!hasMatchingSsrRoute);
  const [error, setError] = useState(() =>
    hasMatchingSsrRoute ? initialData?.error || "" : "",
  );
  const navigate = useNavigate();
  const issueWindow = getIssueWindow();
  const pageTitle = separateIssue
    ? "Special Issue"
    : archive
      ? "Past Issues / Archives"
      : issue
        ? `Current Issue — Volume ${issue.volume}, Issue ${issue.issueNumber} (${issue.year})`
        : "Current Issue";
  const emptyMessage = separateIssue
    ? "No special issue articles available."
    : archive
      ? "No past issue articles available."
    : "No current issues available.";
  const issueLabel = separateIssue
    ? "Special Issue"
    : archive
      ? `Before ${issueWindow.rangeLabel}`
      : issue?.label || "Current Issue";

  useEffect(() => {
    if (hasMatchingSsrRoute) {
      return;
    }

    const fetchIssueArticles = async () => {
      try {
        setLoading(true);
        setError("");
        const endpoint = separateIssue
          ? "/api/manuscripts/special-issue"
          : archive
            ? "/api/manuscripts/published"
            : "/api/manuscripts/issues/current";
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}${endpoint}`
        );

        if (!separateIssue && !archive && Array.isArray(res.data?.articles)) {
          setArticles(res.data.articles);
          setIssue(res.data.issue || null);
        } else if (res.data && res.data.data) {
          const data = Array.isArray(res.data.data) ? res.data.data : [res.data.data];
          setArticles(separateIssue ? data : filterArticlesByIssueWindow(data, archive));
        } else {
          setError(emptyMessage);
        }
      } catch (err) {
        console.error('Error fetching issue articles:', err);
        if (err.response?.status === 404) {
          setArticles([]);
          setError("");
          return;
        }

        setError(
          separateIssue
            ? 'Failed to load special issue articles. Please try again later.'
            : 'Failed to load current issue. Please try again later.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchIssueArticles();
  }, [user, separateIssue, archive, emptyMessage, hasMatchingSsrRoute]);

  // ✅ Same function as ArticleDetail - PDF authors first, then API fallback
  const getAuthors = (article) => {
    // PDF authors first (from backend)
    if (article?.pdfAuthors && article.pdfAuthors.length > 0) {
      return article.pdfAuthors.join(', ');
    }

    // Fallback to API authors
    if (!article?.authors || !Array.isArray(article.authors) || article.authors.length === 0) {
      return 'Unknown authors';
    }

    return article.authors
      .map(author => {
        const nameParts = [author.firstName, author.middleName, author.lastName]
          .filter(part => part && part.trim() !== '');
        return nameParts.join(' ');
      })
      .join(', ');
  };

  const formatPageInfo = (article) => {
    if (!article.pageStart || !article.pageEnd) return null;
    return `pp. ${article.pageStart}-${article.pageEnd}`;
  };

  const formatIssueDate = (article) => {
    if (article.issueTitle) return `${article.issueTitle} ${article.issueYear || ''}`.trim();

    if (article.publishedAt) {
      return new Date(article.publishedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }

    return article.issueYear ? article.issueYear.toString() : '';
  };

  if (authLoading || loading) {
    return <div className="text-center mt-20 text-lg">Loading...</div>;
  }

  if (error) {
    return (
      <>
        {!separateIssue && !archive && (
          <PageMetadata
            title="Current Issue Unavailable | JICS"
            description="The current journal issue could not be found."
            pathname="/journal/jics/articles/current"
            noindex
          />
        )}
        <div className="text-center mt-20 text-red-500">{error}</div>
      </>
    );
  }

  if (!articles || articles.length === 0) {
    return <div className="text-center mt-20 text-gray-500">{emptyMessage}</div>;
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#212121] py-12 mt-[20px]">
      {!separateIssue && !archive && (
        <PageMetadata
          title="Current Issue | Journal of Intelligent Computing System"
          description="Read the current issue of the Journal of Intelligent Computing System, including peer-reviewed research articles in intelligent computing and applied AI."
          pathname="/journal/jics/articles/current"
        />
      )}
      <div className="container mx-auto px-6 md:px-20">
        <button
          onClick={() => navigate('/journal/jics/about/overview')}
          className="mb-6 flex items-center text-[#00796b] hover:text-[#00acc1] font-medium transition-colors mt-[20px]"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Overview
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-[#00796b]">
            {pageTitle} ({articles.length})
          </h1>
          <p className="mt-3 inline-flex items-center rounded-full bg-[#e0f2f1] px-4 py-1.5 text-sm font-semibold tracking-[0.12em] text-[#00695c] shadow-sm ring-1 ring-[#00796b]/10">
            {issueLabel}
          </p>
        </div>

        {/* Article List */}
        <div className="space-y-4">
          {articles.map((item, index) => (
            <div
              key={item._id || index}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition"
            >
              {/* Article Title */}
              <h3 className="text-lg font-semibold text-[#00796b] mb-1">
                <Link to={getArticlePath(item, archive)} className="hover:underline">
                  {item.title}
                </Link>
              </h3>

              {/* ✅ Authors - Same variable as ArticleDetail */}
              <p className="text-sm text-gray-600 mb-2">
                {getAuthors(item)}
              </p>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-3">
                {/* Journal Name Badge */}
                <span className="px-2 py-1 bg-[#e0f2f1] text-[#00796b] text-xs font-medium rounded-md border border-[#00796b]/20">
                  📚 JICS
                </span>

                {/* Volume & Issue Badge */}
                {item.section && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-md border border-blue-200">
                    📂 {item.section}
                  </span>
                )}
                {(item.issueVolume || item.issueNumber) && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-md border border-purple-200">
                    🏷️ Vol. {item.issueVolume || '-'}, Issue {item.issueNumber || '-'}
                  </span>
                )}
                {formatPageInfo(item) && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-md border border-green-200">
                    📄 {formatPageInfo(item)}
                  </span>
                )}
                {item.publishedAt && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-md border border-gray-200">
                    📅 {formatIssueDate(item)}
                  </span>
                )}
                  {item.publishedAt && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-md border border-gray-200">
                    ISSN : 3139-3616
                  </span>
                )}
              </div>

              {/* Abstract */}
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                {item.abstract || 'No abstract available'}
              </p>

              {/* Actions */}
              <div className="flex justify-between items-center">
                <a
                  href={getArticlePath(item, archive)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#00acc1] font-semibold hover:text-[#00796b] transition-all hover:gap-3"
                >
                  Read Full Article
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                {item.publishedFileUrl ? (
                  <a
                    href={item.publishedFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors"
                  >
                    View PDF
                  </a>
                ) : (
                  <span className="text-red-500 text-sm">PDF not available</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

CurrentIssue.propTypes = {
  separateIssue: PropTypes.bool,
  archive: PropTypes.bool,
  initialData: PropTypes.shape({
    routeName: PropTypes.string,
    params: PropTypes.object,
    data: PropTypes.shape({
      articles: PropTypes.array,
      issue: PropTypes.object,
    }),
    status: PropTypes.number,
    error: PropTypes.string,
  }),
};

CurrentIssue.defaultProps = {
  separateIssue: false,
  archive: false,
  initialData: null,
};

export default CurrentIssue;
