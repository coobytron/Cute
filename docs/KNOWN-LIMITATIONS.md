# Known V2 limitations

These are deliberate product boundaries or manual-review gaps, not hidden future behavior.

## Runtime and hosting

- The app is client-side only.
- It must be served over HTTP because authored manifests, SVG files, raster fixtures, WebP textures, and effect configuration use browser `fetch`.
- Opening `index.html` directly from the filesystem does not load the complete library.
- There are no accounts, backend, cloud storage, collaboration, or synchronization.
- GitHub Pages can host the static application, but it does not add server rendering or shared storage.

## Artwork and composition

- All animal anatomy is authored. There is no AI generation or procedural anatomy.
- V2 includes 36 approved complete faces and two mixed-media reference characters; the mixed-media entries demonstrate the pipeline and are labeled separately from the canonical roster.
- Build a face uses approved combinations and fixed anchors; unrestricted drag-and-drop placement remains outside the product contract.
- Not every part is compatible with every base.
- Complete-face palette or expression controls remain disabled when no authored variant exists.
- Mixed-media composition supports SVG, PNG, and WebP through declared layers, masks, transforms, blend modes, and opacity. It does not inspect arbitrary source artwork and infer how it should be separated.

## Effects

- Effects are seeded, deterministic finishing treatments. They may add texture, lighting, graphic offsets, particles, or scene treatment, but they do not create or distort anatomy.
- V2 ships six presets resolving to 12 effects; it does not provide unrestricted node-based effect authoring.
- Automatic performance tier selection is a conservative browser heuristic based on viewport, reduced-motion preference, and reported device memory. It is not a hardware benchmark.
- Canvas and SVG rendering may show small engine-specific differences between Safari and Chromium.
- If the optional effects branch fails to initialize, the authored builder remains usable without effects and reports `effectsAvailable: false`.

## Rendering and export

- PNG is the only downloaded image format.
- Recipe JSON is copied to the clipboard rather than downloaded as a file.
- There is no SVG, PDF, layered source-file, social-sharing, or server-rendered export.
- Transparent export removes background-scoped effects but preserves compatible character and composite treatments.
- Sticker, paper, thermal, mixed-media, and Canvas effects may show small browser-specific differences.
- Thermal print is a fixed review treatment, not a calibrated printer-driver pipeline.
- Physical thermal-printer approval remains manual.

## Saved variations

- Saves and favorites are local to one browser profile and device.
- Storage is capped at 12 variations.
- Clearing browser storage removes saved variations.
- There is no cloud backup or automatic migration between devices.
- Copied recipe JSON preserves a portable record, including effects state, but V2 does not yet provide a file-import interface that restores that JSON through the UI.

## Responsive and accessibility review

- CI validates semantic contracts and responsive rules but does not run a real browser or assistive technology.
- Safari, Chromium, iPhone orientation, VoiceOver, forced colors, reduced motion, and 200% zoom require manual release review.
- The deterministic responsive page is a review aid, not a screenshot-diff system.
- Canvas effects are decorative and hidden from assistive technology; the authored composition retains the primary accessible name and description.

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

## Visual fidelity and approval

- The approved mockup defines hierarchy and art direction, not literal pixel tracing.
- The browser shell preserves the mockup's major regions, warm palette, compact controls, stage emphasis, and authored-only positioning.
- Automated validation proves file, schema, count, loader, deterministic case, and export contracts. It does not grant human art-direction approval.
- The 36-character roster, two mixed-media references, six effects presets, and 494-case matrix still require the review roles recorded in `docs/ART-DIRECTION-SIGNOFF.md`.

## Current V2 boundary

The current release is intentionally bounded at:

- 36 approved authored complete faces
- two mixed-media reference characters
- 12 curated layered Build-a-face recipes and the declared part counts
- four foundational fixed finishes
- six seeded effects presets resolving to 12 effects
- five palettes and backgrounds
- three frame states
- local-only saves and PNG/clipboard export

Further expansion should preserve stable IDs, the authored-anatomy boundary, deterministic QA, mixed-media contracts, and explicit human approval.
