(function installCompleteFaceLibrary(global) {
  "use strict";

  const manifestPaletteToLegacy = Object.freeze({
    "apricot-day": "tangerine",
    "lavender-dream": "lavender",
    "mint-tea": "mint",
    "butter-sun": "butter",
    "powder-sky": "sky"
  });
  const legacyPaletteToManifest = Object.freeze(Object.fromEntries(
    Object.entries(manifestPaletteToLegacy).map(([manifestId, legacyId]) => [legacyId, manifestId])
  ));
  const stageColors = Object.freeze({
    tangerine: "#FFE9BD",
    lavender: "#EDE3FA",
    mint: "#DCEFE4",
    butter: "#FFF0BA",
    sky: "#DDEEF7"
  });

  let indexedManifest = null;
  let completeRecipes = [];
  let assetsById = new Map();
  let recipesById = new Map();
  let legacyRecipeIds = new Map();
  let initialized = false;

  function escapeHtml(value) {
    return String(value).replace(/[&<>"]/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"
    }[character]));
  }
  function toDataUri(source) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;
  }
  function capitalize(value) {
    return value ? `${value[0].toUpperCase()}${value.slice(1)}` : "Animal";
  }
  function findRecipe(id) {
    if (!id) return null;
    return recipesById.get(id)
      || legacyRecipeIds.get(id)
      || completeRecipes.find((recipe) => recipe.completeFaceId === id)
      || null;
  }
  function currentRecipe() {
    return findRecipe(state?.manifestRecipeId)
      || findRecipe(state?.recipeId)
      || findRecipe(state?.completeFaceId)
      || null;
  }
  function currentAsset() {
    return assetsById.get(state?.completeFaceId) || null;
  }
  function serializeCurrent() {
    const recipe = currentRecipe();
    const asset = currentAsset();
    if (!recipe || !asset) return null;
    return {
      schemaVersion: indexedManifest.manifest.schemaVersion,
      mode: "complete-face",
      recipeId: recipe.id,
      completeFaceId: asset.id,
      paletteId: recipe.paletteId,
      expressionId: asset.defaultExpression || recipe.expressionId || "happy",
      transform: {
        scale: Number(state.scale || 100) / 100,
        rotation: Number(state.rotation || 0),
        flipX: Boolean(state.flipped)
      },
      name: state.name || recipe.label,
      favorite: Boolean(state.favorite)
    };
  }
  function emitSelection() {
    const recipe = currentRecipe();
    const asset = currentAsset();
    if (!recipe || !asset) return;
    global.dispatchEvent(new CustomEvent("cute:complete-face-change", {
      detail: {
        ...serializeCurrent(),
        label: asset.label,
        speciesTags: [...(asset.speciesTags || [])],
        supportedPalettes: [...(asset.supportedPalettes || [])],
        supportedPaletteKeys: (asset.supportedPalettes || [])
          .map((id) => manifestPaletteToLegacy[id])
          .filter(Boolean),
        supportedExpressions: [asset.defaultExpression || recipe.expressionId || "happy"]
      }
    }));
  }
  function stateFromRecipe(recipe, overrides = {}) {
    const asset = assetsById.get(recipe.completeFaceId);
    if (!asset) throw new RangeError(`Missing complete-face asset ${recipe.completeFaceId}.`);
    const transform = overrides.transform || recipe.transform || {};
    const legacyPalette = manifestPaletteToLegacy[recipe.paletteId] || "tangerine";
    return {
      ...defaultState,
      recipeId: recipe.legacyId || recipe.id,
      manifestRecipeId: recipe.id,
      completeFaceId: asset.id,
      palette: legacyPalette,
      eyes: "sparkle",
      finish: "clean",
      scale: Math.round((transform.scale ?? 1) * 100),
      rotation: transform.rotation ?? 0,
      flipped: transform.flipX ?? false,
      favorite: Boolean(overrides.favorite),
      name: overrides.name || recipe.label,
      mode: "recipes",
      category: state?.category || "head"
    };
  }
  function selectRecipe(recipeOrId, overrides = {}) {
    const recipe = typeof recipeOrId === "string" ? findRecipe(recipeOrId) : recipeOrId;
    if (!recipe) throw new RangeError(`Unknown complete-face recipe: ${recipeOrId}`);
    state = stateFromRecipe(recipe, overrides);
    syncModeTabs();
    renderFace();
    renderSaved();
    emitSelection();
  }
  function completeTransform(snapshot) {
    const scale = Number(snapshot.scale || 100) / 100;
    const rotation = Number(snapshot.rotation || 0);
    const flipX = snapshot.flipped ? -1 : 1;
    return `translate(500 500) rotate(${rotation}) scale(${scale * flipX} ${scale}) translate(-500 -500)`;
  }
  function completeSvg(snapshot, includeBackground = true) {
    const asset = assetsById.get(snapshot.completeFaceId);
    if (!asset) return "";
    const background = stageColors[snapshot.palette] || stageColors.tangerine;
    return `<svg viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeHtml(asset.label)}">${includeBackground ? `<rect width="1000" height="1000" rx="70" fill="${background}"/>` : ""}<g transform="${completeTransform(snapshot)}"><image href="${asset.dataUri}" width="1000" height="1000" preserveAspectRatio="xMidYMid meet"/></g></svg>`;
  }
  function renderCompleteFace() {
    const asset = currentAsset();
    const recipe = currentRecipe();
    if (!asset || !recipe) return false;
    const renderRoot = document.getElementById("renderRoot");
    const stage = document.getElementById("stage");
    if (!renderRoot || !stage) return false;

    renderRoot.innerHTML = `<g data-complete-face-id="${asset.id}" transform="${completeTransform(state)}"><image href="${asset.dataUri}" width="1000" height="1000" preserveAspectRatio="xMidYMid meet"/></g>`;
    stage.style.background = stageColors[state.palette] || stageColors.tangerine;

    const characterTitle = document.getElementById("characterTitle");
    const stageStatus = document.getElementById("stageStatus");
    const recipeCode = document.getElementById("recipeCode");
    const scaleControl = document.getElementById("scaleControl");
    const rotationControl = document.getElementById("rotationControl");
    const scaleOutput = document.getElementById("scaleOutput");
    const rotationOutput = document.getElementById("rotationOutput");
    const nameInput = document.getElementById("nameInput");
    const favoriteButton = document.getElementById("favoriteButton");

    if (characterTitle) characterTitle.textContent = state.name || asset.label;
    if (stageStatus) stageStatus.textContent = "Complete authored face";
    if (recipeCode) recipeCode.textContent = `${asset.id} · ${recipe.id}`.toUpperCase();
    if (scaleControl) scaleControl.value = state.scale;
    if (rotationControl) rotationControl.value = state.rotation;
    if (scaleOutput) scaleOutput.textContent = `${state.scale}%`;
    if (rotationOutput) rotationOutput.textContent = `${state.rotation}°`;
    if (nameInput) nameInput.value = state.name || asset.label;
    if (favoriteButton) {
      favoriteButton.classList.toggle("is-active", Boolean(state.favorite));
      favoriteButton.setAttribute("aria-pressed", String(Boolean(state.favorite)));
      favoriteButton.textContent = state.favorite ? "♥ Favourite" : "♡ Favourite";
    }
    renderCompleteLibrary();
    emitSelection();
    return true;
  }
  function renderCompleteLibrary() {
    const library = document.getElementById("recipeLibrary");
    const count = document.getElementById("assetCount");
    if (!library) return;
    library.innerHTML = completeRecipes.map((recipe) => {
      const asset = assetsById.get(recipe.completeFaceId);
      const selected = state?.mode === "recipes" && state?.completeFaceId === asset.id;
      const palette = manifestPaletteToLegacy[recipe.paletteId] || "tangerine";
      const species = capitalize(asset.speciesTags?.[0]);
      return `<button class="recipe-card${selected ? " is-active" : ""}" data-complete-recipe="${recipe.id}" type="button" aria-pressed="${selected}"><span class="recipe-thumb" style="background:${stageColors[palette]}"><img src="${asset.dataUri}" alt="" /></span><span class="recipe-meta"><strong>${escapeHtml(recipe.label)}</strong><span>${escapeHtml(species)} · Authored face</span></span><span class="recipe-arrow" aria-hidden="true">→</span></button>`;
    }).join("");
    library.querySelectorAll("[data-complete-recipe]").forEach((button) => {
      button.addEventListener("click", () => selectRecipe(button.dataset.completeRecipe));
    });
    if (count) count.textContent = `${completeRecipes.length} complete faces`;
  }
  function renderManifestSaved() {
    const grid = document.getElementById("savedGrid");
    if (!grid) return;
    if (!saved.length) {
      grid.innerHTML = completeRecipes.slice(0, 3).map((recipe) => {
        const snapshot = stateFromRecipe(recipe);
        return `<button class="saved-card" data-complete-seed="${recipe.id}" type="button">${completeSvg(snapshot)}<span>${escapeHtml(recipe.label)}</span></button>`;
      }).join("");
      grid.querySelectorAll("[data-complete-seed]").forEach((button) => {
        button.addEventListener("click", () => selectRecipe(button.dataset.completeSeed));
      });
      return;
    }
    grid.innerHTML = saved.map((snapshot, index) => `<button class="saved-card" data-saved="${index}" type="button">${smallSvg(snapshot)}<span>${escapeHtml(snapshot.name || "Saved cutie")}</span></button>`).join("");
    grid.querySelectorAll("[data-saved]").forEach((button) => {
      button.addEventListener("click", () => {
        const snapshot = saved[Number(button.dataset.saved)];
        if (snapshot?.completeFaceId) {
          const recipe = findRecipe(snapshot.manifestRecipeId)
            || findRecipe(snapshot.recipeId)
            || findRecipe(snapshot.completeFaceId);
          if (recipe) {
            state = {
              ...stateFromRecipe(recipe, {
                name: snapshot.name,
                favorite: snapshot.favorite,
                transform: {
                  scale: Number(snapshot.scale || 100) / 100,
                  rotation: Number(snapshot.rotation || 0),
                  flipX: Boolean(snapshot.flipped)
                }
              }),
              ...snapshot,
              mode: "recipes"
            };
            syncModeTabs();
            renderFace();
            emitSelection();
          }
          return;
        }
        state = { ...defaultState, ...snapshot, mode: "parts" };
        syncModeTabs();
        renderFace();
      });
    });
  }
  function installOverrides() {
    const legacyRenderFace = renderFace;
    renderFace = function renderManifestCompleteFace(...args) {
      if (state?.mode === "recipes" && state?.completeFaceId && assetsById.has(state.completeFaceId)) {
        renderCompleteFace();
        return;
      }
      return legacyRenderFace(...args);
    };
    const legacyRenderRecipeLibrary = renderRecipeLibrary;
    renderRecipeLibrary = function renderManifestRecipeLibrary() {
      if (initialized) return renderCompleteLibrary();
      return legacyRenderRecipeLibrary();
    };
    const legacyApplyRecipe = applyRecipe;
    applyRecipe = function applyManifestRecipe(recipeId) {
      const recipe = findRecipe(recipeId);
      if (recipe) return selectRecipe(recipe);
      return legacyApplyRecipe(recipeId);
    };
    const legacySmallSvg = smallSvg;
    smallSvg = function smallManifestSvg(snapshot, background = true) {
      if (snapshot?.completeFaceId && assetsById.has(snapshot.completeFaceId)) return completeSvg(snapshot, background);
      return legacySmallSvg(snapshot, background);
    };
    const legacyRenderSaved = renderSaved;
    renderSaved = function renderManifestSavedOrLegacy() {
      if (initialized) return renderManifestSaved();
      return legacyRenderSaved();
    };
    const legacyShuffleFace = shuffleFace;
    shuffleFace = function shuffleManifestFace() {
      if (state?.mode === "recipes") {
        const recipe = completeRecipes[Math.floor(Math.random() * completeRecipes.length)];
        return selectRecipe(recipe);
      }
      return legacyShuffleFace();
    };
    const legacyResetFace = resetFace;
    resetFace = function resetManifestFace() {
      if (state?.mode === "recipes") return selectRecipe(currentRecipe() || completeRecipes[0]);
      return legacyResetFace();
    };
  }
  async function loadAsset(asset) {
    const response = await fetch(asset.sourceFile, { cache: "no-cache" });
    if (!response.ok) throw new Error(`Unable to load complete-face asset ${asset.id} (${response.status}).`);
    const source = await response.text();
    return Object.freeze({ ...asset, source, dataUri: toDataUri(source) });
  }
  async function initialize() {
    indexedManifest = await global.CuteAssetManifest.load();
    const manifestRecipes = indexedManifest.listRecipes("complete-face");
    const manifestAssets = indexedManifest.listAssets("complete-face")
      .filter((asset) => asset.reviewStatus === "approved");
    const loadedAssets = await Promise.all(manifestAssets.map(loadAsset));
    assetsById = new Map(loadedAssets.map((asset) => [asset.id, asset]));
    completeRecipes = manifestRecipes.filter((recipe) => assetsById.has(recipe.completeFaceId));
    recipesById = new Map(completeRecipes.map((recipe) => [recipe.id, recipe]));
    legacyRecipeIds = new Map(completeRecipes
      .filter((recipe) => recipe.legacyId)
      .map((recipe) => [recipe.legacyId, recipe]));

    const expectedCount = indexedManifest.manifest.rosterTargetCount || completeRecipes.length;
    if (completeRecipes.length !== expectedCount) {
      throw new Error(`Expected ${expectedCount} approved complete-face recipes; found ${completeRecipes.length}.`);
    }

    installOverrides();
    initialized = true;
    selectRecipe(findRecipe(state?.recipeId) || completeRecipes[0]);
    global.dispatchEvent(new CustomEvent("cute:complete-faces-ready", {
      detail: { count: completeRecipes.length }
    }));
    return api;
  }

  const ready = initialize().catch((error) => {
    const library = document.getElementById("recipeLibrary");
    if (library) library.innerHTML = `<p class="complete-face-loading" role="alert">The authored complete-face library could not load. Serve the repository through a local web server and refresh.</p>`;
    global.dispatchEvent(new CustomEvent("cute:complete-faces-error", { detail: error }));
    throw error;
  });

  const api = Object.freeze({
    ready,
    getState: () => serializeCurrent(),
    select: (recipeId) => selectRecipe(recipeId),
    restore(next) {
      if (!next?.completeFaceId && !next?.recipeId) throw new TypeError("A serialized complete-face composition is required.");
      const recipe = findRecipe(next.recipeId) || findRecipe(next.completeFaceId);
      if (!recipe) throw new RangeError("The complete-face recipe is not available.");
      selectRecipe(recipe, { name: next.name, favorite: next.favorite, transform: next.transform });
    },
    listRecipes: () => completeRecipes.map((recipe) => ({ ...recipe, transform: { ...recipe.transform } })),
    listAssets: () => [...assetsById.values()].map((asset) => ({
      ...asset,
      source: undefined,
      dataUri: undefined,
      supportedPalettes: [...(asset.supportedPalettes || [])],
      speciesTags: [...(asset.speciesTags || [])]
    })),
    getActiveAsset: () => {
      const asset = currentAsset();
      return asset ? {
        ...asset,
        source: undefined,
        dataUri: undefined,
        supportedPalettes: [...(asset.supportedPalettes || [])],
        speciesTags: [...(asset.speciesTags || [])]
      } : null;
    },
    legacyPaletteToManifest,
    manifestPaletteToLegacy
  });

  global.CuteCompleteFaces = api;
})(window);
