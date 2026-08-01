# Authored Build-a-face workflow

Build-a-face is a deterministic composition mode. It selects and layers authored SVG snippets from `assets/build-face-manifest.js`; it does not generate, deform, or infer animal anatomy.

## Runtime contract

The manifest defines seven ordered categories:

1. `base`
2. `ears`
3. `eyes`
4. `snout`
5. `cheeks`
6. `markings`
7. `accessory`

Every asset has a stable ID, label, category, fixed authored SVG markup, compatible base IDs, z-order, default transform, and optional base-specific overrides. The controller in `build-face.js` owns a serializable `partIds` selection and global scale, rotation, and horizontal flip.

Complete faces and layered faces use the same central stage. Switching library categories does not replace the composition state.

## Add an authored part

Add one `asset(...)` entry to `assets/build-face-manifest.js`.

- Use a stable, category-prefixed ID such as `eyes-round-shine`.
- Draw on the canonical 1000 × 1000 coordinate system.
- Use fixed SVG geometry. Do not calculate new anatomy at runtime.
- Use the shared CSS paint variables where appropriate: `--head`, `--secondary`, `--muzzle`, and `--blush`.
- Declare every approved base in `compatibleBases`.
- Set a predictable `zOrder` for the category.
- Keep `defaultTransform` present even when its values are neutral.

Run:

```bash
node scripts/validate-build-face.mjs
```

## Approve or block a pairing

Compatibility is explicit and allow-listed. Add a base ID to an asset's `compatibleBases` array to approve it. Remove the base ID to block it.

The UI only displays approved parts for the selected base. When the base changes, an incompatible active part is replaced with the first approved option in that category. If no option exists, the category displays an empty state instead of rendering a detached part.

## Add a pair-specific placement override

Use the asset's `overrides` object when a generic placement does not fit one base:

```js
overrides: {
  "base-bunny-soft": { x: 25, y: -50, scale: 0.95, rotation: -4 }
}
```

Only include values that differ from the neutral transform. Override keys must reference known base IDs; validation fails otherwise.

## Add a curated layered recipe

Add one entry to the `recipes` source list with a stable recipe ID, display label, one asset ID for every category, and an approved palette. Every selected part must allow the selected base.

Curated recipes must restore the exact asset IDs and transform values. The MVP target is 12 layered recipes.

## Serializable state

`window.CuteBuildFace.getState()` returns:

```json
{
  "schemaVersion": 1,
  "mode": "parts",
  "recipeId": "layered-mochi",
  "partIds": {
    "base": "base-cat-round",
    "ears": "ears-cat-peak",
    "eyes": "eyes-sparkle",
    "snout": "snout-cat",
    "cheeks": "cheeks-soft",
    "markings": "markings-tabby",
    "accessory": "accessory-flower"
  },
  "paletteId": "tangerine",
  "transform": { "scale": 1, "rotation": 0, "flipX": false }
}
```

Restore it with `window.CuteBuildFace.restore(state)`.

## Visual review

Open `previews/contact-sheets/build-face-compatibility.html` through the same local/static server used for the app. It renders every approved category × base combination with stable IDs.
