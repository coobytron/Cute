# Agent run — Issue #25 v2

## Project

**Repository:** `coobytron/Cute`  
**Agent system:** `coobytron/Agent-Cody-Banks`  
**Goal:** finish the raster, texture, mask, mixed-format preview, and export pipeline.

## Source of truth

1. GitHub issue #25
2. `assets/mixed-asset-contract.json`
3. `mixed-asset-v2.js`
4. `assets/mixed-asset-fixtures.json`
5. `docs/MIXED-ASSET-PIPELINE.md`

## Active team and ownership

| Deliverable | Owner |
|---|---|
| Scope, dependency and delivery record | Producer |
| Creative principles and integration critique | Creative Director |
| Runtime contract and failure model | Architect |
| Reference fixture construction | Creative Technologist |
| Browser compositor and export integration | JavaScript Specialist |
| Alpha, texture and visual fidelity review | Art Director |
| Compact/mobile rendering review | Performance Reviewer |
| Missing asset and export failure review | Export Recovery Reviewer |
| Deterministic validation | Deterministic QA Reviewer |

## Governing idea

Raster and vector artwork should behave as one authored material system. The browser may decode, align, mask, blend, transform and export approved layers, but it must not invent anatomy or silently flatten editable source structure.

## Delivery gates

- [x] Real transparent PNG and lossless WebP assets committed.
- [x] Fully raster reference fixture committed.
- [x] Mixed SVG/raster reference fixture committed.
- [x] Mask-only layers excluded from the final composite.
- [x] Blend modes preserved after masking.
- [x] Preview integration added to the existing Characters library.
- [x] Opaque and transparent PNG export integration added.
- [x] Visible recoverable errors retained.
- [x] Deterministic validator and CI workflow added.
- [ ] Safari and Chromium visual review.
- [ ] iPhone-class viewport performance review.
- [ ] Human Art Director approval.

## Risks

- Browser image decoding and color management can vary slightly.
- Cross-origin assets can taint export canvases; all shipped sources remain repository-local.
- WebP browser support is assumed for current Safari and Chromium.
- Automated checks cannot judge texture scale or visual quality.
