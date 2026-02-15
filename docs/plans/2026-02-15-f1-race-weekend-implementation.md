# F1 Race Weekend MVP — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a complete, playable Race Weekend loop (TeamSelect → Practice → Qualifying → Strategy → Race → Results) with 22 cars, dynamic weather, and Safety Car.

**Architecture:** Component-Per-Phase with pure TypeScript simulation engine. Each phase is a screen. Zustand manages state. Timer-based race loop at ~1 lap/second.

**Tech Stack:** React 19, TypeScript, Vite 7, Zustand, Tailwind CSS, Framer Motion, Press Start 2P font.

**Design doc:** `docs/plans/2026-02-15-f1-race-weekend-mvp-design.md`

---

## Task 1: Project Setup — Install Dependencies & Configure Tailwind

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Create: `src/styles/index.css`
- Modify: `src/main.tsx`
- Delete: `src/App.css`, `src/index.css`

**Step 1: Install dependencies**

Run:
```bash
pnpm add zustand framer-motion
pnpm add -D tailwindcss @tailwindcss/vite
```

**Step 2: Configure Tailwind in Vite**

Modify `vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    tailwindcss(),
  ],
})
```

**Step 3: Create global stylesheet**

Create `src/styles/index.css`:
```css
@import "tailwindcss";
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

@theme {
  --font-pixel: 'Press Start 2P', monospace;
  --color-f1-bg: #0f172a;
  --color-f1-border: #334155;
  --color-f1-text: #e2e8f0;
  --color-f1-accent: #06b6d4;
  --color-f1-danger: #ef4444;
  --color-f1-success: #22c55e;
  --color-f1-warning: #eab308;
}

body {
  @apply bg-f1-bg text-f1-text font-pixel text-xs;
  image-rendering: pixelated;
}
```

**Step 4: Update main.tsx to use new stylesheet**

Modify `src/main.tsx` — replace `./index.css` import with `./styles/index.css`.

**Step 5: Delete old CSS files**

Delete `src/App.css` and `src/index.css`.

**Step 6: Verify dev server starts**

Run: `pnpm dev`
Expected: App loads with dark slate background and pixel font.

**Step 7: Commit**

```bash
git add -A && git commit -m "chore: configure Tailwind, Zustand, Framer Motion, pixel font"
```

---

## Task 2: Data Layer — Teams, Drivers, Tires, Tracks

**Files:**
- Create: `src/data/teams.ts`
- Create: `src/data/drivers.ts`
- Create: `src/data/tires.ts`
- Create: `src/data/tracks.ts`
- Create: `src/data/types.ts`

**Step 1: Create shared types**

Create `src/data/types.ts`:
```ts
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

export interface Track {
  id: string
  name: string
  country: string
  totalLaps: number
  baseLapTime: number
  overtakingDifficulty: number
  pitLaneTimeLoss: number
  weatherChangeChance: number
}
```

**Step 2: Create teams data**

Create `src/data/teams.ts` with all 11 teams. Use the design doc table for colors. Assign performance stats that reflect the 2026 pecking order (Red Bull/McLaren/Ferrari top tier, Cadillac/Haas lower).

```ts
import type { Team } from './types'

export const teams: Team[] = [
  { id: 'red-bull', name: 'Red Bull Racing', engine: 'Red Bull/Ford', primaryColor: '#3671C6', accentColor: '#FFD700', topSpeed: 95, cornering: 93, reliability: 88 },
  { id: 'mclaren', name: 'McLaren', engine: 'Mercedes', primaryColor: '#FF8000', accentColor: '#0090FF', topSpeed: 93, cornering: 94, reliability: 90 },
  { id: 'mercedes', name: 'Mercedes', engine: 'Mercedes', primaryColor: '#27F4D2', accentColor: '#222222', topSpeed: 91, cornering: 90, reliability: 92 },
  { id: 'ferrari', name: 'Ferrari', engine: 'Ferrari', primaryColor: '#E8002D', accentColor: '#FFDD00', topSpeed: 94, cornering: 92, reliability: 86 },
  { id: 'aston-martin', name: 'Aston Martin', engine: 'Honda', primaryColor: '#229971', accentColor: '#FFFFFF', topSpeed: 88, cornering: 86, reliability: 85 },
  { id: 'alpine', name: 'Alpine', engine: 'Mercedes', primaryColor: '#0093CC', accentColor: '#FF69B4', topSpeed: 84, cornering: 83, reliability: 82 },
  { id: 'audi', name: 'Audi', engine: 'Audi', primaryColor: '#1E1E1E', accentColor: '#00E701', topSpeed: 82, cornering: 80, reliability: 78 },
  { id: 'cadillac', name: 'Cadillac', engine: 'Ferrari', primaryColor: '#1C1C1C', accentColor: '#D4AF37', topSpeed: 79, cornering: 78, reliability: 80 },
  { id: 'williams', name: 'Williams', engine: 'Mercedes', primaryColor: '#64C4FF', accentColor: '#005AFF', topSpeed: 86, cornering: 84, reliability: 84 },
  { id: 'racing-bulls', name: 'Racing Bulls', engine: 'Red Bull/Ford', primaryColor: '#6692FF', accentColor: '#FF1801', topSpeed: 85, cornering: 83, reliability: 83 },
  { id: 'haas', name: 'Haas', engine: 'Ferrari', primaryColor: '#B6BABD', accentColor: '#E80020', topSpeed: 80, cornering: 79, reliability: 81 },
]
```

**Step 3: Create drivers data**

Create `src/data/drivers.ts` with all 22 drivers. Use the design doc table for stats. `shortName` is 3-letter abbreviation (e.g., VER, NOR).

```ts
import type { Driver } from './types'

export const drivers: Driver[] = [
  { id: 'verstappen', name: 'Max Verstappen', shortName: 'VER', teamId: 'red-bull', speed: 97, aggression: 85, tireManagement: 88, wetSkill: 95 },
  { id: 'hadjar', name: 'Isack Hadjar', shortName: 'HAD', teamId: 'red-bull', speed: 78, aggression: 72, tireManagement: 70, wetSkill: 68 },
  { id: 'norris', name: 'Lando Norris', shortName: 'NOR', teamId: 'mclaren', speed: 93, aggression: 75, tireManagement: 85, wetSkill: 82 },
  { id: 'piastri', name: 'Oscar Piastri', shortName: 'PIA', teamId: 'mclaren', speed: 90, aggression: 70, tireManagement: 83, wetSkill: 78 },
  { id: 'russell', name: 'George Russell', shortName: 'RUS', teamId: 'mercedes', speed: 89, aggression: 68, tireManagement: 82, wetSkill: 80 },
  { id: 'antonelli', name: 'Kimi Antonelli', shortName: 'ANT', teamId: 'mercedes', speed: 82, aggression: 74, tireManagement: 72, wetSkill: 70 },
  { id: 'hamilton', name: 'Lewis Hamilton', shortName: 'HAM', teamId: 'ferrari', speed: 94, aggression: 72, tireManagement: 92, wetSkill: 93 },
  { id: 'leclerc', name: 'Charles Leclerc', shortName: 'LEC', teamId: 'ferrari', speed: 93, aggression: 80, tireManagement: 78, wetSkill: 75 },
  { id: 'alonso', name: 'Fernando Alonso', shortName: 'ALO', teamId: 'aston-martin', speed: 88, aggression: 65, tireManagement: 90, wetSkill: 88 },
  { id: 'stroll', name: 'Lance Stroll', shortName: 'STR', teamId: 'aston-martin', speed: 75, aggression: 62, tireManagement: 74, wetSkill: 70 },
  { id: 'colapinto', name: 'Franco Colapinto', shortName: 'COL', teamId: 'alpine', speed: 77, aggression: 73, tireManagement: 68, wetSkill: 65 },
  { id: 'gasly', name: 'Pierre Gasly', shortName: 'GAS', teamId: 'alpine', speed: 84, aggression: 70, tireManagement: 79, wetSkill: 76 },
  { id: 'bortoleto', name: 'Gabriel Bortoleto', shortName: 'BOR', teamId: 'audi', speed: 79, aggression: 71, tireManagement: 72, wetSkill: 67 },
  { id: 'hulkenberg', name: 'Nico Hulkenberg', shortName: 'HUL', teamId: 'audi', speed: 82, aggression: 60, tireManagement: 80, wetSkill: 75 },
  { id: 'perez', name: 'Sergio Perez', shortName: 'PER', teamId: 'cadillac', speed: 83, aggression: 65, tireManagement: 81, wetSkill: 78 },
  { id: 'bottas', name: 'Valtteri Bottas', shortName: 'BOT', teamId: 'cadillac', speed: 81, aggression: 55, tireManagement: 83, wetSkill: 77 },
  { id: 'albon', name: 'Alexander Albon', shortName: 'ALB', teamId: 'williams', speed: 85, aggression: 68, tireManagement: 80, wetSkill: 76 },
  { id: 'sainz', name: 'Carlos Sainz', shortName: 'SAI', teamId: 'williams', speed: 90, aggression: 72, tireManagement: 85, wetSkill: 82 },
  { id: 'lindblad', name: 'Arvid Lindblad', shortName: 'LIN', teamId: 'racing-bulls', speed: 76, aggression: 74, tireManagement: 68, wetSkill: 64 },
  { id: 'lawson', name: 'Liam Lawson', shortName: 'LAW', teamId: 'racing-bulls', speed: 80, aggression: 76, tireManagement: 73, wetSkill: 71 },
  { id: 'bearman', name: 'Oliver Bearman', shortName: 'BEA', teamId: 'haas', speed: 78, aggression: 72, tireManagement: 70, wetSkill: 66 },
  { id: 'ocon', name: 'Esteban Ocon', shortName: 'OCO', teamId: 'haas', speed: 83, aggression: 68, tireManagement: 77, wetSkill: 74 },
]
```

**Step 4: Create tires data**

Create `src/data/tires.ts`:
```ts
import type { TireSpec, TireCompound, WeatherCondition } from './types'

export const tireSpecs: Record<TireCompound, TireSpec> = {
  soft: { compound: 'soft', gripBase: 0.97, degradationRate: 0.025, optimalLife: 10 },
  medium: { compound: 'medium', gripBase: 1.00, degradationRate: 0.015, optimalLife: 20 },
  hard: { compound: 'hard', gripBase: 1.03, degradationRate: 0.008, optimalLife: 35 },
  intermediate: { compound: 'intermediate', gripBase: 0.95, degradationRate: 0.012, optimalLife: 25 },
  wet: { compound: 'wet', gripBase: 0.92, degradationRate: 0.010, optimalLife: 30 },
}

export const weatherGripMatrix: Record<WeatherCondition, Record<TireCompound, number>> = {
  dry: { soft: 1.0, medium: 1.0, hard: 1.0, intermediate: 1.10, wet: 1.20 },
  'light-rain': { soft: 1.25, medium: 1.25, hard: 1.25, intermediate: 1.0, wet: 1.05 },
  'heavy-rain': { soft: 1.60, medium: 1.60, hard: 1.60, intermediate: 1.15, wet: 1.0 },
}

export const tireColors: Record<TireCompound, string> = {
  soft: '#ef4444',
  medium: '#eab308',
  hard: '#f8fafc',
  intermediate: '#22c55e',
  wet: '#3b82f6',
}
```

**Step 5: Create tracks data**

Create `src/data/tracks.ts`:
```ts
import type { Track } from './types'

export const tracks: Track[] = [
  {
    id: 'monza',
    name: 'Autodromo Nazionale Monza',
    country: 'Italy',
    totalLaps: 53,
    baseLapTime: 80,
    overtakingDifficulty: 35,
    pitLaneTimeLoss: 22,
    weatherChangeChance: 0.05,
  },
]
```

**Step 6: Verify types compile**

Run: `pnpm build`
Expected: No TypeScript errors.

**Step 7: Commit**

```bash
git add src/data/ && git commit -m "feat: add data layer — teams, drivers, tires, tracks"
```

---

## Task 3: Utility Functions

**Files:**
- Create: `src/utils/random.ts`
- Create: `src/utils/formatTime.ts`
- Create: `src/engine/__tests__/utils.test.ts`

**Step 1: Install vitest**

Run: `pnpm add -D vitest`

Add to `package.json` scripts: `"test": "vitest run", "test:watch": "vitest"`

**Step 2: Write failing tests for utils**

Create `src/utils/__tests__/random.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { randomBetween, randomChance } from '../random'

describe('randomBetween', () => {
  it('returns a value within the specified range', () => {
    for (let i = 0; i < 100; i++) {
      const val = randomBetween(-0.3, 0.3)
      expect(val).toBeGreaterThanOrEqual(-0.3)
      expect(val).toBeLessThanOrEqual(0.3)
    }
  })
})

describe('randomChance', () => {
  it('returns boolean', () => {
    expect(typeof randomChance(0.5)).toBe('boolean')
  })

  it('always true at 100%', () => {
    for (let i = 0; i < 50; i++) {
      expect(randomChance(1)).toBe(true)
    }
  })

  it('always false at 0%', () => {
    for (let i = 0; i < 50; i++) {
      expect(randomChance(0)).toBe(false)
    }
  })
})
```

Create `src/utils/__tests__/formatTime.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { formatLapTime, formatGap } from '../formatTime'

describe('formatLapTime', () => {
  it('formats seconds to m:ss.sss', () => {
    expect(formatLapTime(78.432)).toBe('1:18.432')
  })

  it('handles times over 2 minutes', () => {
    expect(formatLapTime(125.1)).toBe('2:05.100')
  })
})

describe('formatGap', () => {
  it('formats positive gap', () => {
    expect(formatGap(1.234)).toBe('+1.234')
  })

  it('formats leader', () => {
    expect(formatGap(0)).toBe('LEADER')
  })
})
```

**Step 3: Run tests to verify they fail**

Run: `pnpm test`
Expected: FAIL — modules not found.

**Step 4: Implement utils**

Create `src/utils/random.ts`:
```ts
export function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

export function randomChance(probability: number): boolean {
  return Math.random() < probability
}
```

Create `src/utils/formatTime.ts`:
```ts
export function formatLapTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  const wholeSecs = Math.floor(secs)
  const ms = Math.round((secs - wholeSecs) * 1000)
  return `${mins}:${String(wholeSecs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`
}

export function formatGap(gap: number): string {
  if (gap === 0) return 'LEADER'
  return `+${gap.toFixed(3)}`
}
```

**Step 5: Run tests to verify they pass**

Run: `pnpm test`
Expected: All PASS.

**Step 6: Commit**

```bash
git add src/utils/ package.json pnpm-lock.yaml && git commit -m "feat: add utility functions with tests"
```

---

## Task 4: Tire Model Engine

**Files:**
- Create: `src/engine/tireModel.ts`
- Create: `src/engine/__tests__/tireModel.test.ts`

**Step 1: Write failing tests**

Create `src/engine/__tests__/tireModel.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { calculateTireGrip, getEffectiveDegradation, getWeatherGripMultiplier } from '../tireModel'

describe('calculateTireGrip', () => {
  it('returns gripBase on fresh tires (lap 0)', () => {
    const grip = calculateTireGrip('soft', 0, 50)
    expect(grip).toBeCloseTo(0.97)
  })

  it('degrades over laps', () => {
    const fresh = calculateTireGrip('soft', 0, 50)
    const worn = calculateTireGrip('soft', 10, 50)
    expect(worn).toBeGreaterThan(fresh) // higher = slower
  })

  it('better tire management reduces degradation', () => {
    const lowMgmt = calculateTireGrip('soft', 10, 30)
    const highMgmt = calculateTireGrip('soft', 10, 90)
    expect(highMgmt).toBeLessThan(lowMgmt) // less degradation = lower (faster)
  })
})

describe('getEffectiveDegradation', () => {
  it('reduces degradation based on driver skill', () => {
    const base = getEffectiveDegradation('soft', 0)
    const skilled = getEffectiveDegradation('soft', 100)
    expect(skilled).toBeLessThan(base)
  })
})

describe('getWeatherGripMultiplier', () => {
  it('slicks in dry = 1.0', () => {
    expect(getWeatherGripMultiplier('soft', 'dry')).toBe(1.0)
  })

  it('slicks in heavy rain = 1.60', () => {
    expect(getWeatherGripMultiplier('medium', 'heavy-rain')).toBe(1.60)
  })

  it('wets in heavy rain = 1.0', () => {
    expect(getWeatherGripMultiplier('wet', 'heavy-rain')).toBe(1.0)
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `pnpm test src/engine/__tests__/tireModel.test.ts`
Expected: FAIL.

**Step 3: Implement tireModel**

Create `src/engine/tireModel.ts`:
```ts
import { tireSpecs, weatherGripMatrix } from '../data/tires'
import type { TireCompound, WeatherCondition } from '../data/types'

export function getEffectiveDegradation(compound: TireCompound, tireManagement: number): number {
  const base = tireSpecs[compound].degradationRate
  return base * (1 - tireManagement * 0.005)
}

export function calculateTireGrip(compound: TireCompound, lapsOnTire: number, tireManagement: number): number {
  const base = tireSpecs[compound].gripBase
  const deg = getEffectiveDegradation(compound, tireManagement)
  return base + lapsOnTire * deg
}

export function getWeatherGripMultiplier(compound: TireCompound, weather: WeatherCondition): number {
  return weatherGripMatrix[weather][compound]
}
```

**Step 4: Run tests**

Run: `pnpm test src/engine/__tests__/tireModel.test.ts`
Expected: All PASS.

**Step 5: Commit**

```bash
git add src/engine/tireModel.ts src/engine/__tests__/tireModel.test.ts && git commit -m "feat: tire model — grip, degradation, weather multiplier"
```

---

## Task 5: Weather Engine

**Files:**
- Create: `src/engine/weatherEngine.ts`
- Create: `src/engine/__tests__/weatherEngine.test.ts`

**Step 1: Write failing tests**

Create `src/engine/__tests__/weatherEngine.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { getNextWeather, simulateWeatherForLap } from '../weatherEngine'

describe('getNextWeather', () => {
  it('dry can transition to light-rain', () => {
    const options = new Set<string>()
    for (let i = 0; i < 200; i++) {
      options.add(getNextWeather('dry'))
    }
    expect(options.has('light-rain')).toBe(true)
    expect(options.has('heavy-rain')).toBe(false) // can't jump to heavy
  })

  it('light-rain can go to dry or heavy-rain', () => {
    const options = new Set<string>()
    for (let i = 0; i < 200; i++) {
      options.add(getNextWeather('light-rain'))
    }
    expect(options.has('dry')).toBe(true)
    expect(options.has('heavy-rain')).toBe(true)
  })
})

describe('simulateWeatherForLap', () => {
  it('returns same weather when chance is 0', () => {
    for (let i = 0; i < 50; i++) {
      expect(simulateWeatherForLap('dry', 0)).toBe('dry')
    }
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `pnpm test src/engine/__tests__/weatherEngine.test.ts`
Expected: FAIL.

**Step 3: Implement weatherEngine**

Create `src/engine/weatherEngine.ts`:
```ts
import type { WeatherCondition } from '../data/types'
import { randomChance } from '../utils/random'

const transitions: Record<WeatherCondition, WeatherCondition[]> = {
  dry: ['light-rain'],
  'light-rain': ['dry', 'heavy-rain'],
  'heavy-rain': ['light-rain'],
}

export function getNextWeather(current: WeatherCondition): WeatherCondition {
  const options = transitions[current]
  return options[Math.floor(Math.random() * options.length)]
}

export function simulateWeatherForLap(current: WeatherCondition, changeChance: number): WeatherCondition {
  if (randomChance(changeChance)) {
    return getNextWeather(current)
  }
  return current
}
```

**Step 4: Run tests**

Run: `pnpm test src/engine/__tests__/weatherEngine.test.ts`
Expected: All PASS.

**Step 5: Commit**

```bash
git add src/engine/weatherEngine.ts src/engine/__tests__/weatherEngine.test.ts && git commit -m "feat: weather engine — dynamic transitions"
```

---

## Task 6: Lap Simulator

**Files:**
- Create: `src/engine/lapSimulator.ts`
- Create: `src/engine/__tests__/lapSimulator.test.ts`

**Step 1: Write failing tests**

Create `src/engine/__tests__/lapSimulator.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { calculateLapTime } from '../lapSimulator'
import type { WeatherCondition } from '../../data/types'

const baseCar = { topSpeed: 90, cornering: 90 }
const baseDriver = { speed: 85, tireManagement: 80 }
const baseParams = {
  car: baseCar,
  driver: baseDriver,
  tireCompound: 'medium' as const,
  lapsOnTire: 0,
  fuelLoad: 0.5,
  weather: 'dry' as WeatherCondition,
  baseLapTime: 80,
}

describe('calculateLapTime', () => {
  it('returns a time close to baseLapTime', () => {
    const time = calculateLapTime(baseParams)
    expect(time).toBeGreaterThan(60)
    expect(time).toBeLessThan(100)
  })

  it('faster car produces faster lap time', () => {
    const times: number[] = []
    for (let i = 0; i < 100; i++) {
      times.push(calculateLapTime({ ...baseParams, car: { topSpeed: 99, cornering: 99 } }))
    }
    const avgFast = times.reduce((a, b) => a + b) / times.length

    const slowTimes: number[] = []
    for (let i = 0; i < 100; i++) {
      slowTimes.push(calculateLapTime({ ...baseParams, car: { topSpeed: 60, cornering: 60 } }))
    }
    const avgSlow = slowTimes.reduce((a, b) => a + b) / slowTimes.length

    expect(avgFast).toBeLessThan(avgSlow)
  })

  it('more fuel makes laps slower', () => {
    const lightTimes: number[] = []
    const heavyTimes: number[] = []
    for (let i = 0; i < 100; i++) {
      lightTimes.push(calculateLapTime({ ...baseParams, fuelLoad: 0.1 }))
      heavyTimes.push(calculateLapTime({ ...baseParams, fuelLoad: 1.0 }))
    }
    const avgLight = lightTimes.reduce((a, b) => a + b) / lightTimes.length
    const avgHeavy = heavyTimes.reduce((a, b) => a + b) / heavyTimes.length
    expect(avgLight).toBeLessThan(avgHeavy)
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `pnpm test src/engine/__tests__/lapSimulator.test.ts`
Expected: FAIL.

**Step 3: Implement lapSimulator**

Create `src/engine/lapSimulator.ts`:
```ts
import type { TireCompound, WeatherCondition } from '../data/types'
import { calculateTireGrip, getWeatherGripMultiplier } from './tireModel'
import { randomBetween } from '../utils/random'

interface LapTimeParams {
  car: { topSpeed: number; cornering: number }
  driver: { speed: number; tireManagement: number }
  tireCompound: TireCompound
  lapsOnTire: number
  fuelLoad: number
  weather: WeatherCondition
  baseLapTime: number
}

export function calculateLapTime(params: LapTimeParams): number {
  const { car, driver, tireCompound, lapsOnTire, fuelLoad, weather, baseLapTime } = params

  const carFactor = 1 - car.topSpeed * 0.002
  const driverFactor = 1 - driver.speed * 0.001
  const fuelFactor = 1 + fuelLoad * 0.0003
  const tireGrip = calculateTireGrip(tireCompound, lapsOnTire, driver.tireManagement)
  const tireFactor = 1 + (tireGrip - 1) * 4
  const weatherFactor = getWeatherGripMultiplier(tireCompound, weather)
  const noise = randomBetween(-0.3, 0.3)

  return baseLapTime * carFactor * driverFactor * fuelFactor * tireFactor * weatherFactor + noise
}
```

**Step 4: Run tests**

Run: `pnpm test src/engine/__tests__/lapSimulator.test.ts`
Expected: All PASS.

**Step 5: Commit**

```bash
git add src/engine/lapSimulator.ts src/engine/__tests__/lapSimulator.test.ts && git commit -m "feat: lap simulator — core lap time calculation"
```

---

## Task 7: Overtaking Engine

**Files:**
- Create: `src/engine/overtakingEngine.ts`
- Create: `src/engine/__tests__/overtakingEngine.test.ts`

**Step 1: Write failing tests**

Create `src/engine/__tests__/overtakingEngine.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { reduceGap, attemptOvertake } from '../overtakingEngine'

describe('reduceGap', () => {
  it('reduces gap by 70% of time difference', () => {
    expect(reduceGap(2.0, 0.5)).toBeCloseTo(1.65)
  })

  it('gap cannot go below 0', () => {
    expect(reduceGap(0.1, 2.0)).toBe(0)
  })
})

describe('attemptOvertake', () => {
  it('returns false if gap > 0.5', () => {
    const result = attemptOvertake({ gap: 1.0, attackerAggression: 90, speedDiff: 5, overtakingDifficulty: 30 })
    expect(result.overtook).toBe(false)
  })

  it('returns a boolean when gap < 0.5', () => {
    const result = attemptOvertake({ gap: 0.3, attackerAggression: 90, speedDiff: 5, overtakingDifficulty: 30 })
    expect(typeof result.overtook).toBe('boolean')
  })
})
```

**Step 2: Run to verify fail, then implement**

Create `src/engine/overtakingEngine.ts`:
```ts
import { randomChance } from '../utils/random'

interface OvertakeParams {
  gap: number
  attackerAggression: number
  speedDiff: number
  overtakingDifficulty: number
}

interface OvertakeResult {
  overtook: boolean
}

export function reduceGap(currentGap: number, timeDifference: number): number {
  return Math.max(0, currentGap - timeDifference * 0.7)
}

export function attemptOvertake(params: OvertakeParams): OvertakeResult {
  const { gap, attackerAggression, speedDiff, overtakingDifficulty } = params

  if (gap > 0.5) return { overtook: false }

  const chance = (attackerAggression * 0.4 + speedDiff * 0.3) * (1 - overtakingDifficulty * 0.01) / 100
  return { overtook: randomChance(Math.max(0, Math.min(1, chance))) }
}
```

**Step 3: Run tests**

Run: `pnpm test src/engine/__tests__/overtakingEngine.test.ts`
Expected: All PASS.

**Step 4: Commit**

```bash
git add src/engine/overtakingEngine.ts src/engine/__tests__/overtakingEngine.test.ts && git commit -m "feat: overtaking engine — gap reduction and overtake attempts"
```

---

## Task 8: Incident Engine

**Files:**
- Create: `src/engine/incidentEngine.ts`
- Create: `src/engine/__tests__/incidentEngine.test.ts`

**Step 1: Write failing tests**

Create `src/engine/__tests__/incidentEngine.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { checkForIncident, compressGaps } from '../incidentEngine'

describe('checkForIncident', () => {
  it('returns an incident result', () => {
    const result = checkForIncident({ aggression: 50, reliability: 80 })
    expect(result).toHaveProperty('type')
    expect(['none', 'spin', 'mechanical', 'collision']).toContain(result.type)
  })
})

describe('compressGaps', () => {
  it('compresses all gaps to 0.2', () => {
    const gaps = [0, 1.5, 3.2, 8.0]
    const compressed = compressGaps(gaps)
    for (let i = 1; i < compressed.length; i++) {
      expect(compressed[i] - compressed[i - 1]).toBeCloseTo(0.2)
    }
  })
})
```

**Step 2: Implement incidentEngine**

Create `src/engine/incidentEngine.ts`:
```ts
import { randomChance, randomBetween } from '../utils/random'

type IncidentType = 'none' | 'spin' | 'mechanical' | 'collision'

interface IncidentResult {
  type: IncidentType
  timeLost: number
  dnf: boolean
}

export function checkForIncident(params: { aggression: number; reliability: number }): IncidentResult {
  const baseChance = 0.002
  const modifier = 1 + (params.aggression * 0.005) - (params.reliability * 0.003)
  const chance = baseChance * Math.max(0.1, modifier)

  if (!randomChance(chance)) return { type: 'none', timeLost: 0, dnf: false }

  const roll = Math.random()
  if (roll < 0.5) return { type: 'spin', timeLost: randomBetween(3, 7), dnf: false }
  if (roll < 0.8) return { type: 'mechanical', timeLost: 0, dnf: true }
  return { type: 'collision', timeLost: randomBetween(5, 15), dnf: Math.random() < 0.3 }
}

export function compressGaps(cumulativeTimes: number[]): number[] {
  if (cumulativeTimes.length === 0) return []
  const leader = cumulativeTimes[0]
  return cumulativeTimes.map((_, i) => leader + i * 0.2)
}
```

**Step 3: Run tests**

Run: `pnpm test src/engine/__tests__/incidentEngine.test.ts`
Expected: All PASS.

**Step 4: Commit**

```bash
git add src/engine/incidentEngine.ts src/engine/__tests__/incidentEngine.test.ts && git commit -m "feat: incident engine — spins, mechanicals, safety car compression"
```

---

## Task 9: Qualifying Simulator

**Files:**
- Create: `src/engine/qualifyingSimulator.ts`
- Create: `src/engine/__tests__/qualifyingSimulator.test.ts`

**Step 1: Write failing tests**

Create `src/engine/__tests__/qualifyingSimulator.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { simulateQualifying } from '../qualifyingSimulator'
import { teams } from '../../data/teams'
import { drivers } from '../../data/drivers'
import { tracks } from '../../data/tracks'

describe('simulateQualifying', () => {
  it('returns 22 results sorted by time', () => {
    const results = simulateQualifying({
      teams,
      drivers,
      track: tracks[0],
      weather: 'dry',
      playerDriverId: 'verstappen',
      playerMode: 'push',
    })
    expect(results).toHaveLength(22)
    for (let i = 1; i < results.length; i++) {
      expect(results[i].time).toBeGreaterThanOrEqual(results[i - 1].time)
    }
  })

  it('each result has position, driverId, time', () => {
    const results = simulateQualifying({
      teams,
      drivers,
      track: tracks[0],
      weather: 'dry',
      playerDriverId: 'verstappen',
      playerMode: 'safe',
    })
    expect(results[0]).toHaveProperty('position')
    expect(results[0]).toHaveProperty('driverId')
    expect(results[0]).toHaveProperty('time')
    expect(results[0].position).toBe(1)
  })
})
```

**Step 2: Implement qualifyingSimulator**

Create `src/engine/qualifyingSimulator.ts`:
```ts
import type { Team, Driver, Track, WeatherCondition } from '../data/types'
import { calculateLapTime } from './lapSimulator'
import { randomBetween, randomChance } from '../utils/random'

type QualifyingMode = 'safe' | 'push' | 'full-send'

interface QualifyingParams {
  teams: Team[]
  drivers: Driver[]
  track: Track
  weather: WeatherCondition
  playerDriverId: string
  playerMode: QualifyingMode
}

interface QualifyingResult {
  position: number
  driverId: string
  teamId: string
  time: number
  error: boolean
}

const modeModifiers: Record<QualifyingMode, { speedBoost: number; errorChance: number; errorPenalty: number }> = {
  safe: { speedBoost: 0.90, errorChance: 0.02, errorPenalty: 0.5 },
  push: { speedBoost: 1.0, errorChance: 0.15, errorPenalty: 1.5 },
  'full-send': { speedBoost: 1.05, errorChance: 0.35, errorPenalty: 3.0 },
}

export function simulateQualifying(params: QualifyingParams): QualifyingResult[] {
  const { teams, drivers, track, weather, playerDriverId, playerMode } = params
  const teamMap = new Map(teams.map(t => [t.id, t]))

  const results: QualifyingResult[] = drivers.map(driver => {
    const team = teamMap.get(driver.teamId)!
    const isPlayer = driver.id === playerDriverId
    const mode = isPlayer ? playerMode : 'push'
    const modifier = modeModifiers[mode]

    const baseLap = calculateLapTime({
      car: { topSpeed: team.topSpeed, cornering: team.cornering },
      driver: { speed: driver.speed * modifier.speedBoost, tireManagement: driver.tireManagement },
      tireCompound: 'soft',
      lapsOnTire: 0,
      fuelLoad: 0.05,
      weather,
      baseLapTime: track.baseLapTime,
    })

    const error = randomChance(modifier.errorChance)
    const time = error ? baseLap + randomBetween(0.5, modifier.errorPenalty) : baseLap

    return { position: 0, driverId: driver.id, teamId: driver.teamId, time, error }
  })

  results.sort((a, b) => a.time - b.time)
  results.forEach((r, i) => { r.position = i + 1 })

  return results
}
```

**Step 3: Run tests**

Run: `pnpm test src/engine/__tests__/qualifyingSimulator.test.ts`
Expected: All PASS.

**Step 4: Commit**

```bash
git add src/engine/qualifyingSimulator.ts src/engine/__tests__/qualifyingSimulator.test.ts && git commit -m "feat: qualifying simulator — safe/push/full-send modes"
```

---

## Task 10: Race Simulator

**Files:**
- Create: `src/engine/raceSimulator.ts`
- Create: `src/engine/__tests__/raceSimulator.test.ts`

This is the core orchestrator. It takes a `RaceState` and produces the next lap's `RaceState`.

**Step 1: Write failing tests**

Create `src/engine/__tests__/raceSimulator.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { createInitialRaceState, simulateLap } from '../raceSimulator'
import { teams } from '../../data/teams'
import { drivers } from '../../data/drivers'
import { tracks } from '../../data/tracks'

describe('createInitialRaceState', () => {
  it('creates state with 22 car entries', () => {
    const grid = drivers.map((d, i) => ({ driverId: d.id, position: i + 1 }))
    const state = createInitialRaceState({ teams, drivers, track: tracks[0], grid, weather: 'dry', playerDriverId: 'verstappen' })
    expect(state.cars).toHaveLength(22)
    expect(state.currentLap).toBe(0)
  })
})

describe('simulateLap', () => {
  it('advances lap by 1', () => {
    const grid = drivers.map((d, i) => ({ driverId: d.id, position: i + 1 }))
    const state = createInitialRaceState({ teams, drivers, track: tracks[0], grid, weather: 'dry', playerDriverId: 'verstappen' })
    const next = simulateLap(state)
    expect(next.currentLap).toBe(1)
  })

  it('reduces fuel load', () => {
    const grid = drivers.map((d, i) => ({ driverId: d.id, position: i + 1 }))
    const state = createInitialRaceState({ teams, drivers, track: tracks[0], grid, weather: 'dry', playerDriverId: 'verstappen' })
    const next = simulateLap(state)
    expect(next.cars[0].fuelLoad).toBeLessThan(state.cars[0].fuelLoad)
  })
})
```

**Step 2: Implement raceSimulator**

Create `src/engine/raceSimulator.ts`:
```ts
import type { Team, Driver, Track, WeatherCondition, TireCompound } from '../data/types'
import { calculateLapTime } from './lapSimulator'
import { reduceGap, attemptOvertake } from './overtakingEngine'
import { checkForIncident, compressGaps } from './incidentEngine'
import { simulateWeatherForLap } from './weatherEngine'

export type DriverMode = 'push' | 'neutral' | 'save'

export interface CarState {
  driverId: string
  teamId: string
  tireCompound: TireCompound
  lapsOnTire: number
  fuelLoad: number
  cumulativeTime: number
  lastLapTime: number
  position: number
  dnf: boolean
  pitting: boolean
  pitThisLap: boolean
  compoundsUsed: TireCompound[]
  mode: DriverMode
}

export interface RaceState {
  cars: CarState[]
  currentLap: number
  totalLaps: number
  weather: WeatherCondition
  safetyCar: boolean
  safetyCarLapsLeft: number
  track: Track
  teams: Team[]
  drivers: Driver[]
  playerDriverId: string
  events: RaceEvent[]
}

export interface RaceEvent {
  lap: number
  type: 'overtake' | 'incident' | 'safety-car' | 'weather-change' | 'pit-stop'
  driverId: string
  message: string
}

interface InitParams {
  teams: Team[]
  drivers: Driver[]
  track: Track
  grid: { driverId: string; position: number }[]
  weather: WeatherCondition
  playerDriverId: string
  playerStrategy?: { stints: { compound: TireCompound; laps: number }[] }
}

export function createInitialRaceState(params: InitParams): RaceState {
  const { teams, drivers, track, grid, weather, playerDriverId } = params
  const driverMap = new Map(drivers.map(d => [d.id, d]))

  const cars: CarState[] = grid
    .sort((a, b) => a.position - b.position)
    .map((g, i) => {
      const driver = driverMap.get(g.driverId)!
      return {
        driverId: g.driverId,
        teamId: driver.teamId,
        tireCompound: 'medium' as TireCompound,
        lapsOnTire: 0,
        fuelLoad: 1.0,
        cumulativeTime: i * 0.5,
        lastLapTime: 0,
        position: i + 1,
        dnf: false,
        pitting: false,
        pitThisLap: false,
        compoundsUsed: ['medium'],
        mode: 'neutral' as DriverMode,
      }
    })

  return {
    cars,
    currentLap: 0,
    totalLaps: track.totalLaps,
    weather,
    safetyCar: false,
    safetyCarLapsLeft: 0,
    track,
    teams,
    drivers,
    playerDriverId,
    events: [],
  }
}

export function simulateLap(state: RaceState): RaceState {
  const next: RaceState = JSON.parse(JSON.stringify(state))
  next.currentLap += 1
  next.events = []

  const teamMap = new Map(next.teams.map(t => [t.id, t]))
  const driverMap = new Map(next.drivers.map(d => [d.id, d]))

  // Weather
  const newWeather = simulateWeatherForLap(next.weather, next.track.weatherChangeChance)
  if (newWeather !== next.weather) {
    next.events.push({ lap: next.currentLap, type: 'weather-change', driverId: '', message: `Weather changed to ${newWeather}` })
    next.weather = newWeather
  }

  // Safety Car countdown
  if (next.safetyCar) {
    next.safetyCarLapsLeft -= 1
    if (next.safetyCarLapsLeft <= 0) {
      next.safetyCar = false
      next.events.push({ lap: next.currentLap, type: 'safety-car', driverId: '', message: 'Safety Car in!' })
    }
  }

  // Simulate each car
  const fuelPerLap = 1.0 / next.totalLaps

  for (const car of next.cars) {
    if (car.dnf) continue

    const driver = driverMap.get(car.driverId)!
    const team = teamMap.get(car.teamId)!

    // Pit stop
    if (car.pitting) {
      car.cumulativeTime += next.track.pitLaneTimeLoss
      car.lapsOnTire = 0
      car.pitting = false
      car.pitThisLap = true
      if (!car.compoundsUsed.includes(car.tireCompound)) {
        car.compoundsUsed.push(car.tireCompound)
      }
      next.events.push({ lap: next.currentLap, type: 'pit-stop', driverId: car.driverId, message: `${driver.shortName} pits for ${car.tireCompound}` })
    } else {
      car.pitThisLap = false
    }

    // Mode modifiers
    const modeSpeedMod = car.mode === 'push' ? 1.02 : car.mode === 'save' ? 0.97 : 1.0
    const modeDegMod = car.mode === 'push' ? 1.3 : car.mode === 'save' ? 0.7 : 1.0

    // Lap time
    const lapTime = calculateLapTime({
      car: { topSpeed: team.topSpeed * modeSpeedMod, cornering: team.cornering },
      driver: { speed: driver.speed, tireManagement: driver.tireManagement },
      tireCompound: car.tireCompound,
      lapsOnTire: Math.floor(car.lapsOnTire * modeDegMod),
      fuelLoad: car.fuelLoad,
      weather: next.weather,
      baseLapTime: next.track.baseLapTime,
    })

    car.lastLapTime = next.safetyCar ? lapTime * 1.3 : lapTime
    car.cumulativeTime += car.lastLapTime
    car.lapsOnTire += 1
    car.fuelLoad = Math.max(0, car.fuelLoad - fuelPerLap)

    // Incidents
    const incident = checkForIncident({ aggression: driver.aggression, reliability: team.reliability })
    if (incident.type !== 'none') {
      if (incident.dnf) {
        car.dnf = true
        next.events.push({ lap: next.currentLap, type: 'incident', driverId: car.driverId, message: `${driver.shortName} retires — ${incident.type}` })
        if (!next.safetyCar && incident.type === 'mechanical') {
          next.safetyCar = true
          next.safetyCarLapsLeft = 3 + Math.floor(Math.random() * 3)
          next.events.push({ lap: next.currentLap, type: 'safety-car', driverId: '', message: 'Safety Car deployed!' })
        }
      } else {
        car.cumulativeTime += incident.timeLost
        next.events.push({ lap: next.currentLap, type: 'incident', driverId: car.driverId, message: `${driver.shortName} has a ${incident.type}!` })
      }
    }
  }

  // Safety car compression
  if (next.safetyCar) {
    const activeCars = next.cars.filter(c => !c.dnf)
    activeCars.sort((a, b) => a.cumulativeTime - b.cumulativeTime)
    const times = activeCars.map(c => c.cumulativeTime)
    const compressed = compressGaps(times)
    activeCars.forEach((car, i) => { car.cumulativeTime = compressed[i] })
  }

  // Overtaking
  const activeCars = next.cars.filter(c => !c.dnf)
  activeCars.sort((a, b) => a.cumulativeTime - b.cumulativeTime)

  if (!next.safetyCar) {
    for (let i = 1; i < activeCars.length; i++) {
      const attacker = activeCars[i]
      const defender = activeCars[i - 1]
      const gap = attacker.cumulativeTime - defender.cumulativeTime
      const attackerDriver = driverMap.get(attacker.driverId)!
      const defenderDriver = driverMap.get(defender.driverId)!
      const attackerTeam = teamMap.get(attacker.teamId)!
      const defenderTeam = teamMap.get(defender.teamId)!

      const newGap = reduceGap(gap, defender.lastLapTime - attacker.lastLapTime)
      if (newGap <= 0 || attemptOvertake({
        gap: newGap,
        attackerAggression: attackerDriver.aggression,
        speedDiff: attackerTeam.topSpeed - defenderTeam.topSpeed,
        overtakingDifficulty: next.track.overtakingDifficulty,
      }).overtook) {
        const tempTime = defender.cumulativeTime
        defender.cumulativeTime = attacker.cumulativeTime
        attacker.cumulativeTime = tempTime - 0.3
        next.events.push({ lap: next.currentLap, type: 'overtake', driverId: attacker.driverId, message: `${attackerDriver.shortName} overtakes ${defenderDriver.shortName}!` })
      }
    }
  }

  // Update positions
  const allSorted = [...next.cars].filter(c => !c.dnf).sort((a, b) => a.cumulativeTime - b.cumulativeTime)
  allSorted.forEach((car, i) => { car.position = i + 1 })
  next.cars.filter(c => c.dnf).forEach(car => { car.position = 99 })

  return next
}
```

**Step 3: Run tests**

Run: `pnpm test src/engine/__tests__/raceSimulator.test.ts`
Expected: All PASS.

**Step 4: Commit**

```bash
git add src/engine/raceSimulator.ts src/engine/__tests__/raceSimulator.test.ts && git commit -m "feat: race simulator — full lap-by-lap simulation orchestrator"
```

---

## Task 11: Zustand Stores

**Files:**
- Create: `src/stores/weekendStore.ts`
- Create: `src/stores/raceStore.ts`
- Create: `src/stores/strategyStore.ts`

**Step 1: Create weekendStore**

Create `src/stores/weekendStore.ts`:
```ts
import { create } from 'zustand'
import type { WeatherCondition } from '../data/types'

type Phase = 'team-select' | 'practice' | 'qualifying' | 'strategy' | 'race' | 'results'

interface WeekendState {
  phase: Phase
  selectedTeamId: string | null
  selectedDriverId: string | null
  weather: WeatherCondition
  practiceData: { dataCollected: number; revealedCompounds: string[] }
  qualifyingGrid: { driverId: string; position: number; time: number }[]

  setPhase: (phase: Phase) => void
  selectTeam: (teamId: string, driverId: string) => void
  setPracticeData: (data: { dataCollected: number; revealedCompounds: string[] }) => void
  setQualifyingGrid: (grid: { driverId: string; position: number; time: number }[]) => void
  reset: () => void
}

export const useWeekendStore = create<WeekendState>((set) => ({
  phase: 'team-select',
  selectedTeamId: null,
  selectedDriverId: null,
  weather: 'dry',
  practiceData: { dataCollected: 0, revealedCompounds: [] },
  qualifyingGrid: [],

  setPhase: (phase) => set({ phase }),
  selectTeam: (teamId, driverId) => set({ selectedTeamId: teamId, selectedDriverId: driverId }),
  setPracticeData: (data) => set({ practiceData: data }),
  setQualifyingGrid: (grid) => set({ qualifyingGrid: grid }),
  reset: () => set({
    phase: 'team-select',
    selectedTeamId: null,
    selectedDriverId: null,
    weather: 'dry',
    practiceData: { dataCollected: 0, revealedCompounds: [] },
    qualifyingGrid: [],
  }),
}))
```

**Step 2: Create strategyStore**

Create `src/stores/strategyStore.ts`:
```ts
import { create } from 'zustand'
import type { TireCompound } from '../data/types'

export interface Stint {
  compound: TireCompound
  laps: number
}

interface StrategyState {
  stints: Stint[]

  addStint: (stint: Stint) => void
  removeStint: (index: number) => void
  updateStint: (index: number, stint: Stint) => void
  setStints: (stints: Stint[]) => void
  reset: () => void
}

export const useStrategyStore = create<StrategyState>((set) => ({
  stints: [
    { compound: 'medium', laps: 25 },
    { compound: 'hard', laps: 28 },
  ],

  addStint: (stint) => set((s) => ({ stints: [...s.stints, stint] })),
  removeStint: (index) => set((s) => ({ stints: s.stints.filter((_, i) => i !== index) })),
  updateStint: (index, stint) => set((s) => ({
    stints: s.stints.map((existing, i) => (i === index ? stint : existing)),
  })),
  setStints: (stints) => set({ stints }),
  reset: () => set({ stints: [{ compound: 'medium', laps: 25 }, { compound: 'hard', laps: 28 }] }),
}))
```

**Step 3: Create raceStore**

Create `src/stores/raceStore.ts`:
```ts
import { create } from 'zustand'
import type { RaceState, DriverMode } from '../engine/raceSimulator'
import type { TireCompound } from '../data/types'

interface RaceStoreState {
  raceState: RaceState | null
  isRunning: boolean

  setRaceState: (state: RaceState) => void
  setRunning: (running: boolean) => void
  setPlayerMode: (mode: DriverMode) => void
  callPitStop: (compound: TireCompound) => void
  reset: () => void
}

export const useRaceStore = create<RaceStoreState>((set) => ({
  raceState: null,
  isRunning: false,

  setRaceState: (raceState) => set({ raceState }),
  setRunning: (isRunning) => set({ isRunning }),
  setPlayerMode: (mode) => set((s) => {
    if (!s.raceState) return s
    const next = { ...s.raceState, cars: s.raceState.cars.map(c =>
      c.driverId === s.raceState!.playerDriverId ? { ...c, mode } : c
    )}
    return { raceState: next }
  }),
  callPitStop: (compound) => set((s) => {
    if (!s.raceState) return s
    const next = { ...s.raceState, cars: s.raceState.cars.map(c =>
      c.driverId === s.raceState!.playerDriverId ? { ...c, pitting: true, tireCompound: compound } : c
    )}
    return { raceState: next }
  }),
  reset: () => set({ raceState: null, isRunning: false }),
}))
```

**Step 4: Verify compilation**

Run: `pnpm build`
Expected: No TypeScript errors.

**Step 5: Commit**

```bash
git add src/stores/ && git commit -m "feat: Zustand stores — weekend, strategy, race state"
```

---

## Task 12: Shared UI Components

**Files:**
- Create: `src/components/PixelButton.tsx`
- Create: `src/components/LapCounter.tsx`
- Create: `src/components/WeatherBadge.tsx`
- Create: `src/components/TireIndicator.tsx`
- Create: `src/components/FuelIndicator.tsx`
- Create: `src/components/RadioAlert.tsx`
- Create: `src/components/SafetyCarBanner.tsx`
- Create: `src/components/Leaderboard.tsx`

Build all shared components. Each is a small, focused component. Use Tailwind for styling, Framer Motion for animations on the Leaderboard.

Key implementation notes:
- `PixelButton`: `border-2 border-f1-border bg-slate-800 hover:bg-slate-700 px-4 py-2 font-pixel text-xs` with optional color variants (danger, success, warning).
- `Leaderboard`: Uses `framer-motion` `AnimatePresence` and `motion.div` with `layout` prop to animate row reordering. Each row shows: position, team color bar (4px wide), driver shortName, team name, gap. Player row highlighted with team accent border.
- `TireIndicator`: Colored bar (red/yellow/white/green/blue per compound) showing grip percentage.
- `RadioAlert`: Animated pop-up in bottom-right, auto-dismisses after 3 seconds. Pixel border, dark bg, team accent color.
- `WeatherBadge`: Emoji-based (sun/cloud-rain/cloud-showers) with text label.
- `SafetyCarBanner`: Yellow animated banner across top when SC is active.

**Step 1: Build all components**

Create each file with full implementation. Focus on Tailwind Pixel-Tech aesthetic.

**Step 2: Verify they compile**

Run: `pnpm build`

**Step 3: Commit**

```bash
git add src/components/ && git commit -m "feat: shared UI components — pixel-tech styled"
```

---

## Task 13: Team Select Screen

**Files:**
- Create: `src/screens/TeamSelect.tsx`
- Modify: `src/App.tsx`

**Step 1: Build TeamSelect screen**

Grid of 11 team cards. Each card shows: team name, primaryColor bar, engine, both drivers. Clicking a driver selects them and their team. Then a "Start Weekend" button appears.

Layout: 3-4 column grid on desktop, centered. Title: "F1 THE GAME" in large pixel font at top. Subtitle: "Choose your team and driver".

**Step 2: Wire up App.tsx as phase router**

Replace App.tsx content with a phase switcher that reads `useWeekendStore().phase` and renders the corresponding screen.

```tsx
import { useWeekendStore } from './stores/weekendStore'
import { TeamSelect } from './screens/TeamSelect'
// ... other screens as they're built

function App() {
  const phase = useWeekendStore((s) => s.phase)

  switch (phase) {
    case 'team-select': return <TeamSelect />
    // other phases will be added in later tasks
    default: return <TeamSelect />
  }
}

export default App
```

**Step 3: Verify in browser**

Run: `pnpm dev`
Expected: Team selection grid with pixel styling renders.

**Step 4: Commit**

```bash
git add src/screens/TeamSelect.tsx src/App.tsx && git commit -m "feat: team select screen with driver cards"
```

---

## Task 14: Practice Screen

**Files:**
- Create: `src/screens/Practice.tsx`
- Modify: `src/App.tsx` (add case)

**Step 1: Build Practice screen**

Implement the Data Hunt minigame:
- "Data Collected" progress bar that fills over ~20 seconds
- Every ~4 seconds, reveal a tire compound's degradation data (flip card animation)
- Order: Soft → Medium → Hard
- Bottom buttons: "End Practice" (skip, go to Qualifying) and "Continue" (disabled until timer ends)
- Show a simple pixel track outline with a car dot going around it (CSS animation on a path, or just a progress bar)

Uses `useEffect` with `setInterval` for the timer. Updates `weekendStore.practiceData`.

**Step 2: Wire into App.tsx**

Add `case 'practice': return <Practice />` to the switch.

**Step 3: Verify**

Run: `pnpm dev`, select a team → should transition to Practice.

**Step 4: Commit**

```bash
git add src/screens/Practice.tsx src/App.tsx && git commit -m "feat: practice screen — data hunt minigame"
```

---

## Task 15: Qualifying Screen

**Files:**
- Create: `src/screens/Qualifying.tsx`
- Modify: `src/App.tsx` (add case)

**Step 1: Build Qualifying screen**

Three phases:
1. Mode selection: three big buttons (Safe/Push/Full Send) with color coding and risk description
2. Lap animation: 3 sector bars that fill progressively over ~5 seconds with color-coded results
3. Results: full 22-driver classification grid showing position, driver, team, time. Player row highlighted.

Uses `qualifyingSimulator` to generate results. Stores grid in `weekendStore.qualifyingGrid`.

Button "Proceed to Strategy" at the bottom of results.

**Step 2: Wire into App.tsx**

**Step 3: Verify**

**Step 4: Commit**

```bash
git add src/screens/Qualifying.tsx src/App.tsx && git commit -m "feat: qualifying screen — mode select, lap animation, results"
```

---

## Task 16: Strategy Room Screen

**Files:**
- Create: `src/screens/StrategyRoom.tsx`
- Create: `src/components/DegradationChart.tsx`
- Create: `src/components/StintPlanner.tsx`
- Modify: `src/App.tsx` (add case)

**Step 1: Build DegradationChart**

Simple bar chart showing degradation curves for revealed compounds (from Practice data). X-axis = laps, Y-axis = grip. Use colored divs/bars (no chart library needed for MVP).

**Step 2: Build StintPlanner**

- List of stints, each with a compound selector (dropdown/buttons) and lap count (range slider or number input)
- "Add Pit Stop" button adds a new stint
- Shows total laps vs track total, warns if they don't match
- Validates 2-compound rule for dry weather
- Uses `strategyStore`

**Step 3: Build StrategyRoom screen**

Two-panel layout:
- Left: DegradationChart
- Right: StintPlanner
- Bottom: Predicted finish (simple calculation based on car+driver stats), "START RACE" button

**Step 4: Wire into App.tsx**

**Step 5: Verify**

**Step 6: Commit**

```bash
git add src/screens/StrategyRoom.tsx src/components/DegradationChart.tsx src/components/StintPlanner.tsx src/App.tsx && git commit -m "feat: strategy room — stint planner and degradation chart"
```

---

## Task 17: Race Screen

**Files:**
- Create: `src/screens/Race.tsx`
- Create: `src/hooks/useRaceLoop.ts`
- Create: `src/hooks/useRadioMessages.ts`
- Modify: `src/App.tsx` (add case)

**Step 1: Build useRaceLoop hook**

```ts
// setInterval at ~1000ms
// Each tick: call simulateLap(raceState) and update raceStore
// Stops when currentLap >= totalLaps or isRunning is false
```

**Step 2: Build useRadioMessages hook**

Monitors race events and generates radio messages:
- Tire grip < 30% → "Tires are critical, consider boxing"
- Safety Car deployed → "Safety Car! Great chance to pit for free"
- Weather change → "Rain incoming!" or "Track is drying up"
- Gap to position ahead < 1s → "You're within DRS range!"
- Overtake by player → "Great move! You're now P{n}"

**Step 3: Build Race screen**

Full layout as described in design doc:
- Top bar: Lap counter, weather badge, SC status
- Main area: Leaderboard (animated)
- Player car status: tire indicator, fuel bar
- Controls: Push/Neutral/Save buttons + Box Now button
- Radio alerts overlay

Initialize race state from `weekendStore.qualifyingGrid` and `strategyStore.stints`. AI drivers get auto-generated strategies.

**Step 4: Build Results view**

When race ends (currentLap >= totalLaps), show final standings with position changes from grid. "Race Again" button resets to TeamSelect.

**Step 5: Wire into App.tsx**

**Step 6: Verify full flow**

Run: `pnpm dev`
Play through: TeamSelect → Practice → Qualifying → Strategy → Race → Results → Race Again.

**Step 7: Commit**

```bash
git add src/screens/Race.tsx src/hooks/ src/App.tsx && git commit -m "feat: race screen — live simulation with leaderboard and controls"
```

---

## Task 18: Polish & Integration

**Files:**
- Various tweaks across screens and components

**Step 1: Add page transitions**

Wrap the phase router in `AnimatePresence` with fade/slide transitions between screens.

**Step 2: Add localStorage persistence**

Save best race result per team to localStorage. Show personal best on TeamSelect screen.

**Step 3: AI pit strategies**

Generate reasonable AI pit strategies based on their car stats and tire data. Currently AI runs the whole race on mediums — give them 1-2 stop strategies with varied compounds.

**Step 4: Balance testing**

Run several races manually. Tune the simulation constants:
- Lap time formula coefficients
- Overtaking difficulty thresholds
- Incident probabilities
- Tire degradation rates

Ensure top teams generally finish at the front but upsets are possible.

**Step 5: Final verification**

Run: `pnpm build`
Expected: Clean build, no errors.

Run: `pnpm test`
Expected: All engine tests pass.

**Step 6: Commit**

```bash
git add -A && git commit -m "feat: polish — transitions, persistence, AI strategies, balance"
```

---

## Summary

| Task | Description | Key Files |
|------|-------------|-----------|
| 1 | Project setup | vite.config, tailwind, deps |
| 2 | Data layer | teams, drivers, tires, tracks |
| 3 | Utility functions | random, formatTime + tests |
| 4 | Tire model | grip, degradation + tests |
| 5 | Weather engine | transitions + tests |
| 6 | Lap simulator | core formula + tests |
| 7 | Overtaking engine | gap, overtake + tests |
| 8 | Incident engine | incidents, SC + tests |
| 9 | Qualifying sim | safe/push/full-send + tests |
| 10 | Race simulator | lap-by-lap orchestrator + tests |
| 11 | Zustand stores | weekend, strategy, race |
| 12 | UI components | buttons, leaderboard, indicators |
| 13 | TeamSelect screen | team/driver selection |
| 14 | Practice screen | data hunt minigame |
| 15 | Qualifying screen | mode select + results |
| 16 | Strategy Room | stint planner + chart |
| 17 | Race screen | live sim + controls |
| 18 | Polish | transitions, persistence, balance |
