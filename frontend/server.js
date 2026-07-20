/* global process */
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import express from "express";
import { createBackendApiClient } from "./ssr/apiClient.js";
import { createSsrConfig } from "./ssr/config.js";
import {
  renderErrorDocument,
  renderSpaTemplate,
  renderSsrTemplate,
} from "./ssr/html.js";
import { InvalidSsrRouteError, matchSsrRoute } from "./ssr/routes.js";

const root = process.cwd();
const isProduction = process.env.NODE_ENV === "production";
const mode = isProduction ? "production" : "development";
let vite;
let env = {};

if (!isProduction) {
  const viteModule = await import("vite");
  env = viteModule.loadEnv(mode, root, "");
  vite = await viteModule.createServer({
    root,
    appType: "custom",
    resolve: {
      alias: [
        {
          find: /^react-router-dom$/,
          replacement: path.resolve(
            root,
            "node_modules/react-router-dom/dist/index.mjs",
          ),
        },
        {
          find: /^react-router\/dom$/,
          replacement: path.resolve(
            root,
            "node_modules/react-router/dist/development/dom-export.mjs",
          ),
        },
        {
          find: /^react-router$/,
          replacement: path.resolve(
            root,
            "node_modules/react-router/dist/development/index.mjs",
          ),
        },
        {
          find: /^react-helmet-async$/,
          replacement: path.resolve(
            root,
            "node_modules/react-helmet-async/lib/index.esm.js",
          ),
        },
      ],
      conditions: ["module", "import", mode],
      mainFields: ["module", "jsnext:main", "jsnext", "main"],
    },
    server: { middlewareMode: true },
  });
}

const { apiBaseUrl, port, publicSiteUrl, requestTimeoutMs } = createSsrConfig({
  processEnv: process.env,
  viteEnv: env,
  isProduction,
});
const apiClient = createBackendApiClient({
  baseUrl: apiBaseUrl,
  timeoutMs: requestTimeoutMs,
});

const app = express();
let productionTemplate;
let productionRender;

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "synergy-frontend-ssr",
  });
});

if (isProduction) {
  const clientDirectory = path.resolve(root, "dist/client");
  const assetsDirectory = path.join(clientDirectory, "assets");
  productionTemplate = await fs.readFile(
    path.join(clientDirectory, "index.html"),
    "utf-8",
  );
  const serverEntryUrl = pathToFileURL(
    path.resolve(root, "dist/server/entry-server.js"),
  ).href;
  ({ render: productionRender } = await import(serverEntryUrl));

  app.use(
    "/assets",
    express.static(assetsDirectory, {
      immutable: true,
      index: false,
      maxAge: "1y",
    }),
  );
  app.use("/assets", (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.status(404).end();
  });
  app.use(express.static(clientDirectory, { index: false }));
} else {
  app.use(vite.middlewares);
}

async function getTemplate(url) {
  if (isProduction) return productionTemplate;
  const source = await fs.readFile(path.resolve(root, "index.html"), "utf-8");
  return vite.transformIndexHtml(url, source);
}

function getErrorStatus(error) {
  if (error instanceof InvalidSsrRouteError) return 400;
  if (Number.isInteger(error?.statusCode)) return error.statusCode;
  return 500;
}

app.use(async (req, res, next) => {
  try {
    const pathname = new URL(req.originalUrl, "http://localhost").pathname;
    const route = matchSsrRoute(pathname);

    if (!route) {
      const template = await getTemplate(req.originalUrl);
      return res.status(200).type("html").send(renderSpaTemplate(template));
    }

    if (route.redirectTo) {
      return res.redirect(route.redirectStatus || 308, route.redirectTo);
    }

    const result = route.loader
      ? await route.loader({ apiClient, params: route.params })
      : { status: 200, data: null };
    const status = result.status || 200;
    const initialData = {
      routeName: route.routeName,
      params: route.params,
      data: result.data ?? null,
      status,
      error: result.error || null,
      config: { publicSiteUrl },
    };
    const template = await getTemplate(req.originalUrl);
    const render = isProduction
      ? productionRender
      : (await vite.ssrLoadModule("/src/entry-server.jsx")).render;
    const rendered = render(req.originalUrl, initialData);
    const html = renderSsrTemplate(template, rendered, initialData, {
      includeAds: status < 400,
    });

    if (status >= 400) {
      res.setHeader("Cache-Control", "no-store");
    } else if (route.cacheControl) {
      res.setHeader("Cache-Control", route.cacheControl);
    }
    return res.status(status).type("html").send(html);
  } catch (error) {
    vite?.ssrFixStacktrace(error);
    console.error(error);

    if (res.headersSent) return next(error);
    const status = getErrorStatus(error);
    res.setHeader("Cache-Control", "no-store");
    return res.status(status).type("html").send(renderErrorDocument(status));
  }
});

app.listen(port, () => {
  console.log(`SSR server listening on port ${port}`);
  console.log(`SSR API base URL: ${apiBaseUrl}`);
  console.log(`Public site URL: ${publicSiteUrl}`);
  console.log(`SSR request timeout: ${requestTimeoutMs}ms`);
});
