import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.jsx";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element was not found");
}

const hasSsrData = typeof window.__INITIAL_DATA__ !== "undefined";
const initialData = hasSsrData ? window.__INITIAL_DATA__ : null;
const hasServerRenderedMarkup =
  rootElement.childElementCount > 0 || rootElement.textContent.trim().length > 0;

if (hasSsrData) delete window.__INITIAL_DATA__;

const app = (
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App initialData={initialData} />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);

if (hasServerRenderedMarkup) {
  hydrateRoot(rootElement, app);
} else {
  createRoot(rootElement).render(app);
}
