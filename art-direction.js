(function installCuteArtDirection(global) {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";

  const finishes = Object.freeze({
    "classic-paper": { label: "Classic paper", note: "Warm tactile grain" },
    "clean-studio": { label: "Clean studio", note: "Neutral and crisp" },
    "thermal-print": { label: "Thermal print", note: "Monochrome dither" },
    sticker: { label: "Sticker", note: "White cutline + shadow" }
  });

  const backgrounds = Object.freeze({
    "apricot-day": { label: "Apricot day", color: "#FFE9BD" },
    "cream-paper": { label: "Cream paper", color: "#FFF8EA" },
    "mint-tea": { label: "Mint tea", color: "#DCEFE4" },
    "powder-sky": { label: "Powder sky", color: "#DDEEF7" },
    "lavender-dream": { label: "Lavender dream", color: "#EDE3FA" }
  });

  const frames = Object.freeze({
    none: { label: "No frame" },
    "soft-rounded": { label: "Soft rounded" },
    postage: { label: "Postage dash" }
  });

  const expressionMap = Object.freeze({
    happy: { label: "Happy", legacy: "sparkle", layered: "eyes-sparkle" },
    sleepy: { label: "Sleepy", legacy: "sleepy", layered: "eyes-sleepy" },
    surprised: { label: "Surprised", legacy: "star", layered: "eyes-star" }
  });

  const paletteOptions = Object.freeze({
    tangerine: { label: "Apricot day", color: "#F6A65E" },
    lavender: { label: "Lavender dream", color: "#D9C8F4" },
    mint: { label: "Mint tea", color: "#BFE2CF" },
    butter: { label: "Butter sun", color: "#F4C84D" },
    sky: { label: "Powder sky", color: "#BFDDED" }
  });

  const defaults = Object.freeze({
    finishId: "classic-paper",
    backgroundId: "apricot-day",
    frameId: "none",
    expressionId: "happy",
    caption: "Purr-fect day!",
    showCaption: false,
    transparentExport: false
  });

  let artState = { ...defaults };
  let activeMode = typeof state !== "undefined" && state.mode === "parts" ? "parts" : "recipes";

  const stage = document.getElementById("stage");
  const faceCanvas = document.getElementById("faceCanvas");
  const renderRoot = document.getElementById("renderRoot");
  const finishGrid = document.getElementById("finishGrid");
  const paletteGrid = document.getElementById("paletteGrid");
  const expressionPills = document.getElementById("expressionPills");
  const showCaptionToggle = document.getElementById("showCaptionToggle");
  const transparentToggle = document.getElementById("transparentBgToggle");
  const resetButton = document.getElementById("resetButton");
  const exportButton = document.getElementById("exportButton");
  const characterTitle = document.getElementById("characterTitle");

  if (!stage || !faceCanvas || !renderRoot || !finishGrid || !paletteGrid) return;

  function cloneState() {
    return { ...artState };
  }

  function emitChange() {
    global.dispatchEvent(new CustomEvent("cute:art-direction-change", { detail: cloneState() }));
  }

  function ensureStageLayers() {
    if (!document.getElementById("stageFinishOverlay")) {
      const finishOverlay = document.createElement("div");
      finishOverlay.id = "stageFinishOverlay";
      finishOverlay.setAttribute("aria-hidden", "true");
      stage.appendChild(finishOverlay);
    }

    if (!document.getElementById("stageFrameOverlay")) {
      const frameOverlay = document.createElement("div");
      frameOverlay.id = "stageFrameOverlay";
      frameOverlay.setAttribute("aria-hidden", "true");
      stage.appendChild(frameOverlay);
    }

    if (!document.getElementById("stageCaption")) {
      const caption = document.createElement("div");
      caption.id = "stageCaption";
      caption.setAttribute("role", "status");
      caption.hidden = true;
      stage.appendChild(caption);
    }
  }

  function selectOptions(options) {
    return Object.entries(options)
      .map(([id, option]) => `<option value="${id}">${option.label}</option>`)
      .join("");
  }

  function ensureControlSections() {
    const finishSection = finishGrid.closest(".control-section");
    const nameInput = document.getElementById("nameInput");
    const nameSection = nameInput?.closest(".control-section");

    if (finishSection && !document.getElementById("backgroundSelect")) {
      finishSection.insertAdjacentHTML("afterend", `
        <section class="control-section art-scene-section" data-art-control="scene">
          <div class="control-heading stacked">
            <span>Scene</span>
            <small>Authored background and frame</small>
          </div>
          <div class="art-select-grid">
            <label class="art-field" for="backgroundSelect">Background
              <select class="art-select" id="backgroundSelect">${selectOptions(backgrounds)}</select>
            </label>
            <label class="art-field" for="frameSelect">Frame
              <select class="art-select" id="frameSelect">${selectOptions(frames)}</select>
            </label>
          </div>
        </section>`);
    }

    if (nameSection && !document.getElementById("captionInput")) {
      nameSection.insertAdjacentHTML("afterend", `
        <section class="control-section art-caption-section" data-art-control="caption">
          <div class="control-heading stacked">
            <label for="captionInput">Caption</label>
            <small>Optional authored presentation text</small>
          </div>
          <input class="art-caption-input" id="captionInput" type="text" maxlength="72" value="${defaults.caption}" />
        </section>`);
    }

    expressionPills?.querySelectorAll("[data-expression]").forEach((button) => {
      button.disabled = false;
      button.removeAttribute("title");
    });
  }

  function renderFinishControls() {
    finishGrid.innerHTML = Object.entries(finishes).map(([id, finish]) => {
      const active = artState.finishId === id;
      return `<button class="art-finish-card${active ? " is-active" : ""}" data-art-finish="${id}" type="button" aria-pressed="${active}"><strong>${finish.label}</strong><small>${finish.note}</small></button>`;
    }).join("");

    finishGrid.querySelectorAll("[data-art-finish]").forEach((button) => {
      button.addEventListener("click", () => {
        artState.finishId = button.dataset.artFinish;
        applyVisuals();
        renderFinishControls();
        emitChange();
      });
    });
  }

  function renderPaletteControls() {
    paletteGrid.innerHTML = Object.entries(paletteOptions).map(([id, palette]) => {
      const active = currentPaletteId() === id;
      return `<button class="palette-button${active ? " is-active" : ""}" style="--swatch:${palette.color}" data-art-palette="${id}" aria-label="${palette.label}" title="${palette.label}" aria-pressed="${active}" type="button"></button>`;
    }).join("");

    paletteGrid.querySelectorAll("[data-art-palette]").forEach((button) => {
      button.addEventListener("click", () => applyPalette(button.dataset.artPalette));
    });
  }

  function currentPaletteId() {
    if (activeMode === "parts" && global.CuteBuildFace) {
      return global.CuteBuildFace.getState().paletteId || "tangerine";
    }
    return typeof state !== "undefined" ? state.palette : "tangerine";
  }

  function applyPalette(paletteId) {
    if (!paletteOptions[paletteId]) return;

    if (activeMode === "parts" && global.CuteBuildFace) {
      const next = global.CuteBuildFace.getState();
      global.CuteBuildFace.restore({ ...next, recipeId: null, paletteId });
    } else if (typeof state !== "undefined") {
      state.palette = paletteId;
      state.recipeId = null;
      renderFace();
    }

    renderPaletteControls();
    emitChange();
  }

  function applyExpression(expressionId) {
    const expression = expressionMap[expressionId];
    if (!expression) return;

    if (activeMode === "parts" && global.CuteBuildFace) {
      const next = global.CuteBuildFace.getState();
      const supported = global.CuteBuildFace
        .listCompatible("eyes", next.partIds.base)
        .some((item) => item.id === expression.layered);
      if (!supported) return;
      next.partIds.eyes = expression.layered;
      global.CuteBuildFace.restore({ ...next, recipeId: null });
    } else if (typeof state !== "undefined" && typeof eyes !== "undefined" && eyes[expression.legacy]) {
      state.eyes = expression.legacy;
      state.recipeId = null;
      renderFace();
    }

    artState.expressionId = expressionId;
    syncExpressionControls();
    emitChange();
  }

  function syncExpressionControls() {
    expressionPills?.querySelectorAll("[data-expression]").forEach((button) => {
      const active = button.dataset.expression === artState.expressionId;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function applyVisuals() {
    const background = backgrounds[artState.backgroundId] || backgrounds[defaults.backgroundId];
    stage.dataset.artFinish = artState.finishId;
    stage.dataset.artBackground = artState.backgroundId;
    stage.dataset.artFrame = artState.frameId;
    stage.classList.toggle("is-transparent-preview", artState.transparentExport);
    stage.style.background = artState.transparentExport ? "#fff" : background.color;

    const caption = document.getElementById("stageCaption");
    if (caption) {
      caption.textContent = artState.caption;
      caption.hidden = !artState.showCaption || !artState.caption.trim();
    }

    const backgroundSelect = document.getElementById("backgroundSelect");
    const frameSelect = document.getElementById("frameSelect");
    const captionInput = document.getElementById("captionInput");
    if (backgroundSelect) backgroundSelect.value = artState.backgroundId;
    if (frameSelect) frameSelect.value = artState.frameId;
    if (captionInput && captionInput.value !== artState.caption) captionInput.value = artState.caption;
    if (showCaptionToggle) showCaptionToggle.checked = artState.showCaption;
    if (transparentToggle) transparentToggle.checked = artState.transparentExport;
  }

  function syncControls() {
    renderFinishControls();
    renderPaletteControls();
    syncExpressionControls();
    applyVisuals();
  }

  function bindControls() {
    document.getElementById("backgroundSelect")?.addEventListener("change", (event) => {
      if (!backgrounds[event.target.value]) return;
      artState.backgroundId = event.target.value;
      applyVisuals();
      emitChange();
    });

    document.getElementById("frameSelect")?.addEventListener("change", (event) => {
      if (!frames[event.target.value]) return;
      artState.frameId = event.target.value;
      applyVisuals();
      emitChange();
    });

    document.getElementById("captionInput")?.addEventListener("input", (event) => {
      artState.caption = event.target.value;
      applyVisuals();
      emitChange();
    });

    showCaptionToggle?.addEventListener("change", () => {
      artState.showCaption = showCaptionToggle.checked;
      applyVisuals();
      emitChange();
    });

    transparentToggle?.addEventListener("change", () => {
      artState.transparentExport = transparentToggle.checked;
      applyVisuals();
      emitChange();
    });

    expressionPills?.querySelectorAll("[data-expression]").forEach((button) => {
      button.addEventListener("click", () => applyExpression(button.dataset.expression));
    });

    document.querySelectorAll(".mode-tab").forEach((button) => {
      button.addEventListener("click", () => {
        activeMode = button.dataset.mode === "parts" ? "parts" : "recipes";
        setTimeout(syncControls, 0);
      });
    });

    global.addEventListener("cute:composition-change", () => {
      activeMode = "parts";
      syncControls();
    });

    resetButton?.addEventListener("click", () => {
      const resetLayered = activeMode === "parts" && global.CuteBuildFace;
      artState = { ...defaults };
      if (resetLayered) {
        const current = global.CuteBuildFace.getState();
        const recipeId = current.recipeId || global.CuteBuildFace.listRecipes()[0]?.id;
        if (recipeId) global.CuteBuildFace.applyRecipe(recipeId);
        activeMode = "parts";
      }
      syncControls();
      emitChange();
    });

    [document.getElementById("shuffleButton"), document.getElementById("shuffleSecondary")]
      .filter(Boolean)
      .forEach((button) => button.addEventListener("click", () => {
        const finishIds = Object.keys(finishes);
        const backgroundIds = Object.keys(backgrounds);
        artState.finishId = finishIds[Math.floor(Math.random() * finishIds.length)];
        artState.backgroundId = backgroundIds[Math.floor(Math.random() * backgroundIds.length)];
        setTimeout(() => {
          syncControls();
          emitChange();
        }, 0);
      }));
  }

  function appendSvgDefinitions(svg) {
    let defs = svg.querySelector("defs");
    if (!defs) {
      defs = document.createElementNS(SVG_NS, "defs");
      svg.insertBefore(defs, svg.firstChild);
    }

    defs.insertAdjacentHTML("beforeend", `
      <pattern id="artPaperTexture" width="18" height="18" patternUnits="userSpaceOnUse">
        <circle cx="4" cy="5" r="1.1" fill="#5c3d2a" opacity=".1" />
        <circle cx="14" cy="12" r=".8" fill="#5c3d2a" opacity=".07" />
      </pattern>
      <filter id="artThermal" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
        <feColorMatrix type="saturate" values="0" />
        <feComponentTransfer>
          <feFuncR type="discrete" tableValues="0 .18 .48 .78 1" />
          <feFuncG type="discrete" tableValues="0 .18 .48 .78 1" />
          <feFuncB type="discrete" tableValues="0 .18 .48 .78 1" />
        </feComponentTransfer>
      </filter>
      <filter id="artSticker" x="-25%" y="-25%" width="150%" height="160%" color-interpolation-filters="sRGB">
        <feMorphology in="SourceAlpha" operator="dilate" radius="10" result="expanded" />
        <feFlood flood-color="#ffffff" result="white" />
        <feComposite in="white" in2="expanded" operator="in" result="outline" />
        <feGaussianBlur in="SourceAlpha" stdDeviation="8" result="blur" />
        <feOffset in="blur" dy="12" result="offsetBlur" />
        <feColorMatrix in="offsetBlur" type="matrix" values="0 0 0 0 .24 0 0 0 0 .19 0 0 0 0 .16 0 0 0 .22 0" result="shadow" />
        <feMerge>
          <feMergeNode in="shadow" />
          <feMergeNode in="outline" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>`);

    const style = document.createElementNS(SVG_NS, "style");
    style.textContent = `
      .face-ink{stroke:#2d2723;stroke-width:18;stroke-linecap:round;stroke-linejoin:round}
      .detail-ink{stroke:#2d2723;stroke-width:11;stroke-linecap:round;stroke-linejoin:round}
      .detail-line{stroke:#2d2723;stroke-width:14;stroke-linecap:round;stroke-linejoin:round}
      .tiny-line{stroke:#2d2723;stroke-width:7;stroke-linecap:round;stroke-linejoin:round}`;
    svg.insertBefore(style, defs.nextSibling);
  }

  function addExportBackground(svg) {
    if (artState.transparentExport) return;
    const background = backgrounds[artState.backgroundId] || backgrounds[defaults.backgroundId];
    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("width", "1000");
    rect.setAttribute("height", "1000");
    rect.setAttribute("rx", "70");
    rect.setAttribute("fill", background.color);
    svg.insertBefore(rect, svg.querySelector("#renderRoot"));

    if (artState.finishId === "classic-paper") {
      const texture = document.createElementNS(SVG_NS, "rect");
      texture.setAttribute("width", "1000");
      texture.setAttribute("height", "1000");
      texture.setAttribute("rx", "70");
      texture.setAttribute("fill", "url(#artPaperTexture)");
      texture.setAttribute("opacity", ".42");
      svg.insertBefore(texture, svg.querySelector("#renderRoot"));
    }
  }

  function addExportFrame(svg) {
    if (artState.frameId === "none") return;
    const frame = document.createElementNS(SVG_NS, "rect");
    frame.setAttribute("x", "55");
    frame.setAttribute("y", "55");
    frame.setAttribute("width", "890");
    frame.setAttribute("height", "890");
    frame.setAttribute("rx", artState.frameId === "postage" ? "30" : "72");
    frame.setAttribute("fill", "none");
    frame.setAttribute("stroke", "#493125");
    frame.setAttribute("stroke-opacity", ".64");
    frame.setAttribute("stroke-width", artState.frameId === "postage" ? "8" : "10");
    if (artState.frameId === "postage") frame.setAttribute("stroke-dasharray", "22 16");
    svg.appendChild(frame);
  }

  function addExportCaption(svg) {
    if (!artState.showCaption || !artState.caption.trim()) return;

    const plate = document.createElementNS(SVG_NS, "rect");
    plate.setAttribute("x", "250");
    plate.setAttribute("y", "875");
    plate.setAttribute("width", "500");
    plate.setAttribute("height", "72");
    plate.setAttribute("rx", "36");
    plate.setAttribute("fill", "#fffaf0");
    plate.setAttribute("fill-opacity", ".92");
    plate.setAttribute("stroke", "#493125");
    plate.setAttribute("stroke-opacity", ".16");
    svg.appendChild(plate);

    const text = document.createElementNS(SVG_NS, "text");
    text.setAttribute("x", "500");
    text.setAttribute("y", "922");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("font-family", "Arial, Helvetica, sans-serif");
    text.setAttribute("font-size", "32");
    text.setAttribute("font-weight", "700");
    text.setAttribute("fill", "#38261d");
    text.textContent = artState.caption;
    svg.appendChild(text);
  }

  function buildExportSvg() {
    const svg = faceCanvas.cloneNode(true);
    svg.setAttribute("xmlns", SVG_NS);
    svg.setAttribute("width", "1600");
    svg.setAttribute("height", "1600");
    svg.setAttribute("viewBox", "0 0 1000 1000");
    appendSvgDefinitions(svg);
    addExportBackground(svg);

    const root = svg.querySelector("#renderRoot");
    if (root && artState.finishId === "thermal-print") root.setAttribute("filter", "url(#artThermal)");
    if (root && artState.finishId === "sticker") root.setAttribute("filter", "url(#artSticker)");

    addExportFrame(svg);
    addExportCaption(svg);
    return svg;
  }

  async function renderPngBlob(size = 1600) {
    const exportSvg = buildExportSvg();
    exportSvg.setAttribute("width", String(size));
    exportSvg.setAttribute("height", String(size));
    const source = new XMLSerializer().serializeToString(exportSvg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    try {
      const image = new Image();
      const loaded = new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error("Unable to rasterize the authored composition."));
      });
      image.src = url;
      await loaded;

      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas rendering is unavailable in this browser.");
      context.drawImage(image, 0, 0, size, size);

      return await new Promise((resolve, reject) => {
        canvas.toBlob((png) => png ? resolve(png) : reject(new Error("PNG encoding failed.")), "image/png");
      });
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function exportPng(size = 1600) {
    if (document.fonts?.ready) await document.fonts.ready;
    const png = await renderPngBlob(size);
    const link = document.createElement("a");
    const title = characterTitle?.textContent || "cute-face";
    const safeName = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "cute-face";
    link.href = URL.createObjectURL(png);
    link.download = `${safeName}.png`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 2000);
  }

  ensureStageLayers();
  ensureControlSections();

  if (typeof renderFace === "function" && typeof state !== "undefined") {
    const legacyRenderFace = renderFace;
    renderFace = function renderFaceWithArtDirection(...args) {
      state.finish = "clean";
      const result = legacyRenderFace(...args);
      queueMicrotask(syncControls);
      return result;
    };
  }

  bindControls();
  syncControls();

  exportButton?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    exportPng().catch((error) => {
      console.error(error);
      global.dispatchEvent(new CustomEvent("cute:export-error", { detail: error }));
    });
  }, true);

  global.CuteArtDirection = Object.freeze({
    defaults: { ...defaults },
    getState: cloneState,
    restore(next) {
      if (!next || typeof next !== "object") throw new TypeError("Art-direction state is required.");
      artState = {
        finishId: finishes[next.finishId] ? next.finishId : defaults.finishId,
        backgroundId: backgrounds[next.backgroundId] ? next.backgroundId : defaults.backgroundId,
        frameId: frames[next.frameId] ? next.frameId : defaults.frameId,
        expressionId: expressionMap[next.expressionId] ? next.expressionId : defaults.expressionId,
        caption: typeof next.caption === "string" ? next.caption.slice(0, 72) : defaults.caption,
        showCaption: Boolean(next.showCaption),
        transparentExport: Boolean(next.transparentExport)
      };
      syncControls();
      emitChange();
    },
    listFinishes: () => Object.entries(finishes).map(([id, value]) => ({ id, ...value })),
    listBackgrounds: () => Object.entries(backgrounds).map(([id, value]) => ({ id, ...value })),
    listFrames: () => Object.entries(frames).map(([id, value]) => ({ id, ...value })),
    buildExportSvg: () => new XMLSerializer().serializeToString(buildExportSvg()),
    renderPngBlob,
    exportPng
  });

  global.dispatchEvent(new CustomEvent("cute:art-direction-ready", { detail: cloneState() }));
})(window);
