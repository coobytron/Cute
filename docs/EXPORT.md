# Export workflow

The header Export control is an accessible menu layered on top of the shared Art direction renderer.

## Menu

- **PNG · 1600 px** — exports an opaque square PNG.
- **PNG · transparent** — removes the authored background and paper texture while preserving character, finish, frame, and caption.
- **Copy recipe JSON** — copies stable composer and Art direction state for restoration or debugging.

The menu supports pointer input, Enter/Space, Arrow Up/Down, Home/End, Escape, outside-click dismissal, focus return, and a polite live status message.

## Recipe JSON

```json
{
  "format": "cute-face-recipe",
  "version": 1,
  "product": "Cute Face Builder",
  "snapshot": {
    "schemaVersion": 2,
    "mode": "recipes",
    "composer": {},
    "artDirection": {},
    "title": "Mochi Cat"
  }
}
```

The composer payload comes from `CuteCompleteFaces` or `CuteBuildFace`. Presentation state comes from `CuteArtDirection`. When available, `CuteHistorySaves.capture()` is the canonical snapshot source.

## Render order

1. selected authored background for opaque export
2. Classic paper texture when selected
3. complete-face SVG or layered authored parts
4. Thermal or Sticker finish recipe
5. frame
6. caption

Transparent export removes only the direct background and paper-texture rectangles before rasterization. Editor checkerboards, badges, controls, selection rings, and menus are never cloned into the export SVG.

## Reliability

- waits for `document.fonts.ready`
- verifies embedded SVG image assets load
- rasterizes through an isolated object URL
- revokes SVG and PNG object URLs after use
- reports missing character layers, malformed SVG, image failures, canvas failures, PNG encoding failures, and likely cross-origin blocking
- uses a clipboard fallback where the modern Clipboard API is unavailable

Complete-face assets are embedded as data URIs. Build-a-face parts are inline SVG, so normal repository-hosted use does not taint the canvas.

## Filenames

Filenames are built from the visible character title, optional stable recipe or complete-face ID, and export type. Values are Unicode-normalized, lowercased, converted to hyphenated ASCII, trimmed, and capped before `.png` is added.

Examples:

- `mochi-cat-recipe-mochi-cat-1600px.png`
- `custom-cute-friend-transparent.png`

## Public API

`window.CuteExport` exposes:

- `getRecipeDocument()`
- `makeFilename(options)`
- `buildSvg(options)`
- `renderPngBlob(options)`
- `downloadPng(options)`
- `copyRecipeJson()`
- `openMenu()`
- `closeMenu()`

`options` supports `size` and `transparent`.

## Manual review

- export one complete face and one layered face through all four finishes
- inspect opaque and transparent corners
- inspect whiskers, ears, antlers, wool, spines, accessories, frames, shadows, and captions
- test scale, rotation, and horizontal flip
- repeat exports and confirm no progressive slowdown
- test menu keyboard operation and focus return
- test Safari and Chromium download behavior
- temporarily break an image reference and confirm a useful error is announced
