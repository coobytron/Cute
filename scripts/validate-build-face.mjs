import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../assets/build-face-manifest.js", import.meta.url), "utf8");
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: "assets/build-face-manifest.js" });

const manifest = sandbox.window.CuteBuildFaceManifest;
const errors = [];
const required = { base: 5, ears: 8, eyes: 8, snout: 6, cheeks: 5, markings: 6, accessory: 6 };
const ids = new Set();

if (!manifest || manifest.schemaVersion !== 1) errors.push("Missing or unsupported Build-a-face manifest.");

for (const item of manifest?.assets ?? []) {
  if (!item.id || ids.has(item.id)) errors.push(`Duplicate or missing asset ID: ${item.id || "<missing>"}`);
  ids.add(item.id);
  if (!required[item.type]) errors.push(`Unsupported asset type ${item.type} on ${item.id}.`);
  if (!Number.isFinite(item.zOrder)) errors.push(`Missing zOrder on ${item.id}.`);
  if (!item.defaultTransform || !Number.isFinite(item.defaultTransform.x) || !Number.isFinite(item.defaultTransform.y)) errors.push(`Missing default transform/anchor on ${item.id}.`);
  if (!Array.isArray(item.compatibleBases) || item.compatibleBases.length === 0) errors.push(`Missing compatibility list on ${item.id}.`);
}

for (const [type, minimum] of Object.entries(required)) {
  const count = manifest.assets.filter((item) => item.type === type).length;
  if (count < minimum) errors.push(`${type} has ${count} assets; expected at least ${minimum}.`);
}

const bases = new Set(manifest.assets.filter((item) => item.type === "base").map((item) => item.id));
for (const item of manifest.assets) {
  for (const baseId of item.compatibleBases) {
    if (!bases.has(baseId)) errors.push(`${item.id} references unknown compatible base ${baseId}.`);
  }
  for (const baseId of Object.keys(item.overrides || {})) {
    if (!bases.has(baseId)) errors.push(`${item.id} has an override for unknown base ${baseId}.`);
  }
}

if ((manifest?.recipes?.length ?? 0) < 12) errors.push("Expected at least 12 curated layered recipes.");
for (const recipe of manifest?.recipes ?? []) {
  if (recipe.mode !== "parts") errors.push(`${recipe.id} is not a parts recipe.`);
  for (const type of manifest.categories) {
    const id = recipe.partIds?.[type];
    const item = manifest.byId.get(id);
    if (!item || item.type !== type) errors.push(`${recipe.id} has invalid ${type} selection ${id}.`);
    if (type !== "base" && item && !item.compatibleBases.includes(recipe.partIds.base)) errors.push(`${recipe.id} pairs ${id} with unsupported base ${recipe.partIds.base}.`);
  }
}

if (errors.length) {
  console.error(`Build-a-face validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Build-a-face manifest valid: ${manifest.assets.length} assets, ${manifest.recipes.length} recipes.`);
