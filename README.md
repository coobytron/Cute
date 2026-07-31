# Cute Face Lab

A pre-drawn animal face generator built around authored character parts: animal bases, ears, eyes, snouts, mouths, cheeks, markings, accessories, and print finishes.

The project borrows the proven **composition workflow** from `Monster-Face-Gen`, but establishes its own softer visual language and asset library.

## MVP visual direction

- Rounded animal silhouettes with thick, slightly imperfect ink
- Warm pastel color families with a small shared palette
- Simple, readable expressions at thumbnail size
- A little print texture so the results feel illustrated rather than like emoji clip art
- Stable authored parts that can be selected, placed, layered, mirrored, and exported
- No procedural anatomy generation

The first visual board is at [`mvp/cute-face-mvp-board.svg`](mvp/cute-face-mvp-board.svg).

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

Initial animals: cat, bunny, bear, puppy, and fox. Frog, panda, raccoon, mouse, and tiger are strong expansion candidates.

## Source-of-truth rule

Every visible animal feature should originate from an authored asset. The browser may select, position, layer, clip, mask, mirror, recolor within approved palettes, and export those assets. It should not infer or generate new anatomy.

Randomization is selection from approved parts, not drawing.

## Recommended build order

1. Lock three hero recipes and the final art direction.
2. Define the stable asset manifest and shared face coordinate system.
3. Build the static browser composer and export flow.
4. Add species compatibility rules and approved recipes.
5. Add deterministic contact-sheet QA before expanding the library.
