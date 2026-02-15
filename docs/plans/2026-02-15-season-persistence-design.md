# Season Persistence

**Date**: 2026-02-15
**Goal**: Auto-save season progress to localStorage so it survives browser refresh/close.
**Status**: Approved

## Approach

Use Zustand's built-in `persist` middleware on `seasonStore` and `weekendStore`. Every state change auto-serializes to localStorage.

## What Gets Persisted

| Store          | localStorage Key  | Data                                                                                     |
| -------------- | ----------------- | ---------------------------------------------------------------------------------------- |
| `seasonStore`  | `f1-game-season`  | standings, budget, RP, upgrades, components, sponsors, raceIndex, seasonActive           |
| `weekendStore` | `f1-game-weekend` | phase, selectedTeamId, selectedDriverId, trackId, isSprint, grids, weather, practiceData |

**Not persisted:** `raceStore`, `strategyStore`. Mid-race close → return to HQ on reload.

## Flow on App Open

1. Stores auto-rehydrate from localStorage (Zustand persist handles this)
2. If `seasonStore.seasonActive === true` → show dialog: "Continue season?" / "New season"
3. "Continue" → restore saved phase (but if mid-race, fall back to HQ)
4. "New" → call `reset()` on both stores → Team Select

## Mid-Weekend Handling

If phase is race/sprint-race/qualifying/etc and raceStore isn't persisted:

- Fall back to HQ, re-start that weekend

## Files to Change

- `src/stores/seasonStore.ts` — add `persist` middleware
- `src/stores/weekendStore.ts` — add `persist` middleware
- `src/App.tsx` — add continue/new dialog logic on mount
