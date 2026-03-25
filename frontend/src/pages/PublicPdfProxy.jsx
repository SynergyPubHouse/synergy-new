import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function buildBackendPdfUrl(filename) {
  const backendBaseUrl = import.meta.env.VITE_BACKEND_URL?.trim();

  if (!backendBaseUrl) {
    throw new Error("Missing VITE_BACKEND_URL");
  }

  return `${backendBaseUrl.replace(/\/+$/, "")}/pdf/${encodeURIComponent(filename)}`;
}

export default function PublicPdfProxy() {
  const { filename } = useParams();
  const [pdfUrl, setPdfUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      if (!filename || !filename.toLowerCase().endsWith(".pdf")) {
        throw new Error("Invalid PDF filename");
      }

      const nextPdfUrl = buildBackendPdfUrl(filename);
      setPdfUrl(nextPdfUrl);
    } catch (loadError) {
      setError(loadError?.message || "Failed to open PDF");
    }
  }, [filename]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6 text-center">
        <div>
          <h1 className="text-3xl font-bold text-[#00796B]">PDF Not Available</h1>
          <p className="mt-4 text-lg text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-lg text-gray-700">
        Loading PDF...
      </div>
    );
  }

  return (
    <iframe
      src={pdfUrl}
      title={filename}
      className="h-screen w-full border-0"
    />
  );
}
