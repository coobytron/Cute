# Effects and finishing engine

Cute Face Builder uses the existing dependency-free Canvas engine in `effects.js` and adds a non-destructive controller, live preview, visual preset controls, state serialization, and PNG export integration.

## Presets

The six shipped presets are Soft Plush, Candy Gloss, Riso Friend, Paper Sticker, Dream Glow, and Pixel Pet. They resolve from `assets/effects-presets.json` into twelve effects across surface, lighting, graphic, and scene categories.

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

## Review

Run `node scripts/validate-effects-integration.mjs`, then open `previews/effects-review.html`. Compare Safari and Chromium at desktop and 390 px. Export opaque and transparent PNGs for all six presets and verify preview/export parity.
