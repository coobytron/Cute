(function installCuteEffectsController(global) {
  "use strict";

  const ENGINE = global.CuteEffects;
  const CONFIG_URL = "assets/effects-presets.json";
  const STATE_VERSION = 1;
  const DEFAULTS = Object.freeze({
    schemaVersion: STATE_VERSION,
    enabled: true,
    presetId: "soft-plush",
    intensity: 0.7,
    seed: 260801,
    performanceTier: "auto"
  });
  const presetVisuals = Object.freeze({
    "soft-plush": { description: "Fuzzy fibers, gentle blush, and soft depth.", colors: ["#f4d7c6", "#fff8ea"] },
    "candy-gloss": { description: "Bright highlights, blush bloom, and sparkle.", colors: ["#ff8fb5", "#ffe7f0"] },
    "riso-friend": { description: "Halftone, paper grain, and playful channel drift.", colors: ["#ff675d", "#55b8c8"] },
    "paper-sticker": { description: "A white cut edge, shadow, and tactile paper.", colors: ["#fffdf7", "#f0c86e"] },
    "dream-glow": { description: "Pastel halo, particles, and a soft rim light.", colors: ["#cdbef8", "#ffe1ef"] },
    "pixel-pet": { description: "Chunky color steps with a deterministic dither.", colors: ["#8ed8c5", "#514b87"] }
  });

  const stage = document.getElementById("stage");
  const faceCanvas = document.getElementById("faceCanvas");
  let config = null;
  let state = { ...DEFAULTS };
  let renderToken = 0;
  let renderTimer = null;

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function clamp(value, min = 0, max = 1) {
    return Math.min(max, Math.max(min, Number(value)));
  }

  function normalizeSeed(value) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? Math.abs(parsed) % 2147483647 : DEFAULTS.seed;
  }

  function getTierId() {
    if (state.performanceTier !== "auto") return state.performanceTier;
    const small = global.matchMedia?.("(max-width: 540px)")?.matches;
    const reduced = global.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const lowMemory = Number(global.navigator?.deviceMemory || 8) <= 4;
    return small || reduced || lowMemory ? "compact" : "standard";
  }

  function getTier() {
    const id = getTierId();
    return { id, ...(config?.performanceTiers?.[id] || config?.performanceTiers?.standard || {}) };
  }

  function currentEffects(options = {}) {
    if (!config || !state.enabled) return [];
    const transparent = Boolean(options.transparent);
    return ENGINE.resolvePreset(config, state.presetId).filter((effect) => {
      const definition = config.effects.find((item) => item.id === effect.id);
      return !(transparent && definition?.target === "background");
    }).map((effect) => ({
      ...effect,
      intensity: clamp(Number(effect.intensity ?? effect.defaults?.intensity ?? 0) * state.intensity)
    }));
  }

  function ensurePreviewCanvas() {
    if (!stage) return null;
    let canvas = document.getElementById("cuteEffectsPreview");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "cuteEffectsPreview";
      canvas.setAttribute("aria-hidden", "true");
      faceCanvas?.insertAdjacentElement("afterend", canvas);
    }
    return canvas;
  }

  function sourceSvg() {
    const source = global.CuteArtDirection?.buildExportSvg?.();
    if (source) return source;
    if (!faceCanvas) throw new Error("The Cute face SVG is unavailable.");
    const svg = faceCanvas.cloneNode(true);
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    return new XMLSerializer().serializeToString(svg);
  }

  function svgToImage(source) {
    return new Promise((resolve, reject) => {
      const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const image = new Image();
      image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
      image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("The effects preview could not rasterize the authored SVG.")); };
      image.src = url;
    });
  }

  async function renderPreview() {
    const token = ++renderToken;
    const canvas = ensurePreviewCanvas();
    if (!canvas || !stage) return;
    stage.classList.toggle("has-cute-effects-preview", state.enabled);
    if (!state.enabled) {
      canvas.hidden = true;
      return;
    }

    const tier = getTier();
    const size = Math.max(420, Math.round(1000 * Number(tier.textureScale || 1)));
    const transparent = Boolean(document.getElementById("transparentBgToggle")?.checked);
    const image = await svgToImage(sourceSvg());
    if (token !== renderToken) return;

    canvas.hidden = false;
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Canvas rendering is unavailable for effects preview.");
    context.clearRect(0, 0, size, size);
    context.drawImage(image, 0, 0, size, size);
    ENGINE.apply(canvas, currentEffects({ transparent }), {
      seed: state.seed,
      particleLimit: Number(tier.particleLimit || 84)
    });
    canvas.dataset.presetId = state.presetId;
    canvas.dataset.seed = String(state.seed);
    canvas.dataset.performanceTier = tier.id;
    global.dispatchEvent(new CustomEvent("cute:effects-preview-rendered", { detail: getState() }));
  }

  function scheduleRender() {
    if (renderTimer != null) global.clearTimeout(renderTimer);
    renderTimer = global.setTimeout(() => {
      renderTimer = null;
      renderPreview().catch((error) => {
        console.error(error);
        global.dispatchEvent(new CustomEvent("cute:effects-error", { detail: error }));
      });
    }, 32);
  }

  function getState() {
    return clone(state);
  }

  function emitChange() {
    scheduleRender();
    global.dispatchEvent(new CustomEvent("cute:effects-change", { detail: getState() }));
  }

  function restore(next, options = {}) {
    if (!next || typeof next !== "object") throw new TypeError("Effects state is required.");
    const presetId = config?.presets?.some((preset) => preset.id === next.presetId)
      ? next.presetId
      : config?.presets?.[0]?.id || DEFAULTS.presetId;
    const tier = ["auto", "compact", "standard", "high"].includes(next.performanceTier)
      ? next.performanceTier
      : DEFAULTS.performanceTier;
    state = {
      schemaVersion: STATE_VERSION,
      enabled: next.enabled !== false,
      presetId,
      intensity: clamp(next.intensity ?? DEFAULTS.intensity),
      seed: normalizeSeed(next.seed ?? config?.defaultSeed ?? DEFAULTS.seed),
      performanceTier: tier
    };
    if (options.silent) scheduleRender();
    else emitChange();
    return getState();
  }

  function setPreset(presetId) {
    if (!config?.presets?.some((preset) => preset.id === presetId)) throw new RangeError(`Unknown effects preset: ${presetId}`);
    state.presetId = presetId;
    state.enabled = true;
    emitChange();
  }

  function setIntensity(value) {
    state.intensity = clamp(value);
    emitChange();
  }

  function setSeed(value) {
    state.seed = normalizeSeed(value);
    emitChange();
  }

  function randomizeSeed() {
    const value = global.crypto?.getRandomValues
      ? global.crypto.getRandomValues(new Uint32Array(1))[0]
      : Math.floor(Math.random() * 2147483647);
    setSeed(value);
    return state.seed;
  }

  function setEnabled(value) {
    state.enabled = Boolean(value);
    emitChange();
  }

  function setPerformanceTier(value) {
    if (!["auto", "compact", "standard", "high"].includes(value)) throw new RangeError(`Unknown effects tier: ${value}`);
    state.performanceTier = value;
    emitChange();
  }

  function reset() {
    return restore({ ...DEFAULTS, seed: config?.defaultSeed ?? DEFAULTS.seed });
  }

  function serialize() {
    return JSON.stringify({ format: "cute-effects-state", version: STATE_VERSION, state: getState() });
  }

  function deserialize(source) {
    const document = typeof source === "string" ? JSON.parse(source) : source;
    if (document?.format !== "cute-effects-state" || document.version !== STATE_VERSION) {
      throw new TypeError("Unsupported Cute effects document.");
    }
    return restore(document.state);
  }

  function renderControls() {
    if (document.getElementById("cuteEffectsSection")) return;
    const insertion = document.querySelector("[data-art-control='scene']")
      || document.getElementById("finishGrid")?.closest(".control-section");
    if (!insertion) return;

    const section = document.createElement("section");
    section.id = "cuteEffectsSection";
    section.className = "control-section cute-effects-section";
    section.dataset.artControl = "effects";
    section.innerHTML = `
      <div class="control-heading stacked"><span>Effects</span><small>Seeded, non-destructive finishing presets</small></div>
      <div id="cuteEffectsGrid" class="cute-effects-grid" role="group" aria-label="Effects presets"></div>
      <div class="cute-effects-controls">
        <div class="control-heading"><label for="cuteEffectsIntensity">Intensity</label><output id="cuteEffectsIntensityOutput">70%</output></div>
        <input id="cuteEffectsIntensity" type="range" min="0" max="100" step="1" value="70">
        <div class="cute-effects-seed-row"><label for="cuteEffectsSeed">Seed</label><input id="cuteEffectsSeed" type="number" min="0" max="2147483646" inputmode="numeric"><button id="cuteEffectsReroll" class="stage-btn" type="button">↻ Reroll</button></div>
        <div class="cute-effects-footer"><label class="toggle-label"><input class="toggle-input" id="cuteEffectsEnabled" type="checkbox" checked><span class="toggle-track" aria-hidden="true"></span>Effects enabled</label><button id="cuteEffectsReset" class="stage-btn" type="button">Reset effects</button></div>
      </div>`;
    insertion.insertAdjacentElement("afterend", section);

    const grid = section.querySelector("#cuteEffectsGrid");
    const intensity = section.querySelector("#cuteEffectsIntensity");
    const intensityOutput = section.querySelector("#cuteEffectsIntensityOutput");
    const seed = section.querySelector("#cuteEffectsSeed");
    const enabled = section.querySelector("#cuteEffectsEnabled");

    function renderPresets() {
      grid.innerHTML = config.presets.map((preset) => {
        const visual = presetVisuals[preset.id] || { description: "Curated finishing preset.", colors: ["#f6d8c6", "#fff8ea"] };
        const active = state.enabled && state.presetId === preset.id;
        return `<button class="cute-effect-card${active ? " is-active" : ""}" data-effect-preset="${preset.id}" type="button" aria-pressed="${active}" style="--effect-a:${visual.colors[0]};--effect-b:${visual.colors[1]}"><span class="cute-effect-swatch" aria-hidden="true"><i></i><b></b></span><strong>${preset.label}</strong><small>${visual.description}</small></button>`;
      }).join("");
      grid.querySelectorAll("[data-effect-preset]").forEach((button) => button.addEventListener("click", () => setPreset(button.dataset.effectPreset)));
    }

    function sync(next = state) {
      intensity.value = String(Math.round(next.intensity * 100));
      intensityOutput.textContent = `${Math.round(next.intensity * 100)}%`;
      seed.value = String(next.seed);
      enabled.checked = next.enabled;
      renderPresets();
    }

    intensity.addEventListener("input", () => {
      intensityOutput.textContent = `${intensity.value}%`;
      setIntensity(Number(intensity.value) / 100);
    });
    seed.addEventListener("change", () => setSeed(seed.value));
    enabled.addEventListener("change", () => setEnabled(enabled.checked));
    section.querySelector("#cuteEffectsReroll").addEventListener("click", randomizeSeed);
    section.querySelector("#cuteEffectsReset").addEventListener("click", reset);
    global.addEventListener("cute:effects-change", (event) => sync(event.detail));
    sync();
  }

  async function interceptExportMenu(event) {
    if (!state.enabled) return;
    const item = event.target.closest?.("[data-export-action]");
    if (!item || !global.CuteExportEffects) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const action = item.dataset.exportAction;
    const menu = document.getElementById("exportMenu");
    const exportButton = document.querySelector('[aria-controls="exportMenu"]');
    if (menu) menu.hidden = true;
    exportButton?.setAttribute("aria-expanded", "false");
    try {
      if (action === "recipe") {
        await global.CuteExportEffects.copyRecipeJson();
        global.CuteExportEffects.showStatus("Recipe JSON copied with effects.");
      } else {
        await global.CuteExportEffects.downloadPng({ size: 1600, transparent: action === "transparent" });
        global.CuteExportEffects.showStatus(action === "transparent" ? "Transparent effects PNG exported." : "1600 px effects PNG exported.");
      }
    } catch (error) {
      console.error(error);
      global.CuteExportEffects.showStatus(error?.message || "Effects export failed.", true);
      global.dispatchEvent(new CustomEvent("cute:export-error", { detail: error }));
    }
  }

  async function initialize() {
    config = await ENGINE.loadConfig(CONFIG_URL);
    restore({ ...DEFAULTS, seed: config.defaultSeed ?? DEFAULTS.seed }, { silent: true });
    renderControls();
    ["cute:complete-face-change", "cute:composition-change", "cute:art-direction-change", "cute:mixed-asset-change"]
      .forEach((eventName) => global.addEventListener(eventName, scheduleRender));
    document.getElementById("transparentBgToggle")?.addEventListener("change", scheduleRender);
    document.getElementById("resetButton")?.addEventListener("click", reset);
    global.dispatchEvent(new CustomEvent("cute:effects-ready", { detail: getState() }));
    return getState();
  }

  document.addEventListener("click", interceptExportMenu, true);

  const ready = initialize().catch((error) => {
    console.error(error);
    global.dispatchEvent(new CustomEvent("cute:effects-error", { detail: error }));
    throw error;
  });

  global.CuteEffectsController = Object.freeze({
    ready,
    defaults: { ...DEFAULTS },
    getState,
    restore,
    reset,
    setPreset,
    setIntensity,
    setSeed,
    randomizeSeed,
    setEnabled,
    setPerformanceTier,
    getResolvedPerformanceTier: getTierId,
    getResolvedEffects: currentEffects,
    listPresets: () => clone(config?.presets || []),
    listEffects: () => clone(config?.effects || []),
    serialize,
    deserialize,
    renderPreview,
    scheduleRender
  });
})(window);
