// components/PdfUploadModal.jsx

import { useState, useEffect } from "react";
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

    // Authors states (New Beautiful UI)
    const [pdfAuthorsList, setPdfAuthorsList] = useState([]);           // Array of author names
    const [currentAuthorInput, setCurrentAuthorInput] = useState("");   // Current typing
    const [pdfCorrespondingAuthor, setPdfCorrespondingAuthor] = useState(""); // Selected corresponding

    // Section options
    const sectionOptions = [
        "Manuscript",
        "Research Article",
        "Review Article",
        "Short Communication",
        "Case Study",
        "Editorial"
    ];

    // Pre-populate authors from manuscript's registered authors when modal opens
    useEffect(() => {
        if (!isOpen || !manuscript) return;

        // Pre-populate authors list
        if (manuscript.authors?.length > 0 && pdfAuthorsList.length === 0) {
            const names = manuscript.authors
                .map(a => [a.firstName, a.middleName, a.lastName].filter(p => p && p.trim()).join(' '))
                .filter(name => name.trim());
            if (names.length > 0) setPdfAuthorsList(names);
        }

        // Pre-select corresponding author
        if (manuscript.correspondingAuthor && !pdfCorrespondingAuthor) {
            const ca = manuscript.correspondingAuthor;
            const caName = [ca.firstName, ca.middleName, ca.lastName].filter(p => p && p.trim()).join(' ');
            if (caName.trim()) setPdfCorrespondingAuthor(caName);
        }
    }, [isOpen, manuscript]);

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
        setPdfAuthorsList([]);
        setCurrentAuthorInput("");
        setPdfCorrespondingAuthor("");
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
            return;
        }

        if (pdfAuthorsList.length === 0) {
            setError("Kam se kam ek author daal do bhai!");
            setActiveTab("pdf");
            return;
        }

        if (!pdfCorrespondingAuthor) {
            setError("Corresponding author select karo!");
            setActiveTab("pdf");
            return;
        }

        setUploadingPdf(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("pdfFile", selectedPdfFile);

            // Issue info
            if (issueVolume) formData.append("issueVolume", issueVolume);
            if (issueNumber) formData.append("issueNumber", issueNumber);
            if (issueYear) formData.append("issueYear", issueYear);
            if (issueTitle) formData.append("issueTitle", issueTitle);
            if (pageStart) formData.append("pageStart", pageStart);
            if (pageEnd) formData.append("pageEnd", pageEnd);
            if (section) formData.append("section", section);

            // Authors - Send as JSON string
            formData.append("pdfAuthors", JSON.stringify(pdfAuthorsList));
            formData.append("pdfCorrespondingAuthor", pdfCorrespondingAuthor);

            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/manuscript/publish/${manuscript._id}`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${userToken}`,
                    },
                }
            );

            setSuccess("Published successfully!");
            setTimeout(() => {
                handleClose();
                onSuccess?.(response.data);
            }, 1500);

        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Publishing failed");
        } finally {
            setUploadingPdf(false);
        }
    };

    if (!isOpen || !manuscript) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b bg-gradient-to-r from-indigo-600 to-purple-700 sticky top-0 z-10">
                    <h2 className="text-2xl font-bold text-white flex items-center">
                        <span className="mr-3">Publish Manuscript</span>
                    </h2>
                    <button onClick={handleClose} className="text-white hover:text-gray-200 text-3xl font-bold">
                        ×
                    </button>
                </div>

                {/* Manuscript Info */}
                <div className="px-6 py-4 bg-gray-50 border-b">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                            <p className="text-lg font-semibold text-gray-800 truncate">{manuscript.title}</p>
                            <p className="text-sm text-gray-500">
                                ID: {manuscript.customId || manuscript._id?.slice(-6).toUpperCase()} • {manuscript.type}
                            </p>
                        </div>
                        <span className="ml-3 px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-800">
                            {manuscript.status}
                        </span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b bg-gray-50">
                    <button
                        onClick={() => setActiveTab("pdf")}
                        className={`flex-1 py-4 px-6 text-sm font-semibold relative transition-all ${activeTab === "pdf" ? "text-indigo-600 bg-white border-b-2 border-indigo-600" : "text-gray-600 hover:bg-gray-100"
                            }`}
                    >
                        PDF & Authors
                        {selectedPdfFile && <span className="ml-2 w-2 h-2 bg-green-500 rounded-full inline-block"></span>}
                    </button>
                    <button
                        onClick={() => setActiveTab("issue")}
                        className={`flex-1 py-4 px-6 text-sm font-semibold relative transition-all ${activeTab === "issue" ? "text-indigo-600 bg-white border-b-2 border-indigo-600" : "text-gray-600 hover:bg-gray-100"
                            }`}
                    >
                        Issue Details
                        {hasIssueInfo && <span className="ml-2 w-2 h-2 bg-green-500 rounded-full inline-block"></span>}
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">

                    {error && (
                        <div className="mb-5 p-4 bg-red-50 border border-red-300 rounded-lg">
                            <p className="text-sm text-red-700 font-medium">{error}</p>
                        </div>
                    )}
                    {success && (
                        <div className="mb-5 p-4 bg-green-50 border border-green-300 rounded-lg">
                            <p className="text-sm text-green-700 font-medium">{success}</p>
                        </div>
                    )}

                    {/* PDF & Authors Tab */}
                    {activeTab === "pdf" && (
                        <div className="space-y-8">

                            {/* PDF Upload */}
                            <div>
                                <label className="block text-lg font-semibold text-gray-800 mb-3">Published PDF File</label>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                    disabled={uploadingPdf}
                                    className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
                                />
                                <p className="text-xs text-gray-500 mt-2">Only PDF • Max: 10MB</p>
                            </div>

                            {selectedPdfFile && (
                                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl flex justify-between items-center">
                                    <div>
                                        <p className="text-lg font-bold text-green-800">File Ready!</p>
                                        <p className="text-sm text-green-700">{selectedPdfFile.name}</p>
                                        <p className="text-xs text-green-600">{(selectedPdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                    <button onClick={() => setSelectedPdfFile(null)} className="text-red-600 hover:text-red-800 text-2xl">×</button>
                                </div>
                            )}

                            {/* Authors Section */}
                            <div className="pt-6 border-t-2 border-gray-200">
                                <h3 className="text-xl font-bold text-indigo-700 mb-6">Authors </h3>

                                {/* Added Authors Tags */}
                                <div className="flex flex-wrap gap-3 mb-4">
                                    {pdfAuthorsList.map((author, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 rounded-full text-sm font-semibold border border-indigo-300 shadow-sm"
                                        >
                                            {author}
                                            <button
                                                type="button"
                                                onClick={() => setPdfAuthorsList(pdfAuthorsList.filter((_, i) => i !== index))}
                                                className="text-indigo-700 hover:text-indigo-900 font-bold"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>

                                {/* Add Author Input */}
                                <div className="flex gap-3 mb-4">
                                    <input
                                        type="text"
                                        value={currentAuthorInput}
                                        onChange={(e) => setCurrentAuthorInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ',') {
                                                e.preventDefault();
                                                const name = currentAuthorInput.trim();
                                                if (name && !pdfAuthorsList.includes(name)) {
                                                    setPdfAuthorsList([...pdfAuthorsList, name]);
                                                    setCurrentAuthorInput("");
                                                }
                                            }
                                        }}
                                        placeholder="Type author name and press Enter"
                                        className="flex-1 p-4 border-2 border-gray-300 rounded-xl text-base focus:ring-4 focus:ring-indigo-300 focus:border-indigo-500 outline-none transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const name = currentAuthorInput.trim();
                                            if (name && !pdfAuthorsList.includes(name)) {
                                                setPdfAuthorsList([...pdfAuthorsList, name]);
                                                setCurrentAuthorInput("");
                                            }
                                        }}
                                        className="px-6 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg"
                                    >
                                        Add Author
                                    </button>
                                </div>

                                {/* Corresponding Author */}
                                <div>
                                    <label className="block text-lg font-semibold text-gray-800 mb-3">
                                        Corresponding Author
                                    </label>
                                    <select
                                        value={pdfCorrespondingAuthor}
                                        onChange={(e) => setPdfCorrespondingAuthor(e.target.value)}
                                        className="w-full p-4 border-2 border-gray-300 rounded-xl text-base focus:ring-4 focus:ring-indigo-300 focus:border-indigo-500 outline-none transition-all"
                                    >
                                        <option value="">Select Corresponding Author</option>
                                        {pdfAuthorsList.map((author, index) => (
                                            <option key={index} value={author}>{author}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Issue Tab */}
                    {activeTab === "issue" && (
                        <div className="space-y-6">
                            {/* Issue Details */}
                            <div>
                                <label className="block text-lg font-semibold text-gray-800 mb-4">Issue Details</label>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Volume</label>
                                        <input type="number" value={issueVolume} onChange={(e) => setIssueVolume(e.target.value)} className="w-full p-3 border-2 rounded-lg" placeholder="5" />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Number</label>
                                        <input type="number" value={issueNumber} onChange={(e) => setIssueNumber(e.target.value)} className="w-full p-3 border-2 rounded-lg" placeholder="2" />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Year</label>
                                        <input type="number" value={issueYear} onChange={(e) => setIssueYear(e.target.value)} className="w-full p-3 border-2 rounded-lg" placeholder="2025" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Issue Title (Optional)</label>
                                <input type="text" value={issueTitle} onChange={(e) => setIssueTitle(e.target.value)} className="w-full p-3 border-2 rounded-lg" placeholder="Special Issue on AI in Healthcare" />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Section</label>
                                <select value={section} onChange={(e) => setSection(e.target.value)} className="w-full p-3 border-2 rounded-lg">
                                    {sectionOptions.map((opt) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Page Numbers</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="number" value={pageStart} onChange={(e) => setPageStart(e.target.value)} className="p-3 border-2 rounded-lg" placeholder="Start (1)" />
                                    <input type="number" value={pageEnd} onChange={(e) => setPageEnd(e.target.value)} className="p-3 border-2 rounded-lg" placeholder="End (15)" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
                    <div className="flex flex-wrap gap-4 text-sm">
                        <span className={selectedPdfFile ? "text-green-600 font-bold" : "text-gray-400"}>
                            {selectedPdfFile ? "PDF Ready" : "PDF Required"}
                        </span>
                        <span className={pdfAuthorsList.length > 0 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                            {pdfAuthorsList.length} Author{pdfAuthorsList.length !== 1 && "s"}
                        </span>
                        {pdfCorrespondingAuthor && <span className="text-indigo-600 font-bold">Corresp: {pdfCorrespondingAuthor}</span>}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleClose}
                            disabled={uploadingPdf}
                            className="px-6 py-3 bg-gray-300 rounded-xl hover:bg-gray-400 disabled:opacity-50 font-semibold"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handlePublish}
                            disabled={!selectedPdfFile || uploadingPdf || pdfAuthorsList.length === 0 || !pdfCorrespondingAuthor}
                            className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${!selectedPdfFile || uploadingPdf || pdfAuthorsList.length === 0 || !pdfCorrespondingAuthor
                                ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                                : "bg-gradient-to-r from-indigo-600 to-purple-700 text-white hover:from-indigo-700 hover:to-purple-800 shadow-xl"
                                }`}
                        >
                            {uploadingPdf ? (
                                <>Publishing...</>
                            ) : (
                                <>Publish Article</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PdfUploadModal;