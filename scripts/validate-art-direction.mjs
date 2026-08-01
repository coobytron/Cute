import fs from "node:fs";

const root = new URL("../", import.meta.url);
const read = (path) => fs.readFileSync(new URL(path, root), "utf8");
const source = read("art-direction.js");
const styles = read("assets/art-direction.css");
const review = read("previews/contact-sheets/art-direction-finishes.html");
const docs = read("docs/ART-DIRECTION.md");
const errors = [];

const requiredFinishes = ["classic-paper", "clean-studio", "thermal-print", "sticker"];
const requiredBackgrounds = ["apricot-day", "cream-paper", "mint-tea", "powder-sky", "lavender-dream"];
const requiredFrames = ["none", "soft-rounded", "postage"];
const requiredExpressions = ["happy", "sleepy", "surprised"];

for (const id of requiredFinishes) {
  if (!source.includes(id)) errors.push(`Missing finish state ${id}.`);
  if (!styles.includes(`[data-art-finish="${id}"]`)) errors.push(`Missing editor treatment for ${id}.`);
}

for (const id of requiredBackgrounds) {
  if (!source.includes(id)) errors.push(`Missing background state ${id}.`);
}

for (const id of requiredFrames) {
  if (!source.includes(id)) errors.push(`Missing frame state ${id}.`);
}

for (const id of requiredExpressions) {
  if (!source.includes(`${id}:`)) errors.push(`Missing expression mapping ${id}.`);
}

for (const api of ["getState", "restore", "buildExportSvg", "renderPngBlob", "exportPng"]) {
  if (!source.includes(api)) errors.push(`Missing CuteArtDirection API member ${api}.`);
}

for (const width of [384, 576]) {
  if (!review.includes(String(width))) errors.push(`Finish review is missing the ${width} px thermal target.`);
  if (!docs.includes(String(width))) errors.push(`Documentation is missing the ${width} px thermal target.`);
}

if (!source.includes("cute:art-direction-change")) errors.push("Missing art-direction state event.");
if (!source.includes("transparentExport")) errors.push("Missing transparent export state.");
if (!source.includes("artThermal") || !source.includes("artSticker")) errors.push("Missing authored export filters.");

if (errors.length) {
  console.error(`Art-direction validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Art-direction contract valid: 4 finishes, 5 backgrounds, 3 frames, 3 expressions.");
