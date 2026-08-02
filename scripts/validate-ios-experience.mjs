import fs from "node:fs";

const read = (relativePath) => fs.readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");

const runtime = read("ios-experience.js");
const styles = read("assets/ios-experience.css");
const adapter = read("assets/manifest-adapter.js");
const markup = read("index.html");
const docs = read("docs/IOS-EXPERIENCE.md");
const review = read("previews/ios-review.html");
const webmanifest = JSON.parse(read("site.webmanifest"));
const errors = [];

for (const meta of [
  'content="width=device-width, initial-scale=1.0, viewport-fit=cover"',
  'name="apple-mobile-web-app-capable"',
  'name="apple-mobile-web-app-status-bar-style"',
  'name="apple-mobile-web-app-title"',
  'name="format-detection"',
  'rel="apple-touch-icon"',
  'rel="manifest"'
]) {
  if (!markup.includes(meta)) errors.push(`index.html is missing ${meta}.`);
}

for (const attribute of ['autocapitalize="words"', 'autocorrect="off"', 'enterkeyhint="done"']) {
  if (!markup.includes(attribute)) errors.push(`The character name field is missing ${attribute}.`);
}

/* Pinch-to-zoom must never be disabled: it is the iOS magnification path. */
for (const forbidden of ["user-scalable=no", "maximum-scale=1"]) {
  if (markup.includes(forbidden)) errors.push(`index.html must not disable page zoom (${forbidden}).`);
}

for (const token of [
  "env(safe-area-inset-top",
  "env(safe-area-inset-bottom",
  "--ios-safe-left",
  "--ios-sticky-offset",
  "100dvh",
  "-webkit-text-size-adjust",
  "-webkit-backdrop-filter",
  "-webkit-overflow-scrolling",
  "-webkit-touch-callout",
  "touch-action: manipulation",
  "touch-action: pan-y",
  "@media (hover: none)",
  "@media (pointer: coarse)",
  "font-size: max(16px, 1rem)",
  "::-webkit-slider-thumb",
  ".ios-gesture-readout",
  ".ios-gesture-hint",
  ".ios-stage-return",
  ".ios-keyboard-open",
  "overscroll-behavior: contain",
  "background-attachment: local",
  "content-visibility: auto",
  "contain-intrinsic-size",
  "svh",
  "prefers-reduced-motion",
  "forced-colors: active"
]) {
  if (!styles.includes(token)) errors.push(`iOS stylesheet is missing ${token}.`);
}

for (const token of [
  "maxTouchPoints",
  "MacIntel",
  "display-mode: standalone",
  "visualViewport",
  "ios-keyboard-open",
  "ios-standalone",
  "--ios-sticky-offset",
  "navigator.canShare",
  "navigator.share",
  "new File(",
  "AbortError",
  "downloadBlob",
  "renderPngBlob",
  "makeFilename",
  "data-export-action",
  "stopImmediatePropagation",
  "setPointerCapture",
  "IntersectionObserver",
  "ios-stage-return",
  "prefers-reduced-motion",
  "pointerdown",
  "pointermove",
  "passive: false",
  "scaleControl",
  "rotationControl",
  "resetTransform",
  "CuteResponsiveA11y?.announce",
  "cute:ios-share-export",
  "cute:ios-experience-ready",
  "CuteIosExperience"
]) {
  if (!runtime.includes(token)) errors.push(`iOS runtime is missing ${token}.`);
}

if (!adapter.includes('loadStyle("assets/ios-experience.css")')) errors.push("iOS stylesheet is not loaded.");
if (!adapter.includes('loadScript("ios-experience.js")')) errors.push("iOS runtime is not loaded.");
if (adapter.indexOf('loadScript("ios-experience.js")') < adapter.indexOf('loadScript("export-menu.js")')) {
  errors.push("The iOS runtime must load after the export menu it enhances.");
}
/* The capture-phase share interception only wins if it is registered before the
   mixed-media and effects export interceptors. */
if (adapter.indexOf('loadScript("ios-experience.js")') > adapter.indexOf('loadScript("mixed-asset-export.js")')) {
  errors.push("The iOS runtime must load before the mixed-media export layer.");
}

if (webmanifest.display !== "standalone") errors.push("Web app manifest must declare a standalone display.");
if (!webmanifest.start_url) errors.push("Web app manifest must declare a start_url.");
if (!webmanifest.theme_color || !webmanifest.background_color) errors.push("Web app manifest must declare theme and background colors.");
for (const size of ["192x192", "512x512"]) {
  if (!webmanifest.icons?.some((icon) => icon.sizes === size)) errors.push(`Web app manifest is missing a ${size} icon.`);
}

for (const icon of ["assets/icons/apple-touch-icon-180.png", "assets/icons/icon-192.png", "assets/icons/icon-512.png"]) {
  const url = new URL(`../${icon}`, import.meta.url);
  if (!fs.existsSync(url)) {
    errors.push(`Home screen icon ${icon} is missing. Run node scripts/generate-ios-icons.mjs.`);
    continue;
  }
  const header = fs.readFileSync(url).subarray(0, 8);
  if (!header.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    errors.push(`Home screen icon ${icon} is not a PNG; iOS ignores every other format.`);
  }
}

for (const width of [375, 390, 393, 430, 744, 1024]) {
  if (!review.includes(`data-ios-width="${width}"`)) errors.push(`iOS review tool is missing the ${width}px device.`);
  if (!docs.includes(String(width))) errors.push(`iOS documentation is missing the ${width}px device.`);
}

for (const phrase of [
  "share sheet",
  "safe area",
  "double-tap",
  "software keyboard",
  "Add to Home Screen",
  "does not run a real browser"
]) {
  if (!docs.includes(phrase)) errors.push(`iOS documentation is missing ${phrase}.`);
}

try {
  new Function(runtime);
} catch (error) {
  errors.push(`iOS browser script has invalid syntax: ${error.message}`);
}

if (errors.length) {
  console.error(`iOS experience validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("iOS experience contract valid: safe areas, touch behaviour, stage gestures, share-sheet export, keyboard handling, and home screen install.");
