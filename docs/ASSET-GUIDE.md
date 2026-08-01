# Authored Asset Guide

Cute Face Builder composes approved artwork. Every visible feature must be traceable to an authored source asset or an authored complete-face recipe.

## Canonical coordinate system

- Native composition canvas: `1000 × 1000`
- Origin: top-left
- Character center: approximately `500, 520`
- Default anchor: normalized `0.5, 0.5`
- Export safe area: asset-specific bounds declared in `assets/manifest.json`
- Transform order: translate to anchor → scale → horizontal flip → rotation → final placement

Assets may use a different intrinsic pixel size, but their declared view box or native canvas must map predictably into the canonical canvas.

## Folder contract

```text
assets/
  manifest.json
  complete-faces/
  parts/
    bases/
    ears/
    eyes/
    snouts/
    cheeks/
    markings/
    accessories/
  backgrounds/
  frames/
  finishes/
  thumbnails/
```

The current five hero illustrations remain in `previews/` during migration and are referenced by stable manifest IDs. New production artwork should use the `assets/` folders.

## Required manifest fields

Each asset entry declares:

- `id`: stable kebab-case identifier; never recycle an ID for different artwork
- `label`: human-readable UI label
- `type`: complete face, base, ears, eyes, snout, cheeks, markings, accessory, background, frame, or finish
- `sourceFile`: repository-relative PNG or SVG path
- `thumbnail`: repository-relative preview path
- `nativeCanvas`: source width and height
- `anchor`: normalized x/y anchor
- `defaultTransform`: x, y, scale, rotation, and optional flip
- `zOrder`: deterministic layer order
- `speciesTags`: compatible species families
- `compatibleAssetIds`: explicit allow-list when compatibility is narrower than species tags
- `supportedPalettes`: approved palette IDs
- `exportBounds`: left, top, right, and bottom in canonical coordinates

Optional metadata may include expression support, accessory anchors, pair-specific overrides, attribution, version, review status, and notes.

## Stable ID rules

Use category-first IDs:

- `face-mochi-cat`
- `base-cat-round`
- `ears-bunny-long`
- `eyes-glossy-round`
- `snout-cat-smile`
- `cheeks-soft-blush`
- `markings-tabby-three`
- `accessory-flower-crown`

IDs are serialized into saved variations, contact sheets, and recipe JSON. Renaming a UI label must not change the ID.

## Complete faces

Complete faces may be transparent PNG or SVG files. They are valid first-class authored assets, not temporary placeholders.

Requirements:

- transparent background
- consistent scale and vertical placement
- no clipped silhouette details
- no baked-in text
- explicit export bounds
- stable thumbnail crop
- declared default palette and expression

## Layered parts

Layered parts must be authored against the canonical coordinate system and assigned a predictable z-order.

Recommended default bands:

| Layer | z-order range |
|---|---:|
| background | 0–99 |
| rear accessories / rear ears | 100–199 |
| base/head | 200–299 |
| markings | 300–399 |
| eyes / cheeks | 400–499 |
| snout / mouth | 500–599 |
| front accessories | 600–699 |
| frame / caption / finish overlays | 700–899 |

A generic anchor is not enough when a part only fits certain bases. Add pair-specific overrides instead of deforming or guessing at runtime.

## Compatibility

Compatibility is opt-in.

An asset is selectable when:

1. its species tags intersect the active base or recipe tags, and
2. any explicit compatibility allow-list includes the active counterpart, and
3. no block rule rejects the pair, and
4. the selected palette, expression, and finish are supported.

Shuffle must choose only from combinations that satisfy the same rules and have passed visual review.

## Palettes and expressions

- Raster assets are not arbitrarily recolored.
- A palette ID means a supplied variant or a documented safe vector-token substitution.
- Expressions are authored variants or authored part selections.
- Unsupported controls remain unchanged or are disabled; they do not approximate.

## Thumbnail rules

- square crop
- transparent or approved neutral background
- silhouette centered consistently
- important details readable at approximately 96 px
- no labels baked into the artwork
- selected state is rendered by the UI, not the thumbnail

## Export rules

Rendering order:

1. background
2. frame behind character, when applicable
3. rear parts
4. base or complete face
5. markings and facial features
6. front accessories
7. fixed finish treatment
8. caption
9. frame foreground, when applicable

Editor-only selection states, checkerboards, handles, and controls are never exported.

## Review workflow

Before an asset is marked approved:

- validate manifest structure and file references
- review the asset at native size and thumbnail size
- review against every compatible base
- review flipped output where flipping is supported
- review all declared palettes and finishes
- confirm export bounds do not clip silhouette details
- assign a stable review status in the manifest

The deterministic contact-sheet workflow will become the gate for expanding the production library.
