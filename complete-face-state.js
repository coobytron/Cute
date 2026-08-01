(function guardCompleteFaceState(global) {
  "use strict";

  if (!global.CuteCompleteFaces || typeof state === "undefined") return;

  let completeSnapshot = state.completeFaceId ? { ...state, mode: "recipes" } : null;

  function captureCompleteSnapshot() {
    if (state.mode === "recipes" && state.completeFaceId) {
      completeSnapshot = { ...state, mode: "recipes" };
    }
  }

  function restoreCompleteSnapshotForLayeredMode() {
    if (!completeSnapshot) return;
    state = { ...completeSnapshot, mode: "parts" };
  }

  if (typeof renderFace === "function") {
    const previousRenderFace = renderFace;
    renderFace = function renderWithCompleteStateGuard(...args) {
      const result = previousRenderFace(...args);
      captureCompleteSnapshot();
      return result;
    };
  }

  global.addEventListener("cute:complete-face-change", () => {
    captureCompleteSnapshot();
  });

  global.addEventListener("cute:composition-change", () => {
    restoreCompleteSnapshotForLayeredMode();
  });

  document.querySelectorAll('.mode-tab[data-mode="recipes"]').forEach((button) => {
    button.addEventListener("click", () => {
      if (state.mode === "parts") restoreCompleteSnapshotForLayeredMode();
    }, true);
  });

  global.CuteCompleteFaceState = Object.freeze({
    getSnapshot: () => completeSnapshot ? { ...completeSnapshot } : null,
    restoreForLayeredMode: restoreCompleteSnapshotForLayeredMode
  });
})(window);
