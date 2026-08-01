import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "assets/manifest.json"), "utf8"));
const runtime = fs.readFileSync(path.join(root, "complete-face.js"), "utf8");
const stateGuard = fs.readFileSync(path.join(root, "complete-face-state.js"), "utf8");
const adapter = fs.readFileSync(path.join(root, "assets/manifest-adapter.js"), "utf8");
const coordination = fs.readFileSync(path.join(root, "art-direction-bootstrap.js"), "utf8");
const errors = [];

const assets = manifest.assets.filter((asset) => asset.type === "complete-face" && asset.reviewStatus === "approved");
const recipes = manifest.recipes.filter((recipe) => recipe.mode === "complete-face");
const assetsById = new Map(assets.map((asset) => [asset.id, asset]));
const recipeIds = new Set();

if (assets.length !== 12) errors.push(`Expected 12 approved complete-face assets; found ${assets.length}.`);
if (recipes.length !== 12) errors.push(`Expected 12 complete-face recipes; found ${recipes.length}.`);

for (const asset of assets) {
  const sourcePath = path.join(root, asset.sourceFile);
  if (!fs.existsSync(sourcePath)) {
    errors.push(`${asset.id} is missing source file ${asset.sourceFile}.`);
    continue;
  }

  const source = fs.readFileSync(sourcePath, "utf8");
  if (!source.trimStart().startsWith("<svg")) errors.push(`${asset.id} source is not an SVG document.`);
  if (/<text\b/i.test(source)) errors.push(`${asset.id} contains baked-in text.`);
  if (!asset.thumbnail || !fs.existsSync(path.join(root, asset.thumbnail))) errors.push(`${asset.id} is missing its thumbnail.`);
  if (!Array.isArray(asset.supportedPalettes) || asset.supportedPalettes.length === 0) errors.push(`${asset.id} has no supported palette declaration.`);
  if (!asset.defaultExpression) errors.push(`${asset.id} has no default expression.`);
}

for (const recipe of recipes) {
  if (!recipe.id || recipeIds.has(recipe.id)) errors.push(`Duplicate or missing complete-face recipe ID ${recipe.id || "<missing>"}.`);
  recipeIds.add(recipe.id);
  if (!assetsById.has(recipe.completeFaceId)) errors.push(`${recipe.id} references unavailable complete face ${recipe.completeFaceId}.`);
  if (!recipe.transform || !Number.isFinite(recipe.transform.scale) || !Number.isFinite(recipe.transform.rotation) || typeof recipe.transform.flipX !== "boolean") {
    errors.push(`${recipe.id} has an invalid transform.`);
  }
}

for (const marker of [
  "CuteCompleteFaces",
  "renderCompleteLibrary",
  "renderCompleteFace",
  "shuffleManifestFace",
  "renderManifestSaved",
  "cute:complete-face-change",
  "supportedPaletteKeys",
  "supportedExpressions"
]) {
  if (!runtime.includes(marker)) errors.push(`Complete-face runtime is missing ${marker}.`);
}

for (const marker of ["completeSnapshot", "cute:composition-change", "restoreCompleteSnapshotForLayeredMode"]) {
  if (!stateGuard.includes(marker)) errors.push(`Complete-face state guard is missing ${marker}.`);
}

if (!adapter.includes('loadScript("complete-face.js")')) errors.push("Manifest adapter does not load the complete-face runtime.");
if (!adapter.includes("CuteCompleteFaces?.ready")) errors.push("Manifest adapter does not wait for complete-face assets before other controls.");
if (!adapter.includes('loadScript("complete-face-state.js")')) errors.push("Manifest adapter does not load the complete-face state guard.");
if (!coordination.includes("setVariantControlSupport")) errors.push("Art direction does not lock unsupported complete-face variants.");
if (!coordination.includes("CuteCompleteFaces?.listRecipes")) errors.push("Complete-face library count is not manifest-driven.");

if (errors.length) {
  console.error(`Complete-face validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Complete-face runtime valid: 12 approved assets and 12 selectable recipes with isolated layered state.");
