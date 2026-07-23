import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const requiredFiles = [
  "dist/client/index.html",
  "dist/server/entry-server.js",
];

for (const file of requiredFiles) {
  if (!existsSync(file)) {
    throw new Error(`Missing required SSR build file: ${file}`);
  }
}

const serverEntryPath = path.resolve("dist/server/entry-server.js");
const serverModule = await import(pathToFileURL(serverEntryPath).href);

if (typeof serverModule.render !== "function") {
  throw new Error(`SSR bundle does not export render(): ${serverEntryPath}`);
}

const publicAssets = await readdir("public/assets");
const hasJavaScript = publicAssets.some((file) => file.endsWith(".js"));
const hasStylesheet = publicAssets.some((file) => file.endsWith(".css"));

if (!hasJavaScript || !hasStylesheet) {
  throw new Error(
    "public/assets must contain the built JavaScript and CSS assets",
  );
}

console.log("SSR build files verified successfully.");
