import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../../../App";
import { pdfjs } from 'react-pdf';

const cdnUrl = 'https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js';
pdfjs.GlobalWorkerOptions.workerSrc = cdnUrl;

const ArticleDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);

  // Fetch PDF as blob
  const fetchPdfBlob = useCallback(async (url) => {
    if (!url) return null;
    try {
      setIsPdfLoading(true);
      const res = await axios.get(url, {
        responseType: 'blob',
        headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
      });
      return res.data;
    } catch (err) {
      console.error('Error fetching PDF blob:', err);
      return null;
    } finally {
      setIsPdfLoading(false);
    }
  }, [user]);

  // Open PDF in new tab
  const handleViewPdf = async () => {
    if (!article?.publishedFileUrl) return;
    const blob = await fetchPdfBlob(article.publishedFileUrl);
    if (!blob) {
      alert('Unable to load PDF for viewing.');
      return;
    }
    const url = URL.createObjectURL(blob);
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>${article.title || 'PDF Viewer'}</title>
            <style>body { margin: 0; } iframe { width: 100%; height: 100vh; border: none; }</style>
          </head>
          <body><iframe src="${url}"></iframe></body>
        </html>
      `);
      newWindow.document.close();
      newWindow.onbeforeunload = () => URL.revokeObjectURL(url);
    }
  };

  // Download PDF
  const handleDownloadPdf = async () => {
    if (!article?.publishedFileUrl) return;
    const blob = await fetchPdfBlob(article.publishedFileUrl);
    if (!blob) {
      alert('Unable to download PDF.');
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeTitle = (article.title || 'article').replace(/[^a-z0-9_.-]/gi, '_');
    link.download = `${safeTitle}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  // Fetch article
  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/manuscripts/${id}`,
         
        );
        setArticle(res.data.data || res.data);
      } catch (error) {
        console.error("Error fetching article:", error);
        setError("Failed to load article. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (id ) {
      fetchArticle();
    }
  }, [id]);

  if (loading) return <div className="p-8">Loading article...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!article) return <div className="p-8">Article not found.</div>;

  // Format authors
  const formatAuthors = (authors) => {
    if (!authors || !Array.isArray(authors)) return 'Unknown authors';
    return authors
      .map(author => {
        const nameParts = [author.firstName, author.middleName, author.lastName]
          .filter(part => part && part.trim() !== '');
        return nameParts.join(' ');
      })
      .join(', ');
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  // Check if issue info exists
  const hasIssueInfo = article.issueVolume && article.issueNumber && article.issueYear;

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#212121] py-12">
      <div className="container mx-auto px-6 md:px-20">
        <div className="bg-white rounded-xl shadow-md p-6 border border-[#e0e0e0] mt-[50px]">

          {/* Title & Authors */}
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold text-[#00796b]">{article.title}</h1>
            <p className="mt-2 text-sm text-[#757575]">
              <span className="font-medium">Authors:</span> {formatAuthors(article.authors)}
            </p>
          </div>

         
          {hasIssueInfo && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-[#00796b] mb-3 flex items-center">
                <span className="mr-2">📖</span> Publication Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Issue */}
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Issue</p>
                  <p className="text-lg font-semibold text-gray-800">
                    Vol {article.issueVolume}, No {article.issueNumber}
                  </p>
                  <p className="text-sm text-gray-600">{article.issueYear}</p>
                  {article.issueTitle && (
                    <p className="text-xs text-blue-600 mt-1">{article.issueTitle}</p>
                  )}
                </div>

                {/* Section */}
                {article.section && (
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Section</p>
                    <p className="text-lg font-semibold text-gray-800">{article.section}</p>
                  </div>
                )}

                {/* Pages */}
                {article.pageStart && article.pageEnd && (
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Pages</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {article.pageStart} - {article.pageEnd}
                    </p>
                    <p className="text-xs text-gray-500">
                      ({article.pageEnd - article.pageStart + 1} pages)
                    </p>
                  </div>
                )}

                {/* Published Date */}
                {article.publishedAt && (
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Published</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {formatDate(article.publishedAt)}
                    </p>
                  </div>
                )}
              </div>

              {/* Citation Format */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Cite This Article</p>
                <p className="text-sm text-gray-700 font-mono">
                  {formatAuthors(article.authors)} ({article.issueYear}).
                  {article.title}.
                  <em> Journal of Intelligent Computing System (JICS)</em>,
                  {article.issueVolume}({article.issueNumber}),
                  {article.pageStart && article.pageEnd ? ` ${article.pageStart}-${article.pageEnd}` : ''}.
                </p>
                <button
                  onClick={() => {
                    const citation = `${formatAuthors(article.authors)} (${article.issueYear}). ${article.title}. Journal Name, ${article.issueVolume}(${article.issueNumber})${article.pageStart && article.pageEnd ? `, ${article.pageStart}-${article.pageEnd}` : ''}.`;
                    navigator.clipboard.writeText(citation);
                    alert('Citation copied to clipboard!');
                  }}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  📋 Copy Citation
                </button>
              </div>
            </div>
          )}

          {/* Metadata (Non-Issue) */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-[#757575]">
            <div>
              <span className="font-medium">Manuscript ID:</span> {article.customId || article._id}
            </div>
            <div>
              <span className="font-medium">Article Type:</span> {article.type || 'Manuscript'}
            </div>
            <div>
              <span className="font-medium">Submission Date:</span> {formatDate(article.submissionDate)}
            </div>
            {!hasIssueInfo && article.publishedAt && (
              <div>
                <span className="font-medium">Published At:</span> {formatDate(article.publishedAt)}
              </div>
            )}
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div>
              {/* Abstract */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[#00796b] mb-2">Abstract</h3>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-[#424242] whitespace-pre-line">
                    {article.abstract || 'No abstract available'}
                  </p>
                </div>
              </div>

              {/* Keywords */}
              {article.keywords && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-[#00796b] mb-2">Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {article.keywords.split(',').map((keyword, index) => (
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

            {/* Right Column */}
            <div>
              {/* Classification */}
              {article.classification && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-[#00796b] mb-2">Classification</h3>
                  <ul className="space-y-2">
                    {parseClassification(article.classification).map((item, index) => (
                      <li key={index} className="text-sm text-[#424242] flex items-start">
                        <span className="mr-2">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Additional Info */}
              {article.additionalInfo && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-[#00796b] mb-2">Additional Information</h3>
                  <p className="text-sm text-[#424242]">{article.additionalInfo}</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex flex-wrap gap-3">
              {article.publishedFileUrl ? (
                <>
                  <button
                    onClick={handleViewPdf}
                    disabled={isPdfLoading}
                    className="px-4 py-2 bg-[#00796b] hover:bg-[#00acc1] text-white rounded-lg transition-colors text-sm disabled:opacity-50"
                  >
                    {isPdfLoading ? 'Loading...' : '👁️ View PDF'}
                  </button>
                  <button
                    onClick={handleDownloadPdf}
                    disabled={isPdfLoading}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50"
                  >
                    {isPdfLoading ? 'Processing...' : '📥 Download PDF'}
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