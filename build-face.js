(function installBuildFace(global) {
  "use strict";

  const manifest = global.CuteBuildFaceManifest;
  if (!manifest) return;

  const paletteMap = {
    tangerine: { head: "#F6A65E", secondary: "#E77B4C", muzzle: "#FFF1DB", blush: "#FF786B" },
    lavender: { head: "#D9C8F4", secondary: "#B99BEA", muzzle: "#F8F1FF", blush: "#FF93A5" },
    mint: { head: "#BFE2CF", secondary: "#7FC5A2", muzzle: "#F2FFF8", blush: "#FF8F91" },
    butter: { head: "#F4C84D", secondary: "#D8A63B", muzzle: "#FFF4D3", blush: "#FF806F" },
    sky: { head: "#BFDDED", secondary: "#7FB5D2", muzzle: "#F4FBFF", blush: "#FF8E88" }
  };

  function stateFromRecipe(recipe) {
    return {
      recipeId: recipe.id,
      label: recipe.label,
      palette: recipe.palette,
      partIds: { ...recipe.partIds },
      transform: {
        scale: recipe.transform?.scale ?? 1,
        rotation: recipe.transform?.rotation ?? 0,
        flipX: recipe.transform?.flipX ?? false
      }
    };
  }

  const firstRecipe = manifest.recipes[0];
  let mode = "recipes";
  let category = "base";
  let shuffleIndex = 0;
  let state = stateFromRecipe(firstRecipe);

  const els = {
    tabs: [...document.querySelectorAll(".mode-tab")],
    recipeLibrary: document.getElementById("recipeLibrary"),
    partLibrary: document.getElementById("partLibrary"),
    categoryTabs: document.getElementById("categoryTabs"),
    partGrid: document.getElementById("partGrid"),
    renderRoot: document.getElementById("renderRoot"),
    title: document.getElementById("characterTitle"),
    status: document.getElementById("stageStatus"),
    code: document.getElementById("recipeCode"),
    count: document.getElementById("assetCount"),
    scale: document.getElementById("scaleControl"),
    rotation: document.getElementById("rotationControl"),
    scaleOutput: document.getElementById("scaleOutput"),
    rotationOutput: document.getElementById("rotationOutput")
  };

  function markCustom() {
    state.recipeId = null;
    state.label = "Custom cute friend";
  }

  function compatibleAssets(type) {
    const baseId = state.partIds.base;
    return manifest.assets.filter((item) => item.type === type && (type === "base" || item.compatibleBases.includes(baseId)));
  }

  function repairCompatibility() {
    for (const type of manifest.categories.slice(1)) {
      const allowed = compatibleAssets(type);
      if (!allowed.some((item) => item.id === state.partIds[type])) {
        state.partIds[type] = allowed[0]?.id ?? null;
      }
    }
  }

  function setRecipe(recipe) {
    if (!recipe) return;
    state = stateFromRecipe(recipe);
    mode = "parts";
    repairCompatibility();
    renderAll();
  }

  function setPart(type, id) {
    state.partIds[type] = id;
    if (type === "base") repairCompatibility();
    markCustom();
    renderAll();
  }

  function renderCategories() {
    els.categoryTabs.innerHTML = manifest.categories.map((type) => {
      const active = type === category ? " is-active" : "";
      const label = type === "base" ? "Bases" : type === "accessory" ? "Accessories" : `${type[0].toUpperCase()}${type.slice(1)}`;
      return `<button type="button" class="category-tab${active}" data-build-category="${type}" aria-pressed="${type === category}">${label}</button>`;
    }).join("");

    els.categoryTabs.querySelectorAll("[data-build-category]").forEach((button) => button.addEventListener("click", () => {
      category = button.dataset.buildCategory;
      renderCategories();
      renderParts();
    }));
  }

  function renderParts() {
    const items = compatibleAssets(category);
    if (!items.length) {
      els.partGrid.innerHTML = '<p class="part-empty" role="status">No approved parts are available for this base.</p>';
      return;
    }

    els.partGrid.innerHTML = items.map((item) => {
      const isSelected = state.partIds[category] === item.id;
      const selectedClass = isSelected ? " is-selected" : "";
      const preview = item.markup || '<circle cx="500" cy="500" r="80" fill="none" stroke="currentColor" stroke-dasharray="18 18"/>';
      return `<button type="button" class="part-card${selectedClass}" data-build-part="${item.id}" aria-pressed="${isSelected}"><svg viewBox="0 0 1000 1000" aria-hidden="true"><g style="--head:#f6a65e;--secondary:#e77b4c;--muzzle:#fff1db;--blush:#ff786b">${preview}</g></svg><span>${item.label}</span></button>`;
    }).join("");

    els.partGrid.querySelectorAll("[data-build-part]").forEach((button) => {
      button.addEventListener("click", () => setPart(category, button.dataset.buildPart));
    });
  }

  function renderRecipes() {
    els.recipeLibrary.innerHTML = manifest.recipes.map((recipe) => {
      const isSelected = state.recipeId === recipe.id;
      return `<button type="button" class="recipe-card${isSelected ? " is-selected" : ""}" data-build-recipe="${recipe.id}" aria-pressed="${isSelected}"><span class="recipe-thumb" aria-hidden="true">✦</span><span>${recipe.label}</span></button>`;
    }).join("");

    els.recipeLibrary.querySelectorAll("[data-build-recipe]").forEach((button) => {
      button.addEventListener("click", () => setRecipe(manifest.recipes.find((recipe) => recipe.id === button.dataset.buildRecipe)));
    });
  }

  function layerTransform(item) {
    const baseTransform = item.defaultTransform || {};
    const override = item.overrides?.[state.partIds.base] || {};
    const transform = { ...baseTransform, ...override };
    const x = transform.x ?? 0;
    const y = transform.y ?? 0;
    const scale = transform.scale ?? 1;
    const rotation = transform.rotation ?? 0;

    return `translate(${x} ${y}) translate(500 500) rotate(${rotation}) scale(${scale}) translate(-500 -500)`;
  }

  function renderStage() {
    if (mode !== "parts") return;

    const palette = paletteMap[state.palette] || paletteMap.tangerine;
    const layers = manifest.categories
      .map((type) => manifest.byId.get(state.partIds[type]))
      .filter(Boolean)
      .sort((a, b) => a.zOrder - b.zOrder)
      .map((item) => `<g data-asset-id="${item.id}" transform="${layerTransform(item)}">${item.markup}</g>`)
      .join("");

    const transform = state.transform || { scale: 1, rotation: 0, flipX: false };
    const scaleX = (transform.scale || 1) * (transform.flipX ? -1 : 1);
    const scaleY = transform.scale || 1;

    els.renderRoot.innerHTML = `<g style="--head:${palette.head};--secondary:${palette.secondary};--muzzle:${palette.muzzle};--blush:${palette.blush}" transform="translate(500 500) rotate(${transform.rotation || 0}) scale(${scaleX} ${scaleY}) translate(-500 -500)">${layers}</g>`;
    els.title.textContent = state.label || "Custom cute friend";
    els.status.textContent = state.recipeId ? "Curated layered recipe" : "Approved custom mix";
    els.code.textContent = manifest.categories.map((type) => state.partIds[type]).filter(Boolean).join(" · ");

    els.scale.value = Math.round((transform.scale || 1) * 100);
    els.rotation.value = Math.round(transform.rotation || 0);
    els.scaleOutput.textContent = `${els.scale.value}%`;
    els.rotationOutput.textContent = `${els.rotation.value}°`;
  }

  function renderAll() {
    if (mode !== "parts") return;

    els.recipeLibrary.hidden = false;
    els.partLibrary.hidden = false;
    els.count.textContent = `${manifest.assets.length} authored parts`;
    renderRecipes();
    renderCategories();
    renderParts();
    renderStage();
    global.dispatchEvent(new CustomEvent("cute:composition-change", { detail: serialize() }));
  }

  function enterParts() {
    mode = "parts";
    els.tabs.forEach((tab) => {
      const active = tab.dataset.mode === "parts";
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
    });
    renderAll();
  }

  function leaveParts() {
    mode = "recipes";
    els.tabs.forEach((tab) => {
      const active = tab.dataset.mode === "recipes";
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
    });
    els.recipeLibrary.hidden = false;
    els.partLibrary.hidden = true;
  }

  function shuffle() {
    if (mode !== "parts") return;
    const recipe = manifest.recipes[shuffleIndex % manifest.recipes.length];
    shuffleIndex += 1;
    setRecipe(recipe);
  }

  function serialize() {
    return {
      schemaVersion: manifest.schemaVersion,
      mode: "parts",
      recipeId: state.recipeId,
      partIds: { ...state.partIds },
      paletteId: state.palette,
      transform: { ...state.transform }
    };
  }

  document.querySelectorAll('.mode-tab[data-mode="parts"]').forEach((button) => button.addEventListener("click", enterParts));
  document.querySelectorAll('.mode-tab[data-mode="recipes"]').forEach((button) => button.addEventListener("click", leaveParts));

  [document.getElementById("shuffleButton"), document.getElementById("shuffleSecondary")]
    .filter(Boolean)
    .forEach((button) => button.addEventListener("click", shuffle));

  document.getElementById("flipButton")?.addEventListener("click", () => {
    if (mode !== "parts") return;
    state.transform.flipX = !state.transform.flipX;
    markCustom();
    renderAll();
  });

  els.scale?.addEventListener("input", () => {
    if (mode !== "parts") return;
    state.transform.scale = Number(els.scale.value) / 100;
    markCustom();
    renderStage();
    global.dispatchEvent(new CustomEvent("cute:composition-change", { detail: serialize() }));
  });

  els.rotation?.addEventListener("input", () => {
    if (mode !== "parts") return;
    state.transform.rotation = Number(els.rotation.value);
    markCustom();
    renderStage();
    global.dispatchEvent(new CustomEvent("cute:composition-change", { detail: serialize() }));
  });

  global.CuteBuildFace = Object.freeze({
    getState: () => serialize(),
    restore(next) {
      if (!next?.partIds?.base || !manifest.byId.has(next.partIds.base)) {
        throw new TypeError("A serialized Build-a-face composition with a valid base is required.");
      }

      state = {
        recipeId: next.recipeId && manifest.recipes.some((recipe) => recipe.id === next.recipeId) ? next.recipeId : null,
        label: "Restored friend",
        palette: next.paletteId || "tangerine",
        partIds: { ...next.partIds },
        transform: { scale: 1, rotation: 0, flipX: false, ...next.transform }
      };
      repairCompatibility();
      enterParts();
    },
    shuffle,
    applyRecipe(recipeId) {
      const recipe = manifest.recipes.find((item) => item.id === recipeId);
      if (!recipe) throw new RangeError(`Unknown Build-a-face recipe: ${recipeId}`);
      setRecipe(recipe);
    },
    listRecipes: () => manifest.recipes.map((recipe) => ({ ...recipe, partIds: { ...recipe.partIds }, transform: { ...recipe.transform } })),
    listCompatible: (type, baseId = state.partIds.base) => manifest.assets.filter((item) => item.type === type && (type === "base" || item.compatibleBases.includes(baseId)))
  });
})(window);
