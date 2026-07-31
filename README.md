# Cute Face Lab

A pre-drawn animal face generator built around authored character parts: animal bases, ears, eyes, snouts, mouths, cheeks, markings, accessories, and print finishes.

![Cute Face Lab MVP](previews/cute-face-mvp-board.png)

The project borrows the proven composition workflow from `Monster-Face-Gen`, while establishing its own softer visual language and independent asset library.

## Run the MVP

Open `index.html` in a modern browser or publish the repository with GitHub Pages. No build step or external dependency is required.

The current browser MVP includes:

- five locked hero recipes: cat, bunny, bear, puppy, and fox
- reusable authored bases, ears, eyes, snouts, cheeks, markings, and accessories
- recipe mode and custom face-building mode
- approved color palettes and fixed surface finishes
- shuffle, flip, scale, tilt, naming, favorites, and local saved versions
- 1600 × 1600 PNG export from the current composition

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

The full editable direction board is at [`mvp/cute-face-mvp-board.svg`](mvp/cute-face-mvp-board.svg).

## Proposed MVP library

| Family | Initial target |
|---|---:|
| Animal bases | 5 |
| Ear sets | 8 |
| Eye sets | 8 |
| Snouts / noses | 6 |
| Mouths | 6 |
| Cheek treatments | 6 |
| Markings | 6 |
| Accessories | 6 |
| Print finishes | 4 |
| Locked hero recipes | 5 |

Initial animals are cat, bunny, bear, puppy, and fox. Frog, panda, raccoon, mouse, and tiger are strong expansion candidates.

## Source-of-truth rule

Every visible animal feature originates from an authored asset. The browser may select, position, layer, clip, mask, mirror, recolor within approved palettes, and export those assets. It must not infer or generate new anatomy.

Randomization is selection from approved parts, not drawing.

## Recommended build order

1. Refine and lock three hero recipes as the final visual baseline.
2. Extract the inline MVP artwork into a stable asset manifest and shared face coordinate system.
3. Add species compatibility rules and approved recipes.
4. Add deterministic contact-sheet QA before expanding the library.
5. Grow the authored animal and expression library without changing the composer contract.
