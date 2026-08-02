import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "assets/manifest.json"), "utf8"));
const expansion = JSON.parse(fs.readFileSync(path.join(root, "assets/roster-expansion.json"), "utf8"));
const runtime = fs.readFileSync(path.join(root, "complete-face.js"), "utf8");
const adapter = fs.readFileSync(path.join(root, "assets/manifest-adapter.js"), "utf8");
const errors = [];

const baseAssets = manifest.assets.filter((asset) => asset.type === "complete-face" && asset.reviewStatus === "approved");
const baseRecipes = manifest.recipes.filter((recipe) => recipe.mode === "complete-face");
const additions = expansion.characters || [];
const allIds = new Set(baseAssets.map((asset) => asset.id));

if (expansion.baselineCount !== baseAssets.length) errors.push(`Baseline says ${expansion.baselineCount}, manifest has ${baseAssets.length}.`);
if (expansion.additionCount !== additions.length) errors.push(`Addition count says ${expansion.additionCount}, file has ${additions.length}.`);
if (expansion.targetCount !== baseAssets.length + additions.length) errors.push(`Target ${expansion.targetCount} does not equal ${baseAssets.length + additions.length}.`);
if (expansion.targetCount !== 36) errors.push(`Expected exact 3× target of 36; found ${expansion.targetCount}.`);
if (baseRecipes.length !== baseAssets.length) errors.push(`Base recipe count ${baseRecipes.length} does not match base assets ${baseAssets.length}.`);

for (const character of additions) {
  if (!character.id || allIds.has(character.id)) errors.push(`Missing or duplicate character ID ${character.id || "<missing>"}.`);
  allIds.add(character.id);
  for (const field of ["label", "sourceFile", "format", "nativeCanvas", "anchor", "defaultPalette", "personalityCue", "attribution", "compatibility", "reviewStatus"]) {
    if (character[field] == null || character[field] === "") errors.push(`${character.id || "<missing>"} is missing ${field}.`);
  }
  if (character.reviewStatus !== "approved") errors.push(`${character.id} is not approved.`);
  if (!Array.isArray(character.speciesTags) || character.speciesTags.length === 0) errors.push(`${character.id} needs speciesTags.`);
  if (character.nativeCanvas?.width !== 1000 || character.nativeCanvas?.height !== 1000) errors.push(`${character.id} must use the 1000×1000 canonical canvas.`);
  if (character.anchor?.x !== 0.5 || character.anchor?.y !== 0.5) errors.push(`${character.id} must use the normalized center anchor.`);
  if (character.format !== "svg" || !character.sourceFile.endsWith(".svg")) errors.push(`${character.id} must declare its authored SVG source.`);
  const sourcePath = path.join(root, character.sourceFile || "");
  if (!fs.existsSync(sourcePath)) {
    errors.push(`${character.id} is missing ${character.sourceFile}.`);
  } else {
    const source = fs.readFileSync(sourcePath, "utf8");
    if (!source.trimStart().startsWith("<svg")) errors.push(`${character.id} source is not an SVG document.`);
    if (!/viewBox="0 0 1000 1000"/.test(source)) errors.push(`${character.id} source has the wrong viewBox.`);
    if (/<rect[^>]+(?:width="1000"|height="1000")/i.test(source)) errors.push(`${character.id} may contain an opaque full-canvas background.`);
    if (/<text\b/i.test(source)) errors.push(`${character.id} contains baked-in text.`);
  }
}

for (const marker of ["ROSTER_EXPANSION_URL", "mergeRosterExpansion", "rosterTargetCount", "expansionToAsset", "expansionToRecipe"]) {
  if (!adapter.includes(marker)) errors.push(`Manifest adapter is missing ${marker}.`);
}
for (const marker of ["rosterTargetCount", "completeRecipes.length", "cute:complete-faces-ready"]) {
  if (!runtime.includes(marker)) errors.push(`Complete-face runtime is missing ${marker}.`);
}

if (errors.length) {
  console.error(`Roster validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Roster valid: ${baseAssets.length} baseline + ${additions.length} additions = ${expansion.targetCount} approved complete faces.`);
