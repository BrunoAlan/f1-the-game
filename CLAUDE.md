# F1 The Game

## Project Overview

Browser-based F1 race management/strategy game with pixel-retro aesthetic. React 19 + TypeScript + Vite.

## Tech Stack

- **Framework:** React 19 + TypeScript + Vite 7
- **State:** Zustand
- **Styling:** Tailwind CSS (Pixel-Tech theme: slate-900 bg, slate-700 borders, neon accents)
- **Animation:** Framer Motion
- **Font:** Press Start 2P (Google Fonts)
- **Persistence:** localStorage
- **Package Manager:** pnpm

## Architecture

Component-Per-Phase architecture. Each race weekend phase is a distinct screen. The simulation engine (`src/engine/`) is pure TypeScript with zero React dependencies.

## Key Directories

- `src/data/` — Static data: teams, drivers, tracks, tires
- `src/engine/` — Simulation logic (pure TS, no React imports)
- `src/stores/` — Zustand stores (weekendStore, raceStore, strategyStore)
- `src/screens/` — Phase screens (TeamSelect, Practice, Qualifying, StrategyRoom, Race)
- `src/components/` — Reusable UI components
- `src/hooks/` — Custom hooks (useRaceLoop, useRadioMessages)
- `src/utils/` — Helpers (random, formatTime)

## Commands

- `pnpm dev` — Start dev server
- `pnpm build` — Type-check + production build
- `pnpm lint` — ESLint

## Conventions

- Engine modules must have zero React dependencies (pure TypeScript)
- All stats use 1-100 scale
- Team colors follow real 2026 F1 team colors
- Real 2026 driver/team names
- UI follows Pixel-Tech aesthetic: monospace font, dark theme, neon accents
- State management per phase via Zustand, with weekendStore as orchestrator

## Design Doc

See `docs/plans/2026-02-15-f1-race-weekend-mvp-design.md` for the full approved design.
