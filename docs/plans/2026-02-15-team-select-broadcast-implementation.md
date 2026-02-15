# Team Select Broadcast UI Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the Team Select screen with F1 TV broadcast aesthetics — CSS-only team identity, horizontal card layout, broadcast-style stat bars, and team-color transitions.

**Architecture:** Add new broadcast color tokens to the existing Tailwind v4 `@theme` block. Build 3 small presentational components (`TeamColorBadge`, `BroadcastStatBar`, `TeamSelectCard`), then rewrite the `TeamSelect` screen to compose them. Add a team abbreviation map to team data. Keep all existing game logic and stores unchanged.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4 (`@theme` directive), Framer Motion, Vitest

---

## Task 1: Add Broadcast Color Tokens to Theme

**Files:**

- Modify: `src/styles/index.css`

**Step 1: Add broadcast color tokens to the `@theme` block**

Open `src/styles/index.css`. The existing `@theme` block has colors like `--color-f1-bg`, `--color-f1-accent`, etc. Add the new broadcast tokens inside the same `@theme` block:

```css
@theme {
  --font-pixel: 'Press Start 2P', monospace;

  /* Broadcast palette */
  --color-f1-bg: #0a0a0f;
  --color-f1-surface: #1a1a24;
  --color-f1-border: #2a2a38;
  --color-f1-text: #e2e8f0;

  /* Broadcast accents */
  --color-f1-accent: #47c7fc;
  --color-f1-danger: #ff2a6d;
  --color-f1-success: #00ff41;
  --color-f1-warning: #ffd700;
}
```

This replaces the old slate-based colors with the darker broadcast palette. The existing Tailwind utility classes (`bg-f1-bg`, `border-f1-border`, `text-f1-text`, etc.) will automatically pick up the new values — no changes needed elsewhere.

**Step 2: Verify the dev server still works**

Run: `pnpm dev`

Open browser, confirm the Team Select screen renders (it will look darker now). No broken styles.

**Step 3: Commit**

```bash
git add src/styles/index.css
git commit -m "feat: update theme to broadcast color palette"
```

---

## Task 2: Add Team Abbreviations to Team Data

**Files:**

- Modify: `src/data/types.ts`
- Modify: `src/data/teams.ts`

**Step 1: Add `abbreviation` field to the `Team` interface**

In `src/data/types.ts`, add `abbreviation: string` to the `Team` interface:

```typescript
export interface Team {
  id: string
  name: string
  abbreviation: string
  engine: string
  primaryColor: string
  accentColor: string
  topSpeed: number
  cornering: number
  reliability: number
}
```

**Step 2: Add abbreviation to each team in `src/data/teams.ts`**

Add the `abbreviation` field to each team object:

| Team ID        | Abbreviation |
| -------------- | ------------ |
| `red-bull`     | `RBR`        |
| `mclaren`      | `MCL`        |
| `mercedes`     | `MER`        |
| `ferrari`      | `FER`        |
| `aston-martin` | `AMR`        |
| `alpine`       | `ALP`        |
| `audi`         | `AUD`        |
| `cadillac`     | `CAD`        |
| `williams`     | `WIL`        |
| `racing-bulls` | `RCB`        |
| `haas`         | `HAS`        |

For example, the Red Bull entry becomes:

```typescript
{
  id: 'red-bull',
  name: 'Red Bull Racing',
  abbreviation: 'RBR',
  engine: 'Red Bull/Ford',
  // ... rest unchanged
}
```

**Step 3: Run type check to ensure nothing breaks**

Run: `pnpm build`

Expected: Clean build (no type errors). The new field is additive.

**Step 4: Commit**

```bash
git add src/data/types.ts src/data/teams.ts
git commit -m "feat: add team abbreviations to team data"
```

---

## Task 3: Create TeamColorBadge Component

**Files:**

- Create: `src/components/TeamColorBadge.tsx`

**Step 1: Create the component**

File: `src/components/TeamColorBadge.tsx`

This renders a small colored rectangle with the team's 3-letter abbreviation. It needs to choose white or dark text based on the background color luminance.

```tsx
interface TeamColorBadgeProps {
  abbreviation: string
  color: string
  size?: 'sm' | 'lg'
}

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5
}

export function TeamColorBadge({ abbreviation, color, size = 'lg' }: TeamColorBadgeProps) {
  const textColor = isLightColor(color) ? '#0a0a0f' : '#ffffff'
  const dimensions = size === 'lg' ? 'w-10 h-10' : 'w-7 h-7'
  const fontSize = size === 'lg' ? 'text-[9px]' : 'text-[7px]'

  return (
    <div
      className={`${dimensions} flex items-center justify-center font-pixel ${fontSize} rounded-sm shrink-0`}
      style={{ backgroundColor: color, color: textColor }}
    >
      {abbreviation}
    </div>
  )
}
```

**Step 2: Verify it builds**

Run: `pnpm build`

Expected: Clean build, no errors.

**Step 3: Commit**

```bash
git add src/components/TeamColorBadge.tsx
git commit -m "feat: add TeamColorBadge component"
```

---

## Task 4: Create BroadcastStatBar Component

**Files:**

- Create: `src/components/BroadcastStatBar.tsx`

**Step 1: Create the component**

File: `src/components/BroadcastStatBar.tsx`

A thin, broadcast-style stat bar. Label on left, value on right, thin filled bar between.

```tsx
interface BroadcastStatBarProps {
  label: string
  value: number
  color: string
}

export function BroadcastStatBar({ label, value, color }: BroadcastStatBarProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-pixel text-[7px] text-f1-text/40 w-7 shrink-0">{label}</span>
      <div className="flex-1 h-[3px] bg-f1-border/50 rounded-sm overflow-hidden">
        <div
          className="h-full rounded-sm transition-all duration-500"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span className="font-pixel text-[7px] text-f1-text/60 w-5 text-right shrink-0">{value}</span>
    </div>
  )
}
```

**Step 2: Verify it builds**

Run: `pnpm build`

Expected: Clean build.

**Step 3: Commit**

```bash
git add src/components/BroadcastStatBar.tsx
git commit -m "feat: add BroadcastStatBar component"
```

---

## Task 5: Create TeamSelectCard Component

**Files:**

- Create: `src/components/TeamSelectCard.tsx`

**Step 1: Create the component**

File: `src/components/TeamSelectCard.tsx`

This is the horizontal card that composes TeamColorBadge, BroadcastStatBar, and driver selection buttons. It receives all data as props and calls `onDriverClick` when a driver is selected.

```tsx
import { motion } from 'framer-motion'
import { TeamColorBadge } from './TeamColorBadge'
import { BroadcastStatBar } from './BroadcastStatBar'
import type { Team, Driver } from '../data/types'

interface TeamSelectCardProps {
  team: Team
  drivers: Driver[]
  selectedDriverId: string | null
  isTeamSelected: boolean
  onDriverClick: (teamId: string, driverId: string) => void
}

export function TeamSelectCard({
  team,
  drivers,
  selectedDriverId,
  isTeamSelected,
  onDriverClick,
}: TeamSelectCardProps) {
  return (
    <motion.div
      className="bg-f1-surface border border-f1-border rounded-sm p-3 transition-shadow duration-200"
      style={{
        borderLeftWidth: '4px',
        borderLeftColor: team.primaryColor,
        boxShadow: isTeamSelected
          ? `0 0 16px ${team.primaryColor}33, inset 0 0 8px ${team.primaryColor}11`
          : 'none',
      }}
      whileHover={{ borderColor: `${team.primaryColor}66` }}
    >
      <div className="flex items-center gap-4">
        {/* Zone 1+2: Badge + Team Name */}
        <div className="flex items-center gap-3 min-w-[160px]">
          <TeamColorBadge abbreviation={team.abbreviation} color={team.primaryColor} />
          <div>
            <div className="font-pixel text-[10px] text-f1-text">{team.name}</div>
            <div className="font-pixel text-[7px] text-f1-text/40 mt-0.5">{team.engine}</div>
          </div>
        </div>

        {/* Zone 3: Stats */}
        <div className="flex-1 flex flex-col gap-1 min-w-[140px]">
          <BroadcastStatBar label="SPD" value={team.topSpeed} color={team.primaryColor} />
          <BroadcastStatBar label="COR" value={team.cornering} color={team.primaryColor} />
          <BroadcastStatBar label="REL" value={team.reliability} color={team.primaryColor} />
        </div>

        {/* Zone 4: Driver Selection */}
        <div className="flex flex-col gap-1.5 shrink-0">
          {drivers.map((driver) => {
            const isSelected = isTeamSelected && selectedDriverId === driver.id
            return (
              <button
                key={driver.id}
                onClick={() => onDriverClick(team.id, driver.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-sm font-pixel text-[8px] transition-colors border ${
                  isSelected
                    ? 'border-current bg-current/10'
                    : 'border-f1-border/50 text-f1-text/60 hover:text-f1-text hover:border-f1-border'
                }`}
                style={isSelected ? { color: team.primaryColor } : undefined}
              >
                <span className="text-[10px]">{isSelected ? '\u25CF' : '\u25CB'}</span>
                {driver.name}
              </button>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
```

**Step 2: Verify it builds**

Run: `pnpm build`

Expected: Clean build.

**Step 3: Commit**

```bash
git add src/components/TeamSelectCard.tsx
git commit -m "feat: add TeamSelectCard component"
```

---

## Task 6: Rewrite TeamSelect Screen

**Files:**

- Modify: `src/screens/TeamSelect.tsx`

**Step 1: Rewrite the screen**

Replace the entire contents of `src/screens/TeamSelect.tsx` with the new broadcast layout. This uses the new components and adds Framer Motion staggered entrance animation.

```tsx
import { motion } from 'framer-motion'
import { teams } from '../data/teams'
import { drivers } from '../data/drivers'
import { useWeekendStore } from '../stores/weekendStore'
import { useSeasonStore } from '../stores/seasonStore'
import { PixelButton } from '../components/PixelButton'
import { TeamSelectCard } from '../components/TeamSelectCard'

export function TeamSelect() {
  const { selectedTeamId, selectedDriverId, selectTeam, setPhase } = useWeekendStore()

  const selectedTeam = teams.find((t) => t.id === selectedTeamId)

  const handleDriverClick = (teamId: string, driverId: string) => {
    selectTeam(teamId, driverId)
  }

  const handleStart = () => {
    if (selectedDriverId) {
      useSeasonStore.getState().startSeason()
      setPhase('hq')
    }
  }

  return (
    <div className="min-h-screen bg-f1-bg px-4 py-6 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-3xl flex justify-between items-baseline mb-6">
        <h1 className="font-pixel text-base text-f1-text">F1 THE GAME</h1>
        <span className="font-pixel text-[9px] text-f1-text/40">SEASON 2026</span>
      </div>

      <p className="font-pixel text-[10px] text-f1-warning mb-6 self-start max-w-3xl w-full">
        SELECT YOUR TEAM
      </p>

      {/* Team Cards */}
      <motion.div
        className="flex flex-col gap-3 w-full max-w-3xl mb-8"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.05 } },
        }}
      >
        {teams.map((team) => {
          const teamDrivers = drivers.filter((d) => d.teamId === team.id)
          return (
            <motion.div
              key={team.id}
              variants={{
                hidden: { opacity: 0, y: 12 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.3 }}
            >
              <TeamSelectCard
                team={team}
                drivers={teamDrivers}
                selectedDriverId={selectedDriverId}
                isTeamSelected={selectedTeamId === team.id}
                onDriverClick={handleDriverClick}
              />
            </motion.div>
          )
        })}
      </motion.div>

      {/* Bottom Action Bar */}
      <div className="sticky bottom-0 w-full max-w-3xl py-4 bg-f1-bg/90 backdrop-blur-sm border-t border-f1-border/30 flex justify-center">
        <PixelButton
          variant="success"
          disabled={!selectedDriverId}
          onClick={handleStart}
          className="px-8 py-4"
          style={
            selectedTeam
              ? { borderColor: selectedTeam.primaryColor, color: selectedTeam.primaryColor }
              : undefined
          }
        >
          START SEASON {'\u2192'}
        </PixelButton>
      </div>
    </div>
  )
}
```

Note: The `PixelButton` component doesn't currently accept a `style` prop. We'll handle that in the next task.

**Step 2: Verify it builds (expect possible type error on `style` prop)**

Run: `pnpm build`

If there's a type error on the `style` prop, that's expected — we fix it in Task 7.

**Step 3: Commit**

```bash
git add src/screens/TeamSelect.tsx
git commit -m "feat: rewrite TeamSelect with broadcast card layout"
```

---

## Task 7: Add `style` Prop to PixelButton

**Files:**

- Modify: `src/components/PixelButton.tsx`

**Step 1: Add `style` to the interface and pass it through**

In `src/components/PixelButton.tsx`, add `style?: React.CSSProperties` to the `PixelButtonProps` interface and pass it to the `<button>` element:

```typescript
interface PixelButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'default' | 'danger' | 'success' | 'warning'
  disabled?: boolean
  className?: string
  style?: React.CSSProperties
}
```

Then in the component, add `style={style}` to the `<button>`:

```tsx
export function PixelButton({
  children,
  onClick,
  variant = 'default',
  disabled = false,
  className = '',
  style,
}: PixelButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={style}
      className={`border-2 bg-slate-800 hover:bg-slate-700 px-4 py-3 font-pixel text-[10px] text-f1-text transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${className}`}
    >
      {children}
    </button>
  )
}
```

**Step 2: Verify clean build**

Run: `pnpm build`

Expected: Clean build, no type errors.

**Step 3: Commit**

```bash
git add src/components/PixelButton.tsx
git commit -m "feat: add style prop to PixelButton"
```

---

## Task 8: Add Screen Wipe Transition to App

**Files:**

- Modify: `src/App.tsx`

**Step 1: Enhance the existing AnimatePresence transition**

The current transition is a simple opacity fade. Update it to include a team-colored horizontal wipe effect. We'll use the `selectedTeamId` from the weekend store to get the team color.

Replace `src/App.tsx` with:

```tsx
import { AnimatePresence, motion } from 'framer-motion'
import { useWeekendStore } from './stores/weekendStore'
import { teams } from './data/teams'
import { TeamSelect } from './screens/TeamSelect'
import { HQ } from './screens/HQ'
import { Practice } from './screens/Practice'
import { Qualifying } from './screens/Qualifying'
import { SprintShootout } from './screens/SprintShootout'
import { SprintRace } from './screens/SprintRace'
import { StrategyRoom } from './screens/StrategyRoom'
import { Race } from './screens/Race'
import { SeasonEnd } from './screens/SeasonEnd'

function App() {
  const phase = useWeekendStore((s) => s.phase)
  const selectedTeamId = useWeekendStore((s) => s.selectedTeamId)
  const teamColor = teams.find((t) => t.id === selectedTeamId)?.primaryColor ?? '#47c7fc'

  function renderPhase() {
    switch (phase) {
      case 'team-select':
        return <TeamSelect />
      case 'hq':
        return <HQ />
      case 'practice':
        return <Practice />
      case 'qualifying':
        return <Qualifying />
      case 'sprint-shootout':
        return <SprintShootout />
      case 'sprint-race':
        return <SprintRace />
      case 'strategy':
        return <StrategyRoom />
      case 'race':
        return <Race />
      case 'results':
        return <Race />
      case 'season-end':
        return <SeasonEnd />
      default:
        return <TeamSelect />
    }
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={phase}
        initial={{ opacity: 0, clipPath: 'inset(0 100% 0 0)' }}
        animate={{ opacity: 1, clipPath: 'inset(0 0% 0 0)' }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
        className="min-h-screen"
        style={{ '--team-color': teamColor } as React.CSSProperties}
      >
        {renderPhase()}
      </motion.div>
    </AnimatePresence>
  )
}

export default App
```

The key change: `clipPath: 'inset(0 100% 0 0)'` → `clipPath: 'inset(0 0% 0 0)'` creates a horizontal reveal wipe effect from left to right when entering a new screen.

**Step 2: Verify it works**

Run: `pnpm dev`

Navigate through Team Select → HQ. You should see a wipe-in transition instead of a simple fade.

**Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add horizontal wipe screen transition"
```

---

## Task 9: Responsive Layout for Mobile

**Files:**

- Modify: `src/components/TeamSelectCard.tsx`

**Step 1: Update the card layout to stack on small screens**

The current card has a horizontal flex layout. On mobile (< 640px), the stats and driver buttons should stack below the team info instead of being side-by-side. Update the flex container to wrap:

In `src/components/TeamSelectCard.tsx`, change the inner `div` from:

```tsx
<div className="flex items-center gap-4">
```

to:

```tsx
<div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
```

And update the team name section to remove `min-w-[160px]` on mobile:

```tsx
<div className="flex items-center gap-3 sm:min-w-[160px]">
```

And the stats section:

```tsx
<div className="flex-1 flex flex-col gap-1 sm:min-w-[140px]">
```

**Step 2: Verify on mobile viewport**

Run: `pnpm dev`

Open browser dev tools, toggle to mobile viewport (375px width). Confirm cards stack properly.

**Step 3: Commit**

```bash
git add src/components/TeamSelectCard.tsx
git commit -m "feat: make TeamSelectCard responsive for mobile"
```

---

## Task 10: Visual QA and Final Polish

**Files:**

- Possibly: `src/components/TeamSelectCard.tsx`, `src/screens/TeamSelect.tsx`

**Step 1: Run the dev server and visually verify**

Run: `pnpm dev`

Check:

- [ ] All 11 teams render with correct colors and abbreviations
- [ ] Clicking a driver selects both team and driver
- [ ] Selected card shows team-color glow
- [ ] START SEASON button is disabled until driver selected
- [ ] START SEASON button text/border changes to team color when driver selected
- [ ] Stagger animation plays on page load
- [ ] Screen wipe transition works going to HQ
- [ ] Mobile layout stacks correctly
- [ ] No broken styles or overlapping text

**Step 2: Run full test suite**

Run: `pnpm test`

Expected: All existing tests pass. No regressions.

**Step 3: Run build**

Run: `pnpm build`

Expected: Clean build, no errors.

**Step 4: Fix any issues found**

If anything is off, fix it in the relevant file.

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete Team Select broadcast UI redesign"
```

---

## Task Summary

| Task | Description                   | Files                                    |
| ---- | ----------------------------- | ---------------------------------------- |
| 1    | Broadcast color tokens        | `src/styles/index.css`                   |
| 2    | Team abbreviations            | `src/data/types.ts`, `src/data/teams.ts` |
| 3    | TeamColorBadge component      | `src/components/TeamColorBadge.tsx`      |
| 4    | BroadcastStatBar component    | `src/components/BroadcastStatBar.tsx`    |
| 5    | TeamSelectCard component      | `src/components/TeamSelectCard.tsx`      |
| 6    | Rewrite TeamSelect screen     | `src/screens/TeamSelect.tsx`             |
| 7    | Add style prop to PixelButton | `src/components/PixelButton.tsx`         |
| 8    | Screen wipe transition        | `src/App.tsx`                            |
| 9    | Mobile responsive layout      | `src/components/TeamSelectCard.tsx`      |
| 10   | Visual QA and final polish    | Various                                  |
