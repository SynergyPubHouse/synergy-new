import fs from "node:fs";
import path from "node:path";

// Vercel's Express runtime ignores express.static(), so the hashed
// JS/CSS bundles must live under public/ to be served from the CDN.
const src = path.resolve(import.meta.dirname, "../dist/client/assets");
const dest = path.resolve(import.meta.dirname, "../public/assets");

fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });
