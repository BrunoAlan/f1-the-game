# F1 Broadcast UI Redesign - Design Document

**Date**: 2026-02-15
**Goal**: Complete UI redesign with pixel art sprites, F1 broadcast aesthetic, and enhanced team personality
**Success Metrics**: Visual impact ("wow" factor) + Authentic F1 feeling

---

## Design Vision

Transform the F1 racing game UI from text-heavy interfaces to a pixel art broadcast graphics experience. The redesign emphasizes:

1. **Visual Impact** — Immediate "wow" factor through rich pixel art and F1 team branding
2. **Broadcast Authenticity** — Timing towers, on-screen graphics, and visual language familiar to F1 fans
3. **Team Personality** — Each of the 10 teams feels unique through real colors, logos, and visual identity
4. **Improved Flow** — Clearer visual feedback, smooth transitions, and progress indicators

**Design Approach**: F1 Broadcast Graphics style — inspired by F1 TV coverage timing towers, team radio overlays, and on-screen graphics, executed in medium-detail pixel art (48-64px sprites, indie modern aesthetic like Dead Cells/Hyper Light Drifter).

---

## Visual Design System

### Color Palette

**Background Neutral** (to make team colors pop):

- Base: `#0a0a0f` (near-black, slightly blue-tinted)
- Surface: `#1a1a24` (elevated elements/cards)
- Borders: `#2a2a38` (subtle dividers)

**F1 Team Colors 2026** (primary branding palette):

- **McLaren**: `#ff8000` (orange) + `#47c7fc` (papaya blue)
- **Ferrari**: `#dc0000` (red) + `#ffd700` (yellow)
- **Red Bull**: `#0600ef` (dark blue) + `#fcd700` (yellow)
- **Mercedes**: `#00d2be` (turquoise) + `#c0c0c0` (silver)
- **Williams**: `#005aff` (blue) + `#ffffff` (white)
- **Aston Martin**: `#006f62` (British racing green) + `#cedc00` (lime)
- **Audi**: `#bb0a30` (Audi red) + `#1c1c1c` (black)
- **Alpine**: `#0090ff` (blue) + `#ff1801` (red/pink)
- **Haas**: `#ffffff` (white) + `#b6babd` (gray/silver)
- **Racing Bulls**: `#6692ff` (blue) + `#1b2838` (dark blue)
- **Cadillac**: `#000000` (black) + `#b8860b` (gold)

**Broadcast Accents** (for highlights and critical info):

- Warning: `#ffd700` (yellow broadcast)
- Success: `#00ff41` (neon green)
- Critical: `#ff2a6d` (magenta/pink)
- Info: `#47c7fc` (sky blue)

### Typography & Sizing

- **Font**: Press Start 2P (existing, maintained)
- UI text: 8px-12px (timing tower data, names)
- Headers: 16px (section titles)
- Big numbers: 24px-32px (positions, car numbers)

### Sprite Sizes

- **Team logos**: 64x64px (primary use in Team Select, HQ header)
- **Team badges** (small): 32x32px (timing tower, mini-indicators)
- **Car top-down sprites**: 48x48px (Race screen, positions)
- **Component icons**: 48x48px (engine, gearbox, ERS)
- **UI icons**: 24x24px or 32x32px (R&D, sponsors, tabs)
- **Track layouts**: 128x128px (mini circuit diagrams)

### Grid & Spacing

- Base unit: 8px (all spacing in multiples of 8)
- Internal padding: 16px
- Element gaps: 8px or 16px
- Borders: 2px pixel-perfect lines

---

## Component Library

### Team Identity Assets

**Logo Pack** (10 teams × 2 sizes = 20 sprites):

- Large logo: 64x64px — Team Select, HQ header
- Badge: 32x32px — timing tower entries, mini indicators

**Car Sprites** (10 teams × 3 states = 30 sprites):

- Top-down view: 48x48px
- Variants: normal, damaged (smoke/sparks), retired (grayed out)

### Race Weekend UI

**Timing Tower Components**:

- Position numbers (1-20): 24x24px broadcast-style (team color background)
- Driver number plates: 32x16px (number + team color)
- Status indicators: 16x16px (pit, DNF, incident, fastest lap)
- Sector times: colored bars (purple/green/yellow personal bests)

**Track Elements**:

- Circuit layouts: 128x128px simplified top-view (25 tracks)
- Flag icons: 32x32px (green, yellow, red, checkered, safety car)
- Weather icons: 24x24px (sunny, cloudy, rain, mixed)

### HQ Management UI

**Component Sprites** (health visualization):

- Engine/ICE: 48x48px — mechanical detail, glow when healthy, cracks when damaged
- Gearbox: 48x48px — visible gears, rust/wear shows damage
- Energy Recovery: 48x48px — battery/electric theme, charge level visual
- Health bars: pixel art progress bars with color coding (green→yellow→red)

**R&D Tree Icons** (4 categories × 3 levels = 12 sprites):

- Motor: 32x32px (piston → turbo → fuel system)
- Aero: 32x32px (wing → high downforce → low drag variants)
- Chassis: 32x32px (tire → suspension → grip components)
- Pit Crew: 32x32px (wrench → fast crew → precise crew)

**Sponsor Logos**:

- 32x32px fictional brands (Pixel Energy, ByteSpeed, RetroFuel, NeonWare, TurboChip, GridForce, etc.)
- 8-10 unique sponsor sprites with retro/tech aesthetic

**Financial UI**:

- Money icon: 24x24px (dollar/coin stack)
- Research Points icon: 24x24px (beaker/lightbulb)
- Budget warning: 32x32px (flashing low-money indicator)

### Navigation & System UI

**Tab Icons** (HQ screen, 5 tabs):

- R&D: 32x32px (wrench + spark)
- Components: 32x32px (engine outline)
- Sponsors: 32x32px (handshake/contract)
- Standings: 32x32px (trophy/podium)
- Next Race: 32x32px (flag/track)

**Buttons & Controls**:

- Primary button: scalable 9-slice with team color accent
- Secondary button: neutral with border
- Icon buttons: 32x32px or 40x40px clickable areas
- Broadcast-style wipe transitions: animated diagonal/horizontal bars

**Decorative/Atmospheric**:

- Scanlines overlay: subtle CRT effect (optional toggle)
- Broadcast logo bug: small corner element
- Pit lane/garage background elements (parallax optional)

### Animation Frames

**Animated sprites** (4-frame loops typical):

- Car moving: slight bob/shimmer (4 frames)
- Component damage: crack spreading animation (3-4 frames)
- Money/RP gain: coin flip/sparkle (6 frames)
- Fastest lap indicator: pulsing purple glow (3 frames)
- Pit stop action: wheel change sequence (8 frames)

**Total sprite count estimate**: ~200-250 individual sprites (including variants and animation frames)

---

## Screen-by-Screen Design

### Team Select Screen

**Layout**:

- **Header**: "SELECT YOUR TEAM" large typography, season year "2026" in corner
- **Grid**: 2 columns × 5 rows (10 teams)
- **Team Cards**:
  - 64x64px team logo centered
  - Team name below in team color
  - Stats preview: 4 bars (Speed, Cornering, Reliability, Development) — pixel art progress bars
  - Hover state: card glow with team color, subtle animation (logo pulse)
- **Background**: Dark neutral with subtle grid pattern, broadcast-style corner graphics
- **Bottom**: "SELECT →" button in team color once chosen

**Transition**: Card selected → wipe transition with team color → fade to HQ

---

### HQ Screen (Hub Central)

**Layout General**:

- **Top Header Bar** (always visible):
  - Left: Team logo 32x32 + team name
  - Center: "RACE X/25" + next track name + track layout 64x64
  - Right: Budget + RP icons with values
- **Tab Navigation** (horizontal, broadcast-style tabs):
  - 5 tabs with icons 32x32 + labels
  - Active tab: underline in team color + brighter icon
- **Content Area**: changes based on active tab
- **Bottom**: "START RACE WEEKEND →" button (large, team color, pulsing)

#### Tab 1: R&D

**Layout**: 4 columns (Motor, Aero, Chassis, Pit Crew)

Each column shows:

- Category icon 32x32 at top
- Base upgrade: icon + name + cost + "UNLOCK" button or checkmark
- Branch A / Branch B: expandable after base, mutually exclusive visual
- State: locked (grayed), available (team color accent), unlocked (green checkmark)

**Visual**: Tech tree lines connecting base → branches (pixel art connectors)

#### Tab 2: Components

**Layout**: 3 large component cards (vertical or horizontal)

Each card:

- Component sprite 48x48 (visual state based on health %)
- Component name + "Health: XX%"
- Pixel art health bar (green→yellow→red gradient)
- "Races Used: X" counter
- "REPLACE ($XXX)" button if available
- Warning icon if < 20% health (pulsing red)

**Background**: Subtle garage/workshop ambient sprites (decorative)

#### Tab 3: Sponsors

**Layout**: 2 sections

**Active Sponsors** (top): Up to 3 horizontal cards

- Sponsor logo 32x32 + name
- Objective text + progress bar if applicable
- "Duration: X races" countdown
- Payout amount in yellow

**Available Sponsors** (bottom): 3-4 cards to sign

- Similar layout, "SIGN" button in team color

**Visual**: Contract/paper texture background subtle

#### Tab 4: Standings

**Layout**: Timing tower style (broadcast)

**Driver Standings**: Vertical list

- Position number 24x24 (broadcast style)
- Driver number 32x16 + name in team color
- Points total
- Highlight player's driver with glow

**Constructor Standings**: Similar, team logos instead of drivers

**Visual**: Scrollable list if necessary, very broadcast-like

#### Tab 5: Next Race

**Layout**: Large preview card

- Track layout 128x128 centered at top
- Track name + circuit name
- Track stats: laps, type, tire wear, overtaking difficulty (icons + values)
- Sprint weekend indicator if applicable (special badge)
- Weather forecast icons

**Visual**: Track outline in team color accent, info organized like telemetry readout

---

### Practice/Qualifying Screens

**Layout**:

- **Top Bar**: Session name (FP1/FP2/FP3 or Q1/Q2/Q3), track name, timer
- **Main Area**: Timing tower (broadcast style)
  - 20 drivers listed
  - Columns: POS | # | DRIVER | TEAM | TIME | GAP | SECTOR TIMES
  - Player's driver highlighted with team color glow
  - Live updates: times flash when improving (green), worsening (red)
  - Status icons: IN PIT, OUT, INCIDENT
- **Bottom Panel**:
  - "Your best: XX.XXX" with comparison vs leader
  - RP earned indicator (practice only)
- **Right Side** (optional): Mini track map 128x128 with car positions
- **Background**: Subtle animated elements (cars moving on track outline)

**Transition between sessions**: Broadcast wipe with session name card

---

### Race Screen

**Layout**:

- **Top Bar**:
  - Left: Race name + lap counter "LAP X/XX"
  - Center: Leader info
  - Right: Weather, flags
- **Main Area**: Live timing tower (same style as practice/quali)
  - Position changes animated (cars moving up/down positions)
  - Pit stop status: "IN PITS" indicator, tire icons showing compound
  - Incidents: flashing red border on affected driver rows
  - Fastest lap: purple highlight indicator
- **Bottom Panel**:
  - "Your Position: X" large
  - Gap to leader/car ahead
  - Current tire compound icon + laps on tire
- **Right Side**: Mini race map with all cars (colored dots by team)
- **Radio Messages**: Toast notifications broadcast-style (slide in from top)
  - "Box this lap" / "Incident ahead" / "Fastest lap!"
  - 3-4 seconds, then slide out

**Animations**:

- Cars overtaking: position numbers swap with smooth transition
- Pit stops: driver row briefly expands showing pit animation
- DNF: driver grays out with "RETIRED" badge

---

### Results Screen

**Layout**:

- **Header**: "RACE RESULTS" + track name
- **Main**: Final classification (timing tower style)
  - POS | # | DRIVER | TEAM | TIME/GAP | POINTS
  - Podium positions (1-2-3) with special glow (gold/silver/bronze tint)
  - Player's result highlighted large
- **Bottom Panel**:
  - Money earned: animated coin counter
  - Points earned: animated number
  - Championship position change: arrow up/down
  - Component wear report: brief summary icons
- **Transition**: "CONTINUE TO HQ →" button

---

### Season End Screen

**Layout**:

- **Header**: "2026 SEASON COMPLETE"
- **Champion Reveal**:
  - WDC winner: large 64x64 team logo + driver name + points
  - WCC winner: team logo + points
  - Confetti/celebration pixel art animation
- **Your Results**:
  - Final positions (driver + team)
  - Season highlights: wins, podiums, points
  - Financial summary: total earned
- **Bottom**: "START NEW SEASON" button

---

## Animations & Transitions

### Animation Principles

**Broadcast-inspired timing**:

- Fast & snappy: UI interactions respond in 100-200ms
- Smooth data updates: timing tower numbers update with easing, no instant jumps
- Purposeful motion: each animation communicates information (not pure decoration)
- Pixel-perfect: animations in discrete frames, no sub-pixel positioning

### Micro-Animations (UI Interactions)

**Buttons & Clickables**:

- Hover: subtle glow in team color (2-frame fade in)
- Click: scale down 95% → bounce back (3 frames, 150ms total)
- Disabled: desaturate + lower opacity

**Data Updates** (timing tower, money, RP):

- Number change: brief flash highlight (yellow) → fade to normal (4 frames)
- Money gain: "+$XXX" floats up from icon, fades out (8 frames, 600ms)
- Position change: row slides up/down smoothly (6 frames, 300ms)

**Health Bars & Progress**:

- Fill animation: left-to-right fill with slight overshoot/bounce
- Color transitions: smooth gradient shift green→yellow→red as value drops
- Critical state: pulsing red glow (3-frame loop, 1s cycle)

### Screen Transitions (Broadcast Wipes)

**Between major screens**:

- Horizontal wipe: team color bar wipes across screen left→right (400ms)
- Diagonal wipe: broadcast-style diagonal reveal (500ms)
- Fade through black: for dramatic moments (race start, season end) (600ms)

**Between sessions** (FP1→FP2, Q1→Q2):

- Card slide-in: session name card slides in from right, pauses 800ms, slides out left
- Background crossfade behind it

### Race-Specific Animations

**Position Changes**:

- Overtake: two driver rows briefly swap with crossfade (300ms)
- Multiple positions gained: sequential swaps, slight delay between each
- Position number changes: scale pulse (120% → 100%)

**Pit Stops**:

- Driver row expands height 200% → shows mini pit animation (wheels changing, 8 frames, 2s)
- "IN PITS" badge pulses
- Row collapses back after pit complete

**Incidents & DNFs**:

- Incident: driver row flashes red 3 times (200ms each)
- DNF: row desaturates + grays out over 1s
- "RETIRED" badge fades in

**Radio Messages**:

- Slide in from top with slight overshoot (easeOutBack)
- Stay 3s
- Slide out to top (easeInBack)
- Max 2 messages on screen simultaneously

### Atmospheric Animations (Background/Ambient)

**HQ Screen**:

- Subtle scanline overlay moving downward (slow, 5s loop)
- Broadcast corner bug subtle pulse (3s loop)
- Optional: background garage elements with parallax on scroll

**Race Screen**:

- Mini track map: car dots move along track path
- Flag animations: checkered flag waves (4-frame loop)
- Weather effects: rain particles falling if wet race (particle system)

**Team Select**:

- Selected card logo: subtle bob/float (4-frame loop, 2s)
- Background grid: slow pan/scroll for depth

### Special Moments (High Impact)

**Fastest Lap**:

- Purple glow pulse around driver row (4-frame loop)
- "FASTEST LAP" badge slides in from right
- Subtle particle burst effect

**Race Win** (if player wins):

- Confetti particles burst from top (16 particles, 2s fall)
- Team color glow intensifies
- Trophy icon bounces in

**Championship Won**:

- Full-screen celebration animation
- Fireworks/sparkles pixel art (20 particles)
- Team logo scales up with glow pulse

---

## Implementation Strategy

### Tech Stack & Tools

**Pixel Art Creation**:

- **Aseprite** (recommended) — industry standard for pixel art and animations
- Alternatives: Pixelorama (free), Piskel (web-based)
- Export: PNG sprite sheets with transparency
- Naming convention: `{category}-{name}-{size}.png` (e.g., `team-mclaren-logo-64.png`)

**Animation**:

- Aseprite for frame-by-frame animation
- Export as sprite sheets with JSON metadata (frame positions)
- Framer Motion (already in stack) for transitions and tweens

**Integration with React**:

- Wrapper components for sprites: `<Sprite />`, `<AnimatedSprite />`
- CSS Modules or Tailwind for layouts (maintain current stack)
- Sprite sheets loaded as static assets in `/public/sprites/`

### Implementation Phases

**Phase 1: Design Foundation (Week 1-2)**

- Create official color palette (exported swatches)
- Design and pixel-art the 10 team logos (64x64 + 32x32)
- Create base component library in Aseprite (buttons, borders, icons)
- Set up design system in Figma/document for reference
- **Deliverable**: Sprite sheet v1 with team identities + UI basics

**Phase 2: Component Library (Week 2-3)**

- Car sprites (10 teams × 3 states = 30 sprites)
- Component icons (engine, gearbox, ERS with health variants)
- R&D tree icons (12 sprites)
- UI icons (tabs, financial, status indicators)
- Track layouts (start with 5 key tracks, expand later)
- **Deliverable**: Complete sprite library, organized sprite sheets

**Phase 3: Screen Redesign - Team Select & HQ (Week 3-4)**

- Implement Team Select with new layout
- HQ header bar and tab navigation
- R&D tab with tech tree visual
- Components tab with health visualization
- **Deliverable**: Functional Team Select + HQ (R&D + Components tabs)

**Phase 4: Screen Redesign - HQ Continued (Week 4-5)**

- Sponsors tab
- Standings tab (timing tower style)
- Next Race tab
- **Deliverable**: Complete functional HQ

**Phase 5: Race Weekend Screens (Week 5-6)**

- Practice/Qualifying timing tower redesign
- Race screen with live timing
- Mini track map integration
- Radio messages system
- **Deliverable**: Complete race weekend flow with new UI

**Phase 6: Results & Polish (Week 6-7)**

- Results screen
- Season End screen
- Transitions between screens (broadcast wipes)
- Micro-animations (buttons, data updates)
- **Deliverable**: Full game loop with new UI

**Phase 7: Animation & Juice (Week 7-8)**

- Pit stop animations
- Position change animations
- Particle effects (fastest lap, wins)
- Atmospheric background elements
- Performance optimization
- **Deliverable**: Polished, animated experience

### File Organization

```
/public/sprites/
  /teams/
    mclaren-logo-64.png
    mclaren-logo-32.png
    mclaren-badge-32.png
    ferrari-logo-64.png
    ...
  /cars/
    car-mclaren-48.png
    car-mclaren-damaged-48.png
    car-mclaren-retired-48.png
    ...
  /components/
    engine-healthy-48.png
    engine-worn-48.png
    engine-critical-48.png
    ...
  /ui/
    icon-rd-32.png
    icon-money-24.png
    icon-rp-24.png
    ...
  /tracks/
    albert-park-128.png
    shanghai-128.png
    ...
  /animations/
    pit-stop-sheet.png (8 frames)
    fastest-lap-glow-sheet.png (4 frames)
    ...

/assets-source/
  /teams/
    mclaren-logo.aseprite
    ferrari-logo.aseprite
  /cars/
    car-template.aseprite
  /components/
    engine.aseprite
  f1-broadcast-palette.aseprite

/src/components/ui/
  Sprite.tsx
  AnimatedSprite.tsx
  BroadcastCard.tsx
  TimingTower.tsx
  TeamBadge.tsx

/src/styles/
  design-tokens.css
  animations.css
```

### Component Architecture

**Base Sprite Component**:

```typescript
<Sprite
  src="/sprites/teams/mclaren-logo-64.png"
  alt="McLaren"
  size={64}
  className="team-logo"
/>
```

**Animated Sprite Component**:

```typescript
<AnimatedSprite
  spriteSheet="/sprites/animations/pit-stop-sheet.png"
  frameWidth={48}
  frameHeight={48}
  frameCount={8}
  fps={12}
  loop={false}
/>
```

**Team-Aware Components**:

```typescript
<TeamBadge
  teamId="mclaren"
  size="large"
  variant="logo"
/>

<TimingTowerRow
  position={1}
  driverNumber={4}
  driverName="Norris"
  teamId="mclaren"
  time="1:23.456"
  gap="+0.000"
/>
```

### Data Integration

**Extend existing data structures**:

```typescript
// src/data/teams.ts
interface Team {
  id: string
  name: string
  colors: { primary: string; secondary: string }
  spritePaths: {
    logo64: string
    logo32: string
    badge: string
    car: string
  }
  // ... existing fields
}

// src/data/tracks.ts
interface Track {
  id: string
  name: string
  layoutSprite: string
  // ... existing fields
}
```

---

## Asset Pipeline & Maintenance

### Asset Creation Workflow

1. **Design Phase** (Aseprite): Create sprite with official palette, use layers for variants
2. **Export Phase**: PNG with transparency, native size, sprite sheets for animations
3. **Optimization**: Run through TinyPNG/pngquant (lossless compression)
4. **Integration**: Drop in `/public/sprites/{category}/`, import in React components

### Naming Conventions

**Pattern**: `{category}-{name}-{variant}-{size}.png`

Examples:

- `team-mclaren-logo-64.png`
- `car-redbull-damaged-48.png`
- `component-engine-healthy-48.png`
- `anim-pitstop-sheet-48.png`

### Color Palette Management

**Master palette file**: `f1-broadcast-palette.aseprite`

- Contains all official colors organized by category
- Import in each new sprite project for consistency

**CSS Variables** (synced with palette):

```css
:root {
  --bg-base: #0a0a0f;
  --bg-surface: #1a1a24;
  --border: #2a2a38;
  --team-mclaren-primary: #ff8000;
  --team-ferrari-primary: #dc0000;
  /* ... all teams */
  --accent-warning: #ffd700;
  --accent-success: #00ff41;
  --accent-critical: #ff2a6d;
  --accent-info: #47c7fc;
}
```

### Version Control

**Git LFS** for sprite sheets and source files:

```
*.png filter=lfs diff=lfs merge=lfs -text
*.aseprite filter=lfs diff=lfs merge=lfs -text
```

**Keep source files** (`/assets-source/`) — allows future edits, commit to repo

### Testing & QA

- Visual regression testing (screenshot tests for critical screens)
- Accessibility (alt text, color contrast checks)
- Performance (monitor bundle size, lazy load animations)

---

## Success Criteria

✓ **Visual Impact** — Immediate "wow" factor on first impression through rich pixel art and F1 branding
✓ **F1 Authenticity** — Broadcast language (timing towers, team colors, graphics) familiar to F1 fans
✓ **Team Personality** — Each team visually unique and recognizable
✓ **Clarity** — Information (stats, standings, race data) always readable and clear

---

## Out of Scope (Future Enhancements)

- Pixel art driver portraits
- Animated pit crew mechanics
- Full 3D isometric garage view
- Custom livery editor
- Multiplayer lobby UI
