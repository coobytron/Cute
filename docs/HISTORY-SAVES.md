# History and saved variations

The MVP history layer records meaningful composition changes across both manifest-backed Complete faces and authored Build a face compositions.

## Snapshot schema

Each snapshot uses schema version 2:

```json
{
  "schemaVersion": 2,
  "mode": "recipes",
  "composer": {},
  "artDirection": {},
  "title": "Mochi Cat"
}
```

- `mode` is `recipes` or `parts`.
- `composer` is captured through `CuteCompleteFaces.getState()` or `CuteBuildFace.getState()`.
- `artDirection` contains finish, background, frame, expression, caption, caption visibility, and transparency.
- `title` is the visible character name used by saved cards.

Transient UI state such as the active part category, open disclosures, hover state, and panel scroll position is excluded.

## History rules

- Complete-face recipe selection, layered recipe and part selection, palette, expression, finish, background, frame, caption, flip, scale, rotation, reset, shuffle, and mode changes are undoable.
- Range drags are grouped into one before/after edit rather than one entry per input event.
- Character-name and caption typing are grouped by focus session.
- Switching only the visible part category does not create a history entry.
- Undo and redo are capped at 80 snapshots.
- A new edit after undo removes the abandoned redo branch.
- `Command/Ctrl + Z` undoes.
- `Command/Ctrl + Shift + Z` redoes.

## Saved variations

Saved variations use local storage key `cute-face-builder/saves/v2`.

Each record contains:

- stable ID
- created and updated timestamps
- favorite state
- title
- SVG thumbnail preview generated from the Art direction export composition
- full schema-versioned snapshot

The interface keeps up to 12 records. Corrupted, missing, or older storage is ignored without crashing. Quota and access failures emit `cute:storage-error` and show a recoverable message beside the saved strip.

## Restore behavior

Restoring a card:

1. captures the current composition as an undo boundary
2. switches to Complete faces or Build a face
3. restores the composer through its public API
4. restores Art direction
5. restores the visible title
6. captures the restored result as the next history state

This makes loading a saved friend undoable and keeps stable asset IDs intact.

## Favorites

The header favorite button and saved-card hearts operate on persistent saved records. Favoriting an unsaved composition first creates its saved record, then marks it as favorite.

## Public API

`window.CuteHistorySaves` exposes:

- `capture()`
- `restore(snapshot)`
- `undo()`
- `redo()`
- `saveCurrent()`
- `getRecords()`
- `clear()`

## Validation

```bash
node scripts/validate-history-saves.mjs
```

Manual review should cover:

- mixed edits across both composer modes
- range grouping and redo invalidation
- save and exact restore for a complete face and a layered face
- favorite persistence after reload
- restoring a saved card after switching modes
- corrupted local storage
- quota or denied-storage errors
- keyboard undo and redo
