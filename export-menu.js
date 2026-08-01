(function installCuteExport(global) {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";
  const DEFAULT_SIZE = 1600;
  const backgroundColors = Object.freeze({
    "apricot-day": "#FFE9BD",
    "cream-paper": "#FFF8EA",
    "mint-tea": "#DCEFE4",
    "powder-sky": "#DDEEF7",
    "lavender-dream": "#EDE3FA"
  });

  const originalButton = document.getElementById("exportButton");
  if (!originalButton || !global.CuteArtDirection) return;

  const exportButton = originalButton.cloneNode(true);
  exportButton.textContent = "Export";
  exportButton.setAttribute("aria-haspopup", "menu");
  exportButton.setAttribute("aria-expanded", "false");
  exportButton.setAttribute("aria-controls", "exportMenu");

  const control = document.createElement("div");
  control.className = "export-control";
  originalButton.replaceWith(control);
  control.appendChild(exportButton);

  const menu = document.createElement("div");
  menu.id = "exportMenu";
  menu.className = "export-menu";
  menu.setAttribute("role", "menu");
  menu.setAttribute("aria-label", "Export options");
  menu.hidden = true;
  menu.innerHTML = `
    <button class="export-menu-item" type="button" role="menuitem" data-export-action="png">
      <span class="export-menu-icon" aria-hidden="true">↓</span>
      <span class="export-menu-copy"><strong>PNG · 1600 px</strong><small>Opaque square image</small></span>
    </button>
    <button class="export-menu-item" type="button" role="menuitem" data-export-action="transparent">
      <span class="export-menu-icon" aria-hidden="true">◇</span>
      <span class="export-menu-copy"><strong>PNG · transparent</strong><small>1600 px with transparent corners</small></span>
    </button>
    <div class="export-menu-separator" role="separator"></div>
    <button class="export-menu-item" type="button" role="menuitem" data-export-action="recipe">
      <span class="export-menu-icon" aria-hidden="true">{ }</span>
      <span class="export-menu-copy"><strong>Copy recipe JSON</strong><small>Stable authored IDs and presentation state</small></span>
    </button>`;
  control.appendChild(menu);

  const status = document.createElement("div");
  status.className = "export-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  status.hidden = true;
  control.appendChild(status);

  const items = [...menu.querySelectorAll("[data-export-action]")];
  let busy = false;
  let statusTimer = null;

  function menuIsOpen() {
    return !menu.hidden;
  }

  function openMenu(focusFirst = false) {
    if (busy) return;
    menu.hidden = false;
    exportButton.setAttribute("aria-expanded", "true");
    if (focusFirst) items[0]?.focus();
  }

  function closeMenu(returnFocus = false) {
    menu.hidden = true;
    exportButton.setAttribute("aria-expanded", "false");
    if (returnFocus) exportButton.focus();
  }

  function setBusy(next) {
    busy = next;
    exportButton.disabled = next;
    exportButton.setAttribute("aria-busy", String(next));
    items.forEach((item) => { item.disabled = next; });
  }

  function showStatus(message, isError = false) {
    if (statusTimer) global.clearTimeout(statusTimer);
    status.hidden = false;
    status.classList.toggle("is-error", isError);
    status.textContent = message;
    statusTimer = global.setTimeout(() => {
      status.hidden = true;
      status.classList.remove("is-error");
      status.textContent = "";
    }, isError ? 7000 : 3200);
  }

  function currentSnapshot() {
    if (global.CuteHistorySaves?.capture) {
      return global.CuteHistorySaves.capture();
    }

    const partsActive = document.querySelector('.mode-tab[data-mode="parts"]')?.classList.contains("is-active");
    return {
      schemaVersion: 2,
      mode: partsActive ? "parts" : "recipes",
      composer: partsActive
        ? global.CuteBuildFace?.getState?.() || null
        : global.CuteCompleteFaces?.getState?.() || null,
      artDirection: global.CuteArtDirection.getState(),
      title: document.getElementById("characterTitle")?.textContent || "Cute friend"
    };
  }

  function recipeDocument() {
    return {
      format: "cute-face-recipe",
      version: 1,
      product: "Cute Face Builder",
      snapshot: currentSnapshot()
    };
  }

  function sanitizeFilename(value) {
    const normalized = String(value || "cute-face")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 72);
    return normalized || "cute-face";
  }

  function makeFilename(options = {}) {
    const snapshot = currentSnapshot();
    const title = snapshot.title || "cute-face";
    const recipeId = snapshot.composer?.recipeId || snapshot.composer?.completeFaceId || "";
    const titleSlug = sanitizeFilename(title);
    const recipeSlug = sanitizeFilename(recipeId);
    const suffix = options.transparent ? "transparent" : "1600px";
    const parts = [titleSlug];
    if (recipeSlug && recipeSlug !== titleSlug && !titleSlug.includes(recipeSlug)) parts.push(recipeSlug);
    parts.push(suffix);
    return `${parts.join("-")}.png`;
  }

  function parseExportSvg() {
    const source = global.CuteArtDirection.buildExportSvg();
    const documentNode = new DOMParser().parseFromString(source, "image/svg+xml");
    const parserError = documentNode.querySelector("parsererror");
    if (parserError) throw new Error("The authored composition could not be prepared for export.");
    const svg = documentNode.documentElement;
    if (!svg || svg.localName !== "svg") throw new Error("The export renderer did not return an SVG composition.");
    return svg;
  }

  function directBackgroundRects(svg) {
    const root = svg.querySelector("#renderRoot");
    if (!root) throw new Error("The character layer is missing from the export composition.");
    const children = [...svg.children];
    const rootIndex = children.indexOf(root);
    return children.filter((child, index) => {
      if (index >= rootIndex || child.localName !== "rect") return false;
      return child.getAttribute("width") === "1000" && child.getAttribute("height") === "1000";
    });
  }

  function removeExportBackground(svg) {
    directBackgroundRects(svg).forEach((rect) => rect.remove());
  }

  function ensureExportBackground(svg) {
    if (directBackgroundRects(svg).length) return;
    const root = svg.querySelector("#renderRoot");
    const art = global.CuteArtDirection.getState();
    const background = document.createElementNS(SVG_NS, "rect");
    background.setAttribute("width", "1000");
    background.setAttribute("height", "1000");
    background.setAttribute("rx", "70");
    background.setAttribute("fill", backgroundColors[art.backgroundId] || backgroundColors["apricot-day"]);
    svg.insertBefore(background, root);

    if (art.finishId === "classic-paper") {
      const texture = document.createElementNS(SVG_NS, "rect");
      texture.setAttribute("width", "1000");
      texture.setAttribute("height", "1000");
      texture.setAttribute("rx", "70");
      texture.setAttribute("fill", "url(#artPaperTexture)");
      texture.setAttribute("opacity", ".42");
      svg.insertBefore(texture, root);
    }
  }

  function buildSvg(options = {}) {
    const svg = parseExportSvg();
    svg.setAttribute("xmlns", SVG_NS);
    svg.setAttribute("width", String(options.size || DEFAULT_SIZE));
    svg.setAttribute("height", String(options.size || DEFAULT_SIZE));
    svg.setAttribute("viewBox", "0 0 1000 1000");
    svg.setAttribute("data-export-mode", options.transparent ? "transparent" : "opaque");

    if (options.transparent) removeExportBackground(svg);
    else ensureExportBackground(svg);

    return new XMLSerializer().serializeToString(svg);
  }

  async function waitForFonts() {
    if (document.fonts?.ready) await document.fonts.ready;
  }

  async function waitForSvgImages(source, timeoutMs = 10000) {
    const parsed = new DOMParser().parseFromString(source, "image/svg+xml");
    const hrefs = [...parsed.querySelectorAll("image")]
      .map((image) => image.getAttribute("href") || image.getAttributeNS("http://www.w3.org/1999/xlink", "href"))
      .filter(Boolean);

    await Promise.all(hrefs.map((href) => new Promise((resolve, reject) => {
      const image = new Image();
      const timer = global.setTimeout(() => reject(new Error("An authored image took too long to load.")), timeoutMs);
      image.onload = () => { global.clearTimeout(timer); resolve(); };
      image.onerror = () => { global.clearTimeout(timer); reject(new Error("An authored image could not be loaded for export.")); };
      image.src = href;
    })));
  }

  async function rasterize(source, size = DEFAULT_SIZE) {
    await waitForFonts();
    await waitForSvgImages(source);

    const svgBlob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);

    try {
      const image = new Image();
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error("The browser could not rasterize the authored SVG composition."));
        image.src = svgUrl;
      });

      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas rendering is unavailable in this browser.");
      context.clearRect(0, 0, size, size);
      context.drawImage(image, 0, 0, size, size);

      return await new Promise((resolve, reject) => {
        canvas.toBlob((png) => {
          if (png) resolve(png);
          else reject(new Error("The browser could not encode the PNG file."));
        }, "image/png");
      });
    } catch (error) {
      if (/security|taint|cross-origin/i.test(String(error?.message || error))) {
        throw new Error("PNG export was blocked by a cross-origin asset. Serve all authored assets from this repository.");
      }
      throw error;
    } finally {
      URL.revokeObjectURL(svgUrl);
    }
  }

  async function renderPngBlob(options = {}) {
    const size = options.size || DEFAULT_SIZE;
    return rasterize(buildSvg({ size, transparent: Boolean(options.transparent) }), size);
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.hidden = true;
    document.body.appendChild(link);
    link.click();
    link.remove();
    global.setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  async function downloadPng(options = {}) {
    const normalized = {
      size: options.size || DEFAULT_SIZE,
      transparent: Boolean(options.transparent)
    };
    const png = await renderPngBlob(normalized);
    downloadBlob(png, makeFilename(normalized));
    return png;
  }

  async function copyText(text) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    if (!copied) throw new Error("Clipboard access is unavailable in this browser.");
  }

  async function copyRecipeJson() {
    const text = JSON.stringify(recipeDocument(), null, 2);
    await copyText(text);
    return text;
  }

  async function runAction(action) {
    if (busy) return;
    setBusy(true);
    closeMenu(false);

    try {
      if (action === "recipe") {
        await copyRecipeJson();
        showStatus("Recipe JSON copied.");
      } else if (action === "transparent") {
        await downloadPng({ size: DEFAULT_SIZE, transparent: true });
        showStatus("Transparent PNG exported.");
      } else {
        await downloadPng({ size: DEFAULT_SIZE, transparent: false });
        showStatus("1600 px PNG exported.");
      }
    } catch (error) {
      console.error(error);
      showStatus(error?.message || "Export failed. Please try again.", true);
      global.dispatchEvent(new CustomEvent("cute:export-error", { detail: error }));
    } finally {
      setBusy(false);
    }
  }

  exportButton.addEventListener("click", () => {
    menuIsOpen() ? closeMenu(false) : openMenu(false);
  });

  exportButton.addEventListener("keydown", (event) => {
    if (["ArrowDown", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      openMenu(true);
    } else if (event.key === "Escape") {
      closeMenu(false);
    }
  });

  menu.addEventListener("click", (event) => {
    const item = event.target.closest("[data-export-action]");
    if (item) runAction(item.dataset.exportAction);
  });

  menu.addEventListener("keydown", (event) => {
    const index = items.indexOf(document.activeElement);
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu(true);
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    let nextIndex = index;
    if (event.key === "ArrowDown") nextIndex = (index + 1 + items.length) % items.length;
    if (event.key === "ArrowUp") nextIndex = (index - 1 + items.length) % items.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = items.length - 1;
    items[nextIndex]?.focus();
  });

  document.addEventListener("pointerdown", (event) => {
    if (menuIsOpen() && !control.contains(event.target)) closeMenu(false);
  });

  global.CuteExport = Object.freeze({
    defaultSize: DEFAULT_SIZE,
    getRecipeDocument: recipeDocument,
    makeFilename,
    buildSvg,
    renderPngBlob,
    downloadPng,
    copyRecipeJson,
    openMenu: () => openMenu(false),
    closeMenu: () => closeMenu(false)
  });

  global.dispatchEvent(new CustomEvent("cute:export-ready"));
})(window);
