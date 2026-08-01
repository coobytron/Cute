# Mockup feature map

| Mockup region / behavior | Shipped implementation | Review source |
|---|---|---|
| Header identity and authored-only positioning | `index.html`, `styles.css`, `docs/MVP-TARGET.md` | canonical desktop review |
| Shuffle, Reset, Favorite, Export | composer APIs, Art direction coordination, `history-saves.js`, `export-menu.js` | interaction checklist |
| Complete faces mode | 12 approved assets in `assets/complete-faces/`, `complete-face.js` | release matrix normal/flipped |
| Build a face categories | `assets/build-face-manifest.js`, `build-face.js` | compatibility sheet |
| Approved combinations and curated recipes | compatibility allow-lists, overrides, 12 layered recipes | release matrix + compatibility sheet |
| Dominant square Current Character stage | `index.html`, responsive CSS, shared SVG stage | five-width review |
| Undo, Redo, Flip H, Save version | `history-saves.js`, composer transforms | history checklist |
| Scale and rotation | complete and layered composer state | release matrix / interaction review |
| Classic paper | fixed Art direction recipe | finish sheet |
| Clean studio | fixed Art direction recipe | finish sheet |
| Thermal print | fixed monochrome/dither recipe | 384/576 review |
| Sticker | fixed cutline/shadow recipe | finish and export sheets |
| Background, frame, expression, palette | `art-direction.js` declared options and compatibility locking | release matrix |
| Caption and visibility | Art direction state and export composition | caption off/on matrix |
| Transparent export | `export-menu.js` background-layer removal | opaque/transparent matrix |
| Saved variations and favorites | schema v2 local storage and exact API restore | persistence checklist |
| PNG export menu | opaque 1600 px, transparent 1600 px, recipe JSON | export fixture matrix |
| Compact desktop/tablet | content-driven breakpoints | responsive review 1280/1024/768 |
| Phone layout | stage-first panel switcher and horizontal saves | responsive review 390 |
| Keyboard and assistive semantics | skip link, named regions, tabs, live announcements, focus isolation | accessibility checklist |
| Deterministic release QA | aggregate release matrix, validators, machine-readable report | `scripts/validate-release.mjs` |

Machine-readable status is available in [`review-artifacts/mvp-feature-map.json`](../review-artifacts/mvp-feature-map.json).

## Documented exceptions

- Browser and assistive-technology behavior still requires live manual review.
- Thermal output requires physical-printer approval where available.
- The mockup is directional rather than a demand for literal pixel tracing.
- Unsupported complete-face palette and expression variants are disabled instead of destructively recolored.
- Saved variations remain local to one browser profile.

See [`KNOWN-LIMITATIONS.md`](KNOWN-LIMITATIONS.md) and [`RELEASE-CHECKLIST.md`](RELEASE-CHECKLIST.md).
