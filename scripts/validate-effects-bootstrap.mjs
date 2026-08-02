import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bootstrapPath = path.join(root, "assets", "manifest-adapter.js");
const reportPath = path.join(root, "review-artifacts", "effects-bootstrap-validation.json");
const source = await readFile(bootstrapPath, "utf8");
const failures = [];

const requiredFiles = [
  "assets/effects.css",
  "effects.js",
  "effects-controller.js",
  "effects-export-integration.js"
];

for (const relativePath of requiredFiles) {
  try {
    await access(path.join(root, relativePath));
  } catch {
    failures.push({
      code: "missing-runtime-file",
      subject: relativePath,
      message: `Required effects runtime file is missing: ${relativePath}`
    });
  }
}

function countLiteral(literal) {
  return source.split(literal).length - 1;
}

function requireExactlyOnce(literal, subject) {
  const count = countLiteral(literal);
  if (count !== 1) {
    failures.push({
      code: "bootstrap-reference-count",
      subject,
      expected: 1,
      actual: count,
      message: `${subject} must appear exactly once in the production bootstrap.`
    });
  }
}

requireExactlyOnce('loadStyle("assets/effects.css")', "assets/effects.css");
requireExactlyOnce('loadScript("effects.js")', "effects.js");
requireExactlyOnce('loadScript("effects-controller.js")', "effects-controller.js");
requireExactlyOnce('loadScript("effects-export-integration.js")', "effects-export-integration.js");

const order = [
  "art-direction-bootstrap.js",
  "effects.js",
  "effects-controller.js",
  "export-menu.js",
  "mixed-asset-export.js",
  "effects-export-integration.js"
];

const positions = Object.fromEntries(order.map((name) => [name, source.indexOf(name)]));
for (const name of order) {
  if (positions[name] < 0) {
    failures.push({
      code: "missing-bootstrap-step",
      subject: name,
      message: `Bootstrap step is missing: ${name}`
    });
  }
}

const requiredOrder = [
  ["art-direction-bootstrap.js", "effects.js"],
  ["effects.js", "effects-controller.js"],
  ["effects-controller.js", "effects-export-integration.js"],
  ["export-menu.js", "effects-export-integration.js"],
  ["mixed-asset-export.js", "effects-export-integration.js"]
];

for (const [before, after] of requiredOrder) {
  if (positions[before] >= 0 && positions[after] >= 0 && positions[before] >= positions[after]) {
    failures.push({
      code: "invalid-bootstrap-order",
      subject: `${before} -> ${after}`,
      message: `${before} must load before ${after}.`
    });
  }
}

const requiredContracts = [
  ["global.CuteEffectsController?.ready", "controller readiness wait"],
  ["cute:effects-bootstrap-ready", "effects-ready event"],
  ["cute:effects-bootstrap-error", "recoverable effects-error event"],
  ["effectsAvailable", "creative-controls availability detail"],
  ["Promise.all([coreReady, effectsReady])", "combined readiness boundary"]
];

for (const [needle, subject] of requiredContracts) {
  if (!source.includes(needle)) {
    failures.push({
      code: "missing-bootstrap-contract",
      subject,
      message: `Production bootstrap is missing the ${subject}.`
    });
  }
}

const report = {
  format: "cute-effects-bootstrap-validation",
  version: 1,
  deterministic: true,
  bootstrap: "assets/manifest-adapter.js",
  requiredFiles,
  checks: {
    requiredFileCount: requiredFiles.length,
    requiredOrderCount: requiredOrder.length,
    requiredContractCount: requiredContracts.length
  },
  passed: failures.length === 0,
  failures
};

await mkdir(path.dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (failures.length) {
  console.error(`Effects bootstrap validation failed with ${failures.length} issue(s).`);
  for (const failure of failures) console.error(`- [${failure.code}] ${failure.message}`);
  process.exitCode = 1;
} else {
  console.log("Effects bootstrap validation passed.");
  console.log(`Validated ${requiredFiles.length} runtime files and ${requiredOrder.length} dependency-order rules.`);
}
