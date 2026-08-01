(function coordinateCuteArtDirection(global) {
  "use strict";

  if (!global.CuteArtDirection) return;

  let activeMode = typeof state !== "undefined" && state.mode === "parts" ? "parts" : "recipes";
  let lastCompleteRecipeId = typeof state !== "undefined" && state.recipeId ? state.recipeId : "mochi-cat";
  let lastLayeredRecipeId = global.CuteBuildFace?.getState().recipeId
    || global.CuteBuildFace?.listRecipes()[0]?.id
    || null;
  let resetSnapshot = null;

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

  function syncExpression(expressionId) {
    const current = global.CuteArtDirection.getState();
    if (current.expressionId === expressionId) return;
    global.CuteArtDirection.restore({ ...current, expressionId });
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

  document.querySelectorAll(".mode-tab").forEach((button) => {
    button.addEventListener("click", () => {
      activeMode = button.dataset.mode === "parts" ? "parts" : "recipes";
      setTimeout(() => {
        if (activeMode === "recipes") restoreCompleteFaceLibrary();
        syncExpression(activeMode === "parts"
          ? inferLayeredExpression(global.CuteBuildFace?.getState())
          : inferLegacyExpression());
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

    global.CuteArtDirection.restore(global.CuteArtDirection.defaults);
    resetSnapshot = null;
  });
})(window);
