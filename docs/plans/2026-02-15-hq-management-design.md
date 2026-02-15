# HQ Management & Season Mode Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a full season mode with HQ management between races — R&D upgrades, component wear, finances/sponsors, and championship standings across a real 25-race 2026 F1 calendar.

**Architecture:** Season Store + HQ Screen approach. A single `seasonStore` holds all persistent season state. One HQ screen with tabbed sub-views. Existing race weekend flow stays untouched — it reads modified team stats from the season store.

**Tech Stack:** React 19, Zustand, Tailwind CSS, Framer Motion (same as existing).

---

## Game Flow

```
Team Select → HQ (pre-season) → Race Weekend 1 → Results → HQ → Race Weekend 2 → ... → Race 25 → Season Summary
```

Phase system expands to include `'hq'` and `'season-end'`. After race results, player returns to HQ for next race.

---

## Season Store

```typescript
interface SeasonState {
  currentRaceIndex: number          // 0-24
  calendar: CalendarEntry[]         // 25 races with track refs + sprint flag

  driverStandings: DriverStanding[] // {driverId, points, positions[]}
  teamStandings: TeamStanding[]     // {teamId, points}

  budget: number                    // starts at $10M
  researchPoints: number

  rdUpgrades: RDUpgrades            // which branches unlocked, which level
  components: ComponentState[]      // {type, healthPercent, racesUsed}
  sponsors: Sponsor[]               // up to 3, each with objective + payout
}
```

**Starting values:** Budget $10M, 0 RP, all components at 100%, no R&D upgrades, no sponsors.

**Points system (real 2026 F1):** P1=25, P2=18, P3=15, P4=12, P5=10, P6=8, P7=6, P8=4, P9=2, P10=1. Sprint: P1=8 down to P8=1.

---

## R&D Branching Tree

4 areas, each with a base upgrade + 2 exclusive branches (must choose one, permanent per season):

```
MOTOR ──── Base: +2 top speed
  ├── Raw Power: +3 top speed, +1 fuel consumption, +0.5% engine wear/race
  └── Fuel Efficiency: +1 top speed, -15% fuel consumption

AERO ──── Base: +2 cornering
  ├── High Downforce: +3 cornering, -1 top speed
  └── Low Drag: +1 cornering, +2 top speed

CHASIS ──── Base: +8% tire life
  ├── Tire Preservation: +15% tire life, -1 cornering
  └── Mechanical Grip: +5% tire life, +2 cornering

PIT CREW ──── Base: -0.3s pit time
  ├── Speed Specialists: -0.6s pit time, +5% pit error chance
  └── Consistency: -0.2s pit time, -50% pit error chance
```

**Unlock flow:** Base → choose Branch A or B (exclusive, permanent per season).

**Costs:**
- Base upgrades: 50 RP + $500K each
- Branch upgrades: 100 RP + $1M each

**Effect on simulation:** Upgrades modify the team's performance stats before each race. The lap simulator already uses these stats — just feed modified values.

---

## Components & Wear

3 component types:

| Component | Starting Health | Wear/Race | Wear/Sprint | Critical Threshold |
|-----------|----------------|-----------|-------------|-------------------|
| Engine (ICE) | 100% | 3-5% | 2-3% | 20% |
| Gearbox | 100% | 2-4% | 1-2% | 15% |
| Energy Recovery | 100% | 2-3% | 1-2% | 15% |

**Mechanics:**
- Wear range varies — aggressive driving increases wear, conservative reduces it
- Below critical threshold: 30% mechanical DNF chance per race
- At 0%: guaranteed DNF
- Replacement resets to 100%:

| Component | Replacement Cost |
|-----------|-----------------|
| Engine | $1.5M |
| Gearbox | $800K |
| Energy Recovery | $600K |

**Motor → Raw Power branch** adds +0.5% extra engine wear per race.

**AI teams:** Components degrade too, auto-replace below 25%. Creates realistic grid DNFs.

---

## Finances & Sponsors

**Income:**
- Race results: P1=$500K, P2=$350K, P3=$250K... P10=$50K. Below P10=$0.
- Sprint results: P1=$100K, P2=$70K, P3=$50K... P8=$10K.
- Sponsor payouts (conditional on objectives).
- Practice RP bonus: +5 RP for completing all FP sessions.

**Expenses:**
- R&D upgrades (RP + money)
- Component replacements
- Race entry fee: $100K per race (fixed)

**Sponsors:**
- Up to 3 active at a time
- Each has: name, objective, payout, duration (races remaining)
- Pool of ~12 sponsors; 3-4 available to sign at HQ before each race (random, refreshed)
- Failed objectives = no payout, no penalty. Sponsor leaves when duration expires.
- Bankruptcy: budget hits $0, can still race but no R&D or replacements.

**Sponsor pool examples:**

| Sponsor | Objective | Payout | Duration |
|---------|-----------|--------|----------|
| Pixel Energy | Finish Top 10 | $200K | 5 races |
| ByteSpeed Tech | Finish Top 5 | $400K | 3 races |
| RetroFuel | Both drivers finish | $150K | 8 races |
| NeonWare | Score points in Sprint | $100K | 4 races |
| TurboChip Ltd | Win a race | $1M | Season |
| GridForce | Qualify Top 3 | $300K | 3 races |

---

## Track Data & Calendar

25 tracks, each with:

```typescript
interface Track {
  id: string
  name: string              // "Australia"
  circuit: string           // "Albert Park"
  laps: number
  baseLapTime: number       // seconds
  overtakingDifficulty: number  // 0-100
  tireWear: number          // multiplier (1.0 normal)
  fuelConsumption: number   // multiplier
  type: 'street' | 'high-speed' | 'technical' | 'balanced'
  hasSprint: boolean
}
```

**Track type effects:**
- `street`: +50% incident chance, harder overtaking
- `high-speed`: Motor/speed stats weighted more, lower tire wear
- `technical`: Aero/cornering stats weighted more, higher tire wear
- `balanced`: No special modifiers

**Sprint weekend flow:**

```
Standard:  FP1 → FP2 → FP3 → Q1/Q2/Q3 → Strategy → Race → Results
Sprint:    FP1 → Q1/Q2/Q3 → Sprint Shootout → Sprint Race → Strategy → Race → Results
```

Sprint Shootout = shorter qualifying (SQ1/SQ2/SQ3) for Sprint grid. Sprint Race = ~1/3 distance, no mandatory pit.

**Full 2026 Calendar:**

| # | Date | GP | Circuit | Sprint |
|---|------|----|---------|--------|
| 1 | 8 Mar | Australia | Albert Park | No |
| 2 | 15 Mar | China | Shanghai | Yes |
| 3 | 29 Mar | Japan | Suzuka | No |
| 4 | 12 Apr | Bahrain | Sakhir | No |
| 5 | 19 Apr | Saudi Arabia | Jeddah | No |
| 6 | 3 May | Miami | Miami Intl. Autodrome | Yes |
| 7 | 24 May | Canada | Gilles Villeneuve | Yes |
| 8 | 7 Jun | Monaco | Monte Carlo | No |
| 9 | 14 Jun | Spain | Barcelona-Catalunya | No |
| 10 | 28 Jun | Austria | Red Bull Ring | No |
| 11 | 5 Jul | Great Britain | Silverstone | Yes |
| 12 | 19 Jul | Belgium | Spa-Francorchamps | No |
| 13 | 26 Jul | Hungary | Hungaroring | No |
| 14 | 23 Aug | Netherlands | Zandvoort | Yes |
| 15 | 6 Sep | Italy | Monza | No |
| 16 | 13 Sep | Madrid | IFEMA Madrid | No |
| 17 | 26 Sep | Azerbaijan | Baku | No |
| 18 | 11 Oct | Singapore | Marina Bay | Yes |
| 19 | 25 Oct | United States | Austin (COTA) | No |
| 20 | 1 Nov | Mexico | Hermanos Rodriguez | No |
| 21 | 8 Nov | Brazil | Interlagos | No |
| 22 | 21 Nov | Las Vegas | Las Vegas Strip | No |
| 23 | 29 Nov | Qatar | Lusail | No |
| 24 | 6 Dec | Abu Dhabi | Yas Marina | No |

---

## Driver Numbers

Each driver gets a `number` field:

| Team | Driver | Number |
|------|--------|--------|
| McLaren | Lando Norris | #1 |
| McLaren | Oscar Piastri | #81 |
| Ferrari | Lewis Hamilton | #44 |
| Ferrari | Charles Leclerc | #16 |
| Red Bull | Max Verstappen | #3 |
| Red Bull | Isack Hadjar | #6 |
| Mercedes | George Russell | #63 |
| Mercedes | Kimi Antonelli | #12 |
| Williams | Carlos Sainz | #55 |
| Williams | Alex Albon | #23 |
| Aston Martin | Fernando Alonso | #14 |
| Aston Martin | Lance Stroll | #18 |
| Audi | Nico Hulkenberg | #27 |
| Audi | Gabriel Bortoleto | #5 |
| Alpine | Pierre Gasly | #10 |
| Alpine | Franco Colapinto | #43 |
| Haas | Esteban Ocon | #31 |
| Haas | Oliver Bearman | #87 |
| Racing Bulls | Liam Lawson | #30 |
| Racing Bulls | Arvid Lindblad | #41 |
| Cadillac | Sergio Perez | #11 |
| Cadillac | Valtteri Bottas | #77 |

---

## HQ Screen UI

Single screen with 5 tabs: R&D, Components, Sponsors, Standings, Next Race.

Header shows: current race number, next GP name, budget, RP, WDC position.

"START RACE WEEKEND →" button visible from all tabs at bottom.

Pixel-tech aesthetic consistent with existing screens.

---

## Data Flow & Integration

```
seasonStore → modifies team stats → weekendStore/race
race results → feed back into seasonStore (points, money, wear, RP)
```

**Key functions:**
- `getModifiedTeamStats(team, rdUpgrades)` — applies R&D bonuses to team performance
- `getComponentDNFChance(components)` — extra mechanical failure probability from wear
- `applyRaceResults(result)` — updates standings, budget, components, RP

**Existing code changes:**
- `tracks.ts`: Expand from 1 to 25 tracks
- `drivers.ts`: Add `number` field
- `weekendStore.ts`: Add `'hq'` and `'season-end'` to Phase
- `lapSimulator.ts`: Accept modified team stats
- `incidentEngine.ts`: Accept extra DNF chance from components
- `App.tsx`: Add HQ and SeasonEnd routing

**New files:**
- `src/stores/seasonStore.ts`
- `src/data/calendar.ts`
- `src/data/sponsors.ts`
- `src/data/rdTree.ts`
- `src/screens/HQ.tsx` (with tab sub-components)
- `src/screens/SeasonEnd.tsx`
- `src/engine/seasonEngine.ts`

---

## Out of Scope (Future Tasks)

- Pixel art assets (cars, components, icons) — separate visual polish task
- Pilot contracts and salary system
- Multi-season career mode
- Save/load to Supabase
