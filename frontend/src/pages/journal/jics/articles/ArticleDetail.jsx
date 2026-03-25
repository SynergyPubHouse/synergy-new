import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Helmet } from "react-helmet-async";
import { useAuth } from "../../../../App";
import { pdfjs } from "react-pdf";

const cdnUrl = "https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js";
pdfjs.GlobalWorkerOptions.workerSrc = cdnUrl;

// Generate unique visitor ID
const getVisitorId = () => {
  let visitorId = localStorage.getItem("visitorId");
  if (!visitorId) {
    visitorId =
      "visitor_" + Math.random().toString(36).substr(2, 9) + "_" + Date.now();
    localStorage.setItem("visitorId", visitorId);
  }
  return visitorId;
};

const ArticleDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const viewCountedRef = useRef(false);

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
        return article.pdfAuthors;
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
        return nameParts.join(" ");
      });
    };

    const authors = getAuthorsArray();

    // Format date for Google Scholar (YYYY/MM/DD)
    const getPublishedDate = () => {
      const date = article.publishedAt || article.submissionDate;
      if (!date) return "";
      const d = new Date(date);
      return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
    };

    const publishedDate = getPublishedDate();
    const articleUrl = `https://synergyworldpress.com/journal/jics/articles/${article._id}`;
    const pdfUrl = article.publishedFileUrl || "";

    // Schema.org JSON-LD structured data
    const schemaData = {
      "@context": "https://schema.org",
      "@type": "ScholarlyArticle",
      headline: article.title,
      name: article.title,
      author: authors.map((name) => ({
        "@type": "Person",
        name: name,
      })),
      datePublished: article.publishedAt || article.submissionDate,
      dateModified:
        article.updatedAt || article.publishedAt || article.submissionDate,
      publisher: {
        "@type": "Organization",
        name: "Synergy World Press",
        url: "https://synergyworldpress.com",
      },
      isPartOf: {
        "@type": "Periodical",
        name: "Journal of Intelligent Computing System (JICS)",
        issn: "XXXX-XXXX",
      },
      description: article.abstract || "",
      keywords: article.keywords || "",
      url: articleUrl,
      mainEntityOfPage: articleUrl,
      inLanguage: "en",
    };

    // Add optional fields
    if (article.issueVolume)
      schemaData.volumeNumber = String(article.issueVolume);
    if (article.issueNumber)
      schemaData.issueNumber = String(article.issueNumber);
    if (article.pageStart && article.pageEnd) {
      schemaData.pagination = `${article.pageStart}-${article.pageEnd}`;
    }
    if (pdfUrl) {
      schemaData.encoding = {
        "@type": "MediaObject",
        contentUrl: pdfUrl,
        encodingFormat: "application/pdf",
      };
    }
    if (article.doi) {
      schemaData.sameAs = `https://doi.org/${article.doi}`;
    }

    return (
      <Helmet>
        {/* ===== Basic Meta Tags ===== */}
        <title>{article.title} | JICS - Synergy World Press</title>
        <meta
          name="description"
          content={article.abstract?.substring(0, 160) || ""}
        />

        {/* ===== GOOGLE SCHOLAR META TAGS ===== */}
        <meta name="citation_title" content={article.title} />

        {/* Each author needs separate meta tag */}
        {authors.map((author, index) => (
          <meta
            key={`author-${index}`}
            name="citation_author"
            content={author}
          />
        ))}

        {/* Publication date */}
        <meta name="citation_publication_date" content={publishedDate} />
        <meta name="citation_online_date" content={publishedDate} />

        {/* Journal info */}
        <meta
          name="citation_journal_title"
          content="Journal of Intelligent Computing System (JICS)"
        />
        <meta name="citation_journal_abbrev" content="JICS" />
        <meta name="citation_publisher" content="Synergy World Press" />

        {/* ISSN */}
        <meta name="citation_issn" content="XXXX-XXXX" />

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
        {article.doi && <meta name="citation_doi" content={article.doi} />}

        {/* Abstract */}
        {article.abstract && (
          <meta name="citation_abstract" content={article.abstract} />
        )}

        {/* Keywords */}
        {article.keywords && (
          <meta name="citation_keywords" content={article.keywords} />
        )}

        {/* Language */}
        <meta name="citation_language" content="en" />

        {/* Open Access */}
        <meta name="citation_fulltext_world_readable" content="" />

        {/* ===== DUBLIN CORE META TAGS ===== */}
        <meta name="DC.title" content={article.title} />
        {authors.map((author, index) => (
          <meta key={`dc-author-${index}`} name="DC.creator" content={author} />
        ))}
        <meta name="DC.date" content={publishedDate} />
        <meta name="DC.publisher" content="Synergy World Press" />
        <meta name="DC.type" content="Text" />
        <meta name="DC.format" content="text/html" />
        <meta name="DC.language" content="en" />
        {article.abstract && (
          <meta name="DC.description" content={article.abstract} />
        )}
        {article.keywords && (
          <meta name="DC.subject" content={article.keywords} />
        )}

        {/* ===== OPEN GRAPH TAGS ===== */}
        <meta property="og:title" content={article.title} />
        <meta
          property="og:description"
          content={article.abstract?.substring(0, 200) || ""}
        />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={articleUrl} />
        <meta property="og:site_name" content="Synergy World Press" />
        <meta
          property="article:published_time"
          content={article.publishedAt || article.submissionDate}
        />
        {authors[0] && <meta property="article:author" content={authors[0]} />}

        {/* ===== TWITTER CARDS ===== */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={article.title} />
        <meta
          name="twitter:description"
          content={article.abstract?.substring(0, 200) || ""}
        />

        {/* ===== Canonical URL ===== */}
        <link rel="canonical" href={articleUrl} />

        {/* ===== Schema.org JSON-LD ===== */}
        <script type="application/ld+json">{JSON.stringify(schemaData)}</script>
      </Helmet>
    );
  };
  // =====================================================
  // END OF META TAGS
  // =====================================================

  // Increment view count - No Auth Required
  const incrementViewCount = useCallback(async () => {
    if (viewCountedRef.current) return;

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
        viewCountedRef.current = true;
        setViewCount(res.data.viewCount || 0);
      }
    } catch (error) {
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
    const fetchArticle = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/manuscripts/${id}`,
        );
        const articleData = res.data.data || res.data;
        setArticle(articleData);
        setViewCount(articleData.viewCount || 0);
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
  }, [id]);

  // Increment view count when article loads
  useEffect(() => {
    if (article && article.status === "Published" && !viewCountedRef.current) {
      incrementViewCount();
    }
  }, [article, incrementViewCount]);

  // Reset when id changes
  useEffect(() => {
    viewCountedRef.current = false;
  }, [id]);

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
  const navigate = useNavigate()
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
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!article) return <div className="p-8">Article not found.</div>;

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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                </p>
                <button
                  onClick={() => {
                    const citation = `${getAuthors()} (${article.issueYear}). ${article.title}. Journal of Intelligent Computing System (JICS), ${article.issueVolume}(${article.issueNumber})${article.pageStart && article.pageEnd ? `, ${article.pageStart}-${article.pageEnd}` : ""}.`;
                    navigator.clipboard.writeText(citation);
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

export default ArticleDetail;
