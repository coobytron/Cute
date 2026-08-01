(function installResponsiveAccessibility(global) {
  "use strict";

  const workspace = document.querySelector(".workspace");
  const libraryPanel = document.querySelector(".library-panel");
  const stageColumn = document.querySelector(".stage-column");
  const controlsPanel = document.querySelector(".controls-panel");
  const savedStrip = document.querySelector(".saved-strip");
  const stage = document.getElementById("stage");
  const stageStatus = document.getElementById("stageStatus");
  const characterTitle = document.getElementById("characterTitle");
  const modeTabs = [...document.querySelectorAll(".mode-tab")];

  if (!workspace || !libraryPanel || !stageColumn || !controlsPanel || !stage) return;

  const mobileQuery = global.matchMedia("(max-width: 760px)");
  let activeMobilePanel = "assets";
  let announceTimer = null;

  function ensureId(element, id) {
    if (!element.id) element.id = id;
    return element.id;
  }

  function installLandmarks() {
    const skipLink = document.createElement("a");
    skipLink.className = "skip-link";
    skipLink.href = "#currentCharacter";
    skipLink.textContent = "Skip to current character";
    document.body.insertBefore(skipLink, document.body.firstChild);

    stageColumn.id = "currentCharacter";
    stageColumn.setAttribute("role", "region");
    stageColumn.setAttribute("aria-labelledby", ensureId(characterTitle, "characterTitle"));
    stageColumn.tabIndex = -1;

    const libraryHeading = libraryPanel.querySelector("h2");
    libraryPanel.id = "authoredAssetsPanel";
    libraryPanel.setAttribute("role", "region");
    if (libraryHeading) libraryPanel.setAttribute("aria-labelledby", ensureId(libraryHeading, "authoredAssetsHeading"));

    const controlsHeading = controlsPanel.querySelector("h2");
    controlsPanel.id = "artDirectionPanel";
    controlsPanel.setAttribute("role", "region");
    if (controlsHeading) controlsPanel.setAttribute("aria-labelledby", ensureId(controlsHeading, "artDirectionHeading"));

    if (savedStrip) {
      savedStrip.setAttribute("role", "region");
      const savedHeading = savedStrip.querySelector("h2");
      if (savedHeading) savedStrip.setAttribute("aria-labelledby", ensureId(savedHeading, "savedVariationsHeading"));
      else savedStrip.setAttribute("aria-label", "Saved variations");
    }

    stageStatus?.setAttribute("aria-live", "polite");
    stageStatus?.setAttribute("aria-atomic", "true");
    document.getElementById("assetCount")?.setAttribute("aria-live", "polite");
  }

  function installAnnouncer() {
    const announcer = document.createElement("div");
    announcer.id = "appAnnouncements";
    announcer.className = "sr-only";
    announcer.setAttribute("role", "status");
    announcer.setAttribute("aria-live", "polite");
    announcer.setAttribute("aria-atomic", "true");
    document.body.appendChild(announcer);
    return announcer;
  }

  const announcer = installAnnouncer();

  function announce(message) {
    if (!message) return;
    if (announceTimer) global.clearTimeout(announceTimer);
    announceTimer = global.setTimeout(() => {
      announcer.textContent = "";
      global.requestAnimationFrame(() => { announcer.textContent = message; });
    }, 120);
  }

  function installMobilePanelNavigation() {
    const nav = document.createElement("div");
    nav.className = "mobile-panel-nav";
    nav.setAttribute("role", "tablist");
    nav.setAttribute("aria-label", "Editing panels");
    nav.innerHTML = `
      <button class="mobile-panel-tab" id="mobileAssetsTab" type="button" role="tab" aria-controls="authoredAssetsPanel" aria-selected="true" data-mobile-panel="assets">Authored assets</button>
      <button class="mobile-panel-tab" id="mobileDirectionTab" type="button" role="tab" aria-controls="artDirectionPanel" aria-selected="false" data-mobile-panel="direction">Art direction</button>`;
    stageColumn.insertAdjacentElement("afterend", nav);

    nav.querySelectorAll("[data-mobile-panel]").forEach((button) => {
      button.addEventListener("click", () => activateMobilePanel(button.dataset.mobilePanel));
      button.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === "ArrowLeft" || event.key === "Home" ? "assets" : "direction";
        activateMobilePanel(next, true);
      });
    });
  }

  function activateMobilePanel(panel, focusTab = false) {
    activeMobilePanel = panel === "direction" ? "direction" : "assets";
    workspace.classList.toggle("mobile-panel-assets", activeMobilePanel === "assets");
    workspace.classList.toggle("mobile-panel-direction", activeMobilePanel === "direction");

    const assetsTab = document.getElementById("mobileAssetsTab");
    const directionTab = document.getElementById("mobileDirectionTab");
    const assetsSelected = activeMobilePanel === "assets";
    assetsTab?.setAttribute("aria-selected", String(assetsSelected));
    directionTab?.setAttribute("aria-selected", String(!assetsSelected));
    assetsTab?.setAttribute("tabindex", assetsSelected ? "0" : "-1");
    directionTab?.setAttribute("tabindex", assetsSelected ? "-1" : "0");

    syncPanelVisibility();
    if (focusTab) (assetsSelected ? assetsTab : directionTab)?.focus();
  }

  function syncPanelVisibility() {
    if (!mobileQuery.matches) {
      [libraryPanel, controlsPanel].forEach((panel) => {
        panel.inert = false;
        panel.removeAttribute("aria-hidden");
      });
      return;
    }

    const showAssets = activeMobilePanel === "assets";
    libraryPanel.inert = !showAssets;
    controlsPanel.inert = showAssets;
    libraryPanel.setAttribute("aria-hidden", String(!showAssets));
    controlsPanel.setAttribute("aria-hidden", String(showAssets));
  }

  function syncModeTabs() {
    modeTabs.forEach((tab) => {
      const selected = tab.classList.contains("is-active");
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-selected", String(selected));
      tab.setAttribute("aria-controls", "recipeLibrary partLibrary");
      tab.tabIndex = selected ? 0 : -1;
    });
  }

  function installModeTabKeyboard() {
    modeTabs.forEach((tab, index) => {
      tab.addEventListener("click", () => global.setTimeout(syncModeTabs, 0));
      tab.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        let nextIndex = index;
        if (event.key === "ArrowLeft") nextIndex = (index - 1 + modeTabs.length) % modeTabs.length;
        if (event.key === "ArrowRight") nextIndex = (index + 1) % modeTabs.length;
        if (event.key === "Home") nextIndex = 0;
        if (event.key === "End") nextIndex = modeTabs.length - 1;
        modeTabs[nextIndex]?.focus();
        modeTabs[nextIndex]?.click();
      });
    });
  }

  function syncRangeValue(input) {
    const output = input.id === "scaleControl"
      ? document.getElementById("scaleOutput")
      : input.id === "rotationControl"
        ? document.getElementById("rotationOutput")
        : null;
    const unit = input.id === "scaleControl" ? "%" : input.id === "rotationControl" ? " degrees" : "";
    input.setAttribute("aria-valuetext", `${input.value}${unit}`);
    if (output && !output.getAttribute("aria-live")) output.setAttribute("aria-live", "off");
  }

  function installControlSemantics() {
    document.querySelectorAll('input[type="range"]').forEach((input) => {
      syncRangeValue(input);
      input.addEventListener("input", () => syncRangeValue(input));
    });

    document.querySelectorAll(".category-tabs").forEach((tabs) => {
      if (!tabs.getAttribute("aria-label")) tabs.setAttribute("aria-label", "Authored part categories");
    });

    document.querySelectorAll(".saved-grid").forEach((grid) => {
      grid.setAttribute("aria-label", "Saved character variations");
    });

    document.querySelectorAll("button[aria-pressed]").forEach((button) => {
      if (!button.getAttribute("aria-label") && button.textContent.trim()) {
        button.setAttribute("aria-label", button.textContent.trim());
      }
    });
  }

  function announceComposition(detail) {
    const title = detail?.label || detail?.title || characterTitle?.textContent || "Character";
    const mode = detail?.mode === "parts" ? "Build a face" : "Complete face";
    announce(`${title}. ${mode} updated.`);
  }

  installLandmarks();
  installMobilePanelNavigation();
  installModeTabKeyboard();
  installControlSemantics();
  syncModeTabs();
  activateMobilePanel("assets");

  mobileQuery.addEventListener?.("change", syncPanelVisibility);

  global.addEventListener("cute:complete-face-change", (event) => announceComposition(event.detail));
  global.addEventListener("cute:composition-change", (event) => announceComposition(event.detail));
  global.addEventListener("cute:variation-saved", () => announce("Variation saved on this device."));
  global.addEventListener("cute:export-error", (event) => announce(event.detail?.message || "Export failed."));
  global.addEventListener("cute:storage-error", () => announce("Saved variations storage is unavailable."));

  global.CuteResponsiveA11y = Object.freeze({
    getMobilePanel: () => activeMobilePanel,
    setMobilePanel: (panel) => activateMobilePanel(panel),
    announce,
    sync: () => {
      syncModeTabs();
      syncPanelVisibility();
      installControlSemantics();
    }
  });

  global.dispatchEvent(new CustomEvent("cute:responsive-a11y-ready"));
})(window);
