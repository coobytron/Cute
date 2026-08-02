# Agent Cody Banks run — Cute issue #36

## Assignment

Activate the already merged V2 effects engine in the production application bootstrap and prevent future loader drift.

## Sources of truth

1. `coobytron/Agent-Cody-Banks` agent registry and role charters
2. `assets/manifest-adapter.js` production bootstrap
3. `effects.js`, `effects-controller.js`, and `effects-export-integration.js`
4. `mixed-asset-export.js`
5. `docs/EFFECTS.md`
6. Merged effects implementation PR #34 and QA PR #35

## Active team

| Role | Ownership |
| --- | --- |
| Producer | Scope, sequencing, release integrity, handoff |
| Creative Director | Preserve the authored, non-destructive finishing direction |
| Architect | Startup boundaries, dependency order, recoverable failure behavior |
| JavaScript Specialist | Production loader integration and readiness events |
| Designer | Effects controls remain part of the existing Art Direction workflow |
| Deterministic QA Reviewer | Loader-order and required-file validation |
| Export Recovery Reviewer | Final export wrapper loads only after the base export stack |

## Findings

The effects renderer, controller, stylesheet, and export integration were present on `main`, but `assets/manifest-adapter.js` did not declare them as part of the production startup.

A second, legacy loader inside `mixed-asset-export.js` attempted to install the effects stack after mixed export initialized. That made effects dependent on a side effect of another module, duplicated loader ownership, and introduced a race once the canonical bootstrap also loaded the same files.

`effects-export-integration.js` requires `window.CuteExport`, so loading it immediately after the controller would silently exit before the final mixed-media export wrapper existed.

## Decisions

- Make `assets/manifest-adapter.js` the single owner of production module loading.
- Remove the effects stylesheet/script loader from `mixed-asset-export.js`; mixed export now owns only mixed export behavior.
- Load the effects stylesheet through the canonical style loader.
- Initialize Art Direction before both the core and effects branches.
- Wait for `CuteEffectsController.ready` before treating effects as available.
- Wait for the complete core export chain before loading `effects-export-integration.js`.
- Treat effects as an optional finishing layer: dispatch a dedicated error and continue with the authored builder if the effects branch fails.
- Include `effectsAvailable` in the final creative-controls readiness event.
- Add deterministic validation for file presence, single loader ownership, exact loader references, readiness contracts, and dependency order.

## Validation

- `node --check assets/manifest-adapter.js`
- `node --check mixed-asset-export.js`
- `node scripts/validate-effects-bootstrap.mjs`
- `node scripts/validate-effects-integration.mjs`
- GitHub Actions uploads `review-artifacts/effects-bootstrap-validation.json`

## Human review boundary

Automated validation proves the production loader contract. Safari and Chromium preview behavior, the 390 px controls, effect appearance, and opaque/transparent export parity still require the existing human review in `previews/effects-review.html`.
