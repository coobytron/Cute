# Issue 41 — iOS polish pass

## Objective

Polish the existing iPhone-first Cute experience without introducing a second renderer, mobile-only face state, or a forked export path.

## Baseline reviewed

- `index.html` already uses `viewport-fit=cover` and loads `mobile-ios.css`.
- `mobile-ios.css` already makes the stage primary, converts libraries and controls into horizontal touch rails, enlarges touch targets, and respects the bottom safe area.
- the existing iOS experience layer owns Safari/PWA viewport behavior, gestures, keyboard state, and share-sheet PNG export.

## Agent Cody Banks roles

Referenced `coobytron/Agent-Cody-Banks` before scoping the work.

- Product Designer: one-handed hierarchy and navigation density
- Creative Technologist: Safari/PWA viewport behavior
- JavaScript Specialist: progressive enhancement and state preservation
- Accessibility / QA reviewer: touch targets, focus, reduced motion, VoiceOver-safe labeling

## First implementation slice

1. Audit 390 px and 430 px phone widths for vertical travel and rail overflow.
2. Keep the stage and primary actions in the first screenful where possible.
3. Normalize rail behavior with momentum scrolling, overscroll containment, and clean snap points.
4. Tighten card widths and spacing without reducing touch targets below 44 px.
5. Verify safe-area bottom clearance in Safari and standalone PWA display modes.
6. Verify keyboard-open state disables or repositions sticky controls so fields remain visible.
7. Re-run iOS validation and preserve pinch/twist/double-tap plus share-sheet export.

## Non-goals

- no new anatomy generation
- no duplicated mobile renderer
- no separate mobile manifest/state model
- no desktop/tablet redesign in this issue

## Review gate

Human review should compare at least 390 × 844 and 430 × 932 in Safari, plus installed PWA mode where available. Automated checks remain necessary but do not replace touch/scroll review on-device.
