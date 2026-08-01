# Cute Face Builder

A deterministic, pre-drawn animal face builder made from authored complete characters and approved reusable parts.

![Cute Face Lab MVP](previews/cute-face-mvp-board.png)

## Approved MVP target

The supplied **Cute Face Builder** mockup is the product and visual source of truth. See [`docs/MVP-TARGET.md`](docs/MVP-TARGET.md) for the canonical layout, controls, responsive intent, export requirements, and source-of-truth hierarchy.

The product contract is authored-only:

- complete faces are precomposed transparent SVG artwork
- Build a face uses authored layers and approved combinations
- the browser may select, position, layer, clip, mask, mirror, scale, rotate, switch declared variants, apply fixed finishes, save, and export
- the browser must not infer or generate animal anatomy

## Run locally

The manifest-backed asset library uses browser `fetch`, so serve the repository rather than opening `index.html` directly from the filesystem.

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000` in Safari or Chromium. GitHub Pages also works. There is no package install, build step, backend, or generative model.

## Current browser implementation

- 12 approved complete animal faces: cat, bunny, bear, puppy, fox, raccoon, deer, koala, hamster, lamb, hedgehog, and tiger
- manifest-driven Complete faces mode with authored thumbnails and shared stage rendering
- authored Build a face mode with 5 bases, 8 ear sets, 8 eye sets, 6 snouts, 5 cheek treatments, 6 marking sets, 7 accessory choices, and 12 curated layered recipes
- compatibility allow-lists, fallback behavior, stable IDs, z-order, default transforms, and base-specific overrides
- composition scale, rotation, horizontal flip, compatible shuffle, and recipe reset
- four fixed finishes: Classic paper, Clean studio, Thermal print, and Sticker
- authored backgrounds, frames, expression mappings, palette support, captions, and transparent export preview
- undo and redo across both composer modes with grouped sliders and keyboard shortcuts
- schema-versioned local saved variations, exact restore, persistent favorites, thumbnails, deletion, and storage-failure recovery
- accessible Export menu for opaque 1600 px PNG, transparent PNG, and copied recipe JSON
- stable filenames, font/image readiness, object URL cleanup, and announced export failures
- responsive layouts reviewed at 1600, 1280, 1024, 768, and 390 px
- stage-first phone layout, mobile Assets / Art direction navigation, touch targets, and horizontal saved variations
- skip link, named regions, keyboard tab behavior, live announcements, reduced motion, forced colors, and hidden-panel focus isolation
- 384 px and 576 px thermal review output

The primary browser APIs are:

- `window.CuteCompleteFaces`
- `window.CuteBuildFace`
- `window.CuteArtDirection`
- `window.CuteHistorySaves`
- `window.CuteExport`
- `window.CuteResponsiveA11y`

## Authored asset system

The canonical manifest is [`assets/manifest.json`](assets/manifest.json). It defines stable IDs, asset types, source files, thumbnails, native canvas size, transforms, anchors, z-order, species tags, compatibility, palette support, export bounds, review status, and curated recipes.

Authoring and integration documentation:

- [`docs/ASSET-GUIDE.md`](docs/ASSET-GUIDE.md)
- [`docs/BUILD-A-FACE.md`](docs/BUILD-A-FACE.md)
- [`docs/ART-DIRECTION.md`](docs/ART-DIRECTION.md)
- [`docs/HISTORY-SAVES.md`](docs/HISTORY-SAVES.md)
- [`docs/EXPORT.md`](docs/EXPORT.md)
- [`docs/RESPONSIVE-A11Y.md`](docs/RESPONSIVE-A11Y.md)

## Validation

Node.js 18 or newer is sufficient.

```bash
node scripts/validate-manifest.mjs
node scripts/validate-complete-faces.mjs
node scripts/validate-build-face.mjs
node scripts/validate-art-direction.mjs
node scripts/validate-history-saves.mjs
node scripts/validate-export.mjs
node scripts/validate-responsive-a11y.mjs
```

GitHub Actions also checks browser-script syntax. Validation fails on missing files, duplicate IDs, invalid transforms or bounds, broken recipe references, unsupported compatibility, incomplete category counts, missing runtime integration, incomplete Art direction contracts, history/persistence regressions, export regressions, or responsive/accessibility contract regressions.

## Deterministic review artifacts

- Complete-face contact sheets: [`previews/contact-sheets/`](previews/contact-sheets/)
- Build-a-face compatibility sheet: [`previews/contact-sheets/build-face-compatibility.html`](previews/contact-sheets/build-face-compatibility.html)
- Finish and thermal comparison: [`previews/contact-sheets/art-direction-finishes.html`](previews/contact-sheets/art-direction-finishes.html)
- Export fixture matrix: [`previews/export-fixtures/export-matrix.html`](previews/export-fixtures/export-matrix.html)
- Responsive viewport review: [`previews/responsive-review.html`](previews/responsive-review.html)

## Visual direction

- rounded animal silhouettes with warm, slightly imperfect ink
- large readable eyes and restrained blush
- coherent species-specific ears, muzzles, markings, wool, fur, antlers, and spines
- warm cream interface cards with coral, apricot, mint, butter, powder-blue, and lavender accents
- illustrated paper and fur materiality rather than flat emoji styling
- stable authored assets selected and composed at runtime, never procedurally drawn

## Source-of-truth hierarchy

1. approved high-fidelity MVP mockup
2. [`docs/MVP-TARGET.md`](docs/MVP-TARGET.md)
3. [`assets/manifest.json`](assets/manifest.json) and the asset guides
4. deterministic visual QA artifacts
5. older preview boards

The implementation roadmap is tracked in GitHub Issues beginning with [#1](https://github.com/coobytron/Cute/issues/1).
