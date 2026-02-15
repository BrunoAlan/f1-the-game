# Broadcast UI All Screens — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Apply F1 TV broadcast aesthetic to all screens with shared components, driver numbers, tire icons, track mini map, and race animations.

**Architecture:** Hybrid approach — build 6 shared components first (DriverNumberBadge, TireCompoundIcon, StatusBadge, BroadcastTimingTower, TrackMiniMap, trackPaths data), then refactor each of the 8 screens to use them. CSS-only, no image assets.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Framer Motion, Zustand

**Design doc:** `docs/plans/2026-02-15-broadcast-ui-all-screens-design.md`

---

## Task 1: TireCompoundIcon component

**Files:**

- Create: `src/components/TireCompoundIcon.tsx`

**Step 1: Create the component**

```tsx
import type { TireCompound } from '../data/types'

const COMPOUND_STYLES: Record<TireCompound, { bg: string; text: string; letter: string }> = {
  soft: { bg: '#dc0000', text: '#ffffff', letter: 'S' },
  medium: { bg: '#ffd700', text: '#000000', letter: 'M' },
  hard: { bg: '#ffffff', text: '#000000', letter: 'H' },
  intermediate: { bg: '#00c853', text: '#ffffff', letter: 'I' },
  wet: { bg: '#0090ff', text: '#ffffff', letter: 'W' },
}

const SIZES = { sm: 16, md: 24, lg: 32 } as const

interface TireCompoundIconProps {
  compound: TireCompound
  size?: keyof typeof SIZES
}

export function TireCompoundIcon({ compound, size = 'md' }: TireCompoundIconProps) {
  const style = COMPOUND_STYLES[compound]
  const px = SIZES[size]
  const fontSize = size === 'sm' ? 7 : size === 'md' ? 9 : 12

  return (
    <div
      className="inline-flex items-center justify-center rounded-full font-pixel font-bold shrink-0"
      style={{
        width: px,
        height: px,
        backgroundColor: style.bg,
        color: style.text,
        fontSize,
        lineHeight: 1,
      }}
    >
      {style.letter}
    </div>
  )
}
```

**Step 2: Verify it builds**

Run: `pnpm build`
Expected: No type errors.

**Step 3: Commit**

```bash
git add src/components/TireCompoundIcon.tsx
git commit -m "feat: add TireCompoundIcon component"
```

---

## Task 2: DriverNumberBadge component

**Files:**

- Create: `src/components/DriverNumberBadge.tsx`

**Step 1: Create the component**

```tsx
const SIZES = { sm: 20, md: 28, lg: 36 } as const

interface DriverNumberBadgeProps {
  number: number
  teamColor: string
  size?: keyof typeof SIZES
}

function getContrastText(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#000000' : '#ffffff'
}

export function DriverNumberBadge({ number, teamColor, size = 'md' }: DriverNumberBadgeProps) {
  const px = SIZES[size]
  const fontSize = size === 'sm' ? 7 : size === 'md' ? 9 : 12

  return (
    <div
      className="inline-flex items-center justify-center rounded-sm font-pixel font-bold shrink-0"
      style={{
        width: px,
        height: px,
        backgroundColor: teamColor,
        color: getContrastText(teamColor),
        fontSize,
        lineHeight: 1,
      }}
    >
      {number}
    </div>
  )
}
```

**Step 2: Verify it builds**

Run: `pnpm build`
Expected: No type errors.

**Step 3: Commit**

```bash
git add src/components/DriverNumberBadge.tsx
git commit -m "feat: add DriverNumberBadge component"
```

---

## Task 3: StatusBadge component

**Files:**

- Create: `src/components/StatusBadge.tsx`

**Step 1: Create the component**

```tsx
import { motion } from 'framer-motion'

type BadgeType =
  | 'pit'
  | 'dnf'
  | 'fastest-lap'
  | 'position-up'
  | 'position-down'
  | 'safety-car'
  | 'eliminated'

interface StatusBadgeProps {
  type: BadgeType
  value?: number // for position changes (+2, -1)
}

const BADGE_CONFIG: Record<
  BadgeType,
  { bg: string; text: string; label: string; pulse?: boolean }
> = {
  pit: { bg: '#ffd700', text: '#000000', label: 'PIT', pulse: true },
  dnf: { bg: '#ff2a6d', text: '#ffffff', label: 'DNF' },
  'fastest-lap': { bg: '#a855f7', text: '#ffffff', label: 'FL', pulse: true },
  'position-up': { bg: '#00ff41', text: '#000000', label: '' },
  'position-down': { bg: '#ff2a6d', text: '#ffffff', label: '' },
  'safety-car': { bg: '#ffd700', text: '#000000', label: 'SC' },
  eliminated: { bg: '#ff2a6d', text: '#ffffff', label: 'OUT' },
}

export function StatusBadge({ type, value }: StatusBadgeProps) {
  const config = BADGE_CONFIG[type]

  const label =
    type === 'position-up'
      ? `▲${value ?? ''}`
      : type === 'position-down'
        ? `▼${value ?? ''}`
        : config.label

  const badge = (
    <span
      className="inline-flex items-center justify-center rounded-sm font-pixel text-[7px] px-1.5 py-0.5 leading-none"
      style={{ backgroundColor: config.bg, color: config.text }}
    >
      {label}
    </span>
  )

  if (config.pulse) {
    return (
      <motion.span
        animate={{ opacity: [1, 0.5, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {badge}
      </motion.span>
    )
  }

  if (type === 'position-up' || type === 'position-down') {
    return (
      <motion.span
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: 1.5, duration: 0.5 }}
      >
        {badge}
      </motion.span>
    )
  }

  return badge
}
```

**Step 2: Verify it builds**

Run: `pnpm build`
Expected: No type errors.

**Step 3: Commit**

```bash
git add src/components/StatusBadge.tsx
git commit -m "feat: add StatusBadge component"
```

---

## Task 4: BroadcastTimingTower component

Replaces existing `Leaderboard.tsx`. Used in Race, SprintRace, Qualifying results, and Standings.

**Files:**

- Create: `src/components/BroadcastTimingTower.tsx`

**Step 1: Create the component**

This component must be flexible — it renders differently in Race mode (gaps, status badges) vs Standings mode (points) vs Qualifying mode (times, elimination zone).

```tsx
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import type { Driver, Team } from '../data/types'
import type { TireCompound } from '../data/types'
import { DriverNumberBadge } from './DriverNumberBadge'
import { StatusBadge } from './StatusBadge'
import { TireCompoundIcon } from './TireCompoundIcon'

export interface TimingEntry {
  driverId: string
  teamId: string
  position: number
  // Time/points display
  value: string // formatted gap, time, or points
  // Optional status
  status?: 'pit' | 'dnf' | 'fastest-lap' | 'safety-car' | 'eliminated'
  // Position change (positive = gained, negative = lost)
  positionChange?: number
  // Tire compound (shown after pit stop)
  tireCompound?: TireCompound
  // Whether this entry is inactive (DNF, eliminated)
  inactive?: boolean
}

interface BroadcastTimingTowerProps {
  entries: TimingEntry[]
  drivers: Driver[]
  teams: Team[]
  playerDriverId: string
  /** Layout group ID for Framer Motion (unique per instance) */
  layoutId?: string
}

export function BroadcastTimingTower({
  entries,
  drivers,
  teams,
  playerDriverId,
  layoutId = 'timing-tower',
}: BroadcastTimingTowerProps) {
  const driverMap = new Map(drivers.map((d) => [d.id, d]))
  const teamMap = new Map(teams.map((t) => [t.id, t]))

  return (
    <LayoutGroup id={layoutId}>
      <div className="flex flex-col gap-px font-pixel text-[9px]">
        <AnimatePresence mode="popLayout">
          {entries.map((entry) => {
            const driver = driverMap.get(entry.driverId)
            const team = teamMap.get(entry.teamId)
            if (!driver || !team) return null

            const isPlayer = entry.driverId === playerDriverId

            return (
              <motion.div
                key={entry.driverId}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: entry.inactive ? 0.4 : 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className={`flex items-center gap-1.5 px-2 py-1.5 border-l-[3px] ${
                  isPlayer ? 'bg-f1-surface' : entry.inactive ? 'bg-f1-bg/50' : 'bg-f1-surface/60'
                }`}
                style={{
                  borderLeftColor: team.primaryColor,
                  boxShadow: isPlayer
                    ? `inset 0 0 20px ${team.primaryColor}15, 0 0 8px ${team.primaryColor}10`
                    : undefined,
                }}
              >
                {/* Position */}
                <span
                  className="w-5 h-5 flex items-center justify-center rounded-sm text-[8px] font-bold shrink-0"
                  style={{
                    backgroundColor: `${team.primaryColor}30`,
                    color: entry.inactive ? '#ffffff50' : '#ffffff',
                  }}
                >
                  {entry.inactive && entry.status === 'dnf' ? '--' : entry.position}
                </span>

                {/* Driver number */}
                <DriverNumberBadge number={driver.number} teamColor={team.primaryColor} size="sm" />

                {/* Driver name + team */}
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <span className={`${isPlayer ? 'text-white' : 'text-f1-text'} truncate`}>
                    {driver.shortName}
                  </span>
                  <span className="text-f1-text/30 text-[7px] truncate hidden sm:inline">
                    {team.abbreviation}
                  </span>
                </div>

                {/* Tire compound (if provided) */}
                {entry.tireCompound && !entry.inactive && (
                  <TireCompoundIcon compound={entry.tireCompound} size="sm" />
                )}

                {/* Time/gap/points */}
                <span className="text-f1-text/70 w-[72px] text-right tabular-nums shrink-0">
                  {entry.value}
                </span>

                {/* Status badges */}
                <div className="w-10 flex justify-end shrink-0">
                  {entry.status && <StatusBadge type={entry.status} />}
                  {!entry.status && entry.positionChange && entry.positionChange > 0 && (
                    <StatusBadge type="position-up" value={entry.positionChange} />
                  )}
                  {!entry.status && entry.positionChange && entry.positionChange < 0 && (
                    <StatusBadge type="position-down" value={Math.abs(entry.positionChange)} />
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  )
}
```

**Step 2: Verify it builds**

Run: `pnpm build`
Expected: No type errors.

**Step 3: Commit**

```bash
git add src/components/BroadcastTimingTower.tsx
git commit -m "feat: add BroadcastTimingTower component"
```

---

## Task 5: Track SVG paths data

**Files:**

- Create: `src/data/trackPaths.ts`

**Step 1: Create track path data for all 24 circuits**

Each track gets a simplified but recognizable SVG path. The `viewBox` is standardized to `0 0 200 200`. The `path` is a simplified outline of the circuit. `startLine` is a percentage (0-1) along the path where the start/finish straight is.

```typescript
export interface TrackPath {
  trackId: string
  viewBox: string
  path: string
  startLine: number
}

export const trackPaths: TrackPath[] = [
  {
    trackId: 'australia',
    viewBox: '0 0 200 200',
    path: 'M60,170 L40,150 Q20,130 25,100 Q30,70 50,50 Q65,35 90,30 Q120,25 145,35 Q165,45 175,70 Q185,95 175,120 Q165,140 145,155 Q125,165 110,170 Q95,175 80,170 Z',
    startLine: 0,
  },
  {
    trackId: 'china',
    viewBox: '0 0 200 200',
    path: 'M30,120 Q30,80 60,60 Q80,45 100,50 Q120,55 120,70 Q120,85 100,85 Q80,85 80,70 Q80,55 100,50 M100,50 Q140,40 165,60 Q185,80 180,110 Q175,140 150,160 Q120,175 80,170 Q50,165 35,145 Q25,130 30,120 Z',
    startLine: 0,
  },
  {
    trackId: 'japan',
    viewBox: '0 0 200 200',
    path: 'M30,100 Q30,60 60,45 Q80,35 100,40 Q110,42 115,55 Q120,68 110,75 Q100,82 95,70 Q90,58 100,50 M100,40 Q130,30 160,45 Q180,60 180,90 Q180,120 160,140 Q140,160 110,165 Q80,170 55,155 Q35,140 30,115 Z',
    startLine: 0,
  },
  {
    trackId: 'bahrain',
    viewBox: '0 0 200 200',
    path: 'M80,170 L80,130 L60,130 L60,100 L80,100 L80,50 Q80,30 100,30 L140,30 Q160,30 160,50 L160,80 L140,80 L140,100 L160,100 L160,140 Q160,170 140,170 Z',
    startLine: 0,
  },
  {
    trackId: 'saudi-arabia',
    viewBox: '0 0 200 200',
    path: 'M170,180 L170,140 Q170,120 160,110 Q150,100 140,90 Q130,80 130,60 Q130,30 150,20 Q160,15 170,20 L170,20 Q180,30 170,40 Q160,50 140,50 Q110,50 90,60 Q70,70 60,90 Q50,110 50,130 Q50,160 60,170 Q70,180 90,180 Z',
    startLine: 0,
  },
  {
    trackId: 'miami',
    viewBox: '0 0 200 200',
    path: 'M40,60 L140,60 Q160,60 160,80 L160,100 L120,100 L120,120 L160,120 L160,150 Q160,170 140,170 L60,170 Q40,170 40,150 Z',
    startLine: 0,
  },
  {
    trackId: 'canada',
    viewBox: '0 0 200 200',
    path: 'M60,170 L40,150 L50,120 L30,100 L50,80 L40,50 L70,30 L100,40 L130,30 L160,50 L150,80 Q165,100 155,120 L170,150 L140,170 Q100,180 60,170 Z',
    startLine: 0,
  },
  {
    trackId: 'monaco',
    viewBox: '0 0 200 200',
    path: 'M160,60 L160,40 Q160,25 145,25 L60,25 Q40,25 40,45 L40,80 Q40,100 60,110 L100,110 L100,140 Q100,160 120,160 L160,160 L160,140 Q170,120 170,100 Q170,80 160,60 Z',
    startLine: 0,
  },
  {
    trackId: 'spain',
    viewBox: '0 0 200 200',
    path: 'M40,100 L40,50 Q40,30 60,30 L120,30 Q140,30 150,45 L165,70 Q175,85 165,100 L140,100 L140,120 Q140,140 120,150 L80,165 Q50,175 40,155 Q35,130 40,100 Z',
    startLine: 0,
  },
  {
    trackId: 'austria',
    viewBox: '0 0 200 200',
    path: 'M50,170 L50,60 Q50,30 80,30 L160,30 Q175,30 175,50 L175,80 Q175,100 155,105 L100,120 Q75,130 70,150 Q65,165 50,170 Z',
    startLine: 0,
  },
  {
    trackId: 'great-britain',
    viewBox: '0 0 200 200',
    path: 'M40,100 L60,60 Q70,40 90,35 L130,30 Q155,28 165,45 L175,70 Q180,85 170,100 Q160,110 145,115 L120,120 Q105,125 100,140 Q95,155 80,160 L55,165 Q35,165 30,145 Q25,125 40,100 Z',
    startLine: 0,
  },
  {
    trackId: 'belgium',
    viewBox: '0 0 200 200',
    path: 'M30,170 L30,130 L50,110 L40,80 L55,50 Q65,30 85,30 L110,35 L140,25 Q160,20 170,40 L175,70 Q180,100 165,120 L145,140 Q130,155 120,170 Q110,180 80,175 Z',
    startLine: 0,
  },
  {
    trackId: 'hungary',
    viewBox: '0 0 200 200',
    path: 'M50,170 L35,140 Q25,120 35,100 L55,70 Q65,50 85,40 Q105,30 125,35 Q150,40 165,60 Q175,80 170,110 L160,140 Q150,165 125,170 Q100,175 75,173 Z',
    startLine: 0,
  },
  {
    trackId: 'netherlands',
    viewBox: '0 0 200 200',
    path: 'M60,170 L40,130 Q30,100 45,75 Q60,50 90,40 Q110,35 130,40 Q155,50 165,75 Q175,100 165,130 L150,160 Q140,170 120,173 Q90,178 60,170 Z',
    startLine: 0,
  },
  {
    trackId: 'italy',
    viewBox: '0 0 200 200',
    path: 'M40,160 L40,60 L60,60 L60,40 Q60,25 80,25 L160,25 Q175,25 175,45 L175,60 L155,60 L155,80 L175,80 L175,140 Q175,165 150,170 L80,170 Q55,170 40,160 Z',
    startLine: 0,
  },
  {
    trackId: 'madrid',
    viewBox: '0 0 200 200',
    path: 'M60,170 L40,140 L40,70 Q40,40 70,35 L140,30 Q170,30 175,60 L175,100 L150,100 L150,130 Q150,160 125,165 Z',
    startLine: 0,
  },
  {
    trackId: 'azerbaijan',
    viewBox: '0 0 200 200',
    path: 'M160,180 L160,30 Q160,15 145,15 L80,15 Q60,15 55,30 L50,60 Q45,80 55,90 L80,100 Q95,105 90,120 L80,150 Q70,175 90,180 Z',
    startLine: 0,
  },
  {
    trackId: 'singapore',
    viewBox: '0 0 200 200',
    path: 'M40,80 L80,40 L120,40 L120,60 L100,80 L140,80 L160,60 L170,80 L170,140 Q170,165 145,170 L60,170 Q35,170 35,145 L35,100 Z',
    startLine: 0,
  },
  {
    trackId: 'united-states',
    viewBox: '0 0 200 200',
    path: 'M40,100 L60,50 Q70,30 95,30 L130,35 Q145,38 155,50 L170,80 Q180,100 170,120 L155,140 L130,135 L110,150 L80,145 L60,160 Q40,170 35,145 Q30,120 40,100 Z',
    startLine: 0,
  },
  {
    trackId: 'mexico',
    viewBox: '0 0 200 200',
    path: 'M40,100 L40,50 L120,50 Q140,50 140,70 L140,85 Q140,95 130,95 Q120,95 120,85 L120,75 Q120,65 130,65 M140,70 L160,50 L175,70 L175,140 Q175,165 150,170 L60,170 Q40,170 40,150 Z',
    startLine: 0,
  },
  {
    trackId: 'brazil',
    viewBox: '0 0 200 200',
    path: 'M170,140 L140,170 Q120,180 100,170 L50,140 Q30,130 30,105 Q30,80 50,65 L80,45 Q100,35 120,40 L155,55 Q175,65 175,90 Q175,115 170,140 Z',
    startLine: 0,
  },
  {
    trackId: 'las-vegas',
    viewBox: '0 0 200 200',
    path: 'M40,170 L40,60 Q40,30 70,30 L80,30 L80,80 L120,80 L120,30 L150,30 Q175,30 175,60 L175,170 L140,170 L140,120 L75,120 L75,170 Z',
    startLine: 0,
  },
  {
    trackId: 'qatar',
    viewBox: '0 0 200 200',
    path: 'M50,170 L30,140 Q20,120 30,100 L50,70 L70,50 Q90,30 120,30 Q150,30 170,50 Q185,70 180,100 L170,130 Q160,155 140,165 Q120,175 90,173 Z',
    startLine: 0,
  },
  {
    trackId: 'abu-dhabi',
    viewBox: '0 0 200 200',
    path: 'M60,170 L40,140 L40,80 Q40,40 75,35 L100,30 Q130,25 150,40 L170,60 Q185,80 175,105 L160,130 Q150,150 130,160 L100,170 Z',
    startLine: 0,
  },
]

export function getTrackPath(trackId: string): TrackPath | undefined {
  return trackPaths.find((tp) => tp.trackId === trackId)
}
```

**Step 2: Verify it builds**

Run: `pnpm build`
Expected: No type errors.

**Step 3: Commit**

```bash
git add src/data/trackPaths.ts
git commit -m "feat: add SVG track path data for all 24 circuits"
```

---

## Task 6: TrackMiniMap component

**Files:**

- Create: `src/components/TrackMiniMap.tsx`

**Step 1: Create the component**

```tsx
import { useMemo } from 'react'
import type { Team } from '../data/types'
import { getTrackPath } from '../data/trackPaths'

interface CarDot {
  driverId: string
  teamId: string
  /** 0-1, how far along the track */
  progress: number
  dnf?: boolean
}

interface TrackMiniMapProps {
  trackId: string
  cars: CarDot[]
  teams: Team[]
  playerDriverId: string
  className?: string
}

/**
 * Get a point at a specific percentage along an SVG path.
 */
function getPointAtPercent(pathEl: SVGPathElement, percent: number) {
  const length = pathEl.getTotalLength()
  const point = pathEl.getPointAtLength(length * percent)
  return { x: point.x, y: point.y }
}

export function TrackMiniMap({
  trackId,
  cars,
  teams,
  playerDriverId,
  className = '',
}: TrackMiniMapProps) {
  const trackPath = getTrackPath(trackId)
  const teamMap = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams])

  if (!trackPath) return null

  // We use a hidden path to compute positions, but render car dots via CSS positioning.
  // Since getPointAtLength requires a DOM element, we use a ref-based approach.
  return (
    <svg viewBox={trackPath.viewBox} className={`w-full h-full ${className}`}>
      {/* Track outline */}
      <path
        id={`track-${trackId}`}
        d={trackPath.path}
        fill="none"
        stroke="#2a2a38"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Track highlight */}
      <path
        d={trackPath.path}
        fill="none"
        stroke="#3a3a4a"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Car dots — positioned using CSS offset-path */}
      {cars
        .filter((c) => !c.dnf)
        .map((car) => {
          const team = teamMap.get(car.teamId)
          if (!team) return null
          const isPlayer = car.driverId === playerDriverId

          return (
            <circle
              key={car.driverId}
              r={isPlayer ? 5 : 3.5}
              fill={team.primaryColor}
              stroke={isPlayer ? '#ffffff' : 'none'}
              strokeWidth={isPlayer ? 1.5 : 0}
              opacity={0.9}
            >
              {/* Animate position along the track path using SMIL or we offset via JS */}
            </circle>
          )
        })}
    </svg>
  )
}
```

> **Note for implementer:** The car dot positioning along the SVG path requires using a ref to the `<path>` element and calling `getPointAtLength` in an effect or memo. The approach:
>
> 1. Use a `useRef` on the track path element.
> 2. Use `useEffect` or `useMemo` to compute `{x, y}` positions for each car by calling `pathRef.current.getPointAtLength(pathRef.current.getTotalLength() * car.progress)`.
> 3. Set `cx` and `cy` on each `<circle>` accordingly.
>
> This is a simplification — the actual implementation should use a ref + state pattern to position dots correctly. Below is the refined version:

**Refined implementation using ref:**

```tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Team } from '../data/types'
import { getTrackPath } from '../data/trackPaths'

interface CarDot {
  driverId: string
  teamId: string
  progress: number
  dnf?: boolean
}

interface TrackMiniMapProps {
  trackId: string
  cars: CarDot[]
  teams: Team[]
  playerDriverId: string
  className?: string
}

export function TrackMiniMap({
  trackId,
  cars,
  teams,
  playerDriverId,
  className = '',
}: TrackMiniMapProps) {
  const trackPath = getTrackPath(trackId)
  const pathRef = useRef<SVGPathElement>(null)
  const [pathReady, setPathReady] = useState(false)
  const teamMap = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams])

  useEffect(() => {
    if (pathRef.current) setPathReady(true)
  }, [])

  if (!trackPath) return null

  const activeCars = cars.filter((c) => !c.dnf)

  function getPosition(progress: number): { x: number; y: number } {
    if (!pathRef.current) return { x: 0, y: 0 }
    const length = pathRef.current.getTotalLength()
    const point = pathRef.current.getPointAtLength(length * (progress % 1))
    return { x: point.x, y: point.y }
  }

  return (
    <svg viewBox={trackPath.viewBox} className={`w-full h-full ${className}`}>
      {/* Track outline (shadow) */}
      <path
        d={trackPath.path}
        fill="none"
        stroke="#2a2a38"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Track surface */}
      <path
        ref={pathRef}
        d={trackPath.path}
        fill="none"
        stroke="#4a4a5a"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Car dots */}
      {pathReady &&
        activeCars.map((car) => {
          const team = teamMap.get(car.teamId)
          if (!team) return null
          const isPlayer = car.driverId === playerDriverId
          const pos = getPosition(car.progress)

          return (
            <circle
              key={car.driverId}
              cx={pos.x}
              cy={pos.y}
              r={isPlayer ? 5 : 3.5}
              fill={team.primaryColor}
              stroke={isPlayer ? '#ffffff' : 'none'}
              strokeWidth={isPlayer ? 1.5 : 0}
              opacity={0.9}
            />
          )
        })}
    </svg>
  )
}
```

**Step 2: Verify it builds**

Run: `pnpm build`
Expected: No type errors.

**Step 3: Commit**

```bash
git add src/components/TrackMiniMap.tsx
git commit -m "feat: add TrackMiniMap component with SVG circuit outlines"
```

---

## Task 7: Refactor HQ screen

**Files:**

- Modify: `src/screens/HQ.tsx`

**Goal:** Replace all `slate-*` colors with broadcast palette. Add sticky header with team info/budget, sticky bottom with START button. Improve tab styling. Add `DriverNumberBadge` and `BroadcastTimingTower` in Standings tab. Add `TireCompoundIcon` in Components tab. Add `TrackMiniMap` in Next Race tab.

**Step 1: Refactor the screen**

Key changes:

1. **Header bar:** Sticky top with team badge, race counter, budget/RP. Use `bg-f1-surface border-b` with team color accent.
2. **Tab bar:** Active tab gets `border-b-2` in team color instead of `border-f1-accent`.
3. **R&D tab:** Replace `bg-slate-800` cards with `bg-f1-surface`. Node states use team color for available, green for unlocked, gray for locked. CSS connector lines between nodes.
4. **Components tab:** Replace `bg-slate-800` with `bg-f1-surface`. Health bars use inline gradient (green→yellow→red). Add pulsing border if health < 30%.
5. **Sponsors tab:** Replace backgrounds. Payout in `text-f1-warning`. Duration countdown visible.
6. **Standings tab:** Replace inline standings with two `BroadcastTimingTower` instances (drivers + constructors). Each entry uses points as `value`.
7. **Next Race tab:** Add `TrackMiniMap` as static SVG preview. Replace backgrounds.
8. **Bottom bar:** Sticky with `position: sticky; bottom: 0`. START RACE WEEKEND button in team color.
9. **All backgrounds:** Replace every `bg-slate-800`, `bg-slate-700`, `bg-slate-900` with `bg-f1-surface`, `bg-f1-bg`, or `bg-f1-surface/60`.

**Step 2: Verify it builds and renders**

Run: `pnpm build`
Run: `pnpm dev` → navigate to HQ screen, verify all 5 tabs render correctly.

**Step 3: Commit**

```bash
git add src/screens/HQ.tsx
git commit -m "feat: refactor HQ screen to broadcast UI aesthetic"
```

---

## Task 8: Refactor Practice screen

**Files:**

- Modify: `src/screens/Practice.tsx`

**Goal:** Replace slate colors with broadcast palette. Add `TireCompoundIcon` to tire data cards. Improve locked/revealed card states. Sticky bottom bar.

**Step 1: Refactor**

Key changes:

1. **Header:** Session name + track + weather badge on `bg-f1-surface` with `border-b border-f1-border`.
2. **Progress bar:** Team color fill instead of generic.
3. **Tire cards:** Each card gets `TireCompoundIcon` (lg) as visual identifier. Locked cards: `bg-f1-bg/50 opacity-60`, data shows `???`. Revealed cards: `bg-f1-surface` with border in compound color (use `tireColors` from `src/data/tires.ts`), badge "REVEALED" in green.
4. **Reveal animation:** When a compound reveals, add a Framer Motion `initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}` on the data values.
5. **Bottom bar:** Sticky. Session counter + SKIP button.
6. **All backgrounds:** Replace `slate-*` with broadcast palette.

**Step 2: Verify**

Run: `pnpm build`
Run: `pnpm dev` → go through Practice, verify tire reveals work.

**Step 3: Commit**

```bash
git add src/screens/Practice.tsx
git commit -m "feat: refactor Practice screen to broadcast UI with TireCompoundIcons"
```

---

## Task 9: Refactor Qualifying screen

**Files:**

- Modify: `src/screens/Qualifying.tsx`

**Goal:** Broadcast palette. Sector colors (purple/green/yellow). `BroadcastTimingTower` for results. Elimination zone styling. `DriverNumberBadge` visible.

**Step 1: Refactor**

Key changes:

1. **Header:** Session label (Q1/Q2/Q3) + track + weather. `bg-f1-surface`.
2. **Risk selection:** 3 cards with left border in risk color (green/yellow/red). Selected card: glow + brighter bg. `bg-f1-surface` base.
3. **Sector reveals:** Sector times colored: `#a855f7` (purple, session best), `#00ff41` (green, personal best), `#ffd700` (yellow, slower). Central timer at 24px.
4. **Results:** Replace inline grid with `BroadcastTimingTower`. Entries beyond elimination cutoff get `status: 'eliminated'` and `inactive: true`. Player entry highlighted.
5. **Q transition:** Between Q1→Q2→Q3, use existing wipe. Add session name display.
6. **Bottom:** Elimination info + GO/CONTINUE button in team color. Sticky.
7. **All backgrounds:** Replace `slate-*`.

**Step 2: Verify**

Run: `pnpm build`
Run: `pnpm dev` → go through full Q1/Q2/Q3 flow.

**Step 3: Commit**

```bash
git add src/screens/Qualifying.tsx
git commit -m "feat: refactor Qualifying screen to broadcast UI with sector colors"
```

---

## Task 10: Refactor SprintShootout screen

**Files:**

- Modify: `src/screens/SprintShootout.tsx`

**Goal:** Same changes as Qualifying (Task 9) plus yellow SPRINT badge in header.

**Step 1: Refactor**

Apply identical changes as Qualifying. Additional:

1. **Header:** Add `<StatusBadge type="safety-car" />` repurposed as a custom sprint badge — or a simple `<span className="bg-f1-warning text-black font-pixel text-[7px] px-1.5 py-0.5 rounded-sm">SPRINT</span>`.
2. **Session labels:** SQ1/SQ2/SQ3 instead of Q1/Q2/Q3.
3. **All backgrounds:** Replace `slate-*`.

**Step 2: Verify**

Run: `pnpm build`

**Step 3: Commit**

```bash
git add src/screens/SprintShootout.tsx
git commit -m "feat: refactor SprintShootout screen to broadcast UI"
```

---

## Task 11: Refactor StrategyRoom screen

**Files:**

- Modify: `src/screens/StrategyRoom.tsx`

**Goal:** Broadcast palette. `TireCompoundIcon` in stint cards and compound selectors. Broadcast-styled degradation chart. Sticky bottom.

**Step 1: Refactor**

Key changes:

1. **Header:** "STRATEGY ROOM" + track name + total laps. `bg-f1-surface`.
2. **Degradation chart (left column):** Replace `bg-slate-*` with `bg-f1-surface`. Chart grid lines in `#2a2a38`. Compound curves use colors from `tireColors`. Unrevealed compounds: dashed gray lines.
3. **Stint planner (right column):** Each stint card gets `TireCompoundIcon` (md) next to compound name. Left border in compound color. Slider styled with team color thumb. `bg-f1-surface` cards.
4. **Compound selector:** Show `TireCompoundIcon` buttons to cycle compounds.
5. **Validation indicators:** ✓ in `text-f1-success`, ✗ in `text-f1-danger`.
6. **Bottom bar:** Sticky. Compound life summary (each with `TireCompoundIcon` sm) + START RACE button in team color.
7. **All backgrounds:** Replace `slate-*`.

**Step 2: Verify**

Run: `pnpm build`
Run: `pnpm dev` → navigate to StrategyRoom, add/edit stints.

**Step 3: Commit**

```bash
git add src/screens/StrategyRoom.tsx
git commit -m "feat: refactor StrategyRoom to broadcast UI with TireCompoundIcons"
```

---

## Task 12: Refactor Race screen

This is the most complex refactor. Adds BroadcastTimingTower, TrackMiniMap, sticky action bar, and all race animations.

**Files:**

- Modify: `src/screens/Race.tsx`

**Goal:** 2-column layout (timing tower + player panel). TrackMiniMap with moving cars. Sticky bottom action bar. All race animations (overtake, FL, PIT, DNF, SC).

**Step 1: Refactor layout**

Key changes:

1. **Sticky header:** Track name, LAP counter, weather badge, race status flag. `bg-f1-surface`. During safety car: `bg-f1-warning text-black`.
2. **Main area — 2 columns:**
   - **Left (flex-1):** `BroadcastTimingTower` with 20 entries. Build entries from `raceState.cars`:
     - Sort by `cumulativeTime` for active, DNFs at bottom.
     - `value`: format gap to leader (`+X.Xs`) or "LEADER".
     - `status`: `'pit'` if `car.pitting`, `'dnf'` if `car.dnf`, `'fastest-lap'` for fastest lap holder.
     - `tireCompound`: `car.tireCompound`.
     - `positionChange`: track previous positions in a ref, compute delta each lap.
     - `inactive`: `car.dnf`.
   - **Right (w-64 on desktop, hidden on mobile < 768px):**
     - `TrackMiniMap` at top. Cars progress: `car.currentLap / totalLaps` (approximate — use cumulative time ratios for more precision within a lap).
     - Player info below: position (large, 20px), gap to car ahead, `TireCompoundIcon` + laps on tire, fuel bar.
3. **Sticky bottom action bar:** `position: sticky; bottom: 0; z-index: 10`. `bg-f1-surface border-t border-f1-border`.
   - Mode buttons: SAVE (green outline/fill), NEUTRAL (yellow), PUSH (red). Active = filled background, inactive = outline only. Use `PixelButton` with custom styling or inline buttons.
   - BOX NOW button on the right. On click: change label to "BOXING..." with compound selection if needed.
4. **Safety car:** When `raceState.safetyCar`, header bg becomes `bg-f1-warning`, text black. All timing tower entries get SC indicator.
5. **DNF animation:** Track when a car transitions to `dnf: true` → trigger red flash on that row (handled by BroadcastTimingTower's `inactive` prop triggering opacity change).
6. **Race Results overlay:** When race ends, overlay on top with results. Replace `bg-slate-*` with `bg-f1-bg/95`. Show points, money, RP, component wear, sponsor results. CONTINUE button.
7. **All backgrounds:** Replace every `slate-*`.

**Step 2: Position change tracking**

Add a `useRef` to track previous positions:

```tsx
const prevPositions = useRef<Map<string, number>>(new Map())

// In the render/effect that builds timing entries:
const currentPositions = new Map(sortedCars.map((car, i) => [car.driverId, i + 1]))
const positionChanges = new Map<string, number>()
for (const [driverId, pos] of currentPositions) {
  const prev = prevPositions.current.get(driverId)
  if (prev !== undefined && prev !== pos) {
    positionChanges.set(driverId, prev - pos) // positive = gained positions
  }
}
prevPositions.current = currentPositions
```

**Step 3: Verify**

Run: `pnpm build`
Run: `pnpm dev` → run a full race, verify timing tower, track map, action bar, animations.

**Step 4: Commit**

```bash
git add src/screens/Race.tsx
git commit -m "feat: refactor Race screen with BroadcastTimingTower, TrackMiniMap, sticky controls"
```

---

## Task 13: Refactor SprintRace screen

**Files:**

- Modify: `src/screens/SprintRace.tsx`

**Goal:** Same broadcast treatment as Race (Task 12) with sprint-specific differences.

**Step 1: Refactor**

Apply same changes as Race. Additional:

1. **Header:** Yellow SPRINT badge (same as SprintShootout).
2. **Results:** Simpler — no component wear, no sponsor objectives. Sprint scoring display.
3. **All backgrounds:** Replace `slate-*`.

Since SprintRace shares much code with Race, consider extracting shared logic into the components (BroadcastTimingTower already handles most of it). The screen-level changes are mostly layout and header differences.

**Step 2: Verify**

Run: `pnpm build`

**Step 3: Commit**

```bash
git add src/screens/SprintRace.tsx
git commit -m "feat: refactor SprintRace screen to broadcast UI"
```

---

## Task 14: Refactor SeasonEnd screen

**Files:**

- Modify: `src/screens/SeasonEnd.tsx`

**Goal:** Champions section, stat cards grid, `BroadcastTimingTower` for final standings, confetti animation for player champion.

**Step 1: Refactor**

Key changes:

1. **Header:** "2026 SEASON COMPLETE" centered, `bg-f1-surface`.
2. **Champions section:**
   - WDC card: `DriverNumberBadge` (lg) + driver name + team + points. Left border in champion's team color. `bg-f1-surface`.
   - WCC card: `TeamColorBadge` + team name + points.
   - If player is champion: card gets golden glow `box-shadow: 0 0 20px #ffd700`.
3. **Your Season stat cards:** Grid of 3-4 per row. Each card: `bg-f1-surface`, number in team color (16-20px), label in `text-f1-text/50`. Stats: position, wins, podiums, points, money, RP. Stagger entrance with Framer Motion.
4. **Standings:** Two `BroadcastTimingTower` (drivers + constructors). On mobile: tabs to switch. Player row highlighted.
5. **Confetti (if champion):** CSS-only confetti — 20 `<motion.div>` squares with random colors, `initial={{ y: -20, x: random, rotate: 0 }}`, `animate={{ y: window height, rotate: random }}`, `transition={{ duration: 2-3s, delay: random }}`. Absolute positioned, pointer-events-none.
6. **Bottom:** START NEW SEASON button in team color. Sticky.
7. **All backgrounds:** Replace `slate-*`.

**Step 2: Verify**

Run: `pnpm build`

**Step 3: Commit**

```bash
git add src/screens/SeasonEnd.tsx
git commit -m "feat: refactor SeasonEnd screen to broadcast UI with champions display"
```

---

## Task 15: Remove old Leaderboard component (cleanup)

**Files:**

- Modify: `src/screens/Race.tsx` — verify no import of `Leaderboard`
- Modify: `src/screens/SprintRace.tsx` — verify no import of `Leaderboard`
- Delete: `src/components/Leaderboard.tsx` (if no longer imported anywhere)

**Step 1: Search for remaining usages**

Search for `from '../components/Leaderboard'` or `from './Leaderboard'` in all files. If none remain after Tasks 12-13, delete the file.

**Step 2: Remove if unused**

```bash
# Only if grep confirms no remaining imports
rm src/components/Leaderboard.tsx
```

**Step 3: Verify**

Run: `pnpm build`
Expected: No errors — Leaderboard is fully replaced by BroadcastTimingTower.

**Step 4: Commit**

```bash
git add -A
git commit -m "refactor: remove old Leaderboard component, replaced by BroadcastTimingTower"
```

---

## Task 16: Final polish and consistency pass

**Files:**

- All screen and component files

**Step 1: Search for remaining slate colors**

Search all `src/` files for `slate-` class usage. Replace any remaining with broadcast palette equivalents.

**Step 2: Verify full game flow**

Run: `pnpm dev`
Play through: Team Select → HQ (all 5 tabs) → Practice → Qualifying → Strategy → Race → back to HQ. Verify:

- No slate colors remain
- All driver numbers visible
- Tire compound icons consistent
- Track mini map renders in Race
- Action bar stays sticky during race
- Animations work (overtake, FL, PIT, DNF)

**Step 3: Build check**

Run: `pnpm build`
Run: `pnpm lint`
Expected: No errors.

**Step 4: Commit**

```bash
git add -A
git commit -m "fix: final broadcast UI consistency pass, remove remaining slate colors"
```
