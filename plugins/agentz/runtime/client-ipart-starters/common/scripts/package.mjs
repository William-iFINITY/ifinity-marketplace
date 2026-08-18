#!/usr/bin/env node
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(process.cwd());
const manifest = JSON.parse(readFileSync(join(root, "agentz-client-ipart.json"), "utf8"));
const buildDir = resolve(root, manifest.framework === "angular" ? "dist/browser" : "dist");
const outputPath = resolve(root, manifest.packageName);
const builtFiles = collect(buildDir);
const forbidden = builtFiles.filter(isForbiddenProductionPath);
if (forbidden.length > 0) throw new Error(`Refusing to package forbidden production output: ${forbidden.join(", ")}`);
const entries = builtFiles.map((file) => ({
  path: relative(buildDir, file).replaceAll("\\", "/"),
  data: readFileSync(file),
}));
writeFileSync(outputPath, buildStoredZip(entries));
process.stdout.write(`${outputPath}\n`);

function collect(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...collect(fullPath));
    else if (statSync(fullPath).isFile()) files.push(fullPath);
  }
  return files.sort();
}

function isForbiddenProductionPath(file) {
  const relativePath = relative(buildDir, file).replaceAll("\\", "/");
  const segments = relativePath.split("/");
  return segments.some((segment) => new Set([".agentz", "src", "node_modules", "server"]).has(segment))
    || /(?:^|\/)design-tokens\.css$/i.test(relativePath)
    || /\.map$/i.test(relativePath)
    || /(?:^|\/)(?:ngsw\.json|ngsw-worker\.js|prerendered-routes\.json)$/i.test(relativePath);
}

function buildStoredZip(files) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  for (const file of files) {
    const name = Buffer.from(file.path, "utf8");
    const crc = crc32(file.data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(file.data.length, 18);
    local.writeUInt32LE(file.data.length, 22);
    local.writeUInt16LE(name.length, 26);
    localParts.push(local, name, file.data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(file.data.length, 20);
    central.writeUInt32LE(file.data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, name);
    offset += local.length + name.length + file.data.length;
  }
  const centralBytes = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralBytes.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...localParts, centralBytes, end]);
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const value of buffer) {
    crc ^= value;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}
