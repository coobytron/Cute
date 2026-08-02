import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
const failures = [];
const warnings = [];
const required = ["effects.js", "effects-controller.js", "effects-export-integration.js", "assets/effects.css", "assets/effects-presets.json", "mixed-asset-export.js", "previews/effects-review.html", "docs/EFFECTS.md"];
for (const file of required) if (!exists(file)) failures.push({ code: "missing-file", file });

const config = JSON.parse(read("assets/effects-presets.json"));
const ids = new Set(config.effects.map((effect) => effect.id));
const categories = new Set(config.effects.map((effect) => effect.category));
const requiredPresets = ["soft-plush", "candy-gloss", "riso-friend", "paper-sticker", "dream-glow", "pixel-pet"];
if (ids.size < 8) failures.push({ code: "effect-count", actual: ids.size });
if (categories.size < 3) failures.push({ code: "category-count", actual: [...categories] });
for (const id of requiredPresets) if (!config.presets.some((preset) => preset.id === id)) failures.push({ code: "missing-preset", presetId: id });
for (const preset of config.presets) for (const entry of preset.effects) if (!ids.has(entry.id)) failures.push({ code: "unknown-effect", presetId: preset.id, effectId: entry.id });

const engine = read("effects.js");
const controller = read("effects-controller.js");
const exportIntegration = read("effects-export-integration.js");
const loader = read("mixed-asset-export.js");
for (const token of ["createRandom", "resolvePreset", "apply", "reset"]) if (!engine.includes(token)) failures.push({ code: "engine-contract", token });
for (const token of ["CuteEffectsController", "serialize", "deserialize", "cuteEffectsIntensity", "cuteEffectsSeed", "performanceTier", "interceptExportMenu"]) if (!controller.includes(token)) failures.push({ code: "controller-contract", token });
for (const token of ["applyToBlob", "renderPngBlob", "effects: controller.getState()", "CuteExportEffects"]) if (!exportIntegration.includes(token)) failures.push({ code: "export-contract", token });
for (const token of ["assets/effects.css", "effects.js", "effects-controller.js", "effects-export-integration.js", "installEffectsFinishingEngine"]) if (!loader.includes(token)) failures.push({ code: "loader-contract", token });
for (const token of ["CuteExportEffects?.isEnabled", "installEffectsFinishingEngine()", "cute:effects-stack-ready"]) if (!loader.includes(token)) failures.push({ code: "mixed-export-contract", token });

const extractRandom = (seed) => {
  let state = (() => { const text = String(seed); let hash = 2166136261; for (let i = 0; i < text.length; i += 1) { hash ^= text.charCodeAt(i); hash = Math.imul(hash, 16777619); } return hash >>> 0; })() || 0x9e3779b9;
  return () => { state += 0x6d2b79f5; let value = state; value = Math.imul(value ^ (value >>> 15), value | 1); value ^= value + Math.imul(value ^ (value >>> 7), value | 61); return ((value ^ (value >>> 14)) >>> 0) / 4294967296; };
};
const a = extractRandom(config.defaultSeed); const b = extractRandom(config.defaultSeed);
const probeA = Array.from({ length: 16 }, () => a()); const probeB = Array.from({ length: 16 }, () => b());
if (JSON.stringify(probeA) !== JSON.stringify(probeB)) failures.push({ code: "seed-repeatability" });
if (!config.effects.some((effect) => effect.target === "background")) warnings.push({ code: "no-background-scope" });

const report = { schemaVersion: 1, generatedAt: new Date().toISOString(), summary: { passed: failures.length === 0, effects: ids.size, presets: config.presets.length, categories: [...categories].sort(), seed: config.defaultSeed }, failures, warnings };
fs.mkdirSync(path.join(root, "review-artifacts"), { recursive: true });
fs.writeFileSync(path.join(root, "review-artifacts/effects-integration-validation.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.summary));
if (failures.length) process.exitCode = 1;
