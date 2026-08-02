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

## iOS

- The iOS layer corrects and extends the same application; there is no native app and no separate iOS codebase.
- Share-sheet export needs `navigator.share` with file support (iOS 15+); older iOS falls back to the existing download.
- If the 1600 px PNG takes longer to render than the user-activation window, iOS refuses the share sheet and the same file is downloaded instead.
- Stage gestures require two fingers and drive the authored scale and tilt ranges only; free placement is still outside the MVP.
- Taking over the pinch gesture on the stage means Safari page zoom must be started outside the stage; page zoom is never disabled.
- Add to Home Screen provides a standalone shell only. There is no service worker, so the app is not offline-capable.
- No iOS splash screens are declared; iOS renders the background color while launching.
- Phone panels scroll inside themselves below 760 px. That keeps the page short, but it is a nested scroll region, and the panel heading scrolls with its content.
- The grain layer scrolls with the document on touch devices instead of staying fixed to the viewport. This is a deliberate trade of an unnoticeable difference in a noise texture for smooth scrolling.
- `content-visibility` and `svh` are progressive enhancements; older iOS falls back to full rendering and `vh` sizing.
- The iOS review page reproduces viewport sizes only. Safe areas, the share sheet, the software keyboard, and gesture feel require hardware.

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
