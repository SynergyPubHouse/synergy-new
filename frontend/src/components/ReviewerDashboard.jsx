import React, { useState, useEffect, useCallback } from "react";
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
  const [forceRender, setForceRender] = useState(false);
  const navigate = useNavigate();
  console.log("users", users);
  console.log("ReviewerDashboard user:", user);
  // Store review inputs per-manuscript so text doesn't mirror across rows
  const [reviewTexts, setReviewTexts] = useState({}); // { [manuscriptId]: string }
  const [recommendations, setRecommendations] = useState({}); // { [manuscriptId]: string }
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [showRejectForm, setShowRejectForm] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchManuscripts = useCallback(async () => {
    try {
      if (!user || !user.token) {
        console.error("No token found");
        navigate("/login");
        return;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/reviewer/assigned-manuscripts`,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      const userManuscripts = {};
      response.data.forEach((manuscript) => {
        const seen = new Set();
        const authorsArray = Array.isArray(manuscript.allAuthors)
          ? manuscript.allAuthors
          : Array.isArray(manuscript.authors)
            ? manuscript.authors
            : [];
        const candidateAuthors = [];

        authorsArray.forEach((a) => {
          if (a && a._id && !seen.has(String(a._id))) {
            seen.add(String(a._id));
            candidateAuthors.push(a);
          }
        });

        if (manuscript.author && manuscript.author._id && !seen.has(String(manuscript.author._id))) {
          seen.add(String(manuscript.author._id));
          candidateAuthors.push(manuscript.author);
        }

        if (candidateAuthors.length === 0) {
          const fallbackId = manuscript._id;
          const groupKey = fallbackId;
          if (!userManuscripts[groupKey]) {
            userManuscripts[groupKey] = {
              _id: fallbackId,
              firstName: "",
              lastName: "",
              fullName: "Unknown Author",
              manuscripts: [],
            };
          }
          userManuscripts[groupKey].manuscripts.push(manuscript);
          return;
        }

        candidateAuthors.forEach((au) => {
          const firstName = au.firstName || "";
          const lastName = au.lastName || "";
          const fullName = `${firstName} ${lastName}`.trim() || "Unknown Author";
          const authorId = au._id || manuscript._id;
          const groupKey = authorId;
          if (!userManuscripts[groupKey]) {
            userManuscripts[groupKey] = {
              _id: authorId,
              firstName,
              lastName,
              fullName,
              manuscripts: [],
            };
          }
          userManuscripts[groupKey].manuscripts.push(manuscript);
        });
      });

      Object.values(userManuscripts).forEach((u) => {
        u.manuscripts.sort((a, b) => {
          const dateB = new Date(b.submissionDate || b.createdAt || b.updatedAt || 0).getTime();
          const dateA = new Date(a.submissionDate || a.createdAt || a.updatedAt || 0).getTime();
          return dateB - dateA;
        });
      });

      const usersList = Object.values(userManuscripts);
      setUsers(usersList);
      if (usersList.length > 0) {
        setSelectedUser(usersList[0]);
        setManuscripts(usersList[0].manuscripts);
      } else {
        setSelectedUser(null);
        setManuscripts([]);
      }
      return usersList;
    } catch (error) {
      console.error("Error fetching manuscripts:", error);
      if (error.response?.status === 401) {
        navigate("/login");
      }
    }
  }, [user, navigate]);

  const fetchInvitations = useCallback(async () => {
    try {
      if (!user || !user.token) {
        return;
      }
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/reviewer/pending-invitations`,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      setPendingInvitations(response.data);
    } catch (error) {
      console.error("Error fetching invitations:", error);
    }
  }, [user]);

  useEffect(() => {
    if (user && user.token) {
      fetchManuscripts();
      fetchInvitations();
    }
  }, [user, fetchManuscripts, fetchInvitations]);

  const handleUserClick = (user) => {
    console.log("=== Reviewer Dashboard Debug ===");
    console.log("Clicked user:", user);
    console.log("User manuscripts count:", user.manuscripts?.length || 0);

    setSelectedUser(user);
    setManuscripts(user.manuscripts || []);

    // Force re-render
    setForceRender(prev => !prev);

    console.log("Selected user manuscripts:", user.manuscripts?.length || 0);
    console.log("=== End Debug ===");
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

      const currentReviewText = (reviewTexts[manuscriptId] || "").trim();
      const currentRecommendation = recommendations[manuscriptId] || "";

      if (!currentReviewText || !currentRecommendation) {
        alert("Please provide both review comments and a recommendation");
        return;
      }

      const reviewerName = getUserFullName(user);
      const reviewerNote = {
        text: currentReviewText,
        action: currentRecommendation,
        addedBy: {
          name: reviewerName,
          role: "reviewer",
        },
        addedAt: new Date(),
      };

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL
        }/api/auth/reviewer/manuscripts/${manuscriptId}/review`,
        {
          comments: currentReviewText,
          recommendation: currentRecommendation,
          reviewerNote: reviewerNote,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      // const statusResponse = await axios.put(
      //   `${import.meta.env.VITE_BACKEND_URL
      //   }/api/manuscripts/${manuscriptId}/status`,
      //   { status: "Reviewed" },
      //   {
      //     headers: {
      //       Authorization: `Bearer ${user.token}`,
      //     },
      //   }
      // );

      // Clear the form
      setReviewTexts((prev) => ({ ...prev, [manuscriptId]: "" }));
      setRecommendations((prev) => ({ ...prev, [manuscriptId]: "" }));

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
        `${import.meta.env.VITE_BACKEND_URL
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

      console.log("Accepting invitation for manuscript:", manuscriptId);

      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL
        }/api/auth/reviewer/manuscripts/${manuscriptId}/accept-invitation`,
        {},
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      // Remove from pending invitations
      setPendingInvitations((prev) =>
        prev.filter((inv) => inv._id !== manuscriptId)
      );

      alert("Invitation accepted successfully!");

      console.log("Fetching fresh manuscripts after acceptance...");
      const refreshedUsers = await fetchManuscripts();
      await fetchInvitations();
      setForceRender(prev => !prev);

      if (Array.isArray(refreshedUsers) && refreshedUsers.length > 0) {
        const targetUser = refreshedUsers.find((u) =>
          (u.manuscripts || []).some((m) => m._id === manuscriptId)
        );
        if (targetUser) {
          setSelectedUser(targetUser);
          setManuscripts(targetUser.manuscripts || []);
        }
      }

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
                  className={`w-full text-left p-3 rounded-lg transition-all ${selectedUser === user
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
            <div className="space-y-4" key={`${selectedUser?._id || 'all'}-${forceRender}`}>
              {manuscripts.map((manuscript) => {
                // ═══════════════════════════════════════════════════════════════
                // UPDATED: Multiple invitations ke case mein LATEST invitation check
                // ═══════════════════════════════════════════════════════════════

                // Step 1: Get ALL invitations for this reviewer
                const allReviewerInvitations = manuscript.invitations?.filter(
                  (inv) => inv.email?.toLowerCase() === user?.email?.toLowerCase()
                ) || [];

                // Step 2: Sort by date (newest first) and get latest
                const sortedInvitations = [...allReviewerInvitations].sort((a, b) => {
                  const dateA = new Date(a.invitedAt || a.createdAt || 0);
                  const dateB = new Date(b.invitedAt || b.createdAt || 0);
                  return dateB - dateA; // Newest first
                });

                // Step 3: Latest invitation (for status check)
                const reviewerInvitation = sortedInvitations[0] || null;

                // Step 4: Check blocked - latest invitation OR any invitation blocked
                const isBlocked =
                  reviewerInvitation?.status === "blocked" ||
                  reviewerInvitation?.isReviewBlocked === true ||
                  allReviewerInvitations.some(
                    (inv) => inv.status === "blocked" || inv.isReviewBlocked === true
                  );

                // Step 5: Check accepted (latest invitation)
                const isAccepted = reviewerInvitation?.status === "accepted";

                const canSubmitReview = isAccepted && !isBlocked;

                // Extra info for display
                const currentRound = allReviewerInvitations.length;
                const previousReviewsCount = manuscript.reviewerNotes?.filter(
                  (note) =>
                    note.addedBy?.email?.toLowerCase() === user?.email?.toLowerCase() ||
                    note.addedBy?.id === user?.id ||
                    note.addedBy?.id === user?._id
                )?.length || 0;

                return (
                  <div
                    key={`${manuscript._id}-${forceRender}`}
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
                          {new Date(manuscript.submissionDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-col space-y-2">
                        {manuscript.mergedFileUrl && (
                          <button
                            onClick={() => handleViewPDF(manuscript.mergedFileUrl)}
                            className="w-full px-3 py-2 text-sm bg-teal-500 text-white rounded hover:bg-teal-600 transition-colors mb-1 flex items-center justify-center space-x-2"
                          >
                            Original PDF
                          </button>
                        )}

                        {manuscript.authorResponse?.responseSheet?.docxUrl && (
                          <button
                            onClick={() => window.open(manuscript.authorResponse.responseSheet.docxUrl, "_blank")}
                            className="w-full px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors mb-1 flex items-center justify-center space-x-2"
                          >
                            Response Sheet
                          </button>
                        )}

                        {manuscript.authorResponse?.highlightedDocument?.url && (
                          <button
                            onClick={() => window.open(manuscript.authorResponse.highlightedDocument.url, "_blank")}
                            className="w-full px-3 py-2 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors mb-1 flex items-center justify-center space-x-2"
                          >
                            Highlighted Doc
                          </button>
                        )}

                        {manuscript.authorResponse?.cleanDocument?.url && (
                          <button
                            onClick={() => {
                              const url = manuscript.authorResponse.cleanDocument.url;
                              if (!url) return;

                              if (url.includes('drive.google.com')) {
                                const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
                                const fileId = match?.[1];
                                if (fileId) {
                                  const isZip = url.toLowerCase().includes('.zip');
                                  if (isZip) {
                                    window.open(`https://drive.google.com/uc?export=download&id=${fileId}`, '_blank');
                                  } else {
                                    window.open(`https://drive.google.com/file/d/${fileId}/preview`, '_blank');
                                  }
                                }
                              } else {
                                const isZip = url.toLowerCase().includes('.zip');
                                const isPdf = url.toLowerCase().includes('.pdf');
                                if (isZip) {
                                  const link = document.createElement('a');
                                  link.href = url;
                                  link.download = 'clean-document.zip';
                                  link.target = '_blank';
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                } else if (isPdf) {
                                  window.open(url, "_blank");
                                } else {
                                  const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
                                  window.open(viewerUrl, "_blank");
                                }
                              }
                            }}
                            className="px-2 py-1 text-xs border border-green-600 text-green-600 rounded hover:bg-green-50 transition-colors"
                          >
                            without highlighted Doc
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Editor Notes */}
                    {manuscript.editorNotes?.length > 0 && (
                      <div className="mt-4 border-t border-[#e2e8f0] pt-4">
                        <h4 className="text-[#496580] text-sm font-semibold mb-2">
                          Editor Notes:
                        </h4>
                        <div className="space-y-2">
                          {manuscript.editorNotes
                            .filter((note) => note.visibility?.includes("reviewer"))
                            .map((note, index) => (
                              <div key={index} className="bg-white p-3 rounded border border-[#e2e8f0]">
                                <p className="text-[#1a365d]">{note.text}</p>
                                {note.action && (
                                  <span className={`inline-block mt-2 px-2 py-1 text-xs rounded ${note.action === "Under Review" ? "bg-[#f59e0b]" :
                                    note.action === "Reviewed" ? "bg-[#3b82f6]" :
                                      note.action === "Accepted" ? "bg-[#10b981]" : "bg-[#ef4444]"
                                    } text-white`}>
                                    {note.action}
                                  </span>
                                )}
                                <p className="text-[#64748b] text-xs mt-2">
                                  Added by: {note.addedBy?.name} on {new Date(note.addedAt).toLocaleString()}
                                </p>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Your Previous Reviews */}
                    {manuscript.reviewerNotes?.length > 0 && (
                      <div className="mt-4 border-t border-[#e2e8f0] pt-4">
                        <h4 className="text-[#10b981] text-sm font-semibold mb-2">
                          Your Previous Reviews:
                        </h4>
                        <div className="space-y-2">
                          {manuscript.reviewerNotes.map((note, index) => (
                            <div key={index} className="bg-white p-3 rounded border border-[#e2e8f0]">
                              <p className="text-[#1a365d]">{note.text}</p>
                              {note.action && (
                                <span className="inline-block mt-2 px-2 py-1 text-xs rounded bg-[#10b981] text-white">
                                  {note.action}
                                </span>
                              )}
                              <p className="text-[#64748b] text-xs mt-2">
                                Added on: {new Date(note.addedAt).toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Review Form Section */}
                    {manuscript.status !== "Rejected" && (
                      <div className="w-full border-t border-[#e2e8f0] pt-4 mt-4">
                        {isBlocked ? (
                          // BLOCKED MESSAGE - UPDATED with more info
                          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                            <div className="text-red-800 text-lg font-semibold mb-2">
                              🚫 Review Access Revoked
                            </div>
                            <p className="text-red-700">
                              Your invitation to review this manuscript has been <strong>blocked</strong> by the editor.
                            </p>
                            <p className="text-red-600 text-sm mt-2">
                              You can no longer submit a review.
                            </p>

                            {/* Show previous reviews count if any */}
                            {previousReviewsCount > 0 && (
                              <div className="mt-3 p-2 bg-gray-100 rounded">
                                <p className="text-gray-600 text-sm">
                                  📝 You previously submitted <strong>{previousReviewsCount}</strong> review(s) for this manuscript.
                                </p>
                              </div>
                            )}

                            {/* Show round info if multiple invitations */}
                            {currentRound > 1 && (
                              <p className="text-red-500 text-xs mt-3">
                                ⚠️ You were invited for Round {currentRound} but did not submit review.
                              </p>
                            )}

                            {reviewerInvitation?.reviewBlockedAt && (
                              <p className="text-red-500 text-xs mt-3">
                                Blocked on: {new Date(reviewerInvitation.reviewBlockedAt).toLocaleString()}
                              </p>
                            )}
                          </div>
                        ) : (
                          // NORMAL REVIEW FORM - BILKUL PURANA WAHI
                          <>
                            <h4 className="text-[#10b981] text-lg font-semibold mb-4">
                              Add Review {currentRound > 1 ? `(Round ${currentRound})` : ''}
                            </h4>
                            <div className="space-y-4">
                              <div>
                                <label className="block text-[#1a365d] mb-2">
                                  Review Comments:
                                </label>
                                <textarea
                                  value={reviewTexts[manuscript._id] || ""}
                                  onChange={(e) =>
                                    setReviewTexts((prev) => ({
                                      ...prev,
                                      [manuscript._id]: e.target.value,
                                    }))
                                  }
                                  className="w-full h-32 bg-white text-[#1a365d] rounded p-2 border border-[#e2e8f0]"
                                  placeholder="Enter your review comments here..."
                                />
                              </div>
                              <div>
                                <label className="block text-[#1a365d] mb-2">
                                  Recommendation:
                                </label>
                                <select
                                  value={recommendations[manuscript._id] || ""}
                                  onChange={(e) =>
                                    setRecommendations((prev) => ({
                                      ...prev,
                                      [manuscript._id]: e.target.value,
                                    }))
                                  }
                                  className="w-full bg-white text-[#1a365d] rounded p-2 border border-[#e2e8f0]"
                                >
                                  <option value="">Select a recommendation</option>
                                  <option value="Accept">Accept</option>
                                  <option value="Minor Revision">Minor Revision</option>
                                  <option value="Major Revision">Major Revision</option>
                                  <option value="Reject">Reject</option>
                                </select>
                              </div>
                              <div className="flex justify-end">
                                <button
                                  onClick={() => handleAddReview(manuscript._id)}
                                  disabled={
                                    !(reviewTexts[manuscript._id] || "").trim() ||
                                    !(recommendations[manuscript._id] || "")
                                  }
                                  className="px-4 py-2 bg-[#10b981] text-white rounded hover:bg-[#059669] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Add Review
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
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
