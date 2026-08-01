# Cute Face Lab

A pre-drawn animal face generator built around authored character parts: animal bases, ears, eyes, snouts, mouths, cheeks, markings, accessories, and print finishes.

![Cute Face Lab MVP](previews/cute-face-mvp-board.png)

The project borrows the proven composition workflow from `Monster-Face-Gen`, while establishing its own softer visual language and independent asset library.

## Approved MVP target

The supplied **Cute Face Builder** mockup is the product and visual source of truth. See [`docs/MVP-TARGET.md`](docs/MVP-TARGET.md) for the canonical layout, controls, behavior, responsive intent, export requirements, and source-of-truth hierarchy.

The approved contract is authored-only:

- complete faces may be precomposed transparent PNG or SVG artwork
- Build a face uses authored layers and approved combinations
- the browser may select, position, layer, clip, mask, mirror, scale, rotate, recolor within declared variants, and export
- the browser must not infer or generate animal anatomy

Asset IDs, metadata, compatibility hooks, export bounds, and the five current hero recipes now live in [`assets/manifest.json`](assets/manifest.json). Authoring rules are documented in [`docs/ASSET-GUIDE.md`](docs/ASSET-GUIDE.md).

## Run the current prototype

Open `index.html` in a modern browser or publish the repository with GitHub Pages. No build step or external dependency is required for the current browser prototype.

The current browser prototype includes:

- five locked hero recipes: cat, bunny, bear, puppy, and fox
- reusable authored bases, ears, eyes, snouts, cheeks, markings, and accessories
- recipe mode and custom face-building mode
- approved color palettes and fixed surface finishes
- shuffle, flip, scale, tilt, naming, favorites, and local saved versions
- 1600 × 1600 PNG export from the current composition

The page loads `assets/manifest-adapter.js` before the legacy composer. This creates a stable migration API while preserving the existing no-build workflow.

## Validate the asset manifest

Node.js 18 or newer is sufficient; no package install is required.

```bash
node scripts/validate-manifest.mjs
```

Validation fails on duplicate IDs, missing files, unknown asset types, invalid z-order, invalid transforms or bounds, missing compatibility references, unsupported palette references, broken recipe references, or absent required sample categories.

## MVP visual direction

- rounded animal silhouettes with thick, slightly imperfect ink
- warm pastel color families with a small shared palette
- readable expressions at thumbnail size
- light print texture so results feel illustrated rather than like emoji clip art
- stable authored parts that can be selected, placed, layered, mirrored, and exported
- no procedural anatomy generation

## Preview pack

Ready-to-view PNGs and their editable SVG counterparts live in [`previews/`](previews/).

- `mochi-cat`
- `mimi-bunny`
- `puff-bear`
- `biscuit-pup`
- `yuzu-fox`
- `cute-face-mvp-board.png`

The full editable early direction board is at [`mvp/cute-face-mvp-board.svg`](mvp/cute-face-mvp-board.svg). It is subordinate to the approved high-fidelity mockup documented in `docs/MVP-TARGET.md`.

## Proposed MVP library

| Family | Initial target |
|---|---:|
| Complete animal faces | 12 |
| Animal bases | 5 |
| Ear sets | 8 |
| Eye sets | 8 |
| Snouts / noses | 6 |
| Cheek treatments | 6 |
| Markings | 6 |
| Accessories | 6 |
| Print finishes | 4 |
| Curated recipes | 12 |

Initial complete faces are cat, bunny, bear, puppy, fox, raccoon, deer, koala, hamster, lamb, hedgehog, and tiger.

## Source-of-truth rule

Every visible animal feature originates from an authored asset. The browser may select, position, layer, clip, mask, mirror, recolor within approved palettes, and export those assets. It must not infer or generate new anatomy.

Randomization is selection from approved parts, not drawing.

## Recommended build order

1. Lock the approved mockup and authored asset contract.
2. Rebuild the application shell around the mockup hierarchy.
3. Author the polished 12-face complete-character library in parallel with shell work.
4. Implement manifest-driven Build a face composition and compatibility.
5. Add art-direction controls, history, saved variations, and reliable export.
6. Add responsive behavior, accessibility, deterministic contact sheets, and release QA.

The implementation roadmap is tracked in GitHub Issues beginning with [#1](https://github.com/coobytron/Cute/issues/1).
