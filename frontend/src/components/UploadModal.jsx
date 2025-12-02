import { useState } from "react";
import { useAuth } from "../App";

const UploadModal = ({ manuscriptId, onClose, onSuccess }) => {
    const { user } = useAuth();
    const [uploadingFiles, setUploadingFiles] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [fileType, setFileType] = useState('docx'); // 'docx' or 'latex'

    const [files, setFiles] = useState({
        responseSheet: null,
        highlightedDoc: null,
        withoutHighlightedDoc: null,
    });

    const [previews, setPreviews] = useState({
        responseSheet: null,
        highlightedDoc: null,
        withoutHighlightedDoc: null,
    });

    const handleFileChange = (type, file) => {
        if (!file) return;

        // Validate file type based on upload section
        let allowedTypes = [];
        let errorMessage = '';

        if (type === 'responseSheet' || type === 'highlightedDoc') {
            allowedTypes = ['.pdf'];
            errorMessage = 'Please upload only PDF files';
        } else if (type === 'withoutHighlightedDoc') {
            if (fileType === 'docx') {
                allowedTypes = ['.docx'];
                errorMessage = 'Please upload only DOCX files';
            } else {
                allowedTypes = ['.tex', '.zip'];
                errorMessage = 'Please upload LaTeX files (.tex or .zip)';
            }
        }

        const fileExtension = file.name.split('.').pop().toLowerCase();

        if (!allowedTypes.includes(`.${fileExtension}`)) {
            alert(errorMessage);
            return;
        }

        setFiles(prev => ({
            ...prev,
            [type]: file
        }));

        setPreviews(prev => ({
            ...prev,
            [type]: file.name
        }));
    };

    const handleRemoveFile = (type) => {
        setFiles(prev => ({
            ...prev,
            [type]: null
        }));

        setPreviews(prev => ({
            ...prev,
            [type]: null
        }));
    };

    const handleFileTypeChange = (type) => {
        setFileType(type);
        // Clear the without highlighted file if type changes
        setFiles(prev => ({
            ...prev,
            withoutHighlightedDoc: null
        }));
        setPreviews(prev => ({
            ...prev,
            withoutHighlightedDoc: null
        }));
    };

    const handleUploadClick = () => {
        // Validate at least one file is selected
        if (!files.responseSheet && !files.highlightedDoc && !files.withoutHighlightedDoc) {
            alert('Please select at least one file to upload');
            return;
        }

        // Show confirmation popup
        setShowConfirmation(true);
    };

    const handleConfirmUpload = async () => {
        try {
            setUploadingFiles(true);
            setShowConfirmation(false);

            const formData = new FormData();

            if (files.responseSheet) {
                formData.append('responseSheet', files.responseSheet);
            }
            if (files.highlightedDoc) {
                formData.append('highlightedDoc', files.highlightedDoc);
            }
            if (files.withoutHighlightedDoc) {
                formData.append('withoutHighlightedDoc', files.withoutHighlightedDoc);
                formData.append('fileType', fileType); // Send file type to backend
            }

            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/manuscripts/${manuscriptId}/upload-revision-files`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                    },
                    body: formData,
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Upload failed');
            }

            const data = await response.json();

            alert('Files uploaded successfully!');

            if (onSuccess) {
                await onSuccess();
            }

            onClose();
        } catch (error) {
            console.error('Error uploading files:', error);
            alert(error.response?.data?.message || 'Failed to upload files. Please try again.');
        } finally {
            setUploadingFiles(false);
        }
    };

    const getAcceptedFileTypes = () => {
        if (fileType === 'docx') {
            return '.docx';
        }
        return '.tex,.zip';
    };

    const getFileTypeLabel = () => {
        if (fileType === 'docx') {
            return 'DOCX (MAX. 10MB)';
        }
        return 'LaTeX (.tex or .zip, MAX. 10MB)';
    };

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="bg-[#00796b] text-white p-4 rounded-t-lg flex justify-between items-center sticky top-0">
                        <h2 className="text-xl font-semibold">Upload Revision Files</h2>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-gray-200 text-2xl font-bold"
                            disabled={uploadingFiles}
                        >
                            ×
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-6">
                        {/* Response Sheet Upload - PDF Only */}
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-[#00796b] transition-colors">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-semibold text-gray-700">
                                    1. Response Sheet (PDF Only)
                                    <span className="text-red-500 ml-1">*</span>
                                </label>
                                {previews.responseSheet && (
                                    <button
                                        onClick={() => handleRemoveFile('responseSheet')}
                                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                                        disabled={uploadingFiles}
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>

                            {previews.responseSheet ? (
                                <div className="bg-green-50 border border-green-200 rounded p-3 flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-sm text-green-800 font-medium">{previews.responseSheet}</span>
                                    </div>
                                </div>
                            ) : (
                                <label className="cursor-pointer block">
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={(e) => handleFileChange('responseSheet', e.target.files?.[0])}
                                        className="hidden"
                                        disabled={uploadingFiles}
                                    />
                                    <div className="text-center py-6">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <p className="mt-2 text-sm text-gray-600">
                                            <span className="font-semibold text-[#00796b]">Click to upload</span> or drag and drop
                                        </p>
                                        <p className="text-xs text-gray-500">PDF Only (MAX. 10MB)</p>
                                    </div>
                                </label>
                            )}
                            <p className="text-xs text-gray-500 mt-2">Upload your response to reviewer comments</p>
                        </div>

                        {/* Highlighted Document Upload - PDF Only */}
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-[#00796b] transition-colors">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-semibold text-gray-700">
                                    2. Highlighted Document (PDF Only)
                                    <span className="text-red-500 ml-1">*</span>
                                </label>
                                {previews.highlightedDoc && (
                                    <button
                                        onClick={() => handleRemoveFile('highlightedDoc')}
                                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                                        disabled={uploadingFiles}
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>

                            {previews.highlightedDoc ? (
                                <div className="bg-green-50 border border-green-200 rounded p-3 flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-sm text-green-800 font-medium">{previews.highlightedDoc}</span>
                                    </div>
                                </div>
                            ) : (
                                <label className="cursor-pointer block">
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={(e) => handleFileChange('highlightedDoc', e.target.files?.[0])}
                                        className="hidden"
                                        disabled={uploadingFiles}
                                    />
                                    <div className="text-center py-6">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <p className="mt-2 text-sm text-gray-600">
                                            <span className="font-semibold text-[#00796b]">Click to upload</span> or drag and drop
                                        </p>
                                        <p className="text-xs text-gray-500">PDF Only (MAX. 10MB)</p>
                                    </div>
                                </label>
                            )}
                            <p className="text-xs text-gray-500 mt-2">Upload manuscript with tracked changes/highlights</p>
                        </div>

                        {/* Without Highlighted Document Upload - Choose Type */}
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-[#00796b] transition-colors">
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-semibold text-gray-700">
                                    3. Without Highlighted Document
                                    <span className="text-red-500 ml-1">*</span>
                                </label>
                                {previews.withoutHighlightedDoc && (
                                    <button
                                        onClick={() => handleRemoveFile('withoutHighlightedDoc')}
                                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                                        disabled={uploadingFiles}
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>

                            {/* File Type Selection */}
                            <div className="mb-4 flex space-x-4">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="fileType"
                                        value="docx"
                                        checked={fileType === 'docx'}
                                        onChange={() => handleFileTypeChange('docx')}
                                        disabled={uploadingFiles}
                                        className="w-4 h-4 text-[#00796b] focus:ring-[#00796b]"
                                    />
                                    <span className="text-sm text-gray-700">DOCX File</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="fileType"
                                        value="latex"
                                        checked={fileType === 'latex'}
                                        onChange={() => handleFileTypeChange('latex')}
                                        disabled={uploadingFiles}
                                        className="w-4 h-4 text-[#00796b] focus:ring-[#00796b]"
                                    />
                                    <span className="text-sm text-gray-700">LaTeX File</span>
                                </label>
                            </div>

                            {previews.withoutHighlightedDoc ? (
                                <div className="bg-green-50 border border-green-200 rounded p-3 flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-sm text-green-800 font-medium">{previews.withoutHighlightedDoc}</span>
                                    </div>
                                </div>
                            ) : (
                                <label className="cursor-pointer block">
                                    <input
                                        type="file"
                                        accept={getAcceptedFileTypes()}
                                        onChange={(e) => handleFileChange('withoutHighlightedDoc', e.target.files?.[0])}
                                        className="hidden"
                                        disabled={uploadingFiles}
                                    />
                                    <div className="text-center py-6">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <p className="mt-2 text-sm text-gray-600">
                                            <span className="font-semibold text-[#00796b]">Click to upload</span> or drag and drop
                                        </p>
                                        <p className="text-xs text-gray-500">{getFileTypeLabel()}</p>
                                    </div>
                                </label>
                            )}
                            <p className="text-xs text-gray-500 mt-2">Upload clean manuscript without any highlights</p>
                        </div>

                        {/* Info Box */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <div className="text-xs text-blue-800">
                                    <p className="font-semibold mb-1">Upload Guidelines:</p>
                                    <ul className="list-disc list-inside space-y-1">
                                        <li>Response Sheet and Highlighted Document must be PDF</li>
                                        <li>Without Highlighted Document: Choose DOCX or LaTeX format</li>
                                        <li>Maximum file size: 10MB per file</li>
                                        <li>You can remove and re-upload files before final submission</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end space-x-3 border-t border-gray-200">
                        <button
                            onClick={onClose}
                            disabled={uploadingFiles}
                            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUploadClick}
                            disabled={uploadingFiles || (!files.responseSheet && !files.highlightedDoc && !files.withoutHighlightedDoc)}
                            className="px-6 py-2 bg-[#00796b] text-white rounded-lg hover:bg-[#00acc1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                            <span>Upload All Files</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Confirmation Popup */}
            {showConfirmation && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="bg-yellow-100 rounded-full p-2">
                                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Confirm Upload</h3>
                        </div>

                        <p className="text-gray-600 mb-6">
                          Are you sure? These files will go to the editor and will be submitted for review.
</p>
                        <div className="bg-gray-50 rounded-lg p-3 mb-6">
                            <p className="text-sm text-gray-700 font-medium mb-2">Files to be uploaded:</p>
                            <ul className="text-sm text-gray-600 space-y-1">
                                {files.responseSheet && <li>• {previews.responseSheet}</li>}
                                {files.highlightedDoc && <li>• {previews.highlightedDoc}</li>}
                                {files.withoutHighlightedDoc && <li>• {previews.withoutHighlightedDoc}</li>}
                            </ul>
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowConfirmation(false)}
                                disabled={uploadingFiles}
                                className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmUpload}
                                disabled={uploadingFiles}
                                className="flex-1 px-4 py-2 bg-[#00796b] text-white rounded-lg hover:bg-[#00acc1] transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                            >
                                {uploadingFiles ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Uploading...</span>
                                    </>
                                ) : (
                                    <span>Confirm & Upload</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default UploadModal;