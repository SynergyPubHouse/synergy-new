import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "../App";

const POLL_FAST_MS = 1000;
const POLL_SLOW_MS = 3000;
const FAST_POLL_DURATION_MS = 10000; // 10s

const DocumentConversionTest = () => {
    const { user } = useAuth();
    const [file, setFile] = useState(null);
    const [jobId, setJobId] = useState(null);
    const [status, setStatus] = useState(null);
    const [progress, setProgress] = useState(0);
    const [step, setStep] = useState("");
    const [error, setError] = useState(null);
    const [startedAt, setStartedAt] = useState(null);
    const [completedAt, setCompletedAt] = useState(null);
    const [durationMs, setDurationMs] = useState(null);
    const [logs, setLogs] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const pollTimerRef = useRef(null);
    const jobCreatedAtRef = useRef(null);

    const backendBase = import.meta.env.VITE_BACKEND_URL;

    const log = (message, extra = undefined) => {
        const entry = {
            ts: new Date().toISOString(),
            message,
            extra,
        };
        console.log("[DocumentConversionTest]", message, extra || "");
        setLogs((prev) => [...prev, entry]);
    };

    useEffect(() => {
        return () => {
            if (pollTimerRef.current) {
                clearTimeout(pollTimerRef.current);
            }
        };
    }, []);

    const handleFileChange = (e) => {
        const selected = e.target.files?.[0];
        if (!selected) return;

        const allowed = [".doc", ".docx", ".rtf", ".odt"];
        const ext = selected.name.split(".").pop()?.toLowerCase();
        if (!ext || !allowed.includes(`.${ext}`)) {
            alert("Please select a DOC, DOCX, RTF, or ODT file");
            return;
        }

        setFile(selected);
        setJobId(null);
        setStatus(null);
        setProgress(0);
        setStep("");
        setError(null);
        setStartedAt(null);
        setCompletedAt(null);
        setDurationMs(null);
        setLogs([]);
    };

    const startPolling = (id) => {
        if (!id) return;

        const pollOnce = async () => {
            try {
                const statusUrl = `${backendBase}/api/documents/${id}/status`;
                log("Polling status", { url: statusUrl });
                const resp = await axios.get(statusUrl);
                const data = resp.data;

                if (!data.success) {
                    throw new Error(data.message || "Status request failed");
                }

                setStatus(data.status);
                setProgress(typeof data.progress === "number" ? data.progress : 0);
                setStep(data.step || "");

                if (!startedAt && data.startedAt) {
                    setStartedAt(data.startedAt);
                }
                if (data.completedAt) {
                    setCompletedAt(data.completedAt);
                }

                if (data.status === "completed") {
                    log("Job completed", data);
                    if (jobCreatedAtRef.current) {
                        setDurationMs(Date.now() - jobCreatedAtRef.current);
                    }
                    // Open the PDF in a new tab using the backend streaming endpoint
                    const pdfUrl = `${backendBase}/api/documents/${id}/pdf`;
                    log("Opening PDF", { pdfUrl });
                    window.open(pdfUrl, "_blank");
                    return;
                }

                if (data.status === "failed") {
                    const msg = data.error || "Conversion failed";
                    setError(msg);
                    log("Job failed", data);
                    return;
                }

                const elapsed = jobCreatedAtRef.current
                    ? Date.now() - jobCreatedAtRef.current
                    : 0;
                const delay = elapsed < FAST_POLL_DURATION_MS ? POLL_FAST_MS : POLL_SLOW_MS;
                pollTimerRef.current = setTimeout(pollOnce, delay);
            } catch (err) {
                console.error("[DocumentConversionTest] Status poll error", err);
                setError(err.message || "Status polling failed");
                log("Status polling error", { message: err.message });
            }
        };

        pollOnce();
    };

    const handleStartConversion = async () => {
        if (!file) {
            alert("Please select a file first");
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);
            setLogs([]);
            setJobId(null);
            setStatus(null);
            setProgress(0);
            setStep("");
            setStartedAt(null);
            setCompletedAt(null);
            setDurationMs(null);

            const formData = new FormData();
            formData.append("file", file);

            const url = `${backendBase}/api/documents`;
            log("Starting conversion", { url, file: file.name, size: file.size });

            const resp = await axios.post(url, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            if (!resp.data?.success || !resp.data?.id) {
                throw new Error(resp.data?.message || "Failed to start conversion job");
            }

            const id = resp.data.id;
            setJobId(id);
            setStatus(resp.data.status);
            setProgress(resp.data.progress ?? 0);
            setStep(resp.data.step || "Queued");
            jobCreatedAtRef.current = Date.now();
            setStartedAt(new Date().toISOString());

            log("Job created", { id });
            startPolling(id);
        } catch (err) {
            console.error("[DocumentConversionTest] Upload error", err);
            setError(err.message || "Failed to start conversion job");
            log("Upload error", { message: err.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f9f9f9] p-6 text-[#212121] mt-20 md:mt-16">
            <div className="max-w-3xl mx-auto bg-white rounded-lg shadow border border-gray-200 p-6 space-y-6">
                <h1 className="text-2xl font-bold text-[#00796b] mb-2">
                    DOC/DOCX → PDF Conversion Test
                </h1>
                <p className="text-sm text-gray-600 mb-4">
                    This page uses the new <code>/api/documents</code> pipeline to convert a
                    document to PDF via the external LibreOffice service. Use it as a
                    sanity check for end-to-end behavior and timing.
                </p>

                {/* File selector */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        1. Select a DOC/DOCX/RTF/ODT file
                    </label>
                    <input
                        type="file"
                        accept=".doc,.docx,.rtf,.odt"
                        onChange={handleFileChange}
                        disabled={isSubmitting}
                        className="block w-full text-sm text-gray-700 border border-gray-300 rounded px-3 py-2"
                    />
                    {file && (
                        <p className="text-xs text-gray-500">
                            Selected: <strong>{file.name}</strong> ({" "}
                            {((file.size || 0) / (1024 * 1024)).toFixed(2)} MB)
                        </p>
                    )}
                </div>

                {/* Start button */}
                <div className="flex items-center space-x-3">
                    <button
                        onClick={handleStartConversion}
                        disabled={!file || isSubmitting}
                        className="px-4 py-2 bg-[#00796b] text-white rounded hover:bg-[#00acc1] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                        {isSubmitting ? "Starting..." : "Start Conversion"}
                    </button>
                </div>

                {/* Status block */}
                {jobId && (
                    <div className="border rounded-lg p-4 bg-gray-50 space-y-2">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm font-semibold text-gray-800">
                                    Job ID: <span className="font-mono break-all">{jobId}</span>
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Status: <strong>{status}</strong>
                                </p>
                                <p className="text-xs text-gray-500">
                                    Step: {step || "(none)"}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500">Progress</p>
                                <p className="text-lg font-semibold text-[#00796b]">
                                    {progress ?? 0}%
                                </p>
                            </div>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div
                                className="bg-[#00796b] h-2 rounded-full"
                                style={{ width: `${Math.min(100, Math.max(0, progress || 0))}%` }}
                            />
                        </div>

                        <div className="text-xs text-gray-500 mt-2 space-y-1">
                            {startedAt && <p>Started: {new Date(startedAt).toLocaleString()}</p>}
                            {completedAt && (
                                <p>Completed: {new Date(completedAt).toLocaleString()}</p>
                            )}
                            {durationMs != null && (
                                <p>
                                    Duration: {(durationMs / 1000).toFixed(1)} seconds
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded p-3">
                        <strong>Error:</strong> {error}
                    </div>
                )}

                {/* Logs */}
                {logs.length > 0 && (
                    <div className="border rounded-lg p-3 bg-gray-50 max-h-60 overflow-y-auto text-xs font-mono">
                        {logs.map((entry, idx) => (
                            <div key={idx} className="mb-1">
                                <span className="text-gray-500">[{entry.ts}] </span>
                                <span className="text-gray-800">{entry.message}</span>
                                {entry.extra && (
                                    <span className="text-gray-500">
                                        {" "}- {JSON.stringify(entry.extra)}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <div className="text-xs text-gray-500 border-t pt-3 mt-4">
                    <p>
                        Tip: Open your browser dev tools (Console tab) to see detailed logs
                        for this test flow. Server-side logs are available in Render under
                        your backend service.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DocumentConversionTest;
