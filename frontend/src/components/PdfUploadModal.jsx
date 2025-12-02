import { useState } from "react";
import axios from "axios";

function PdfUploadModal({ isOpen, onClose, manuscript, userToken, onSuccess }) {
    const [selectedPdfFile, setSelectedPdfFile] = useState(null);
    const [uploadingPdf, setUploadingPdf] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Modal band karne ka function
    const handleClose = () => {
        setSelectedPdfFile(null);
        setError("");
        setSuccess("");
        onClose();
    };

    // File select karne par
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setError("");
        setSuccess("");

        if (!file) {
            setSelectedPdfFile(null);
            return;
        }

        // PDF check
        if (file.type !== "application/pdf") {
            setError("Sirf PDF file allowed hai!");
            e.target.value = "";
            return;
        }

        // Size check (10MB)
        if (file.size > 10 * 1024 * 1024) {
            setError("File size 10MB se zyada nahi honi chahiye!");
            e.target.value = "";
            return;
        }

        setSelectedPdfFile(file);
    };

    // Upload function
const handleUpload = async () => {
    if (!selectedPdfFile || !manuscript) {
        setError("Please select a PDF file");
        return;
    }

    setUploadingPdf(true);
    setError("");

    try {
        const formData = new FormData();
        formData.append("pdfFile", selectedPdfFile);
        formData.append("manuscriptId", manuscript._id);

        // STEP 1: PDF UPLOAD
        const uploadRes = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/api/manuscript/publish/${manuscript._id}`,
            formData,
            {
                headers: {
                    Authorization: `Bearer ${userToken}`,
                    "Content-Type": "multipart/form-data",
                },
            }
        );

        console.log("PDF upload complete:", uploadRes.data);

        // STEP 2: STATUS UPDATE -> Published
        const statusRes = await axios.put(
            `${import.meta.env.VITE_BACKEND_URL}/api/manuscripts/${manuscript._id}/status`,
            { status: "Published" },
            {
                headers: {
                    Authorization: `Bearer ${userToken}`,
                },
            }
        );

        console.log("Status update successful:", statusRes.data);

        // (Optional) STEP 3: Fetch Manuscript Details
        // const detailsRes = await axios.get(
        //     `${import.meta.env.VITE_BACKEND_URL}/api/manuscripts/${manuscript._id}`,
        //     {
        //         headers: { Authorization: `Bearer ${userToken}` },
        //     }
        // );
        // console.log("Manuscript details fetched:", detailsRes.data);

        setSuccess("PDF upload + Status update successful!");

        // Modal close
        setTimeout(() => {
            handleClose();
            if (onSuccess) {
                onSuccess(uploadRes.data);
            }
        }, 1500);

    } catch (err) {
        console.error("PDF upload or status update error:", err);
        setError(err.response?.data?.message || "Error occurred while uploading PDF or updating status");
    } finally {
        setUploadingPdf(false);
    }
};


    // Agar modal band hai toh kuch mat dikhao
    if (!isOpen || !manuscript) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">

                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">
                        📎 Upload PDF File
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                    >
                        ×
                    </button>
                </div>

                {/* Manuscript Info */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
                    <p className="text-sm text-gray-600 mb-1">
                        <span className="font-semibold">📄 Manuscript:</span>{" "}
                        {manuscript.title}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                        <span className="font-semibold">🆔 ID:</span>{" "}
                        {manuscript.customId || manuscript._id?.slice(-6).toUpperCase()}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                        <span className="font-semibold">📊 Status:</span>{" "}
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${manuscript.status === "Pending" ? "bg-blue-100 text-blue-800" :
                            manuscript.status === "Under Review" ? "bg-yellow-100 text-yellow-800" :
                                manuscript.status === "Accepted" ? "bg-green-100 text-green-800" :
                                    "bg-gray-100 text-gray-800"
                            }`}>
                            {manuscript.status}
                        </span>
                    </p>
                    <p className="text-sm text-gray-600">
                        <span className="font-semibold">📁 Type:</span>{" "}
                        {manuscript.type}
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700">❌ {error}</p>
                    </div>
                )}

                {/* Success Message */}
                {success && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-700">✅ {success}</p>
                    </div>
                )}

                {/* File Input */}
                <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">
                        PDF File Select karo:
                    </label>
                    <input
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handleFileChange}
                        disabled={uploadingPdf}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        📌 Sirf PDF files allowed hain | Maximum size: 10MB
                    </p>
                </div>

                {/* Selected File Info */}
                {selectedPdfFile && (
                    <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-indigo-800">
                                    ✅ File Selected:
                                </p>
                                <p className="text-sm text-indigo-700 truncate max-w-[250px]">
                                    📄 {selectedPdfFile.name}
                                </p>
                                <p className="text-xs text-indigo-600">
                                    📦 Size: {(selectedPdfFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedPdfFile(null)}
                                disabled={uploadingPdf}
                                className="text-red-500 hover:text-red-700 p-1 disabled:opacity-50"
                                title="Remove file"
                            >
                                🗑️
                            </button>
                        </div>
                    </div>
                )}

                {/* Buttons */}
                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                    <button
                        onClick={handleClose}
                        disabled={uploadingPdf}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={!selectedPdfFile || uploadingPdf}
                        className={`px-4 py-2 rounded-lg transition-colors flex items-center ${!selectedPdfFile || uploadingPdf
                            ? "bg-gray-400 text-white cursor-not-allowed"
                            : "bg-indigo-500 text-white hover:bg-indigo-600"
                            }`}
                    >
                        {uploadingPdf ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Uploading...
                            </>
                        ) : (
                            <>📤 Upload</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PdfUploadModal;