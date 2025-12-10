import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../App";

const CurrentIssue = () => {
  const { user, loading: authLoading } = useAuth(); // Add authLoading from useAuth
  const [issue, setIssue] = useState(null);
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
    // Only fetch data if user is authenticated
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
          setIssue(Array.isArray(res.data.data) ? res.data.data : [res.data.data]);
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
  }, [user]); // Only depend on user

  // Show loading state while checking auth
  if (authLoading) {
    return <div className="text-center mt-20 text-lg">Loading...</div>;
  }

  if (loading) return <div className="text-center mt-20 text-lg">Loading current issue...</div>;
  if (error) return <div className="text-center mt-20 text-red-500">{error}</div>;
  if (!issue || !Array.isArray(issue) || issue.length === 0) {
    return <div className="text-center mt-20 text-gray-500">No current issues available.</div>;
  }

  // Format authors string from authors array
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

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#212121] py-12 mt-[20PX]">
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
        <h1 className="text-2xl font-extrabold text-[#00796b] mb-8">Articles</h1>

        <div className="space-y-6">
          {issue.map((item, index) => (
            <div key={item._id || index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition">
              <h2 className="text-lg font-semibold text-[#00796b] mb-1"><Link to={`/journal/jics/articles/${item._id}`} className="hover:underline">
                {item.title}
              </Link></h2>
              <p className="text-sm text-gray-600 mb-3">
                {formatAuthors(item.authors)}
              </p>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                {item.abstract || 'No abstract available'}
              </p>
              <div className="flex justify-between items-center">
                <Link
                  to={`/journal/jics/articles/${item._id}?view=pdf`}
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
    </div>
  );
};

export default CurrentIssue;
