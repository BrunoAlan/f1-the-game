# HQ Management & Season Mode Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a full season mode with HQ management (R&D, components, finances/sponsors, standings) across a real 25-race 2026 F1 calendar with sprint support.

**Architecture:** A single `seasonStore` holds all persistent season state (budget, RP, R&D, components, standings, sponsors). One HQ screen with tabbed sub-views sits between race weekends. Existing race weekend flow reads modified team stats from the season store and feeds results back after each race.

**Tech Stack:** React 19, TypeScript, Zustand, Tailwind CSS, Framer Motion, Vitest

---

### Task 1: Update Data Types

**Files:**
- Modify: `src/data/types.ts`

**Step 1: Add new fields to Track interface and add new types**

Add `tireWear`, `fuelConsumption`, `type`, `circuit`, and `hasSprint` to the existing Track interface. Add all season-related types.

```typescript
// In src/data/types.ts — replace entire file contents:

export interface Team {
  id: string
  name: string
  engine: string
  primaryColor: string
  accentColor: string
  topSpeed: number
  cornering: number
  reliability: number
}

export interface Driver {
  id: string
  name: string
  shortName: string
  number: number
  teamId: string
  speed: number
  aggression: number
  tireManagement: number
  wetSkill: number
}

export type TireCompound = 'soft' | 'medium' | 'hard' | 'intermediate' | 'wet'

export type WeatherCondition = 'dry' | 'light-rain' | 'heavy-rain'

export interface TireSpec {
  compound: TireCompound
  gripBase: number
  degradationRate: number
  optimalLife: number
}

export type TrackType = 'street' | 'high-speed' | 'technical' | 'balanced'

export interface Track {
  id: string
  name: string
  country: string
  circuit: string
  totalLaps: number
  baseLapTime: number
  overtakingDifficulty: number
  pitLaneTimeLoss: number
  weatherChangeChance: number
  tireWear: number
  fuelConsumption: number
  type: TrackType
  hasSprint: boolean
}

export interface CalendarEntry {
  round: number
  date: string
  gpName: string
  trackId: string
}

export type RDArea = 'motor' | 'aero' | 'chasis' | 'pitcrew'
export type RDBranch = 'a' | 'b'

export interface RDNode {
  area: RDArea
  level: 'base' | 'branch'
  branch?: RDBranch
  name: string
  description: string
  effects: {
    topSpeed?: number
    cornering?: number
    tireLife?: number
    pitTime?: number
    fuelConsumption?: number
    pitErrorChance?: number
    engineWear?: number
  }
  costRP: number
  costMoney: number
}

export type ComponentType = 'engine' | 'gearbox' | 'energy-recovery'

export interface ComponentState {
  type: ComponentType
  healthPercent: number
  racesUsed: number
}

export interface Sponsor {
  id: string
  name: string
  objective: SponsorObjective
  payout: number
  duration: number
  racesRemaining: number
}

export type SponsorObjective =
  | { type: 'finish-top'; position: number }
  | { type: 'both-finish' }
  | { type: 'win' }
  | { type: 'qualify-top'; position: number }
  | { type: 'score-sprint-points' }

export interface DriverStanding {
  driverId: string
  points: number
  positions: number[]
}

export interface TeamStanding {
  teamId: string
  points: number
}

export interface RDUpgrades {
  motor: { base: boolean; branch: RDBranch | null }
  aero: { base: boolean; branch: RDBranch | null }
  chasis: { base: boolean; branch: RDBranch | null }
  pitcrew: { base: boolean; branch: RDBranch | null }
}
```

**Step 2: Run build to verify types compile**

Run: `pnpm build 2>&1 | head -20`
Expected: Type errors in files that import types (drivers.ts missing `number` field, tracks.ts missing new fields). This is expected — we'll fix them in the next tasks.

**Step 3: Commit**

```bash
git add src/data/types.ts
git commit -m "feat: expand types for season mode — track, driver, R&D, components, sponsors"
```

---

### Task 2: Add Driver Numbers

**Files:**
- Modify: `src/data/drivers.ts`

**Step 1: Add `number` field to every driver**

Add the `number` property to each driver object. The full list:

| Driver | Number |
|--------|--------|
| Verstappen | 3 |
| Hadjar | 6 |
| Norris | 1 |
| Piastri | 81 |
| Russell | 63 |
| Antonelli | 12 |
| Hamilton | 44 |
| Leclerc | 16 |
| Alonso | 14 |
| Stroll | 18 |
| Colapinto | 43 |
| Gasly | 10 |
| Bortoleto | 5 |
| Hulkenberg | 27 |
| Perez | 11 |
| Bottas | 77 |
| Albon | 23 |
| Sainz | 55 |
| Lindblad | 41 |
| Lawson | 30 |
| Bearman | 87 |
| Ocon | 31 |

Add `number: X` after `shortName` for each driver entry.

**Step 2: Run build to verify**

Run: `pnpm build 2>&1 | head -20`
Expected: Should pass for drivers.ts (tracks.ts will still error).

**Step 3: Commit**

```bash
git add src/data/drivers.ts
git commit -m "feat: add real 2026 dorsal numbers to all drivers"
```

---

### Task 3: Expand Track Data to 25 Tracks

**Files:**
- Modify: `src/data/tracks.ts`

**Step 1: Replace the single track with all 25 tracks**

Replace entire `tracks` array with 25 real 2026 tracks. Each track has the new fields (`circuit`, `tireWear`, `fuelConsumption`, `type`, `hasSprint`).

Use these realistic-ish values:

```typescript
import type { Track } from './types'

export const tracks: Track[] = [
  {
    id: 'australia',
    name: 'Australia',
    country: 'Australia',
    circuit: 'Albert Park',
    totalLaps: 58,
    baseLapTime: 78,
    overtakingDifficulty: 40,
    pitLaneTimeLoss: 21,
    weatherChangeChance: 0.08,
    tireWear: 1.0,
    fuelConsumption: 1.0,
    type: 'balanced',
    hasSprint: false,
  },
  {
    id: 'china',
    name: 'China',
    country: 'China',
    circuit: 'Shanghai International',
    totalLaps: 56,
    baseLapTime: 94,
    overtakingDifficulty: 45,
    pitLaneTimeLoss: 23,
    weatherChangeChance: 0.06,
    tireWear: 1.1,
    fuelConsumption: 1.0,
    type: 'technical',
    hasSprint: true,
  },
  {
    id: 'japan',
    name: 'Japan',
    country: 'Japan',
    circuit: 'Suzuka',
    totalLaps: 53,
    baseLapTime: 90,
    overtakingDifficulty: 55,
    pitLaneTimeLoss: 22,
    weatherChangeChance: 0.1,
    tireWear: 1.15,
    fuelConsumption: 1.05,
    type: 'technical',
    hasSprint: false,
  },
  {
    id: 'bahrain',
    name: 'Bahrain',
    country: 'Bahrain',
    circuit: 'Sakhir',
    totalLaps: 57,
    baseLapTime: 90,
    overtakingDifficulty: 35,
    pitLaneTimeLoss: 22,
    weatherChangeChance: 0.01,
    tireWear: 1.2,
    fuelConsumption: 1.0,
    type: 'balanced',
    hasSprint: false,
  },
  {
    id: 'saudi-arabia',
    name: 'Saudi Arabia',
    country: 'Saudi Arabia',
    circuit: 'Jeddah Corniche',
    totalLaps: 50,
    baseLapTime: 87,
    overtakingDifficulty: 50,
    pitLaneTimeLoss: 24,
    weatherChangeChance: 0.01,
    tireWear: 0.9,
    fuelConsumption: 0.95,
    type: 'street',
    hasSprint: false,
  },
  {
    id: 'miami',
    name: 'Miami',
    country: 'United States',
    circuit: 'Miami International Autodrome',
    totalLaps: 57,
    baseLapTime: 88,
    overtakingDifficulty: 40,
    pitLaneTimeLoss: 23,
    weatherChangeChance: 0.1,
    tireWear: 1.1,
    fuelConsumption: 1.0,
    type: 'street',
    hasSprint: true,
  },
  {
    id: 'canada',
    name: 'Canada',
    country: 'Canada',
    circuit: 'Gilles Villeneuve',
    totalLaps: 70,
    baseLapTime: 74,
    overtakingDifficulty: 35,
    pitLaneTimeLoss: 21,
    weatherChangeChance: 0.12,
    tireWear: 0.85,
    fuelConsumption: 0.9,
    type: 'balanced',
    hasSprint: true,
  },
  {
    id: 'monaco',
    name: 'Monaco',
    country: 'Monaco',
    circuit: 'Monte Carlo',
    totalLaps: 78,
    baseLapTime: 72,
    overtakingDifficulty: 90,
    pitLaneTimeLoss: 20,
    weatherChangeChance: 0.05,
    tireWear: 0.7,
    fuelConsumption: 0.85,
    type: 'street',
    hasSprint: false,
  },
  {
    id: 'spain',
    name: 'Spain',
    country: 'Spain',
    circuit: 'Barcelona-Catalunya',
    totalLaps: 66,
    baseLapTime: 78,
    overtakingDifficulty: 50,
    pitLaneTimeLoss: 22,
    weatherChangeChance: 0.04,
    tireWear: 1.15,
    fuelConsumption: 1.0,
    type: 'technical',
    hasSprint: false,
  },
  {
    id: 'austria',
    name: 'Austria',
    country: 'Austria',
    circuit: 'Red Bull Ring',
    totalLaps: 71,
    baseLapTime: 65,
    overtakingDifficulty: 35,
    pitLaneTimeLoss: 20,
    weatherChangeChance: 0.15,
    tireWear: 1.0,
    fuelConsumption: 0.9,
    type: 'high-speed',
    hasSprint: false,
  },
  {
    id: 'great-britain',
    name: 'Great Britain',
    country: 'United Kingdom',
    circuit: 'Silverstone',
    totalLaps: 52,
    baseLapTime: 87,
    overtakingDifficulty: 30,
    pitLaneTimeLoss: 22,
    weatherChangeChance: 0.2,
    tireWear: 1.1,
    fuelConsumption: 1.05,
    type: 'high-speed',
    hasSprint: true,
  },
  {
    id: 'belgium',
    name: 'Belgium',
    country: 'Belgium',
    circuit: 'Spa-Francorchamps',
    totalLaps: 44,
    baseLapTime: 105,
    overtakingDifficulty: 25,
    pitLaneTimeLoss: 24,
    weatherChangeChance: 0.25,
    tireWear: 1.0,
    fuelConsumption: 1.1,
    type: 'high-speed',
    hasSprint: false,
  },
  {
    id: 'hungary',
    name: 'Hungary',
    country: 'Hungary',
    circuit: 'Hungaroring',
    totalLaps: 70,
    baseLapTime: 77,
    overtakingDifficulty: 70,
    pitLaneTimeLoss: 21,
    weatherChangeChance: 0.08,
    tireWear: 1.1,
    fuelConsumption: 0.95,
    type: 'technical',
    hasSprint: false,
  },
  {
    id: 'netherlands',
    name: 'Netherlands',
    country: 'Netherlands',
    circuit: 'Zandvoort',
    totalLaps: 72,
    baseLapTime: 71,
    overtakingDifficulty: 75,
    pitLaneTimeLoss: 20,
    weatherChangeChance: 0.15,
    tireWear: 1.0,
    fuelConsumption: 0.9,
    type: 'technical',
    hasSprint: true,
  },
  {
    id: 'italy',
    name: 'Italy',
    country: 'Italy',
    circuit: 'Monza',
    totalLaps: 53,
    baseLapTime: 80,
    overtakingDifficulty: 20,
    pitLaneTimeLoss: 22,
    weatherChangeChance: 0.05,
    tireWear: 0.8,
    fuelConsumption: 1.1,
    type: 'high-speed',
    hasSprint: false,
  },
  {
    id: 'madrid',
    name: 'Madrid',
    country: 'Spain',
    circuit: 'IFEMA Madrid',
    totalLaps: 66,
    baseLapTime: 82,
    overtakingDifficulty: 35,
    pitLaneTimeLoss: 22,
    weatherChangeChance: 0.04,
    tireWear: 1.0,
    fuelConsumption: 1.0,
    type: 'balanced',
    hasSprint: false,
  },
  {
    id: 'azerbaijan',
    name: 'Azerbaijan',
    country: 'Azerbaijan',
    circuit: 'Baku City Circuit',
    totalLaps: 51,
    baseLapTime: 102,
    overtakingDifficulty: 30,
    pitLaneTimeLoss: 25,
    weatherChangeChance: 0.03,
    tireWear: 0.85,
    fuelConsumption: 0.95,
    type: 'street',
    hasSprint: false,
  },
  {
    id: 'singapore',
    name: 'Singapore',
    country: 'Singapore',
    circuit: 'Marina Bay',
    totalLaps: 62,
    baseLapTime: 97,
    overtakingDifficulty: 70,
    pitLaneTimeLoss: 26,
    weatherChangeChance: 0.15,
    tireWear: 1.3,
    fuelConsumption: 1.05,
    type: 'street',
    hasSprint: true,
  },
  {
    id: 'united-states',
    name: 'United States',
    country: 'United States',
    circuit: 'Circuit of the Americas',
    totalLaps: 56,
    baseLapTime: 95,
    overtakingDifficulty: 35,
    pitLaneTimeLoss: 23,
    weatherChangeChance: 0.08,
    tireWear: 1.1,
    fuelConsumption: 1.0,
    type: 'balanced',
    hasSprint: false,
  },
  {
    id: 'mexico',
    name: 'Mexico',
    country: 'Mexico',
    circuit: 'Hermanos Rodriguez',
    totalLaps: 71,
    baseLapTime: 77,
    overtakingDifficulty: 40,
    pitLaneTimeLoss: 22,
    weatherChangeChance: 0.05,
    tireWear: 1.0,
    fuelConsumption: 0.9,
    type: 'balanced',
    hasSprint: false,
  },
  {
    id: 'brazil',
    name: 'Brazil',
    country: 'Brazil',
    circuit: 'Interlagos',
    totalLaps: 71,
    baseLapTime: 70,
    overtakingDifficulty: 30,
    pitLaneTimeLoss: 20,
    weatherChangeChance: 0.2,
    tireWear: 1.1,
    fuelConsumption: 0.95,
    type: 'balanced',
    hasSprint: false,
  },
  {
    id: 'las-vegas',
    name: 'Las Vegas',
    country: 'United States',
    circuit: 'Las Vegas Strip',
    totalLaps: 50,
    baseLapTime: 93,
    overtakingDifficulty: 35,
    pitLaneTimeLoss: 24,
    weatherChangeChance: 0.02,
    tireWear: 0.85,
    fuelConsumption: 1.0,
    type: 'street',
    hasSprint: false,
  },
  {
    id: 'qatar',
    name: 'Qatar',
    country: 'Qatar',
    circuit: 'Lusail International',
    totalLaps: 57,
    baseLapTime: 83,
    overtakingDifficulty: 40,
    pitLaneTimeLoss: 22,
    weatherChangeChance: 0.01,
    tireWear: 1.2,
    fuelConsumption: 1.0,
    type: 'high-speed',
    hasSprint: false,
  },
  {
    id: 'abu-dhabi',
    name: 'Abu Dhabi',
    country: 'UAE',
    circuit: 'Yas Marina',
    totalLaps: 58,
    baseLapTime: 86,
    overtakingDifficulty: 40,
    pitLaneTimeLoss: 23,
    weatherChangeChance: 0.01,
    tireWear: 1.05,
    fuelConsumption: 1.0,
    type: 'balanced',
    hasSprint: false,
  },
]
```

**Step 2: Run build to verify**

Run: `pnpm build 2>&1 | head -20`
Expected: PASS — all types now match.

**Step 3: Commit**

```bash
git add src/data/tracks.ts
git commit -m "feat: add all 25 real 2026 F1 tracks with characteristics"
```

---

### Task 4: Add Calendar, R&D Tree, and Sponsor Pool Data

**Files:**
- Create: `src/data/calendar.ts`
- Create: `src/data/rdTree.ts`
- Create: `src/data/sponsors.ts`

**Step 1: Create calendar data**

```typescript
// src/data/calendar.ts
import type { CalendarEntry } from './types'

export const calendar: CalendarEntry[] = [
  { round: 1, date: '8 Mar', gpName: 'Australian Grand Prix', trackId: 'australia' },
  { round: 2, date: '15 Mar', gpName: 'Chinese Grand Prix', trackId: 'china' },
  { round: 3, date: '29 Mar', gpName: 'Japanese Grand Prix', trackId: 'japan' },
  { round: 4, date: '12 Apr', gpName: 'Bahrain Grand Prix', trackId: 'bahrain' },
  { round: 5, date: '19 Apr', gpName: 'Saudi Arabian Grand Prix', trackId: 'saudi-arabia' },
  { round: 6, date: '3 May', gpName: 'Miami Grand Prix', trackId: 'miami' },
  { round: 7, date: '24 May', gpName: 'Canadian Grand Prix', trackId: 'canada' },
  { round: 8, date: '7 Jun', gpName: 'Monaco Grand Prix', trackId: 'monaco' },
  { round: 9, date: '14 Jun', gpName: 'Spanish Grand Prix', trackId: 'spain' },
  { round: 10, date: '28 Jun', gpName: 'Austrian Grand Prix', trackId: 'austria' },
  { round: 11, date: '5 Jul', gpName: 'British Grand Prix', trackId: 'great-britain' },
  { round: 12, date: '19 Jul', gpName: 'Belgian Grand Prix', trackId: 'belgium' },
  { round: 13, date: '26 Jul', gpName: 'Hungarian Grand Prix', trackId: 'hungary' },
  { round: 14, date: '23 Aug', gpName: 'Dutch Grand Prix', trackId: 'netherlands' },
  { round: 15, date: '6 Sep', gpName: 'Italian Grand Prix', trackId: 'italy' },
  { round: 16, date: '13 Sep', gpName: 'Madrid Grand Prix', trackId: 'madrid' },
  { round: 17, date: '26 Sep', gpName: 'Azerbaijan Grand Prix', trackId: 'azerbaijan' },
  { round: 18, date: '11 Oct', gpName: 'Singapore Grand Prix', trackId: 'singapore' },
  { round: 19, date: '25 Oct', gpName: 'United States Grand Prix', trackId: 'united-states' },
  { round: 20, date: '1 Nov', gpName: 'Mexican Grand Prix', trackId: 'mexico' },
  { round: 21, date: '8 Nov', gpName: 'Brazilian Grand Prix', trackId: 'brazil' },
  { round: 22, date: '21 Nov', gpName: 'Las Vegas Grand Prix', trackId: 'las-vegas' },
  { round: 23, date: '29 Nov', gpName: 'Qatar Grand Prix', trackId: 'qatar' },
  { round: 24, date: '6 Dec', gpName: 'Abu Dhabi Grand Prix', trackId: 'abu-dhabi' },
]
```

**Step 2: Create R&D tree data**

```typescript
// src/data/rdTree.ts
import type { RDNode, RDArea } from './types'

export const rdTree: Record<RDArea, { base: RDNode; branches: [RDNode, RDNode] }> = {
  motor: {
    base: {
      area: 'motor',
      level: 'base',
      name: 'Engine Development',
      description: 'Improve base engine performance',
      effects: { topSpeed: 2 },
      costRP: 50,
      costMoney: 500_000,
    },
    branches: [
      {
        area: 'motor',
        level: 'branch',
        branch: 'a',
        name: 'Raw Power',
        description: '+3 top speed, +1 fuel consumption, +0.5% engine wear/race',
        effects: { topSpeed: 3, fuelConsumption: 0.05, engineWear: 0.5 },
        costRP: 100,
        costMoney: 1_000_000,
      },
      {
        area: 'motor',
        level: 'branch',
        branch: 'b',
        name: 'Fuel Efficiency',
        description: '+1 top speed, -15% fuel consumption',
        effects: { topSpeed: 1, fuelConsumption: -0.15 },
        costRP: 100,
        costMoney: 1_000_000,
      },
    ],
  },
  aero: {
    base: {
      area: 'aero',
      level: 'base',
      name: 'Aerodynamic Package',
      description: 'Improve base downforce',
      effects: { cornering: 2 },
      costRP: 50,
      costMoney: 500_000,
    },
    branches: [
      {
        area: 'aero',
        level: 'branch',
        branch: 'a',
        name: 'High Downforce',
        description: '+3 cornering, -1 top speed',
        effects: { cornering: 3, topSpeed: -1 },
        costRP: 100,
        costMoney: 1_000_000,
      },
      {
        area: 'aero',
        level: 'branch',
        branch: 'b',
        name: 'Low Drag',
        description: '+1 cornering, +2 top speed',
        effects: { cornering: 1, topSpeed: 2 },
        costRP: 100,
        costMoney: 1_000_000,
      },
    ],
  },
  chasis: {
    base: {
      area: 'chasis',
      level: 'base',
      name: 'Chassis Development',
      description: 'Improve tire preservation',
      effects: { tireLife: 8 },
      costRP: 50,
      costMoney: 500_000,
    },
    branches: [
      {
        area: 'chasis',
        level: 'branch',
        branch: 'a',
        name: 'Tire Preservation',
        description: '+15% tire life, -1 cornering',
        effects: { tireLife: 15, cornering: -1 },
        costRP: 100,
        costMoney: 1_000_000,
      },
      {
        area: 'chasis',
        level: 'branch',
        branch: 'b',
        name: 'Mechanical Grip',
        description: '+5% tire life, +2 cornering',
        effects: { tireLife: 5, cornering: 2 },
        costRP: 100,
        costMoney: 1_000_000,
      },
    ],
  },
  pitcrew: {
    base: {
      area: 'pitcrew',
      level: 'base',
      name: 'Pit Crew Training',
      description: 'Faster pit stops',
      effects: { pitTime: -0.3 },
      costRP: 50,
      costMoney: 500_000,
    },
    branches: [
      {
        area: 'pitcrew',
        level: 'branch',
        branch: 'a',
        name: 'Speed Specialists',
        description: '-0.6s pit time, +5% pit error chance',
        effects: { pitTime: -0.6, pitErrorChance: 5 },
        costRP: 100,
        costMoney: 1_000_000,
      },
      {
        area: 'pitcrew',
        level: 'branch',
        branch: 'b',
        name: 'Consistency',
        description: '-0.2s pit time, -50% pit error chance',
        effects: { pitTime: -0.2, pitErrorChance: -50 },
        costRP: 100,
        costMoney: 1_000_000,
      },
    ],
  },
}
```

**Step 3: Create sponsor pool data**

```typescript
// src/data/sponsors.ts
import type { Sponsor } from './types'

// Template sponsors — racesRemaining gets set when signed
export const sponsorPool: Omit<Sponsor, 'racesRemaining'>[] = [
  {
    id: 'pixel-energy',
    name: 'Pixel Energy',
    objective: { type: 'finish-top', position: 10 },
    payout: 200_000,
    duration: 5,
  },
  {
    id: 'bytespeed-tech',
    name: 'ByteSpeed Tech',
    objective: { type: 'finish-top', position: 5 },
    payout: 400_000,
    duration: 3,
  },
  {
    id: 'retrofuel',
    name: 'RetroFuel',
    objective: { type: 'both-finish' },
    payout: 150_000,
    duration: 8,
  },
  {
    id: 'neonware',
    name: 'NeonWare',
    objective: { type: 'score-sprint-points' },
    payout: 100_000,
    duration: 4,
  },
  {
    id: 'turbochip',
    name: 'TurboChip Ltd',
    objective: { type: 'win' },
    payout: 1_000_000,
    duration: 24,
  },
  {
    id: 'gridforce',
    name: 'GridForce',
    objective: { type: 'qualify-top', position: 3 },
    payout: 300_000,
    duration: 3,
  },
  {
    id: 'nitro-labs',
    name: 'Nitro Labs',
    objective: { type: 'finish-top', position: 3 },
    payout: 500_000,
    duration: 4,
  },
  {
    id: 'circuit-co',
    name: 'Circuit Co.',
    objective: { type: 'both-finish' },
    payout: 100_000,
    duration: 10,
  },
  {
    id: 'apex-dynamics',
    name: 'Apex Dynamics',
    objective: { type: 'finish-top', position: 7 },
    payout: 250_000,
    duration: 6,
  },
  {
    id: 'velocity-io',
    name: 'Velocity.io',
    objective: { type: 'qualify-top', position: 5 },
    payout: 200_000,
    duration: 5,
  },
  {
    id: 'turbo-drink',
    name: 'Turbo Drink',
    objective: { type: 'score-sprint-points' },
    payout: 150_000,
    duration: 6,
  },
  {
    id: 'datastream',
    name: 'DataStream',
    objective: { type: 'finish-top', position: 15 },
    payout: 100_000,
    duration: 10,
  },
]
```

**Step 4: Run build to verify**

Run: `pnpm build 2>&1 | head -5`
Expected: PASS

**Step 5: Commit**

```bash
git add src/data/calendar.ts src/data/rdTree.ts src/data/sponsors.ts
git commit -m "feat: add calendar, R&D tree, and sponsor pool data"
```

---

### Task 5: Season Engine — Pure Logic Functions with TDD

**Files:**
- Create: `src/engine/seasonEngine.ts`
- Create: `src/engine/__tests__/seasonEngine.test.ts`

**Step 1: Write the failing tests**

```typescript
// src/engine/__tests__/seasonEngine.test.ts
import { describe, it, expect } from 'vitest'
import {
  getModifiedTeamStats,
  getComponentDNFChance,
  calculateRacePoints,
  calculateSprintPoints,
  checkSponsorObjective,
  applyComponentWear,
  getTrackTypeModifiers,
} from '../seasonEngine'
import type { Team, RDUpgrades, ComponentState, Sponsor } from '../../data/types'

const baseTeam: Team = {
  id: 'test',
  name: 'Test',
  engine: 'Test',
  primaryColor: '#fff',
  accentColor: '#000',
  topSpeed: 90,
  cornering: 85,
  reliability: 80,
}

const emptyUpgrades: RDUpgrades = {
  motor: { base: false, branch: null },
  aero: { base: false, branch: null },
  chasis: { base: false, branch: null },
  pitcrew: { base: false, branch: null },
}

describe('getModifiedTeamStats', () => {
  it('returns unmodified stats with no upgrades', () => {
    const result = getModifiedTeamStats(baseTeam, emptyUpgrades)
    expect(result.topSpeed).toBe(90)
    expect(result.cornering).toBe(85)
  })

  it('applies motor base upgrade', () => {
    const upgrades: RDUpgrades = {
      ...emptyUpgrades,
      motor: { base: true, branch: null },
    }
    const result = getModifiedTeamStats(baseTeam, upgrades)
    expect(result.topSpeed).toBe(92)
  })

  it('applies motor base + Raw Power branch', () => {
    const upgrades: RDUpgrades = {
      ...emptyUpgrades,
      motor: { base: true, branch: 'a' },
    }
    const result = getModifiedTeamStats(baseTeam, upgrades)
    expect(result.topSpeed).toBe(95) // +2 base +3 branch
  })

  it('applies aero High Downforce branch', () => {
    const upgrades: RDUpgrades = {
      ...emptyUpgrades,
      aero: { base: true, branch: 'a' },
    }
    const result = getModifiedTeamStats(baseTeam, upgrades)
    expect(result.cornering).toBe(90) // +2 base +3 branch
    expect(result.topSpeed).toBe(89) // -1 from High Downforce
  })
})

describe('getComponentDNFChance', () => {
  it('returns 0 for healthy components', () => {
    const components: ComponentState[] = [
      { type: 'engine', healthPercent: 80, racesUsed: 5 },
      { type: 'gearbox', healthPercent: 60, racesUsed: 5 },
      { type: 'energy-recovery', healthPercent: 70, racesUsed: 5 },
    ]
    expect(getComponentDNFChance(components)).toBe(0)
  })

  it('returns high chance for component below critical threshold', () => {
    const components: ComponentState[] = [
      { type: 'engine', healthPercent: 15, racesUsed: 20 },
      { type: 'gearbox', healthPercent: 60, racesUsed: 5 },
      { type: 'energy-recovery', healthPercent: 70, racesUsed: 5 },
    ]
    expect(getComponentDNFChance(components)).toBeGreaterThan(0.2)
  })

  it('returns 1 for component at 0%', () => {
    const components: ComponentState[] = [
      { type: 'engine', healthPercent: 0, racesUsed: 25 },
      { type: 'gearbox', healthPercent: 60, racesUsed: 5 },
      { type: 'energy-recovery', healthPercent: 70, racesUsed: 5 },
    ]
    expect(getComponentDNFChance(components)).toBe(1)
  })
})

describe('calculateRacePoints', () => {
  it('awards 25 points for P1', () => {
    expect(calculateRacePoints(1)).toBe(25)
  })
  it('awards 1 point for P10', () => {
    expect(calculateRacePoints(10)).toBe(1)
  })
  it('awards 0 points for P11+', () => {
    expect(calculateRacePoints(11)).toBe(0)
  })
})

describe('calculateSprintPoints', () => {
  it('awards 8 points for P1', () => {
    expect(calculateSprintPoints(1)).toBe(8)
  })
  it('awards 1 point for P8', () => {
    expect(calculateSprintPoints(8)).toBe(1)
  })
  it('awards 0 for P9+', () => {
    expect(calculateSprintPoints(9)).toBe(0)
  })
})

describe('checkSponsorObjective', () => {
  it('checks finish-top objective', () => {
    const sponsor: Sponsor = {
      id: 'test',
      name: 'Test',
      objective: { type: 'finish-top', position: 10 },
      payout: 200_000,
      duration: 5,
      racesRemaining: 3,
    }
    expect(checkSponsorObjective(sponsor, { bestFinish: 8 })).toBe(true)
    expect(checkSponsorObjective(sponsor, { bestFinish: 12 })).toBe(false)
  })

  it('checks both-finish objective', () => {
    const sponsor: Sponsor = {
      id: 'test',
      name: 'Test',
      objective: { type: 'both-finish' },
      payout: 150_000,
      duration: 5,
      racesRemaining: 3,
    }
    expect(checkSponsorObjective(sponsor, { bothFinished: true })).toBe(true)
    expect(checkSponsorObjective(sponsor, { bothFinished: false })).toBe(false)
  })
})

describe('applyComponentWear', () => {
  it('reduces health based on wear range', () => {
    const components: ComponentState[] = [
      { type: 'engine', healthPercent: 100, racesUsed: 0 },
      { type: 'gearbox', healthPercent: 100, racesUsed: 0 },
      { type: 'energy-recovery', healthPercent: 100, racesUsed: 0 },
    ]
    const result = applyComponentWear(components, 'race')
    expect(result[0].healthPercent).toBeLessThan(100)
    expect(result[0].healthPercent).toBeGreaterThan(90)
    expect(result[0].racesUsed).toBe(1)
  })
})

describe('getTrackTypeModifiers', () => {
  it('returns neutral for balanced tracks', () => {
    const mods = getTrackTypeModifiers('balanced')
    expect(mods.incidentMultiplier).toBe(1.0)
    expect(mods.topSpeedWeight).toBe(1.0)
  })

  it('returns high incident chance for street tracks', () => {
    const mods = getTrackTypeModifiers('street')
    expect(mods.incidentMultiplier).toBe(1.5)
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/engine/__tests__/seasonEngine.test.ts 2>&1 | tail -10`
Expected: FAIL — module not found

**Step 3: Implement the season engine**

```typescript
// src/engine/seasonEngine.ts
import type {
  Team,
  RDUpgrades,
  ComponentState,
  ComponentType,
  Sponsor,
  TrackType,
  RDArea,
} from '../data/types'
import { rdTree } from '../data/rdTree'
import { randomBetween } from '../utils/random'

// --- R&D ---

export function getModifiedTeamStats(
  team: Team,
  upgrades: RDUpgrades,
): { topSpeed: number; cornering: number; tireLifeBonus: number; pitTimeBonus: number; fuelConsumptionMod: number; engineWearMod: number; pitErrorMod: number } {
  let topSpeed = team.topSpeed
  let cornering = team.cornering
  let tireLifeBonus = 0
  let pitTimeBonus = 0
  let fuelConsumptionMod = 0
  let engineWearMod = 0
  let pitErrorMod = 0

  for (const area of ['motor', 'aero', 'chasis', 'pitcrew'] as RDArea[]) {
    const upgrade = upgrades[area]
    const tree = rdTree[area]

    if (upgrade.base) {
      const effects = tree.base.effects
      topSpeed += effects.topSpeed ?? 0
      cornering += effects.cornering ?? 0
      tireLifeBonus += effects.tireLife ?? 0
      pitTimeBonus += effects.pitTime ?? 0
      fuelConsumptionMod += effects.fuelConsumption ?? 0
      engineWearMod += effects.engineWear ?? 0
      pitErrorMod += effects.pitErrorChance ?? 0
    }

    if (upgrade.branch !== null) {
      const branchNode = upgrade.branch === 'a' ? tree.branches[0] : tree.branches[1]
      const effects = branchNode.effects
      topSpeed += effects.topSpeed ?? 0
      cornering += effects.cornering ?? 0
      tireLifeBonus += effects.tireLife ?? 0
      pitTimeBonus += effects.pitTime ?? 0
      fuelConsumptionMod += effects.fuelConsumption ?? 0
      engineWearMod += effects.engineWear ?? 0
      pitErrorMod += effects.pitErrorChance ?? 0
    }
  }

  return { topSpeed, cornering, tireLifeBonus, pitTimeBonus, fuelConsumptionMod, engineWearMod, pitErrorMod }
}

// --- Components ---

const CRITICAL_THRESHOLDS: Record<ComponentType, number> = {
  engine: 20,
  gearbox: 15,
  'energy-recovery': 15,
}

const WEAR_RANGES: Record<ComponentType, { race: [number, number]; sprint: [number, number] }> = {
  engine: { race: [3, 5], sprint: [2, 3] },
  gearbox: { race: [2, 4], sprint: [1, 2] },
  'energy-recovery': { race: [2, 3], sprint: [1, 2] },
}

export function getComponentDNFChance(components: ComponentState[]): number {
  let maxChance = 0
  for (const comp of components) {
    if (comp.healthPercent <= 0) return 1
    const threshold = CRITICAL_THRESHOLDS[comp.type]
    if (comp.healthPercent < threshold) {
      const severity = 1 - comp.healthPercent / threshold
      const chance = 0.3 * severity + 0.1
      maxChance = Math.max(maxChance, chance)
    }
  }
  return maxChance
}

export function applyComponentWear(
  components: ComponentState[],
  sessionType: 'race' | 'sprint',
  extraEngineWear: number = 0,
): ComponentState[] {
  return components.map((comp) => {
    const range = WEAR_RANGES[comp.type][sessionType]
    let wear = randomBetween(range[0], range[1])
    if (comp.type === 'engine') {
      wear += extraEngineWear
    }
    return {
      ...comp,
      healthPercent: Math.max(0, comp.healthPercent - wear),
      racesUsed: comp.racesUsed + 1,
    }
  })
}

export function replaceComponent(
  components: ComponentState[],
  type: ComponentType,
): ComponentState[] {
  return components.map((comp) =>
    comp.type === type ? { ...comp, healthPercent: 100, racesUsed: 0 } : comp,
  )
}

export const COMPONENT_REPLACEMENT_COSTS: Record<ComponentType, number> = {
  engine: 1_500_000,
  gearbox: 800_000,
  'energy-recovery': 600_000,
}

// --- Points ---

const RACE_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]
const SPRINT_POINTS = [8, 7, 6, 5, 4, 3, 2, 1]

export function calculateRacePoints(position: number): number {
  return position >= 1 && position <= 10 ? RACE_POINTS[position - 1] : 0
}

export function calculateSprintPoints(position: number): number {
  return position >= 1 && position <= 8 ? SPRINT_POINTS[position - 1] : 0
}

// --- Prize Money ---

const RACE_PRIZE_MONEY = [500_000, 350_000, 250_000, 200_000, 150_000, 120_000, 100_000, 80_000, 60_000, 50_000]
const SPRINT_PRIZE_MONEY = [100_000, 70_000, 50_000, 40_000, 30_000, 20_000, 15_000, 10_000]

export function calculateRacePrizeMoney(position: number): number {
  return position >= 1 && position <= 10 ? RACE_PRIZE_MONEY[position - 1] : 0
}

export function calculateSprintPrizeMoney(position: number): number {
  return position >= 1 && position <= 8 ? SPRINT_PRIZE_MONEY[position - 1] : 0
}

// --- Sponsors ---

interface RaceOutcome {
  bestFinish?: number
  bothFinished?: boolean
  won?: boolean
  bestQualifying?: number
  scoredSprintPoints?: boolean
}

export function checkSponsorObjective(sponsor: Sponsor, outcome: RaceOutcome): boolean {
  switch (sponsor.objective.type) {
    case 'finish-top':
      return (outcome.bestFinish ?? 99) <= sponsor.objective.position
    case 'both-finish':
      return outcome.bothFinished ?? false
    case 'win':
      return outcome.won ?? false
    case 'qualify-top':
      return (outcome.bestQualifying ?? 99) <= sponsor.objective.position
    case 'score-sprint-points':
      return outcome.scoredSprintPoints ?? false
  }
}

// --- Track Type ---

interface TrackTypeModifiers {
  incidentMultiplier: number
  topSpeedWeight: number
  corneringWeight: number
}

export function getTrackTypeModifiers(type: TrackType): TrackTypeModifiers {
  switch (type) {
    case 'street':
      return { incidentMultiplier: 1.5, topSpeedWeight: 0.8, corneringWeight: 1.2 }
    case 'high-speed':
      return { incidentMultiplier: 0.9, topSpeedWeight: 1.3, corneringWeight: 0.8 }
    case 'technical':
      return { incidentMultiplier: 1.1, topSpeedWeight: 0.8, corneringWeight: 1.3 }
    case 'balanced':
    default:
      return { incidentMultiplier: 1.0, topSpeedWeight: 1.0, corneringWeight: 1.0 }
  }
}

// --- RP ---

const RP_BY_POSITION = [15, 12, 10, 8, 7, 6, 5, 4, 3, 2]

export function calculateRP(racePosition: number, practiceDataPercent: number): number {
  const positionRP = racePosition >= 1 && racePosition <= 10 ? RP_BY_POSITION[racePosition - 1] : 1
  const practiceBonus = practiceDataPercent >= 100 ? 5 : 0
  return positionRP + practiceBonus
}

// --- Race Entry ---

export const RACE_ENTRY_FEE = 100_000
```

**Step 4: Run tests to verify they pass**

Run: `pnpm vitest run src/engine/__tests__/seasonEngine.test.ts 2>&1 | tail -15`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/engine/seasonEngine.ts src/engine/__tests__/seasonEngine.test.ts
git commit -m "feat: season engine — R&D stats, components, points, sponsors, track types"
```

---

### Task 6: Create Season Store

**Files:**
- Create: `src/stores/seasonStore.ts`

**Step 1: Create the season store**

```typescript
// src/stores/seasonStore.ts
import { create } from 'zustand'
import type {
  RDUpgrades,
  RDArea,
  RDBranch,
  ComponentState,
  ComponentType,
  Sponsor,
  DriverStanding,
  TeamStanding,
} from '../data/types'
import { drivers } from '../data/drivers'
import { teams } from '../data/teams'
import { calendar } from '../data/calendar'
import { sponsorPool } from '../data/sponsors'
import { replaceComponent, COMPONENT_REPLACEMENT_COSTS } from '../engine/seasonEngine'

interface SeasonState {
  // Is season active?
  seasonActive: boolean

  // Calendar
  currentRaceIndex: number

  // Championship
  driverStandings: DriverStanding[]
  teamStandings: TeamStanding[]

  // Economy
  budget: number
  researchPoints: number

  // R&D
  rdUpgrades: RDUpgrades

  // Components
  components: ComponentState[]

  // Sponsors
  activeSponsors: Sponsor[]
  availableSponsors: Sponsor[]

  // Actions
  startSeason: () => void
  advanceToNextRace: () => void

  // R&D actions
  purchaseBaseUpgrade: (area: RDArea) => boolean
  purchaseBranchUpgrade: (area: RDArea, branch: RDBranch) => boolean

  // Component actions
  replaceComponentAction: (type: ComponentType) => boolean
  setComponents: (components: ComponentState[]) => void

  // Sponsor actions
  signSponsor: (sponsorId: string) => boolean
  dropSponsor: (sponsorId: string) => void
  refreshAvailableSponsors: () => void

  // Results
  addRaceResults: (results: {
    driverPositions: { driverId: string; position: number; dnf: boolean }[]
    prizeMoney: number
    sponsorPayouts: number
    rp: number
  }) => void

  // Reset
  reset: () => void
}

const INITIAL_BUDGET = 10_000_000
const MAX_ACTIVE_SPONSORS = 3
const AVAILABLE_SPONSOR_COUNT = 4

function createInitialStandings() {
  const driverStandings: DriverStanding[] = drivers.map((d) => ({
    driverId: d.id,
    points: 0,
    positions: [],
  }))
  const teamStandings: TeamStanding[] = teams.map((t) => ({
    teamId: t.id,
    points: 0,
  }))
  return { driverStandings, teamStandings }
}

function createInitialComponents(): ComponentState[] {
  return [
    { type: 'engine', healthPercent: 100, racesUsed: 0 },
    { type: 'gearbox', healthPercent: 100, racesUsed: 0 },
    { type: 'energy-recovery', healthPercent: 100, racesUsed: 0 },
  ]
}

const emptyUpgrades: RDUpgrades = {
  motor: { base: false, branch: null },
  aero: { base: false, branch: null },
  chasis: { base: false, branch: null },
  pitcrew: { base: false, branch: null },
}

function pickRandomSponsors(exclude: string[], count: number): Sponsor[] {
  const available = sponsorPool.filter((s) => !exclude.includes(s.id))
  const shuffled = [...available].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count).map((s) => ({
    ...s,
    racesRemaining: s.duration,
  }))
}

export const useSeasonStore = create<SeasonState>((set, get) => ({
  seasonActive: false,
  currentRaceIndex: 0,
  ...createInitialStandings(),
  budget: INITIAL_BUDGET,
  researchPoints: 0,
  rdUpgrades: { ...emptyUpgrades },
  components: createInitialComponents(),
  activeSponsors: [],
  availableSponsors: [],

  startSeason: () => {
    const { driverStandings, teamStandings } = createInitialStandings()
    const availableSponsors = pickRandomSponsors([], AVAILABLE_SPONSOR_COUNT)
    set({
      seasonActive: true,
      currentRaceIndex: 0,
      driverStandings,
      teamStandings,
      budget: INITIAL_BUDGET,
      researchPoints: 0,
      rdUpgrades: { ...emptyUpgrades },
      components: createInitialComponents(),
      activeSponsors: [],
      availableSponsors,
    })
  },

  advanceToNextRace: () => {
    const state = get()
    const nextIndex = state.currentRaceIndex + 1
    if (nextIndex >= calendar.length) return
    // Decrement sponsor durations, remove expired
    const updatedSponsors = state.activeSponsors
      .map((s) => ({ ...s, racesRemaining: s.racesRemaining - 1 }))
      .filter((s) => s.racesRemaining > 0)
    const excludeIds = updatedSponsors.map((s) => s.id)
    const newAvailable = pickRandomSponsors(excludeIds, AVAILABLE_SPONSOR_COUNT)
    set({
      currentRaceIndex: nextIndex,
      activeSponsors: updatedSponsors,
      availableSponsors: newAvailable,
    })
  },

  purchaseBaseUpgrade: (area) => {
    const state = get()
    const tree = (await import('../data/rdTree')).rdTree
    // Inline import avoided — use static import via seasonEngine
    // We'll use the rdTree data directly
    const { rdTree: rdTreeData } = require('../data/rdTree')
    const node = rdTreeData[area].base
    if (state.rdUpgrades[area].base) return false
    if (state.budget < node.costMoney || state.researchPoints < node.costRP) return false
    set({
      budget: state.budget - node.costMoney,
      researchPoints: state.researchPoints - node.costRP,
      rdUpgrades: {
        ...state.rdUpgrades,
        [area]: { ...state.rdUpgrades[area], base: true },
      },
    })
    return true
  },

  purchaseBranchUpgrade: (area, branch) => {
    const state = get()
    if (!state.rdUpgrades[area].base) return false
    if (state.rdUpgrades[area].branch !== null) return false
    const { rdTree: rdTreeData } = require('../data/rdTree')
    const node = branch === 'a' ? rdTreeData[area].branches[0] : rdTreeData[area].branches[1]
    if (state.budget < node.costMoney || state.researchPoints < node.costRP) return false
    set({
      budget: state.budget - node.costMoney,
      researchPoints: state.researchPoints - node.costRP,
      rdUpgrades: {
        ...state.rdUpgrades,
        [area]: { ...state.rdUpgrades[area], branch },
      },
    })
    return true
  },

  replaceComponentAction: (type) => {
    const state = get()
    const cost = COMPONENT_REPLACEMENT_COSTS[type]
    if (state.budget < cost) return false
    set({
      budget: state.budget - cost,
      components: replaceComponent(state.components, type),
    })
    return true
  },

  setComponents: (components) => set({ components }),

  signSponsor: (sponsorId) => {
    const state = get()
    if (state.activeSponsors.length >= MAX_ACTIVE_SPONSORS) return false
    const sponsor = state.availableSponsors.find((s) => s.id === sponsorId)
    if (!sponsor) return false
    set({
      activeSponsors: [...state.activeSponsors, sponsor],
      availableSponsors: state.availableSponsors.filter((s) => s.id !== sponsorId),
    })
    return true
  },

  dropSponsor: (sponsorId) => {
    set((state) => ({
      activeSponsors: state.activeSponsors.filter((s) => s.id !== sponsorId),
    }))
  },

  refreshAvailableSponsors: () => {
    const state = get()
    const excludeIds = state.activeSponsors.map((s) => s.id)
    set({ availableSponsors: pickRandomSponsors(excludeIds, AVAILABLE_SPONSOR_COUNT) })
  },

  addRaceResults: ({ driverPositions, prizeMoney, sponsorPayouts, rp }) => {
    const state = get()
    // Update driver standings
    const driverStandings = state.driverStandings.map((ds) => {
      const result = driverPositions.find((p) => p.driverId === ds.driverId)
      if (!result || result.dnf) return { ...ds, positions: [...ds.positions, 0] }
      return ds
    })

    // Update team standings (sum of both driver points per team)
    const teamStandings = [...state.teamStandings]

    // Update budget
    const entryFee = 100_000
    const newBudget = state.budget - entryFee + prizeMoney + sponsorPayouts

    set({
      driverStandings,
      teamStandings,
      budget: newBudget,
      researchPoints: state.researchPoints + rp,
    })
  },

  reset: () => {
    const { driverStandings, teamStandings } = createInitialStandings()
    set({
      seasonActive: false,
      currentRaceIndex: 0,
      driverStandings,
      teamStandings,
      budget: INITIAL_BUDGET,
      researchPoints: 0,
      rdUpgrades: { ...emptyUpgrades },
      components: createInitialComponents(),
      activeSponsors: [],
      availableSponsors: [],
    })
  },
}))
```

**Important note for implementer:** The `purchaseBaseUpgrade` and `purchaseBranchUpgrade` actions use `require()` which won't work in Vite/ESM. Replace those with a top-level static import of `rdTree` from `'../data/rdTree'` and reference it directly. The code above is a sketch — use `import { rdTree } from '../data/rdTree'` at the top of the file and reference `rdTree[area].base` etc.

**Step 2: Run build to verify**

Run: `pnpm build 2>&1 | head -10`
Expected: PASS

**Step 3: Commit**

```bash
git add src/stores/seasonStore.ts
git commit -m "feat: season store — budget, R&D, components, sponsors, standings"
```

---

### Task 7: Update Weekend Store and App Router

**Files:**
- Modify: `src/stores/weekendStore.ts`
- Modify: `src/App.tsx`

**Step 1: Add 'hq' and 'season-end' to Phase type**

In `src/stores/weekendStore.ts`, change the Phase type:

```typescript
export type Phase = 'team-select' | 'hq' | 'practice' | 'qualifying' | 'strategy' | 'race' | 'results' | 'season-end'
```

Add a `currentTrackId` field so the weekend knows which track to use:

```typescript
interface WeekendState {
  phase: Phase
  selectedTeamId: string | null
  selectedDriverId: string | null
  currentTrackId: string | null
  weather: WeatherCondition
  practiceData: { dataCollected: number; revealedCompounds: string[] }
  qualifyingGrid: { driverId: string; position: number; time: number }[]
  isSprint: boolean

  setPhase: (phase: Phase) => void
  selectTeam: (teamId: string, driverId: string) => void
  setCurrentTrack: (trackId: string, isSprint: boolean) => void
  setPracticeData: (data: { dataCollected: number; revealedCompounds: string[] }) => void
  setQualifyingGrid: (grid: { driverId: string; position: number; time: number }[]) => void
  resetWeekend: () => void
  reset: () => void
}
```

Add the `setCurrentTrack` action and `resetWeekend` (resets weekend state but keeps team selection).

**Step 2: Update App.tsx router**

Add imports for HQ and SeasonEnd screens (create placeholder components for now). Add `'hq'` and `'season-end'` cases to the switch. The `'results'` phase should now redirect to HQ or season-end instead of showing Race.

```typescript
// In App.tsx, add cases:
case 'hq':
  return <HQ />
case 'season-end':
  return <SeasonEnd />
```

**Step 3: Run build to verify**

Run: `pnpm build 2>&1 | head -10`
Expected: PASS (with placeholder HQ and SeasonEnd components)

**Step 4: Commit**

```bash
git add src/stores/weekendStore.ts src/App.tsx
git commit -m "feat: add hq and season-end phases to game flow"
```

---

### Task 8: Update Incident Engine for Component DNF Chance

**Files:**
- Modify: `src/engine/incidentEngine.ts`

**Step 1: Add optional `extraDNFChance` parameter**

Update `checkForIncident` to accept an optional `extraDNFChance` from component wear:

```typescript
export function checkForIncident(params: {
  aggression: number
  reliability: number
  extraDNFChance?: number
}): IncidentResult {
  // First check component-based DNF
  if (params.extraDNFChance && params.extraDNFChance > 0) {
    if (randomChance(params.extraDNFChance / 53)) { // spread chance over ~53 laps
      return { type: 'mechanical', timeLost: 0, dnf: true }
    }
  }

  // Existing incident logic unchanged
  const baseChance = 0.002
  const modifier = 1 + params.aggression * 0.005 - params.reliability * 0.003
  const chance = baseChance * Math.max(0.1, modifier)
  if (!randomChance(chance)) return { type: 'none', timeLost: 0, dnf: false }
  const roll = Math.random()
  if (roll < 0.5) return { type: 'spin', timeLost: randomBetween(3, 7), dnf: false }
  if (roll < 0.8) return { type: 'mechanical', timeLost: 0, dnf: true }
  return { type: 'collision', timeLost: randomBetween(5, 15), dnf: Math.random() < 0.3 }
}
```

**Step 2: Run existing tests to verify nothing breaks**

Run: `pnpm vitest run src/engine/__tests__/incidentEngine.test.ts 2>&1 | tail -10`
Expected: All existing tests PASS (new param is optional)

**Step 3: Commit**

```bash
git add src/engine/incidentEngine.ts
git commit -m "feat: add component-based DNF chance to incident engine"
```

---

### Task 9: Update Lap Simulator for Track Type Effects

**Files:**
- Modify: `src/engine/lapSimulator.ts`

**Step 1: Add optional trackType parameter and apply modifiers**

Add `trackType` to LapTimeParams as optional. When provided, weight the car's topSpeed/cornering based on track type:

```typescript
import type { TireCompound, WeatherCondition, TrackType } from '../data/types'
import { calculateTireGrip, getWeatherGripMultiplier } from './tireModel'
import { randomBetween } from '../utils/random'
import { getTrackTypeModifiers } from './seasonEngine'

interface LapTimeParams {
  car: { topSpeed: number; cornering: number }
  driver: { speed: number; tireManagement: number }
  tireCompound: TireCompound
  lapsOnTire: number
  fuelLoad: number
  weather: WeatherCondition
  baseLapTime: number
  trackType?: TrackType
}

export function calculateLapTime(params: LapTimeParams): number {
  const { car, driver, tireCompound, lapsOnTire, fuelLoad, weather, baseLapTime, trackType } = params

  let effectiveTopSpeed = car.topSpeed
  let effectiveCornering = car.cornering

  if (trackType) {
    const mods = getTrackTypeModifiers(trackType)
    effectiveTopSpeed = car.topSpeed * mods.topSpeedWeight
    effectiveCornering = car.cornering * mods.corneringWeight
  }

  const carFactor = 1 - effectiveTopSpeed * 0.002
  const driverFactor = 1 - driver.speed * 0.001
  const fuelFactor = 1 + fuelLoad * 0.03
  const tireGrip = calculateTireGrip(tireCompound, lapsOnTire, driver.tireManagement)
  const tireFactor = 1 + (tireGrip - 1) * 4
  const weatherFactor = getWeatherGripMultiplier(tireCompound, weather)
  const noise = randomBetween(-0.3, 0.3)
  return baseLapTime * carFactor * driverFactor * fuelFactor * tireFactor * weatherFactor + noise
}
```

**Step 2: Run existing tests**

Run: `pnpm vitest run src/engine/__tests__/lapSimulator.test.ts 2>&1 | tail -10`
Expected: All PASS (trackType is optional)

**Step 3: Commit**

```bash
git add src/engine/lapSimulator.ts
git commit -m "feat: add track type modifiers to lap time calculation"
```

---

### Task 10: HQ Screen — Shell with Tabs

**Files:**
- Create: `src/screens/HQ.tsx`

**Step 1: Create HQ screen with 5 tabs and header**

Build the main HQ shell with tabs: R&D, Components, Sponsors, Standings, Next Race. Each tab renders a placeholder initially. The header shows: current race round, budget, RP, WDC position.

The tab content components (RDTab, ComponentsTab, SponsorsTab, StandingsTab, NextRaceTab) should be inline in this file or in sub-components. For manageability, define them as local components in the same file.

Use the existing pixel-tech styling: `font-pixel`, `bg-f1-bg`, `text-f1-accent`, `border-f1-border`, etc.

Include the "START RACE WEEKEND →" `PixelButton` at the bottom that calls `weekendStore.setPhase('practice')` and sets the current track from the calendar.

**Step 2: Run build**

Run: `pnpm build 2>&1 | head -10`
Expected: PASS

**Step 3: Commit**

```bash
git add src/screens/HQ.tsx
git commit -m "feat: HQ screen shell with tab navigation and header"
```

---

### Task 11: HQ — R&D Tab

**Files:**
- Modify: `src/screens/HQ.tsx`

**Step 1: Implement R&D tab content**

Build the R&D tree visualization inside the HQ screen. Show 4 areas (Motor, Aero, Chasis, Pit Crew) each with:
- Base node (locked/unlocked)
- Two branch options (greyed if base not unlocked, one selectable)
- Cost display (RP + money)
- Effect description
- "RESEARCH" button that calls `seasonStore.purchaseBaseUpgrade(area)` or `purchaseBranchUpgrade(area, branch)`
- Visual indicators: green border for unlocked, grey for locked, cyan for available to purchase

**Step 2: Run build and test visually**

Run: `pnpm build 2>&1 | head -5`

**Step 3: Commit**

```bash
git add src/screens/HQ.tsx
git commit -m "feat: HQ R&D tab — branching upgrade tree with purchase flow"
```

---

### Task 12: HQ — Components Tab

**Files:**
- Modify: `src/screens/HQ.tsx`

**Step 1: Implement Components tab**

Show 3 component cards (Engine, Gearbox, Energy Recovery) each with:
- Health bar (green >50%, yellow 20-50%, red <20%)
- Health percentage text
- Races used count
- "REPLACE" button with cost, calls `seasonStore.replaceComponentAction(type)`
- Disable button if budget insufficient
- Show warning text below critical threshold

**Step 2: Run build**

Run: `pnpm build 2>&1 | head -5`

**Step 3: Commit**

```bash
git add src/screens/HQ.tsx
git commit -m "feat: HQ components tab — health bars and replacement"
```

---

### Task 13: HQ — Sponsors Tab

**Files:**
- Modify: `src/screens/HQ.tsx`

**Step 1: Implement Sponsors tab**

Two sections:
1. **Active Sponsors** (up to 3 slots): Show name, objective description, payout, races remaining. "DROP" button per sponsor.
2. **Available Sponsors** (3-4 cards): Show name, objective, payout, duration. "SIGN" button. Disabled if 3 already active.

Format objective descriptions as human-readable text:
- `finish-top: 10` → "Finish in Top 10"
- `both-finish` → "Both drivers finish the race"
- `win` → "Win a race"
- `qualify-top: 3` → "Qualify in Top 3"
- `score-sprint-points` → "Score points in a Sprint"

**Step 2: Run build**

Run: `pnpm build 2>&1 | head -5`

**Step 3: Commit**

```bash
git add src/screens/HQ.tsx
git commit -m "feat: HQ sponsors tab — sign, drop, and manage sponsors"
```

---

### Task 14: HQ — Standings Tab

**Files:**
- Modify: `src/screens/HQ.tsx`

**Step 1: Implement Standings tab**

Two sub-views toggled by buttons: "DRIVERS" and "CONSTRUCTORS".

**Drivers Championship**: Table with position, driver shortName, team color bar, points. Player's drivers highlighted with accent border. Sorted by points descending.

**Constructors Championship**: Table with position, team name, team color bar, total points. Player's team highlighted.

**Step 2: Run build**

Run: `pnpm build 2>&1 | head -5`

**Step 3: Commit**

```bash
git add src/screens/HQ.tsx
git commit -m "feat: HQ standings tab — drivers and constructors championships"
```

---

### Task 15: HQ — Next Race Tab

**Files:**
- Modify: `src/screens/HQ.tsx`

**Step 1: Implement Next Race tab**

Show a card with:
- Round number and GP name from calendar
- Circuit name, country
- Track stats: laps, type badge, tire wear level, overtaking difficulty
- Sprint badge if applicable
- Weather forecast (randomly generated and stored)
- "START RACE WEEKEND →" PixelButton

When button is clicked:
1. Set `weekendStore.currentTrackId` to the track ID
2. Set `weekendStore.isSprint` from track data
3. Deduct race entry fee ($100K) from budget
4. Set `weekendStore.setPhase('practice')`

**Step 2: Run build**

Run: `pnpm build 2>&1 | head -5`

**Step 3: Commit**

```bash
git add src/screens/HQ.tsx
git commit -m "feat: HQ next race tab — track info and race launch"
```

---

### Task 16: Season End Screen

**Files:**
- Create: `src/screens/SeasonEnd.tsx`

**Step 1: Build Season End screen**

Show:
- "SEASON COMPLETE" header
- Final Drivers Championship top 10 with full table
- Final Constructors Championship top 10
- Player's final positions highlighted
- Season stats summary: total races, total prize money earned, R&D upgrades purchased
- "NEW SEASON" button that resets season store and goes back to team-select

**Step 2: Run build**

Run: `pnpm build 2>&1 | head -5`

**Step 3: Commit**

```bash
git add src/screens/SeasonEnd.tsx
git commit -m "feat: season end screen — championship results and new season"
```

---

### Task 17: Integration — Connect Race Results to Season

**Files:**
- Modify: `src/screens/Race.tsx`

**Step 1: Update Race.tsx to use track from weekendStore**

Replace `const track = tracks[0]` with reading `currentTrackId` from weekendStore and finding the track in the tracks array.

**Step 2: Update race initialization to use R&D-modified team stats**

Import `useSeasonStore` and `getModifiedTeamStats`. Before creating initial race state, modify team stats based on R&D upgrades. Pass modified teams to `createInitialRaceState`.

**Step 3: Feed component DNF chance into race simulation**

Import `getComponentDNFChance` from seasonEngine. Pass `extraDNFChance` to `checkForIncident` calls in the race simulator for the player's team cars.

**Step 4: Update "RACE COMPLETE" flow**

After race finishes, instead of "RACE AGAIN" button:
1. Calculate points for all drivers using `calculateRacePoints`
2. Calculate prize money for player
3. Check sponsor objectives
4. Apply component wear using `applyComponentWear`
5. Add RP from `calculateRP`
6. Call `seasonStore.addRaceResults(...)` with all data
7. Update driver/team standings in season store
8. Show "CONTINUE TO HQ" button that navigates to `'hq'` phase
9. If last race (round 24), navigate to `'season-end'` instead

**Step 5: Run build and tests**

Run: `pnpm build 2>&1 | head -10`
Run: `pnpm test 2>&1 | tail -15`

**Step 6: Commit**

```bash
git add src/screens/Race.tsx
git commit -m "feat: connect race results to season — points, money, wear, standings"
```

---

### Task 18: Integration — Update Practice and Qualifying for Current Track

**Files:**
- Modify: `src/screens/Practice.tsx`
- Modify: `src/screens/Qualifying.tsx`

**Step 1: Update Practice to show current track name**

Replace `const track = tracks[0]` with reading `currentTrackId` from weekendStore and finding the matching track.

**Step 2: Update Qualifying to use current track**

Same change — read track from weekendStore instead of hardcoded `tracks[0]`.

**Step 3: Update qualifying simulator calls to pass current track**

Ensure all `simulateQualifying` calls use the current track from the weekend store.

**Step 4: Run build and tests**

Run: `pnpm build 2>&1 | head -5`
Run: `pnpm test 2>&1 | tail -15`

**Step 5: Commit**

```bash
git add src/screens/Practice.tsx src/screens/Qualifying.tsx
git commit -m "feat: practice and qualifying use current track from season calendar"
```

---

### Task 19: Sprint Weekend Support

**Files:**
- Create: `src/screens/SprintShootout.tsx`
- Create: `src/screens/SprintRace.tsx`
- Modify: `src/stores/weekendStore.ts`
- Modify: `src/App.tsx`

**Step 1: Add sprint phases to weekendStore**

Add `'sprint-shootout'` and `'sprint-race'` to the Phase type. Add `sprintGrid` to state.

```typescript
export type Phase = 'team-select' | 'hq' | 'practice' | 'qualifying' | 'sprint-shootout' | 'sprint-race' | 'strategy' | 'race' | 'results' | 'season-end'
```

**Step 2: Create Sprint Shootout screen**

Similar to Qualifying but with SQ1/SQ2/SQ3 format. Shorter sessions. Sets `sprintGrid` in weekendStore. After completion, transitions to `'sprint-race'` phase.

Sprint weekend flow: `FP1 → Q1/Q2/Q3 → Sprint Shootout → Sprint Race → Strategy → Race`

Note: Sprint weekends skip FP2 and FP3 — only FP1. Update Practice screen to detect `isSprint` from weekendStore and only run FP1 when true.

**Step 3: Create Sprint Race screen**

A shorter race (~1/3 of total laps, no mandatory pit stop). Uses the `sprintGrid` for starting positions. Awards sprint points. After completion, apply component wear (sprint level) and add sprint points to standings, then transition to `'strategy'` phase.

**Step 4: Update App.tsx router**

Add cases for `'sprint-shootout'` and `'sprint-race'`.

**Step 5: Update Practice screen for sprint weekends**

When `weekendStore.isSprint` is true, only show FP1 (skip FP2/FP3). After FP1, transition to `'qualifying'` directly.

**Step 6: Update Qualifying screen for sprint weekends**

After qualifying completes in a sprint weekend, transition to `'sprint-shootout'` instead of `'strategy'`.

**Step 7: Run build and tests**

Run: `pnpm build 2>&1 | head -10`
Run: `pnpm test 2>&1 | tail -15`

**Step 8: Commit**

```bash
git add src/screens/SprintShootout.tsx src/screens/SprintRace.tsx src/stores/weekendStore.ts src/App.tsx src/screens/Practice.tsx src/screens/Qualifying.tsx
git commit -m "feat: sprint weekend support — shootout, sprint race, modified practice"
```

---

### Task 20: Team Select → Season Start Flow

**Files:**
- Modify: `src/screens/TeamSelect.tsx`

**Step 1: Update TeamSelect to start a season**

After team selection, instead of going directly to practice:
1. Call `seasonStore.startSeason()` to initialize all season state
2. Navigate to `'hq'` phase (pre-season HQ)
3. The HQ "Next Race" tab will show Round 1 and let the player launch the first race weekend

**Step 2: Run build**

Run: `pnpm build 2>&1 | head -5`

**Step 3: Commit**

```bash
git add src/screens/TeamSelect.tsx
git commit -m "feat: team select starts a full season — navigates to HQ"
```

---

### Task 21: Polish — AI Season Simulation and Edge Cases

**Files:**
- Modify: `src/stores/seasonStore.ts`
- Modify: `src/screens/Race.tsx`
- Modify: `src/screens/HQ.tsx`

**Step 1: Full standings update in addRaceResults**

Ensure `addRaceResults` properly:
- Updates driver points using `calculateRacePoints` for each driver position
- Updates team standings by summing both driver points per team
- Records each driver's race position in the `positions[]` array
- Handles DNF drivers (0 points, position recorded as 0)

**Step 2: Format money display as $X.XM or $XXK**

Create a `formatMoney` utility in `src/utils/formatMoney.ts`:
```typescript
export function formatMoney(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`
  return `$${amount}`
}
```

**Step 3: Add season progress indicator to HQ header**

Show "RACE X/24" with a small progress bar.

**Step 4: Handle budget going negative gracefully**

If budget is negative, show it in red. Disable R&D and component replacement buttons. Show warning text.

**Step 5: Run all tests**

Run: `pnpm test 2>&1 | tail -15`
Run: `pnpm build 2>&1 | head -5`

**Step 6: Commit**

```bash
git add src/stores/seasonStore.ts src/screens/Race.tsx src/screens/HQ.tsx src/utils/formatMoney.ts
git commit -m "feat: polish — full standings updates, money formatting, edge cases"
```

---

## Summary

| Task | Description | New Files | Modified Files |
|------|-------------|-----------|----------------|
| 1 | Update data types | — | types.ts |
| 2 | Add driver numbers | — | drivers.ts |
| 3 | Expand to 25 tracks | — | tracks.ts |
| 4 | Calendar, R&D, sponsors data | calendar.ts, rdTree.ts, sponsors.ts | — |
| 5 | Season engine (TDD) | seasonEngine.ts, seasonEngine.test.ts | — |
| 6 | Season store | seasonStore.ts | — |
| 7 | Weekend store + App router | — | weekendStore.ts, App.tsx |
| 8 | Incident engine component DNF | — | incidentEngine.ts |
| 9 | Lap simulator track types | — | lapSimulator.ts |
| 10 | HQ screen shell + tabs | HQ.tsx | — |
| 11 | HQ R&D tab | — | HQ.tsx |
| 12 | HQ Components tab | — | HQ.tsx |
| 13 | HQ Sponsors tab | — | HQ.tsx |
| 14 | HQ Standings tab | — | HQ.tsx |
| 15 | HQ Next Race tab | — | HQ.tsx |
| 16 | Season End screen | SeasonEnd.tsx | — |
| 17 | Race → Season integration | — | Race.tsx |
| 18 | Practice/Qualifying use current track | — | Practice.tsx, Qualifying.tsx |
| 19 | Sprint weekend support | SprintShootout.tsx, SprintRace.tsx | weekendStore.ts, App.tsx, Practice.tsx, Qualifying.tsx |
| 20 | Team Select → Season flow | — | TeamSelect.tsx |
| 21 | Polish + edge cases | formatMoney.ts | seasonStore.ts, Race.tsx, HQ.tsx |
