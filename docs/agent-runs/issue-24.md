# Agent run — Issue #24

## Goal
Expand the approved complete-character roster from 12 to exactly 36 distinct authored animal faces without counting palette swaps as separate characters.

## Team

- **Producer** — locks the 12 → 36 target, sequences art batches, coordinates the manifest contract with #25, and owns delivery tracking.
- **Creative Director** — owns roster variety, audience appeal, personality balance, and final creative recommendation.
- **Art Director** — owns silhouettes, head/ear treatments, palette distribution, line/texture fidelity, and contact-sheet approval.
- **Designer** — owns thumbnail readability and library-card naming.
- **Creative Technologist** — supports asset preparation, canonical sizing, alpha cleanup, and deterministic contact-sheet tooling.
- **JavaScript Specialist** — owns manifest integration, stable IDs, loading, export, and validation.
- **Visual Fidelity Reviewer** — independently checks clipping, alpha, canvas size, anchors, and accidental near-duplicates.
- **Documentation Handoff Editor** — updates the roster manifest and asset authoring guide.

## Target

- Current approved complete faces on `main`: **12**.
- Required added complete faces: **24**.
- Required final total: **36**.

## Art batches

1. **Soft mammals:** panda, capybara, otter, red panda, mouse, sloth, seal, quokka.
2. **Distinct heads/ears:** bat, owl, alpaca, chinchilla, ferret, fennec, possum, red squirrel.
3. **Graphic silhouettes:** axolotl, frog, penguin, duckling, piglet, cow, bee, dragon.

## Current status

- [x] Branch isolated from `main`.
- [x] Exact 12 → 36 target recorded.
- [x] Twenty-four stable character IDs and art-direction briefs queued.
- [ ] Authored transparent assets committed.
- [ ] Canonical manifest integration complete.
- [ ] Builder loading and export verified.
- [ ] Full 36-character contact sheet approved.

## Review gates

- **Roster gate:** all 24 additions have distinct silhouette/head treatment/personality cues.
- **Asset gate:** no opaque backgrounds, clipping, canvas mismatch, or unstable IDs.
- **Product gate:** every addition loads, selects, saves, restores, and exports.
- **Art-direction gate:** complete 36-character contact sheet receives human approval.
