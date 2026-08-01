(function installBuildFace(global) {
  "use strict";

  const manifest = global.CuteBuildFaceManifest;
  if (!manifest) return;

  const paletteMap = {
    tangerine:{head:"#F6A65E",secondary:"#E77B4C",muzzle:"#FFF1DB",blush:"#FF786B"},
    lavender:{head:"#D9C8F4",secondary:"#B99BEA",muzzle:"#F8F1FF",blush:"#FF93A5"},
    mint:{head:"#BFE2CF",secondary:"#7FC5A2",muzzle:"#F2FFF8",blush:"#FF8F91"},
    butter:{head:"#F4C84D",secondary:"#D8A63B",muzzle:"#FFF4D3",blush:"#FF806F"},
    sky:{head:"#BFDDED",secondary:"#7FB5D2",muzzle:"#F4FBFF",blush:"#FF8E88"}
  };

  const firstRecipe = manifest.recipes[0];
  let mode = "recipes";
  let category = "base";
  let shuffleIndex = 0;
  let state = structuredClone(firstRecipe);

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

  function compatibleAssets(type) {
    const baseId = state.partIds.base;
    return manifest.assets.filter((item) => item.type === type && (type === "base" || item.compatibleBases.includes(baseId)));
  }

  function repairCompatibility() {
    for (const type of manifest.categories.slice(1)) {
      const allowed = compatibleAssets(type);
      if (!allowed.some((item) => item.id === state.partIds[type])) state.partIds[type] = allowed[0]?.id ?? null;
    }
  }

  function setRecipe(recipe) {
    state = structuredClone(recipe);
    mode = "parts";
    repairCompatibility();
    renderAll();
  }

  function setPart(type, id) {
    state.recipeId = null;
    state.partIds[type] = id;
    if (type === "base") repairCompatibility();
    renderAll();
  }

  function renderCategories() {
    els.categoryTabs.innerHTML = manifest.categories.map((type) => {
      const active = type === category ? " is-active" : "";
      const label = type === "base" ? "Bases" : type === "accessory" ? "Accessories" : `${type[0].toUpperCase()}${type.slice(1)}`;
      return `<button type="button" class="category-tab${active}" data-build-category="${type}">${label}</button>`;
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
      const selected = state.partIds[category] === item.id ? " is-selected" : "";
      const preview = item.markup || '<circle cx="500" cy="500" r="80" fill="none" stroke="currentColor" stroke-dasharray="18 18"/>';
      return `<button type="button" class="part-card${selected}" data-build-part="${item.id}" aria-pressed="${selected ? "true" : "false"}"><svg viewBox="0 0 1000 1000" aria-hidden="true"><g style="--head:#f6a65e;--secondary:#e77b4c;--muzzle:#fff1db;--blush:#ff786b">${preview}</g></svg><span>${item.label}</span></button>`;
    }).join("");
    els.partGrid.querySelectorAll("[data-build-part]").forEach((button) => button.addEventListener("click", () => setPart(category, button.dataset.buildPart)));
  }

  function renderRecipes() {
    if (mode !== "parts") return;
    els.recipeLibrary.innerHTML = manifest.recipes.map((recipe) => {
      const active = state.id === recipe.id || state.recipeId === recipe.id ? " is-selected" : "";
      return `<button type="button" class="recipe-card${active}" data-build-recipe="${recipe.id}"><span class="recipe-thumb" aria-hidden="true">✦</span><span>${recipe.label}</span></button>`;
    }).join("");
    els.recipeLibrary.querySelectorAll("[data-build-recipe]").forEach((button) => button.addEventListener("click", () => setRecipe(manifest.recipes.find((recipe) => recipe.id === button.dataset.buildRecipe))));
  }

  function renderStage() {
    if (mode !== "parts") return;
    const palette = paletteMap[state.palette] || paletteMap.tangerine;
    const layers = manifest.categories
      .map((type) => manifest.byId.get(state.partIds[type]))
      .filter(Boolean)
      .sort((a,b) => a.zOrder - b.zOrder)
      .map((item) => {
        const override = item.overrides?.[state.partIds.base] || {};
        const x = override.x || 0;
        const y = override.y || 0;
        const scale = override.scale || 1;
        const rotation = override.rotation || 0;
        return `<g data-asset-id="${item.id}" transform="translate(${x} ${y}) rotate(${rotation} 500 500) scale(${scale})">${item.markup}</g>`;
      }).join("");
    const transform = state.transform || {scale:1,rotation:0,flipX:false};
    const flip = transform.flipX ? -1 : 1;
    els.renderRoot.innerHTML = `<g style="--head:${palette.head};--secondary:${palette.secondary};--muzzle:${palette.muzzle};--blush:${palette.blush}" transform="translate(500 500) rotate(${transform.rotation || 0}) scale(${(transform.scale || 1) * flip} ${transform.scale || 1}) translate(-500 -500)">${layers}</g>`;
    els.title.textContent = state.label || "Custom cute friend";
    els.status.textContent = state.recipeId || state.id ? "Curated layered recipe" : "Approved custom mix";
    els.code.textContent = manifest.categories.map((type) => state.partIds[type]).filter(Boolean).join(" · ");
    els.scale.value = Math.round((transform.scale || 1) * 100);
    els.rotation.value = Math.round(transform.rotation || 0);
    els.scaleOutput.textContent = `${els.scale.value}%`;
    els.rotationOutput.textContent = `${els.rotation.value}°`;
  }

  function renderAll() {
    if (mode !== "parts") return;
    els.recipeLibrary.hidden = true;
    els.partLibrary.hidden = false;
    els.count.textContent = `${manifest.assets.length} authored parts`;
    renderCategories();
    renderParts();
    renderStage();
    global.dispatchEvent(new CustomEvent("cute:composition-change", {detail: serialize()}));
  }

  function enterParts() {
    mode = "parts";
    els.tabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.mode === "parts"));
    renderAll();
  }

  function leaveParts() {
    mode = "recipes";
    els.tabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.mode === "recipes"));
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
      recipeId: state.id || state.recipeId || null,
      partIds: {...state.partIds},
      paletteId: state.palette,
      transform: {...state.transform}
    };
  }

  document.querySelectorAll('.mode-tab[data-mode="parts"]').forEach((button) => button.addEventListener("click", enterParts));
  document.querySelectorAll('.mode-tab[data-mode="recipes"]').forEach((button) => button.addEventListener("click", leaveParts));
  [document.getElementById("shuffleButton"), document.getElementById("shuffleSecondary")].filter(Boolean).forEach((button) => button.addEventListener("click", shuffle));
  document.getElementById("flipButton")?.addEventListener("click", () => {
    if (mode !== "parts") return;
    state.transform.flipX = !state.transform.flipX;
    renderStage();
  });
  els.scale?.addEventListener("input", () => {
    if (mode !== "parts") return;
    state.transform.scale = Number(els.scale.value) / 100;
    state.recipeId = null;
    renderStage();
  });
  els.rotation?.addEventListener("input", () => {
    if (mode !== "parts") return;
    state.transform.rotation = Number(els.rotation.value);
    state.recipeId = null;
    renderStage();
  });

  global.CuteBuildFace = Object.freeze({
    getState: () => serialize(),
    restore(next) {
      if (!next?.partIds) throw new TypeError("A serialized Build-a-face composition is required.");
      state = {id:null,label:"Restored friend",palette:next.paletteId || "tangerine",partIds:{...next.partIds},transform:{scale:1,rotation:0,flipX:false,...next.transform}};
      repairCompatibility();
      enterParts();
    },
    shuffle,
    listCompatible: (type, baseId = state.partIds.base) => manifest.assets.filter((item) => item.type === type && (type === "base" || item.compatibleBases.includes(baseId)))
  });
})(window);
