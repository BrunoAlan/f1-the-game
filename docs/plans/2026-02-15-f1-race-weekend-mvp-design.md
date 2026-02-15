# F1 The Game — Race Weekend MVP Design

**Date:** 2026-02-15
**Status:** Approved

## Overview

A Formula 1 race management/strategy game built in the browser. The player chooses a team and controls race strategy across a full weekend: Practice, Qualifying, Strategy, and Race. Pixel-retro aesthetic with real 2026 F1 teams and drivers.

**MVP Scope:** One complete Race Weekend loop with 1 circuit, 11 teams (22 cars), dynamic weather, and Safety Car.

## Tech Stack

- React 19 + TypeScript + Vite
- Zustand (state management)
- Tailwind CSS (Pixel-Tech styling)
- Framer Motion (leaderboard animations, transitions)
- localStorage (persistence)
- Font: Press Start 2P (Google Fonts)

## Architecture

**Component-Per-Phase:** Each race weekend phase is a distinct screen. The simulation engine is a pure TypeScript module with zero React dependencies. Race phase uses a timer-based loop (setInterval, ~1 lap/second). Other phases are standard React UIs.

## Data Models

### Teams (11)

| Team | Engine | Primary Color | Accent Color |
|------|--------|---------------|--------------|
| Red Bull Racing | Red Bull/Ford | `#3671C6` | `#FFD700` |
| McLaren | Mercedes | `#FF8000` | `#0090FF` |
| Mercedes | Mercedes | `#27F4D2` | `#222222` |
| Ferrari | Ferrari | `#E8002D` | `#FFDD00` |
| Aston Martin | Honda | `#229971` | `#FFFFFF` |
| Alpine | Mercedes | `#0093CC` | `#FF69B4` |
| Audi | Audi | `#1E1E1E` | `#00E701` |
| Cadillac | Ferrari | `#1C1C1C` | `#D4AF37` |
| Williams | Mercedes | `#64C4FF` | `#005AFF` |
| Racing Bulls | Red Bull/Ford | `#6692FF` | `#FF1801` |
| Haas | Ferrari | `#B6BABD` | `#E80020` |

### Drivers (22)

| Driver | Team | Speed | Aggression | Tire Mgmt | Wet Skill |
|--------|------|-------|------------|-----------|-----------|
| Max Verstappen | Red Bull Racing | 97 | 85 | 88 | 95 |
| Isack Hadjar | Red Bull Racing | 78 | 72 | 70 | 68 |
| Lando Norris | McLaren | 93 | 75 | 85 | 82 |
| Oscar Piastri | McLaren | 90 | 70 | 83 | 78 |
| George Russell | Mercedes | 89 | 68 | 82 | 80 |
| Kimi Antonelli | Mercedes | 82 | 74 | 72 | 70 |
| Lewis Hamilton | Ferrari | 94 | 72 | 92 | 93 |
| Charles Leclerc | Ferrari | 93 | 80 | 78 | 75 |
| Fernando Alonso | Aston Martin | 88 | 65 | 90 | 88 |
| Lance Stroll | Aston Martin | 75 | 62 | 74 | 70 |
| Franco Colapinto | Alpine | 77 | 73 | 68 | 65 |
| Pierre Gasly | Alpine | 84 | 70 | 79 | 76 |
| Gabriel Bortoleto | Audi | 79 | 71 | 72 | 67 |
| Nico Hulkenberg | Audi | 82 | 60 | 80 | 75 |
| Sergio Perez | Cadillac | 83 | 65 | 81 | 78 |
| Valtteri Bottas | Cadillac | 81 | 55 | 83 | 77 |
| Alexander Albon | Williams | 85 | 68 | 80 | 76 |
| Carlos Sainz | Williams | 90 | 72 | 85 | 82 |
| Arvid Lindblad | Racing Bulls | 76 | 74 | 68 | 64 |
| Liam Lawson | Racing Bulls | 80 | 76 | 73 | 71 |
| Oliver Bearman | Haas | 78 | 72 | 70 | 66 |
| Esteban Ocon | Haas | 83 | 68 | 77 | 74 |

### Tires

| Compound | Grip Base | Degradation/lap | Optimal Life (laps) |
|----------|-----------|-----------------|---------------------|
| Soft | 0.97 | 0.025 | ~10 |
| Medium | 1.00 | 0.015 | ~20 |
| Hard | 1.03 | 0.008 | ~35 |
| Intermediate | 1.05 (dry) / 0.95 (rain) | 0.012 | ~25 |
| Wet | 1.15 (dry) / 0.92 (heavy rain) | 0.010 | ~30 |

Driver tire management effect: `realDeg = baseDeg * (1 - tireManagement * 0.005)`

### Track (1 for MVP)

- Name, totalLaps, baseLapTime (seconds), overtakingDifficulty (1-100), pitLaneTimeLoss (seconds)
- Monza-inspired: 53 laps, baseLapTime ~80s, overtakingDifficulty 35, pitLaneTimeLoss 22s

### Weather

- Conditions: Dry, Light Rain, Heavy Rain
- changeChance: 5% per lap
- Transitions: Dry <-> Light Rain <-> Heavy Rain

Grip multiplier matrix (tire/weather):

|  | Dry | Light Rain | Heavy Rain |
|---|---|---|---|
| Slicks (S/M/H) | 1.0 | 1.25 | 1.60 |
| Intermediate | 1.10 | 1.0 | 1.15 |
| Wet | 1.20 | 1.05 | 1.0 |

## Simulation Engine

### Lap Time Formula

```
T_lap = baseLapTime
  * (1 - carTopSpeed * 0.002)
  * (1 - driverSpeed * 0.001)
  * (1 + fuelLoad * 0.0003)
  * (1 + tireDegradation * 0.004)
  * weatherGripMultiplier
  + random(-0.3, +0.3)
```

### Overtaking Logic

```
gapReduction = timeDifference * 0.7
if gap < 0.5s:
  overtakeChance = (driverAggression * 0.4 + speedDiff * 0.3)
                   * (1 - track.overtakingDifficulty * 0.01)
```

### Incidents & Safety Car

- Base incident probability per car per lap: 0.2%
- Modifiers: aggression increases risk, reliability reduces it
- Types: Spin (lose 5s), Mechanical DNF, Collision
- Safety Car: compresses all gaps to 0.2s, lasts 3-5 laps

### Pit Stops

- Time cost: track.pitLaneTimeLoss (e.g., 22s)
- Resets tire grip to 100%, changes compound
- Rule: minimum 2 different dry compounds per race

## UI/UX Phases

### Phase 1: Practice (Data Hunt)

- Auto-lapping for 15-30 seconds
- Progressively reveals tire degradation data
- "Data Collected" progress bar
- Can skip (less info for strategy)

### Phase 2: Qualifying (The Shootout)

- Player chooses mode: Safe (90%) / Push (100%) / Full Send (105%)
- Push has ~15% error chance, Full Send ~35%
- 5-second sector animation
- Full classification grid shown at end

### Phase 3: Strategy Room (Stint Planner)

- Left panel: degradation chart (data from practice)
- Right panel: stint planner with compound selectors and lap sliders
- Predicted finish position
- Validates minimum 2 compounds rule
- No time limit

### Phase 4: Race (Simulation)

- Auto-advancing ~1 lap/second
- Dynamic leaderboard with Framer Motion animations
- Player controls: Push / Neutral / Save + Box Now
- Tire grip bar, fuel bar, weather badge, lap counter
- Radio alerts: pit warnings, safety car, weather changes, gap updates
- Safety Car compresses field

## Navigation Flow

```
TeamSelect -> Practice -> Qualifying -> StrategyRoom -> Race -> Results
                                                                  |
                                                          [Race Again] -> TeamSelect
```

## File Structure

```
src/
├── main.tsx
├── App.tsx
├── data/
│   ├── teams.ts
│   ├── drivers.ts
│   ├── tracks.ts
│   └── tires.ts
├── engine/
│   ├── lapSimulator.ts
│   ├── tireModel.ts
│   ├── weatherEngine.ts
│   ├── overtakingEngine.ts
│   ├── incidentEngine.ts
│   ├── qualifyingSimulator.ts
│   └── raceSimulator.ts
├── stores/
│   ├── weekendStore.ts
│   ├── raceStore.ts
│   └── strategyStore.ts
├── screens/
│   ├── TeamSelect.tsx
│   ├── Practice.tsx
│   ├── Qualifying.tsx
│   ├── StrategyRoom.tsx
│   └── Race.tsx
├── components/
│   ├── Leaderboard.tsx
│   ├── TireIndicator.tsx
│   ├── FuelIndicator.tsx
│   ├── WeatherBadge.tsx
│   ├── RadioAlert.tsx
│   ├── LapCounter.tsx
│   ├── SafetyCarBanner.tsx
│   ├── DegradationChart.tsx
│   ├── StintPlanner.tsx
│   └── PixelButton.tsx
├── styles/
│   └── index.css
├── hooks/
│   ├── useRaceLoop.ts
│   └── useRadioMessages.ts
└── utils/
    ├── random.ts
    └── formatTime.ts
```

## Persistence (localStorage)

- Best race result per team
- Last used strategy
- Unlocked data from practice sessions

## Future (Post-MVP)

- HQ Module (R&D tree, pilot management, finances, sponsors)
- Multiple circuits
- Supabase backend for cloud saves and global leaderboard
- Cosmetics (pixel liveries)
- Season Pass (legendary circuits, historic drivers)
- Async mode (ghost strategies)
