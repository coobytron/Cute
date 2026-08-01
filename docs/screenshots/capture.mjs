#!/usr/bin/env node
/**
 * Deterministic screenshot capture script for canonical desktop viewports.
 * Run from the repository root after `npx serve . -p 4000`.
 *
 * Usage:
 *   node docs/screenshots/capture.mjs
 *
 * Prerequisites:
 *   npx playwright install chromium
 */

import { chromium } from "playwright";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.CUTE_BASE_URL ?? "http://localhost:4000";

const VIEWPORTS = [
  { width: 1440, height: 900, label: "1440x900" },
  { width: 1600, height: 1000, label: "1600x1000" }
];

const browser = await chromium.launch();

for (const { width, height, label } of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  // Allow the face rendering to settle.
  await page.waitForTimeout(600);
  const outputPath = path.join(__dirname, `shell-${label}.png`);
  await page.screenshot({ path: outputPath, fullPage: false });
  console.log(`Saved ${outputPath}`);
  await page.close();
}

await browser.close();
console.log("Done.");
