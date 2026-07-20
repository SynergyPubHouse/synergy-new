import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.jsx";

export function render(url, initialData) {
  const helmetContext = {};
  const appHtml = renderToString(
    <HelmetProvider context={helmetContext}>
      <StaticRouter location={url}>
        <App initialData={initialData} />
      </StaticRouter>
    </HelmetProvider>,
  );

  const { helmet } = helmetContext;
  const metadata = {
    title: helmet?.title?.toString() || "",
    priority: helmet?.priority?.toString() || "",
    meta: helmet?.meta?.toString() || "",
    link: helmet?.link?.toString() || "",
    script: helmet?.script?.toString() || "",
  };
  const head = Object.values(metadata).filter(Boolean).join("\n");

  return {
    appHtml,
    head,
    initialData,
    metadata,
    status: Number.isInteger(initialData?.status) ? initialData.status : 200,
  };
}
