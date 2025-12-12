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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { state: { from: '/journal/jics/articles/current' } });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchCurrentIssue = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/manuscripts/published`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`
            }
          }
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

  // Format authors string
  const formatAuthors = (authors) => {
    if (!authors || !Array.isArray(authors)) return '';
    return authors
      .map(author => {
        const nameParts = [author.firstName, author.middleName, author.lastName]
          .filter(part => part && part.trim() !== '');
        return nameParts.join(' ');
      })
      .join(', ');
  };

  // Format issue info
  const formatIssueInfo = (article) => {
    if (!article.issueVolume || !article.issueNumber || !article.issueYear) {
      return null;
    }

    let info = `Vol ${article.issueVolume}, No ${article.issueNumber}, ${article.issueYear}`;
    if (article.issueTitle) {
      info += ` - ${article.issueTitle}`;
    }
    return info;
  };

  // Format page info
  const formatPageInfo = (article) => {
    if (!article.pageStart || !article.pageEnd) return null;
    return `pp. ${article.pageStart}-${article.pageEnd}`;
  };

  // Group articles by issue
  const groupByIssue = (articles) => {
    const groups = {};

    articles.forEach(article => {
      const key = article.issueVolume && article.issueNumber && article.issueYear
        ? `Vol ${article.issueVolume}, No ${article.issueNumber}, ${article.issueYear}`
        : 'Uncategorized';

      if (!groups[key]) {
        groups[key] = {
          issueInfo: {
            volume: article.issueVolume,
            number: article.issueNumber,
            year: article.issueYear,
            title: article.issueTitle
          },
          articles: []
        };
      }
      groups[key].articles.push(article);
    });

    return groups;
  };

  if (authLoading) {
    return <div className="text-center mt-20 text-lg">Loading...</div>;
  }

  if (loading) return <div className="text-center mt-20 text-lg">Loading current issue...</div>;
  if (error) return <div className="text-center mt-20 text-red-500">{error}</div>;
  if (!articles || articles.length === 0) {
    return <div className="text-center mt-20 text-gray-500">No current issues available.</div>;
  }

  const groupedArticles = groupByIssue(articles);

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#212121] py-12 mt-[20px]">
      <div className="container mx-auto px-6 md:px-20">
        <button
          onClick={() => navigate('/journal/jics/about/overview')}
          className="mb-6 flex items-center text-[#00796b] hover:text-[#00acc1] font-medium transition-colors mt-[20px]"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Overview
        </button>

        <h1 className="text-2xl font-extrabold text-[#00796b] mb-8">Published Articles</h1>

        {/* Grouped by Issue */}
        {Object.entries(groupedArticles).map(([issueKey, issueData]) => (
          <div key={issueKey} className="mb-10">
            {/* Issue Header */}
            {issueKey !== 'Uncategorized' && (
              <div className="bg-gradient-to-r from-[#00796b] to-[#00acc1] text-white p-4 rounded-t-lg">
                <h2 className="text-xl font-bold">
                  📖 {issueKey}
                  {issueData.issueInfo.title && (
                    <span className="ml-2 font-normal text-sm opacity-90">
                      — {issueData.issueInfo.title}
                    </span>
                  )}
                </h2>
                <p className="text-sm opacity-80 mt-1">
                  {issueData.articles.length} Article{issueData.articles.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}

            {/* Articles in this Issue */}
            <div className={`space-y-4 ${issueKey !== 'Uncategorized' ? 'border border-t-0 border-gray-200 rounded-b-lg p-4 bg-white' : ''}`}>
              {issueData.articles.map((item, index) => (
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

                  {/* Authors */}
                  <p className="text-sm text-gray-600 mb-2">
                    {formatAuthors(item.authors)}
                  </p>

                  {/* Issue & Page Info */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {item.section && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        📂 {item.section}
                      </span>
                    )}
                    {formatPageInfo(item) && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        📄 {formatPageInfo(item)}
                      </span>
                    )}
                    {item.publishedAt && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        📅 {new Date(item.publishedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    )}
                  </div>

                  {/* Abstract Preview */}
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                    {item.abstract || 'No abstract available'}
                  </p>

                  {/* Actions */}
                  <div className="flex justify-between items-center">
                    <Link
                      to={`/journal/jics/articles/${item._id}`}
                      className="text-[#00acc1] font-medium hover:text-[#00796b] transition"
                    >
                      Read Full Article →
                    </Link>
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
        ))}
      </div>
    </div>
  );
};

export default CurrentIssue;