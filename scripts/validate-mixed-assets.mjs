import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const fixturePath = path.join(root, "assets", "mixed-asset-fixtures.json");
const adapterPath = path.join(root, "assets", "manifest-adapter.js");
const runtimePath = path.join(root, "mixed-asset-v2.js");
const integrationPath = path.join(root, "mixed-asset-integration.js");
const exportPath = path.join(root, "mixed-asset-export.js");
const previewPath = path.join(root, "previews", "mixed-asset-review.html");
const documentationPath = path.join(root, "docs", "MIXED-ASSET-PIPELINE.md");
const errors = [];

function fail(message) {
  errors.push(message);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function pngInfo(buffer) {
  if (buffer.length < 33 || buffer.toString("hex", 0, 8) !== "89504e470d0a1a0a") return null;
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    bitDepth: buffer[24],
    colorType: buffer[25]
  };
}

function isWebP(buffer) {
  return buffer.length >= 12
    && buffer.toString("ascii", 0, 4) === "RIFF"
    && buffer.toString("ascii", 8, 12) === "WEBP";
}

for (const filePath of [
  fixturePath,
  adapterPath,
  runtimePath,
  integrationPath,
  exportPath,
  previewPath,
  documentationPath
]) {
  if (!fs.existsSync(filePath)) fail(`Missing required file ${path.relative(root, filePath)}.`);
}

if (!fs.existsSync(fixturePath)) {
  console.error(errors.join("\n"));
  process.exit(1);
}

const config = readJson(fixturePath);
if (config.schemaVersion !== 1) fail("Mixed fixture schemaVersion must be 1.");
if (config.canonicalCanvas?.width !== 1000 || config.canonicalCanvas?.height !== 1000) {
  fail("Canonical mixed canvas must be 1000 × 1000.");
}
if (!Array.isArray(config.fixtures) || config.fixtures.length !== 2) {
  fail(`Expected exactly 2 reference fixtures; found ${config.fixtures?.length ?? 0}.`);
}

const fixtureIds = new Set();
const layerIds = new Set();
const formats = new Set();
const roles = new Set();
let rasterFixtureCount = 0;
let mixedFixtureCount = 0;
let maskCount = 0;
let maskedLayerCount = 0;

for (const fixture of config.fixtures || []) {
  if (!fixture.id || fixtureIds.has(fixture.id)) fail(`Duplicate or missing fixture ID ${fixture.id || "<missing>"}.`);
  fixtureIds.add(fixture.id);
  if (fixture.mediaMode === "raster") rasterFixtureCount += 1;
  if (fixture.mediaMode === "mixed") mixedFixtureCount += 1;
  if (!fixture.previewFile || !fs.existsSync(path.join(root, fixture.previewFile))) {
    fail(`${fixture.id} is missing previewFile ${fixture.previewFile || "<missing>"}.`);
  }
  if (!fixture.exportBounds) fail(`${fixture.id} is missing exportBounds.`);
  if (!Array.isArray(fixture.layers) || fixture.layers.length < 3) fail(`${fixture.id} requires at least 3 layers.`);

  const localIds = new Set((fixture.layers || []).map((layer) => layer.id));
  let previousOrder = -Infinity;
  for (const layer of fixture.layers || []) {
    if (!layer.id || layerIds.has(layer.id)) fail(`Duplicate or missing layer ID ${layer.id || "<missing>"}.`);
    layerIds.add(layer.id);
    formats.add(layer.format);
    roles.add(layer.layerRole);

    if (!layer.sourceFile) {
      fail(`${layer.id} is missing sourceFile.`);
      continue;
    }
    const sourcePath = path.join(root, layer.sourceFile);
    if (!fs.existsSync(sourcePath)) {
      fail(`${layer.id} is missing source file ${layer.sourceFile}.`);
      continue;
    }
    const source = fs.readFileSync(sourcePath);
    if (layer.format === "png") {
      const info = pngInfo(source);
      if (!info) fail(`${layer.id} is not a valid PNG.`);
      else {
        if (info.width !== layer.nativeCanvas.width || info.height !== layer.nativeCanvas.height) {
          fail(`${layer.id} PNG dimensions do not match nativeCanvas.`);
        }
        if (![4, 6].includes(info.colorType)) fail(`${layer.id} PNG does not declare alpha.`);
      }
    } else if (layer.format === "webp") {
      if (!isWebP(source)) fail(`${layer.id} is not a valid WebP.`);
    } else if (layer.format === "svg") {
      const text = source.toString("utf8").trim();
      if (!text.startsWith("<svg")) fail(`${layer.id} is not an SVG document.`);
      if (/<text\b/i.test(text)) fail(`${layer.id} contains baked-in text.`);
      if (!/viewBox=["']0 0 1000 1000["']/.test(text)) fail(`${layer.id} must use viewBox 0 0 1000 1000.`);
    } else {
      fail(`${layer.id} uses unsupported format ${layer.format}.`);
    }

    if (!layer.nativeCanvas?.width || !layer.nativeCanvas?.height) fail(`${layer.id} has invalid nativeCanvas.`);
    if (layer.anchor?.x < 0 || layer.anchor?.x > 1 || layer.anchor?.y < 0 || layer.anchor?.y > 1) fail(`${layer.id} has an invalid normalized anchor.`);
    if (!Number.isFinite(layer.zOrder) || layer.zOrder < previousOrder) fail(`${fixture.id} layer order is not deterministic.`);
    previousOrder = layer.zOrder;
    if (layer.layerRole === "effect-mask") {
      maskCount += 1;
      if (layer.visible !== false) fail(`${layer.id} effect mask must declare visible:false.`);
    }
    if (layer.maskRef) {
      maskedLayerCount += 1;
      if (!localIds.has(layer.maskRef)) fail(`${layer.id} references missing local mask ${layer.maskRef}.`);
    }
  }
}

if (rasterFixtureCount !== 1) fail(`Expected one fully raster fixture; found ${rasterFixtureCount}.`);
if (mixedFixtureCount !== 1) fail(`Expected one mixed fixture; found ${mixedFixtureCount}.`);
for (const format of ["svg", "png", "webp"]) if (!formats.has(format)) fail(`Reference coverage is missing ${format}.`);
for (const role of ["base-color", "linework", "shading", "highlight", "texture", "effect-mask"]) {
  if (!roles.has(role)) fail(`Reference coverage is missing layer role ${role}.`);
}
if (maskCount < 2) fail("Expected at least two explicit effect masks.");
if (maskedLayerCount < 3) fail("Expected at least three masked visual layers.");

const runtime = fs.existsSync(runtimePath) ? fs.readFileSync(runtimePath, "utf8") : "";
for (const marker of [
  "CuteMixedAssets",
  "effect-mask",
  "visible",
  "maskRef",
  "BLEND_MODE_FALLBACK",
  "applyMask",
  "globalCompositeOperation",
  "imageCache"
]) {
  if (!runtime.includes(marker)) fail(`Mixed runtime is missing ${marker}.`);
}

const integration = fs.existsSync(integrationPath) ? fs.readFileSync(integrationPath, "utf8") : "";
for (const marker of [
  "Mixed media references",
  "CuteMixedAssets.compose",
  "renderExportCanvas",
  "cute:mixed-asset-change",
  "scaleControl",
  "rotationControl",
  "flipButton"
]) {
  if (!integration.includes(marker)) fail(`Builder integration is missing ${marker}.`);
}

const exportIntegration = fs.existsSync(exportPath) ? fs.readFileSync(exportPath, "utf8") : "";
for (const marker of [
  "cute:export-ready",
  "renderPngBlob",
  "transparent",
  "getRecipeDocument",
  "stopImmediatePropagation"
]) {
  if (!exportIntegration.includes(marker)) fail(`Export integration is missing ${marker}.`);
}

const adapter = fs.existsSync(adapterPath) ? fs.readFileSync(adapterPath, "utf8") : "";
const loadOrder = [
  'loadScript("mixed-asset-v2.js")',
  'loadScript("complete-face.js")',
  'loadScript("mixed-asset-integration.js")',
  'loadScript("export-menu.js")',
  'loadScript("mixed-asset-export.js")'
];
let lastIndex = -1;
for (const marker of loadOrder) {
  const index = adapter.indexOf(marker);
  if (index < 0) fail(`Manifest adapter does not load ${marker}.`);
  if (index < lastIndex) fail(`Manifest adapter loads ${marker} out of order.`);
  lastIndex = index;
}

const documentation = fs.existsSync(documentationPath) ? fs.readFileSync(documentationPath, "utf8") : "";
for (const marker of ["Photoshop", "Procreate", "Illustrator", "Agent Cody Banks", "PNG", "WebP", "SVG"]) {
  if (!documentation.includes(marker)) fail(`Mixed asset documentation is missing ${marker}.`);
}

if (errors.length) {
  console.error(`Mixed asset validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(JSON.stringify({
  status: "passed",
  fixtures: config.fixtures.length,
  layers: layerIds.size,
  formats: [...formats].sort(),
  roles: [...roles].sort(),
  masks: maskCount,
  maskedLayers: maskedLayerCount
}, null, 2));
