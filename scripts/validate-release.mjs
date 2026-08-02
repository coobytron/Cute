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
  ["ios-experience", "scripts/validate-ios-experience.mjs"]
];

const requiredFiles = [
  "previews/contact-sheets/character-roster-36.html",
  "previews/contact-sheets/release-matrix.html",
  "previews/contact-sheets/build-face-compatibility.html",
  "previews/contact-sheets/art-direction-finishes.html",
  "previews/export-fixtures/export-matrix.html",
  "previews/responsive-review.html",
  "previews/ios-review.html",
  "docs/IOS-EXPERIENCE.md",
  "site.webmanifest",
  "assets/icons/apple-touch-icon-180.png",
  "review-artifacts/mvp-feature-map.json",
  "docs/MVP-FEATURE-MAP.md",
  "docs/RELEASE-CHECKLIST.md",
  "docs/KNOWN-LIMITATIONS.md",
  "docs/CHARACTER-ROSTER.md"
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
const buildManifest = loadBuildManifest();
const featureMap = JSON.parse(fs.readFileSync(path.join(root, "review-artifacts/mvp-feature-map.json"), "utf8"));
const releaseMatrix = fs.readFileSync(path.join(root, "previews/contact-sheets/release-matrix.html"), "utf8");
const checklist = fs.readFileSync(path.join(root, "docs/RELEASE-CHECKLIST.md"), "utf8");
const limitations = fs.readFileSync(path.join(root, "docs/KNOWN-LIMITATIONS.md"), "utf8");

const baseCompleteAssets = manifest.assets.filter((asset) => asset.type === "complete-face" && asset.reviewStatus === "approved");
const baseCompleteRecipes = manifest.recipes.filter((recipe) => recipe.mode === "complete-face");
const expandedAssets = (expansion.characters || []).filter((asset) => asset.reviewStatus === "approved");
const approvedCompleteFaces = baseCompleteAssets.length + expandedAssets.length;
const completeFaceRecipes = baseCompleteRecipes.length + expandedAssets.length;

check("count:complete-assets", approvedCompleteFaces === expansion.targetCount, `Expected ${expansion.targetCount} approved complete faces; found ${approvedCompleteFaces}`);
check("count:complete-recipes", completeFaceRecipes === expansion.targetCount, `Expected ${expansion.targetCount} complete-face recipes; found ${completeFaceRecipes}`);
check("count:layered-recipes", buildManifest.recipes.length === 12, `Expected 12 layered recipes; found ${buildManifest.recipes.length}`);

const releaseMarkers = [
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
for (const marker of releaseMarkers) {
  check(`matrix:${marker}`, releaseMatrix.includes(marker), `Release matrix must include ${marker}`);
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

const report = {
  schemaVersion: 1,
  product: "Cute Face Builder",
  generatedAt: new Date().toISOString(),
  commit: process.env.GITHUB_SHA || null,
  automatedStatus: failures.length === 0 ? "passed" : "failed",
  validatorResults,
  releaseChecks: checks,
  counts: {
    approvedCompleteFaces,
    completeFaceRecipes,
    layeredRecipes: buildManifest.recipes.length,
    mappedFeatureGroups: featureMap.features.length
  },
  manualStatus: "pending",
  manualReviewRequired: featureMap.manualReviewRequired,
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
