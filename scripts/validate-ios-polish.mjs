import fs from "node:fs";

const read = (relativePath) => fs.readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");
const mobile = read("mobile-ios.css");
const polish = read("ios-polish.css");
const runtime = read("ios-experience.js");
const markup = read("index.html");
const errors = [];

const requireToken = (source, token, label) => {
  if (!source.includes(token)) errors.push(`${label} is missing ${token}.`);
};

// iPhone-first viewport and safe-area contract.
requireToken(markup, "viewport-fit=cover", "index.html");
requireToken(mobile, "@media (max-width: 520px)", "mobile-ios.css");
requireToken(mobile, "overflow-x: hidden", "mobile-ios.css");
requireToken(mobile, "env(safe-area-inset-top)", "mobile-ios.css");
requireToken(mobile, "env(safe-area-inset-bottom)", "mobile-ios.css");
requireToken(polish, "--ios-home-clearance", "ios-polish.css");
requireToken(polish, "100dvh", "ios-polish.css");
requireToken(polish, "@media (max-width: 390px)", "ios-polish.css");

// 44pt-class touch target contract for primary mobile controls.
for (const selector of [
  ".header-actions .button",
  ".stage-actions .stage-btn",
  ".mode-tab",
  ".category-button",
  ".pill-button",
  ".toggle-label",
  ".text-input",
  'input[type="range"]'
]) requireToken(polish, selector, "ios-polish.css");
requireToken(polish, "min-height: 44px", "ios-polish.css");
requireToken(mobile, "font-size: 16px", "mobile-ios.css");

// Thumb-scannable horizontal rails must snap without trapping vertical scroll.
for (const token of [
  "scroll-snap-type: x proximity",
  "scroll-snap-type: x mandatory",
  "scroll-snap-align: start",
  "scroll-snap-stop: normal",
  "overscroll-behavior-inline: contain",
  "-webkit-overflow-scrolling: touch",
  "touch-action: pan-x pan-y",
  "scroll-padding-inline: var(--ios-rail-gutter)"
]) requireToken(polish, token, "ios-polish.css");

// Keyboard and dynamic viewport behavior must demote the sticky CTA while typing.
for (const token of [
  "visualViewport",
  "ios-keyboard-open",
  "--ios-viewport-height"
]) requireToken(runtime, token, "ios-experience.js");
for (const token of [
  ".ios-keyboard-open .controls-panel .button-full",
  "position: static",
  ".text-input:focus",
  "scroll-margin-bottom: 120px"
]) requireToken(polish, token, "ios-polish.css");

// Home-indicator clearance, accessibility focus, and reduced-motion contract.
for (const token of [
  "bottom: calc(8px + var(--ios-home-clearance))",
  ".saved-card:focus-visible",
  "outline: 3px solid",
  "prefers-reduced-motion: reduce",
  "transition: none !important",
  "scroll-behavior: auto"
]) requireToken(polish, token, "ios-polish.css");

// Existing iOS gestures and native PNG share path must remain wired.
for (const token of [
  "navigator.share",
  "navigator.canShare",
  "setPointerCapture",
  "pointerdown",
  "pointermove",
  "scaleControl",
  "rotationControl",
  "resetTransform"
]) requireToken(runtime, token, "ios-experience.js");

if (errors.length) {
  console.error(`iOS polish validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("iOS polish contract valid: iPhone widths, touch targets, rails, safe areas, keyboard handling, accessibility, gestures, and share export.");
