import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../assets/build-face-manifest.js", import.meta.url), "utf8");
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: "assets/build-face-manifest.js" });

const manifest = sandbox.window.CuteBuildFaceManifest;
const errors = [];
const required = { base: 5, ears: 8, eyes: 8, snout: 6, cheeks: 5, markings: 6, accessory: 6 };
const allowedPalettes = new Set(["tangerine", "lavender", "mint", "butter", "sky"]);
const ids = new Set();
const recipeIds = new Set();

function isFiniteTransform(transform) {
  return transform
    && Number.isFinite(transform.x)
    && Number.isFinite(transform.y)
    && Number.isFinite(transform.scale)
    && transform.scale > 0
    && Number.isFinite(transform.rotation);
}

if (!manifest || manifest.schemaVersion !== 1) errors.push("Missing or unsupported Build-a-face manifest.");
if (!Array.isArray(manifest?.categories) || manifest.categories.join(",") !== Object.keys(required).join(",")) {
  errors.push("Build-a-face categories are missing or out of canonical order.");
}

for (const item of manifest?.assets ?? []) {
  if (!item.id || ids.has(item.id)) errors.push(`Duplicate or missing asset ID: ${item.id || "<missing>"}`);
  ids.add(item.id);

  if (!required[item.type]) errors.push(`Unsupported asset type ${item.type} on ${item.id}.`);
  if (typeof item.label !== "string" || item.label.trim() === "") errors.push(`Missing label on ${item.id}.`);
  if (typeof item.markup !== "string") errors.push(`Missing authored markup string on ${item.id}.`);
  if (!Number.isFinite(item.zOrder)) errors.push(`Missing zOrder on ${item.id}.`);
  if (!isFiniteTransform(item.defaultTransform)) errors.push(`Invalid default transform on ${item.id}.`);
  if (!Array.isArray(item.compatibleBases) || item.compatibleBases.length === 0) errors.push(`Missing compatibility list on ${item.id}.`);

  for (const [baseId, override] of Object.entries(item.overrides || {})) {
    for (const key of Object.keys(override)) {
      if (!["x", "y", "scale", "rotation"].includes(key)) errors.push(`${item.id} has unsupported override field ${key} for ${baseId}.`);
    }
    if (override.x !== undefined && !Number.isFinite(override.x)) errors.push(`${item.id} has invalid x override for ${baseId}.`);
    if (override.y !== undefined && !Number.isFinite(override.y)) errors.push(`${item.id} has invalid y override for ${baseId}.`);
    if (override.scale !== undefined && (!Number.isFinite(override.scale) || override.scale <= 0)) errors.push(`${item.id} has invalid scale override for ${baseId}.`);
    if (override.rotation !== undefined && !Number.isFinite(override.rotation)) errors.push(`${item.id} has invalid rotation override for ${baseId}.`);
  }
}

for (const [type, minimum] of Object.entries(required)) {
  const count = manifest?.assets?.filter((item) => item.type === type).length ?? 0;
  if (count < minimum) errors.push(`${type} has ${count} assets; expected at least ${minimum}.`);
}

const bases = new Set((manifest?.assets ?? []).filter((item) => item.type === "base").map((item) => item.id));
for (const item of manifest?.assets ?? []) {
  for (const baseId of item.compatibleBases) {
    if (!bases.has(baseId)) errors.push(`${item.id} references unknown compatible base ${baseId}.`);
  }
  for (const baseId of Object.keys(item.overrides || {})) {
    if (!bases.has(baseId)) errors.push(`${item.id} has an override for unknown base ${baseId}.`);
    if (!item.compatibleBases.includes(baseId)) errors.push(`${item.id} has an override for blocked base ${baseId}.`);
  }
}

if ((manifest?.recipes?.length ?? 0) < 12) errors.push("Expected at least 12 curated layered recipes.");
for (const recipe of manifest?.recipes ?? []) {
  if (!recipe.id || recipeIds.has(recipe.id)) errors.push(`Duplicate or missing recipe ID: ${recipe.id || "<missing>"}`);
  recipeIds.add(recipe.id);

  if (recipe.mode !== "parts") errors.push(`${recipe.id} is not a parts recipe.`);
  if (!allowedPalettes.has(recipe.palette)) errors.push(`${recipe.id} uses unsupported palette ${recipe.palette}.`);
  if (!recipe.transform || !Number.isFinite(recipe.transform.scale) || recipe.transform.scale <= 0 || !Number.isFinite(recipe.transform.rotation) || typeof recipe.transform.flipX !== "boolean") {
    errors.push(`${recipe.id} has an invalid global transform.`);
  }

  for (const type of manifest.categories) {
    const id = recipe.partIds?.[type];
    const item = manifest.byId.get(id);
    if (!item || item.type !== type) errors.push(`${recipe.id} has invalid ${type} selection ${id}.`);
    if (type !== "base" && item && !item.compatibleBases.includes(recipe.partIds.base)) {
      errors.push(`${recipe.id} pairs ${id} with unsupported base ${recipe.partIds.base}.`);
    }
  }
}

if (errors.length) {
  console.error(`Build-a-face validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Build-a-face manifest valid: ${manifest.assets.length} assets, ${manifest.recipes.length} recipes.`);
