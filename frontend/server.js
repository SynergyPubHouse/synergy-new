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
let productionRuntimePromise;

async function getProductionRuntime() {
  if (!productionRuntimePromise) {
    const templatePath = path.resolve(root, "dist/client/index.html");
    const serverEntryPath = path.resolve(
      root,
      "dist/server/entry-server.js",
    );
    let templateExists = false;
    let serverEntryExists = false;

    productionRuntimePromise = (async () => {
      [templateExists, serverEntryExists] = await Promise.all([
        fs.access(templatePath).then(
          () => true,
          () => false,
        ),
        fs.access(serverEntryPath).then(
          () => true,
          () => false,
        ),
      ]);

      if (!templateExists) {
        throw new Error(`Missing SSR client template: ${templatePath}`);
      }

      if (!serverEntryExists) {
        throw new Error(`Missing SSR server entry: ${serverEntryPath}`);
      }

      const [template, serverModule] = await Promise.all([
        fs.readFile(templatePath, "utf-8"),
        import(pathToFileURL(serverEntryPath).href),
      ]);

      if (typeof serverModule.render !== "function") {
        throw new Error(
          `SSR bundle does not export render(): ${serverEntryPath}`,
        );
      }

      return {
        template,
        render: serverModule.render,
      };
    })().catch((error) => {
      productionRuntimePromise = undefined;
      console.error("SSR runtime initialization failed:", {
        cwd: process.cwd(),
        templatePath,
        serverEntryPath,
        templateExists,
        serverEntryExists,
        error: error?.message || String(error),
      });
      throw error;
    });
  }

  return productionRuntimePromise;
}

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "synergy-frontend-ssr",
  });
});

if (isProduction) {
  const clientDirectory = path.resolve(root, "dist/client");
  const assetsDirectory = path.join(clientDirectory, "assets");

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
  if (isProduction) {
    return (await getProductionRuntime()).template;
  }
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
      ? (await getProductionRuntime()).render
      : (await vite.ssrLoadModule("/src/entry-server.jsx")).render;
    const rendered = render(req.originalUrl, initialData);
    const responseStatus = Number.isInteger(rendered.status)
      ? rendered.status
      : status;
    const html = renderSsrTemplate(
      template,
      rendered,
      rendered.initialData ?? initialData,
      {
        includeAds: responseStatus < 400,
      },
    );

    if (responseStatus >= 400) {
      res.setHeader("Cache-Control", "no-store");
    } else if (route.cacheControl) {
      res.setHeader("Cache-Control", route.cacheControl);
    }
    return res.status(responseStatus).type("html").send(html);
  } catch (error) {
    vite?.ssrFixStacktrace(error);
    console.error(error);

    if (res.headersSent) return next(error);
    const status = getErrorStatus(error);
    res.setHeader("Cache-Control", "no-store");
    return res.status(status).type("html").send(renderErrorDocument(status));
  }
});
if (!process.env.VERCEL) {
  app.listen(port, "0.0.0.0", () => {
    console.log(`SSR server listening on port ${port}`);
    console.log(`SSR API base URL: ${apiBaseUrl}`);
    console.log(`Public site URL: ${publicSiteUrl}`);
    console.log(`SSR request timeout: ${requestTimeoutMs}ms`);
  });
}

export default app;
