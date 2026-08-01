# Agent run — Issue #25

## Goal
Add transparent PNG/WebP support, mixed SVG/raster composition, masks, blend modes, high-DPI export, preload/error states, and a shared normalized anchor contract without introducing a backend or heavy rendering framework.

## Team

- **Producer** — scope, sequencing, dependency coordination with #24 and #26, delivery record.
- **Creative Director** — protects the authored-only visual principle and reviews mixed-media coherence.
- **Architect** — owns the canonical rendering contract and failure boundaries.
- **JavaScript Specialist** — owns browser loading, decoding, compositing, masks, export parity, and tests.
- **Creative Technologist** — prototypes Canvas 2D blend/mask behavior and mixed-format reference cases.
- **Art Director** — reviews alpha edges, texture scale, authoring guidance, and visual parity.
- **Deterministic QA Reviewer** — independently validates ordering, scaling, alpha, missing files, and repeatability.

## Delivery sequence

1. Define one canonical mixed-asset contract shared by roster and effects work.
2. Add dependency-free browser runtime for SVG/PNG/WebP loading and Canvas 2D composition.
3. Add one raster-only and one mixed-format reference fixture.
4. Wire the runtime into preview and export paths.
5. Add deterministic validation and authoring documentation.

## Current status

- [x] Branch isolated from `main`.
- [x] Agent ownership and review gates recorded.
- [x] Rendering contract scaffold started.
- [ ] Runtime integrated with the complete-face stage.
- [ ] Runtime integrated with export.
- [ ] Reference fixtures committed.
- [ ] Automated and manual acceptance checks complete.

## Review gates

- **Architecture gate:** contract fields are stable before #24 and #26 consume them.
- **Visual gate:** alpha, texture scale, and mixed-media treatment approved by Art Director.
- **Integration gate:** preview/export parity and recoverable errors pass independent QA.
