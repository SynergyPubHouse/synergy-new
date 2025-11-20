import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../App";
import { getUserFullName } from "../utils/roleUtils";

// Helper function to format recommendation text
const formatRecommendation = (rec) => {
  const recMap = {
    accept: "Accept",
    "minor-revision": "Minor Revision",
    "major-revision": "Major Revision",
    reject: "Reject",
  };
  return recMap[rec] || rec;
};

function ReviewerDashboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [manuscripts, setManuscripts] = useState([]);
  const navigate = useNavigate();
  const [reviewText, setReviewText] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [showRejectForm, setShowRejectForm] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    const fetchManuscripts = async () => {
      try {
        if (!user || !user.token) {
          console.error("No token found");
          navigate("/login");
          return;
        }

        const response = await axios.get(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/auth/reviewer/assigned-manuscripts`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );

        const userManuscripts = {};
        response.data.forEach((manuscript) => {
          let authorFullName = "Unknown Author";
          let firstName = "";
          let lastName = "";
          let authorId = "";

          if (manuscript.author && typeof manuscript.author === "object") {
            firstName = manuscript.author.firstName || "";
            lastName = manuscript.author.lastName || "";
            authorFullName = `${firstName} ${lastName}`.trim();
            authorId = manuscript.author._id || "";
          } else {
            authorId = manuscript._id;
          }

          if (!authorFullName || authorFullName.trim() === "") {
            authorFullName = "Unknown Author";
          }
          if (!authorId) {
            authorId = manuscript._id;
          }

          const groupKey = authorId;
          if (!userManuscripts[groupKey]) {
            userManuscripts[groupKey] = {
              _id: authorId,
              firstName,
              lastName,
              fullName: authorFullName,
              manuscripts: [],
            };
          }
          userManuscripts[groupKey].manuscripts.push(manuscript);
        });

        const usersList = Object.values(userManuscripts);
        setUsers(usersList);
        if (usersList.length > 0) {
          setSelectedUser(usersList[0]);
          setManuscripts(usersList[0].manuscripts);
        }
      } catch (error) {
        console.error("Error fetching manuscripts:", error);
        if (error.response?.status === 401) {
          navigate("/login");
        }
      }
    };

    const fetchInvitations = async () => {
      try {
        if (!user || !user.token) {
          return;
        }
        const response = await axios.get(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/auth/reviewer/pending-invitations`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );
        setPendingInvitations(response.data);
      } catch (error) {
        console.error("Error fetching invitations:", error);
      }
    };

    if (user && user.token) {
      fetchManuscripts();
      fetchInvitations();
    }
  }, [user, navigate]);

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setManuscripts(user.manuscripts || []);
  };

  const handleViewPDF = (manuscriptUrl) => {
    if (manuscriptUrl) {
      window.open(manuscriptUrl, "_blank");
    } else {
      alert("PDF not available");
    }
  };

  const handleAddReview = async (manuscriptId) => {
    try {
      if (!user || !user.token) {
        alert("You must be logged in to submit a review");
        navigate("/login");
        return;
      }

      if (!reviewText.trim() || !recommendation) {
        alert("Please provide both review comments and a recommendation");
        return;
      }

      const reviewerName = getUserFullName(user);
      const reviewerNote = {
        text: reviewText,
        action: recommendation,
        addedBy: {
          name: reviewerName,
          role: "reviewer",
        },
        addedAt: new Date(),
      };

      const response = await axios.post(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/auth/reviewer/manuscripts/${manuscriptId}/review`,
        {
          comments: reviewText,
          recommendation: recommendation,
          reviewerNote: reviewerNote,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      const statusResponse = await axios.put(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/manuscripts/${manuscriptId}/status`,
        { status: "Reviewed" },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      // Clear the form
      setReviewText("");
      setRecommendation("");

      alert("Review submitted successfully!");
      window.location.reload();
    } catch (error) {
      console.error("Error submitting review:", error);
      alert(error.response?.data?.message || "Failed to submit review");
    }
  };

  const handleRejectInvitation = async (manuscriptId) => {
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }
    try {
      if (!user || !user.token) {
        alert("You must be logged in to reject invitations");
        navigate("/login");
        return;
      }
      await axios.post(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/auth/reviewer/manuscripts/${manuscriptId}/reject-invitation`,
        {
          rejectionReason: rejectionReason.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      setPendingInvitations((prev) =>
        prev.filter((inv) => inv._id !== manuscriptId)
      );
      setShowRejectForm(null);
      setRejectionReason("");
      alert("Invitation rejected successfully!");
    } catch (error) {
      console.error("Error rejecting invitation:", error);
      alert(error.response?.data?.message || "Failed to reject invitation");
    }
  };

  const handleAcceptInvitation = async (manuscriptId) => {
    try {
      if (!user || !user.token) {
        alert("You must be logged in to accept invitations");
        navigate("/login");
        return;
      }
      await axios.post(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/auth/reviewer/manuscripts/${manuscriptId}/accept-invitation`,
        {},
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      setPendingInvitations((prev) =>
        prev.filter((inv) => inv._id !== manuscriptId)
      );
      alert("Invitation accepted successfully!");
      window.location.reload();
    } catch (error) {
      console.error("Error accepting invitation:", error);
      alert("Failed to accept invitation");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f4f8] to-[#d9e2ec] p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-[#1a365d] mb-8">
          Reviewer Dashboard
        </h1>

        {/* Pending Invitations Section */}
        {pendingInvitations.length > 0 && (
          <div className="bg-white rounded-lg p-6 shadow-lg border border-[#e2e8f0] mb-8">
            <h2 className="text-2xl font-semibold text-[#496580] mb-4">
              📧 Pending Review Invitations ({pendingInvitations.length})
            </h2>
            <div className="space-y-4">
              {pendingInvitations.map((invitation) => (
                <div
                  key={invitation._id}
                  className="bg-[#f8fafc] p-4 rounded-lg border border-[#e2e8f0]"
                >
                  <h3 className="text-xl font-semibold text-[#1a365d] mb-2">
                    {invitation.title}
                  </h3>
                  <p className="text-[#64748b] text-sm mb-1">
                    Type: {invitation.type}
                  </p>
                  <p className="text-[#64748b] text-sm mb-1">
                    Keywords: {invitation.keywords}
                  </p>
                  <p className="text-[#64748b] text-sm mb-2">
                    Invited:{" "}
                    {new Date(invitation.invitedAt).toLocaleDateString()}
                  </p>
                  <div className="mb-4">
                    <p className="text-[#496580] font-semibold mb-1">
                      Abstract:
                    </p>
                    <p className="text-[#1a365d] text-sm">
                      {invitation.abstract.length > 150
                        ? `${invitation.abstract.substring(0, 150)}...`
                        : invitation.abstract}
                    </p>
                  </div>
                  {showRejectForm === invitation._id ? (
                    <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                      <label className="block text-red-800 font-semibold mb-2">
                        Rejection Reason (Required)
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="w-full h-24 p-2 border border-gray-300 rounded text-sm"
                        placeholder="Please provide a detailed reason for rejecting this invitation..."
                        required
                      />
                      <div className="flex space-x-2 mt-3">
                        <button
                          onClick={() => {
                            setShowRejectForm(null);
                            setRejectionReason("");
                          }}
                          className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleRejectInvitation(invitation._id)}
                          disabled={!rejectionReason.trim()}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          Confirm Rejection
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAcceptInvitation(invitation._id)}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        ✅ Accept
                      </button>
                      <button
                        onClick={() => {
                          setShowRejectForm(invitation._id);
                          setRejectionReason("");
                        }}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        ❌ Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Users List */}
          <div className="bg-white rounded-lg p-6 shadow-lg border border-[#e2e8f0]">
            <h2 className="text-2xl font-semibold text-[#496580] mb-4">
              Authors with Manuscripts Under Review
            </h2>
            <div className="space-y-2">
              {users.map((user) => (
                <button
                  key={user._id}
                  onClick={() => handleUserClick(user)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    selectedUser === user
                      ? "bg-[#496580] text-white"
                      : "bg-[#f8fafc] text-[#1a365d] hover:bg-[#e2e8f0]"
                  }`}
                >
                  {user.fullName}
                </button>
              ))}
            </div>
          </div>

          {/* Manuscripts List */}
          <div className="bg-white rounded-lg p-6 shadow-lg border border-[#e2e8f0] col-span-2">
            <h2 className="text-2xl font-semibold text-[#496580] mb-4">
              {selectedUser
                ? `Manuscripts Under Review by ${selectedUser.firstName} ${selectedUser.lastName}`
                : "Select an Author"}
            </h2>
            <div className="space-y-4">
              {manuscripts.map((manuscript) => (
                <div
                  key={manuscript._id}
                  className="bg-[#f8fafc] p-4 rounded-lg border border-[#e2e8f0]"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold text-[#1a365d] mb-2">
                        {manuscript.title}
                      </h3>
                      <p className="text-[#64748b] text-sm">
                        Status: {manuscript.status}
                      </p>
                      <p className="text-[#64748b] text-sm">
                        Submitted:{" "}
                        {new Date(
                          manuscript.submissionDate
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => handleViewPDF(manuscript.mergedFileUrl)}
                        className="px-4 py-2 bg-[#496580] text-white rounded hover:bg-[#3a5269]"
                      >
                        View PDF
                      </button>
                      {manuscript.highlightedRevisionFileUrl && (
                        <button
                          onClick={() => {
                            const url = manuscript.highlightedRevisionFileUrl;
                            if (url) {
                              const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(
                                url
                              )}&embedded=true`;
                              window.open(viewerUrl, "_blank");
                            } else {
                              alert("File not available");
                            }
                          }}
                          className="px-4 py-2 bg-[#f59e0b] text-white rounded hover:bg-[#d97706]"
                        >
                          View Highlighted Revision
                        </button>
                      )}
                      {manuscript.revisionCombinedPdfUrl && (
                        <button
                          onClick={() =>
                            handleViewPDF(manuscript.revisionCombinedPdfUrl)
                          }
                          className="px-4 py-2 bg-[#10b981] text-white rounded hover:bg-[#059669]"
                        >
                          View Combined Revision PDF
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Editor Notes Section */}
                  {manuscript.editorNotes?.length > 0 && (
                    <div className="mt-4 border-t border-[#e2e8f0] pt-4">
                      <h4 className="text-[#496580] text-sm font-semibold mb-2">
                        Editor Notes:
                      </h4>
                      <div className="space-y-2">
                        {manuscript.editorNotes
                          .filter((note) =>
                            note.visibility.includes("reviewer")
                          )
                          .map((note, index) => (
                            <div
                              key={index}
                              className="bg-white p-3 rounded border border-[#e2e8f0]"
                            >
                              <p className="text-[#1a365d]">{note.text}</p>
                              {note.action && (
                                <span
                                  className={`inline-block mt-2 px-2 py-1 text-xs rounded ${
                                    note.action === "Under Review"
                                      ? "bg-[#f59e0b]"
                                      : note.action === "Reviewed"
                                      ? "bg-[#3b82f6]"
                                      : note.action === "Accepted"
                                      ? "bg-[#10b981]"
                                      : "bg-[#ef4444]"
                                  } text-white`}
                                >
                                  {note.action}
                                </span>
                              )}
                              <p className="text-[#64748b] text-xs mt-2">
                                Added by: {note.addedBy.name} on{" "}
                                {new Date(note.addedAt).toLocaleString()}
                              </p>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Display Reviewer's Previous Notes */}
                  {manuscript.reviewerNotes?.length > 0 && (
                    <div className="mt-4 border-t border-[#e2e8f0] pt-4">
                      <h4 className="text-[#10b981] text-sm font-semibold mb-2">
                        Your Previous Reviews:
                      </h4>
                      <div className="space-y-2">
                        {manuscript.reviewerNotes.map((note, index) => (
                          <div
                            key={index}
                            className="bg-white p-3 rounded border border-[#e2e8f0]"
                          >
                            <p className="text-[#1a365d]">{note.text}</p>
                            {note.action && (
                              <span className="inline-block mt-2 px-2 py-1 text-xs rounded bg-[#10b981] text-white">
                                {note.action}
                              </span>
                            )}
                            <p className="text-[#64748b] text-xs mt-2">
                              Added on:{" "}
                              {new Date(note.addedAt).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add Review Form - Always Open */}
                  {manuscript?.status != "Rejected" && (
                    <div className="w-full border-t border-[#e2e8f0] pt-4 mt-4">
                      <h4 className="text-[#10b981] text-lg font-semibold mb-4">
                        Add Review
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[#1a365d] mb-2">
                            Review Comments:
                          </label>
                          <textarea
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            className="w-full h-32 bg-white text-[#1a365d] rounded p-2 border border-[#e2e8f0]"
                            placeholder="Enter your review comments here..."
                          />
                        </div>
                        <div>
                          <label className="block text-[#1a365d] mb-2">
                            Recommendation:
                          </label>
                          <select
                            value={recommendation}
                            onChange={(e) => setRecommendation(e.target.value)}
                            className="w-full bg-white text-[#1a365d] rounded p-2 border border-[#e2e8f0]"
                          >
                            <option value="">Select a recommendation</option>
                            <option value="Accept">Accept</option>
                            <option value="Minor Revision">
                              Minor Revision
                            </option>
                            <option value="Major Revision">
                              Major Revision
                            </option>
                            <option value="Reject">Reject</option>
                          </select>
                        </div>
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleAddReview(manuscript._id)}
                            disabled={!reviewText.trim() || !recommendation}
                            className="px-4 py-2 bg-[#10b981] text-white rounded hover:bg-[#059669] disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Add Review
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {manuscripts.length === 0 && (
                <div className="text-center text-[#64748b]">
                  No manuscripts under review from this author.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReviewerDashboard;
