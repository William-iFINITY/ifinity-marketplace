#!/usr/bin/env node
import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(process.cwd());
const manifest = JSON.parse(readFileSync(join(root, "agentz-client-ipart.json"), "utf8"));
const buildDir = resolve(root, manifest.framework === "angular" ? "dist/browser" : "dist");
const packagePrefix = `/iPartSource/${manifest.packageName}/`;
const port = Number(process.env.AGENTZ_PREVIEW_PORT || 4173);

createServer((request, response) => {
  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
  if (!pathname.startsWith(packagePrefix)) return send(response, 404, "Not found", "text/plain");
  const entry = pathname.slice(packagePrefix.length) || "index.html";
  const source = entry === "design-tokens.css"
    ? join(root, ".agentz/design-preview.css")
    : resolve(buildDir, normalize(entry));
  if (source !== join(root, ".agentz/design-preview.css") && !source.startsWith(`${buildDir}/`)) {
    return send(response, 400, "Invalid path", "text/plain");
  }
  if (!existsSync(source)) return send(response, 404, "Not found", "text/plain");
  send(response, 200, readFileSync(source), mime(source));
}).listen(port, () => {
  process.stdout.write(`Preview: http://localhost:${port}${packagePrefix}index.html\n`);
});

function send(response, status, body, contentType) {
  response.writeHead(status, { "Content-Type": contentType });
  response.end(body);
}

function mime(file) {
  return ({ ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml" })[extname(file)] ?? "application/octet-stream";
}
