import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reportPath = path.join(root, "review-artifacts", "release-validation.json");

const validators = [
  ["authored-manifest", "scripts/validate-manifest.mjs"],
  ["roster-expansion", "scripts/validate-roster-expansion.mjs"],
  ["complete-faces", "scripts/validate-complete-faces.mjs"],
  ["build-a-face", "scripts/validate-build-face.mjs"],
  ["art-direction", "scripts/validate-art-direction.mjs"],
  ["history-saves", "scripts/validate-history-saves.mjs"],
  ["export", "scripts/validate-export.mjs"],
  ["responsive-a11y", "scripts/validate-responsive-a11y.mjs"],
  ["mixed-assets", "scripts/validate-mixed-assets.mjs"],
  ["effects-bootstrap", "scripts/validate-effects-bootstrap.mjs"],
  ["effects-integration", "scripts/validate-effects-integration.mjs"]
];

const requiredFiles = [
  "previews/contact-sheets/character-roster-36.html",
  "previews/contact-sheets/release-matrix.html",
  "previews/contact-sheets/build-face-compatibility.html",
  "previews/contact-sheets/art-direction-finishes.html",
  "previews/export-fixtures/export-matrix.html",
  "previews/responsive-review.html",
  "previews/mixed-asset-review.html",
  "previews/effects-review.html",
  "previews/contact-sheets/character-effects-matrix.html",
  "review-artifacts/mvp-feature-map.json",
  "review-artifacts/character-effects-matrix.json",
  "review-artifacts/effects-bootstrap-validation.json",
  "review-artifacts/effects-integration-validation.json",
  "assets/roster-expansion.json",
  "assets/mixed-asset-fixtures.json",
  "assets/effects-presets.json",
  "assets/effect-compatibility.json",
  "docs/MVP-FEATURE-MAP.md",
  "docs/RELEASE-CHECKLIST.md",
  "docs/KNOWN-LIMITATIONS.md",
  "docs/CHARACTER-ROSTER.md",
  "docs/MIXED-ASSET-PIPELINE.md",
  "docs/EFFECTS.md",
  "docs/ART-DIRECTION-SIGNOFF.md"
];

function runValidator(id, relativePath) {
  const result = spawnSync(process.execPath, [path.join(root, relativePath)], {
    cwd: root,
    encoding: "utf8"
  });
  return {
    id,
    path: relativePath,
    status: result.status === 0 ? "passed" : "failed",
    exitCode: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim()
  };
}

function loadBuildManifest() {
  const source = fs.readFileSync(path.join(root, "assets/build-face-manifest.js"), "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: "assets/build-face-manifest.js" });
  return sandbox.window.CuteBuildFaceManifest;
}

const checks = [];
const failures = [];
function check(id, condition, detail) {
  const status = condition ? "passed" : "failed";
  checks.push({ id, status, detail });
  if (!condition) failures.push(`${id}: ${detail}`);
}

const validatorResults = validators.map(([id, relativePath]) => runValidator(id, relativePath));
for (const result of validatorResults) {
  if (result.status !== "passed") failures.push(`${result.id}: focused validator failed`);
}

for (const relativePath of requiredFiles) {
  check(`file:${relativePath}`, fs.existsSync(path.join(root, relativePath)), `Required release artifact ${relativePath}`);
}

const manifest = JSON.parse(fs.readFileSync(path.join(root, "assets/manifest.json"), "utf8"));
const expansion = JSON.parse(fs.readFileSync(path.join(root, "assets/roster-expansion.json"), "utf8"));
const mixed = JSON.parse(fs.readFileSync(path.join(root, "assets/mixed-asset-fixtures.json"), "utf8"));
const effects = JSON.parse(fs.readFileSync(path.join(root, "assets/effects-presets.json"), "utf8"));
const characterEffects = JSON.parse(fs.readFileSync(path.join(root, "review-artifacts/character-effects-matrix.json"), "utf8"));
const buildManifest = loadBuildManifest();
const featureMap = JSON.parse(fs.readFileSync(path.join(root, "review-artifacts/mvp-feature-map.json"), "utf8"));
const releaseMatrix = fs.readFileSync(path.join(root, "previews/contact-sheets/release-matrix.html"), "utf8");
const checklist = fs.readFileSync(path.join(root, "docs/RELEASE-CHECKLIST.md"), "utf8");
const limitations = fs.readFileSync(path.join(root, "docs/KNOWN-LIMITATIONS.md"), "utf8");
const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const bootstrap = fs.readFileSync(path.join(root, "assets/manifest-adapter.js"), "utf8");
const mixedExport = fs.readFileSync(path.join(root, "mixed-asset-export.js"), "utf8");

const baseCompleteAssets = manifest.assets.filter((asset) => asset.type === "complete-face" && asset.reviewStatus === "approved");
const baseCompleteRecipes = manifest.recipes.filter((recipe) => recipe.mode === "complete-face");
const expandedAssets = (expansion.characters || []).filter((asset) => asset.reviewStatus === "approved");
const approvedCompleteFaces = baseCompleteAssets.length + expandedAssets.length;
const completeFaceRecipes = baseCompleteRecipes.length + expandedAssets.length;
const mixedFixtureCount = mixed.fixtures?.length || 0;
const effectCount = effects.effects?.length || 0;
const presetCount = effects.presets?.length || 0;

check("count:complete-assets", approvedCompleteFaces === 36, `Expected 36 approved complete faces; found ${approvedCompleteFaces}`);
check("count:complete-recipes", completeFaceRecipes === 36, `Expected 36 complete-face recipes; found ${completeFaceRecipes}`);
check("count:roster-target", expansion.targetCount === 36 && expansion.additionCount === 24, `Expected a 12 + 24 = 36 roster contract; found target ${expansion.targetCount}`);
check("count:mixed-fixtures", mixedFixtureCount === 2, `Expected 2 mixed-media reference characters; found ${mixedFixtureCount}`);
check("count:effect-presets", presetCount === 6, `Expected 6 effects presets; found ${presetCount}`);
check("count:effects", effectCount === 12, `Expected 12 effects; found ${effectCount}`);
check("count:layered-recipes", buildManifest.recipes.length === 12, `Expected 12 layered recipes; found ${buildManifest.recipes.length}`);

check("matrix:characters", characterEffects.counts?.characters === 38, `Expected 38 browseable character cases; found ${characterEffects.counts?.characters}`);
check("matrix:canonical-expanded", characterEffects.counts?.canonicalAndExpandedCharacters === 36, `Expected 36 canonical and expanded characters; found ${characterEffects.counts?.canonicalAndExpandedCharacters}`);
check("matrix:mixed", characterEffects.counts?.mixedFixtures === 2, `Expected 2 mixed fixtures; found ${characterEffects.counts?.mixedFixtures}`);
check("matrix:presets", characterEffects.counts?.presets === 6, `Expected 6 matrix presets; found ${characterEffects.counts?.presets}`);
check("matrix:cases", characterEffects.counts?.cases === 494, `Expected 494 deterministic cases; found ${characterEffects.counts?.cases}`);
check("matrix:seed", characterEffects.deterministicSeed === effects.defaultSeed, `Matrix seed ${characterEffects.deterministicSeed} must match effects seed ${effects.defaultSeed}`);
check("matrix:manual-review", characterEffects.manualReviewRequired === true, "Character/effect matrix must preserve explicit human review");

const baselineReleaseMarkers = [
  "12 complete faces × normal / flipped",
  "12 curated layered recipes × normal / flipped",
  "Four fixed finish recipes",
  "Five approved layered palettes",
  "Five authored backgrounds",
  "Frame states",
  "Caption off / on",
  "Opaque / transparent checkerboard",
  "build-face-compatibility.html"
];
for (const marker of baselineReleaseMarkers) {
  check(`baseline-matrix:${marker}`, releaseMatrix.includes(marker), `Original MVP release matrix must retain ${marker}`);
}

const featureStatuses = featureMap.features.map((feature) => feature.status);
check("feature-map:count", featureMap.features.length >= 9, `Expected at least 9 mapped feature groups; found ${featureMap.features.length}`);
check("feature-map:no-planned", featureStatuses.every((status) => status === "implemented" || status === "implemented_with_manual_review"), "Every mapped MVP feature must be implemented or explicitly awaiting manual review");
check("feature-map:manual-review", Array.isArray(featureMap.manualReviewRequired) && featureMap.manualReviewRequired.length >= 5, "Manual review requirements must be explicit");

for (const phrase of ["CI passing does not imply", "VoiceOver", "200%", "physical thermal-printer"]) {
  check(`checklist:${phrase}`, checklist.includes(phrase), `Release checklist must state ${phrase}`);
}
for (const phrase of ["client-side only", "no AI generation", "local to one browser", "does not run a real browser", "human art-direction approval"]) {
  check(`limitations:${phrase}`, limitations.includes(phrase), `Known limitations must state ${phrase}`);
}
for (const phrase of ["36 approved authored complete faces", "two mixed-media reference characters", "six seeded finishing presets", "12 non-destructive effects", "494 deterministic"]) {
  check(`readme:${phrase}`, readme.includes(phrase), `README must state ${phrase}`);
}
for (const phrase of ["CUTE FACE LAB / V2", "36 approved complete faces", "two mixed-media references", "six seeded effects presets"]) {
  check(`index:${phrase}`, index.includes(phrase), `Application copy must state ${phrase}`);
}

for (const stalePhrase of ["The first MVP locks five hero recipes", "CUTE FACE LAB / MVP 01", "Expansion should not begin"]) {
  check(`stale-copy:${stalePhrase}`, !readme.includes(stalePhrase) && !index.includes(stalePhrase) && !limitations.includes(stalePhrase), `Stale release copy must be removed: ${stalePhrase}`);
}

for (const runtimeMarker of [
  'loadStyle("assets/effects.css")',
  'loadScript("effects.js")',
  'loadScript("effects-controller.js")',
  'loadScript("effects-export-integration.js")',
  "cute:effects-bootstrap-ready",
  "cute:effects-bootstrap-error"
]) {
  check(`bootstrap:${runtimeMarker}`, bootstrap.includes(runtimeMarker), `Production bootstrap must include ${runtimeMarker}`);
}
check("bootstrap:single-owner", !mixedExport.includes("installEffectsFinishingEngine") && !mixedExport.includes('loadScript("effects.js")'), "Mixed export must not own a duplicate effects loader");

const report = {
  schemaVersion: 2,
  product: "Cute Face Builder",
  release: "V2",
  generatedAt: new Date().toISOString(),
  commit: process.env.GITHUB_SHA || null,
  automatedStatus: failures.length === 0 ? "passed" : "failed",
  validatorResults,
  releaseChecks: checks,
  counts: {
    approvedCompleteFaces,
    completeFaceRecipes,
    mixedFixtures: mixedFixtureCount,
    layeredRecipes: buildManifest.recipes.length,
    effects: effectCount,
    presets: presetCount,
    browseableCharacters: characterEffects.counts?.characters,
    deterministicCases: characterEffects.counts?.cases,
    mappedFeatureGroups: featureMap.features.length
  },
  manualStatus: "pending",
  manualReviewRequired: [
    ...featureMap.manualReviewRequired,
    "36-character roster art-direction signoff",
    "mixed-media Safari and Chromium parity",
    "six-preset preview and export parity",
    "494-case character and effect matrix review"
  ],
  failures
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(JSON.stringify({
  automatedStatus: report.automatedStatus,
  validators: validatorResults.map(({ id, status }) => ({ id, status })),
  counts: report.counts,
  manualStatus: report.manualStatus,
  report: path.relative(root, reportPath)
}, null, 2));

if (failures.length) {
  console.error(`Release validation failed with ${failures.length} error(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
