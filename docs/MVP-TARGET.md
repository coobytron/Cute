# Cute Face Builder MVP Target

The supplied **Cute Face Builder** mockup is the product, interaction, and visual source of truth for the MVP.

Repository reference images:

- `docs/reference/cute-face-builder-mvp.svg` — embedded approved high-fidelity target preview
- `previews/cute-face-mvp-board.png` — earlier working direction board
- `mvp/cute-face-mvp-board.svg` — editable early direction board

The approved mockup takes priority when the references disagree.

## Product promise

Cute Face Builder is a deterministic assembly tool made from authored animal artwork. It is not an anatomy generator.

The runtime may:

- select approved complete faces and authored parts
- position, layer, clip, mask, mirror, scale, and rotate authored assets
- switch between declared palette or expression variants
- apply fixed print treatments
- save recipes and export compositions

The runtime must not:

- infer, synthesize, or procedurally draw new anatomy
- deform parts into unsupported species
- recolor raster artwork beyond explicitly supplied variants
- shuffle into combinations that have not passed compatibility review

## Canonical desktop composition

At a 1440–1600 px viewport, the interface is organized as five visible regions.

### 1. Header

- Cute Face Builder identity and pre-drawn-system explanation
- Shuffle
- Reset
- Favorite
- Export menu

The header should feel like a compact creative-tool masthead, not a generic application toolbar.

### 2. Authored assets panel

- Complete faces / Build a face mode switch
- category pills for Bases, Ears, Eyes, Snouts, Cheeks, Markings, and Accessories
- thumbnail cards with labels and an unmistakable selected state
- scrollable library without causing horizontal page overflow

Initial complete-face target:

1. Cat
2. Bunny
3. Bear
4. Puppy
5. Fox
6. Raccoon
7. Deer
8. Koala
9. Hamster
10. Lamb
11. Hedgehog
12. Tiger

### 3. Current Character stage

- large square artboard
- subtle warm paper texture in the default finish
- curated-recipe status
- character remains centered and visually dominant
- action row for Undo, Redo, Flip H, Fit, Save version, and Background

The stage is the focal point at every supported viewport size.

### 4. Art direction panel

- composition scale with percentage output
- rotation with degree output
- four fixed finishes: Classic paper, Clean studio, Thermal print, Sticker
- Background
- Frame
- Expression
- Palette
- Caption input
- Show caption toggle
- Transparent export toggle
- secondary Shuffle cute friend action

All controls are non-destructive and serializable.

### 5. Saved variations strip

- persistent local cards
- favorite state
- restore behavior
- Save current tile
- horizontal scrolling at narrow widths

## Visual language

- warm cream application background
- white-to-ivory cards with restrained borders and soft shadows
- coral, apricot, mint, butter, powder-blue, and lavender accents
- rounded controls and cards without excessive glass or gradients
- illustrated paper/fur materiality
- large glossy eyes and restrained blush
- soft, rounded proportions with species-specific silhouettes
- readable artwork at thumbnail size

The artwork should feel authored and tactile rather than like flat emoji clip art.

## Interaction rules

- Complete faces and Build a face share one composition state model.
- Shuffle only selects approved combinations.
- Reset returns to the selected recipe defaults.
- Slider drags should become one undoable edit, not dozens.
- Unsupported palette, expression, or part combinations are disabled or omitted.
- Saved variations restore pixel-consistent state.
- Export excludes editor chrome and preserves all visible authored treatments.

## Export target

Minimum MVP export:

- square PNG
- at least 1600 × 1600 px
- opaque or transparent background
- stable, sanitized filename
- correct output for complete faces and layered compositions

Whiskers, ears, antlers, wool, sticker outlines, shadows, frames, and captions must not be clipped.

## Responsive intent

Review at approximately:

- 1600 px
- 1280 px
- 1024 px
- 768 px
- 390 px

Large desktop preserves the three-column composition. Smaller layouts may collapse panels into tabs, drawers, or accordions, but the stage remains near the top and primary actions remain reachable.

## Accessibility baseline

- semantic controls and labels
- visible keyboard focus
- keyboard-operable menus, tabs, toggles, and saved cards
- selected and favorite states are not communicated by color alone
- useful announcements for recipe changes, saves, and export failures
- usable at 200% browser zoom
- reduced-motion support where motion is added

## Source-of-truth hierarchy

1. approved high-fidelity MVP mockup
2. this document
3. `assets/manifest.json` and `docs/ASSET-GUIDE.md`
4. deterministic visual QA artifacts
5. older preview boards

Implementation convenience must not silently override the authored-only product contract or the major hierarchy of the approved mockup.
