import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../../../App";
import { pdfjs } from 'react-pdf';

// Set worker path from CDN with matching version
const cdnUrl = 'https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js';
pdfjs.GlobalWorkerOptions.workerSrc = cdnUrl;

// Set the PDF.js version to match the worker
// pdfjs.version = '3.4.120';

const ArticleDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // extractedAbstract removed (not used); keeping PDF text extraction helper only
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);

  // Fetch PDF as blob and return blob
  const fetchPdfBlob = useCallback(async (url) => {
    if (!url) return null;
    try {
      setIsPdfLoading(true);
      const res = await axios.get(url, {
        responseType: 'blob',
        // attach token if hosted on same backend and protected
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

  // Open PDF in modal (create blob URL)
  const handleViewPdf = async () => {
    if (!article?.publishedFileUrl) return;
    const blob = await fetchPdfBlob(article.publishedFileUrl);
    if (!blob) {
      alert('Unable to load PDF for viewing.');
      return;
    }
    const url = URL.createObjectURL(blob);
    // Open in new tab
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`
      <html>
        <head>
          <title>${article.title || 'PDF Viewer'}</title>
          <style>
            body { margin: 0; }
            iframe { width: 100%; height: 100vh; border: none; }
          </style>
        </head>
        <body>
          <iframe src="${url}"></iframe>
        </body>
      </html>
    `);
      newWindow.document.close();
    }
    // Clean up the object URL when the new tab is closed
    newWindow.onbeforeunload = () => {
      URL.revokeObjectURL(url);
    };
  };

  // Download PDF (fetch blob then trigger download)
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
    // Use a safe filename
    const safeTitle = (article.title || 'article').replace(/[^a-z0-9_.-]/gi, '_');
    link.download = `${safeTitle}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  // Close modal and revoke blob URL
  const handleClosePdfModal = () => {
    setShowPdfModal(false);
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
  };

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/manuscripts/${id}`,
          {
            headers: { Authorization: `Bearer ${user?.token}` },
          }
        );
        setArticle(res.data.data || res.data);
      } catch (error) {
        console.error("Error fetching article:", error);
        setError("Failed to load article. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (id && user?.token) {
      fetchArticle();
    }
  }, [id, user?.token]);

  const extractTextFromPdf = useCallback(async (url) => {
    if (!url) return '';

    try {
      setIsPdfLoading(true);

      // Use fetch to get the PDF as array buffer
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();

      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      // Get the first page
      const page = await pdf.getPage(1);
      const textContent = await page.getTextContent();
      const text = textContent.items.map(item => item.str).join('');

      // Extract abstract (assuming it's in the first page and follows 'Abstract' keyword)
      const abstractMatch = text.match(/Abstract([\s\S]*?)(?=\n\n|\n\d|$)/i);
      const abstract = abstractMatch ? abstractMatch[1].trim() : 'Abstract not found in PDF';

      return abstract;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      return 'Error loading abstract from PDF';
    } finally {
      setIsPdfLoading(false);
    }
  }, []);

  useEffect(() => {
    if (article?.publishedFileUrl) {
      extractTextFromPdf(article.publishedFileUrl);
    }
  }, [article, extractTextFromPdf]);

  if (loading) return <div className="p-8">Loading article...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!article) return <div className="p-8">Article not found.</div>;

  // Format authors from array
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
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Parse classification if it's a stringified array
  const parseClassification = (classification) => {
    if (!classification) return [];
    try {
      return JSON.parse(classification);
    } catch {
      return Array.isArray(classification) ? classification : [classification];
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#212121] py-12">
      <div className="container mx-auto px-6 md:px-20">
        <div className="bg-white rounded-xl shadow-md p-6 border border-[#e0e0e0] mt-[50]">
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold text-[#00796b]">{article.title}</h1>
            <p className="mt-2 text-sm text-[#757575]">
              <span className="font-medium">Authors:</span> {formatAuthors(article.authors)}
            </p>
            <p className="mt-1 text-sm text-[#757575]">
              <span className="font-medium">Submission Date:</span> {formatDate(article.submissionDate)}
            </p>
            {article.publishedAt && (
              <p className="mt-1 text-sm text-[#757575]">
                <span className="font-medium">Published At:</span> {formatDate(article.publishedAt)}
              </p>
            )}
            <p className="mt-1 text-sm text-[#757575]">
              <span className="font-medium">Article Type:</span> {article.type || 'Manuscript'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[#00796b] mb-2">Abstract</h3>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-[#424242] whitespace-pre-line">
                    {article.abstract || 'No abstract available'}
                  </p>
                </div>
              </div>

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

            <div>
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

              {article.additionalInfo && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-[#00796b] mb-2">Additional Information</h3>
                  <p className="text-sm text-[#424242]">{article.additionalInfo}</p>
                </div>
              )}

              {/* <div className="mb-6">
                <h3 className="text-lg font-semibold text-[#00796b] mb-2">Funding</h3>
                <p className="text-sm text-[#424242]">{article.funding || 'No funding information available'}</p>
              </div> */}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex flex-wrap gap-3">
              {article.publishedFileUrl ? (
                <>
                  <button
                    onClick={handleViewPdf}
                    disabled={isPdfLoading}
                    className="px-4 py-2 bg-[#00796b] hover:bg-[#00acc1] text-white rounded-lg transition-colors text-sm disabled:opacity-50"
                  >
                    {isPdfLoading ? 'Loading...' : 'View PDF'}
                  </button>
                  <button
                    onClick={handleDownloadPdf}
                    disabled={isPdfLoading}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50"
                  >
                    {isPdfLoading ? 'Processing...' : 'Download Full Article (PDF)'}
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
                Back to Current Issue
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Viewer Modal */}
      {showPdfModal && pdfBlobUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="w-[90%] h-[90%] bg-white rounded-lg overflow-hidden shadow-lg">
            <div className="flex justify-between items-center p-3 border-b">
              <h3 className="font-semibold text-lg">{article.title} — PDF Viewer</h3>
              <button
                onClick={handleClosePdfModal}
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
            <div className="w-full h-full">
              <iframe
                src={pdfBlobUrl}
                title="PDF Viewer"
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleDetail;
