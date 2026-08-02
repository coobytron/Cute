import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "assets/manifest.json"), "utf8"));
const expansion = JSON.parse(fs.readFileSync(path.join(root, "assets/roster-expansion.json"), "utf8"));
const runtime = fs.readFileSync(path.join(root, "complete-face.js"), "utf8");
const stateGuard = fs.readFileSync(path.join(root, "complete-face-state.js"), "utf8");
const adapter = fs.readFileSync(path.join(root, "assets/manifest-adapter.js"), "utf8");
const coordination = fs.readFileSync(path.join(root, "art-direction-bootstrap.js"), "utf8");
const errors = [];

const baseAssets = manifest.assets.filter((asset) => asset.type === "complete-face" && asset.reviewStatus === "approved");
const baseRecipes = manifest.recipes.filter((recipe) => recipe.mode === "complete-face");
const expandedAssets = expansion.characters || [];
const expected = expansion.targetCount;
const ids = new Set();

if (baseAssets.length + expandedAssets.length !== expected) errors.push(`Expected ${expected} approved complete-face assets; found ${baseAssets.length + expandedAssets.length}.`);
if (baseRecipes.length + expandedAssets.length !== expected) errors.push(`Expected ${expected} complete-face recipes; found ${baseRecipes.length + expandedAssets.length}.`);

for (const asset of [...baseAssets, ...expandedAssets]) {
  if (!asset.id || ids.has(asset.id)) errors.push(`Duplicate or missing complete-face ID ${asset.id || "<missing>"}.`);
  ids.add(asset.id);
  const sourcePath = path.join(root, asset.sourceFile);
  if (!fs.existsSync(sourcePath)) errors.push(`${asset.id} is missing source file ${asset.sourceFile}.`);
  if (!Array.isArray(asset.speciesTags) || asset.speciesTags.length === 0) errors.push(`${asset.id} has no species tags.`);
}

for (const marker of [
  "CuteCompleteFaces", "renderCompleteLibrary", "renderCompleteFace", "shuffleManifestFace",
  "renderManifestSaved", "cute:complete-face-change", "supportedPaletteKeys", "supportedExpressions",
  "rosterTargetCount"
]) {
  if (!runtime.includes(marker)) errors.push(`Complete-face runtime is missing ${marker}.`);
}
for (const marker of ["completeSnapshot", "cute:composition-change", "restoreCompleteSnapshotForLayeredMode"]) {
  if (!stateGuard.includes(marker)) errors.push(`Complete-face state guard is missing ${marker}.`);
}
if (!adapter.includes("mergeRosterExpansion")) errors.push("Manifest adapter does not merge the 24-character expansion.");
if (!adapter.includes('loadScript("complete-face.js")')) errors.push("Manifest adapter does not load the complete-face runtime.");
if (!adapter.includes("CuteCompleteFaces?.ready")) errors.push("Manifest adapter does not wait for complete-face assets.");
if (!coordination.includes("setVariantControlSupport")) errors.push("Art direction does not lock unsupported complete-face variants.");
if (!coordination.includes("CuteCompleteFaces?.listRecipes")) errors.push("Complete-face library count is not manifest-driven.");

if (errors.length) {
  console.error(`Complete-face validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Complete-face runtime valid: ${expected} approved assets and ${expected} selectable recipes.`);
