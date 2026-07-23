import { existsSync } from "node:fs";

const requiredFiles = [
  "dist/client/index.html",
  "dist/server/entry-server.js",
];

for (const file of requiredFiles) {
  if (!existsSync(file)) {
    throw new Error(`Missing required SSR build file: ${file}`);
  }
}

console.log("SSR build files verified successfully.");
