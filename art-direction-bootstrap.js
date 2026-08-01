(function coordinateCuteArtDirection(global) {
  "use strict";

  if (!global.CuteArtDirection) return;

  const expressionAssets = Object.freeze({
    happy: { legacy: "sparkle", layered: "eyes-sparkle" },
    sleepy: { legacy: "sleepy", layered: "eyes-sleepy" },
    surprised: { legacy: "star", layered: "eyes-star" }
  });

  let activeMode = typeof state !== "undefined" && state.mode === "parts" ? "parts" : "recipes";
  let lastCompleteRecipeId = typeof state !== "undefined" && state.recipeId ? state.recipeId : "mochi-cat";
  let lastLayeredRecipeId = global.CuteBuildFace?.getState().recipeId
    || global.CuteBuildFace?.listRecipes()[0]?.id
    || null;
  let resetSnapshot = null;
  let applyingRestoredExpression = false;

  function inferLegacyExpression() {
    if (typeof state === "undefined") return "happy";
    if (state.eyes === "sleepy") return "sleepy";
    if (state.eyes === "star") return "surprised";
    return "happy";
  }

  function inferLayeredExpression(composition) {
    const eyeId = composition?.partIds?.eyes
      || global.CuteBuildFace?.getState().partIds?.eyes;
    if (eyeId === "eyes-sleepy") return "sleepy";
    if (eyeId === "eyes-star") return "surprised";
    return "happy";
  }

  function currentExpression() {
    return activeMode === "parts"
      ? inferLayeredExpression(global.CuteBuildFace?.getState())
      : inferLegacyExpression();
  }

  function syncExpression(expressionId) {
    const current = global.CuteArtDirection.getState();
    if (current.expressionId === expressionId) return;
    global.CuteArtDirection.restore({ ...current, expressionId });
  }

  function applyRestoredExpression(expressionId) {
    const mapping = expressionAssets[expressionId];
    if (!mapping || applyingRestoredExpression || currentExpression() === expressionId) return;

    applyingRestoredExpression = true;
    try {
      if (activeMode === "parts" && global.CuteBuildFace) {
        const next = global.CuteBuildFace.getState();
        const supported = global.CuteBuildFace
          .listCompatible("eyes", next.partIds.base)
          .some((item) => item.id === mapping.layered);
        if (supported) {
          next.partIds.eyes = mapping.layered;
          global.CuteBuildFace.restore({ ...next, recipeId: null });
        } else {
          syncExpression(currentExpression());
        }
      } else if (typeof state !== "undefined" && typeof eyes !== "undefined" && eyes[mapping.legacy]) {
        state.eyes = mapping.legacy;
        state.recipeId = null;
        renderFace();
      }
    } finally {
      applyingRestoredExpression = false;
    }
  }

  function restoreCompleteFaceLibrary() {
    if (typeof renderRecipeLibrary === "function") renderRecipeLibrary();
    const recipeLibrary = document.getElementById("recipeLibrary");
    const partLibrary = document.getElementById("partLibrary");
    const assetCount = document.getElementById("assetCount");
    if (recipeLibrary) recipeLibrary.hidden = false;
    if (partLibrary) partLibrary.hidden = true;
    if (assetCount && typeof recipes !== "undefined") assetCount.textContent = `${recipes.length} recipes`;
  }

  if (typeof renderFace === "function") {
    const previousRenderFace = renderFace;
    renderFace = function coordinatedRenderFace(...args) {
      const result = previousRenderFace(...args);
      if (typeof state !== "undefined" && state.recipeId) {
        lastCompleteRecipeId = state.recipeId;
      }
      queueMicrotask(() => syncExpression(inferLegacyExpression()));
      return result;
    };

    // The legacy application rendered once before Art direction loaded. Render again
    // through the wrapped path so its old embedded finish is removed immediately.
    renderFace();
  }

  global.addEventListener("cute:composition-change", (event) => {
    activeMode = "parts";
    if (event.detail?.recipeId) lastLayeredRecipeId = event.detail.recipeId;
    syncExpression(inferLayeredExpression(event.detail));
  });

  global.addEventListener("cute:art-direction-change", (event) => {
    applyRestoredExpression(event.detail?.expressionId);
  });

  document.querySelectorAll(".mode-tab").forEach((button) => {
    button.addEventListener("click", () => {
      activeMode = button.dataset.mode === "parts" ? "parts" : "recipes";
      setTimeout(() => {
        if (activeMode === "recipes") restoreCompleteFaceLibrary();
        syncExpression(currentExpression());
      }, 0);
    });
  });

  const resetButton = document.getElementById("resetButton");

  // Capture the selected recipe before the legacy reset handler mutates state.
  resetButton?.addEventListener("click", () => {
    resetSnapshot = {
      activeMode,
      completeRecipeId: lastCompleteRecipeId,
      layeredRecipeId: lastLayeredRecipeId
    };
  }, true);

  // This listener runs after the existing reset handlers and restores the selected
  // recipe's authored defaults rather than always falling back to the first recipe.
  resetButton?.addEventListener("click", () => {
    const snapshot = resetSnapshot || {
      activeMode,
      completeRecipeId: lastCompleteRecipeId,
      layeredRecipeId: lastLayeredRecipeId
    };

    if (snapshot.activeMode === "parts" && snapshot.layeredRecipeId && global.CuteBuildFace) {
      global.CuteBuildFace.applyRecipe(snapshot.layeredRecipeId);
      activeMode = "parts";
    } else if (snapshot.completeRecipeId && typeof applyRecipe === "function") {
      applyRecipe(snapshot.completeRecipeId);
      activeMode = "recipes";
      restoreCompleteFaceLibrary();
    }

    global.CuteArtDirection.restore({
      ...global.CuteArtDirection.defaults,
      expressionId: currentExpression()
    });
    resetSnapshot = null;
  });
})(window);
