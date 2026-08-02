#!/usr/bin/env node
/* Deterministic home-screen icon generator.
   iOS only accepts PNG for `apple-touch-icon`, so the authored brand mark is
   rasterised here rather than shipped as an opaque binary nobody can review. */

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(root, "assets", "icons");
const SUPERSAMPLE = 3;

const ink = [0x2d, 0x27, 0x23];
const paper = [0xf6, 0xef, 0xe4];
const yellow = [0xf4, 0xc8, 0x4d];
const coral = [0xff, 0x78, 0x6b];

const targets = [
  { file: "apple-touch-icon-180.png", size: 180 },
  { file: "icon-192.png", size: 192 },
  { file: "icon-512.png", size: 512 }
];

function createSurface(size) {
  return { size, data: new Uint8Array(size * size * 3) };
}

function blend(surface, index, color, alpha) {
  for (let channel = 0; channel < 3; channel += 1) {
    const previous = surface.data[index + channel];
    surface.data[index + channel] = Math.round(previous + (color[channel] - previous) * alpha);
  }
}

function fill(surface, color) {
  for (let index = 0; index < surface.data.length; index += 3) blend(surface, index, color, 1);
}

function paint(surface, color, alpha, covers) {
  const { size } = surface;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const u = (x + 0.5) / size;
      const v = (y + 0.5) / size;
      if (!covers(u, v)) continue;
      blend(surface, (y * size + x) * 3, color, alpha);
    }
  }
}

function circle(surface, cx, cy, radius, color, alpha = 1) {
  paint(surface, color, alpha, (u, v) => Math.hypot(u - cx, v - cy) <= radius);
}

function ellipse(surface, cx, cy, rx, ry, color, alpha = 1) {
  paint(surface, color, alpha, (u, v) => ((u - cx) / rx) ** 2 + ((v - cy) / ry) ** 2 <= 1);
}

function triangle(surface, points, color, alpha = 1) {
  const [a, b, c] = points;
  const sign = (p, q, r) => (p[0] - r[0]) * (q[1] - r[1]) - (q[0] - r[0]) * (p[1] - r[1]);
  paint(surface, color, alpha, (u, v) => {
    const point = [u, v];
    const d1 = sign(point, a, b);
    const d2 = sign(point, b, c);
    const d3 = sign(point, c, a);
    const negative = d1 < 0 || d2 < 0 || d3 < 0;
    const positive = d1 > 0 || d2 > 0 || d3 > 0;
    return !(negative && positive);
  });
}

function insetTriangle(points, amount) {
  const cx = (points[0][0] + points[1][0] + points[2][0]) / 3;
  const cy = (points[0][1] + points[1][1] + points[2][1]) / 3;
  return points.map(([x, y]) => {
    const dx = x - cx;
    const dy = y - cy;
    const length = Math.hypot(dx, dy) || 1;
    return [x - (dx / length) * amount, y - (dy / length) * amount];
  });
}

function arc(surface, cx, cy, radius, halfWidth, startDegrees, endDegrees, color, alpha = 1) {
  paint(surface, color, alpha, (u, v) => {
    const dx = u - cx;
    const dy = v - cy;
    if (Math.abs(Math.hypot(dx, dy) - radius) > halfWidth) return false;
    const degrees = (Math.atan2(dy, dx) * 180) / Math.PI;
    return degrees >= startDegrees && degrees <= endDegrees;
  });
}

function drawFace(surface) {
  fill(surface, paper);

  const outline = 0.028;
  const leftEar = [[0.235, 0.435], [0.305, 0.115], [0.475, 0.36]];
  const rightEar = [[0.765, 0.435], [0.695, 0.115], [0.525, 0.36]];

  for (const ear of [leftEar, rightEar]) {
    triangle(surface, ear, ink);
    triangle(surface, insetTriangle(ear, outline), yellow);
    triangle(surface, insetTriangle(ear, outline * 3.6), coral, 0.85);
  }

  circle(surface, 0.5, 0.565, 0.305, ink);
  circle(surface, 0.5, 0.565, 0.305 - outline, yellow);

  circle(surface, 0.315, 0.645, 0.052, coral, 0.8);
  circle(surface, 0.685, 0.645, 0.052, coral, 0.8);

  ellipse(surface, 0.405, 0.545, 0.036, 0.05, ink);
  ellipse(surface, 0.595, 0.545, 0.036, 0.05, ink);
  ellipse(surface, 0.4175, 0.527, 0.012, 0.016, paper);
  ellipse(surface, 0.6075, 0.527, 0.012, 0.016, paper);

  ellipse(surface, 0.5, 0.625, 0.028, 0.02, ink);
  arc(surface, 0.5, 0.615, 0.072, 0.011, 35, 145, ink);
}

function downsample(surface, size) {
  const result = createSurface(size);
  const factor = SUPERSAMPLE;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const totals = [0, 0, 0];
      for (let sy = 0; sy < factor; sy += 1) {
        for (let sx = 0; sx < factor; sx += 1) {
          const index = ((y * factor + sy) * surface.size + (x * factor + sx)) * 3;
          totals[0] += surface.data[index];
          totals[1] += surface.data[index + 1];
          totals[2] += surface.data[index + 2];
        }
      }
      const target = (y * size + x) * 3;
      const samples = factor * factor;
      result.data[target] = Math.round(totals[0] / samples);
      result.data[target + 1] = Math.round(totals[1] / samples);
      result.data[target + 2] = Math.round(totals[2] / samples);
    }
  }
  return result;
}

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, body) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(body.length, 0);
  const typed = Buffer.concat([Buffer.from(type, "ascii"), body]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typed), 0);
  return Buffer.concat([length, typed, crc]);
}

function encodePng(surface) {
  const { size, data } = surface;
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 2; // truecolour
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y += 1) {
    const rowStart = y * (size * 3 + 1);
    raw[rowStart] = 0; // no filter
    Buffer.from(data.buffer, y * size * 3, size * 3).copy(raw, rowStart + 1);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

fs.mkdirSync(outputDir, { recursive: true });

const written = targets.map(({ file, size }) => {
  const surface = createSurface(size * SUPERSAMPLE);
  drawFace(surface);
  const png = encodePng(downsample(surface, size));
  fs.writeFileSync(path.join(outputDir, file), png);
  return { file, size, bytes: png.length };
});

console.log(JSON.stringify({ output: path.relative(root, outputDir), icons: written }, null, 2));
