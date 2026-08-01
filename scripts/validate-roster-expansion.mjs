import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const canonicalManifestPath = path.join(root, "assets", "manifest.json");
const expansionPath = path.join(root, "assets", "roster-expansion.json");

const fail = (message) => {
  console.error(`✗ ${message}`);
  process.exitCode = 1;
};

const pass = (message) => console.log(`✓ ${message}`);
const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));

if (!fs.existsSync(canonicalManifestPath)) {
  fail("Missing assets/manifest.json.");
  process.exit();
}
if (!fs.existsSync(expansionPath)) {
  fail("Missing assets/roster-expansion.json.");
  process.exit();
}

const manifest = readJson(canonicalManifestPath);
const expansion = readJson(expansionPath);
const baseline = (manifest.assets || []).filter((asset) => asset.type === "complete-face");
const additions = expansion.characters || [];

if (baseline.length !== expansion.baselineCount) fail(`Baseline count is ${baseline.length}; expected ${expansion.baselineCount}.`);
else pass(`Baseline count locked at ${baseline.length}.`);

if (additions.length !== expansion.additionCount) fail(`Expansion count is ${additions.length}; expected ${expansion.additionCount}.`);
else pass(`Expansion queue contains exactly ${additions.length} characters.`);

if (baseline.length + additions.length !== expansion.targetCount) {
  fail(`Combined roster is ${baseline.length + additions.length}; expected ${expansion.targetCount}.`);
} else pass(`Combined roster target is exactly ${expansion.targetCount}.`);

const baselineIds = new Set(baseline.map((item) => item.id));
const seenIds = new Set();
const seenSources = new Set();
const silhouetteCues = new Set();
const personalityCues = new Set();
const requiredFields = [
  "id", "label", "speciesTags", "sourceFile", "format", "nativeCanvas",
  "pixelDensity", "anchor", "silhouetteCue", "earHeadTreatment",
  "defaultPalette", "personalityCue", "attribution", "compatibility", "reviewStatus"
];

for (const character of additions) {
  for (const field of requiredFields) {
    if (character[field] === undefined || character[field] === null || character[field] === "") {
      fail(`${character.id || character.label || "Unknown character"} is missing ${field}.`);
    }
  }

  if (baselineIds.has(character.id)) fail(`${character.id} collides with the canonical manifest.`);
  if (seenIds.has(character.id)) fail(`${character.id} is duplicated in the expansion queue.`);
  seenIds.add(character.id);

  if (seenSources.has(character.sourceFile)) fail(`${character.sourceFile} is reused by multiple characters.`);
  seenSources.add(character.sourceFile);

  if (!/^face-[a-z0-9-]+$/.test(character.id || "")) fail(`${character.id} does not use the stable face-* ID convention.`);
  if (!/\.(png|webp|svg)$/i.test(character.sourceFile || "")) fail(`${character.id} uses an unsupported asset format.`);
  if (!Array.isArray(character.speciesTags) || character.speciesTags.length === 0) fail(`${character.id} has no speciesTags.`);
  if (character.nativeCanvas?.width !== 2000 || character.nativeCanvas?.height !== 2000) fail(`${character.id} must use the 2000 × 2000 source canvas.`);
  if (character.pixelDensity !== 2) fail(`${character.id} must declare pixelDensity 2 for the raster authoring queue.`);
  if (character.anchor?.x !== 0.5 || character.anchor?.y !== 0.5) fail(`${character.id} must begin with the normalized center anchor.`);
  if (String(character.silhouetteCue || "").length < 24) fail(`${character.id} needs a more specific silhouette cue.`);
  if (String(character.earHeadTreatment || "").length < 20) fail(`${character.id} needs a more specific ear/head treatment.`);
  if (String(character.personalityCue || "").length < 10) fail(`${character.id} needs a personality cue.`);

  const silhouetteKey = String(character.silhouetteCue || "").toLowerCase();
  const personalityKey = String(character.personalityCue || "").toLowerCase();
  if (silhouetteCues.has(silhouetteKey)) fail(`${character.id} repeats another character's silhouette cue.`);
  if (personalityCues.has(personalityKey)) fail(`${character.id} repeats another character's personality cue.`);
  silhouetteCues.add(silhouetteKey);
  personalityCues.add(personalityKey);
}

if (!process.exitCode) {
  pass("All 24 additions have unique IDs, source paths, silhouettes, head treatments, and personality cues.");
  console.log("Roster art can proceed in three independent eight-character batches.");
}
