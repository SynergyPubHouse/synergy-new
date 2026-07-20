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
  const head = [
    helmet?.title?.toString(),
    helmet?.priority?.toString(),
    helmet?.meta?.toString(),
    helmet?.link?.toString(),
    helmet?.script?.toString(),
  ]
    .filter(Boolean)
    .join("\n");

  return { appHtml, head };
}
