// Minimal static server for local preview: node tools/dev_server.mjs [port]
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.argv[2]) || 4173;
const TYPES = {
  ".html": "text/html", ".css": "text/css", ".js": "text/javascript",
  ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml",
  ".pdf": "application/pdf", ".txt": "text/plain", ".xml": "application/xml",
};

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (urlPath.endsWith("/")) urlPath += "index.html";
  const file = path.join(ROOT, path.normalize(urlPath));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404, { "content-type": "text/html" });
    fs.existsSync(path.join(ROOT, "404.html"))
      ? res.end(fs.readFileSync(path.join(ROOT, "404.html")))
      : res.end("not found");
    return;
  }
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
  res.end(fs.readFileSync(file));
}).listen(PORT, () => console.log(`serving ${ROOT} on http://localhost:${PORT}`));
