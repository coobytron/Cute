# Responsive and accessibility review

The MVP keeps one browser application and one authored composition model. Layout changes are content-driven; there is no separate phone codebase.

## Target widths

Review at:

- 1600 px — full three-column desktop
- 1280 px — compact three-column desktop
- 1024 px — library + stage with Art direction flowing below
- 768 px — stage first, mobile panel navigation, touch controls
- 390 px — phone layout with one visible editing panel and horizontally scrolling saves

Use [`previews/responsive-review.html`](../previews/responsive-review.html) through the local HTTP server for a repeatable viewport review.

## Layout behavior

### Large desktop

- header, authored-assets panel, dominant square stage, Art direction panel, and saved strip remain visible
- panel widths compress before the stage does
- the stage stays square and centered

### Compact desktop and tablet

- Art direction moves below the stage when three columns no longer fit
- saved variations become a horizontal strip rather than shrinking into unreadable cards
- stage controls may scroll horizontally while retaining 44 px targets

### Phone

- stage is the first workspace region
- Authored assets and Art direction use a two-tab mobile panel switcher
- only the selected editing panel is focusable and exposed to assistive technology
- saved variations scroll horizontally with snap points
- header actions use a two-column touch layout
- category and stage toolbars scroll horizontally without creating body overflow

## Accessibility behavior

- a skip link moves focus directly to Current character
- stage, asset library, Art direction, and saved variations expose named regions
- mobile panel buttons and library mode buttons use keyboard-operable tab semantics
- selected, favorite, and disabled states are not communicated by color alone
- range controls expose updated `aria-valuetext`
- character changes, saved variations, export errors, and storage errors are announced through a polite live region
- hidden mobile panels use both visual hiding and `inert`/`aria-hidden`
- visible focus works for buttons, inputs, selects, links, menus, and saved cards
- reduced-motion removes non-essential transitions
- forced-colors mode preserves borders and adds an explicit selected-state outline

## Keyboard checklist

1. Use the skip link.
2. Move through header actions and open the Export menu.
3. Switch Complete faces / Build a face with Left/Right, Home, and End.
4. Select recipes and authored parts.
5. Operate scale and rotation with arrow keys.
6. Use the stage action toolbar.
7. Switch phone editing panels with Left/Right.
8. Save, favorite, restore, and delete a variation.
9. Undo and redo with toolbar buttons and Command/Ctrl+Z.
10. Confirm focus never enters the hidden mobile panel.

## Zoom and text

Review at 200% browser zoom. The stage remains usable, editing regions stack, controls wrap or scroll locally, and the page does not require horizontal body scrolling.

## VoiceOver basics

In Safari:

- regions are named in a useful workflow order
- the character title and update status are announced
- tab selected states are exposed
- icon-only controls have names
- toggle checked states and disabled unsupported variants are announced
- export success or failure and saved-state errors are surfaced

## Known review boundary

CI validates required CSS breakpoints, focus/contrast rules, dynamic semantics, load order, and the deterministic review tool. It does not claim live Safari, Chromium, VoiceOver, or device rendering. Those remain explicit release-checklist items.
