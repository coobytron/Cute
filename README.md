# Cute Face Builder

A deterministic, pre-drawn animal character builder made from authored complete faces, approved reusable parts, mixed-media layers, and seeded finishing effects.

![Cute Face Lab MVP](previews/cute-face-mvp-board.png)

## Product contract

The supplied **Cute Face Builder** mockup remains the product and visual source of truth. See [`docs/MVP-TARGET.md`](docs/MVP-TARGET.md) for the canonical layout, controls, responsive intent, export requirements, and source hierarchy.

The runtime is composition-only:

- complete faces and reusable parts are authored artwork
- raster, WebP, and SVG layers may be composed through declared masks, anchors, blend modes, opacity, and z-order
- seeded finishing effects may alter surface, lighting, graphic treatment, or scene presentation
- the browser may select, position, layer, clip, mask, mirror, scale, rotate, switch declared variants, save, and export
- the browser must not infer, generate, morph, or procedurally construct animal anatomy

## Run locally

The manifest-backed asset library uses browser `fetch`, so serve the repository rather than opening `index.html` directly from the filesystem.

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000` in Safari or Chromium. GitHub Pages also works. There is no package install, build step, backend, account, or generative model.

For consolidated review, open:

- `http://localhost:8000/previews/mvp-release-review.html`
- `http://localhost:8000/previews/contact-sheets/character-roster-36.html`
- `http://localhost:8000/previews/mixed-asset-review.html`
- `http://localhost:8000/previews/effects-review.html`
- `http://localhost:8000/previews/contact-sheets/character-effects-matrix.html`

## Shipped V2

### Character library

- 36 approved authored complete faces: the original 12-character library plus 24 structurally distinct additions
- two mixed-media reference characters available in the Characters library:
  - Raster Mallow Cat using PNG base and mask layers with a masked WebP texture
  - Mixed Berry Fox using SVG base, mask, highlights, and linework with PNG shading
- manifest-driven Complete faces mode with stable IDs, thumbnails, transforms, save/restore, shuffle, and PNG export
- authored Build a face mode with 5 bases, 8 ear sets, 8 eye sets, 6 snouts, 5 cheek treatments, 6 marking sets, 7 accessory choices, and 12 curated layered recipes
- compatibility allow-lists, fallback behavior, z-order, normalized anchors, and base-specific overrides

### Art direction and effects

- composition scale, rotation, horizontal flip, compatible shuffle, and recipe reset
- four fixed foundational finishes: Classic paper, Clean studio, Thermal print, and Sticker
- authored backgrounds, frames, expression mappings, palettes, captions, and transparent preview/export
- six seeded finishing presets: Soft Plush, Candy Gloss, Riso Friend, Paper Sticker, Dream Glow, and Pixel Pet
- 12 non-destructive effects across surface, lighting, graphic, and scene categories
- compact, standard, high, and automatic performance tiers
- matching effect state across live preview, opaque PNG, transparent PNG, and copied recipe JSON

### Workflow and delivery

- undo and redo across both composer modes with grouped sliders and keyboard shortcuts
- schema-versioned local saved variations, exact restore, persistent favorites, thumbnails, deletion, and storage-failure recovery
- accessible Export menu for opaque 1600 px PNG, transparent PNG, and copied recipe JSON
- stable filenames, font/image readiness, object URL cleanup, and announced export failures
- responsive layouts at 1600, 1280, 1024, 768, and 390 px
- stage-first phone layout, mobile Assets / Art direction navigation, touch targets, and horizontal saved variations
- skip link, named regions, keyboard tab behavior, live announcements, reduced motion, forced colors, and hidden-panel focus isolation
- 384 px and 576 px thermal review output

## Runtime APIs

Primary browser APIs include:

- `window.CuteAssetManifest`
- `window.CuteCompleteFaces`
- `window.CuteBuildFace`
- `window.CuteArtDirection`
- `window.CuteHistorySaves`
- `window.CuteExport`
- `window.CuteResponsiveA11y`
- `window.CuteMixedAssets`
- `window.CuteMixedAssetIntegration`
- `window.CuteEffects`
- `window.CuteEffectsController`
- `window.CuteExportEffects`

## Authored asset system

The canonical base manifest is [`assets/manifest.json`](assets/manifest.json). The V2 roster expansion is [`assets/roster-expansion.json`](assets/roster-expansion.json), the mixed-media references are [`assets/mixed-asset-fixtures.json`](assets/mixed-asset-fixtures.json), and effect definitions are [`assets/effects-presets.json`](assets/effects-presets.json).

These contracts define stable IDs, source files, formats, native canvas sizes, transforms, anchors, z-order, masks, blend modes, opacity, species tags, compatibility, palettes, export bounds, review status, and curated recipes.

Authoring and integration documentation:

- [`docs/ASSET-GUIDE.md`](docs/ASSET-GUIDE.md)
- [`docs/CHARACTER-ROSTER.md`](docs/CHARACTER-ROSTER.md)
- [`docs/BUILD-A-FACE.md`](docs/BUILD-A-FACE.md)
- [`docs/MIXED-ASSET-PIPELINE.md`](docs/MIXED-ASSET-PIPELINE.md)
- [`docs/ART-DIRECTION.md`](docs/ART-DIRECTION.md)
- [`docs/EFFECTS.md`](docs/EFFECTS.md)
- [`docs/HISTORY-SAVES.md`](docs/HISTORY-SAVES.md)
- [`docs/EXPORT.md`](docs/EXPORT.md)
- [`docs/RESPONSIVE-A11Y.md`](docs/RESPONSIVE-A11Y.md)

Release documentation:

- [`docs/MVP-FEATURE-MAP.md`](docs/MVP-FEATURE-MAP.md)
- [`review-artifacts/mvp-feature-map.json`](review-artifacts/mvp-feature-map.json)
- [`docs/RELEASE-CHECKLIST.md`](docs/RELEASE-CHECKLIST.md)
- [`docs/KNOWN-LIMITATIONS.md`](docs/KNOWN-LIMITATIONS.md)
- [`docs/ART-DIRECTION-SIGNOFF.md`](docs/ART-DIRECTION-SIGNOFF.md)

## Validation

Node.js 18 or newer is sufficient.

Run the complete release validation:

```bash
node scripts/validate-release.mjs
```

The aggregate command runs focused validators, checks the 36-character roster, two mixed-media fixtures, six presets, 12 effects, 494 deterministic character/effect review cases, production bootstrap, required artifacts, and product documentation. It exits non-zero on automated failures and writes `review-artifacts/release-validation.json`.

Focused validators remain available:

```bash
node scripts/validate-manifest.mjs
node scripts/validate-roster-expansion.mjs
node scripts/validate-complete-faces.mjs
node scripts/validate-build-face.mjs
node scripts/validate-art-direction.mjs
node scripts/validate-history-saves.mjs
node scripts/validate-export.mjs
node scripts/validate-responsive-a11y.mjs
node scripts/validate-mixed-assets.mjs
node scripts/validate-effects-bootstrap.mjs
node scripts/validate-effects-integration.mjs
node scripts/generate-character-effect-matrix.mjs
```

Automated validation does not replace live Safari, Chromium, iPhone, VoiceOver, 200% zoom, physical thermal-printer, or human art-direction review. Those gates remain explicit.

## Deterministic review artifacts

- Consolidated MVP dashboard: [`previews/mvp-release-review.html`](previews/mvp-release-review.html)
- Original MVP release matrix: [`previews/contact-sheets/release-matrix.html`](previews/contact-sheets/release-matrix.html)
- Complete 36-character roster: [`previews/contact-sheets/character-roster-36.html`](previews/contact-sheets/character-roster-36.html)
- Mixed-media review: [`previews/mixed-asset-review.html`](previews/mixed-asset-review.html)
- Effects review: [`previews/effects-review.html`](previews/effects-review.html)
- Character × effect matrix: [`previews/contact-sheets/character-effects-matrix.html`](previews/contact-sheets/character-effects-matrix.html)
- Build-a-face compatibility: [`previews/contact-sheets/build-face-compatibility.html`](previews/contact-sheets/build-face-compatibility.html)
- Finish and thermal comparison: [`previews/contact-sheets/art-direction-finishes.html`](previews/contact-sheets/art-direction-finishes.html)
- Export fixture matrix: [`previews/export-fixtures/export-matrix.html`](previews/export-fixtures/export-matrix.html)
- Responsive viewport review: [`previews/responsive-review.html`](previews/responsive-review.html)

The character/effect report records 38 browseable character cases: 36 canonical and expanded complete faces plus two mixed-media references. It generates 494 stable default, full-resolution preset, and mobile-thumbnail cases with seed `260801`.

## Visual direction

- rounded animal silhouettes with warm, slightly imperfect ink
- large readable eyes and restrained blush
- coherent species-specific ears, muzzles, markings, wool, fur, antlers, and spines
- warm cream interface cards with coral, apricot, mint, butter, powder-blue, and lavender accents
- illustrated paper, print, gloss, pixel, and plush materiality rather than flat emoji styling
- stable authored assets selected and composed at runtime, never procedurally drawn

## Source-of-truth hierarchy

1. approved high-fidelity MVP mockup
2. [`docs/MVP-TARGET.md`](docs/MVP-TARGET.md)
3. authored manifests, fixture contracts, and asset guides
4. deterministic V2 visual QA artifacts and machine-readable reports
5. older preview boards

The project roadmap and acceptance history are tracked in GitHub Issues beginning with [#1](https://github.com/coobytron/Cute/issues/1).
