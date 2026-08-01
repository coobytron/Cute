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
  const characterTitle = document.getElementById("characterTitle");
  const nameInput = document.getElementById("nameInput");

  if (!undoButton || !redoButton || !savedGrid) return;

  let history = [];
  let cursor = -1;
  let applying = false;
  let scheduledPush = null;
  let sliderStart = null;
  let sliderActive = false;
  let textStart = null;
  let textEditing = false;
  let records = readStore();

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function stable(value) {
    return JSON.stringify(value);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>\"]/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '\"': "&quot;"
    }[character]));
  }

  function readStore() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!parsed || parsed.schemaVersion !== 2 || !Array.isArray(parsed.records)) return [];
      return parsed.records
        .filter((record) => record?.id && record?.snapshot?.schemaVersion === 2)
        .slice(0, MAX_SAVES);
    } catch (_) {
      return [];
    }
  }

  function writeStore() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 2, records }));
      clearStorageMessage();
      return true;
    } catch (error) {
      showStorageMessage("Saved variations are full or unavailable. Delete a saved friend and try again.");
      global.dispatchEvent(new CustomEvent("cute:storage-error", { detail: error }));
      return false;
    }
  }

  function showStorageMessage(message) {
    let status = document.getElementById("savedStorageStatus");
    if (!status) {
      status = document.createElement("p");
      status.id = "savedStorageStatus";
      status.className = "saved-storage-status";
      status.setAttribute("role", "status");
      savedGrid.insertAdjacentElement("afterend", status);
    }
    status.textContent = message;
  }

  function clearStorageMessage() {
    document.getElementById("savedStorageStatus")?.remove();
  }

  function activeMode() {
    const partsTab = document.querySelector('.mode-tab[data-mode="parts"]');
    return partsTab?.classList.contains("is-active") || (typeof state !== "undefined" && state.mode === "parts")
      ? "parts"
      : "recipes";
  }

  function legacySnapshot() {
    if (typeof state === "undefined") return null;
    const keys = [
      "mode", "recipeId", "manifestRecipeId", "completeFaceId", "head", "ears", "eyes",
      "snout", "cheeks", "marking", "accessory", "palette", "scale", "rotation",
      "flipped", "name", "favorite"
    ];
    return Object.fromEntries(keys
      .filter((key) => key in state)
      .map((key) => [key, clone(state[key])]));
  }

  function capture() {
    const mode = activeMode();
    const composer = mode === "parts" && global.CuteBuildFace
      ? global.CuteBuildFace.getState()
      : global.CuteCompleteFaces?.getState?.() || legacySnapshot();

    return {
      schemaVersion: 2,
      mode,
      composer: clone(composer),
      artDirection: clone(global.CuteArtDirection?.getState?.() || null),
      title: characterTitle?.textContent || composer?.name || "Cute friend"
    };
  }

  function restore(snapshot) {
    if (!snapshot || applying) return;
    applying = true;
    cancelScheduledPush();

    try {
      const targetMode = snapshot.mode === "parts" ? "parts" : "recipes";
      document.querySelector(`[data-mode="${targetMode}"]`)?.click();

      if (targetMode === "parts" && global.CuteBuildFace) {
        global.CuteBuildFace.restore(clone(snapshot.composer));
      } else if (snapshot.composer?.completeFaceId && global.CuteCompleteFaces) {
        global.CuteCompleteFaces.restore(clone(snapshot.composer));
      } else if (typeof state !== "undefined" && snapshot.composer) {
        Object.assign(state, clone(snapshot.composer), { mode: "recipes" });
        if (typeof renderFace === "function") renderFace();
      }

      if (snapshot.artDirection && global.CuteArtDirection) {
        global.CuteArtDirection.restore(clone(snapshot.artDirection));
      }

      if (snapshot.title) {
        if (characterTitle) characterTitle.textContent = snapshot.title;
        if (nameInput) nameInput.value = snapshot.title;
      }
    } finally {
      queueMicrotask(() => {
        applying = false;
        updateButtons();
      });
    }
  }

  function push(snapshot, force = false) {
    if (applying || !snapshot) return;
    const current = history[cursor];
    if (!force && current && stable(current) === stable(snapshot)) return;

    history = history.slice(0, cursor + 1);
    history.push(clone(snapshot));
    if (history.length > MAX_HISTORY) history.shift();
    cursor = history.length - 1;
    updateButtons();
  }

  function schedulePush() {
    if (applying || sliderActive || textEditing) return;
    cancelScheduledPush();
    scheduledPush = global.setTimeout(() => {
      scheduledPush = null;
      push(capture());
    }, 0);
  }

  function cancelScheduledPush() {
    if (scheduledPush != null) global.clearTimeout(scheduledPush);
    scheduledPush = null;
  }

  function undo() {
    if (cursor > 0) restore(history[--cursor]);
  }

  function redo() {
    if (cursor < history.length - 1) restore(history[++cursor]);
  }

  function updateButtons() {
    undoButton.disabled = cursor <= 0;
    redoButton.disabled = cursor >= history.length - 1;
    undoButton.title = undoButton.disabled ? "Nothing to undo" : "Undo last composition change";
    redoButton.title = redoButton.disabled ? "Nothing to redo" : "Redo composition change";
    syncFavorite();
  }

  function previewData() {
    try {
      const source = global.CuteArtDirection?.buildExportSvg?.();
      if (source) return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;

      const faceCanvas = document.getElementById("faceCanvas");
      if (!faceCanvas) return "";
      const svg = faceCanvas.cloneNode(true);
      svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`;
    } catch (_) {
      return "";
    }
  }

  function signature(snapshot) {
    return stable(snapshot);
  }

  function currentRecord() {
    const currentSignature = signature(capture());
    return records.find((record) => signature(record.snapshot) === currentSignature) || null;
  }

  function saveCurrent() {
    const snapshot = capture();
    const existing = currentRecord();
    const now = new Date().toISOString();

    if (existing) {
      existing.updatedAt = now;
      existing.preview = previewData();
      existing.title = snapshot.title;
    } else {
      records.unshift({
        id: global.crypto?.randomUUID?.() || `save-${Date.now()}`,
        createdAt: now,
        updatedAt: now,
        favorite: false,
        title: snapshot.title,
        preview: previewData(),
        snapshot
      });
      records = records.slice(0, MAX_SAVES);
    }

    if (writeStore()) {
      renderSaved();
      updateButtons();
      global.dispatchEvent(new CustomEvent("cute:variation-saved", { detail: snapshot }));
    }
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
    if (writeStore()) {
      renderSaved();
      syncFavorite();
    }
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
    if (writeStore()) {
      renderSaved();
      syncFavorite();
    }
  }

  function renderSaved() {
    savedGrid.innerHTML = records.length
      ? records.map((record) => `
        <article class="saved-variation${record.favorite ? " is-favorite" : ""}" data-save-id="${record.id}">
          <button class="saved-preview" type="button" data-restore-save="${record.id}" aria-label="Restore ${escapeHtml(record.title)}">
            ${record.preview ? `<img src="${record.preview}" alt="" />` : '<span aria-hidden="true">✦</span>'}
          </button>
          <div class="saved-meta">
            <strong>${escapeHtml(record.title)}</strong>
            <small>${record.snapshot.mode === "parts" ? "Build a face" : "Complete face"}</small>
          </div>
          <button class="saved-favorite" type="button" data-favorite-save="${record.id}" aria-label="${record.favorite ? "Unfavorite" : "Favorite"} ${escapeHtml(record.title)}">${record.favorite ? "♥" : "♡"}</button>
          <button class="saved-delete" type="button" data-delete-save="${record.id}" aria-label="Delete ${escapeHtml(record.title)}">×</button>
        </article>`).join("")
      : '<p class="saved-empty">Save a version to keep it here on this device.</p>';

    savedGrid.querySelectorAll("[data-restore-save]").forEach((button) => {
      button.addEventListener("click", () => {
        const record = records.find((item) => item.id === button.dataset.restoreSave);
        if (!record) return;
        push(capture());
        restore(record.snapshot);
        global.setTimeout(() => push(capture()), 0);
      });
    });

    savedGrid.querySelectorAll("[data-favorite-save]").forEach((button) => {
      button.addEventListener("click", () => {
        const record = records.find((item) => item.id === button.dataset.favoriteSave);
        if (!record) return;
        record.favorite = !record.favorite;
        record.updatedAt = new Date().toISOString();
        if (writeStore()) {
          renderSaved();
          syncFavorite();
        }
      });
    });

    savedGrid.querySelectorAll("[data-delete-save]").forEach((button) => {
      button.addEventListener("click", () => deleteRecord(button.dataset.deleteSave));
    });
  }

  function beginSliderEdit() {
    if (applying || sliderActive) return;
    sliderStart = capture();
    sliderActive = true;
    cancelScheduledPush();
  }

  function finishSliderEdit() {
    if (!sliderActive) return;
    sliderActive = false;
    push(sliderStart);
    sliderStart = null;
    push(capture());
  }

  function beginTextEdit() {
    if (applying || textEditing) return;
    textStart = capture();
    textEditing = true;
    cancelScheduledPush();
  }

  function finishTextEdit() {
    if (!textEditing) return;
    textEditing = false;
    push(textStart);
    textStart = null;
    push(capture());
  }

  document.addEventListener("pointerdown", (event) => {
    if (event.target.matches('input[type="range"]')) beginSliderEdit();
  }, true);

  document.addEventListener("keydown", (event) => {
    if (event.target.matches('input[type="range"]')) beginSliderEdit();
  }, true);

  document.addEventListener("change", (event) => {
    if (event.target.matches('input[type="range"]')) finishSliderEdit();
  }, true);

  document.addEventListener("keyup", (event) => {
    if (event.target.matches('input[type="range"]')) finishSliderEdit();
  }, true);

  document.addEventListener("focusin", (event) => {
    if (event.target.matches("#nameInput, #captionInput")) beginTextEdit();
  }, true);

  document.addEventListener("focusout", (event) => {
    if (event.target.matches("#nameInput, #captionInput")) finishTextEdit();
  }, true);

  [
    "cute:complete-face-change",
    "cute:composition-change",
    "cute:art-direction-change"
  ].forEach((eventName) => global.addEventListener(eventName, schedulePush));

  document.querySelectorAll(".mode-tab").forEach((button) => {
    button.addEventListener("click", schedulePush);
  });

  undoButton.addEventListener("click", undo);
  redoButton.addEventListener("click", redo);

  saveButton?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    saveCurrent();
  }, true);

  saveVersionButton?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    saveCurrent();
  }, true);

  favoriteButton?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    toggleFavorite();
  }, true);

  global.addEventListener("keydown", (event) => {
    if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
    if (event.key.toLowerCase() !== "z") return;
    event.preventDefault();
    event.shiftKey ? redo() : undo();
  });

  renderSaved();
  push(capture(), true);

  global.CuteHistorySaves = Object.freeze({
    capture,
    restore,
    undo,
    redo,
    saveCurrent,
    getRecords: () => clone(records),
    clear() {
      records = [];
      writeStore();
      renderSaved();
      syncFavorite();
    }
  });

  global.dispatchEvent(new CustomEvent("cute:history-ready"));
})(window);
