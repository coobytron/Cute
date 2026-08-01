(function installCuteHistorySaves(global) {
  "use strict";

  const STORAGE_KEY = "cute-face-builder/saves/v2";
  const MAX_SAVES = 12;
  const MAX_HISTORY = 80;
  const undoButton = document.getElementById("undoButton");
  const redoButton = document.getElementById("redoButton");
  const favoriteButton = document.getElementById("favoriteButton");
  const saveButton = document.getElementById("saveButton");
  const saveVersionButton = document.getElementById("saveVersionButton");
  const savedGrid = document.getElementById("savedGrid");
  const faceCanvas = document.getElementById("faceCanvas");

  if (!undoButton || !redoButton || !savedGrid) return;

  let history = [];
  let cursor = -1;
  let applying = false;
  let sliderStart = null;
  let records = readStore();

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function stable(value) { return JSON.stringify(value); }

  function readStore() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!parsed || parsed.schemaVersion !== 2 || !Array.isArray(parsed.records)) return [];
      return parsed.records.filter((item) => item && item.id && item.snapshot).slice(0, MAX_SAVES);
    } catch (_) { return []; }
  }

  function writeStore() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 2, records }));
      return true;
    } catch (error) {
      global.dispatchEvent(new CustomEvent("cute:storage-error", { detail: error }));
      return false;
    }
  }

  function legacySnapshot() {
    if (typeof state === "undefined") return null;
    const keys = ["mode", "recipeId", "head", "ears", "eyes", "snout", "cheeks", "markings", "accessory", "palette", "scale", "rotation", "flipped", "name", "favorite"];
    return Object.fromEntries(keys.filter((key) => key in state).map((key) => [key, clone(state[key])]));
  }

  function capture() {
    const mode = typeof state !== "undefined" && state.mode === "parts" ? "parts" : "recipes";
    return {
      schemaVersion: 2,
      mode,
      composer: mode === "parts" && global.CuteBuildFace ? global.CuteBuildFace.getState() : legacySnapshot(),
      artDirection: global.CuteArtDirection?.getState?.() || null,
      title: document.getElementById("characterTitle")?.textContent || "Cute friend"
    };
  }

  function restore(snapshot) {
    if (!snapshot || applying) return;
    applying = true;
    try {
      const targetMode = snapshot.mode === "parts" ? "parts" : "recipes";
      document.querySelector(`[data-mode="${targetMode}"]`)?.click();
      if (targetMode === "parts" && global.CuteBuildFace) {
        global.CuteBuildFace.restore(clone(snapshot.composer));
      } else if (typeof state !== "undefined" && snapshot.composer) {
        Object.assign(state, clone(snapshot.composer));
        if (typeof renderFace === "function") renderFace();
      }
      if (snapshot.artDirection && global.CuteArtDirection) global.CuteArtDirection.restore(clone(snapshot.artDirection));
    } finally {
      queueMicrotask(() => { applying = false; updateButtons(); });
    }
  }

  function push(snapshot, force) {
    if (applying || !snapshot) return;
    const current = history[cursor];
    if (!force && current && stable(current) === stable(snapshot)) return;
    history = history.slice(0, cursor + 1);
    history.push(clone(snapshot));
    if (history.length > MAX_HISTORY) history.shift();
    cursor = history.length - 1;
    updateButtons();
  }

  function undo() { if (cursor > 0) restore(history[--cursor]); }
  function redo() { if (cursor < history.length - 1) restore(history[++cursor]); }
  function updateButtons() {
    undoButton.disabled = cursor <= 0;
    redoButton.disabled = cursor >= history.length - 1;
    undoButton.title = undoButton.disabled ? "Nothing to undo" : "Undo last composition change";
    redoButton.title = redoButton.disabled ? "Nothing to redo" : "Redo composition change";
    syncFavorite();
  }

  function previewData() {
    if (!faceCanvas) return "";
    try {
      const svg = faceCanvas.cloneNode(true);
      svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`;
    } catch (_) { return ""; }
  }

  function signature(snapshot) { return stable(snapshot); }
  function currentRecord() {
    const sig = signature(capture());
    return records.find((item) => signature(item.snapshot) === sig) || null;
  }

  function saveCurrent() {
    const snapshot = capture();
    const existing = currentRecord();
    if (existing) {
      existing.updatedAt = new Date().toISOString();
      existing.preview = previewData();
    } else {
      records.unshift({
        id: global.crypto?.randomUUID?.() || `save-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        favorite: false,
        title: snapshot.title,
        preview: previewData(),
        snapshot
      });
      records = records.slice(0, MAX_SAVES);
    }
    writeStore();
    renderSaved();
    updateButtons();
  }

  function toggleFavorite() {
    let record = currentRecord();
    if (!record) {
      saveCurrent();
      record = currentRecord();
    }
    if (!record) return;
    record.favorite = !record.favorite;
    record.updatedAt = new Date().toISOString();
    writeStore();
    renderSaved();
    syncFavorite();
  }

  function syncFavorite() {
    if (!favoriteButton) return;
    const active = Boolean(currentRecord()?.favorite);
    favoriteButton.classList.toggle("is-active", active);
    favoriteButton.setAttribute("aria-pressed", String(active));
    favoriteButton.textContent = active ? "♥ Favourite" : "♡ Favourite";
  }

  function deleteRecord(id) {
    const record = records.find((item) => item.id === id);
    if (!record || !global.confirm(`Delete ${record.title || "this saved friend"}?`)) return;
    records = records.filter((item) => item.id !== id);
    writeStore();
    renderSaved();
    syncFavorite();
  }

  function renderSaved() {
    savedGrid.innerHTML = records.length ? records.map((record) => `
      <article class="saved-variation${record.favorite ? " is-favorite" : ""}" data-save-id="${record.id}">
        <button class="saved-preview" type="button" data-restore-save="${record.id}" aria-label="Restore ${record.title}">
          ${record.preview ? `<img src="${record.preview}" alt="" />` : `<span aria-hidden="true">✦</span>`}
        </button>
        <div class="saved-meta"><strong>${record.title}</strong><small>${record.snapshot.mode === "parts" ? "Build a face" : "Complete face"}</small></div>
        <button class="saved-favorite" type="button" data-favorite-save="${record.id}" aria-label="${record.favorite ? "Unfavorite" : "Favorite"} ${record.title}">${record.favorite ? "♥" : "♡"}</button>
        <button class="saved-delete" type="button" data-delete-save="${record.id}" aria-label="Delete ${record.title}">×</button>
      </article>`).join("") : `<p class="saved-empty">Save a version to keep it here on this device.</p>`;

    savedGrid.querySelectorAll("[data-restore-save]").forEach((button) => button.addEventListener("click", () => {
      const record = records.find((item) => item.id === button.dataset.restoreSave);
      if (!record) return;
      push(capture(), true);
      restore(record.snapshot);
      queueMicrotask(() => push(capture(), true));
    }));
    savedGrid.querySelectorAll("[data-favorite-save]").forEach((button) => button.addEventListener("click", () => {
      const record = records.find((item) => item.id === button.dataset.favoriteSave);
      if (!record) return;
      record.favorite = !record.favorite;
      writeStore(); renderSaved(); syncFavorite();
    }));
    savedGrid.querySelectorAll("[data-delete-save]").forEach((button) => button.addEventListener("click", () => deleteRecord(button.dataset.deleteSave)));
  }

  function meaningfulTarget(target) {
    return target.closest("[data-recipe-id], [data-part-id], [data-art-finish], [data-art-palette], [data-expression], [data-mode], #resetButton, #shuffleButton, #shuffleSecondary, #flipButton, #backgroundSelect, #frameSelect, #captionInput, #showCaptionToggle, #transparentBgToggle, #nameInput");
  }

  document.addEventListener("pointerdown", (event) => {
    if (event.target.matches('input[type="range"]')) sliderStart = capture();
  }, true);
  document.addEventListener("change", (event) => {
    if (event.target.matches('input[type="range"]')) {
      if (sliderStart) push(sliderStart, true);
      sliderStart = null;
      queueMicrotask(() => push(capture(), true));
    }
  }, true);
  document.addEventListener("click", (event) => {
    if (!meaningfulTarget(event.target)) return;
    const before = capture();
    queueMicrotask(() => { push(before); push(capture()); });
  }, true);
  global.addEventListener("cute:art-direction-change", () => queueMicrotask(() => push(capture())));
  global.addEventListener("cute:build-face-change", () => queueMicrotask(() => push(capture())));

  undoButton.addEventListener("click", undo);
  redoButton.addEventListener("click", redo);
  saveButton?.addEventListener("click", saveCurrent);
  saveVersionButton?.addEventListener("click", saveCurrent);
  favoriteButton?.addEventListener("click", (event) => { event.preventDefault(); event.stopImmediatePropagation(); toggleFavorite(); }, true);
  global.addEventListener("keydown", (event) => {
    if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
    if (event.key.toLowerCase() !== "z") return;
    event.preventDefault();
    event.shiftKey ? redo() : undo();
  });

  renderSaved();
  push(capture(), true);
  global.CuteHistorySaves = Object.freeze({ capture, restore, undo, redo, saveCurrent, getRecords: () => clone(records) });
  global.dispatchEvent(new CustomEvent("cute:history-ready"));
})(window);