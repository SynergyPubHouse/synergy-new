import serialize from "serialize-javascript";

const ADSENSE_BLOCK = /\s*<!--adsense-start-->[\s\S]*?<!--adsense-end-->\s*/;

function serializeInitialData(initialData) {
  return serialize(initialData, { isJSON: true })
    .replace(/</g, "\\u003C")
    .replace(/>/g, "\\u003E")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function renderSpaTemplate(template) {
  return template
    .replaceAll("<!--app-head-->", "")
    .replaceAll("<!--app-html-->", "")
    .replaceAll("<!--initial-data-->", "");
}

export function renderSsrTemplate(
  template,
  rendered,
  initialData,
  { includeAds = true } = {},
) {
  const safeTemplate = includeAds ? template : template.replace(ADSENSE_BLOCK, "");

  return safeTemplate
    .replace("<title>Synergy World Press</title>", "")
    .replaceAll("<!--app-head-->", rendered.head || "")
    .replaceAll("<!--app-html-->", rendered.appHtml || "")
    .replaceAll(
      "<!--initial-data-->",
      `<script>window.__INITIAL_DATA__=${serializeInitialData(initialData)}</script>`,
    );
}

export function renderErrorDocument(status) {
  if (status === 502 || status === 503 || status === 504) {
    return '<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="robots" content="noindex, follow"><title>Unable to load page</title></head><body><h1>Unable to load page</h1><p>The content service is temporarily unavailable.</p></body></html>';
  }

  if (status === 400 || status === 404) {
    return '<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="robots" content="noindex, follow"><title>Page not found</title></head><body><h1>Page not found</h1></body></html>';
  }

  return '<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="robots" content="noindex, follow"><title>Unable to render page</title></head><body><h1>Unable to render page</h1><p>The requested page could not be rendered.</p></body></html>';
}
