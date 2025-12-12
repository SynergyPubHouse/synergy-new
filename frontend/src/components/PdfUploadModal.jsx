// components/PdfUploadModal.jsx

import { useState } from "react";
import axios from "axios";

function PdfUploadModal({ isOpen, onClose, manuscript, userToken, onSuccess }) {
    // PDF states
    const [selectedPdfFile, setSelectedPdfFile] = useState(null);
    const [uploadingPdf, setUploadingPdf] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Tab state
    const [activeTab, setActiveTab] = useState("pdf");

    // Issue info states
    const [issueVolume, setIssueVolume] = useState("");
    const [issueNumber, setIssueNumber] = useState("");
    const [issueYear, setIssueYear] = useState(new Date().getFullYear().toString());
    const [issueTitle, setIssueTitle] = useState("");
    const [pageStart, setPageStart] = useState("");
    const [pageEnd, setPageEnd] = useState("");
    const [section, setSection] = useState("Research Article");

    // Section options
    const sectionOptions = [
        "Manuscript",
        "Research Article",
        "Review Article",

    ];

    // Check if issue info is filled
    const hasIssueInfo = issueVolume && issueNumber && issueYear;

    // Modal close handler
    const handleClose = () => {
        setSelectedPdfFile(null);
        setError("");
        setSuccess("");
        setIssueVolume("");
        setIssueNumber("");
        setIssueYear(new Date().getFullYear().toString());
        setIssueTitle("");
        setPageStart("");
        setPageEnd("");
        setSection("Research Article");
        setActiveTab("pdf");
        onClose();
    };

    // File select handler
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setError("");
        setSuccess("");

        if (!file) {
            setSelectedPdfFile(null);
            return;
        }

        if (file.type !== "application/pdf") {
            setError("Sirf PDF file allowed hai!");
            e.target.value = "";
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setError("File size 10MB se zyada nahi honi chahiye!");
            e.target.value = "";
            return;
        }

        setSelectedPdfFile(file);
    };

    // Publish function
    const handlePublish = async () => {
        if (!selectedPdfFile || !manuscript) {
            setError("Please select a PDF file first!");
            setActiveTab("pdf");
            return;
        }

        setUploadingPdf(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("pdfFile", selectedPdfFile);

            // Add issue info if filled
            if (issueVolume) formData.append("issueVolume", issueVolume);
            if (issueNumber) formData.append("issueNumber", issueNumber);
            if (issueYear) formData.append("issueYear", issueYear);
            if (issueTitle) formData.append("issueTitle", issueTitle);
            if (pageStart) formData.append("pageStart", pageStart);
            if (pageEnd) formData.append("pageEnd", pageEnd);
            if (section) formData.append("section", section);

            // API call
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/manuscript/publish/${manuscript._id}`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${userToken}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            console.log("Published:", response.data);

            // Success message
            const issueInfo = hasIssueInfo
                ? ` in Vol ${issueVolume}, No ${issueNumber}, ${issueYear}`
                : "";

            setSuccess(`Published successfully${issueInfo}!`);

            // Close modal after delay
            setTimeout(() => {
                handleClose();
                if (onSuccess) {
                    onSuccess(response.data);
                }
            }, 1500);

        } catch (err) {
            console.error("Publish error:", err);
            setError(err.response?.data?.message || "Error publishing manuscript");
        } finally {
            setUploadingPdf(false);
        }
    };

    if (!isOpen || !manuscript) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">

                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-indigo-500 to-purple-600">
                    <h2 className="text-xl font-semibold text-white flex items-center">
                        <span className="mr-2">📎</span>
                        Publish Manuscript
                    </h2>
                    <button onClick={handleClose} className="text-white hover:text-gray-200 text-2xl font-bold">
                        ×
                    </button>
                </div>

                {/* Manuscript Info */}
                <div className="px-4 py-3 bg-gray-50 border-b">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">📄 {manuscript.title}</p>
                            <p className="text-xs text-gray-500">
                                ID: {manuscript.customId || manuscript._id?.slice(-6).toUpperCase()} • {manuscript.type}
                            </p>
                        </div>
                        <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${manuscript.status === "Accepted" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                            }`}>
                            {manuscript.status}
                        </span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b">
                    <button
                        onClick={() => setActiveTab("pdf")}
                        className={`flex-1 py-3 px-4 text-sm font-medium relative ${activeTab === "pdf" ? "text-indigo-600 bg-indigo-50" : "text-gray-500 hover:bg-gray-50"
                            }`}
                    >
                        📄 PDF Upload
                        {selectedPdfFile && <span className="ml-2 w-2 h-2 bg-green-500 rounded-full inline-block"></span>}
                        {activeTab === "pdf" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>}
                    </button>
                    <button
                        onClick={() => setActiveTab("issue")}
                        className={`flex-1 py-3 px-4 text-sm font-medium relative ${activeTab === "issue" ? "text-indigo-600 bg-indigo-50" : "text-gray-500 hover:bg-gray-50"
                            }`}
                    >
                        📖 Issue Info
                        {hasIssueInfo && <span className="ml-2 w-2 h-2 bg-green-500 rounded-full inline-block"></span>}
                        {activeTab === "issue" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>}
                    </button>
                </div>

                {/* Content */}
                <div className="p-4" style={{ minHeight: "280px" }}>
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-700">❌ {error}</p>
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-700">✅ {success}</p>
                        </div>
                    )}

                    {/* PDF Tab */}
                    {activeTab === "pdf" && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-700 font-medium mb-2">Select PDF File:</label>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                    disabled={uploadingPdf}
                                    className="w-full p-2 border rounded-lg"
                                />
                                <p className="text-xs text-gray-500 mt-1">📌 Only PDF • Max: 10MB</p>
                            </div>

                            {selectedPdfFile ? (
                                <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-medium text-green-800">✅ File Ready</p>
                                        <p className="text-sm text-green-700 truncate">{selectedPdfFile.name}</p>
                                        <p className="text-xs text-green-600">{(selectedPdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                    <button onClick={() => setSelectedPdfFile(null)} className="text-red-500">🗑️</button>
                                </div>
                            ) : (
                                <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center">
                                    <p className="text-gray-400">📄 No file selected</p>
                                </div>
                            )}

                            {hasIssueInfo && (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-sm text-blue-800">
                                        <strong>📖 Issue:</strong> Vol {issueVolume}, No {issueNumber}, {issueYear}
                                        {issueTitle && ` - ${issueTitle}`}
                                    </p>
                                    <p className="text-xs text-blue-600 mt-1">
                                        {section}{pageStart && pageEnd && ` • Pages: ${pageStart}-${pageEnd}`}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Issue Tab */}
                    {activeTab === "issue" && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">📖 Issue Details</label>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Volume</label>
                                        <input
                                            type="number"
                                            value={issueVolume}
                                            onChange={(e) => setIssueVolume(e.target.value)}
                                            className="w-full p-2 border rounded-lg text-sm"
                                            placeholder="5"
                                            min="1"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Number</label>
                                        <input
                                            type="number"
                                            value={issueNumber}
                                            onChange={(e) => setIssueNumber(e.target.value)}
                                            className="w-full p-2 border rounded-lg text-sm"
                                            placeholder="2"
                                            min="1"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Year</label>
                                        <input
                                            type="number"
                                            value={issueYear}
                                            onChange={(e) => setIssueYear(e.target.value)}
                                            className="w-full p-2 border rounded-lg text-sm"
                                            placeholder="2025"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Issue Title (Optional)</label>
                                <input
                                    type="text"
                                    value={issueTitle}
                                    onChange={(e) => setIssueTitle(e.target.value)}
                                    className="w-full p-2 border rounded-lg text-sm"
                                    placeholder="Special Issue on AI Research"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-500 mb-1">📂 Section</label>
                                <select
                                    value={section}
                                    onChange={(e) => setSection(e.target.value)}
                                    className="w-full p-2 border rounded-lg text-sm"
                                >
                                    {sectionOptions.map((opt) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-500 mb-1">📄 Page Numbers</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="number"
                                        value={pageStart}
                                        onChange={(e) => setPageStart(e.target.value)}
                                        className="w-full p-2 border rounded-lg text-sm"
                                        placeholder="Start (e.g., 1)"
                                        min="1"
                                    />
                                    <input
                                        type="number"
                                        value={pageEnd}
                                        onChange={(e) => setPageEnd(e.target.value)}
                                        className="w-full p-2 border rounded-lg text-sm"
                                        placeholder="End (e.g., 15)"
                                        min="1"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50">
                    <div className="flex flex-wrap gap-3 mb-3 text-xs text-gray-600">
                        <span className={selectedPdfFile ? "text-green-600" : "text-gray-400"}>
                            {selectedPdfFile ? "✅" : "⬜"} PDF
                        </span>
                        <span className={hasIssueInfo ? "text-green-600" : "text-gray-400"}>
                            {hasIssueInfo ? `✅ Vol ${issueVolume}, No ${issueNumber}` : "⬜ Issue"}
                        </span>
                        {hasIssueInfo && <span className="text-blue-600">📂 {section}</span>}
                        {pageStart && pageEnd && <span className="text-green-600">📄 pp. {pageStart}-{pageEnd}</span>}
                    </div>

                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={handleClose}
                            disabled={uploadingPdf}
                            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handlePublish}
                            disabled={!selectedPdfFile || uploadingPdf}
                            className={`px-6 py-2 rounded-lg flex items-center font-medium ${!selectedPdfFile || uploadingPdf
                                ? "bg-gray-400 text-white cursor-not-allowed"
                                : "bg-indigo-600 text-white hover:bg-indigo-700"
                                }`}
                        >
                            {uploadingPdf ? (
                                <>
                                    <svg className="animate-spin mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                    </svg>
                                    Publishing...
                                </>
                            ) : "🚀 Publish"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PdfUploadModal;