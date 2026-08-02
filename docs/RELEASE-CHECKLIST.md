# MVP release checklist

This checklist separates automated structural validation from live browser, device, assistive-technology, and art-direction approval.

## Automated checks

Run from a clean checkout with Node.js 18 or newer:

```bash
node scripts/validate-release.mjs
```

The aggregate validator runs every focused validator, checks the full release matrix and feature map, writes `review-artifacts/release-validation.json`, and exits non-zero when an automated requirement fails.

Automated coverage:

- authored manifest schema, file references, IDs, transforms, bounds, palettes, compatibility, and recipes
- 12 approved complete-face assets and 12 selectable complete-face recipes
- Build-a-face category counts, compatibility, overrides, and 12 curated layered recipes
- Art direction finishes, backgrounds, frames, expressions, transparency, and state API
- history, saved variations, favorites, storage recovery, and public API
- opaque/transparent export menu, recipe JSON, object URL cleanup, and fixtures
- responsive breakpoints, mobile panel semantics, focus rules, reduced motion, and forced colors
- release matrix coverage and machine-readable feature mapping

## Visual contact-sheet approval

- [ ] Open `previews/contact-sheets/release-matrix.html` through the local HTTP server.
- [ ] Review all 12 complete faces normal and flipped.
- [ ] Review all 12 layered recipes normal and flipped.
- [ ] Review the category × compatible-base sheet.
- [ ] Review Classic paper, Clean studio, Thermal print, and Sticker.
- [ ] Review all approved palettes and backgrounds.
- [ ] Review No frame, Soft rounded, and Postage dash.
- [ ] Review caption off/on.
- [ ] Review opaque and transparent checkerboard output.
- [ ] Confirm no clipped ears, whiskers, antlers, wool, spines, accessories, frames, captions, sticker cutlines, or shadows.

## Safari

- [ ] Load from `python3 -m http.server 8000` with no console errors.
- [ ] Select all 12 complete faces.
- [ ] Switch repeatedly between Complete faces and Build a face.
- [ ] Exercise every Art direction control.
- [ ] Save, restore, favorite, delete, undo, and redo.
- [ ] Export opaque and transparent PNGs.
- [ ] Copy recipe JSON.
- [ ] Repeat export at least ten times and watch for progressive slowdown.
- [ ] Test keyboard-only operation.
- [ ] Test at 200% zoom.

## Chromium

- [ ] Repeat the Safari workflow.
- [ ] Confirm filename and download behavior.
- [ ] Confirm clipboard fallback or permission messaging.
- [ ] Confirm transparent PNG corners.

## Phone and tablet

- [ ] Review 768 px and 390 px in `previews/responsive-review.html`.
- [ ] Test iPhone Safari portrait and landscape orientation changes.
- [ ] Confirm stage remains near the top.
- [ ] Confirm only one editing panel is visible and focusable on phone.
- [ ] Confirm header actions and panel tabs meet touch sizing.
- [ ] Confirm stage tools, categories, and saved variations scroll locally.
- [ ] Confirm there is no horizontal body overflow.

## iOS hardware pass

Review with [`previews/ios-review.html`](../previews/ios-review.html) first, then on a device. See [`IOS-EXPERIENCE.md`](IOS-EXPERIENCE.md).

- [ ] Confirm safe-area padding on a notched iPhone in portrait and landscape.
- [ ] Confirm the Safari toolbar never covers the last row of content.
- [ ] Confirm focusing the character name field does not zoom the page.
- [ ] Confirm tapped cards and buttons do not keep a stuck hover state.
- [ ] Pinch the stage to scale, twist to tilt, and double-tap to reset.
- [ ] Confirm one-finger scrolling over the stage still scrolls the page.
- [ ] Export PNG and transparent PNG through the share sheet, then Save to Photos and Save to Files.
- [ ] Cancel the share sheet and confirm it reports cancelled rather than failed.
- [ ] Confirm Copy recipe JSON still reaches the clipboard.
- [ ] Open the keyboard and confirm sticky bars do not float over the composition.
- [ ] Add to Home Screen, confirm the icon and title, then relaunch in standalone mode.

## Accessibility

- [ ] Use the skip link.
- [ ] Review named regions and heading order.
- [ ] Review Complete faces / Build a face tab semantics.
- [ ] Review phone editing-panel tab semantics.
- [ ] Confirm selected/favorite/disabled states are not color-only.
- [ ] Confirm live announcements are useful and not excessively repetitive.
- [ ] Confirm hidden phone panel controls are skipped.
- [ ] Review reduced-motion mode.
- [ ] Review forced-colors/high-contrast mode.
- [ ] Run VoiceOver basics in Safari.

## Persistence

- [ ] Save a complete face and a layered face, reload, and restore both exactly.
- [ ] Verify favorites persist.
- [ ] Verify corrupted local storage does not crash the app.
- [ ] Simulate denied/full storage and confirm a recoverable message.
- [ ] Confirm loading a saved variation creates an undo boundary.

## Thermal review

- [ ] Inspect 384 px output.
- [ ] Inspect 576 px output.
- [ ] Confirm eyes, mouth, silhouette, markings, and accessories remain legible.
- [ ] Print a physical sample where available.

## Release decision

Release only when:

- every automated validator passes
- the full contact sheet receives art-direction approval
- all blocking live-browser/device issues are resolved or documented
- `README.md`, feature map, limitations, and this checklist match the shipped behavior

Manual checks intentionally remain unchecked in the repository until someone performs them. CI passing does not imply live browser, device, VoiceOver, or physical thermal-printer approval.
