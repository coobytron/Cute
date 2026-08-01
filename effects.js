(() => {
  "use strict";

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

  function hashSeed(input) {
    const text = String(input ?? 0);
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function createRandom(seed) {
    let state = hashSeed(seed) || 0x9e3779b9;
    return () => {
      state += 0x6d2b79f5;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function cloneCanvas(source) {
    const output = document.createElement("canvas");
    output.width = source.width;
    output.height = source.height;
    output.getContext("2d").drawImage(source, 0, 0);
    return output;
  }

  function getIntensity(effect) {
    return clamp(Number(effect.intensity ?? effect.defaults?.intensity ?? 0));
  }

  function paperGrain(canvas, effect, random) {
    const intensity = getIntensity(effect);
    if (!intensity) return;
    const ctx = canvas.getContext("2d");
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const amount = 32 * intensity;
    for (let index = 0; index < image.data.length; index += 4) {
      const noise = (random() - 0.5) * amount;
      image.data[index] = clamp(image.data[index] + noise, 0, 255);
      image.data[index + 1] = clamp(image.data[index + 1] + noise, 0, 255);
      image.data[index + 2] = clamp(image.data[index + 2] + noise, 0, 255);
    }
    ctx.putImageData(image, 0, 0);
  }

  function halftone(canvas, effect) {
    const intensity = getIntensity(effect);
    if (!intensity) return;
    const spacing = Math.max(5, Number(effect.spacing) || 10);
    const dotSize = Math.max(1, Number(effect.dotSize) || 4);
    const ctx = canvas.getContext("2d");
    ctx.save();
    ctx.globalAlpha = 0.28 * intensity;
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = "#3b2c2a";
    for (let y = spacing / 2; y < canvas.height; y += spacing) {
      for (let x = spacing / 2; x < canvas.width; x += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, dotSize * intensity, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function plushFibers(canvas, effect, random) {
    const intensity = getIntensity(effect);
    if (!intensity) return;
    const ctx = canvas.getContext("2d");
    const length = Math.max(2, Number(effect.length) || 7);
    const count = Math.round((canvas.width * canvas.height / 2600) * intensity);
    ctx.save();
    ctx.globalCompositeOperation = "soft-light";
    ctx.globalAlpha = 0.18 + intensity * 0.22;
    ctx.strokeStyle = "#fff7ed";
    ctx.lineWidth = Math.max(0.6, canvas.width / 1400);
    for (let index = 0; index < count; index += 1) {
      const x = random() * canvas.width;
      const y = random() * canvas.height;
      const angle = (random() - 0.5) * 0.8;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.sin(angle) * length, y - Math.cos(angle) * length);
      ctx.stroke();
    }
    ctx.restore();
  }

  function blushBloom(canvas, effect) {
    const intensity = getIntensity(effect);
    if (!intensity) return;
    const ctx = canvas.getContext("2d");
    const radius = (Number(effect.radius) || 90) * (canvas.width / 1000);
    const cheeks = [0.34, 0.66];
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (const xRatio of cheeks) {
      const gradient = ctx.createRadialGradient(canvas.width * xRatio, canvas.height * 0.62, 0, canvas.width * xRatio, canvas.height * 0.62, radius);
      gradient.addColorStop(0, `rgba(255, 104, 128, ${0.42 * intensity})`);
      gradient.addColorStop(1, "rgba(255, 104, 128, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.restore();
  }

  function rimLight(canvas, effect) {
    const intensity = getIntensity(effect);
    if (!intensity) return;
    const source = cloneCanvas(canvas);
    const ctx = canvas.getContext("2d");
    const width = Math.max(1, (Number(effect.width) || 12) * canvas.width / 1000);
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.32 * intensity;
    ctx.filter = `blur(${width}px)`;
    ctx.drawImage(source, -width * 0.65, -width * 0.65);
    ctx.filter = "none";
    ctx.restore();
  }

  function stickerEdge(canvas, effect) {
    const intensity = getIntensity(effect);
    if (!intensity) return;
    const source = cloneCanvas(canvas);
    const ctx = canvas.getContext("2d");
    const width = Math.max(2, (Number(effect.width) || 14) * canvas.width / 1000);
    const offsets = [
      [-width, 0], [width, 0], [0, -width], [0, width],
      [-width * 0.7, -width * 0.7], [width * 0.7, -width * 0.7],
      [-width * 0.7, width * 0.7], [width * 0.7, width * 0.7]
    ];
    const edge = document.createElement("canvas");
    edge.width = canvas.width;
    edge.height = canvas.height;
    const edgeCtx = edge.getContext("2d");
    edgeCtx.globalAlpha = 0.92 * intensity;
    for (const [x, y] of offsets) edgeCtx.drawImage(source, x, y);
    edgeCtx.globalCompositeOperation = "source-in";
    edgeCtx.fillStyle = "#fffdf8";
    edgeCtx.fillRect(0, 0, edge.width, edge.height);
    edgeCtx.globalCompositeOperation = "destination-out";
    edgeCtx.drawImage(source, 0, 0);
    ctx.save();
    ctx.globalCompositeOperation = "destination-over";
    ctx.shadowColor = `rgba(62, 42, 35, ${clamp(Number(effect.shadow) || 0.16)})`;
    ctx.shadowBlur = width * 0.9;
    ctx.shadowOffsetY = width * 0.45;
    ctx.drawImage(edge, 0, 0);
    ctx.restore();
  }

  function chromaticOffset(canvas, effect) {
    const intensity = getIntensity(effect);
    if (!intensity) return;
    const source = cloneCanvas(canvas);
    const distance = Math.max(1, (Number(effect.distance) || 4) * canvas.width / 1000 * intensity);
    const ctx = canvas.getContext("2d");
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.24 * intensity;
    ctx.filter = "sepia(1) saturate(8) hue-rotate(300deg)";
    ctx.drawImage(source, -distance, 0);
    ctx.filter = "sepia(1) saturate(8) hue-rotate(145deg)";
    ctx.drawImage(source, distance, 0);
    ctx.filter = "none";
    ctx.restore();
  }

  function sparkleField(canvas, effect, random, particleLimit = 84) {
    const intensity = getIntensity(effect);
    if (!intensity) return;
    const requested = Math.round(Number(effect.count) || 48);
    const count = Math.min(particleLimit, Math.max(1, Math.round(requested * intensity)));
    const ctx = canvas.getContext("2d");
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = "rgba(255,255,255,.9)";
    for (let index = 0; index < count; index += 1) {
      const x = random() * canvas.width;
      const y = random() * canvas.height;
      const radius = (1.5 + random() * 4.5) * (canvas.width / 1000);
      ctx.globalAlpha = 0.28 + random() * 0.55;
      ctx.beginPath();
      ctx.moveTo(x, y - radius * 2.1);
      ctx.lineTo(x + radius * 0.55, y - radius * 0.55);
      ctx.lineTo(x + radius * 2.1, y);
      ctx.lineTo(x + radius * 0.55, y + radius * 0.55);
      ctx.lineTo(x, y + radius * 2.1);
      ctx.lineTo(x - radius * 0.55, y + radius * 0.55);
      ctx.lineTo(x - radius * 2.1, y);
      ctx.lineTo(x - radius * 0.55, y - radius * 0.55);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function pixelDither(canvas, effect) {
    const intensity = getIntensity(effect);
    if (!intensity) return;
    const ctx = canvas.getContext("2d");
    const pixelSize = Math.max(2, Math.round((Number(effect.pixelSize) || 5) * intensity));
    const small = document.createElement("canvas");
    small.width = Math.max(1, Math.round(canvas.width / pixelSize));
    small.height = Math.max(1, Math.round(canvas.height / pixelSize));
    const smallCtx = small.getContext("2d");
    smallCtx.imageSmoothingEnabled = false;
    smallCtx.drawImage(canvas, 0, 0, small.width, small.height);
    const data = smallCtx.getImageData(0, 0, small.width, small.height);
    const levels = Math.max(2, Number(effect.levels) || 5);
    const step = 255 / (levels - 1);
    for (let index = 0; index < data.data.length; index += 4) {
      data.data[index] = Math.round(data.data[index] / step) * step;
      data.data[index + 1] = Math.round(data.data[index + 1] / step) * step;
      data.data[index + 2] = Math.round(data.data[index + 2] / step) * step;
    }
    smallCtx.putImageData(data, 0, 0);
    ctx.save();
    ctx.globalAlpha = 0.35 + intensity * 0.65;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(small, 0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  function vignette(canvas, effect) {
    const intensity = getIntensity(effect);
    if (!intensity) return;
    const ctx = canvas.getContext("2d");
    const radius = clamp(Number(effect.radius) || 0.72, 0.2, 1.2);
    const gradient = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, canvas.width * 0.1, canvas.width / 2, canvas.height / 2, canvas.width * radius);
    gradient.addColorStop(0, "rgba(55, 34, 30, 0)");
    gradient.addColorStop(1, `rgba(55, 34, 30, ${0.42 * intensity})`);
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  function dreamHalo(canvas, effect) {
    const intensity = getIntensity(effect);
    if (!intensity) return;
    const ctx = canvas.getContext("2d");
    const radius = canvas.width * clamp(Number(effect.radius) || 0.46, 0.2, 0.8);
    const gradient = ctx.createRadialGradient(canvas.width / 2, canvas.height * 0.48, 0, canvas.width / 2, canvas.height * 0.48, radius);
    gradient.addColorStop(0, `rgba(255, 241, 178, ${0.52 * intensity})`);
    gradient.addColorStop(0.5, `rgba(213, 194, 255, ${0.24 * intensity})`);
    gradient.addColorStop(1, "rgba(213, 194, 255, 0)");
    ctx.save();
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  function floatingParticles(canvas, effect, random, particleLimit = 84) {
    const intensity = getIntensity(effect);
    if (!intensity) return;
    const count = Math.min(particleLimit, Math.round((Number(effect.count) || 42) * intensity));
    const ctx = canvas.getContext("2d");
    ctx.save();
    for (let index = 0; index < count; index += 1) {
      const x = random() * canvas.width;
      const y = random() * canvas.height;
      const radius = (2 + random() * 8) * canvas.width / 1000;
      ctx.globalAlpha = 0.12 + random() * 0.35;
      ctx.fillStyle = random() > 0.5 ? "#fff0a8" : "#f5ccff";
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  const handlers = {
    "paper-grain": paperGrain,
    halftone,
    "plush-fibers": plushFibers,
    "blush-bloom": blushBloom,
    "rim-light": rimLight,
    "sticker-edge": stickerEdge,
    "chromatic-offset": chromaticOffset,
    "sparkle-field": sparkleField,
    "pixel-dither": pixelDither,
    vignette,
    "dream-halo": dreamHalo,
    "floating-particles": floatingParticles
  };

  function resolvePreset(config, presetId, overrides = {}) {
    const preset = config.presets.find((item) => item.id === presetId);
    if (!preset) throw new Error(`Unknown effects preset: ${presetId}`);
    const definitions = new Map(config.effects.map((effect) => [effect.id, effect]));
    return preset.effects.map((entry) => ({
      ...definitions.get(entry.id),
      ...entry,
      ...(overrides[entry.id] || {})
    }));
  }

  function apply(canvas, effects, options = {}) {
    if (!(canvas instanceof HTMLCanvasElement)) throw new TypeError("CuteEffects.apply requires an HTMLCanvasElement.");
    const random = createRandom(options.seed ?? 260801);
    const particleLimit = Number(options.particleLimit) || 84;
    for (const effect of effects) {
      const handler = handlers[effect.id];
      if (handler) handler(canvas, effect, random, particleLimit);
    }
    return canvas;
  }

  async function loadConfig(url = "assets/effects-presets.json") {
    const response = await fetch(url, { cache: "no-cache" });
    if (!response.ok) throw new Error(`Could not load effects config (${response.status}).`);
    return response.json();
  }

  window.CuteEffects = Object.freeze({
    version: 1,
    createRandom,
    loadConfig,
    resolvePreset,
    apply,
    reset: () => ({ presetId: null, seed: 260801, overrides: {} })
  });
})();
