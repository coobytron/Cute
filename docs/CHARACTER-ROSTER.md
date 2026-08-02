# Character roster

Issue #24 expands the approved complete-face roster from **12 to 36**.

## Sources

- Baseline authored faces: `assets/manifest.json`
- Expansion metadata: `assets/roster-expansion.json`
- Expansion artwork: `assets/complete-faces/face-*.svg`
- Review sheet: `previews/contact-sheets/character-roster-36.html`

The browser manifest adapter merges the two sources before indexing assets and recipes. Stable recipe IDs are derived as `recipe-<character-id-without-face-prefix>`.

## Adding another character

1. Author transparent SVG, PNG, or WebP artwork on the canonical 1000 × 1000 canvas.
2. Keep the face centered on the normalized `{ "x": 0.5, "y": 0.5 }` anchor.
3. Add a unique `face-*` entry to `assets/roster-expansion.json`.
4. Declare species tags, default palette, export bounds, attribution, personality cue, and effect compatibility.
5. Set `reviewStatus` to `approved` only after art-direction review.
6. Add or regenerate the roster contact sheet.
7. Run:

```bash
node scripts/validate-roster-expansion.mjs
node scripts/validate-complete-faces.mjs
node scripts/validate-release.mjs
```

Do not count recolors as new characters. Each entry needs a distinct species silhouette, head or ear treatment, and personality cue.
