# Effects and finishing engine

Cute Face Builder uses the dependency-free Canvas engine in `effects.js` and adds a non-destructive controller, live preview, visual preset controls, state serialization, and PNG export integration.

## Presets

The six shipped presets are Soft Plush, Candy Gloss, Riso Friend, Paper Sticker, Dream Glow, and Pixel Pet. They resolve from `assets/effects-presets.json` into twelve effects across surface, lighting, graphic, and scene categories.

## Production startup

The canonical browser bootstrap is `assets/manifest-adapter.js`. It loads the effects system as part of the normal application rather than only through the review fixture.

The dependency order is deliberate:

1. Mixed-asset rendering, complete faces, Build a face, and Art Direction initialize first.
2. `effects.js` loads the low-level renderer.
3. `effects-controller.js` loads and its `ready` promise resolves after preset configuration and controls are available.
4. The normal history, export menu, mixed-media export, and responsive layers initialize.
5. `effects-export-integration.js` wraps the final `window.CuteExport` API only after the base export stack exists.

Successful activation dispatches `cute:effects-bootstrap-ready`. A failure dispatches `cute:effects-bootstrap-error` and reports `effectsAvailable: false` through `cute:creative-controls-ready`; the authored face builder remains usable without effects rather than failing the complete startup.

## Runtime APIs

`window.CuteEffects` is the low-level renderer. `window.CuteEffectsController` owns UI state:

- `getState()`, `restore(state)`, `reset()`
- `setPreset(id)`, `setIntensity(0…1)`, `setSeed(number)`, `randomizeSeed()`
- `setEnabled(boolean)`, `setPerformanceTier(auto|compact|standard|high)`
- `serialize()`, `deserialize(document)`
- `getResolvedEffects({ transparent })`, `renderPreview()`

`window.CuteExportEffects` wraps the final export stack after mixed-media export integration. It applies the same resolved preset, seed, intensity, transparency filtering, and performance tier to exported PNGs. Recipe JSON includes an `effects` snapshot.

## Determinism

The same source composition, preset, master intensity, seed, and performance tier produce the same effect order and random sequence. The renderer uses the seeded `createRandom` function already shipped in `effects.js`.

## Transparency

Effects whose catalog target is `background` are omitted for transparent preview and transparent PNG export. Character and composite treatments remain available.

## Performance tiers

- compact: phone-class live preview
- standard: desktop default
- high: manual high-quality preview
- auto: resolves from viewport, reduced-motion preference, and reported device memory

## Validation and review

Run:

```bash
node scripts/validate-effects-bootstrap.mjs
node scripts/validate-effects-integration.mjs
```

The bootstrap validator confirms that all production runtime files exist, occur exactly once in the canonical loader, and follow the required dependency order. It writes `review-artifacts/effects-bootstrap-validation.json` and runs in GitHub Actions.

Then open `previews/effects-review.html`. Compare Safari and Chromium at desktop and 390 px. Export opaque and transparent PNGs for all six presets and verify preview/export parity.
