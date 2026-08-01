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

## Art guide for complete-face characters

### Canvas and safe area

Every complete-face asset uses:

- Artboard: `1000 × 1000` SVG viewBox, transparent background
- **Character safe zone**: `x: 120–880`, `y: 80–940` (all silhouette details stay inside)
- Ears, antlers, wool, and spines may extend as high as `y: 80` but must stay above `y: 0`
- Whiskers and cheek pouches may reach as wide as `x: 80–920` but must not clip
- Export bounds in the manifest must fully contain every silhouette feature without cropping

### Line treatment

- **Outer contour** (class `.o`): `stroke-width: 18`, round cap and join, color `#2d2723`
- **Interior detail** (class `.d`): `stroke-width: 12`, round cap and join, color `#2d2723`
- Fine whiskers or forehead marks may use explicit `stroke-width` values of `6–10`
- All strokes use `stroke-linecap: round` and `stroke-linejoin: round`
- No hairlines below `stroke-width: 5` in production artwork

### Texture

- A subtle dot pattern is optional at the SVG level (`<pattern>` with 2.2 r circles, 10% opacity)
- The Classic Paper finish overlay provides global paper texture at the application layer
- Do not bake coarse textures into the character body; keep fills clean and let the finish layer do its job

### Eye construction

All 12 characters share the same glossy-eye recipe:

1. **Iris / pupil**: teardrop or soft oval, filled `#2d2723`
   - Teardrop: cubic bézier pointing downward — e.g. `C 345 405 430 405 430 472 C 430 537 388 566 388 566`
   - Oval: `<ellipse rx="28–42" ry="38–48"/>`
2. **Specular highlight**: white circle `r: 9–15`, offset toward the 10 o'clock position of the iris
3. **Eye separation**: left iris centered near `x: 375–395`, right iris near `x: 605–625`
4. Both eyes must match in size and highlight placement for mirror-ready export

Eye scale governs perceived expression weight. Keep iris short axis ≥ 56 px at 1000-px canvas.

### Blush

- Two soft ellipses flanking the nose, set to `opacity: 0.75–0.82`
- Typical size: `rx: 60–70, ry: 30–38`
- Color: species-appropriate warm pink or accent hue (e.g. `#FF786B`, `#FF93A5`, `#FF9060`)
- Center placement: approximately `(308, 630)` and `(692, 630)` — adjust ±20 px per species
- Blush must not overpower the iris or obscure the muzzle

### Palette limits

- Each complete-face asset declares one or more supported palette IDs
- The base body color maps to one palette token — changing palette means supplying an alternate authored variant, not a CSS filter
- Blush, inner-ear, and muzzle accents are authored directly as specific hex values; they do not vary by palette unless a separate variant is supplied
- Maximum 6 distinct named hex values per character (body, inner-ear/marking, muzzle, blush, outline `#2d2723`, and one optional accent)

### Thumbnail rules

- Square, transparent background
- The production SVG file may serve as its own thumbnail (the `thumbnail` field may equal `sourceFile`)
- Character is centered consistently within the 1000 × 1000 viewport — no random offsets per character
- All details must remain readable at 96 px rendered size (icons, selection cards)
- No labels, version marks, or selection halos baked into the artwork
- Contact-sheet review at 280 × 280 px per cell is the primary thumbnail QA surface

### Accessory anchor

Each complete-face asset declares an `accessoryAnchor` object in the manifest:

```json
"accessoryAnchor": { "x": 725, "y": 350 }
```

This point is the default attachment origin for a front accessory in canonical canvas coordinates. Common placements:

- Ear top-right: ~`(720, 310–370)`
- Ear top-left: ~`(280, 310–370)`
- Crown center: ~`(500, 190–260)`
- Collar/tag: ~`(680–800, 850–930)`

The anchor is documentation for designers; the application may use it as a default `accessory.defaultTransform` offset.

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
