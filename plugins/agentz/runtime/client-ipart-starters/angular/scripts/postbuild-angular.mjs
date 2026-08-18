import { readFileSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import { extname, join, resolve } from "node:path";

const root = resolve(process.cwd());
const manifest = JSON.parse(readFileSync(join(root, "agentz-client-ipart.json"), "utf8"));
const output = resolve(root, "dist/browser");
const packageBase = `/iPartSource/${manifest.packageName}/`;
const renameMap = new Map();

for (const entry of readdirSync(output, { withFileTypes: true })) {
  if (!entry.isFile() || !new Set([".js", ".css"]).has(extname(entry.name))) continue;
  if (entry.name.startsWith(`${manifest.packageName.replace(/\.zip$/i, "")}-`)) continue;
  const next = `${manifest.packageName.replace(/\.zip$/i, "")}-${entry.name}`;
  renameSync(join(output, entry.name), join(output, next));
  renameMap.set(entry.name, next);
}

for (const entry of readdirSync(output, { withFileTypes: true })) {
  if (!entry.isFile() || !new Set([".html", ".js", ".css"]).has(extname(entry.name))) continue;
  const file = join(output, entry.name);
  let text = readFileSync(file, "utf8").replace(/<base\b[^>]*>/gi, "");
  for (const [before, after] of renameMap) text = text.split(before).join(after);
  if (extname(entry.name) === ".html") {
    text = text.replace(/\b(src|href)="(?!https:|data:|#|mailto:|tel:|\/)([^"]+)"/gi, `$1="${packageBase}$2"`);
  }
  writeFileSync(file, text);
}
