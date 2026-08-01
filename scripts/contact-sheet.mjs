#!/usr/bin/env node
/**
 * contact-sheet.mjs
 *
 * Generates a deterministic 12-up SVG contact sheet for all complete-face
 * assets listed in assets/manifest.json.
 *
 * Usage:
 *   node scripts/contact-sheet.mjs [--bg light|white|checker] [--out path/to/output.svg]
 *
 * Defaults:
 *   --bg    light      (warm cream #FFFDF8)
 *   --out   contact-sheet.svg  (repository root)
 *
 * Three backgrounds are supported:
 *   light    – warm cream card on cream page (matches app default)
 *   white    – white card on white page
 *   checker  – transparent-safe checkerboard pattern
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function argValue(flag) {
  const index = args.indexOf(flag);
  return index !== -1 ? args[index + 1] : null;
}

const bgMode = argValue("--bg") ?? "light";
const outFile = argValue("--out") ?? path.join(repositoryRoot, "contact-sheet.svg");

if (!["light", "white", "checker"].includes(bgMode)) {
  console.error(`Unknown --bg value: ${bgMode}. Must be light, white, or checker.`);
  process.exit(1);
}

// ── Manifest ──────────────────────────────────────────────────────────────────
const manifestPath = path.join(repositoryRoot, "assets", "manifest.json");
let manifest;
try {
  manifest = JSON.parse(await readFile(manifestPath, "utf8"));
} catch (error) {
  console.error(`Cannot read manifest: ${error.message}`);
  process.exit(1);
}

const completeFaces = manifest.assets.filter((a) => a.type === "complete-face");
if (completeFaces.length === 0) {
  console.error("No complete-face assets found in manifest.");
  process.exit(1);
}

// ── Layout constants ──────────────────────────────────────────────────────────
const COLS = 4;
const ROWS = Math.ceil(completeFaces.length / COLS);
const CELL = 280;       // px – cell square size
const PAD = 20;         // px – cell padding
const LABEL_H = 36;     // px – label strip height below artwork
const MARGIN = 32;      // px – outer margin
const INNER = CELL - PAD * 2;  // px – artwork canvas within cell

const SHEET_W = COLS * CELL + MARGIN * 2;
const SHEET_H = ROWS * (CELL + LABEL_H) + MARGIN * 2;

// ── Background definitions ────────────────────────────────────────────────────
const bgColors = {
  light: { page: "#FFF8F0", card: "#FFFDF8", label: "#2d2723" },
  white: { page: "#FFFFFF", card: "#FFFFFF", label: "#2d2723" },
  checker: { page: "url(#checker)", card: "#FFFFFF", label: "#2d2723" },
};
const { page: pageColor, card: cardColor, label: labelColor } = bgColors[bgMode];

// ── Load all face SVG bodies ──────────────────────────────────────────────────
async function loadFaceSVGBody(relPath) {
  const absPath = path.resolve(repositoryRoot, relPath);
  const raw = await readFile(absPath, "utf8");
  // Strip the outer <svg…> wrapper; keep inner content only.
  const inner = raw
    .replace(/<\?xml[^>]*\?>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<svg[^>]*>/i, "")
    .replace(/<\/svg>\s*$/i, "")
    .trim();
  return inner;
}

const faceBodies = await Promise.all(
  completeFaces.map((face) => loadFaceSVGBody(face.sourceFile))
);

// ── Assemble SVG ──────────────────────────────────────────────────────────────
function checkerDef() {
  return `
  <pattern id="checker" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
    <rect width="16" height="16" fill="#DDDDDD"/>
    <rect x="0" y="0" width="8" height="8" fill="#F5F5F5"/>
    <rect x="8" y="8" width="8" height="8" fill="#F5F5F5"/>
  </pattern>`;
}

function cell(face, body, index) {
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  const ox = MARGIN + col * CELL;
  const oy = MARGIN + row * (CELL + LABEL_H);

  // Scale face viewport (1000×1000) into INNER×INNER box
  const scale = INNER / 1000;

  return `
  <g transform="translate(${ox},${oy})">
    <!-- card background -->
    <rect width="${CELL}" height="${CELL + LABEL_H}" rx="12" fill="${cardColor}" stroke="#E8E0D8" stroke-width="1.5"/>
    <!-- artwork viewport clip -->
    <clipPath id="clip-${index}">
      <rect x="${PAD}" y="${PAD}" width="${INNER}" height="${INNER}" rx="6"/>
    </clipPath>
    <!-- face artwork scaled into cell -->
    <g clip-path="url(#clip-${index})">
      <g transform="translate(${PAD},${PAD}) scale(${scale})">
        ${body}
      </g>
    </g>
    <!-- label -->
    <text
      x="${CELL / 2}"
      y="${CELL + LABEL_H / 2 + 5}"
      font-family="Arial,Helvetica,sans-serif"
      font-size="13"
      font-weight="700"
      text-anchor="middle"
      fill="${labelColor}"
    >${escapeXml(face.label)}</text>
  </g>`;
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const cells = completeFaces.map((face, i) => cell(face, faceBodies[i], i)).join("\n");

const svgOutput = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Cute Face Builder – Complete-Face Contact Sheet
     Background: ${bgMode}  |  Generated: ${new Date().toISOString()}
     Faces: ${completeFaces.length}  |  Layout: ${COLS} × ${ROWS}  -->
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${SHEET_W}"
  height="${SHEET_H}"
  viewBox="0 0 ${SHEET_W} ${SHEET_H}"
>
  <defs>${bgMode === "checker" ? checkerDef() : ""}
  </defs>
  <!-- page background -->
  <rect width="${SHEET_W}" height="${SHEET_H}" fill="${pageColor}"/>
  <!-- title -->
  <text
    x="${SHEET_W / 2}"
    y="22"
    font-family="Arial,Helvetica,sans-serif"
    font-size="13"
    font-weight="700"
    text-anchor="middle"
    fill="#888880"
  >Cute Face Builder · ${completeFaces.length}-up Contact Sheet · bg:${bgMode}</text>
  ${cells}
</svg>
`;

await writeFile(outFile, svgOutput, "utf8");
console.log(
  `Contact sheet written to ${path.relative(repositoryRoot, outFile)}`
    + `  (${completeFaces.length} faces, ${bgMode} bg, ${SHEET_W}×${SHEET_H}px)`
);
