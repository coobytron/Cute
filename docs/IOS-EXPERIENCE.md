# iOS experience

The iOS layer is a correction and enhancement pass over the same authored application. There is no separate iOS codebase, no user-agent-forked layout, and no change to the approved desktop art direction.

It is delivered by:

- [`assets/ios-experience.css`](../assets/ios-experience.css) — WebKit and touch behaviour, loaded after every other authored stylesheet
- [`ios-experience.js`](../ios-experience.js) — share-sheet export, stage gestures, viewport and keyboard handling
- [`site.webmanifest`](../site.webmanifest) and [`assets/icons/`](../assets/icons) — Add to Home Screen identity
- iOS meta tags in [`index.html`](../index.html)

The runtime loads immediately after `export-menu.js` so its capture-phase export listener is registered before the mixed-media and effects export layers. Everything it renders is delegated back to whichever export layer is installed, so mixed-media and effects output stay identical.

## Review devices

Use [`previews/ios-review.html`](../previews/ios-review.html) through the local HTTP server, then repeat the same passes on hardware:

- 375 × 667 — iPhone SE
- 390 × 844 — iPhone 13 / 14 / 15
- 393 × 852 — iPhone 15 Pro
- 430 × 932 — iPhone Pro Max
- 744 × 1133 — iPad mini portrait
- 1024 × 768 — iPad landscape

The preview reproduces viewport sizes only. Safe areas, the share sheet, the software keyboard, momentum scrolling, and gesture behaviour need a real device.

## Viewport and safe areas

- the viewport declares `viewport-fit=cover`, so authored content can use the full display
- `env(safe-area-inset-*)` is mirrored into `--ios-safe-top/right/bottom/left`
- the full-bleed shell pads its inline edges by the safe area, which keeps cards clear of the notch, the Dynamic Island, and the landscape sensor housing
- the footer pads the home indicator
- `100dvh` replaces `100vh` where supported, so the Safari toolbar no longer covers the final row
- page zoom is never disabled; there is no `user-scalable=no` and no `maximum-scale`

## Touch behaviour

- `touch-action: manipulation` on every control removes the 300 ms double-tap delay and double-tap zoom
- hover affordances are neutralised under `@media (hover: none)` because WebKit keeps `:hover` applied after a tap
- touch gets its own press feedback through `:active`, suppressed under reduced motion
- long press no longer raises the callout menu or starts a selection drag on authored cards
- text fields render at 16 px on coarse pointers, which is what stops iOS from zooming the page on focus
- range thumbs become 28 px targets inside a 44 px row on coarse pointers
- horizontal rails keep momentum scrolling and contain their rubber-banding

## Scroll length and scroll cost

Stacking every authored panel into the document made the phone layout punishing: the page ran to seven screens and the composition sat thousands of pixels above the library that edits it.

Page length on a 664 px viewport:

| Panel | Before | After |
|---|---|---|
| Complete faces | 4884 px (7.4 screens) | 1837 px (2.8 screens) |
| Build a face | 3157 px (4.8 screens) | 1837 px (2.8 screens) |
| Art direction | 3094 px (4.7 screens) | 1552 px (2.3 screens) |

- below 760 px the library content and the Art direction panel become bounded regions of `min(64svh, 620px)` that scroll inside themselves, so the document stays short and the stage stays one screen away
- `svh` is used rather than `vh` so Safari's collapsing toolbar does not resize the panel mid-scroll, with a `vh` fallback first in the cascade
- `overscroll-behavior: contain` stops an inner scroll from chaining into the page
- CSS scroll shadows mark the bounded edges, so a cut-off row reads as more content rather than as the end
- the part-category rail stays pinned while its grid scrolls
- a **Back to face** control appears on phones once the stage leaves the viewport, and returns to it clear of the sticky bars
- the authored card layouts are untouched; nothing was compressed to buy the space

Scroll cost on coarse pointers:

- the full-screen grain layer stops being `position: fixed`, so WebKit no longer re-composites a multiply-blended layer over the whole viewport on every frame
- the two sticky bars drop `backdrop-filter` for a solid background; a per-frame backdrop blur is the most expensive thing on a scrolling page
- long card lists use `content-visibility: auto` with `contain-intrinsic-size`, so off-screen authored cards are not laid out or painted

Desktop keeps the fixed grain, the blurred bars, and the unbounded panels.

## Stage gestures

On touch devices the stage takes over the pinch gesture rather than zooming Safari:

- one finger still scrolls the page (`touch-action: pan-y`)
- two fingers pinch to drive `#scaleControl`
- twisting two fingers past 5° drives `#rotationControl`, damped so the authored ±8° range stays usable
- a live readout shows scale and tilt while gesturing
- double-tap resets both controls to their authored defaults
- a one-time hint explains the gestures and is remembered in local storage

Gestures write through the same range inputs the Art direction panel uses, so every composer mode, undo/redo, and saved variations behave exactly as they do with the sliders. Results are announced through the existing live region.

## Export and sharing

On iOS the PNG export items open the native share sheet instead of a download:

- the PNG is rendered through `CuteExport.renderPngBlob`, so classic, mixed-media, and effects output are unchanged
- the file is offered to `navigator.share` with the authored filename, which allows Save to Photos, Save to Files, AirDrop, Messages, and Mail
- cancelling the share sheet is reported as cancelled, not as a failure
- if the share sheet is unavailable, or the user gesture expires while the 1600 px PNG renders, the same blob falls back to the existing download path
- Copy recipe JSON is unchanged and still uses the clipboard

## Software keyboard

- the visual viewport is tracked, and `--ios-viewport-height` is published for layout
- while the keyboard is open, sticky bars drop to static so they cannot float over the middle of the composition
- character name and caption fields disable autocorrect and spell check, keep word capitalisation, and show a Done key that dismisses the keyboard

## Add to Home Screen

- `site.webmanifest` declares a standalone display, scope, and theme colours
- `apple-touch-icon-180.png` is the iOS home-screen icon; 192 px and 512 px icons cover the manifest
- icons are generated deterministically by [`scripts/generate-ios-icons.mjs`](../scripts/generate-ios-icons.mjs) from the authored brand mark, so they can be reviewed and regenerated rather than trusted as opaque binaries
- in standalone mode the shell pads the status bar area

## Validation

```bash
node scripts/validate-ios-experience.mjs
node scripts/generate-ios-icons.mjs
```

The validator checks the contract only: meta tags, stylesheet tokens, runtime tokens, load order, manifest fields, icon files, and this document. It does not run a real browser. Live iPhone and iPad review, VoiceOver, the share sheet, Add to Home Screen, and gesture feel remain manual release checks.
