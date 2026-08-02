(function installMixedAssetExport(global) {
  "use strict";

  const DEFAULT_SIZE = 1600;
  let originalExport = null;

  function integration() {
    return global.CuteMixedAssetIntegration;
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

  function filename(options = {}) {
    const state = integration()?.getState?.();
    const suffix = options.transparent ? "transparent" : "1600px";
    return `${sanitizeFilename(state?.label || state?.fixtureId || "mixed-cute-face")}-${suffix}.png`;
  }

  function downloadBlob(blob, name) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.hidden = true;
    document.body.appendChild(link);
    link.click();
    link.remove();
    global.setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  async function renderPngBlob(options = {}) {
    if (!integration()?.isActive?.()) return originalExport.renderPngBlob(options);
    return integration().renderPngBlob({
      size: options.size || DEFAULT_SIZE,
      transparent: Boolean(options.transparent)
    });
  }

  async function downloadPng(options = {}) {
    if (!integration()?.isActive?.()) return originalExport.downloadPng(options);
    const normalized = {
      size: options.size || DEFAULT_SIZE,
      transparent: Boolean(options.transparent)
    };
    const blob = await renderPngBlob(normalized);
    downloadBlob(blob, filename(normalized));
    return blob;
  }

  function recipeDocument() {
    if (!integration()?.isActive?.()) return originalExport.getRecipeDocument();
    return {
      format: "cute-face-recipe",
      version: 1,
      product: "Cute Face Builder",
      snapshot: {
        schemaVersion: 2,
        mode: "mixed-complete-face",
        composer: integration().getState(),
        artDirection: global.CuteArtDirection?.getState?.() || null,
        title: integration().getState()?.label || "Mixed cute face"
      }
    };
  }

  async function copyRecipeJson() {
    if (!integration()?.isActive?.()) return originalExport.copyRecipeJson();
    const text = JSON.stringify(recipeDocument(), null, 2);
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
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
    return text;
  }

  function showStatus(message, isError = false) {
    const status = document.querySelector(".export-status");
    if (!status) return;
    status.hidden = false;
    status.classList.toggle("is-error", isError);
    status.textContent = message;
    global.setTimeout(() => {
      status.hidden = true;
      status.classList.remove("is-error");
      status.textContent = "";
    }, isError ? 7000 : 3200);
  }

  async function interceptMenuAction(event) {
    if (!integration()?.isActive?.()) return;
    if (global.CuteExportEffects?.isEnabled?.()) return;
    const item = event.target.closest?.("[data-export-action]");
    if (!item) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    const action = item.dataset.exportAction;
    const exportButton = document.querySelector('[aria-controls="exportMenu"]');
    const menu = document.getElementById("exportMenu");
    if (menu) menu.hidden = true;
    if (exportButton) exportButton.setAttribute("aria-expanded", "false");

    try {
      if (action === "recipe") {
        await copyRecipeJson();
        showStatus("Mixed-media recipe JSON copied.");
      } else {
        await downloadPng({ size: DEFAULT_SIZE, transparent: action === "transparent" });
        showStatus(action === "transparent" ? "Transparent mixed-media PNG exported." : "1600 px mixed-media PNG exported.");
      }
      global.dispatchEvent(new CustomEvent("cute:mixed-export-complete", { detail: { action } }));
    } catch (error) {
      console.error(error);
      showStatus(error?.message || "Mixed-media export failed.", true);
      global.dispatchEvent(new CustomEvent("cute:export-error", { detail: error }));
    }
  }

  function install() {
    originalExport = global.CuteExport;
    if (!originalExport) return;

    document.addEventListener("click", interceptMenuAction, true);
    global.CuteExport = Object.freeze({
      ...originalExport,
      getRecipeDocument: recipeDocument,
      makeFilename: (options = {}) => integration()?.isActive?.() ? filename(options) : originalExport.makeFilename(options),
      renderPngBlob,
      downloadPng,
      copyRecipeJson
    });
    global.dispatchEvent(new CustomEvent("cute:mixed-export-ready"));
  }

  if (global.CuteExport) install();
  else global.addEventListener("cute:export-ready", install, { once: true });
})(window);