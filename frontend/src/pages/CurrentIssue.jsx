import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../App";

const CurrentIssue = () => {
  const { user, loading: authLoading } = useAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCurrentIssue = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/manuscripts/published`
        );

        if (res.data && res.data.data) {
          const data = Array.isArray(res.data.data) ? res.data.data : [res.data.data];
          setArticles(data);
        } else {
          setError('No current issues available.');
        }
      } catch (err) {
        console.error('Error fetching current issue:', err);
        setError('Failed to load current issue. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentIssue();
  }, [user]);

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

  if (error) return <div className="text-center mt-20 text-red-500">{error}</div>;

  if (!articles || articles.length === 0) {
    return <div className="text-center mt-20 text-gray-500">No current issues available.</div>;
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#212121] py-12 mt-[20px]">
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
            Published Articles ({articles.length})
          </h1>
          <p className="mt-3 inline-flex items-center rounded-full bg-[#e0f2f1] px-4 py-1.5 text-sm font-semibold tracking-[0.12em] text-[#00695c] shadow-sm ring-1 ring-[#00796b]/10">
            Vol. 1, Issue 1 • Jan-Apr 2026
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
                <Link to={`/journal/jics/articles/${item._id}`} className="hover:underline">
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
              </div>

              {/* Abstract */}
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                {item.abstract || 'No abstract available'}
              </p>

              {/* Actions */}
              <div className="flex justify-between items-center">
                <a
                  href={`/journal/jics/articles/${item._id}`}
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

export default CurrentIssue;
