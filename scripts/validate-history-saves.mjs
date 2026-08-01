import fs from "node:fs";

const source = fs.readFileSync(new URL("../history-saves.js", import.meta.url), "utf8");
const required = [
  'schemaVersion: 2',
  'cute-face-builder/saves/v2',
  'function undo()',
  'function redo()',
  'function saveCurrent()',
  'function toggleFavorite()',
  'MAX_HISTORY',
  'MAX_SAVES',
  'cute:storage-error',
  'CuteHistorySaves'
];

const missing = required.filter((token) => !source.includes(token));
if (missing.length) {
  console.error(`History validation failed. Missing: ${missing.join(", ")}`);
  process.exit(1);
}

new Function(source);
console.log("History and saved-variation structure is valid.");