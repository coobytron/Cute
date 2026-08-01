(function attachCuteAssetManifest(global) {
  "use strict";

  const DEFAULT_MANIFEST_URL = "assets/manifest.json";
  const cache = new Map();

  const legacyRecipeAliases = Object.freeze({
    "mochi-cat": "recipe-mochi-cat",
    "mimi-bunny": "recipe-mimi-bunny",
    "puff-bear": "recipe-puff-bear",
    "biscuit-pup": "recipe-biscuit-pup",
    "yuzu-fox": "recipe-yuzu-fox"
  });

  function indexManifest(manifest) {
    const assetsById = new Map(manifest.assets.map((asset) => [asset.id, asset]));
    const recipesById = new Map(manifest.recipes.map((recipe) => [recipe.id, recipe]));

    return Object.freeze({
      manifest,
      assetsById,
      recipesById,
      getAsset(id) {
        return assetsById.get(id) ?? null;
      },
      getRecipe(id) {
        const stableId = legacyRecipeAliases[id] ?? id;
        return recipesById.get(stableId) ?? null;
      },
      listAssets(type) {
        return manifest.assets.filter((asset) => !type || asset.type === type);
      },
      listRecipes(mode) {
        return manifest.recipes.filter((recipe) => !mode || recipe.mode === mode);
      },
      toCompositionState(recipeOrId) {
        const recipe = typeof recipeOrId === "string" ? this.getRecipe(recipeOrId) : recipeOrId;
        if (!recipe) return null;

        return {
          schemaVersion: manifest.schemaVersion,
          recipeId: recipe.id,
          mode: recipe.mode,
          completeFaceId: recipe.completeFaceId ?? null,
          partIds: { ...(recipe.partIds ?? {}) },
          paletteId: recipe.paletteId,
          expressionId: recipe.expressionId,
          finishId: recipe.finishId,
          backgroundId: recipe.backgroundId,
          frameId: recipe.frameId ?? null,
          transform: {
            scale: recipe.transform?.scale ?? 1,
            rotation: recipe.transform?.rotation ?? 0,
            flipX: recipe.transform?.flipX ?? false
          }
        };
      }
    });
  }

  function assertManifestShape(manifest) {
    if (!manifest || typeof manifest !== "object") {
      throw new TypeError("Cute asset manifest must be an object.");
    }
    if (!Number.isInteger(manifest.schemaVersion)) {
      throw new TypeError("Cute asset manifest is missing schemaVersion.");
    }
    if (!Array.isArray(manifest.assets) || !Array.isArray(manifest.recipes)) {
      throw new TypeError("Cute asset manifest must include assets and recipes arrays.");
    }

    const ids = new Set();
    for (const asset of manifest.assets) {
      if (!asset?.id || ids.has(asset.id)) {
        throw new TypeError(`Invalid or duplicate asset ID: ${asset?.id ?? "missing"}`);
      }
      ids.add(asset.id);
    }
  }

  async function load(url = DEFAULT_MANIFEST_URL, options = {}) {
    if (cache.has(url) && !options.force) {
      return cache.get(url);
    }

    const request = fetch(url, { cache: options.cache ?? "no-cache" })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Unable to load authored asset manifest (${response.status}).`);
        }
        return response.json();
      })
      .then((manifest) => {
        assertManifestShape(manifest);
        const indexed = indexManifest(manifest);
        global.dispatchEvent?.(new CustomEvent("cute:manifest-ready", { detail: indexed }));
        return indexed;
      })
      .catch((error) => {
        cache.delete(url);
        global.dispatchEvent?.(new CustomEvent("cute:manifest-error", { detail: error }));
        throw error;
      });

    cache.set(url, request);
    return request;
  }

  function loadStyle(source) {
    if (document.querySelector(`link[data-cute-style="${source}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = source;
    link.dataset.cuteStyle = source;
    document.head.appendChild(link);
  }

  function loadScript(source) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = source;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Unable to load ${source}.`));
      document.head.appendChild(script);
    });
  }

  function installCreativeControls() {
    loadStyle("assets/complete-face.css");
    loadStyle("assets/build-face.css");
    loadStyle("assets/art-direction.css");
    loadStyle("assets/history-saves.css");

    loadScript("complete-face.js")
      .then(() => global.CuteCompleteFaces?.ready)
      .then(() => loadScript("complete-face-state.js"))
      .then(() => loadScript("assets/build-face-manifest.js"))
      .then(() => loadScript("build-face.js"))
      .then(() => loadScript("art-direction.js"))
      .then(() => loadScript("art-direction-bootstrap.js"))
      .then(() => loadScript("history-saves.js"))
      .then(() => global.dispatchEvent?.(new CustomEvent("cute:creative-controls-ready")))
      .catch((error) => global.dispatchEvent?.(new CustomEvent("cute:creative-controls-error", { detail: error })));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installCreativeControls, { once: true });
  } else {
    installCreativeControls();
  }

  global.CuteAssetManifest = Object.freeze({
    defaultUrl: DEFAULT_MANIFEST_URL,
    legacyRecipeAliases,
    load,
    index: indexManifest,
    validateShape: assertManifestShape
  });
})(window);
