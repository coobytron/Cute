#!/usr/bin/env node

import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const manifestPath = path.join(repositoryRoot, "assets", "manifest.json");

const errors = [];
const requiredAssetFields = [
  "id",
  "label",
  "type",
  "sourceFile",
  "thumbnail",
  "nativeCanvas",
  "anchor",
  "defaultTransform",
  "zOrder",
  "speciesTags",
  "compatibleAssetIds",
  "supportedPalettes",
  "exportBounds"
];

function fail(message) {
  errors.push(message);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function checkKebabId(value, label) {
  if (typeof value !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    fail(`${label} must be a stable kebab-case ID.`);
  }
}

function checkNumber(value, label, { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY } = {}) {
  if (typeof value !== "number" || Number.isNaN(value) || value < min || value > max) {
    fail(`${label} must be a number between ${min} and ${max}.`);
  }
}

async function fileExists(repositoryRelativePath, label) {
  if (typeof repositoryRelativePath !== "string" || repositoryRelativePath.length === 0) {
    fail(`${label} is missing a repository-relative path.`);
    return;
  }

  const absolutePath = path.resolve(repositoryRoot, repositoryRelativePath);
  if (!absolutePath.startsWith(repositoryRoot + path.sep)) {
    fail(`${label} escapes the repository root: ${repositoryRelativePath}`);
    return;
  }

  try {
    await access(absolutePath, constants.R_OK);
  } catch {
    fail(`${label} does not exist: ${repositoryRelativePath}`);
  }
}

let manifest;
try {
  manifest = JSON.parse(await readFile(manifestPath, "utf8"));
} catch (error) {
  console.error(`Unable to read ${path.relative(repositoryRoot, manifestPath)}: ${error.message}`);
  process.exit(1);
}

if (!Number.isInteger(manifest.schemaVersion) || manifest.schemaVersion < 1) {
  fail("schemaVersion must be a positive integer.");
}

if (!isPlainObject(manifest.canonicalCanvas)) {
  fail("canonicalCanvas must be an object.");
} else {
  checkNumber(manifest.canonicalCanvas.width, "canonicalCanvas.width", { min: 1 });
  checkNumber(manifest.canonicalCanvas.height, "canonicalCanvas.height", { min: 1 });
  if (manifest.canonicalCanvas.coordinateSystem !== "top-left") {
    fail('canonicalCanvas.coordinateSystem must be "top-left".');
  }
}

const assetTypes = new Set(Array.isArray(manifest.assetTypes) ? manifest.assetTypes : []);
const palettes = new Set((Array.isArray(manifest.palettes) ? manifest.palettes : []).map((palette) => palette.id));
const assets = Array.isArray(manifest.assets) ? manifest.assets : [];
const recipes = Array.isArray(manifest.recipes) ? manifest.recipes : [];
const assetIds = new Set();
const recipeIds = new Set();

if (assets.length === 0) {
  fail("assets must contain at least one entry.");
}

for (const [index, asset] of assets.entries()) {
  const prefix = `assets[${index}]`;

  if (!isPlainObject(asset)) {
    fail(`${prefix} must be an object.`);
    continue;
  }

  for (const field of requiredAssetFields) {
    if (!(field in asset)) {
      fail(`${prefix} is missing required field ${field}.`);
    }
  }

  checkKebabId(asset.id, `${prefix}.id`);
  if (assetIds.has(asset.id)) {
    fail(`Duplicate asset ID: ${asset.id}`);
  }
  assetIds.add(asset.id);

  if (!assetTypes.has(asset.type)) {
    fail(`${asset.id} uses unknown type ${asset.type}.`);
  }

  if (!Number.isInteger(asset.zOrder) || asset.zOrder < 0 || asset.zOrder > 999) {
    fail(`${asset.id}.zOrder must be an integer from 0 to 999.`);
  }

  if (!isPlainObject(asset.nativeCanvas)) {
    fail(`${asset.id}.nativeCanvas must be an object.`);
  } else {
    checkNumber(asset.nativeCanvas.width, `${asset.id}.nativeCanvas.width`, { min: 1 });
    checkNumber(asset.nativeCanvas.height, `${asset.id}.nativeCanvas.height`, { min: 1 });
  }

  if (!isPlainObject(asset.anchor)) {
    fail(`${asset.id}.anchor must be an object.`);
  } else {
    checkNumber(asset.anchor.x, `${asset.id}.anchor.x`, { min: 0, max: 1 });
    checkNumber(asset.anchor.y, `${asset.id}.anchor.y`, { min: 0, max: 1 });
  }

  if (!isPlainObject(asset.defaultTransform)) {
    fail(`${asset.id}.defaultTransform must be an object.`);
  } else {
    checkNumber(asset.defaultTransform.x, `${asset.id}.defaultTransform.x`);
    checkNumber(asset.defaultTransform.y, `${asset.id}.defaultTransform.y`);
    checkNumber(asset.defaultTransform.scale, `${asset.id}.defaultTransform.scale`, { min: Number.EPSILON });
    checkNumber(asset.defaultTransform.rotation, `${asset.id}.defaultTransform.rotation`);
    if (typeof asset.defaultTransform.flipX !== "boolean") {
      fail(`${asset.id}.defaultTransform.flipX must be boolean.`);
    }
  }

  if (!Array.isArray(asset.speciesTags) || asset.speciesTags.length === 0) {
    fail(`${asset.id}.speciesTags must be a non-empty array.`);
  }
  if (!Array.isArray(asset.compatibleAssetIds)) {
    fail(`${asset.id}.compatibleAssetIds must be an array.`);
  }
  if (!Array.isArray(asset.supportedPalettes) || asset.supportedPalettes.length === 0) {
    fail(`${asset.id}.supportedPalettes must be a non-empty array.`);
  } else {
    for (const paletteId of asset.supportedPalettes) {
      if (!palettes.has(paletteId)) {
        fail(`${asset.id} references unknown palette ${paletteId}.`);
      }
    }
  }

  if (!isPlainObject(asset.exportBounds)) {
    fail(`${asset.id}.exportBounds must be an object.`);
  } else {
    const { left, top, right, bottom } = asset.exportBounds;
    ["left", "top", "right", "bottom"].forEach((key) => checkNumber(asset.exportBounds[key], `${asset.id}.exportBounds.${key}`));
    if (typeof left === "number" && typeof right === "number" && left >= right) {
      fail(`${asset.id}.exportBounds left must be less than right.`);
    }
    if (typeof top === "number" && typeof bottom === "number" && top >= bottom) {
      fail(`${asset.id}.exportBounds top must be less than bottom.`);
    }
  }

  await fileExists(asset.sourceFile, `${asset.id}.sourceFile`);
  await fileExists(asset.thumbnail, `${asset.id}.thumbnail`);
}

for (const asset of assets) {
  for (const compatibleId of asset.compatibleAssetIds ?? []) {
    if (!assetIds.has(compatibleId)) {
      fail(`${asset.id} references missing compatible asset ${compatibleId}.`);
    }
  }
}

for (const [index, recipe] of recipes.entries()) {
  const prefix = `recipes[${index}]`;
  if (!isPlainObject(recipe)) {
    fail(`${prefix} must be an object.`);
    continue;
  }

  checkKebabId(recipe.id, `${prefix}.id`);
  if (recipeIds.has(recipe.id)) {
    fail(`Duplicate recipe ID: ${recipe.id}`);
  }
  recipeIds.add(recipe.id);

  if (!palettes.has(recipe.paletteId)) {
    fail(`${recipe.id} references unknown palette ${recipe.paletteId}.`);
  }
  for (const referenceKey of ["finishId", "backgroundId", "frameId"]) {
    const reference = recipe[referenceKey];
    if (reference !== null && reference !== undefined && !assetIds.has(reference)) {
      fail(`${recipe.id}.${referenceKey} references missing asset ${reference}.`);
    }
  }

  if (recipe.mode === "complete-face") {
    if (!assetIds.has(recipe.completeFaceId)) {
      fail(`${recipe.id} references missing complete face ${recipe.completeFaceId}.`);
    }
  } else if (recipe.mode === "parts") {
    if (!isPlainObject(recipe.partIds) || Object.keys(recipe.partIds).length === 0) {
      fail(`${recipe.id}.partIds must contain authored part IDs.`);
    } else {
      for (const [category, assetId] of Object.entries(recipe.partIds)) {
        if (!assetIds.has(assetId)) {
          fail(`${recipe.id}.partIds.${category} references missing asset ${assetId}.`);
        }
      }
    }
  } else {
    fail(`${recipe.id}.mode must be complete-face or parts.`);
  }
}

const requiredSampleTypes = [
  "complete-face",
  "base",
  "ears",
  "eyes",
  "snout",
  "cheeks",
  "markings",
  "accessory",
  "background",
  "frame",
  "finish"
];
for (const type of requiredSampleTypes) {
  if (!assets.some((asset) => asset.type === type)) {
    fail(`Manifest must contain at least one ${type} asset.`);
  }
}

const approvedHeroRecipes = recipes.filter((recipe) => recipe.mode === "complete-face");
if (approvedHeroRecipes.length < 5) {
  fail("Manifest must include at least five complete-face hero recipes.");
}

if (errors.length > 0) {
  console.error(`Manifest validation failed with ${errors.length} error${errors.length === 1 ? "" : "s"}:`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Manifest valid: ${assets.length} assets, ${recipes.length} recipes, ${palettes.size} palettes.`);
