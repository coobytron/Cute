# Character × effect art-direction signoff

Run:

```bash
node scripts/generate-character-effect-matrix.mjs
```

Review `previews/contact-sheets/character-effects-matrix.html` and `review-artifacts/character-effects-matrix.json`.

## Automated structural checks

- [x] The canonical manifest, 24-character roster expansion, two mixed-media fixtures, six effects presets, and compatibility metadata are consumed.
- [x] Every character and layer has a stable ID and source path check.
- [x] SVG viewBox and PNG IHDR dimensions are compared with native canvas metadata.
- [x] Export bounds, normalized anchors, mask references, mask roles, and deterministic z-order are checked.
- [x] Every shipped preset appears at full resolution and mobile-thumbnail size for every character/reference.
- [x] Compatibility actions are explicit: allow, reduce, replace, or block.
- [x] Failures include test ID, character ID, preset ID, source path, layer ID when relevant, and likely cause.
- [x] Unchanged inputs produce unchanged ordering, IDs, seeds, filenames, and case counts.

## Human visual review

### Character fidelity

- [ ] Species silhouette remains recognizable.
- [ ] Eyes, mouth, cheeks, markings, and accessories remain legible.
- [ ] No ears, antlers, wool, spines, whiskers, gills, or sticker edges are clipped.
- [ ] No anchor drift or accidental scale/rotation changes appear.

### Raster and mixed media

- [ ] Transparent PNG/WebP edges are clean on light, dark, and checkerboard backgrounds.
- [ ] Raster texture scale feels intentional at thumbnail and export size.
- [ ] SVG linework and raster shading align without halos or seams.
- [ ] Masks preserve alpha and do not expose rectangular bounds.
- [ ] Blend modes match between live preview, matrix canvas, and PNG export.

### Effects

- [ ] Surface effects do not flatten facial features.
- [ ] Lighting effects preserve linework and eye highlights.
- [ ] Graphic effects stay within approved intensity limits.
- [ ] Scene effects support rather than overpower the character.
- [ ] Reduced, replaced, and blocked combinations behave as declared.
- [ ] Seeded particles, grain, fibers, and offsets are repeatable.

### Mobile and export

- [ ] Every character remains readable at 180 px.
- [ ] Compact performance tier does not visibly degrade core identity.
- [ ] Full-resolution samples have correct canvas dimensions and alpha.
- [ ] Export filenames and report IDs remain stable.

## Signoff record

| Role | Decision | Notes |
|---|---|---|
| Art Director | Pending | Review all blocked/reduced/replaced combinations. |
| Creative Director | Pending | Confirm the effects remain secondary to character identity. |
| Deterministic QA Reviewer | Pending | Re-run generator twice and diff artifacts. |
| Visual Fidelity Reviewer | Pending | Check clipping, masks, alpha, z-order, and anchor drift. |
| Export Recovery Reviewer | Pending | Compare matrix, opaque PNG, and transparent PNG outputs. |

Automated success does not constitute art-direction approval. Mark the PR ready only after this record is completed.
