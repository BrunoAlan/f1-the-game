# Rain Tires Player Access

**Date**: 2026-02-15
**Goal**: Allow player to pit for intermediate/wet tires when it rains during a race.
**Status**: Approved

## Problem

Pit stop compound selection in Race.tsx and SprintRace.tsx is hardcoded to `['soft', 'medium', 'hard']`. AI already switches to rain tires via raceSimulator.ts, creating an unfair advantage.

## Solution

Make pit compound list dynamic based on current weather:

- **Dry**: soft, medium, hard
- **Light rain / Heavy rain**: soft, medium, hard, intermediate, wet

## Files to Change

- `src/screens/Race.tsx` — line 34: make PIT_COMPOUNDS dynamic
- `src/screens/SprintRace.tsx` — line 34: same change

## No Changes Needed

- Engine (AI already works)
- Weather engine (already changes weather)
- Lap simulator (grip matrix already penalizes)
- TireCompoundIcon (already supports I/W)
- StrategyRoom (pre-race strategy stays dry-only, player adapts mid-race)
