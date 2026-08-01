(() => {
  "use strict";

  const SUPPORTED_FORMATS = new Set(["svg", "png", "webp"]);
  const SUPPORTED_BLEND_MODES = new Set([
    "source-over", "multiply", "screen", "overlay", "soft-light", "hard-light",
    "color-dodge", "color-burn", "difference", "exclusion", "destination-in",
    "destination-out"
  ]);

  class MixedAssetError extends Error {
    constructor(code, message, context = {}) {
      super(message);
      this.name = "MixedAssetError";
      this.code = code;
      this.context = context;
    }
  }

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function inferFormat(sourceFile = "") {
    const clean = String(sourceFile).split(/[?#]/)[0].toLowerCase();
    return clean.endsWith(".svg") ? "svg" : clean.endsWith(".png") ? "png" : clean.endsWith(".webp") ? "webp" : "";
  }

  function normalizeAsset(asset, canonicalCanvas = { width: 1000, height: 1000 }) {
    if (!asset || typeof asset !== "object") {
      throw new MixedAssetError("INVALID_ASSET", "Asset must be an object.");
    }

    const format = asset.format || inferFormat(asset.sourceFile);
    if (!SUPPORTED_FORMATS.has(format)) {
      throw new MixedAssetError("UNSUPPORTED_FORMAT", `Unsupported asset format: ${format || "unknown"}`, { assetId: asset.id });
    }

    const nativeCanvas = asset.nativeCanvas || canonicalCanvas;
    const anchor = asset.anchor || { x: 0.5, y: 0.5 };
    const transform = asset.defaultTransform || {};
    const blendMode = SUPPORTED_BLEND_MODES.has(asset.blendMode) ? asset.blendMode : "source-over";

    return {
      ...asset,
      format,
      nativeCanvas: {
        width: Math.max(1, Number(nativeCanvas.width) || canonicalCanvas.width),
        height: Math.max(1, Number(nativeCanvas.height) || canonicalCanvas.height)
      },
      pixelDensity: Math.max(1, Number(asset.pixelDensity) || 1),
      anchor: {
        x: clamp(Number(anchor.x) || 0, 0, 1),
        y: clamp(Number(anchor.y) || 0, 0, 1)
      },
      defaultTransform: {
        x: Number.isFinite(Number(transform.x)) ? Number(transform.x) : canonicalCanvas.width / 2,
        y: Number.isFinite(Number(transform.y)) ? Number(transform.y) : canonicalCanvas.height / 2,
        scale: Math.max(0.001, Number(transform.scale) || 1),
        rotation: Number(transform.rotation) || 0,
        flipX: Boolean(transform.flipX)
      },
      zOrder: Number(asset.zOrder) || 0,
      opacity: clamp(Number(asset.opacity ?? 1), 0, 1),
      blendMode,
      tintable: Boolean(asset.tintable),
      maskRef: asset.maskRef || null
    };
  }

  function loadWithImage(sourceFile, signal) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = "async";
      image.crossOrigin = "anonymous";

      const cleanup = () => {
        image.onload = null;
        image.onerror = null;
        signal?.removeEventListener("abort", onAbort);
      };
      const onAbort = () => {
        cleanup();
        reject(new DOMException("Asset load aborted.", "AbortError"));
      };

      image.onload = async () => {
        try {
          if (typeof image.decode === "function") await image.decode().catch(() => undefined);
          cleanup();
          resolve(image);
        } catch (error) {
          cleanup();
          reject(error);
        }
      };
      image.onerror = () => {
        cleanup();
        reject(new MixedAssetError("DECODE_FAILURE", `Could not decode ${sourceFile}.`, { sourceFile }));
      };
      signal?.addEventListener("abort", onAbort, { once: true });
      image.src = sourceFile;
    });
  }

  async function preloadAsset(asset, options = {}) {
    const normalized = normalizeAsset(asset, options.canonicalCanvas);
    try {
      const image = await loadWithImage(normalized.sourceFile, options.signal);
      return { asset: normalized, image };
    } catch (error) {
      if (error?.name === "AbortError") throw error;
      throw error instanceof MixedAssetError
        ? error
        : new MixedAssetError("LOAD_FAILURE", `Could not load ${normalized.sourceFile}.`, { assetId: normalized.id, cause: String(error) });
    }
  }

  function drawPlaceholder(ctx, asset, width, height, error) {
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(255, 236, 230, .94)";
    ctx.strokeStyle = "#d85d55";
    ctx.lineWidth = Math.max(2, width / 250);
    ctx.setLineDash([12, 8]);
    ctx.fillRect(0, 0, width, height);
    ctx.strokeRect(8, 8, width - 16, height - 16);
    ctx.setLineDash([]);
    ctx.fillStyle = "#5b332f";
    ctx.font = `${Math.max(14, width / 32)}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`Missing asset: ${asset.id || asset.sourceFile || "unknown"}`, width / 2, height / 2 - 12);
    ctx.font = `${Math.max(11, width / 45)}px system-ui, sans-serif`;
    ctx.fillText(error?.code || "LOAD_FAILURE", width / 2, height / 2 + 24);
    ctx.restore();
  }

  function drawLoadedLayer(ctx, loaded, outputSize) {
    const { asset, image } = loaded;
    const transform = asset.defaultTransform;
    const scaleX = outputSize.width / 1000;
    const scaleY = outputSize.height / 1000;
    const nativeWidth = image.naturalWidth || asset.nativeCanvas.width;
    const nativeHeight = image.naturalHeight || asset.nativeCanvas.height;
    const drawWidth = nativeWidth * transform.scale * scaleX / asset.pixelDensity;
    const drawHeight = nativeHeight * transform.scale * scaleY / asset.pixelDensity;
    const anchorX = asset.anchor.x * drawWidth;
    const anchorY = asset.anchor.y * drawHeight;

    ctx.save();
    ctx.globalAlpha = asset.opacity;
    ctx.globalCompositeOperation = asset.blendMode;
    ctx.translate(transform.x * scaleX, transform.y * scaleY);
    ctx.rotate(transform.rotation * Math.PI / 180);
    ctx.scale(transform.flipX ? -1 : 1, 1);
    ctx.drawImage(image, -anchorX, -anchorY, drawWidth, drawHeight);
    ctx.restore();
  }

  function applyMask(layerCanvas, maskCanvas) {
    const ctx = layerCanvas.getContext("2d");
    ctx.save();
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(maskCanvas, 0, 0, layerCanvas.width, layerCanvas.height);
    ctx.restore();
    return layerCanvas;
  }

  async function compose(targetCanvas, assets, options = {}) {
    if (!(targetCanvas instanceof HTMLCanvasElement)) {
      throw new MixedAssetError("INVALID_CANVAS", "compose() requires an HTMLCanvasElement.");
    }

    const width = Math.max(1, Number(options.width) || targetCanvas.width || 1000);
    const height = Math.max(1, Number(options.height) || targetCanvas.height || 1000);
    const pixelRatio = clamp(Number(options.pixelRatio) || window.devicePixelRatio || 1, 1, Number(options.maxPixelRatio) || 3);
    targetCanvas.width = Math.round(width * pixelRatio);
    targetCanvas.height = Math.round(height * pixelRatio);
    targetCanvas.style.width = `${width}px`;
    targetCanvas.style.height = `${height}px`;

    const ctx = targetCanvas.getContext("2d", { alpha: true });
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const normalized = assets.map((asset) => normalizeAsset(asset, options.canonicalCanvas)).sort((a, b) => a.zOrder - b.zOrder || String(a.id).localeCompare(String(b.id)));
    const loaded = new Map();
    const errors = [];

    await Promise.all(normalized.map(async (asset) => {
      try {
        loaded.set(asset.id, await preloadAsset(asset, options));
      } catch (error) {
        errors.push({ asset, error });
      }
    }));

    for (const asset of normalized) {
      const entry = loaded.get(asset.id);
      if (!entry) {
        const failure = errors.find((item) => item.asset.id === asset.id);
        if (options.showPlaceholders !== false) drawPlaceholder(ctx, asset, width, height, failure?.error);
        continue;
      }

      if (!asset.maskRef) {
        drawLoadedLayer(ctx, entry, { width, height });
        continue;
      }

      const maskEntry = loaded.get(asset.maskRef);
      if (!maskEntry) {
        errors.push({ asset, error: new MixedAssetError("MISSING_MASK", `Missing mask ${asset.maskRef}.`, { assetId: asset.id }) });
        continue;
      }

      const layerCanvas = document.createElement("canvas");
      const maskCanvas = document.createElement("canvas");
      layerCanvas.width = maskCanvas.width = Math.round(width * pixelRatio);
      layerCanvas.height = maskCanvas.height = Math.round(height * pixelRatio);
      const layerCtx = layerCanvas.getContext("2d");
      const maskCtx = maskCanvas.getContext("2d");
      layerCtx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      maskCtx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      drawLoadedLayer(layerCtx, entry, { width, height });
      drawLoadedLayer(maskCtx, maskEntry, { width, height });
      applyMask(layerCanvas, maskCanvas);
      ctx.drawImage(layerCanvas, 0, 0, width, height);
    }

    return { width, height, pixelRatio, errors, assetCount: normalized.length };
  }

  window.CuteMixedAssets = Object.freeze({
    version: 1,
    MixedAssetError,
    supportedFormats: Object.freeze([...SUPPORTED_FORMATS]),
    supportedBlendModes: Object.freeze([...SUPPORTED_BLEND_MODES]),
    inferFormat,
    normalizeAsset,
    preloadAsset,
    compose
  });
})();
