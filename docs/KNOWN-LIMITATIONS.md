# Known MVP limitations

These are deliberate product boundaries or manual-review gaps, not hidden future behavior.

## Runtime and hosting

- The app is client-side only.
- It must be served over HTTP because the canonical manifest and authored SVG files use browser `fetch`.
- Opening `index.html` directly from the filesystem does not load the full manifest-backed library.
- There are no accounts, backend, cloud storage, collaboration, or synchronization.

## Artwork and composition

- Every visible feature is authored. There is no AI generation or procedural anatomy.
- Build a face uses approved combinations and fixed anchors; unrestricted drag-and-drop placement is outside the MVP.
- Not every part is compatible with every base.
- Complete-face palette or expression controls are disabled when no authored variant exists.
- Complete-face assets are SVG in the current library; raster PNG assets remain supported by the contract but are not the primary shipped pack.

## Rendering and export

- PNG is the only downloaded image format in the MVP.
- Recipe JSON is copied to the clipboard rather than downloaded as a file.
- There is no SVG, PDF, social-sharing, or server-rendered export.
- Sticker, paper, and thermal treatments use browser SVG/CSS rendering and may show small engine-specific differences.
- Thermal print is a fixed preview treatment, not a calibrated printer-driver pipeline.
- Physical thermal-printer approval remains manual.

## Saved variations

- Saves and favorites are local to one browser profile and device.
- Storage is capped at 12 variations.
- Clearing browser storage removes saved variations.
- There is no cloud backup or migration between devices.

## Responsive and accessibility review

- CI validates semantic contracts and responsive rules but does not run a real browser or assistive technology.
- Safari, Chromium, iPhone orientation, VoiceOver, forced colors, reduced motion, and 200% zoom require manual release review.
- The deterministic responsive page is a review aid, not a screenshot-diff system.

## Visual fidelity

- The approved mockup defines hierarchy and art direction, not literal pixel tracing.
- The browser shell preserves the mockup's major regions, warm palette, compact controls, stage emphasis, and authored-only positioning.
- Final release still requires human art-direction approval of the complete release matrix.

## Expansion

The MVP intentionally stops at:

- 12 complete faces
- 12 curated layered recipes
- the declared starter part counts
- four finishes
- five palettes and backgrounds
- three frame states

Library expansion should not begin until the release matrix passes visual review.
