import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../App";
import { Link, useNavigate } from "react-router-dom";

const BASE_URL = '/journal/jics';

const MySubmissions = () => {
  const { user } = useAuth();
  const [manuscripts, setManuscripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(null);
  const [pdfBuiltManuscripts, setPdfBuiltManuscripts] = useState(new Set());
  const [showNotes, setShowNotes] = useState(null);
  const [selectedNotesType, setSelectedNotesType] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchManuscripts();
  }, [user?.token]);

  const fetchManuscripts = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/manuscripts/my-submissions`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      setManuscripts(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching manuscripts:", err);
      setError("Failed to fetch manuscripts");
      setLoading(false);
    }
  };

  const handleBuildPdf = (manuscriptId, mergedFileUrl) => {
    if (mergedFileUrl) {
      window.open(mergedFileUrl, "_blank");
      setPdfBuiltManuscripts((prev) => new Set([...prev, manuscriptId]));
    } else {
      alert("PDF is not available yet.");
    }
  };

  const handleWithdrawal = async (manuscriptId) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/manuscripts/${manuscriptId}`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      setShowConfirmation(null);
      fetchManuscripts();
      alert("Manuscript withdrawn successfully");
    } catch (error) {
      console.error("Error withdrawing manuscript:", error);
      alert("Failed to withdraw manuscript");
    }
  };

  const handleAccept = async (manuscriptId) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/manuscripts/${manuscriptId}/status`,
        { status: "Pending" },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      fetchManuscripts();
      alert("Manuscript submitted successfully and pending editor review");
    } catch (error) {
      console.error("Error accepting manuscript:", error);
      alert("Failed to submit manuscript");
    }
  };

  const handleNotesClick = (manuscriptId) => {
    setShowNotes(manuscriptId);
    setSelectedNotesType(null);
  };

  const handleNotesTypeClick = (type) => {
    setSelectedNotesType(type);
  };

  const renderNotes = (manuscript) => {
    if (!manuscript) return null;

    const notes =
      selectedNotesType === "editor" ? manuscript.editorNotes : manuscript.reviewerNotes;
    const title = selectedNotesType === "editor" ? "Editor Notes" : "Reviewer Notes";

    return (
      <div className="mt-4 p-4 bg-[#e0f7fa] rounded-lg border border-[#e0e0e0]">
        <h3 className="text-lg font-semibold text-[#00796b] mb-3">
          {title}
        </h3>
        {notes && notes.length > 0 ? (
          <div className="space-y-3">
            {notes.map((note, index) => (
              <div
                key={index}
                className="bg-white p-3 rounded border border-[#e0e0e0]"
              >
                <p className="text-[#212121]">{note.text}</p>
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-sm text-[#00796b]">
                    By: {note.addedBy.name} ({note.addedBy.role})
                  </span>
                  <span className="text-sm text-[#00796b]">
                    {new Date(note.addedAt).toLocaleString()}
                  </span>
                </div>
                {note.action && (
                  <div className="mt-2">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        note.action === "Rejected"
                          ? "bg-red-500"
                          : note.action === "Under Review"
                          ? "bg-yellow-500"
                          : note.action === "Accepted"
                          ? "bg-green-500"
                          : "bg-blue-500"
                      } text-white`}
                    >
                      {note.action}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[#00796b]">
            No {title.toLowerCase()} available.
          </p>
        )}
      </div>
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Under Review":
        return "text-[#00796b]";
      case "Rejected":
        return "text-red-500";
      case "Accepted":
        return "text-green-500";
      default:
        return "text-[#00796b]";
    }
  };

  const handleViewManuscript = (manuscriptId) => {
    navigate(`${BASE_URL}/manuscript/${manuscriptId}`);
  };

  const handleEditManuscript = (manuscriptId) => {
    navigate(`${BASE_URL}/edit-manuscript/${manuscriptId}`);
  };

  const handleSubmitNewManuscript = () => {
    navigate(`${BASE_URL}/submit-manuscript`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center">
        <div className="text-[#00796b] text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9] p-6 text-[#212121] mt-20 md:mt-16">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[#00796b] font-serif">
            My Submissions
          </h1>
          <Link
            to={`${BASE_URL}/submit`}
            className="px-4 py-2 bg-[#00796b] hover:bg-[#00acc1] text-white font-semibold rounded-lg transition-colors"
          >
            Submit New Manuscript
          </Link>
        </div>

        {manuscripts.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg border border-[#e0e0e0]">
            <p className="text-[#00796b]">
              No manuscripts submitted yet.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {manuscripts.map((manuscript) => (
              <div
                key={manuscript._id}
                className="bg-white rounded-lg p-6 shadow-md border border-[#e0e0e0]"
              >
                <h2 className="text-xl font-bold text-[#00796b] mb-4 text-center border-b border-[#e0e0e0] pb-4">
                  {manuscript.title}
                </h2>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center justify-center">
                    <div className="text-lg font-semibold text-[#00796b]">
                      {manuscript.type}
                    </div>
                  </div>

                  <div className="flex flex-col space-y-3 items-center">
                    <button
                      onClick={() => handleBuildPdf(manuscript._id, manuscript.mergedFileUrl)}
                      className="w-full px-4 py-2 bg-[#00796b] hover:bg-[#00acc1] text-white font-semibold rounded-lg transition-colors"
                    >
                      Build PDF
                    </button>
                    <button
                      onClick={() => setShowConfirmation(manuscript._id)}
                      className={`w-full px-4 py-2 ${
                        manuscript.status === "Under Review" ||
                        !pdfBuiltManuscripts.has(manuscript._id)
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-red-500 hover:bg-red-600 text-white"
                      } font-semibold rounded-lg transition-colors`}
                      disabled={
                        manuscript.status === "Under Review" ||
                        !pdfBuiltManuscripts.has(manuscript._id)
                      }
                    >
                      Withdrawal
                    </button>
                    <button
                      onClick={() => handleAccept(manuscript._id)}
                      className={`w-full px-4 py-2 ${
                        manuscript.status === "Under Review" ||
                        !pdfBuiltManuscripts.has(manuscript._id)
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-green-500 hover:bg-green-600 text-white"
                      } font-semibold rounded-lg transition-colors`}
                      disabled={
                        manuscript.status === "Under Review" ||
                        !pdfBuiltManuscripts.has(manuscript._id)
                      }
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleNotesClick(manuscript._id)}
                      className={`w-full px-4 py-2 ${
                        manuscript.status === "Accepted" ||
                        manuscript.status === "Rejected"
                          ? "bg-purple-500 hover:bg-purple-600 text-white"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      } font-semibold rounded-lg transition-colors`}
                      disabled={
                        manuscript.status !== "Accepted" &&
                        manuscript.status !== "Rejected"
                      }
                    >
                      Notes
                    </button>
                  </div>

                  <div className="flex items-center justify-center">
                    <span className={`text-lg font-semibold ${getStatusColor(manuscript.status)}`}>
                      {manuscript.status || "Pending"}
                    </span>
                  </div>
                </div>

                {showNotes === manuscript._id && (
                  <div className="mt-4">
                    <div className="flex space-x-2 mb-4">
                      <button
                        onClick={() => handleNotesTypeClick("editor")}
                        className={`px-4 py-2 rounded ${
                          selectedNotesType === "editor"
                            ? "bg-[#00796b] text-white"
                            : "bg-[#e0e0e0] text-[#212121]"
                        }`}
                      >
                        Editor Notes
                      </button>
                      <button
                        onClick={() => handleNotesTypeClick("reviewer")}
                        className={`px-4 py-2 rounded ${
                          selectedNotesType === "reviewer"
                            ? "bg-[#00796b] text-white"
                            : "bg-[#e0e0e0] text-[#212121]"
                        }`}
                      >
                        Reviewer Notes
                      </button>
                    </div>
                    {selectedNotesType && renderNotes(manuscript)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 border border-[#e0e0e0]">
            <h3 className="text-xl font-bold text-[#00796b] mb-4">
              Warning!
            </h3>
            <p className="text-[#00796b] mb-6">
              Are you sure you want to withdraw this manuscript?
              This action cannot be undone and all data will be permanently deleted.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowConfirmation(null)}
                className="px-4 py-2 bg-[#f9f9f9] text-[#00796b] rounded-lg hover:bg-[#e0e0e0] transition-colors border border-[#e0e0e0]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleWithdrawal(showConfirmation)}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors"
              >
                Confirm Withdrawal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MySubmissions;
