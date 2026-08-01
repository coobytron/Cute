import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const manifestPath = path.join(root, "assets", "manifest.json");
const effectsPath = path.join(root, "assets", "effects-presets.json");
const outputDirectory = path.join(root, "previews", "contact-sheets");
const reportDirectory = path.join(root, "review-artifacts");
const htmlPath = path.join(outputDirectory, "character-effects-matrix.html");
const reportPath = path.join(reportDirectory, "character-effects-matrix.json");

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));
const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

function stableId(...parts) {
  return parts
    .filter(Boolean)
    .join("--")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

function expectedAction(character, preset) {
  const rules = character.effectCompatibility || {};
  if ((rules.block || []).includes(preset.id)) return "block";
  if ((rules.reduce || []).includes(preset.id)) return "reduce";
  if (rules.replace?.[preset.id]) return `replace:${rules.replace[preset.id]}`;
  return "allow";
}

function validateCharacter(character) {
  const failures = [];
  const sourcePath = path.join(root, character.sourceFile || "");
  if (!character.id) failures.push({ code: "MISSING_CHARACTER_ID", likelyCause: "Manifest entry has no stable ID." });
  if (!character.sourceFile) failures.push({ code: "MISSING_SOURCE_PATH", likelyCause: "Manifest entry has no sourceFile." });
  else if (!fs.existsSync(sourcePath)) failures.push({ code: "MISSING_SOURCE_FILE", likelyCause: "Manifest sourceFile does not exist." });
  if (!character.nativeCanvas?.width || !character.nativeCanvas?.height) failures.push({ code: "INVALID_NATIVE_CANVAS", likelyCause: "nativeCanvas width/height are missing." });
  if (!character.exportBounds) failures.push({ code: "MISSING_EXPORT_BOUNDS", likelyCause: "No exportBounds declared." });
  if (character.sourceFile && !/\.(svg|png|webp)$/i.test(character.sourceFile)) failures.push({ code: "UNSUPPORTED_FORMAT", likelyCause: "Source is not SVG, PNG, or WebP." });
  return failures;
}

if (!fs.existsSync(manifestPath)) {
  console.error(`Missing canonical manifest: ${path.relative(root, manifestPath)}`);
  process.exit(1);
}

const manifest = readJson(manifestPath);
const characters = (manifest.assets || [])
  .filter((asset) => asset.type === "complete-face")
  .sort((a, b) => String(a.id).localeCompare(String(b.id)));

const effectsConfig = fs.existsSync(effectsPath)
  ? readJson(effectsPath)
  : {
      schemaVersion: 0,
      presets: [
        { id: "classic-paper", label: "Classic paper", dependencyPlaceholder: true },
        { id: "clean-studio", label: "Clean studio", dependencyPlaceholder: true },
        { id: "thermal-print", label: "Thermal print", dependencyPlaceholder: true },
        { id: "sticker", label: "Sticker", dependencyPlaceholder: true }
      ]
    };

const presets = [...(effectsConfig.presets || [])].sort((a, b) => String(a.id).localeCompare(String(b.id)));
const cases = [];
const failures = [];

for (const character of characters) {
  const characterFailures = validateCharacter(character);
  for (const failure of characterFailures) {
    failures.push({
      testId: stableId("character", character.id, failure.code),
      characterId: character.id || null,
      presetId: null,
      assetPath: character.sourceFile || null,
      ...failure
    });
  }

  cases.push({
    testId: stableId("default", character.id),
    characterId: character.id,
    characterLabel: character.label,
    presetId: null,
    presetLabel: "Default",
    seed: 0,
    action: "allow",
    assetPath: character.sourceFile,
    viewport: "full"
  });

  for (const preset of presets) {
    const action = expectedAction(character, preset);
    cases.push({
      testId: stableId("effect", character.id, preset.id),
      characterId: character.id,
      characterLabel: character.label,
      presetId: preset.id,
      presetLabel: preset.label,
      seed: 260801,
      action,
      assetPath: character.sourceFile,
      viewport: "full"
    });
    cases.push({
      testId: stableId("mobile", character.id, preset.id),
      characterId: character.id,
      characterLabel: character.label,
      presetId: preset.id,
      presetLabel: preset.label,
      seed: 260801,
      action,
      assetPath: character.sourceFile,
      viewport: "mobile-thumbnail"
    });
  }
}

const rows = cases.map((testCase) => {
  const blocked = testCase.action === "block";
  return `
    <article class="case ${blocked ? "is-blocked" : ""}" id="${escapeHtml(testCase.testId)}" data-character="${escapeHtml(testCase.characterId)}" data-preset="${escapeHtml(testCase.presetId || "default")}" data-seed="${testCase.seed}">
      <div class="art ${testCase.viewport === "mobile-thumbnail" ? "is-mobile" : ""}">
        ${blocked ? "<div class=\"blocked\">Blocked by compatibility rule</div>" : `<img src="../../${escapeHtml(testCase.assetPath)}" alt="" loading="lazy" />`}
      </div>
      <div class="meta">
        <strong>${escapeHtml(testCase.characterLabel)}</strong>
        <span>${escapeHtml(testCase.presetLabel)}</span>
        <code>${escapeHtml(testCase.testId)}</code>
        <small>${escapeHtml(testCase.action)} · seed ${testCase.seed}</small>
      </div>
    </article>`;
}).join("\n");

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Cute — Character × effect matrix</title>
  <style>
    * { box-sizing: border-box; }
    :root { font-family: Arial, Helvetica, sans-serif; color: #392a24; background: #efe7dc; }
    body { margin: 0; padding: 24px; }
    header { display: grid; gap: 8px; margin-bottom: 24px; }
    h1, p { margin: 0; }
    .summary { display: flex; flex-wrap: wrap; gap: 8px; font-size: 13px; }
    .summary span { border: 1px solid #cbbcae; border-radius: 999px; padding: 5px 9px; background: #fffaf3; }
    main { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 14px; }
    .case { min-width: 0; border: 1px solid #d6c7b8; border-radius: 18px; overflow: hidden; background: #fffaf3; }
    .art { aspect-ratio: 1; display: grid; place-items: center; padding: 12px; background: linear-gradient(135deg, #ffe6bd, #eadcff); }
    .art.is-mobile { max-height: 180px; }
    .art img { display: block; width: 100%; height: 100%; object-fit: contain; }
    .meta { display: grid; gap: 4px; padding: 11px 12px 13px; }
    .meta span, .meta small { color: #755f54; }
    code { overflow-wrap: anywhere; font-size: 10px; }
    .is-blocked { border-style: dashed; }
    .blocked { max-width: 150px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <header>
    <h1>Character × effect matrix</h1>
    <p>Deterministic review scaffold. Effect rendering is activated when #26 is merged into this branch.</p>
    <div class="summary">
      <span>${characters.length} characters</span>
      <span>${presets.length} presets</span>
      <span>${cases.length} cases</span>
      <span>${failures.length} structural failures</span>
    </div>
  </header>
  <main>${rows}</main>
</body>
</html>`;

const report = {
  schemaVersion: 1,
  generatedBy: "scripts/generate-character-effect-matrix.mjs",
  deterministicSeed: 260801,
  dependencies: {
    manifest: path.relative(root, manifestPath),
    effects: fs.existsSync(effectsPath) ? path.relative(root, effectsPath) : null,
    effectsPendingIssue: fs.existsSync(effectsPath) ? null : 26
  },
  counts: {
    characters: characters.length,
    presets: presets.length,
    cases: cases.length,
    failures: failures.length
  },
  cases,
  failures,
  manualReviewRequired: true
};

fs.mkdirSync(outputDirectory, { recursive: true });
fs.mkdirSync(reportDirectory, { recursive: true });
fs.writeFileSync(htmlPath, html);
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(`Wrote ${path.relative(root, htmlPath)} with ${cases.length} deterministic cases.`);
console.log(`Wrote ${path.relative(root, reportPath)} with ${failures.length} structural failures.`);
if (failures.length) process.exitCode = 1;
