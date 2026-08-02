(function installCuteIosExperience(global) {
  "use strict";

  const root = document.documentElement;
  const HINT_KEY = "cute-face-lab:ios-gesture-hint:v1";
  const DEFAULT_SIZE = 1600;
  const ROTATION_DAMPING = 0.4;
  const ROTATION_THRESHOLD = 5;
  const DOUBLE_TAP_MS = 320;
  const DOUBLE_TAP_SLOP = 44;
  const KEYBOARD_THRESHOLD = 140;

  const userAgent = global.navigator?.userAgent || "";
  const maxTouchPoints = global.navigator?.maxTouchPoints || 0;

  /* iPadOS 13+ reports itself as MacIntel, so touch points are the reliable tell. */
  const isIOS = /iP(?:hone|od|ad)/.test(userAgent)
    || (global.navigator?.platform === "MacIntel" && maxTouchPoints > 1);
  const isTouch = maxTouchPoints > 0 || global.matchMedia?.("(pointer: coarse)").matches === true;
  const isStandalone = global.navigator?.standalone === true
    || global.matchMedia?.("(display-mode: standalone)").matches === true;

  const settings = {
    shareExport: isIOS,
    gestures: isTouch
  };

  const stage = document.getElementById("stage");
  const pointers = new Map();
  const gesture = {
    active: false,
    distance: 0,
    angle: 0,
    scale: 100,
    rotation: 0,
    rotated: false,
    lastTapAt: 0,
    lastTapX: 0,
    lastTapY: 0
  };

  let readout = null;
  let hint = null;
  let hintTimer = null;

  function announce(message) {
    global.CuteResponsiveA11y?.announce?.(message);
  }

  function scaleControl() {
    return document.getElementById("scaleControl");
  }

  function rotationControl() {
    return document.getElementById("rotationControl");
  }

  function applyPlatformClasses() {
    root.classList.toggle("is-ios", isIOS);
    root.classList.toggle("is-touch", isTouch);
    root.classList.toggle("ios-standalone", isStandalone);
    root.dataset.iosExperience = "on";
  }

  /* Sticky bars measure differently per breakpoint, orientation and safe area. */
  function syncStickyOffset() {
    const bar = document.querySelector(".header-actions");
    const nav = document.querySelector(".mobile-panel-nav");
    const barSticky = bar && global.getComputedStyle(bar).position === "sticky";
    const navSticky = nav && global.getComputedStyle(nav).position === "sticky";
    const offset = (barSticky ? bar.getBoundingClientRect().height : 0)
      + (navSticky ? nav.getBoundingClientRect().height + 6 : 0);
    root.style.setProperty("--ios-sticky-offset", `${Math.round(offset)}px`);
    return offset;
  }

  /* The software keyboard shrinks the visual viewport only; sticky elements
     otherwise float over the middle of the screen while typing. */
  function syncVisualViewport() {
    const viewport = global.visualViewport;
    if (!viewport) return;
    root.style.setProperty("--ios-viewport-height", `${Math.round(viewport.height)}px`);
    const keyboardOpen = global.innerHeight - viewport.height > KEYBOARD_THRESHOLD;
    root.classList.toggle("ios-keyboard-open", keyboardOpen);
  }

  /* iOS autocorrects and auto-capitalises authored names and captions, and the
     virtual keyboard has no obvious way to dismiss itself. */
  function applyTextFieldHints(field) {
    if (!field || field.dataset.iosField === "true") return;
    field.dataset.iosField = "true";
    field.setAttribute("autocorrect", "off");
    field.setAttribute("autocomplete", "off");
    field.setAttribute("spellcheck", "false");
    field.setAttribute("enterkeyhint", "done");
    if (!field.hasAttribute("autocapitalize")) field.setAttribute("autocapitalize", "words");
  }

  function syncTextFields() {
    document.querySelectorAll('#nameInput, #captionInput, .art-caption-input, .text-input, input[type="text"]')
      .forEach(applyTextFieldHints);
  }

  function showStatus(message, isError = false) {
    const status = document.querySelector(".export-status");
    if (!status) return;
    status.hidden = false;
    status.classList.toggle("is-error", isError);
    status.textContent = message;
    global.setTimeout(() => {
      status.hidden = true;
      status.classList.remove("is-error");
      status.textContent = "";
    }, isError ? 7000 : 3200);
  }

  function exporter() {
    return global.CuteExport;
  }

  function shareSupported() {
    return typeof global.navigator?.share === "function"
      && typeof global.navigator?.canShare === "function"
      && typeof global.File === "function";
  }

  function canShareFile(file) {
    try {
      return global.navigator.canShare({ files: [file] });
    } catch (error) {
      return false;
    }
  }

  function shareExportEnabled() {
    return Boolean(settings.shareExport && isIOS && shareSupported() && exporter()?.renderPngBlob);
  }

  function shareTitle() {
    const title = document.getElementById("characterTitle")?.textContent?.trim();
    return title ? `${title} — Cute Face Lab` : "Cute Face Lab";
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.hidden = true;
    document.body.appendChild(link);
    link.click();
    link.remove();
    global.setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  /* Renders through whichever export layer is installed (base, mixed media or
     effects) and hands the PNG to the iOS share sheet instead of a download. */
  async function sharePng(options = {}) {
    const api = exporter();
    if (!api?.renderPngBlob) throw new Error("The export renderer is not ready yet.");

    const normalized = {
      size: options.size || DEFAULT_SIZE,
      transparent: Boolean(options.transparent)
    };
    const blob = await api.renderPngBlob(normalized);
    const filename = api.makeFilename?.(normalized) || "cute-face.png";

    if (shareSupported()) {
      const file = new File([blob], filename, { type: "image/png", lastModified: Date.now() });
      if (canShareFile(file)) {
        try {
          await global.navigator.share({ files: [file], title: shareTitle() });
          return { delivery: "share", filename, blob };
        } catch (error) {
          if (error?.name === "AbortError") return { delivery: "cancelled", filename, blob };
          /* NotAllowedError means the user gesture expired while the PNG
             rendered, so the download path still has to deliver the file. */
        }
      }
    }

    downloadBlob(blob, filename);
    return { delivery: "download", filename, blob };
  }

  function closeExportMenu() {
    const menu = document.getElementById("exportMenu");
    const button = document.querySelector('[aria-controls="exportMenu"]');
    if (menu) menu.hidden = true;
    button?.setAttribute("aria-expanded", "false");
  }

  function setExportBusy(busy) {
    const button = document.querySelector('[aria-controls="exportMenu"]');
    if (button) {
      button.disabled = busy;
      button.setAttribute("aria-busy", String(busy));
    }
    document.querySelectorAll("#exportMenu [data-export-action]").forEach((item) => {
      item.disabled = busy;
    });
  }

  function labelShareMenu() {
    if (!shareExportEnabled()) {
      root.classList.remove("ios-share-export");
      return;
    }
    root.classList.add("ios-share-export");
    const opaque = document.querySelector('#exportMenu [data-export-action="png"] small');
    const transparent = document.querySelector('#exportMenu [data-export-action="transparent"] small');
    if (opaque) opaque.textContent = "Share sheet · Photos, Files or AirDrop";
    if (transparent) transparent.textContent = "1600 px transparent · share sheet";
  }

  async function interceptExportMenu(event) {
    if (!shareExportEnabled()) return;
    const item = event.target.closest?.("[data-export-action]");
    if (!item) return;
    const action = item.dataset.exportAction;
    if (action !== "png" && action !== "transparent") return;

    event.preventDefault();
    event.stopImmediatePropagation();
    closeExportMenu();
    setExportBusy(true);

    try {
      const result = await sharePng({ size: DEFAULT_SIZE, transparent: action === "transparent" });
      const message = result.delivery === "share"
        ? "PNG handed to the iOS share sheet."
        : result.delivery === "cancelled"
          ? "Sharing cancelled."
          : "PNG saved to Files.";
      showStatus(message);
      announce(message);
      global.dispatchEvent(new CustomEvent("cute:ios-share-export", {
        detail: { action, delivery: result.delivery, filename: result.filename }
      }));
    } catch (error) {
      console.error(error);
      showStatus(error?.message || "Sharing the PNG failed.", true);
      global.dispatchEvent(new CustomEvent("cute:export-error", { detail: error }));
    } finally {
      setExportBusy(false);
    }
  }

  function setControlValue(input, value) {
    if (!input) return null;
    const min = Number(input.min);
    const max = Number(input.max);
    const bounded = Math.min(Math.max(value, Number.isFinite(min) ? min : value), Number.isFinite(max) ? max : value);
    const next = Math.round(bounded);
    if (Number(input.value) === next) return next;
    input.value = String(next);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    return next;
  }

  function commitControl(input) {
    input?.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function ensureStageOverlays() {
    if (!stage || readout) return;
    readout = document.createElement("div");
    readout.className = "ios-gesture-readout";
    readout.setAttribute("aria-hidden", "true");
    stage.appendChild(readout);
  }

  function hintDismissed() {
    try {
      return global.localStorage?.getItem(HINT_KEY) === "seen";
    } catch (error) {
      return true;
    }
  }

  function rememberHint() {
    try {
      global.localStorage?.setItem(HINT_KEY, "seen");
    } catch (error) {
      /* Private browsing denies storage; the hint simply returns next visit. */
    }
  }

  function dismissHint() {
    if (!hint) return;
    if (hintTimer) global.clearTimeout(hintTimer);
    const element = hint;
    hint = null;
    element.classList.add("is-fading");
    global.setTimeout(() => element.remove(), 260);
    rememberHint();
  }

  function showGestureHint() {
    if (!stage || !settings.gestures || !isTouch || hintDismissed()) return;
    hint = document.createElement("p");
    hint.className = "ios-gesture-hint";
    hint.setAttribute("aria-hidden", "true");
    hint.textContent = "Pinch to resize · twist two fingers to tilt · double-tap to reset";
    stage.appendChild(hint);
    hintTimer = global.setTimeout(dismissHint, 7000);
  }

  function updateReadout(scale, rotation) {
    if (!readout) return;
    readout.textContent = `${scale}% · ${rotation > 0 ? "+" : ""}${rotation}°`;
  }

  function pointerPair() {
    const [first, second] = [...pointers.values()];
    return first && second ? [first, second] : null;
  }

  function pairDistance(pair) {
    return Math.hypot(pair[1].x - pair[0].x, pair[1].y - pair[0].y);
  }

  function pairAngle(pair) {
    return Math.atan2(pair[1].y - pair[0].y, pair[1].x - pair[0].x) * (180 / Math.PI);
  }

  function capturePointers() {
    if (!stage?.setPointerCapture) return;
    for (const pointerId of pointers.keys()) {
      try {
        stage.setPointerCapture(pointerId);
      } catch (error) {
        /* A pointer can end before capture is requested; the gesture simply ends. */
      }
    }
  }

  function startGesture() {
    const pair = pointerPair();
    if (!pair) return;
    capturePointers();
    gesture.active = true;
    gesture.rotated = false;
    gesture.distance = pairDistance(pair) || 1;
    gesture.angle = pairAngle(pair);
    gesture.scale = Number(scaleControl()?.value ?? 100);
    gesture.rotation = Number(rotationControl()?.value ?? 0);
    stage?.classList.add("is-gesturing");
    ensureStageOverlays();
    updateReadout(gesture.scale, gesture.rotation);
    dismissHint();
  }

  function endGesture() {
    if (!gesture.active) return;
    gesture.active = false;
    stage?.classList.remove("is-gesturing");
    commitControl(scaleControl());
    commitControl(rotationControl());
    const scale = Number(scaleControl()?.value ?? 100);
    const rotation = Number(rotationControl()?.value ?? 0);
    announce(`Face scale ${scale} percent, tilt ${rotation} degrees.`);
    global.dispatchEvent(new CustomEvent("cute:ios-gesture-end", { detail: { scale, rotation } }));
  }

  function resetTransform() {
    const scale = scaleControl();
    const rotation = rotationControl();
    setControlValue(scale, Number(scale?.defaultValue ?? 100));
    setControlValue(rotation, Number(rotation?.defaultValue ?? 0));
    commitControl(scale);
    commitControl(rotation);
    announce("Face scale and tilt reset.");
    global.dispatchEvent(new CustomEvent("cute:ios-gesture-reset"));
  }

  function registerTap(event) {
    const now = Date.now();
    const withinTime = now - gesture.lastTapAt < DOUBLE_TAP_MS;
    const withinSlop = Math.hypot(event.clientX - gesture.lastTapX, event.clientY - gesture.lastTapY) < DOUBLE_TAP_SLOP;
    if (withinTime && withinSlop) {
      gesture.lastTapAt = 0;
      resetTransform();
      return;
    }
    gesture.lastTapAt = now;
    gesture.lastTapX = event.clientX;
    gesture.lastTapY = event.clientY;
  }

  function installStageGestures() {
    if (!stage) return;

    stage.addEventListener("pointerdown", (event) => {
      if (!settings.gestures || event.pointerType !== "touch") return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size === 2) startGesture();
    });

    stage.addEventListener("pointermove", (event) => {
      if (!pointers.has(event.pointerId)) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (!gesture.active) return;
      const pair = pointerPair();
      if (!pair) return;

      event.preventDefault();

      const ratio = pairDistance(pair) / gesture.distance;
      const scale = setControlValue(scaleControl(), gesture.scale * ratio);

      let twist = pairAngle(pair) - gesture.angle;
      if (twist > 180) twist -= 360;
      if (twist < -180) twist += 360;
      if (!gesture.rotated && Math.abs(twist) > ROTATION_THRESHOLD) gesture.rotated = true;
      const rotation = gesture.rotated
        ? setControlValue(rotationControl(), gesture.rotation + twist * ROTATION_DAMPING)
        : Number(rotationControl()?.value ?? 0);

      updateReadout(scale ?? gesture.scale, rotation ?? gesture.rotation);
    }, { passive: false });

    ["pointerup", "pointercancel"].forEach((type) => {
      stage.addEventListener(type, (event) => {
        if (!pointers.has(event.pointerId)) return;
        const wasGesturing = gesture.active;
        pointers.delete(event.pointerId);
        if (wasGesturing && pointers.size < 2) endGesture();
        else if (!wasGesturing && type === "pointerup" && settings.gestures && event.pointerType === "touch") registerTap(event);
      });
    });
  }

  /* Mobile panel tabs swap the panel below the stage; without this the newly
     revealed panel can open scrolled off screen behind the sticky bars. */
  function installPanelScroll() {
    document.addEventListener("click", (event) => {
      const tab = event.target.closest?.("[data-mobile-panel]");
      if (!tab || !global.matchMedia?.("(max-width: 760px)").matches) return;
      const panel = document.getElementById(tab.getAttribute("aria-controls") || "");
      if (!panel) return;
      global.requestAnimationFrame(() => {
        const offset = syncStickyOffset() + 12;
        const top = panel.getBoundingClientRect().top + global.scrollY - offset;
        global.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      });
    });
  }

  function installKeyboardDismiss() {
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      const field = event.target;
      if (!field?.matches?.('input[type="text"], input[type="search"]')) return;
      event.preventDefault();
      field.blur();
    });
  }

  function sync() {
    applyPlatformClasses();
    syncStickyOffset();
    syncVisualViewport();
    syncTextFields();
    labelShareMenu();
  }

  applyPlatformClasses();
  ensureStageOverlays();
  installStageGestures();
  installPanelScroll();
  installKeyboardDismiss();
  document.addEventListener("click", interceptExportMenu, true);

  global.addEventListener("resize", syncStickyOffset);
  global.addEventListener("orientationchange", () => global.setTimeout(sync, 120));
  global.visualViewport?.addEventListener("resize", syncVisualViewport);
  global.visualViewport?.addEventListener("scroll", syncVisualViewport);
  ["cute:creative-controls-ready", "cute:responsive-a11y-ready", "cute:art-direction-ready", "cute:effects-ready"]
    .forEach((eventName) => global.addEventListener(eventName, () => global.setTimeout(sync, 0)));

  if (global.ResizeObserver) {
    const observer = new ResizeObserver(syncStickyOffset);
    const header = document.querySelector(".app-header");
    if (header) observer.observe(header);
  }

  sync();
  global.requestAnimationFrame(() => {
    sync();
    showGestureHint();
  });

  global.CuteIosExperience = Object.freeze({
    isIOS,
    isTouch,
    isStandalone,
    sharePng,
    resetTransform,
    sync,
    isShareExportEnabled: shareExportEnabled,
    setShareExport(enabled) {
      settings.shareExport = Boolean(enabled);
      labelShareMenu();
      return settings.shareExport;
    },
    setGestures(enabled) {
      settings.gestures = Boolean(enabled);
      if (!settings.gestures) {
        pointers.clear();
        endGesture();
      }
      return settings.gestures;
    },
    getState: () => ({
      isIOS,
      isTouch,
      isStandalone,
      shareExport: shareExportEnabled(),
      gestures: settings.gestures,
      gestureActive: gesture.active,
      stickyOffset: root.style.getPropertyValue("--ios-sticky-offset").trim() || "0px"
    })
  });

  global.dispatchEvent(new CustomEvent("cute:ios-experience-ready", {
    detail: global.CuteIosExperience.getState()
  }));
})(window);
