(function installCuteEffectsExport(global) {
  "use strict";

  const engine = global.CuteEffects;
  const controller = global.CuteEffectsController;
  const sourceExport = global.CuteExport;
  if (!engine || !controller || !sourceExport) return;

  function imageFromBlob(blob) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const image = new Image();
      image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
      image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("The exported PNG could not be decoded for effects.")); };
      image.src = url;
    });
  }

  async function applyToBlob(blob, options = {}) {
    if (!controller.getState().enabled) return blob;
    const image = await imageFromBlob(blob);
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth || options.size || 1600;
    canvas.height = image.naturalHeight || options.size || 1600;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Canvas rendering is unavailable for effects export.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const tierId = controller.getResolvedPerformanceTier();
    const config = await engine.loadConfig();
    const tier = config.performanceTiers?.[tierId] || config.performanceTiers?.standard || {};
    engine.apply(canvas, controller.getResolvedEffects({ transparent: Boolean(options.transparent) }), {
      seed: controller.getState().seed,
      particleLimit: Number(tier.particleLimit || 84)
    });
    return await new Promise((resolve, reject) => canvas.toBlob((png) => png ? resolve(png) : reject(new Error("Effects PNG encoding failed.")), "image/png"));
  }

  async function renderPngBlob(options = {}) {
    const source = await sourceExport.renderPngBlob(options);
    return applyToBlob(source, options);
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
    const blob = await renderPngBlob(options);
    downloadBlob(blob, sourceExport.makeFilename(options));
    return blob;
  }

  function getRecipeDocument() {
    const document = sourceExport.getRecipeDocument();
    return {
      ...document,
      snapshot: {
        ...document.snapshot,
        effects: controller.getState()
      }
    };
  }

  async function copyText(text) {
    if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
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
    const text = JSON.stringify(getRecipeDocument(), null, 2);
    await copyText(text);
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

  const api = Object.freeze({
    ...sourceExport,
    getRecipeDocument,
    renderPngBlob,
    downloadPng,
    copyRecipeJson,
    applyToBlob,
    showStatus,
    isEnabled: () => Boolean(controller.getState().enabled)
  });
  global.CuteExport = api;
  global.CuteExportEffects = api;
  global.dispatchEvent(new CustomEvent("cute:effects-export-ready"));
})(window);
