# Agent run — Issue #27

## Goal
Create deterministic character and character × effect review artifacts with machine-readable failures, stable IDs/seeds/filenames, mobile thumbnails, export samples, compatibility rules, and a repeatable art-direction signoff process.

## Team

- **Producer** — dependency sequencing across #24–#26 and release handoff.
- **Creative Director** — defines the review questions and final creative recommendation.
- **Art Director** — owns the contact-sheet hierarchy, compatibility judgments, and signoff checklist.
- **JavaScript Specialist** — owns deterministic generators, reports, and non-zero failure behavior.
- **Designer** — owns readable sheet layout at desktop and mobile thumbnail sizes.
- **Deterministic QA Reviewer** — owns stable naming, seed coverage, and regression checks.
- **Visual Fidelity Reviewer** — independently checks clipping, alpha edges, masks, z-order, anchor drift, and thumbnail legibility.
- **Export Recovery Reviewer** — independently checks broken/missing assets and export-size mismatches.

## Delivery sequence

1. Establish stable test case IDs and report schema.
2. Generate default-character roster sheet from the canonical manifest.
3. Generate character × preset matrix from the effects preset file.
4. Add compatibility overrides and expected-block/reduce/replace behavior.
5. Add alpha, mixed-format, mobile-thumbnail, and export-size checks.
6. Publish deterministic HTML plus JSON report suitable for PR artifacts.

## Current status

- [x] Branch isolated from `main`.
- [x] Agent ownership and independent review recorded.
- [x] Generator/report scaffold started.
- [ ] #24 expanded roster available.
- [ ] #25 mixed-format fixtures available.
- [ ] #26 preset definitions available.
- [ ] Complete matrix generated.
- [ ] Human art-direction signoff complete.

## Review gates

- Every canonical character and every shipped preset appears at least once.
- Every failure identifies test ID, character ID, preset ID, source path, and likely cause.
- Re-running with unchanged inputs produces stable case IDs, ordering, and filenames.
- Automated checks never claim human art-direction approval.
