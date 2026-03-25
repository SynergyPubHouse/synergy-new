import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function PublicPdfProxy() {
  const { filename } = useParams();
  const [pdfUrl, setPdfUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;
    let objectUrl = null;
    const abortController = new AbortController();

    async function loadPdf() {
      try {
        if (!filename || !filename.toLowerCase().endsWith(".pdf")) {
          throw new Error("Invalid PDF filename");
        }

        const backendBaseUrl = import.meta.env.VITE_BACKEND_URL?.trim();

        if (!backendBaseUrl) {
          throw new Error("Missing VITE_BACKEND_URL");
        }

        const response = await fetch(
          `${backendBaseUrl.replace(/\/+$/, "")}/pdf/${encodeURIComponent(filename)}`,
          {
            method: "GET",
            signal: abortController.signal,
          },
        );

        const contentType = response.headers.get("content-type") || "";

        if (!response.ok) {
          let errorMessage = `Failed to load PDF (${response.status})`;

          try {
            errorMessage = (await response.text()) || errorMessage;
          } catch {
            // Keep default message when response body cannot be read.
          }

          throw new Error(errorMessage);
        }

        const pdfBlob = await response.blob();

        if (!String(contentType).toLowerCase().includes("pdf")) {
          let errorMessage = "Backend did not return a PDF";

          try {
            errorMessage = (await pdfBlob.text()) || errorMessage;
          } catch {
            // Keep default message when blob text cannot be read.
          }

          throw new Error(errorMessage);
        }

        objectUrl = URL.createObjectURL(pdfBlob);

        if (isActive) {
          setPdfUrl(objectUrl);
        }
      } catch (loadError) {
        if (loadError?.name === "AbortError") {
          return;
        }

        if (isActive) {
          setError(loadError?.message || "Failed to load PDF");
        }
      }
    }

    loadPdf();

    return () => {
      isActive = false;
      abortController.abort();

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
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
