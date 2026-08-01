import fs from "node:fs";

const runtime = fs.readFileSync(new URL("../responsive-a11y.js", import.meta.url), "utf8");
const styles = fs.readFileSync(new URL("../assets/responsive-a11y.css", import.meta.url), "utf8");
const adapter = fs.readFileSync(new URL("../assets/manifest-adapter.js", import.meta.url), "utf8");
const docs = fs.readFileSync(new URL("../docs/RESPONSIVE-A11Y.md", import.meta.url), "utf8");
const review = fs.readFileSync(new URL("../previews/responsive-review.html", import.meta.url), "utf8");
const errors = [];

for (const width of [1600, 1280, 1024, 768, 390]) {
  if (!docs.includes(String(width))) errors.push(`Responsive documentation is missing ${width}px review.`);
  if (!review.includes(`data-width="${width}"`)) errors.push(`Responsive review tool is missing ${width}px viewport.`);
}

for (const breakpoint of [1360, 1180, 900, 760, 480]) {
  if (!styles.includes(`max-width: ${breakpoint}px`)) errors.push(`Responsive stylesheet is missing ${breakpoint}px breakpoint.`);
}

for (const token of [
  ".skip-link",
  ".mobile-panel-nav",
  ".workspace.mobile-panel-assets",
  ".workspace.mobile-panel-direction",
  "min-height: 44px",
  "overflow-x: clip",
  "prefers-reduced-motion",
  "forced-colors: active",
  "scroll-snap-type"
]) {
  if (!styles.includes(token)) errors.push(`Responsive stylesheet is missing ${token}.`);
}

for (const token of [
  "Skip to current character",
  'role", "region',
  'role", "tablist',
  'role", "tab',
  "aria-selected",
  "aria-valuetext",
  "aria-live",
  "aria-hidden",
  ".inert",
  "ArrowLeft",
  "ArrowRight",
  "Home",
  "End",
  "cute:variation-saved",
  "cute:export-error",
  "CuteResponsiveA11y"
]) {
  if (!runtime.includes(token)) errors.push(`Responsive accessibility runtime is missing ${token}.`);
}

if (!adapter.includes('loadStyle("assets/responsive-a11y.css")')) errors.push("Responsive accessibility stylesheet is not loaded.");
if (!adapter.includes('loadScript("responsive-a11y.js")')) errors.push("Responsive accessibility runtime is not loaded.");
if (adapter.indexOf('loadScript("responsive-a11y.js")') < adapter.indexOf('loadScript("export-menu.js")')) {
  errors.push("Responsive accessibility must load after the interactive controls it annotates.");
}

for (const phrase of ["200%", "VoiceOver", "forced-colors", "hidden mobile panel", "does not claim live Safari"]) {
  if (!docs.includes(phrase)) errors.push(`Responsive accessibility documentation is missing ${phrase}.`);
}

try {
  new Function(runtime);
} catch (error) {
  errors.push(`Responsive accessibility browser script has invalid syntax: ${error.message}`);
}

if (errors.length) {
  console.error(`Responsive accessibility validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Responsive accessibility contract valid: five review widths, mobile panels, focus semantics, reduced motion, and forced colors.");
