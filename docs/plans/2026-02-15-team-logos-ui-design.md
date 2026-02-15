# Team Logos in UI — Design

## Goal

Add the 11 retro pixel scuderia logos (already in `src/assets/scuderias-logos/`) across all screens where teams are displayed.

## Approach

Static logo map + reusable `<TeamLogo>` component. No lazy loading needed for 11 small PNGs.

## New Files

### `src/data/teamLogos.ts`

Static map from `team.id` to imported PNG:

- `red-bull` → `RedBull.png`
- `mclaren` → `McLaren.png`
- `mercedes` → `Mercedes.png`
- `ferrari` → `Ferrari.png`
- `aston-martin` → `AstonMartin.png`
- `alpine` → `Alpine.png`
- `williams` → `Williams.png`
- `racing-bulls` → `RacingBulls.png`
- `haas` → `Haas.png`
- `audi` → `Audi.png`
- `cadillac` → `Cadillac.png`

### `src/components/TeamLogo.tsx`

```
Props: { teamId: string, size: 'sm' | 'md' | 'lg', className?: string }
Sizes: sm=16px, md=24px, lg=32px
```

Renders `<img>` with `image-rendering: pixelated` to preserve pixel art crispness. Falls back to nothing if teamId not found.

## Integration by Screen

### BroadcastTimingTower

- Logo `sm` (16px) **replaces** `team.abbreviation` text
- Left border with `primaryColor` stays
- Row layout: position | logo | driver name | time

### TeamSelectCard

- Logo `lg` (32px) **replaces** `TeamColorBadge`
- Team name stays below the logo

### HQ Header

- Logo `md` (24px) **replaces** the 3x3px color square next to team name

### SeasonEnd

- WDC champion card: Logo `md` (24px) next to team name
- WCC champion card: Logo `lg` (32px) replaces `TeamColorBadge`
- Standings tables: inherit BroadcastTimingTower change

### Qualifying, Practice, Race, SprintRace, StrategyRoom

- These use BroadcastTimingTower — inherit the change automatically
- No additional modifications needed

## Style

- Logos displayed flat, no effects
- `image-rendering: pixelated` on all `<img>` elements
- `TeamColorBadge` component kept for any non-team usage but replaced by `<TeamLogo>` where teams are shown
