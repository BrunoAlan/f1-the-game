# Team Logos UI Integration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add retro pixel team logos across all screens where teams are displayed.

**Architecture:** Static import map (`teamLogos.ts`) + reusable `<TeamLogo>` component with 3 sizes. Integrate into BroadcastTimingTower, TeamSelectCard, HQ header, and SeasonEnd champion cards.

**Tech Stack:** React, TypeScript, Vite static imports, Tailwind CSS

---

### Task 1: Create team logo map

**Files:**

- Create: `src/data/teamLogos.ts`

**Step 1: Create the logo map file**

```ts
import alpineLogo from '../assets/scuderias-logos/Alpine.png'
import astonMartinLogo from '../assets/scuderias-logos/AstonMartin.png'
import audiLogo from '../assets/scuderias-logos/Audi.png'
import cadillacLogo from '../assets/scuderias-logos/Cadillac.png'
import ferrariLogo from '../assets/scuderias-logos/Ferrari.png'
import haasLogo from '../assets/scuderias-logos/Haas.png'
import mclarenLogo from '../assets/scuderias-logos/McLaren.png'
import mercedesLogo from '../assets/scuderias-logos/Mercedes.png'
import racingBullsLogo from '../assets/scuderias-logos/RacingBulls.png'
import redBullLogo from '../assets/scuderias-logos/RedBull.png'
import williamsLogo from '../assets/scuderias-logos/Williams.png'

export const teamLogos: Record<string, string> = {
  'red-bull': redBullLogo,
  mclaren: mclarenLogo,
  mercedes: mercedesLogo,
  ferrari: ferrariLogo,
  'aston-martin': astonMartinLogo,
  alpine: alpineLogo,
  audi: audiLogo,
  cadillac: cadillacLogo,
  williams: williamsLogo,
  'racing-bulls': racingBullsLogo,
  haas: haasLogo,
}
```

**Step 2: Verify build**

Run: `pnpm build`
Expected: Build succeeds, all 11 PNG imports resolve.

**Step 3: Commit**

```bash
git add src/data/teamLogos.ts
git commit -m "feat: add team logo import map"
```

---

### Task 2: Create TeamLogo component

**Files:**

- Create: `src/components/TeamLogo.tsx`

**Step 1: Create the component**

```tsx
import { teamLogos } from '../data/teamLogos'

interface TeamLogoProps {
  teamId: string
  size: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZES = { sm: 16, md: 24, lg: 32 }

export function TeamLogo({ teamId, size, className = '' }: TeamLogoProps) {
  const src = teamLogos[teamId]
  if (!src) return null

  const px = SIZES[size]

  return (
    <img
      src={src}
      alt=""
      width={px}
      height={px}
      className={`shrink-0 ${className}`}
      style={{ imageRendering: 'pixelated' }}
      draggable={false}
    />
  )
}
```

**Step 2: Verify build**

Run: `pnpm build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/components/TeamLogo.tsx
git commit -m "feat: add TeamLogo reusable component"
```

---

### Task 3: Integrate into BroadcastTimingTower

**Files:**

- Modify: `src/components/BroadcastTimingTower.tsx`

**Step 1: Add import**

Add at the top of the file, after existing imports:

```ts
import { TeamLogo } from './TeamLogo'
```

**Step 2: Replace team abbreviation with logo**

Replace lines 91-93 (the team abbreviation span):

```tsx
<span className="text-f1-text/30 text-[7px] truncate hidden sm:inline">{team.abbreviation}</span>
```

With:

```tsx
<TeamLogo teamId={team.id} size="sm" />
```

Remove the `hidden sm:inline` — the logo should always show, not just on desktop.

**Step 3: Verify build and check dev server**

Run: `pnpm build`
Expected: Build succeeds. Logo appears in timing tower rows on all screens that use BroadcastTimingTower (Race, Qualifying, HQ Standings, SeasonEnd standings).

**Step 4: Commit**

```bash
git add src/components/BroadcastTimingTower.tsx
git commit -m "feat: show team logos in timing tower"
```

---

### Task 4: Integrate into TeamSelectCard

**Files:**

- Modify: `src/components/TeamSelectCard.tsx`

**Step 1: Replace TeamColorBadge import with TeamLogo**

Replace:

```ts
import { TeamColorBadge } from './TeamColorBadge'
```

With:

```ts
import { TeamLogo } from './TeamLogo'
```

**Step 2: Replace TeamColorBadge usage with TeamLogo**

Replace line 36:

```tsx
<TeamColorBadge abbreviation={team.abbreviation} color={team.primaryColor} />
```

With:

```tsx
<TeamLogo teamId={team.id} size="lg" />
```

**Step 3: Verify build**

Run: `pnpm build`
Expected: Build succeeds. Team select screen shows pixel logos instead of colored abbreviation badges.

**Step 4: Commit**

```bash
git add src/components/TeamSelectCard.tsx
git commit -m "feat: show team logos in team select cards"
```

---

### Task 5: Integrate into HQ header

**Files:**

- Modify: `src/screens/HQ.tsx`

**Step 1: Add import**

Add after existing imports:

```ts
import { TeamLogo } from '../components/TeamLogo'
```

**Step 2: Replace the color square with TeamLogo**

Replace line 99 (the 3x3 color square div):

```tsx
<div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: teamColor }} />
```

With:

```tsx
<TeamLogo teamId={selectedTeamId ?? ''} size="md" />
```

**Step 3: Verify build**

Run: `pnpm build`
Expected: Build succeeds. HQ header shows team logo instead of small color square.

**Step 4: Commit**

```bash
git add src/screens/HQ.tsx
git commit -m "feat: show team logo in HQ header"
```

---

### Task 6: Integrate into SeasonEnd champion cards

**Files:**

- Modify: `src/screens/SeasonEnd.tsx`

**Step 1: Add TeamLogo import**

Add after existing imports:

```ts
import { TeamLogo } from '../components/TeamLogo'
```

**Step 2: Replace WCC TeamColorBadge with TeamLogo**

Replace lines 175-178 (the WCC champion TeamColorBadge):

```tsx
<TeamColorBadge abbreviation={wccTeam.abbreviation} color={wccTeam.primaryColor} size="lg" />
```

With:

```tsx
<TeamLogo teamId={wccTeam.id} size="lg" />
```

**Step 3: Add logo to WDC champion card**

In the WDC champion card (lines 146-152), add a TeamLogo after the team name line. Replace:

```tsx
<div className="font-pixel text-[8px] text-f1-text/50 mt-0.5">{wdcTeam.name}</div>
```

With:

```tsx
<div className="font-pixel text-[8px] text-f1-text/50 mt-0.5 flex items-center gap-1.5">
  <TeamLogo teamId={wdcTeam.id} size="sm" />
  {wdcTeam.name}
</div>
```

**Step 4: Remove unused TeamColorBadge import if no other usage remains**

Check if `TeamColorBadge` is still used elsewhere in the file. If not, remove the import:

```ts
import { TeamColorBadge } from '../components/TeamColorBadge'
```

**Step 5: Verify build**

Run: `pnpm build`
Expected: Build succeeds. SeasonEnd shows logos in both champion cards.

**Step 6: Commit**

```bash
git add src/screens/SeasonEnd.tsx
git commit -m "feat: show team logos in season end champion cards"
```

---

### Task 7: Final verification

**Step 1: Full build check**

Run: `pnpm build`
Expected: Clean build, no errors, no warnings.

**Step 2: Lint check**

Run: `pnpm lint`
Expected: No new lint errors.

**Step 3: Check TeamColorBadge is still used somewhere**

Verify `TeamColorBadge` is still imported somewhere (it may still be used in other contexts). If it's completely unused across the codebase, leave it for now — don't delete it in this PR.

**Step 4: Commit any remaining fixes**

If lint or build revealed issues, fix and commit.
