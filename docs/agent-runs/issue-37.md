# Agent Cody Banks run — Cute issue #37

## Assignment

Reconcile the repository, application copy, limitations, and aggregate validation with the V2 system already merged into Cute.

## Sources of truth

1. `coobytron/Agent-Cody-Banks` registry and role charters
2. 36-character roster contract in `assets/roster-expansion.json`
3. two mixed-media references in `assets/mixed-asset-fixtures.json`
4. six presets and 12 effects in `assets/effects-presets.json`
5. 494-case report in `review-artifacts/character-effects-matrix.json`
6. production bootstrap work in issue #36
7. README, application copy, and known limitations

## Active team

| Role | Ownership |
| --- | --- |
| Producer | Dependency order, release scope, archive record |
| Creative Director | Coherent V2 positioning and source hierarchy |
| Product Designer | Accurate capability and limitation model |
| Writer | README and interface copy |
| JavaScript Specialist | Aggregate release validator |
| Documentation Handoff Editor | Cross-document consistency |
| Deterministic QA Reviewer | Count, artifact, loader, and stale-copy regression checks |

## Findings

The repository contained the V2 roster, mixed-media pipeline, finishing effects, and character/effect matrix, while several primary surfaces still described the original 12-character MVP. The aggregate release validator covered the expanded roster but did not include mixed-media validation, effects validation, the production effects bootstrap, or the 494-case matrix.

The issue #36 audit also found duplicate effects-loader ownership between the canonical bootstrap and `mixed-asset-export.js`; V2 release validation must assert a single owner so that documentation cannot advance while the runtime remains ambiguous.

## Decisions

- Describe 36 approved authored complete faces separately from the two mixed-media reference characters.
- Describe four foundational finishes separately from six seeded effects presets resolving to 12 effects.
- Preserve the original MVP matrix as a baseline regression artifact while adding V2 roster, mixed-media, effects, and character/effect review artifacts.
- Keep all anatomy explicitly authored; effects are finishing treatments, not generation.
- Document local-only saves and the current absence of a recipe JSON import interface.
- Expand `node scripts/validate-release.mjs` into the single aggregate V2 release command.
- Fail release validation for stale MVP counts, missing V2 files, incorrect counts, matrix drift, missing runtime markers, or duplicate effects-loader ownership.
- Preserve explicit manual review for art direction, browsers, assistive technology, mobile layouts, effects parity, and thermal output.

## Validation

The aggregate command runs 11 focused validators and checks:

- 36 approved complete faces and recipes
- 24-character expansion over the original 12
- two mixed-media reference characters
- 12 curated Build-a-face recipes
- six effects presets and 12 effects
- 38 browseable character entries and 494 deterministic matrix cases
- production effects startup and single loader ownership
- required review artifacts and release documents
- README, application, and limitations consistency
- removal of stale `MVP 01`, five-hero, and pre-expansion statements

GitHub Actions publishes `review-artifacts/release-validation.json` with the focused effects reports.

## Human review boundary

Automated success does not approve the artwork. The 36-character roster, mixed-media references, six effects presets, 494-case matrix, Safari/Chromium behavior, iPhone layout, VoiceOver, 200% zoom, and physical thermal output remain human gates.
