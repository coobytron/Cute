import fs from "node:fs";

const source = fs.readFileSync(new URL("../export-menu.js", import.meta.url), "utf8");
const adapter = fs.readFileSync(new URL("../assets/manifest-adapter.js", import.meta.url), "utf8");
const styles = fs.readFileSync(new URL("../assets/export-menu.css", import.meta.url), "utf8");
const docs = fs.readFileSync(new URL("../docs/EXPORT.md", import.meta.url), "utf8");
const fixture = fs.readFileSync(new URL("../previews/export-fixtures/export-matrix.html", import.meta.url), "utf8");
const errors = [];

const requiredRuntime = [
  "PNG · 1600 px",
  "PNG · transparent",
  "Copy recipe JSON",
  'aria-haspopup", "menu',
  'role", "menu',
  "ArrowDown",
  "ArrowUp",
  "Escape",
  "document.fonts?.ready",
  "waitForSvgImages",
  "URL.revokeObjectURL",
  "sanitizeFilename",
  "completeFaceId",
  "CuteHistorySaves?.capture",
  "CuteArtDirection.buildExportSvg",
  "cute-face-recipe",
  "cute:export-error",
  "CuteExport"
];

for (const token of requiredRuntime) {
  if (!source.includes(token)) errors.push(`Export runtime is missing ${token}.`);
}

if (!adapter.includes('loadStyle("assets/export-menu.css")')) errors.push("Export menu stylesheet is not loaded.");
if (!adapter.includes('loadScript("export-menu.js")')) errors.push("Export menu runtime is not loaded.");
if (adapter.indexOf('loadScript("export-menu.js")') < adapter.indexOf('loadScript("history-saves.js")')) {
  errors.push("Export menu must load after the canonical snapshot API.");
}

for (const selector of [".export-control", ".export-menu", ".export-menu-item", ".export-status"]) {
  if (!styles.includes(selector)) errors.push(`Export stylesheet is missing ${selector}.`);
}

for (const phrase of ["PNG · 1600 px", "PNG · transparent", "Copy recipe JSON", "object URLs", "Safari and Chromium"]) {
  if (!docs.includes(phrase)) errors.push(`Export documentation is missing ${phrase}.`);
}

for (const marker of ["Classic paper", "Clean studio", "Thermal print", "Sticker", "transparent", "face-mochi-cat", "recipe-layered-cat"]) {
  if (!fixture.includes(marker)) errors.push(`Export fixture matrix is missing ${marker}.`);
}

try {
  new Function(source);
} catch (error) {
  errors.push(`Export browser script has invalid syntax: ${error.message}`);
}

if (errors.length) {
  console.error(`Export validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Export contract valid: accessible menu, opaque/transparent PNG, recipe JSON, cleanup, and review fixtures.");
