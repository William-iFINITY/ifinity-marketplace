#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";

const root = resolve(process.cwd());
const manifest = JSON.parse(readFileSync(join(root, "agentz-client-ipart.json"), "utf8"));
const buildDir = resolve(root, manifest.framework === "angular" ? "dist/browser" : "dist");
const packageBase = `/iPartSource/${manifest.packageName}/`;
const sourceFiles = [
  ...collect(join(root, "src"), []),
  ...(existsSync(join(root, "public")) ? collect(join(root, "public"), []) : []),
];
const sourceText = sourceFiles.filter(isText).map((file) => [file, readFileSync(file, "utf8")]);
const sourceCss = sourceText.filter(([file]) => extname(file) === ".css");

assert(!existsSync(join(root, "design-tokens.css")), "The source project must not own design-tokens.css.");
assert(!sourceText.some(([, text]) => /<form\b/i.test(text)), "Nested form markup is not permitted.");
assert(!sourceText.some(([, text]) => /@import\b|@font-face\b/i.test(text)), "Caller @import and @font-face rules are not permitted.");
assert(!sourceText.some(([, text]) => /prefers-color-scheme/i.test(text)), "Operating-system dark mode is not permitted.");
assert(!sourceText.some(([, text]) => /text-transform\s*:\s*uppercase/i.test(text)), "Uppercase text transforms are not permitted.");
assertCssConforms(sourceCss, "source");
assert(sourceFiles.some((file) => /src\/imis\/api-client\.(?:js|ts)$/.test(file)), "The iMIS API adapter is missing.");
assert(sourceFiles.some((file) => /src\/imis\/party-context\.(?:js|ts)$/.test(file)), "The Party-context adapter is missing.");
assert(sourceFiles.some((file) => /src\/imis\/settings\.(?:js|ts)$/.test(file)), "The settings adapter is missing.");
assert(sourceFiles.some((file) => /src\/imis\/query-client\.(?:js|ts)$/.test(file)), "The IQA adapter is missing.");

if (manifest.framework === "angular") {
  assert(!sourceText.some(([, text]) => /zone\.js|provideZoneChangeDetection|ViewEncapsulation\.(?:None|ShadowDom)/.test(text)), "Angular must stay zoneless and use emulated view encapsulation.");
  assert(!sourceText.some(([file, text]) => /\.ts$/.test(file) && /\b(?:styles|styleUrl|styleUrls)\s*:/.test(text)), "Angular component-local styles are not permitted; keep all CSS in the checked, scoped source stylesheet.");
  const angularConfig = JSON.parse(readFileSync(join(root, "angular.json"), "utf8"));
  const project = Object.values(angularConfig.projects ?? {})[0];
  const build = project?.architect?.build;
  const production = build?.configurations?.production;
  assert(build?.builder === "@angular-devkit/build-angular:application", "Angular must use the browser application builder.");
  assert(typeof build?.options?.browser === "string" && !build?.options?.server, "Angular must have a browser entry and no server entry.");
  assert(production?.aot === true, "Angular production output must use AOT.");
  assert(production?.sourceMap === false, "Angular production source maps must stay disabled.");
  assert(build?.options?.serviceWorker !== true && production?.serviceWorker !== true, "Angular must not register a service worker.");
}

assert(existsSync(join(buildDir, "index.html")), "The build output is missing index.html.");
assert(existsSync(join(buildDir, "config.html")), "The build output is missing config.html.");
assert(!existsSync(join(buildDir, "design-tokens.css")), "The build must not contain design-tokens.css.");
const builtFiles = collect(buildDir, []);
for (const file of builtFiles) assert(!isForbiddenProductionPath(file), `Forbidden production output: ${file}`);
const builtText = builtFiles.filter(isText).map((file) => [file, readFileSync(file, "utf8")]);
const builtHtml = builtText.filter(([file]) => extname(file) === ".html");
const builtCss = builtText.filter(([file]) => extname(file) === ".css");
assertCssConforms(builtCss, "built");
assert(!builtHtml.some(([, text]) => /<base\b/i.test(text)), "Production HTML must not contain a base element.");
assert(!builtHtml.some(([, text]) => /<form\b/i.test(text)), "Production HTML must not contain a nested form.");
assert(builtText.some(([, text]) => text.includes("[x-contentKey]") && text.includes("[x-contentItemKey]")), "The runtime content-key tokens are missing.");
assert(readFileSync(join(buildDir, "index.html"), "utf8").includes("agentz-design"), "The runtime design scope is missing.");
assert(readFileSync(join(buildDir, "config.html"), "utf8").includes(`${packageBase}design-tokens.css`), "The configuration page must link the production design CSS by absolute URL.");

for (const [file, text] of builtHtml) {
  for (const script of text.matchAll(/<script\b([^>]*)>/gi)) {
    const source = attributeValue(script[1], "src");
    if (source) assert(source.startsWith(packageBase), `${file} has a script URL outside the package: ${source}`);
  }
  for (const link of text.matchAll(/<link\b([^>]*)>/gi)) {
    if (!/\bstylesheet\b/i.test(attributeValue(link[1], "rel") ?? "")) continue;
    const href = attributeValue(link[1], "href");
    if (href) assert(href.startsWith(packageBase), `${file} has an external or non-package stylesheet URL: ${href}`);
  }
  for (const media of text.matchAll(/<(?:img|source|video|audio)\b([^>]*)>/gi)) {
    for (const attribute of ["src", "poster"]) {
      const value = attributeValue(media[1], attribute);
      if (value) assert(value.startsWith(packageBase) || value.startsWith("data:"), `${file} has an external or non-package media URL: ${value}`);
    }
  }
  for (const image of text.matchAll(/<img\b([^>]*)>/gi)) {
    assert(/\balt\s*=\s*(?:["'][^"']*["']|[^\s>]+)/i.test(image[1]), `${file} has an image without an alt attribute.`);
  }
  for (const match of text.matchAll(/\b(?:src|href|srcset)=["']([^"']+)["']/gi)) {
    const value = match[1];
    if (/^(?:https:|data:|#|mailto:|tel:)/i.test(value)) continue;
    assert(value.startsWith(packageBase), `${file} has a non-package asset URL: ${value}`);
    const referencedPath = value.slice(packageBase.length).split(/[?#]/, 1)[0];
    if (!new Set(["design-tokens.css", "ifx-query-client.js"]).has(referencedPath)) {
      assert(existsSync(join(buildDir, referencedPath)), `${file} references a missing package asset: ${referencedPath}`);
    }
  }
}
for (const [file, css] of builtCss) {
  for (const match of css.matchAll(/\burl\(\s*["']?([^"')\s]+)["']?\s*\)/gi)) {
    const value = match[1];
    assert(value.startsWith(packageBase) || value.startsWith("data:"), `${file} has a non-package CSS asset URL: ${value}`);
  }
}

process.stdout.write(`Client iPart contract check passed for ${manifest.framework}.\n`);

function collect(directory, ignoredNames) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (ignoredNames.includes(entry.name)) continue;
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...collect(fullPath, ignoredNames));
    else if (statSync(fullPath).isFile()) files.push(fullPath);
  }
  return files;
}

function isText(file) {
  return new Set([".html", ".css", ".js", ".jsx", ".mjs", ".ts", ".json", ".md"]).has(extname(file));
}

function attributeValue(attributes, name) {
  const quoted = new RegExp(`\\b${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, "i").exec(attributes);
  if (quoted) return quoted[2];
  return new RegExp(`\\b${name}\\s*=\\s*([^\\s>]+)`, "i").exec(attributes)?.[1];
}

function assertCssConforms(files, stage) {
  for (const [file, rawCss] of files) {
    const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, "");
    assert(!/@import\b|@font-face\b/i.test(css), `${stage} CSS contains @import or @font-face: ${file}`);
    assert(!/(^|[^-\w])#[0-9a-f]{3,8}\b/i.test(css) && !/\b(?:rgb|rgba|hsl|hsla)\s*\(/i.test(css), `${stage} CSS contains a literal colour: ${file}`);
    for (const match of css.matchAll(/\bfont-family\s*:\s*([^;{}]+)/gi)) {
      assert(/var\(--ds-font-/i.test(match[1]) || /\binherit\b/i.test(match[1]), `${stage} CSS contains a literal font family: ${file}`);
    }
    const unscoped = collectCssSelectors(css).filter((selector) => !selectorListIsScoped(selector));
    assert(unscoped.length === 0, `${stage} CSS has selectors outside .agentz-design: ${file}: ${unscoped.join(", ")}`);
  }
}

function collectCssSelectors(css) {
  const selectors = [];
  const source = css.replace(/@(?:-[\w]+-)?keyframes\b[^{]*\{(?:[^{}]|\{[^{}]*\})*\}/gi, "");
  let boundary = 0;
  let quote = null;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (character === "\\") index += 1;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === "\"" || character === "'") quote = character;
    else if (character === "{") {
      const header = source.slice(boundary, index).trim();
      if (header && !header.startsWith("@")) selectors.push(header);
      boundary = index + 1;
    } else if (character === "}") boundary = index + 1;
  }
  return selectors;
}

function selectorListIsScoped(selectorList) {
  return selectorList.split(",").map((selector) => selector.trim()).filter(Boolean).every((selector) =>
    selector.startsWith(".agentz-design") || selector.startsWith(":where(.agentz-design") || selector.startsWith(":is(.agentz-design")
  );
}

function isForbiddenProductionPath(file) {
  const relativePath = file.slice(buildDir.length + 1).replaceAll("\\", "/");
  const segments = relativePath.split("/");
  return segments.some((segment) => new Set([".agentz", "src", "node_modules", "server"]).has(segment))
    || /(?:^|\/)design-tokens\.css$/i.test(relativePath)
    || /\.map$/i.test(relativePath)
    || /(?:^|\/)(?:ngsw\.json|ngsw-worker\.js|prerendered-routes\.json)$/i.test(relativePath);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
