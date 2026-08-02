# Mixed asset pipeline

Issue #25 extends Cute Face Builder beyond vector-only artwork while preserving the authored-only product rule.

## Agent Cody Banks assignment

Source roster: `coobytron/Agent-Cody-Banks`.

- **Producer** — scope, sequencing, dependency and delivery record.
- **Creative Director** — protects authored visual coherence.
- **Architect** — owns the mixed-media contract and failure boundaries.
- **Creative Technologist** — owns compositing prototypes and reference fixtures.
- **JavaScript Specialist** — owns loading, Canvas rendering, masks, export parity and tests.
- **Art Director** — reviews alpha edges, texture scale and mixed-media fidelity.
- **Performance Reviewer** — checks compact/mobile behavior.
- **Export Recovery Reviewer** — checks broken assets and transparent output.
- **Deterministic QA Reviewer** — checks stable IDs, ordering and repeatability.

Relevant charters:

- `agents/leadership/PRODUCER.md`
- `agents/leadership/CREATIVE-DIRECTOR.md`
- `agents/technology/ARCHITECT.md`
- `agents/technology/CREATIVE-TECHNOLOGIST.md`
- `agents/technology/JAVASCRIPT-SPECIALIST.md`
- `agents/creative/ART-DIRECTOR.md`

## Runtime contract

The canonical canvas is 1000 × 1000. Every layer declares:

- stable `id`
- repository-relative `sourceFile`
- `format`: `svg`, `png`, or `webp`
- `layerRole`: `base-color`, `linework`, `shading`, `highlight`, `texture`, or `effect-mask`
- `nativeCanvas`
- `pixelDensity`
- normalized `anchor`
- `defaultTransform`
- `zOrder`
- `blendMode`
- `opacity`
- optional `maskRef`
- `tintable`
- optional `visible: false` for masks and helper layers

`mixed-asset-v2.js` preloads and decodes layers, sorts them deterministically, applies masks offscreen, composites with Canvas 2D blend modes, and reports recoverable errors.

## Included reference fixtures

### Raster Mallow Cat

A fully raster character using:

- transparent PNG base
- transparent PNG mask
- lossless WebP texture
- masked `multiply` texture pass

### Mixed Berry Fox

A mixed-format character using:

- SVG base color
- transparent PNG shading
- SVG mask
- SVG highlights
- SVG linework
- masked `multiply` and `screen` compositing

Both fixtures appear under **Mixed media references** in the Characters library. They support scale, tilt, horizontal flip, opaque PNG export, transparent PNG export, and recipe JSON export.

## Authoring settings

### Photoshop

1. Work at 2000 × 2000 for 2× raster delivery or 1000 × 1000 for 1×.
2. Keep the document background transparent.
3. Align artwork to the canonical center at 500, 500.
4. Export base, shading, highlight, texture, and mask layers separately.
5. Use PNG-24 with transparency for masks and critical alpha edges.
6. Use lossless WebP for texture/highlight layers when file size benefits.
7. Avoid color-profile conversions that shift the approved palette.

### Procreate

1. Use a square transparent canvas with the same pixel dimensions as `nativeCanvas`.
2. Keep each runtime layer in a named group matching its `layerRole`.
3. Export masks as white artwork over transparent pixels.
4. Disable the background layer before PNG export.
5. Inspect edges against both light and dark backgrounds.

### Illustrator

1. Use a 1000 × 1000 artboard.
2. Keep viewBox coordinates at `0 0 1000 1000`.
3. Expand appearance only when required for stable browser rendering.
4. Do not embed text; convert approved lettering to outlines.
5. Preserve transparent bounds and remove unused artboard backgrounds.
6. Use SVG for linework or flat color layers that should remain resolution-independent.

## Validation

Run:

```bash
node scripts/validate-mixed-assets.mjs
```

Open:

```text
previews/mixed-asset-review.html
```

Automated validation checks schema, stable IDs, file existence, PNG alpha, dimensions, formats, layer roles, mask references, deterministic z-order, runtime wiring, export integration, and reference coverage. Browser and art-direction review remain required.
