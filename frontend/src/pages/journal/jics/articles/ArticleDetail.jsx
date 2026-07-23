import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Helmet } from "react-helmet-async";
import PropTypes from "prop-types";
import { useAuth } from "../../../../App";
import PageMetadata from "../../../../components/PageMetadata.jsx";
import { useSsrContext } from "../../../../ssr/SsrContext.jsx";
import { buildCanonicalUrl } from "../../../../../ssr/config.js";
import { serializeJsonLd } from "../../../../utils/serializeJsonLd.js";

// Generate unique visitor ID
const getVisitorId = () => {
  if (typeof window === "undefined") return "";

  let visitorId = window.localStorage.getItem("visitorId");
  if (!visitorId) {
    visitorId =
      "visitor_" + Math.random().toString(36).substr(2, 9) + "_" + Date.now();
    window.localStorage.setItem("visitorId", visitorId);
  }
  return visitorId;
};

const getArticleUrlId = (article) =>
  article?.customId || article?.custom_id || article?._id;

const normalizeDoi = (doi) => {
  const value = String(doi || "").trim();
  if (!value) return { value: "", url: "", display: "" };

  const normalizedDoi = value
    .replace(/^(?:https?:\/\/)?(?:dx\.)?doi\.org\//i, "")
    .trim();
  if (!normalizedDoi) return { value: "", url: "", display: "" };

  return {
    value: normalizedDoi,
    url: `https://doi.org/${normalizedDoi}`,
    display: `doi.org/${normalizedDoi}`,
  };
};

const getMeaningfulText = (value) =>
  typeof value === "string" ? value.trim() : "";

const getValidMetadataDate = (...values) => {
  for (const value of values) {
    if (!value) continue;
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      const iso = date.toISOString();
      return {
        iso,
        scholar: iso.slice(0, 10).replace(/-/g, "/"),
      };
    }
  }
  return null;
};

const ArticleDetail = ({ initialData = null }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { publicSiteUrl } = useSsrContext();
  const hasMatchingSsrArticle =
    initialData?.routeName === "articleDetail" &&
    String(initialData?.params?.id || "") === String(id || "");
  const initialArticle = hasMatchingSsrArticle
    ? initialData?.data?.article || null
    : null;
  const [article, setArticle] = useState(() =>
    hasMatchingSsrArticle ? initialArticle : null,
  );
  const [loading, setLoading] = useState(!hasMatchingSsrArticle);
  const [error, setError] = useState(() =>
    hasMatchingSsrArticle ? initialData?.error || null : null,
  );
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [viewCount, setViewCount] = useState(() => initialArticle?.viewCount || 0);
  const viewCountedRef = useRef(false);
  const doi = normalizeDoi(article?.doi);

  const getDirectPdfSourceUrl = useCallback((pdfUrl) => {
    if (!pdfUrl) return "";

    try {
      const parsedUrl = new URL(pdfUrl, window.location.origin);
      const isPublishedPdfProxyPath = /^\/pdf\/.+\.pdf$/i.test(parsedUrl.pathname);

      if (!isPublishedPdfProxyPath) {
        return parsedUrl.toString();
      }

      const backendBaseUrl = import.meta.env.VITE_BACKEND_URL?.trim();

      if (!backendBaseUrl) {
        return parsedUrl.toString();
      }

      return `${backendBaseUrl.replace(/\/+$/, "")}${parsedUrl.pathname}${parsedUrl.search}`;
    } catch (error) {
      console.error("Error resolving direct PDF source URL:", error);
      return pdfUrl;
    }
  }, []);

  // =====================================================
  // GOOGLE SCHOLAR META TAGS COMPONENT
  // =====================================================
  const ScholarMetaTags = () => {
    if (!article) return null;

    // Get authors as array for meta tags
    const getAuthorsArray = () => {
      if (article?.pdfAuthors && article.pdfAuthors.length > 0) {
        return article.pdfAuthors.map(getMeaningfulText).filter(Boolean);
      }
      if (!article?.authors || !Array.isArray(article.authors)) {
        return [];
      }
      return article.authors.map((author) => {
        const nameParts = [
          author.firstName,
          author.middleName,
          author.lastName,
        ].filter((part) => part && part.trim() !== "");
        return nameParts.join(" ").trim();
      }).filter(Boolean);
    };

    const authors = getAuthorsArray();
    const title = getMeaningfulText(article.title);
    const description = getMeaningfulText(article.abstract);
    const keywords = getMeaningfulText(article.keywords);
    const publicationDate = getValidMetadataDate(
      article.publishedAt,
      article.submissionDate,
    );
    const modifiedDate = getValidMetadataDate(
      article.updatedAt,
      article.publishedAt,
      article.submissionDate,
    );
    const hasCompleteScholarMetadata = Boolean(
      title && authors.length > 0 && publicationDate,
    );
    const articleUrlId = getArticleUrlId(article);
    const articleUrl = buildCanonicalUrl(
      publicSiteUrl,
      `/journal/jics/articles/${encodeURIComponent(articleUrlId)}`,
    );
    const pdfUrl = String(article.publishedFileUrl || "").trim();
    const hasPublicFullText = Boolean(pdfUrl);

    // Schema.org JSON-LD structured data
    const schemaData = hasCompleteScholarMetadata ? {
      "@context": "https://schema.org",
      "@type": "ScholarlyArticle",
      headline: title,
      name: title,
      author: authors.map((name) => ({
        "@type": "Person",
        name: name,
      })),
      datePublished: publicationDate.iso,
      dateModified: modifiedDate?.iso || publicationDate.iso,
      publisher: {
        "@type": "Organization",
        name: "Synergy World Press",
        url: publicSiteUrl,
      },
      isPartOf: {
        "@type": "Periodical",
        name: "Journal of Intelligent Computing System (JICS)",
        issn: "3139-3616",
      },
      url: articleUrl,
      mainEntityOfPage: articleUrl,
      inLanguage: "en",
    } : null;

    // Add optional fields
    if (schemaData && description) schemaData.description = description;
    if (schemaData && keywords) schemaData.keywords = keywords;
    if (schemaData && article.issueVolume)
      schemaData.volumeNumber = String(article.issueVolume);
    if (schemaData && article.issueNumber)
      schemaData.issueNumber = String(article.issueNumber);
    if (schemaData && article.pageStart && article.pageEnd) {
      schemaData.pagination = `${article.pageStart}-${article.pageEnd}`;
    }
    if (schemaData && pdfUrl) {
      schemaData.encoding = {
        "@type": "MediaObject",
        contentUrl: pdfUrl,
        encodingFormat: "application/pdf",
      };
    }
    if (schemaData && doi.url) {
      schemaData.sameAs = doi.url;
    }

    return (
      <>
        <PageMetadata
          title={`${title || "Journal Article"} | JICS - Synergy World Press`}
          description={description.substring(0, 160)}
          pathname={`/journal/jics/articles/${encodeURIComponent(articleUrlId)}`}
          openGraphType="article"
        />
        <Helmet>
        {hasCompleteScholarMetadata && (
          <>
        {/* ===== GOOGLE SCHOLAR META TAGS ===== */}
        <meta name="citation_title" content={title} />

        {/* Each author needs separate meta tag */}
        {authors.map((author, index) => (
          <meta
            key={`author-${index}`}
            name="citation_author"
            content={author}
          />
        ))}

        {/* Publication date */}
        <meta name="citation_publication_date" content={publicationDate.scholar} />
        <meta name="citation_online_date" content={publicationDate.scholar} />

        {/* Journal info */}
        <meta
          name="citation_journal_title"
          content="Journal of Intelligent Computing System (JICS)"
        />
        <meta name="citation_journal_abbrev" content="JICS" />
        <meta name="citation_publisher" content="Synergy World Press" />

        {/* ISSN */}
        <meta name="citation_issn" content="3139-3616" />

        {/* Volume & Issue */}
        {article.issueVolume && (
          <meta name="citation_volume" content={String(article.issueVolume)} />
        )}
        {article.issueNumber && (
          <meta name="citation_issue" content={String(article.issueNumber)} />
        )}

        {/* Pages */}
        {article.pageStart && (
          <meta name="citation_firstpage" content={String(article.pageStart)} />
        )}
        {article.pageEnd && (
          <meta name="citation_lastpage" content={String(article.pageEnd)} />
        )}

        {/* PDF URL - Very Important for Google Scholar */}
        {pdfUrl && <meta name="citation_pdf_url" content={pdfUrl} />}

        {/* DOI */}
        {doi.value && <meta name="citation_doi" content={doi.value} />}

        {/* Abstract */}
        {description && (
          <meta name="citation_abstract" content={description} />
        )}

        {/* Keywords */}
        {keywords && (
          <meta name="citation_keywords" content={keywords} />
        )}

        {/* Language */}
        <meta name="citation_language" content="en" />

        {/* Open Access */}
        {hasPublicFullText && (
          <meta name="citation_fulltext_world_readable" content="true" />
        )}

        {/* ===== DUBLIN CORE META TAGS ===== */}
        <meta name="DC.title" content={title} />
        {authors.map((author, index) => (
          <meta key={`dc-author-${index}`} name="DC.creator" content={author} />
        ))}
        <meta name="DC.date" content={publicationDate.scholar} />
        <meta name="DC.publisher" content="Synergy World Press" />
        <meta name="DC.type" content="Text" />
        <meta name="DC.format" content="text/html" />
        <meta name="DC.language" content="en" />
        {description && (
          <meta name="DC.description" content={description} />
        )}
        {keywords && (
          <meta name="DC.subject" content={keywords} />
        )}

        {/* ===== ARTICLE-SPECIFIC OPEN GRAPH TAGS ===== */}
        <meta
          property="article:published_time"
          content={publicationDate.iso}
        />
        {authors[0] && <meta property="article:author" content={authors[0]} />}

        {/* ===== Schema.org JSON-LD ===== */}
        <script type="application/ld+json">{serializeJsonLd(schemaData)}</script>
          </>
        )}
        </Helmet>
      </>
    );
  };
  // =====================================================
  // END OF META TAGS
  // =====================================================

  // Increment view count - No Auth Required
  const incrementViewCount = useCallback(async () => {
    if (viewCountedRef.current === id) return;

    viewCountedRef.current = id;

    try {
      const visitorId = getVisitorId();
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/manuscripts/${id}/view`,
        {},
        {
          headers: {
            "x-visitor-id": visitorId,
          },
        },
      );

      if (res.data.success) {
        setViewCount(res.data.viewCount || 0);
      }
    } catch (error) {
      if (viewCountedRef.current === id) {
        viewCountedRef.current = null;
      }
      console.error("Error incrementing view count:", error);
    }
  }, [id]);

  // Fetch PDF as blob (for download only)
  const fetchPdfBlob = useCallback(
    async (url) => {
      if (!url) return null;
      try {
        setIsPdfLoading(true);
        const directPdfUrl = getDirectPdfSourceUrl(url);
        const res = await axios.get(directPdfUrl, {
          responseType: "blob",
          headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
        });
        return res.data;
      } catch (err) {
        console.error("Error fetching PDF blob:", err);
        return null;
      } finally {
        setIsPdfLoading(false);
      }
    },
    [getDirectPdfSourceUrl, user],
  );

  // ✅ NEW: Open PDF in new tab - Direct URL (no blob, no about:blank)
  const handleViewPdf = () => {
    if (!article?.publishedFileUrl) return;
    window.open(article.publishedFileUrl, "_blank", "noopener,noreferrer");
  };

  // Download PDF (still uses blob for proper download)
  const handleDownloadPdf = async () => {
    if (!article?.publishedFileUrl) return;
    const blob = await fetchPdfBlob(article.publishedFileUrl);
    if (!blob) {
      alert("Unable to download PDF.");
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const safeTitle = (article.title || "article").replace(
      /[^a-z0-9_.-]/gi,
      "_",
    );
    link.download = `${safeTitle}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  // Fetch article - No Auth Required for published
  useEffect(() => {
    if (hasMatchingSsrArticle) {
      setArticle(initialArticle);
      setViewCount(initialArticle?.viewCount || 0);
      setError(initialData?.error || null);
      setLoading(false);
      return;
    }

    const fetchArticle = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/manuscripts/${encodeURIComponent(id)}`,
        );
        const articleData = res.data.data || res.data;
        setArticle(articleData);
        setViewCount(articleData.viewCount || 0);

        const articleUrlId = getArticleUrlId(articleData);
        if (articleUrlId && articleUrlId !== id) {
          navigate(`/journal/jics/articles/${encodeURIComponent(articleUrlId)}`, {
            replace: true,
          });
        }
      } catch (error) {
        console.error("Error fetching article:", error);
        setError("Failed to load article. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchArticle();
    }
  }, [id, navigate, hasMatchingSsrArticle, initialArticle, initialData?.error]);

  // Increment view count when article loads
  useEffect(() => {
    const loadedArticleId = getArticleUrlId(article);
    const articleMatchesRoute =
      String(loadedArticleId || "") === String(id || "") ||
      (hasMatchingSsrArticle && article === initialArticle);

    if (articleMatchesRoute && article?.status === "Published") {
      incrementViewCount();
    }
  }, [article, hasMatchingSsrArticle, id, incrementViewCount, initialArticle]);

  // Format view count
  const formatViewCount = (count) => {
    if (!count) return "0";
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + "M";
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + "K";
    }
    return count.toString();
  };

  // Get authors - PDF first, then API fallback
  const getAuthors = () => {
    if (article?.pdfAuthors && article.pdfAuthors.length > 0) {
      return article.pdfAuthors.join(", ");
    }

    if (
      !article?.authors ||
      !Array.isArray(article.authors) ||
      article.authors.length === 0
    ) {
      return "Unknown authors";
    }

    return article.authors
      .map((author) => {
        const nameParts = [
          author.firstName,
          author.middleName,
          author.lastName,
        ].filter((part) => part && part.trim() !== "");
        return nameParts.join(" ");
      })
      .join(", ");
  };

  // Get corresponding author
  const getCorrespondingAuthor = () => {
    if (article?.pdfCorrespondingAuthor) {
      return article.pdfCorrespondingAuthor;
    }

    if (article?.correspondingAuthor) {
      const { firstName, middleName, lastName } = article.correspondingAuthor;
      return [firstName, middleName, lastName]
        .filter((p) => p && p.trim())
        .join(" ");
    }

    return null;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Format Issue Date (e.g., "Jan 28, 2026")
  const formatIssueDate = () => {
    // If the editor manually specified an issue title (e.g., "Special Issue"), use it
    if (article.issueTitle) return `${article.issueTitle} ${article.issueYear || ''}`.trim();

    if (article.publishedAt) {
      return new Date(article.publishedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    return article.issueYear || '';
  };

  const getCitationText = () => {
    const citation = `${getAuthors()} (${article.issueYear}). ${article.title}. Journal of Intelligent Computing System (JICS), ${article.issueVolume}(${article.issueNumber})${article.pageStart && article.pageEnd ? `, ${article.pageStart}-${article.pageEnd}` : ""}.`;

    return doi.display ? `${citation} ${doi.display}` : citation;
  };
  // Parse classification
  const parseClassification = (classification) => {
    if (!classification) return [];
    try {
      return JSON.parse(classification);
    } catch {
      return Array.isArray(classification) ? classification : [classification];
    }
  };

  if (loading) return <div className="p-8">Loading article...</div>;
  if (error || !article) {
    return (
      <div className="p-8 text-red-600">
        <PageMetadata
          title="Article Not Found | JICS"
          description="The requested journal article could not be found."
          pathname={`/journal/jics/articles/${encodeURIComponent(id || "")}`}
          noindex
          includeCanonical={false}
        />
        {error || "Article not found."}
      </div>
    );
  }

  const hasIssueInfo =
    article.issueVolume && article.issueNumber && article.issueYear;

  return (
    <div className="min-h-screen bg-[#f9f9f9] pt-28 pb-12 text-[#212121] md:pt-32">
      {/* Google Scholar Meta Tags */}
      <ScholarMetaTags />

      <div className="container mx-auto px-6 md:px-20">
         <button
          onClick={() => navigate('/journal/jics/articles/current')}
          className="mb-6 inline-flex items-center gap-2 text-[#00796b] transition-colors hover:text-[#00acc1]"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Published articles
        </button>
        <div className="bg-white rounded-xl border border-[#e0e0e0] p-6 shadow-md">
          {/* Bibliographic Details Banner */}
          {hasIssueInfo && (
            <p className="text-sm font-semibold text-[#00796b] uppercase tracking-wider mb-3 flex items-center flex-wrap gap-2">
              <span>Volume {article.issueVolume}, Issue {article.issueNumber}, {formatIssueDate()}</span>
            </p>
          )}

          {/* Title with View Count Badge */}
          <div className="mb-6">
            <div className="flex justify-between items-start flex-wrap gap-4">
              <h1 className="text-2xl font-extrabold text-[#00796b] flex-1">
                {article.title}
              </h1>

              {/* View Count Badge */}
              <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-full border border-blue-200 shadow-sm">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                <span className="text-sm font-bold text-blue-700">
                  {formatViewCount(viewCount)}
                </span>
                <span className="text-xs text-blue-500">views</span>
              </div>
            </div>

            {/* Authors from PDF */}
            <p className="mt-2 text-sm text-[#757575]">
              <span className="font-medium">Authors:</span> {getAuthors()}
            </p>

            {/* Corresponding Author */}
            {getCorrespondingAuthor() && (
              <p className="mt-1 text-xs text-[#9e9e9e]">
                <span className="font-medium">Corresponding Author:</span>{" "}
                {getCorrespondingAuthor()}
              </p>
            )}
          </div>

          {/* Publication Details */}
          {hasIssueInfo && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-[#00796b] mb-3 flex items-center">
                <span className="mr-2">📖</span> Publication Details
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[repeat(5,minmax(0,1fr))_minmax(260px,1.4fr)]">
                {/* Issue */}
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Issue
                  </p>
                  <p className="text-lg font-semibold text-gray-800">
                    Vol {article.issueVolume}, No {article.issueNumber}
                  </p>
                  <p className="text-sm text-gray-600">{formatIssueDate()}</p>
                </div>

                {/* Section */}
                {article.section && (
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      Section
                    </p>
                    <p className="text-lg font-semibold text-gray-800">
                      {article.section}
                    </p>
                  </div>
                )}

                {/* Pages */}
                {article.pageStart && article.pageEnd && (
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      Pages
                    </p>
                    <p className="text-lg font-semibold text-gray-800">
                      {article.pageStart} - {article.pageEnd}
                    </p>
                  </div>
                )}
                
                 {/* {ISSN NUMBER} */}
                {article.publishedAt && (
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      ISSN 
                    </p>
                    <p className="text-lg font-semibold text-gray-800">
                     3139-3616
                    </p>
                  </div>
                )}

                {/* Published Date */}
                {article.publishedAt && (
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      Published
                    </p>
                    <p className="text-lg font-semibold text-gray-800">
                      {formatDate(article.publishedAt)}
                    </p>
                  </div>
                )}
                {/* Views Card */}
                <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-5 rounded-xl border-2 border-purple-200 shadow-lg">
                  <div className="grid grid-cols-2 gap-6 text-center">
                    {/* Total Views */}
                    <div>
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        Total Views
                      </p>
                      <p className="text-4xl font-extrabold text-blue-800">
                        {formatViewCount(viewCount)}
                      </p>
                      <p className="text-xs text-blue-500 mt-1">
                        readers worldwide
                      </p>
                    </div>

                    {/* Citations */}
                    <div>
                      <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">
                        Citations
                      </p>
                      <p className="text-4xl font-extrabold text-purple-800">
                        {article.citationCount || 0}
                      </p>
                      <p className="text-xs text-purple-500 mt-1">
                        cited in research papers
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Citation */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Cite This Article
                </p>
                <p className="text-sm text-gray-700 font-mono">
                  {getAuthors()} ({article.issueYear}).
                  {article.title}.
                  <em> Journal of Intelligent Computing System (JICS)</em>,
                  {article.issueVolume}({article.issueNumber}),
                  {article.pageStart && article.pageEnd
                    ? ` ${article.pageStart}-${article.pageEnd}`
                    : ""}
                  .
                  {doi.url && (
                    <>
                      {" "}
                      <a
                        href={doi.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-blue-700 hover:text-blue-800 hover:underline"
                      >
                        {doi.display}
                      </a>
                    </>
                  )}
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(getCitationText());
                    alert("Citation copied to clipboard!");
                  }}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  📋 Copy Citation
                </button>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-[#757575]">
            <div>
              <span className="font-medium">Manuscript ID:</span>{" "}
              {article.customId || article._id}
            </div>
            <div>
              <span className="font-medium">Article Type:</span>{" "}
              {article.type || "Manuscript"}
            </div>
            <div>
              <span className="font-medium">Submission Date:</span>{" "}
              {formatDate(article.submissionDate)}
            </div>
            {/* Show views in metadata if no issue info */}
            {!hasIssueInfo && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Views:</span>
                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                  👁️ {formatViewCount(viewCount)}
                </span>
              </div>
            )}
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Abstract */}
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[#00796b] mb-2">
                  Abstract
                </h3>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-[#424242] whitespace-pre-line">
                    {article.abstract || "No abstract available"}
                  </p>
                </div>
              </div>

              {/* Keywords */}
              {article.keywords && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-[#00796b] mb-2">
                    Keywords
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {article.keywords.split(",").map((keyword, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-sm text-gray-700 rounded-full"
                      >
                        {keyword.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Classification & Additional Info */}
            <div>
              {article.classification && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-[#00796b] mb-2">
                    Classification
                  </h3>
                  <ul className="space-y-2">
                    {parseClassification(article.classification).map(
                      (item, index) => (
                        <li
                          key={index}
                          className="text-sm text-[#424242] flex items-start"
                        >
                          <span className="mr-2">•</span>
                          <span>{item}</span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              )}

              {article.additionalInfo && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-[#00796b] mb-2">
                    Additional Information
                  </h3>
                  <p className="text-sm text-[#424242]">
                    {article.additionalInfo}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ✅ UPDATED: Action Buttons */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex flex-wrap gap-3">
              {article.publishedFileUrl ? (
                <>
                  {/* ✅ View PDF - Opens direct URL, no loading needed */}
                  <button
                    onClick={handleViewPdf}
                    className="px-4 py-2 bg-[#00796b] hover:bg-[#00acc1] text-white rounded-lg transition-colors text-sm"
                  >
                    👁️ View PDF
                  </button>

                  {/* Download PDF - Still uses blob for proper download */}
                  <button
                    onClick={handleDownloadPdf}
                    disabled={isPdfLoading}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50"
                  >
                    {isPdfLoading ? "Processing..." : "📥 Download PDF"}
                  </button>
                </>
              ) : (
                <span className="px-4 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed text-sm">
                  PDF not available
                </span>
              )}

              <Link
                to="/journal/jics/articles/current"
                className="px-4 py-2 bg-gray-200 text-[#212121] rounded-lg hover:bg-gray-300 transition-colors text-sm"
              >
                ← Back to Articles
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

ArticleDetail.propTypes = {
  initialData: PropTypes.shape({
    routeName: PropTypes.string,
    params: PropTypes.shape({ id: PropTypes.string }),
    data: PropTypes.shape({ article: PropTypes.object }),
    status: PropTypes.number,
    error: PropTypes.string,
  }),
};

export default ArticleDetail;
