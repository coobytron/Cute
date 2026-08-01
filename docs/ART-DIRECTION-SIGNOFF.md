# Character × effect art-direction signoff

Run:

```bash
node scripts/generate-character-effect-matrix.mjs
```

Review `previews/contact-sheets/character-effects-matrix.html` and `review-artifacts/character-effects-matrix.json`.

## Automated structural checks

- [ ] Every `complete-face` entry has a stable ID and source path.
- [ ] Every source path exists and uses SVG, PNG, or WebP.
- [ ] Every character declares native canvas and export bounds.
- [ ] Every shipped preset appears for every canonical character.
- [ ] Default and mobile-thumbnail cases have stable test IDs.
- [ ] Compatibility actions are explicit: allow, reduce, replace, or block.
- [ ] Failures include test ID, character ID, preset ID, source path, and likely cause.
- [ ] Unchanged inputs produce unchanged ordering, IDs, seeds, and filenames.

## Human visual review

### Character fidelity

- [ ] Species silhouette remains recognizable.
- [ ] Eyes, mouth, cheeks, markings, and accessories remain legible.
- [ ] No ears, antlers, wool, spines, whiskers, or sticker edges are clipped.
- [ ] No anchor drift or accidental scale/rotation changes appear.

### Raster and mixed media

- [ ] Transparent PNG/WebP edges are clean on light, dark, and checkerboard backgrounds.
- [ ] Raster texture scale feels intentional at thumbnail and export size.
- [ ] SVG linework and raster shading align without halos or seams.
- [ ] Masks preserve alpha and do not expose rectangular bounds.
- [ ] Blend modes match between live preview and PNG export.

### Effects

- [ ] Surface effects do not flatten facial features.
- [ ] Lighting effects preserve linework and eye highlights.
- [ ] Graphic effects stay within approved intensity limits.
- [ ] Scene effects support rather than overpower the character.
- [ ] Reduced/replaced/blocked combinations behave as declared.
- [ ] Seeded particles, grain, and offsets are repeatable.

### Mobile and export

- [ ] Every character remains readable at the mobile thumbnail size.
- [ ] Compact performance tier does not visibly degrade core identity.
- [ ] Full-resolution samples have correct canvas dimensions and alpha.
- [ ] Export filenames and report IDs remain stable.

## Signoff record

| Role | Decision | Notes |
|---|---|---|
| Art Director | Pending | |
| Creative Director | Pending | |
| Deterministic QA Reviewer | Pending | |
| Visual Fidelity Reviewer | Pending | |
| Export Recovery Reviewer | Pending | |

Automated success does not constitute art-direction approval. The branch is ready to merge only after dependency outputs from #24–#26 are present and the human review record is completed.
