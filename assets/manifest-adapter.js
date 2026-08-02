(function attachCuteAssetManifest(global) {
  "use strict";

  const DEFAULT_MANIFEST_URL = "assets/manifest.json";
  const ROSTER_EXPANSION_URL = "assets/roster-expansion.json";
  const cache = new Map();

  const legacyRecipeAliases = Object.freeze({
    "mochi-cat": "recipe-mochi-cat",
    "mimi-bunny": "recipe-mimi-bunny",
    "puff-bear": "recipe-puff-bear",
    "biscuit-pup": "recipe-biscuit-pup",
    "yuzu-fox": "recipe-yuzu-fox"
  });

  function expansionToAsset(character) {
    const accessory = character.compatibility?.accessoryAnchor || { x: 0.5, y: 0.2 };
    const effects = character.compatibility?.effects || "all";
    return {
      id: character.id,
      label: character.label,
      type: "complete-face",
      sourceFile: character.sourceFile,
      thumbnail: character.sourceFile,
      format: character.format || "svg",
      nativeCanvas: character.nativeCanvas || { width: 1000, height: 1000 },
      pixelDensity: character.pixelDensity || 1,
      anchor: character.anchor || { x: 0.5, y: 0.5 },
      defaultTransform: character.defaultTransform || { x: 500, y: 500, scale: 1, rotation: 0, flipX: false },
      zOrder: 250,
      speciesTags: [...(character.speciesTags || [])],
      compatibleAssetIds: [],
      supportedPalettes: [character.defaultPalette],
      exportBounds: character.exportBounds || { left: 90, top: 55, right: 910, bottom: 920 },
      defaultExpression: "happy",
      accessoryAnchor: {
        x: Math.round((accessory.x ?? 0.5) * 1000),
        y: Math.round((accessory.y ?? 0.2) * 1000)
      },
      attribution: character.attribution,
      personalityCue: character.personalityCue,
      silhouetteCue: character.silhouetteCue,
      earHeadTreatment: character.earHeadTreatment,
      effectCompatibility: effects === "all" ? {} : { note: effects },
      reviewStatus: character.reviewStatus
    };
  }

  function expansionToRecipe(character) {
    return {
      id: `recipe-${character.id.replace(/^face-/, "")}`,
      label: character.label,
      mode: "complete-face",
      completeFaceId: character.id,
      paletteId: character.defaultPalette,
      expressionId: "happy",
      finishId: "finish-classic-paper",
      backgroundId: "background-classic-paper",
      frameId: null,
      transform: { scale: 1, rotation: 0, flipX: false }
    };
  }

  async function mergeRosterExpansion(manifest, url) {
    if (url !== DEFAULT_MANIFEST_URL) return manifest;
    const response = await fetch(ROSTER_EXPANSION_URL, { cache: "no-cache" });
    if (!response.ok) throw new Error(`Unable to load roster expansion (${response.status}).`);
    const expansion = await response.json();
    if (!Array.isArray(expansion.characters)) throw new TypeError("Roster expansion must include characters.");

    const baseAssets = [...manifest.assets];
    const baseRecipes = [...manifest.recipes];
    const assetIds = new Set(baseAssets.map((asset) => asset.id));
    const recipeIds = new Set(baseRecipes.map((recipe) => recipe.id));

    for (const character of expansion.characters) {
      const asset = expansionToAsset(character);
      const recipe = expansionToRecipe(character);
      if (assetIds.has(asset.id) || recipeIds.has(recipe.id)) {
        throw new TypeError(`Roster expansion duplicates ${asset.id} or ${recipe.id}.`);
      }
      assetIds.add(asset.id);
      recipeIds.add(recipe.id);
      baseAssets.push(asset);
      baseRecipes.push(recipe);
    }

    return {
      ...manifest,
      assets: baseAssets,
      recipes: baseRecipes,
      rosterBaselineCount: expansion.baselineCount,
      rosterAdditionCount: expansion.additionCount,
      rosterTargetCount: expansion.targetCount,
      rosterExpansionSource: ROSTER_EXPANSION_URL
    };
  }

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
    if (!manifest || typeof manifest !== "object") throw new TypeError("Cute asset manifest must be an object.");
    if (!Number.isInteger(manifest.schemaVersion)) throw new TypeError("Cute asset manifest is missing schemaVersion.");
    if (!Array.isArray(manifest.assets) || !Array.isArray(manifest.recipes)) {
      throw new TypeError("Cute asset manifest must include assets and recipes arrays.");
    }
    const ids = new Set();
    for (const asset of manifest.assets) {
      if (!asset?.id || ids.has(asset.id)) throw new TypeError(`Invalid or duplicate asset ID: ${asset?.id ?? "missing"}`);
      ids.add(asset.id);
    }
  }

  async function load(url = DEFAULT_MANIFEST_URL, options = {}) {
    if (cache.has(url) && !options.force) return cache.get(url);

    const request = fetch(url, { cache: options.cache ?? "no-cache" })
      .then((response) => {
        if (!response.ok) throw new Error(`Unable to load authored asset manifest (${response.status}).`);
        return response.json();
      })
      .then((manifest) => mergeRosterExpansion(manifest, url))
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
    loadStyle("assets/export-menu.css");
    loadStyle("assets/responsive-a11y.css");

    loadScript("complete-face.js")
      .then(() => global.CuteCompleteFaces?.ready)
      .then(() => loadScript("complete-face-state.js"))
      .then(() => loadScript("assets/build-face-manifest.js"))
      .then(() => loadScript("build-face.js"))
      .then(() => loadScript("art-direction.js"))
      .then(() => loadScript("art-direction-bootstrap.js"))
      .then(() => loadScript("history-saves.js"))
      .then(() => loadScript("export-menu.js"))
      .then(() => loadScript("responsive-a11y.js"))
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
    rosterExpansionUrl: ROSTER_EXPANSION_URL,
    legacyRecipeAliases,
    load,
    index: indexManifest,
    validateShape: assertManifestShape
  });
})(window);
