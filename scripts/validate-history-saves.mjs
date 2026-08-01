import fs from "node:fs";

const source = fs.readFileSync(new URL("../history-saves.js", import.meta.url), "utf8");
const adapter = fs.readFileSync(new URL("../assets/manifest-adapter.js", import.meta.url), "utf8");
const styles = fs.readFileSync(new URL("../assets/history-saves.css", import.meta.url), "utf8");
const docs = fs.readFileSync(new URL("../docs/HISTORY-SAVES.md", import.meta.url), "utf8");
const errors = [];

const requiredSource = [
  "schemaVersion: 2",
  "cute-face-builder/saves/v2",
  "function capture()",
  "function restore(snapshot)",
  "function undo()",
  "function redo()",
  "function saveCurrent()",
  "function toggleFavorite()",
  "CuteCompleteFaces?.getState",
  "CuteBuildFace.getState",
  "CuteCompleteFaces.restore",
  "CuteBuildFace.restore",
  "CuteArtDirection.restore",
  "cute:complete-face-change",
  "cute:composition-change",
  "cute:art-direction-change",
  "cute:storage-error",
  "stopImmediatePropagation",
  "MAX_HISTORY",
  "MAX_SAVES",
  "CuteHistorySaves"
];

for (const token of requiredSource) {
  if (!source.includes(token)) errors.push(`History runtime is missing ${token}.`);
}

if (source.includes("cute:build-face-change")) errors.push("History runtime listens for the obsolete Build-a-face event name.");
if (!adapter.includes('loadStyle("assets/history-saves.css")')) errors.push("History stylesheet is not loaded by the manifest adapter.");
if (!adapter.includes('loadScript("history-saves.js")')) errors.push("History runtime is not loaded by the manifest adapter.");
if (adapter.indexOf('loadScript("history-saves.js")') < adapter.indexOf('loadScript("art-direction-bootstrap.js")')) {
  errors.push("History runtime must load after all composer and Art direction APIs.");
}

for (const selector of [".saved-variation", ".saved-preview", ".saved-storage-status"]) {
  if (!styles.includes(selector)) errors.push(`History stylesheet is missing ${selector}.`);
}

for (const phrase of ["Range drags", "Complete faces", "Build a face", "favorite persistence", "cute:storage-error"]) {
  if (!docs.includes(phrase)) errors.push(`History documentation is missing ${phrase}.`);
}

try {
  new Function(source);
} catch (error) {
  errors.push(`History browser script has invalid syntax: ${error.message}`);
}

if (errors.length) {
  console.error(`History validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("History and saved variations valid: both composers, grouped edits, local persistence, and favorites.");
