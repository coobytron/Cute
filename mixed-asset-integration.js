(function installMixedAssetIntegration(global) {
  "use strict";

  const FIXTURE_URL = "assets/mixed-asset-fixtures.json";
  const backgroundColors = Object.freeze({
    "apricot-day": "#FFE9BD",
    "cream-paper": "#FFF8EA",
    "mint-tea": "#DCEFE4",
    "powder-sky": "#DDEEF7",
    "lavender-dream": "#EDE3FA",
    "butter-sun": "#FFF0BA"
  });

  let config = null;
  let fixturesById = new Map();
  let activeFixture = null;
  let activeTransform = { scale: 1, rotation: 0, flipX: false };
  let overlayCanvas = null;
  let lastResult = null;
  let renderToken = 0;

  function ensureStyles() {
    if (document.getElementById("mixedAssetIntegrationStyles")) return;
    const style = document.createElement("style");
    style.id = "mixedAssetIntegrationStyles";
    style.textContent = `
      #stage { position: relative; }
      .mixed-face-canvas { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
      .mixed-fixture-heading { display:flex; align-items:center; gap:8px; margin:18px 0 8px; color:#765d52; font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; }
      .mixed-fixture-heading::before, .mixed-fixture-heading::after { content:""; height:1px; flex:1; background:rgba(86,64,53,.16); }
      .recipe-card[data-mixed-fixture] .recipe-thumb { position:relative; overflow:hidden; }
      .recipe-card[data-mixed-fixture] .recipe-thumb::after { content:"MIXED"; position:absolute; right:6px; bottom:6px; padding:3px 6px; border-radius:999px; background:#3c302b; color:white; font-size:8px; letter-spacing:.08em; }
    `;
    document.head.appendChild(style);
  }

  function ensureOverlay() {
    if (overlayCanvas?.isConnected) return overlayCanvas;
    const stage = document.getElementById("stage");
    if (!stage) return null;
    overlayCanvas = document.createElement("canvas");
    overlayCanvas.id = "mixedFaceCanvas";
    overlayCanvas.className = "mixed-face-canvas";
    overlayCanvas.hidden = true;
    overlayCanvas.setAttribute("aria-hidden", "true");
    stage.appendChild(overlayCanvas);
    return overlayCanvas;
  }

  function setMixedVisibility(active) {
    const svg = document.getElementById("faceCanvas");
    const canvas = ensureOverlay();
    if (svg) svg.hidden = active;
    if (canvas) canvas.hidden = !active;
  }

  function fixtureCard(fixture) {
    const selected = activeFixture?.id === fixture.id;
    return `<button class="recipe-card${selected ? " is-active" : ""}" data-mixed-fixture="${fixture.id}" type="button" aria-pressed="${selected}">
      <span class="recipe-thumb" style="background:${backgroundColors[fixture.paletteId] || backgroundColors["apricot-day"]}">
        <img src="${fixture.previewFile}" alt="" />
      </span>
      <span class="recipe-meta"><strong>${fixture.label}</strong><span>${fixture.mediaMode === "raster" ? "Raster layers" : "SVG + raster layers"}</span></span>
      <span class="recipe-arrow" aria-hidden="true">→</span>
    </button>`;
  }

  function appendFixtureCards() {
    if (!config) return;
    const library = document.getElementById("recipeLibrary");
    if (!library || library.querySelector("[data-mixed-fixture]")) return;
    library.insertAdjacentHTML(
      "beforeend",
      `<div class="mixed-fixture-heading" role="presentation">Mixed media references</div>${config.fixtures.map(fixtureCard).join("")}`
    );
    library.querySelectorAll("[data-mixed-fixture]").forEach((button) => {
      button.addEventListener("click", () => activate(button.dataset.mixedFixture));
    });

    const count = document.getElementById("assetCount");
    const regularCount = global.CuteCompleteFaces?.listRecipes?.().length || 0;
    if (count) count.textContent = `${regularCount + config.fixtures.length} complete faces`;
  }

  async function loadConfig() {
    const response = await fetch(FIXTURE_URL, { cache: "no-cache" });
    if (!response.ok) throw new Error(`Unable to load mixed-asset fixtures (${response.status}).`);
    config = await response.json();
    fixturesById = new Map(config.fixtures.map((fixture) => [fixture.id, fixture]));
    appendFixtureCards();
    global.dispatchEvent(new CustomEvent("cute:mixed-assets-ready", {
      detail: { count: config.fixtures.length, ids: [...fixturesById.keys()] }
    }));
  }

  async function composeFixtureToCanvas(fixture, targetCanvas, options = {}) {
    const canonical = config?.canonicalCanvas || { width: 1000, height: 1000 };
    const width = Math.max(1, Number(options.width) || canonical.width);
    const height = Math.max(1, Number(options.height) || canonical.height);
    const pixelRatio = Math.max(1, Number(options.pixelRatio) || 1);
    const sourceCanvas = document.createElement("canvas");
    const result = await global.CuteMixedAssets.compose(sourceCanvas, fixture.layers, {
      width: canonical.width,
      height: canonical.height,
      pixelRatio: 1,
      maxPixelRatio: 1,
      canonicalCanvas: canonical,
      showPlaceholders: options.showPlaceholders
    });

    targetCanvas.width = Math.round(width * pixelRatio);
    targetCanvas.height = Math.round(height * pixelRatio);
    targetCanvas.style.width = `${width}px`;
    targetCanvas.style.height = `${height}px`;
    const context = targetCanvas.getContext("2d", { alpha: true });
    if (!context) throw new Error("Canvas rendering is unavailable.");
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, width, height);
    context.save();
    context.translate(width / 2, height / 2);
    context.rotate((activeTransform.rotation || 0) * Math.PI / 180);
    context.scale((activeTransform.flipX ? -1 : 1) * (activeTransform.scale || 1), activeTransform.scale || 1);
    context.drawImage(sourceCanvas, -width / 2, -height / 2, width, height);
    context.restore();
    return result;
  }

  async function renderActive() {
    if (!activeFixture) return null;
    const token = ++renderToken;
    const canvas = ensureOverlay();
    if (!canvas) return null;
    const stage = document.getElementById("stage");
    const size = Math.max(1, Math.round(stage?.getBoundingClientRect().width || 1000));
    try {
      const result = await composeFixtureToCanvas(activeFixture, canvas, {
        width: size,
        height: size,
        pixelRatio: Math.min(global.devicePixelRatio || 1, 2),
        showPlaceholders: true
      });
      if (token !== renderToken) return null;
      lastResult = result;
      const status = document.getElementById("stageStatus");
      if (status) {
        status.textContent = result.errors.length
          ? `Mixed media · ${result.errors.length} recoverable error${result.errors.length === 1 ? "" : "s"}`
          : `${activeFixture.mediaMode === "raster" ? "Raster" : "Mixed SVG + raster"} · ${result.visibleAssetCount} layers`;
      }
      global.dispatchEvent(new CustomEvent("cute:mixed-asset-render", {
        detail: { fixtureId: activeFixture.id, result }
      }));
      return result;
    } catch (error) {
      const status = document.getElementById("stageStatus");
      if (status) status.textContent = "Mixed media render failed";
      global.dispatchEvent(new CustomEvent("cute:mixed-asset-error", { detail: error }));
      throw error;
    }
  }

  function syncUi() {
    if (!activeFixture) return;
    setMixedVisibility(true);
    const title = document.getElementById("characterTitle");
    const code = document.getElementById("recipeCode");
    const nameInput = document.getElementById("nameInput");
    const scaleControl = document.getElementById("scaleControl");
    const rotationControl = document.getElementById("rotationControl");
    const scaleOutput = document.getElementById("scaleOutput");
    const rotationOutput = document.getElementById("rotationOutput");
    if (title) title.textContent = activeFixture.label;
    if (code) code.textContent = `${activeFixture.id} · ${activeFixture.mediaMode}`.toUpperCase();
    if (nameInput) nameInput.value = activeFixture.label;
    if (scaleControl) scaleControl.value = Math.round(activeTransform.scale * 100);
    if (rotationControl) rotationControl.value = activeTransform.rotation;
    if (scaleOutput) scaleOutput.textContent = `${Math.round(activeTransform.scale * 100)}%`;
    if (rotationOutput) rotationOutput.textContent = `${activeTransform.rotation}°`;
    appendFixtureCards();
    document.querySelectorAll("[data-mixed-fixture]").forEach((button) => {
      const selected = button.dataset.mixedFixture === activeFixture.id;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
  }

  async function activate(id) {
    const fixture = fixturesById.get(id);
    if (!fixture) throw new RangeError(`Unknown mixed fixture: ${id}`);
    activeFixture = fixture;
    activeTransform = { scale: 1, rotation: 0, flipX: false };
    syncUi();
    await renderActive();
    global.dispatchEvent(new CustomEvent("cute:mixed-asset-change", {
      detail: serialize()
    }));
    return serialize();
  }

  function deactivate() {
    if (!activeFixture) {
      appendFixtureCards();
      return;
    }
    activeFixture = null;
    setMixedVisibility(false);
    appendFixtureCards();
  }

  function serialize() {
    if (!activeFixture) return null;
    return {
      schemaVersion: config.schemaVersion,
      mode: "mixed-complete-face",
      fixtureId: activeFixture.id,
      label: activeFixture.label,
      mediaMode: activeFixture.mediaMode,
      paletteId: activeFixture.paletteId,
      personalityCue: activeFixture.personalityCue,
      layerIds: activeFixture.layers.map((layer) => layer.id),
      transform: { ...activeTransform }
    };
  }

  async function renderExportCanvas(options = {}) {
    if (!activeFixture) throw new Error("No mixed-media fixture is active.");
    const size = Math.max(1, Number(options.size) || 1600);
    const artCanvas = document.createElement("canvas");
    await composeFixtureToCanvas(activeFixture, artCanvas, {
      width: size,
      height: size,
      pixelRatio: 1,
      showPlaceholders: false
    });

    if (options.transparent) return artCanvas;

    const output = document.createElement("canvas");
    output.width = size;
    output.height = size;
    const context = output.getContext("2d", { alpha: true });
    const artState = global.CuteArtDirection?.getState?.() || {};
    context.fillStyle = backgroundColors[artState.backgroundId] || backgroundColors[activeFixture.paletteId] || "#FFF8EA";
    context.fillRect(0, 0, size, size);
    context.drawImage(artCanvas, 0, 0, size, size);
    return output;
  }

  async function renderPngBlob(options = {}) {
    const canvas = await renderExportCanvas(options);
    return await new Promise((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("The browser could not encode the mixed-media PNG.")), "image/png");
    });
  }

  function installControlInterceptors() {
    document.addEventListener("input", (event) => {
      if (!activeFixture) return;
      if (event.target?.id === "scaleControl") {
        event.stopImmediatePropagation();
        activeTransform.scale = Number(event.target.value) / 100;
        document.getElementById("scaleOutput").textContent = `${event.target.value}%`;
        renderActive();
      } else if (event.target?.id === "rotationControl") {
        event.stopImmediatePropagation();
        activeTransform.rotation = Number(event.target.value);
        document.getElementById("rotationOutput").textContent = `${event.target.value}°`;
        renderActive();
      }
    }, true);

    document.addEventListener("click", (event) => {
      if (!activeFixture) return;
      const button = event.target.closest?.("#flipButton, #resetButton");
      if (!button) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (button.id === "flipButton") activeTransform.flipX = !activeTransform.flipX;
      if (button.id === "resetButton") activeTransform = { scale: 1, rotation: 0, flipX: false };
      syncUi();
      renderActive();
    }, true);

    global.addEventListener("resize", () => {
      if (activeFixture) renderActive();
    });
  }

  global.addEventListener("cute:complete-face-change", () => {
    deactivate();
    global.setTimeout(appendFixtureCards, 0);
  });

  function start() {
    loadConfig().catch((error) => {
      global.dispatchEvent(new CustomEvent("cute:mixed-asset-error", { detail: error }));
    });
  }

  if (global.CuteCompleteFaces?.ready) start();
  else global.addEventListener("cute:complete-faces-ready", start, { once: true });

  ensureStyles();
  ensureOverlay();
  installControlInterceptors();

  const api = {
    version: 1,
    ready: new Promise((resolve, reject) => {
      if (config) resolve(config);
      global.addEventListener("cute:mixed-assets-ready", () => resolve(config), { once: true });
      global.addEventListener("cute:mixed-asset-error", (event) => reject(event.detail), { once: true });
    }),
    activate,
    deactivate,
    isActive: () => Boolean(activeFixture),
    getActiveFixture: () => activeFixture ? structuredClone(activeFixture) : null,
    getState: serialize,
    getLastResult: () => lastResult,
    renderActive,
    renderExportCanvas,
    renderPngBlob
  };

  global.CuteMixedAssetIntegration = Object.freeze(api);
})(window);