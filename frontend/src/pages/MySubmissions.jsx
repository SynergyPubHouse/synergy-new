import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../App";
import { Link, useNavigate } from "react-router-dom";
import UploadModal from "../components/UploadModal";
// import { CLOSING } from "ws";

const BASE_URL = "/journal/jics";

const MySubmissions = () => {
  const { user } = useAuth();
  const [manuscripts, setManuscripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(null);
  const [showNotes, setShowNotes] = useState(null);
  const [uploadingResponseFor, setUploadingResponseFor] = useState(null);
  const [uploadingHighlightedFor, setUploadingHighlightedFor] = useState(null);
  const [buildingPdfFor, setBuildingPdfFor] = useState(null);
  const [pdfViewedIds, setPdfViewedIds] = useState(new Set());

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  // Add these states at the top with other useState declarations
  const [showUploadModal, setShowUploadModal] = useState(null); // Store manuscriptId

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
      setPdfViewedIds((prev) => {
        const updated = new Set();
        (response.data || []).forEach((manuscript) => {
          if (prev.has(manuscript._id)) {
            updated.add(manuscript._id);
          }
        });
        return updated;
      });
      setLoading(false);
    } catch (err) {
      console.error("Error fetching manuscripts:", err);
      setError("Failed to fetch manuscripts");
      setLoading(false);
    }
  };
  const handleEditDraft = (manuscriptId) => {
    navigate(`${BASE_URL}/edit-manuscript/${manuscriptId}`);
  };

  const canEditManuscript = (manuscript) => {
    return ["Pending", "Saved"].includes(manuscript.status);
  };
  const handleViewPdf = (manuscriptId, mergedFileUrl) => {
    if (mergedFileUrl) {
      window.open(mergedFileUrl, "_blank");
      setPdfViewedIds((prev) => {
        const updated = new Set(prev);
        updated.add(manuscriptId);
        return updated;
      });
    } else {
      alert("PDF is not available yet.");
    }
  };

  const handleResponseUpload = async (manuscriptId, file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".docx")) {
      alert("Please upload a DOCX file for your response.");
      return;
    }

    const manuscript = manuscripts.find((m) => m._id === manuscriptId);
    if (!manuscript) {
      alert("Manuscript not found.");
      return;
    }
    if (manuscript.revisionLocked || manuscript.status === "Rejected") {
      alert(
        "All revision attempts are exhausted. You cannot upload additional responses."
      );
      return;
    }




    try {
      setUploadingResponseFor(manuscriptId);
      const formData = new FormData();
      formData.append("responseDoc", file);
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL
        }/api/manuscripts/${manuscriptId}/upload-response`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      alert("Response document uploaded successfully.");
      await fetchManuscripts();
    } catch (error) {
      console.error("Error uploading response document:", error);
      alert("Failed to upload response document. Please try again.");
    } finally {
      setUploadingResponseFor(null);
    }
  };

  const handleBuildRevisionPdf = async (manuscriptId) => {
    const manuscript = manuscripts.find((m) => m._id === manuscriptId);
    if (!manuscript) {
      alert("Manuscript not found.");
      return;
    }
    if (manuscript.revisionLocked || manuscript.status === "Rejected") {
      alert("All revision attempts are exhausted. You cannot build a new PDF.");
      return;
    }

    try {
      setBuildingPdfFor(manuscriptId);
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL
        }/api/manuscripts/${manuscriptId}/build-revision-pdf`,
        {},
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (response.data?.success) {
        alert(
          "Updated PDF built successfully. Please review it before sending to the editor."
        );
        await fetchManuscripts();
      } else {
        alert("PDF build completed, but no URL was returned.");
      }
    } catch (error) {
      console.error("Error building updated PDF:", error);
      alert(
        error.response?.data?.message ||
        "Failed to build updated PDF. Please try again."
      );
    } finally {
      setBuildingPdfFor(null);
    }
  };

  const handleSendToEditor = async (manuscriptId) => {
    const manuscript = manuscripts.find((m) => m._id === manuscriptId);
    if (!manuscript) {
      alert("Manuscript not found.");
      return;
    }
    if (manuscript.revisionLocked || manuscript.status === "Rejected") {
      alert(
        "All revision attempts are exhausted. This manuscript is already rejected."
      );
      return;
    }

    try {
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL
        }/api/manuscripts/${manuscriptId}/status`,
        { status: "Under Review" },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      alert("Revision sent to the editor successfully.");
      setPdfViewedIds((prev) => {
        const updated = new Set(prev);
        updated.delete(manuscriptId);
        return updated;
      });
      await fetchManuscripts();
    } catch (error) {
      console.error("Error sending manuscript to editor:", error);
      alert("Failed to update manuscript status. Please try again.");
    }
  };

  const handleDownloadReviewDocx = (reviewDocxUrl) => {
    if (reviewDocxUrl) {
      window.open(reviewDocxUrl, "_blank");
    } else {
      alert("Review comments document is not available yet.");
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
        `${import.meta.env.VITE_BACKEND_URL
        }/api/manuscripts/${manuscriptId}/status`,
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
  };

  const renderNotes = (manuscript) => {
    if (!manuscript) return null;

    // Authors can only see editorNotesForAuthor
    const notes = manuscript.editorNotesForAuthor;
    const title = "Editor Notes for Author";

    return (
      <div className="mt-4 p-4 bg-[#e0f7fa] rounded-lg border border-[#e0e0e0]">
        <h3 className="text-lg font-semibold text-[#00796b] mb-3">{title}</h3>
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
                      className={`px-2 py-1 text-xs rounded ${note.action === "Rejected"
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
          <p className="text-[#00796b]">No {title.toLowerCase()} available.</p>
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

  const handleUploadHighlightedFile = async (manuscriptId, file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("highlightedFile", file);

    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL
        }/api/manuscripts/${manuscriptId}/upload-highlighted`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      alert("Highlighted revision file uploaded successfully.");
      await fetchManuscripts();
    } catch (err) {
      alert("Failed to upload highlighted file");
      console.error(err);
    }
  };

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
            <p className="text-[#00796b]">No manuscripts submitted yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md border border-gray-200">
            {/* Table Header */}
            <div className="bg-[#00796b] text-white p-4">
              <h2 className="text-lg font-semibold">My Submissions ({manuscripts.length})</h2>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider w-20">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-80">Title</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider w-32">Submitted</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider w-32">Updated</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider w-24">Type</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider w-28">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider w-32">Review comments</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider w-28">Files</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider w-36">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[...manuscripts]
                    .sort((a, b) => {
                      const dateB =
                        new Date(b.submissionDate || b.createdAt || b.updatedAt || 0).getTime();
                      const dateA =
                        new Date(a.submissionDate || a.createdAt || a.updatedAt || 0).getTime();
                      return dateB - dateA;
                    })
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((manuscript, index) => {
                      const attemptsUsed = manuscript.revisionAttempts || 0;
                      const maxAttempts = manuscript.maxRevisionAttempts || 3;
                      const attemptsExhausted =
                        manuscript.revisionLocked ||
                        attemptsUsed >= maxAttempts ||
                        manuscript.status === "Rejected";
                      const hasResponseDoc =
                        Boolean(manuscript.authorResponse?.pdfUrl) ||
                        Boolean(manuscript.authorResponse?.docxUrl);
                      const hasBuiltRevision = Boolean(
                        manuscript.revisedPdfBuiltAt || manuscript.revisionCombinedPdfUrl
                      );
                      const canSendToEditor =
                        ["Revision Required", "Resubmit", "Minor Revision Required", "Major Revision Required", "Revision Requested", "Reviewed"].includes(manuscript.status) &&
                        hasBuiltRevision &&
                        pdfViewedIds.has(manuscript._id) &&
                        !attemptsExhausted;

                      return (
                        <tr key={manuscript._id} className="hover:bg-gray-50">
                          {/* ID Column */}
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              {manuscript.customId || manuscript._id.slice(-6).toUpperCase()}
                            </span>
                          </td>

                          {/* Title Column */}
                          <td className="px-4 py-3 w-80">
                            <div className="text-sm font-medium text-gray-900 break-words" title={manuscript.title}>
                              {manuscript.title}
                            </div>
                          </td>

                          {/* Submitted Column */}
                          <td className="px-4 py-3 text-center">
                            <div className="text-xs text-gray-600">
                              <div className="font-medium">
                                {manuscript.createdAt
                                  ? new Date(manuscript.createdAt).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })
                                  : "N/A"}
                              </div>
                              <div className="text-gray-500">
                                {manuscript.createdAt
                                  ? new Date(manuscript.createdAt).toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  })
                                  : "N/A"}
                              </div>
                            </div>
                          </td>

                          {/* Updated Column */}
                          <td className="px-4 py-3 text-center">
                            <div className="text-xs text-gray-600">
                              {manuscript.updatedAt && manuscript.updatedAt !== manuscript.createdAt ? (
                                <>
                                  <div className="font-medium">
                                    {new Date(manuscript.updatedAt).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </div>
                                  <div className="text-gray-500">
                                    {new Date(manuscript.updatedAt).toLocaleTimeString("en-US", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      hour12: true,
                                    })}
                                  </div>
                                </>
                              ) : (
                                <span className="text-gray-400">Not updated</span>
                              )}
                            </div>
                          </td>

                          {/* Type Column */}
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {manuscript.type}
                            </span>
                          </td>

                          {/* Status Column */}
                          <td className="px-4 py-3 text-center">
                            <div className="flex flex-col items-center space-y-1">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${manuscript.status === "Under Review"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : manuscript.status === "Rejected"
                                    ? "bg-red-100 text-red-800"
                                    : manuscript.status === "Accepted"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                              >
                                {manuscript.status || "Pending"}
                              </span>
                              {manuscript.status === "Revision Required" && (
                                <div className="text-xs text-gray-500">
                                  {attemptsUsed}/{maxAttempts} attempts
                                </div>
                              )}
                              {attemptsExhausted && (
                                <div className="text-xs text-red-600 font-medium">
                                  Attempts exhausted
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Actions Column */}
                          <td className="px-4 py-3">
                            <div className="flex flex-col space-y-1 min-w-[140px]">
                              {manuscript.reviewDocxUrl && (
                                <button
                                  onClick={() => {
                                    try {
                                      let fileId;
                                      const fileUrl = manuscript.reviewDocxUrl;

                                      // Extract file ID from Google Drive URL
                                      if (fileUrl.includes('/file/d/')) {
                                        fileId = fileUrl.split('/file/d/')[1].split('/')[0];
                                      } else if (fileUrl.includes('id=')) {
                                        fileId = fileUrl.split('id=')[1].split('&')[0];
                                      } else if (fileUrl.includes('/uc?')) {
                                        // Already in download format
                                        window.open(fileUrl, '_blank');
                                        return;
                                      }

                                      if (fileId) {
                                        // Create direct download link for Google Drive
                                        const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

                                        // Create anchor tag for download
                                        const link = document.createElement('a');
                                        link.href = downloadUrl;
                                        link.download = `review_comments_${manuscript.manuscriptId || 'document'}.docx`;
                                        link.target = '_blank';
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                      } else {
                                        // Fallback: Open the file URL directly
                                        window.open(fileUrl, '_blank');
                                      }
                                    } catch (error) {
                                      console.error('Download error:', error);
                                      window.open(manuscript.reviewDocxUrl, '_blank');
                                    }
                                  }}
                                  className="px-2 py-1 text-xs border border-purple-600 text-purple-600 rounded hover:bg-purple-50 transition-colors inline-flex items-center gap-1"
                                >
                                  <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                                    />
                                  </svg>
                                  Review Comments
                                </button>
                              )}
                              {manuscript.reviewDocxUrl && (
                                // <button
                                //   onClick={() => handleBuildRevisionPdf(manuscript._id)}
                                //   disabled={!hasResponseDoc || buildingPdfFor === manuscript._id || attemptsExhausted}
                                //   className={`px-2 py-1 text-xs border rounded transition-colors ${!hasResponseDoc
                                //     ? "border-gray-300 text-gray-400 cursor-not-allowed"
                                //     : buildingPdfFor === manuscript._id
                                //       ? "border-orange-600 text-orange-600 bg-orange-50 cursor-wait"
                                //       : attemptsExhausted
                                //         ? "border-gray-300 text-gray-400 cursor-not-allowed"
                                //         : "border-orange-600 text-orange-600 hover:bg-orange-50"
                                //     }`}
                                // >
                                //   {buildingPdfFor === manuscript._id ? "Building..." : "Build PDF"}
                                // </button>
                                <></>
                              )}
                              {canSendToEditor && (
                                <button
                                  onClick={() => handleSendToEditor(manuscript._id)}
                                  className="px-2 py-1 text-xs border border-green-600 text-green-600 rounded hover:bg-green-50 transition-colors"
                                >
                                  Send to Editor
                                </button>
                              )}
                              {/* <button
                                onClick={() => handleNotesClick(manuscript._id)}
                                className="px-2 py-1 text-xs border border-indigo-600 text-indigo-600 rounded hover:bg-indigo-50 transition-colors"
                              >
                                Notes
                              </button> */}
                            </div>
                          </td>




                          {/* Files Column */}
                          <td className="px-4 py-3">
                            <div className="flex flex-col space-y-1 min-w-[140px]">
                              {/* Original Merged PDF */}
                              {manuscript.mergedFileUrl && (
                                <button
                                  onClick={() => {
                                    window.open(manuscript.mergedFileUrl, "_blank");
                                    setPdfViewedIds((prev) => {
                                      const updated = new Set(prev);
                                      updated.add(manuscript._id);
                                      return updated;
                                    });
                                  }}
                                  className="px-2 py-1 text-xs border border-teal-600 text-teal-600 rounded hover:bg-teal-50 transition-colors"
                                >
                                  Original PDF
                                </button>
                              )}

                              {/* Response Sheet (PDF) */}
                              {manuscript.authorResponse?.docxUrl && (
                                <button
                                  onClick={() => window.open(manuscript.authorResponse.docxUrl, "_blank")}
                                  className="px-2 py-1 text-xs border border-blue-600 text-blue-600 rounded hover:bg-blue-50 transition-colors"
                                >
                                  Response Sheet
                                </button>
                              )}

                              {/* Highlighted Document (PDF) */}
                              {manuscript.authorResponse?.highlightedFileUrl && (
                                <button
                                  onClick={() => window.open(manuscript.authorResponse.highlightedFileUrl, "_blank")}
                                  className="px-2 py-1 text-xs border border-purple-600 text-purple-600 rounded hover:bg-purple-50 transition-colors"
                                >
                                  Highlighted Doc
                                </button>
                              )}

                              {/* Without Highlighted Document (DOCX/LaTeX) */}
                              {manuscript.authorResponse?.withoutHighlightedFileUrl && (
                                <button
                                  onClick={() => {
                                    const url = manuscript.authorResponse.withoutHighlightedFileUrl;

                                    // Check if it's a Google Drive URL
                                    if (url.includes('drive.google.com')) {
                                      // Extract file ID from Google Drive URL
                                      const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
                                      const fileIdMatch2 = url.match(/id=([a-zA-Z0-9_-]+)/);
                                      const fileId = fileIdMatch?.[1] || fileIdMatch2?.[1];

                                      if (fileId) {
                                        // Check file type from URL or use preview
                                        const isZip = url.toLowerCase().includes('.zip');
                                        const isDocx = url.toLowerCase().includes('.docx') || url.toLowerCase().includes('.doc');
                                        const isTex = url.toLowerCase().includes('.tex');

                                        if (isZip) {
                                          // Download ZIP directly
                                          const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
                                          window.open(downloadUrl, '_blank');
                                        } else if (isDocx || isTex) {
                                          // Preview DOCX/TEX in Google Docs Viewer
                                          const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
                                          window.open(previewUrl, '_blank');
                                        } else {
                                          // Default: Open Google Drive view
                                          const viewUrl = `https://drive.google.com/file/d/${fileId}/view`;
                                          window.open(viewUrl, '_blank');
                                        }
                                      } else {
                                        // Fallback: Open original URL
                                        window.open(url, '_blank');
                                      }
                                    } else {
                                      // Non-Google Drive URL
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
                                  Clean Doc
                                </button>
                              )}

                              {/* Combined Revision PDF */}
                              {manuscript.revisionCombinedPdfUrl && (
                                <button
                                  onClick={() => {
                                    window.open(manuscript.revisionCombinedPdfUrl, "_blank");
                                    setPdfViewedIds((prev) => {
                                      const updated = new Set(prev);
                                      updated.add(manuscript._id);
                                      return updated;
                                    });
                                  }}
                                  className="px-2 py-1 text-xs border border-orange-600 text-orange-600 rounded hover:bg-orange-50 transition-colors"
                                >
                                  Combined PDF
                                </button>
                              )}

                              {/* Old Highlighted Revision File (if exists separately) */}
                              {manuscript.highlightedRevisionFileUrl && (
                                <button
                                  onClick={() => {
                                    const url = manuscript.highlightedRevisionFileUrl;
                                    const viewerUrl = url.endsWith(".pdf")
                                      ? url
                                      : `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
                                    window.open(viewerUrl, "_blank");
                                  }}
                                  className="px-2 py-1 text-xs border border-indigo-600 text-indigo-600 rounded hover:bg-indigo-50 transition-colors"
                                >
                                  Old Highlighted
                                </button>
                              )}

                              {/* Message if PDF needs to be viewed before sending to editor */}
                              {manuscript.revisedPdfBuiltAt &&
                                !pdfViewedIds.has(manuscript._id) &&
                                manuscript.status === "Revision Required" && (
                                  <p className="text-xs text-amber-600 text-center bg-amber-50 px-2 py-1 rounded border border-amber-200">
                                    View PDF to enable "Send to Editor"
                                  </p>
                                )}

                              {/* No files available message */}
                              {!manuscript.mergedFileUrl &&
                                !manuscript.authorResponse?.docxUrl &&
                                !manuscript.authorResponse?.highlightedFileUrl &&
                                !manuscript.authorResponse?.withoutHighlightedFileUrl &&
                                !manuscript.revisionCombinedPdfUrl &&
                                !manuscript.highlightedRevisionFileUrl && (
                                  <span className="text-xs text-gray-400 italic text-center">
                                    No files
                                  </span>
                                )}
                            </div>
                          </td>

                          {/* Response Column */}
                          {/* Actions Column */}
                          <td className="px-4 py-3">
                            <div className="flex flex-col space-y-2 min-w-[140px]">

                              {/* 🔥 NEW: Edit Button - Only for Pending/Saved */}
                              {canEditManuscript(manuscript) && (
                                <button
                                  onClick={() => handleEditDraft(manuscript._id)}
                                  className="w-full px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  <span>Edit Draft</span>
                                </button>
                              )}

                              {/* Existing Upload Files Button - keep as is but add condition */}
                              {!canEditManuscript(manuscript) &&
                                !["Accepted", "Rejected", "Published", "Under Review"].includes(manuscript.status) &&
                                !attemptsExhausted && (
                                  <button
                                    onClick={() => setShowUploadModal(manuscript._id)}
                                    disabled={attemptsExhausted}
                                    className="w-full px-3 py-2 text-sm font-medium text-white bg-[#00796b] rounded-lg hover:bg-[#00acc1] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <span>Upload Files</span>
                                  </button>
                                )}

                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, manuscripts.length)}
                  </span>{" "}
                  of <span className="font-medium">{manuscripts.length}</span> results
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <div className="flex space-x-1">
                    {Array.from({ length: Math.ceil(manuscripts.length / itemsPerPage) }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 text-sm border rounded ${currentPage === page
                          ? "bg-[#00796b] text-white border-[#00796b]"
                          : "border-gray-300 hover:bg-gray-100"
                          }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === Math.ceil(manuscripts.length / itemsPerPage)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>

            {/* Summary Footer */}
            <div className="bg-gray-50 p-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">{manuscripts.length}</div>
                  <div className="text-gray-600">Total Submissions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600">
                    {manuscripts.filter(m => m.status === "Under Review").length}
                  </div>
                  <div className="text-gray-600">Under Review</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {manuscripts.filter(m => m.status === "Accepted").length}
                  </div>
                  <div className="text-gray-600">Accepted</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-teal-600">
                    {manuscripts.filter(m => m.status === "Published").length}
                  </div>
                  <div className="text-gray-600">Published</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {manuscripts.filter(m => m.status === "Rejected").length}
                  </div>
                  <div className="text-gray-600">Rejected</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 border border-[#e0e0e0]">
            <h3 className="text-xl font-bold text-[#00796b] mb-4">Warning!</h3>
            <p className="text-[#00796b] mb-6">
              Are you sure you want to withdraw this manuscript? This action
              cannot be undone and all data will be permanently deleted.
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
      {showUploadModal && (
        <UploadModal
          manuscriptId={showUploadModal}
          onClose={() => setShowUploadModal(null)}
          onSuccess={fetchManuscripts}
        />
      )}
    </div>
  );
};

export default MySubmissions;
