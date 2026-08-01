# Agent run — Issue #26

## Goal
Build a non-destructive, deterministic finishing engine with live-preview/export parity, visual controls, curated presets, reset behavior, and mobile-aware performance tiers.

## Team

- **Producer** — scope, dependencies, delivery gates, and coordination with #25 and #27.
- **Creative Director** — owns the collectible visual idea and final preset recommendation.
- **Art Director** — owns effect taste, intensity limits, thumbnail legibility, and preset coherence.
- **Creative Technologist** — owns Canvas 2D compositing experiments and seeded procedural treatments.
- **JavaScript Specialist** — owns state, serialization, deterministic seeds, runtime integration, and tests.
- **Designer** — owns the visual swatch control pattern, reset behavior, labels, and mobile usability.
- **Performance Reviewer** — independently verifies compact/standard/high tiers.
- **Deterministic QA Reviewer** — independently verifies same seed + settings = same output and preview/export parity.

## MVP effect set

- Surface: paper grain, halftone, plush/fur texture.
- Lighting/depth: blush bloom, rim light, sticker edge.
- Graphic: chromatic offset, sparkle field, pixel/dither.
- Scene: vignette, halo/gradient, floating particles.

## Curated presets

`Soft Plush`, `Candy Gloss`, `Riso Friend`, `Paper Sticker`, `Dream Glow`, and `Pixel Pet`.

## Current status

- [x] Branch isolated from `main`.
- [x] Agent ownership and review gates recorded.
- [x] Preset/state contract started.
- [ ] Engine wired to live preview.
- [ ] Engine wired to PNG export.
- [ ] Visual swatch UI integrated.
- [ ] Mobile performance checks complete.
- [ ] Character × preset QA matrix complete.

## Review gates

- **Taste gate:** no preset obscures eyes, mouth, silhouette, or species cues at thumbnail size.
- **Determinism gate:** seeded treatments are byte-stable at the serialized parameter level.
- **Performance gate:** compact tier remains responsive at an iPhone-class viewport.
