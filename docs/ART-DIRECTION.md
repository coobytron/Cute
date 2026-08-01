# Art direction and rendering order

The Art direction panel is a non-destructive presentation layer shared by Complete faces and Build a face.

`window.CuteArtDirection` owns serializable presentation state. It does not generate anatomy or rewrite authored source artwork.

## State contract

```json
{
  "finishId": "classic-paper",
  "backgroundId": "apricot-day",
  "frameId": "none",
  "expressionId": "happy",
  "caption": "Purr-fect day!",
  "showCaption": false,
  "transparentExport": false
}
```

Read state with `window.CuteArtDirection.getState()` and restore it with `window.CuteArtDirection.restore(state)`.

The module emits `cute:art-direction-change` after a meaningful presentation edit. History and saved-variation work can combine this state with the complete-face or layered composition state.

## Fixed finish recipes

1. **Classic paper** — selected background plus restrained authored grain.
2. **Clean studio** — selected background with no texture overlay.
3. **Thermal print** — monochrome contrast reduction plus a fixed dot treatment. This is reviewed at 384 px and 576 px.
4. **Sticker** — white cutline and restrained shadow around the assembled character.

These are named rendering recipes, not a freeform filter stack.

## Rendering order

Editor and PNG export use the same conceptual order:

1. background, unless transparent export is enabled
2. optional paper texture
3. authored character or layered composition
4. selected finish treatment
5. frame
6. caption

Editor-only checkerboards, controls, selected states, and stage badges are not included in PNG export.

## Authored expressions

The MVP expression buttons map only to authored eye sets:

| Expression | Complete-face composer | Layered composer |
|---|---|---|
| Happy | `sparkle` | `eyes-sparkle` |
| Sleepy | `sleepy` | `eyes-sleepy` |
| Surprised | `star` | `eyes-star` |

An expression is ignored when its authored eye asset is not compatible with the active base.

## Palettes

The current vector starter library declares five approved palette families: Apricot day, Lavender dream, Mint tea, Butter sun, and Powder sky. Palette changes select these known paint recipes. Raster complete-face assets must remain unchanged unless a declared variant exists.

## Export

`window.CuteArtDirection.exportPng(size)` exports the visible composition as a square PNG. The default is 1600 px.

`window.CuteArtDirection.renderPngBlob(384)` and `renderPngBlob(576)` are available for thermal-printer review without downloading.

The focused review page is `previews/contact-sheets/art-direction-finishes.html`.

## Manual review

- switch between Complete faces and Build a face without losing finish/background/frame state
- verify all finish cards have hover, focus, active, and keyboard states
- confirm caption on/off and transparent preview
- export opaque and transparent PNGs
- inspect eyes, mouth, silhouette, whiskers, ears, and accessories in thermal output
- confirm Reset restores the active layered recipe and default art-direction settings
