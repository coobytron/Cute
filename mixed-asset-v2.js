(() => {
  "use strict";

  const SUPPORTED_FORMATS = new Set(["svg", "png", "webp"]);
  const SUPPORTED_BLEND_MODES = new Set([
    "source-over", "multiply", "screen", "overlay", "soft-light", "hard-light",
    "color-dodge", "color-burn", "difference", "exclusion", "destination-in",
    "destination-out"
  ]);
  const imageCache = new Map();

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
    if (clean.endsWith(".svg")) return "svg";
    if (clean.endsWith(".png")) return "png";
    if (clean.endsWith(".webp")) return "webp";
    return "";
  }

  function normalizeAsset(asset, canonicalCanvas = { width: 1000, height: 1000 }) {
    if (!asset || typeof asset !== "object") {
      throw new MixedAssetError("INVALID_ASSET", "Asset must be an object.");
    }
    if (!asset.id) {
      throw new MixedAssetError("MISSING_ASSET_ID", "Every mixed asset layer requires a stable ID.");
    }

    const format = asset.format || inferFormat(asset.sourceFile);
    if (!SUPPORTED_FORMATS.has(format)) {
      throw new MixedAssetError(
        "UNSUPPORTED_FORMAT",
        `Unsupported asset format: ${format || "unknown"}`,
        { assetId: asset.id, sourceFile: asset.sourceFile }
      );
    }

    const nativeCanvas = asset.nativeCanvas || canonicalCanvas;
    const anchor = asset.anchor || { x: 0.5, y: 0.5 };
    const transform = asset.defaultTransform || {};
    const requestedBlend = asset.blendMode || "source-over";

    return Object.freeze({
      ...asset,
      format,
      layerRole: asset.layerRole || "base-color",
      visible: asset.visible !== false && asset.layerRole !== "effect-mask",
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
      blendMode: SUPPORTED_BLEND_MODES.has(requestedBlend) ? requestedBlend : "source-over",
      blendModeFallback: SUPPORTED_BLEND_MODES.has(requestedBlend) ? null : requestedBlend,
      tintable: Boolean(asset.tintable),
      maskRef: asset.maskRef || null
    });
  }

  function loadWithImage(sourceFile, signal) {
    if (!sourceFile) {
      return Promise.reject(new MixedAssetError("MISSING_SOURCE", "Asset sourceFile is required."));
    }

    if (!signal && imageCache.has(sourceFile)) return imageCache.get(sourceFile);

    const request = new Promise((resolve, reject) => {
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

    if (!signal) {
      imageCache.set(sourceFile, request);
      request.catch(() => imageCache.delete(sourceFile));
    }
    return request;
  }

  async function preloadAsset(asset, options = {}) {
    const normalized = normalizeAsset(asset, options.canonicalCanvas);
    try {
      const image = await loadWithImage(normalized.sourceFile, options.signal);
      return Object.freeze({ asset: normalized, image });
    } catch (error) {
      if (error?.name === "AbortError") throw error;
      throw error instanceof MixedAssetError
        ? error
        : new MixedAssetError(
            "LOAD_FAILURE",
            `Could not load ${normalized.sourceFile}.`,
            { assetId: normalized.id, cause: String(error) }
          );
    }
  }

  function configureCanvas(canvas, width, height, pixelRatio) {
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    if (canvas.style) {
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) throw new MixedAssetError("CANVAS_UNAVAILABLE", "Canvas 2D rendering is unavailable.");
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, width, height);
    return context;
  }

  function drawPlaceholder(context, asset, width, height, error) {
    context.save();
    context.globalCompositeOperation = "source-over";
    context.globalAlpha = 1;
    context.fillStyle = "rgba(255, 236, 230, .94)";
    context.strokeStyle = "#d85d55";
    context.lineWidth = Math.max(2, width / 250);
    context.setLineDash([12, 8]);
    context.fillRect(0, 0, width, height);
    context.strokeRect(8, 8, width - 16, height - 16);
    context.setLineDash([]);
    context.fillStyle = "#5b332f";
    context.font = `${Math.max(14, width / 32)}px system-ui, sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(`Missing asset: ${asset.id || asset.sourceFile || "unknown"}`, width / 2, height / 2 - 12);
    context.font = `${Math.max(11, width / 45)}px system-ui, sans-serif`;
    context.fillText(error?.code || "LOAD_FAILURE", width / 2, height / 2 + 24);
    context.restore();
  }

  function drawImageLayer(context, loaded, outputSize, overrides = {}) {
    const { asset, image } = loaded;
    const transform = asset.defaultTransform;
    const canonical = overrides.canonicalCanvas || { width: 1000, height: 1000 };
    const scaleX = outputSize.width / canonical.width;
    const scaleY = outputSize.height / canonical.height;
    const nativeWidth = image.naturalWidth || asset.nativeCanvas.width;
    const nativeHeight = image.naturalHeight || asset.nativeCanvas.height;
    const drawWidth = nativeWidth * transform.scale * scaleX / asset.pixelDensity;
    const drawHeight = nativeHeight * transform.scale * scaleY / asset.pixelDensity;
    const anchorX = asset.anchor.x * drawWidth;
    const anchorY = asset.anchor.y * drawHeight;

    context.save();
    context.globalAlpha = overrides.opacity ?? asset.opacity;
    context.globalCompositeOperation = overrides.blendMode || asset.blendMode;
    context.translate(transform.x * scaleX, transform.y * scaleY);
    context.rotate(transform.rotation * Math.PI / 180);
    context.scale(transform.flipX ? -1 : 1, 1);
    context.drawImage(image, -anchorX, -anchorY, drawWidth, drawHeight);
    context.restore();
  }

  function applyMask(layerCanvas, maskCanvas) {
    const context = layerCanvas.getContext("2d");
    if (!context) throw new MixedAssetError("CANVAS_UNAVAILABLE", "Mask canvas is unavailable.");
    context.save();
    context.globalCompositeOperation = "destination-in";
    context.globalAlpha = 1;
    context.drawImage(maskCanvas, 0, 0, layerCanvas.width, layerCanvas.height);
    context.restore();
    return layerCanvas;
  }

  async function compose(targetCanvas, assets, options = {}) {
    if (!(targetCanvas instanceof HTMLCanvasElement)) {
      throw new MixedAssetError("INVALID_CANVAS", "compose() requires an HTMLCanvasElement.");
    }
    if (!Array.isArray(assets) || !assets.length) {
      throw new MixedAssetError("EMPTY_COMPOSITION", "compose() requires at least one asset layer.");
    }

    const canonicalCanvas = options.canonicalCanvas || { width: 1000, height: 1000 };
    const width = Math.max(1, Number(options.width) || canonicalCanvas.width);
    const height = Math.max(1, Number(options.height) || canonicalCanvas.height);
    const pixelRatio = clamp(
      Number(options.pixelRatio) || window.devicePixelRatio || 1,
      1,
      Number(options.maxPixelRatio) || 3
    );
    const context = configureCanvas(targetCanvas, width, height, pixelRatio);

    const normalized = assets
      .map((asset) => normalizeAsset(asset, canonicalCanvas))
      .sort((a, b) => a.zOrder - b.zOrder || String(a.id).localeCompare(String(b.id)));
    const assetIds = new Set(normalized.map((asset) => asset.id));
    const loaded = new Map();
    const errors = [];
    const warnings = [];

    for (const asset of normalized) {
      if (asset.maskRef && !assetIds.has(asset.maskRef)) {
        errors.push({
          asset,
          error: new MixedAssetError("MISSING_MASK", `Missing mask ${asset.maskRef}.`, { assetId: asset.id })
        });
      }
      if (asset.blendModeFallback) {
        warnings.push({
          assetId: asset.id,
          code: "BLEND_MODE_FALLBACK",
          requested: asset.blendModeFallback,
          applied: asset.blendMode
        });
      }
    }

    await Promise.all(normalized.map(async (asset) => {
      try {
        loaded.set(asset.id, await preloadAsset(asset, { ...options, canonicalCanvas }));
      } catch (error) {
        errors.push({ asset, error });
      }
    }));

    for (const asset of normalized) {
      if (!asset.visible) continue;
      const entry = loaded.get(asset.id);
      if (!entry) {
        const failure = errors.find((item) => item.asset.id === asset.id);
        if (options.showPlaceholders !== false) drawPlaceholder(context, asset, width, height, failure?.error);
        continue;
      }

      if (!asset.maskRef) {
        drawImageLayer(context, entry, { width, height }, { canonicalCanvas });
        continue;
      }

      const maskEntry = loaded.get(asset.maskRef);
      if (!maskEntry) continue;

      const layerCanvas = document.createElement("canvas");
      const maskCanvas = document.createElement("canvas");
      const layerContext = configureCanvas(layerCanvas, width, height, pixelRatio);
      const maskContext = configureCanvas(maskCanvas, width, height, pixelRatio);
      drawImageLayer(layerContext, entry, { width, height }, {
        canonicalCanvas,
        opacity: 1,
        blendMode: "source-over"
      });
      drawImageLayer(maskContext, maskEntry, { width, height }, {
        canonicalCanvas,
        opacity: 1,
        blendMode: "source-over"
      });
      applyMask(layerCanvas, maskCanvas);

      context.save();
      context.globalAlpha = asset.opacity;
      context.globalCompositeOperation = asset.blendMode;
      context.drawImage(layerCanvas, 0, 0, width, height);
      context.restore();
    }

    return Object.freeze({
      width,
      height,
      pixelRatio,
      errors: Object.freeze(errors),
      warnings: Object.freeze(warnings),
      assetCount: normalized.length,
      visibleAssetCount: normalized.filter((asset) => asset.visible).length
    });
  }

  window.CuteMixedAssets = Object.freeze({
    version: 2,
    MixedAssetError,
    supportedFormats: Object.freeze([...SUPPORTED_FORMATS]),
    supportedBlendModes: Object.freeze([...SUPPORTED_BLEND_MODES]),
    inferFormat,
    normalizeAsset,
    preloadAsset,
    compose,
    clearCache: () => imageCache.clear()
  });
})();