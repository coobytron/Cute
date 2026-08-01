# History and saved variations

The MVP history layer records meaningful composition changes across both Complete faces and Build a face.

## Snapshot schema

Each snapshot is schema version 2 and contains:

- `mode`: `recipes` or `parts`
- `composer`: legacy complete-face state or `CuteBuildFace` state
- `artDirection`: finish, background, frame, expression, caption and transparency
- `title`: display name used by saved cards

Transient UI state such as the active category tab, open controls and hover state is excluded.

## History rules

- Recipe, part, palette, expression, finish, background, frame, caption, flip, scale, rotation, reset and shuffle changes are undoable.
- Range drags are grouped into one before/after operation.
- Opening panels or switching the visible category does not create an entry.
- Undo and redo are capped at 80 snapshots.
- A new change after undo removes the old redo branch.
- `Command/Ctrl + Z` undoes; `Command/Ctrl + Shift + Z` redoes.

## Saved variations

Saved variations use local storage key `cute-face-builder/saves/v2`.

Each record contains a stable ID, timestamps, favorite state, title, SVG thumbnail preview and the complete snapshot. The UI keeps up to 12 records and handles corrupted or older data by starting from an empty collection.

Storage failures emit `cute:storage-error` and do not crash the editor.

## Restore behavior

Restoring a card switches to the correct mode, restores the composer through its public API, then restores Art direction. This creates a predictable history boundary so the load itself can be undone.

## Public API

`window.CuteHistorySaves` exposes:

- `capture()`
- `restore(snapshot)`
- `undo()`
- `redo()`
- `saveCurrent()`
- `getRecords()`

## Validation

```bash
node scripts/validate-history-saves.mjs
```

Manual review should cover mixed edit sequences, slider grouping, redo invalidation, both composer modes, reload persistence, corrupted storage and storage quota errors.