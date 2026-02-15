# Broadcast UI Redesign — All Screens

**Date**: 2026-02-15
**Goal**: Apply broadcast F1 TV aesthetic to all remaining screens. CSS-only approach (no image assets), matching the Team Select redesign style. Add driver numbers, tire compound icons, mini track map, and race animations.
**Status**: Approved

---

## Approach

Hybrid: create shared broadcast components first, then refactor each screen to use them. CSS-only team identity — colors, layout, and typography create the broadcast feel.

---

## Color System

Already defined in CSS variables, underutilized by most screens.

| Token        | Hex       | Use                              |
| ------------ | --------- | -------------------------------- |
| `f1-bg`      | `#0a0a0f` | Page background                  |
| `f1-surface` | `#1a1a24` | Cards, elevated elements         |
| `f1-border`  | `#2a2a38` | Borders, dividers                |
| `f1-accent`  | `#47c7fc` | Info, highlights                 |
| `f1-warning` | `#ffd700` | Yellow — warnings, money, sprint |
| `f1-success` | `#00ff41` | Green — success, reveals         |
| `f1-danger`  | `#ff2a6d` | Red — critical, DNF              |

Team colors from existing `teams.ts` `primaryColor` / `accentColor`.

---

## Shared Components

### DriverNumberBadge

Driver number plate styled like F1 TV. Background in team color, number in contrasting white/black.

- Sizes: `sm` (20px), `md` (28px), `lg` (36px)
- Props: `driverNumber`, `teamColor`, `size`
- Used in: timing towers, qualifying grid, standings, race

### TireCompoundIcon

CSS circle with compound color and letter.

| Compound     | Color              | Letter | Text color |
| ------------ | ------------------ | ------ | ---------- |
| Soft         | `#dc0000` (red)    | S      | white      |
| Medium       | `#ffd700` (yellow) | M      | black      |
| Hard         | `#ffffff` (white)  | H      | black      |
| Intermediate | `#00c853` (green)  | I      | white      |
| Wet          | `#0090ff` (blue)   | W      | white      |

- Sizes: `sm` (16px), `md` (24px), `lg` (32px)
- Used in: Practice tire cards, StrategyRoom stint planner, Race timing tower, player info

### BroadcastTimingTower

Vertical driver list matching F1 TV timing tower. Replaces existing Leaderboard component.

**Columns:**

- POS: position number with team color background
- NUM: `DriverNumberBadge`
- DRIVER: shortName + team abbreviation (muted)
- TIME/POINTS: gap to leader or points total (context-dependent)
- STATUS: `StatusBadge` area (PIT, DNF, FL, position changes)

**Row styling:**

- 3px left border in team color
- Player row: subtle glow in team color
- Background: `#1a1a24`, alternating rows slightly different opacity

**Animations (Framer Motion):**

- Overtake: rows reorder via `layoutId` (300ms)
- Position change: green arrow up / red arrow down, fades after 1.5s

### StatusBadge

Small badge for timing tower status indicators.

| Status           | Background | Text  | Behavior                |
| ---------------- | ---------- | ----- | ----------------------- |
| PIT              | `#ffd700`  | black | Pulses softly           |
| DNF / RETIRED    | `#ff2a6d`  | white | Static                  |
| FL (fastest lap) | `#a855f7`  | white | Pulses with glow        |
| Position up      | `#00ff41`  | black | Shows then fades (1.5s) |
| Position down    | `#ff2a6d`  | white | Shows then fades (1.5s) |
| SC (safety car)  | `#ffd700`  | black | Static during SC        |

### TrackMiniMap

SVG circuit outline with colored dots representing cars.

- Track paths defined in `src/data/trackPaths.ts` — simplified but recognizable silhouettes for all 24 circuits (Monaco horseshoe, Monza long oval, Spa boot shape, etc.)
- Each car: 6px circle in team color, positioned along SVG path
- Player car: 8px circle with white border
- Position calculated from `car.currentLap / totalLaps` mapped to path percentage
- Updates each lap
- Used in: Race screen (main), HQ Next Race tab (static preview)

---

## Screen Designs

### HQ Screen

**Layout:**

- Sticky header bar: TeamColorBadge + team name + engine (left), race counter + track name (center), budget + RP (right). Background `#1a1a24`, border-bottom in team color.
- Tab navigation: 5 tabs (R&D, Components, Sponsors, Standings, Next Race). Active tab underlined in team color.
- Content area: changes per tab.
- Sticky bottom: "START RACE WEEKEND" button in team color.

**Tab: R&D**

- 4 columns (Motor, Aero, Chassis, Pit Crew). 2x2 grid on mobile.
- Each column: category header, base upgrade node, two branch nodes below.
- Node states: locked (gray), available (team color outline), unlocked (green checkmark).
- CSS lines connecting base to branches.
- Click available node: expand panel with name, description, cost, UNLOCK button.

**Tab: Components**

- 3 horizontal cards (Engine, Gearbox, Energy Recovery). Stack vertical on mobile.
- Each card: component name, health % with color-coded bar (green > yellow > red), races used counter.
- Warning pulse if health < 30%.
- REPLACE button in team color when available.

**Tab: Sponsors**

- Active sponsors (top): up to 3 horizontal cards with sponsor name, objective + progress bar, duration countdown, payout in yellow.
- Available sponsors (bottom): similar cards with SIGN button in team color.

**Tab: Standings**

- Two `BroadcastTimingTower` instances side by side (drivers + constructors). Tabs on mobile.
- Points column instead of time. Player row highlighted.

**Tab: Next Race**

- Large centered card with track name, country flag, circuit name.
- Stats grid: laps, type, tire wear, overtaking difficulty, pit loss, weather.
- Sprint weekend indicator badge if applicable.
- TrackMiniMap as static preview of circuit layout.

---

### Practice Screen

**Layout:**

- Header: session name (FP1/FP2/FP3) + track + weather badge. Background `#1a1a24`.
- Progress section: lap counter + progress bar in team color filling as lapping completes.
- Tire data cards: 3 cards (Soft/Medium/Hard) with `TireCompoundIcon`.
  - Locked state: dark background, data shows `???`, badge "LOCKED" in gray.
  - Revealed state: data visible (degradation, optimal life, grip), badge "REVEALED" in green.
  - Reveal animation: border flash in compound color, `???` crossfade to values, badge color change.
- Sticky bottom: session counter + SKIP TO RESULTS button.

---

### Qualifying Screen

3 phases per session (Q1/Q2/Q3). SprintShootout is identical with "SPRINT SHOOTOUT" header and yellow sprint badge.

**Phase 1: Risk Selection**

- 3 cards: SAFE (green border, 90%), PUSH (yellow border, 100%), FULL SEND (red border, 105%).
- Selected card: glow in its color + brighter background.
- Elimination zone info at bottom.
- GO button in team color.

**Phase 2: Flying Lap**

- Large timer centered (24-32px).
- Sectors reveal progressively with broadcast colors:
  - Purple (`#a855f7`): session best
  - Green (`#00ff41`): personal best
  - Yellow (`#ffd700`): slower than personal best
- Dramatic pause between sector reveals.

**Phase 3: Results**

- `BroadcastTimingTower` with time column.
- Elimination zone: rows with subtle red background (`#ff2a6d` at 10% opacity), ELIMINATED badge.
- Player result highlighted at bottom.
- Transition between Q1-Q2-Q3: wipe with session name card.

**SprintShootout:** identical structure, header says "SPRINT SHOOTOUT - SQ1/SQ2/SQ3", yellow sprint badge in header.

---

### StrategyRoom Screen

**Layout:**

- Header: "STRATEGY ROOM" + track + total laps.
- 2 columns desktop (stack vertical mobile):

**Left column — Tire Degradation Chart:**

- Line chart with compound curves in their colors (red/yellow/white).
- Only revealed compounds shown as solid lines; unrevealed as dashed gray.
- Background `#1a1a24`, grid lines `#2a2a38`.
- Pit stop time loss displayed below chart.

**Right column — Strategy Planner:**

- Stint cards stacked vertically. Each stint:
  - `TireCompoundIcon` + compound name + lap count
  - Slider to adjust laps in stint
  - Left border in compound color
  - Compound selector (click to cycle through available compounds)
- ADD STINT button at bottom.
- Live validation: total laps ✓/✗, minimum 2 compounds rule ✓/✗.

**Sticky bottom:** compound life summary (optimal laps per compound) + START RACE button in team color.

---

### Race Screen

**Layout:**

**Sticky header:**

- Track name + flag, lap counter (LAP X/XX), weather badge, race status flag.
- Safety car: entire header becomes yellow (#ffd700) background with black text.

**Main area — 2 columns (timing tower left, player panel right):**

**Left: BroadcastTimingTower (20 rows)**
All race animations active:

- Overtake: rows reorder with Framer Motion layout animation (300ms). Green/red position arrows appear for 1.5s.
- Pit stop: yellow PIT badge pulses. On exit, `TireCompoundIcon` updates to new compound.
- Fastest lap: row gets purple left border (#a855f7), FL badge pulses 3x then stays.
- DNF: red flash (3 pulses, 200ms each), row fades to 40% opacity, RETIRED badge, row sinks to bottom.
- Incident: red flash on affected row (3 pulses).
- Safety car: SC badge on all rows, yellow header.

**Right: Player Panel**

- TrackMiniMap at top — SVG circuit with colored car dots moving.
- Player info below: position (large), gap to car ahead, `TireCompoundIcon` + laps on current stint / compound life, fuel bar.

**Sticky bottom — Action Bar:**

- Always visible. Background `#1a1a24`, border-top `#2a2a38`.
- 3 mode buttons: SAVE (green), NEUTRAL (yellow), PUSH (red). Active = filled, inactive = outline only.
- BOX NOW button separated to the right. On click changes to "BOXING THIS LAP" with visual feedback.

**Mobile:** track map hides or becomes compact strip above timing tower. Action bar remains sticky bottom.

**Race Results (post-race overlay):**

- Overlay on top of frozen timing tower.
- Player result: position, points earned, money earned, RP earned.
- Component wear summary.
- Sponsor objective result (met/missed + bonus).
- CONTINUE TO HQ button.

---

### SprintRace Screen

Same as Race with differences:

- Header: yellow SPRINT badge.
- Fewer laps (~25-30% of GP).
- Sprint scoring (P1=8pts to P8=1pt).
- No 2-compound rule.
- Results overlay: simpler (no component wear, no sponsor check).
- All same components: timing tower, track map, animations, sticky action bar.

---

### SeasonEnd Screen

**Layout:**

**Header:** "2026 SEASON COMPLETE" centered, 16px.

**Champions section:**

- WDC card: `DriverNumberBadge` large + full name + team + points. Left border in champion's team color. Points bar visual.
- WCC card: `TeamColorBadge` + team name + points.
- If player is champion: golden glow (#ffd700), CSS confetti animation (20 colored squares falling with @keyframes translateY + rotate, 3 seconds).

**Your Season — stat cards:**

- Grid of cards (3-4 per row).
- Each card: large number (24px, team color) + label below (8px, muted).
- Stats: final driver position, wins, podiums, total points, money earned, RP accumulated, constructor position.
- Stagger entrance animation (100ms delay between cards, fade up).

**Final Standings:**

- Two `BroadcastTimingTower` side by side (drivers + constructors). Tabs on mobile.
- Player row highlighted with team color glow.

**Sticky bottom:** "START NEW SEASON" button in team color. Wipe transition to Team Select.

**Entry animation sequence:**

1. Header fade in (200ms)
2. Champion cards slide up (300ms, 150ms stagger)
3. If player champion: confetti burst
4. Stat cards stagger fade up (100ms each)
5. Standings fade in (400ms delay)

---

## New Data File

### `src/data/trackPaths.ts`

SVG path data for all 24 circuits. Each entry:

```typescript
interface TrackPath {
  trackId: string
  viewBox: string // SVG viewBox dimensions
  path: string // SVG path d attribute — simplified recognizable outline
  startFinishPercent: number // where on path the S/F line is (0-1)
}
```

Simplified but recognizable silhouettes: Monaco horseshoe, Monza long straights, Spa boot, Silverstone flowing curves, etc.

---

## Migration Pattern

For each screen, the refactor follows this pattern:

1. Replace `slate-*` / `bg-slate-800` classes with `bg-f1-surface`, `border-f1-border`, `bg-f1-bg`.
2. Replace existing Leaderboard with `BroadcastTimingTower` where applicable.
3. Add `DriverNumberBadge` wherever driver info is displayed.
4. Add `TireCompoundIcon` wherever tire compounds are shown.
5. Ensure sticky bottom action bars where applicable.
6. Add team color left borders and player row highlights.

---

## Out of Scope

- Pixel art sprites or image assets
- Changes to game logic, simulation engine, or stores
- New game features (only UI changes)
- Audio or sound effects
- Backend/cloud saves

---

## Success Criteria

- All screens use broadcast color palette consistently (no more slate-\* colors)
- Driver numbers visible in all timing towers and relevant contexts
- Tire compound icons used consistently across Practice, Strategy, Race
- Track mini map shows recognizable circuit with moving cars during race
- Race action bar always visible (sticky bottom) — no scrolling to control
- Race animations (overtake, FL, PIT, DNF) provide clear visual feedback
- Consistent broadcast feel across all screens matching Team Select quality
