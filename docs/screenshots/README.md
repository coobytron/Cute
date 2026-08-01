# Canonical Desktop Screenshots

This directory holds reference screenshots taken at the canonical desktop viewports
specified in `docs/MVP-TARGET.md`.

## Capture instructions

### Prerequisites

```
node ≥ 18
npx playwright install chromium
```

### Steps (Chromium)

```sh
# From the repository root, serve the app locally:
npx serve . -p 4000

# In a second terminal, run the capture script:
node docs/screenshots/capture.mjs
```

The script saves two PNG files here:

| File | Viewport | Description |
|---|---|---|
| `shell-1440x900.png` | 1440 × 900 | Primary canonical desktop |
| `shell-1600x1000.png` | 1600 × 1000 | Wide canonical desktop |

### Manual capture steps (no Node script)

1. Open the app in Chromium at `http://localhost:4000`.
2. Open DevTools → ⋮ → More tools → Sensors → Dimensions.
3. Set 1440 × 900 and take a full-page screenshot with
   DevTools → ⋮ → Run command → Screenshot.
4. Repeat at 1600 × 1000.
5. Save both files into `docs/screenshots/`.

### What to verify

- Three-column desktop composition visible at both viewports:
  - full-width header with Shuffle, Reset, Favourite, Export actions
  - left Authored-parts panel (Characters / Build a face mode switch)
  - large square central canvas, visually dominant
  - right Art-controls panel
  - full-width saved-variations strip at the bottom
- No horizontal page overflow (inspect with DevTools overflow highlighting).
- Keyboard focus ring visible on focused controls.
- Stage action toolbar (Undo, Redo, Flip, Fit, Save, Background) visible below canvas.
- Expression pills visible in right panel.
- Toggle switches visible for Show caption / Transparent background.
