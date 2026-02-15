# Team Select — Broadcast UI Redesign

**Date**: 2026-02-15
**Goal**: Redesign the Team Select screen with F1 TV broadcast aesthetics using CSS-only team identity (no image assets). Layout-first approach prioritizing information hierarchy and authentic broadcast feel.
**Status**: Approved

---

## Design Decisions

- **CSS-only team identity** — No pixel art sprites, no image files. Team badges are colored blocks with 3-letter abbreviations, matching how F1 timing towers render team identity.
- **Layout-first** — The broadcast feel comes from information layout and color usage, not from custom art assets.
- **Horizontal card grid** — Inspired by F1 TV pre-race team comparison cards. Each card shows team identity, stats, and driver selection in a single horizontal row.
- **Dark broadcast palette** — Near-black backgrounds to make team colors pop, matching F1 TV dark mode.

---

## Color System

### Backgrounds

| Token        | Hex       | Use                                     |
| ------------ | --------- | --------------------------------------- |
| `bg-base`    | `#0a0a0f` | Page background (near-black, blue tint) |
| `bg-surface` | `#1a1a24` | Card backgrounds, elevated elements     |
| `border`     | `#2a2a38` | Subtle dividers and card borders        |

### Team Colors

Sourced from existing `teams.ts` `primaryColor` and `accentColor` fields. No changes to team data needed.

### Broadcast Accents

| Token             | Hex       | Use                                  |
| ----------------- | --------- | ------------------------------------ |
| `accent-warning`  | `#ffd700` | Yellow — highlights, important info  |
| `accent-success`  | `#00ff41` | Neon green — selected/success states |
| `accent-critical` | `#ff2a6d` | Magenta — critical alerts            |
| `accent-info`     | `#47c7fc` | Sky blue — informational             |

### Typography

- Font: Press Start 2P (unchanged)
- Page title: 16px
- Team names: 11-12px
- Stats/data: 8-9px
- Use opacity and color for hierarchy, not size

---

## Page Layout

```
┌──────────────────────────────────────────────┐
│  F1 THE GAME                    SEASON 2026  │  Header bar
├──────────────────────────────────────────────┤
│  SELECT YOUR TEAM                            │  Section title
├──────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────┐ │
│ │▌MCL │ McLaren      │ SPD 93 │  ● Norris │ │  Team card
│ │▌    │ Mercedes PU  │ COR 94 │  ○ Piastri│ │
│ └──────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────┐ │
│ │▌RBR │ Red Bull     │ SPD 95 │  ● Max    │ │
│ │▌    │ Red Bull PU  │ COR 93 │  ○ Lawson │ │
│ └──────────────────────────────────────────┘ │
│  ... (11 teams total)                        │
├──────────────────────────────────────────────┤
│              [ START SEASON → ]              │  Bottom action bar
└──────────────────────────────────────────────┘
```

### Grid

- **Mobile (< 640px):** Single column, full width
- **Desktop (>= 640px):** Single column, max-width ~900px centered
- Cards are compact: ~80-100px tall each
- All 11 teams visible with minimal scrolling

---

## Team Card Anatomy

Each card is a horizontal row with 4 zones:

### Zone 1: Team Color Strip

- 4px left border in `team.primaryColor`
- Full card height
- Provides instant team recognition

### Zone 2: Team Badge + Name

- **CSS color badge:** Small rectangle (28x28px) filled with `team.primaryColor`
- Contains 3-letter team abbreviation (RBR, MCL, MER, FER, AMR, ALP, AUD, CAD, WIL, RCB, HAS) in contrasting text (white or dark depending on color luminance)
- Team full name below badge: 11px, white
- Engine/PU supplier: 9px, muted text (40% opacity)

### Zone 3: Stats Panel

- 3 stat bars: SPD, COR, REL
- Broadcast data bar style: thin horizontal bars (2px height)
- Bar filled in `team.primaryColor`
- Label on left (8px, muted), numeric value on right (8px, white)
- Compact vertical stacking

### Zone 4: Driver Selection

- Two driver buttons stacked vertically
- Radio-button style: filled circle (●) = selected, empty circle (○) = unselected
- Driver name in 9-10px text
- Selected driver gets team color text + subtle background highlight
- Clicking a driver selects both the team and the driver

### Card States

| State    | Visual                                                                         |
| -------- | ------------------------------------------------------------------------------ |
| Default  | `bg-surface` background, `border` color border                                 |
| Hovered  | Border opacity increases to 60%                                                |
| Selected | Team color box-shadow glow (`0 0 12px rgba(teamColor, 0.3)`), border brightens |

---

## Team Abbreviations

| Team ID        | Abbreviation |
| -------------- | ------------ |
| `red-bull`     | RBR          |
| `mclaren`      | MCL          |
| `mercedes`     | MER          |
| `ferrari`      | FER          |
| `aston-martin` | AMR          |
| `alpine`       | ALP          |
| `audi`         | AUD          |
| `cadillac`     | CAD          |
| `williams`     | WIL          |
| `racing-bulls` | RCB          |
| `haas`         | HAS          |

---

## Animations

### Page Entrance

- Cards stagger in from bottom: slight fade + translate-y
- Framer Motion `staggerChildren: 0.05`
- Full grid appears within ~600ms

### Card Interactions

- **Hover:** Border opacity 30% → 60%, 150ms ease
- **Driver click:** Instant team color fill on button. Subtle scale pulse on card (1.0 → 1.02 → 1.0, 200ms)
- **Selection glow:** `box-shadow` in team primary color fades in over 200ms

### START SEASON Button

- Disabled → enabled: transitions from gray to selected team's primary color
- **Screen transition:** On click, horizontal wipe (team color bar slides left-to-right, 400ms) before navigating to HQ

---

## Components to Create/Modify

### New Components

- `TeamColorBadge` — CSS-rendered team abbreviation badge (colored rectangle + text)
- `BroadcastStatBar` — Thin broadcast-style stat bar with label + value
- `TeamSelectCard` — Horizontal card composing badge, stats, driver buttons
- `ScreenWipeTransition` — Framer Motion horizontal wipe transition

### Modified Components

- `TeamSelect` screen — Complete layout overhaul using new components
- `PixelButton` — May need variant for team-colored button state

### No Changes Needed

- Team data (`teams.ts`) — existing `primaryColor` and `accentColor` fields sufficient
- Driver data, stores, game logic — untouched

---

## Out of Scope

- No pixel art sprites or image files
- No Aseprite/Git LFS setup
- No changes to other screens (HQ, Race, Qualifying, etc.)
- No changes to game logic or data structures
- No new fonts or typography
- No track data or calendar changes

---

## Success Criteria

- Team Select immediately feels like an F1 broadcast interface
- Team identity is clear through color alone (no images needed)
- Information hierarchy is clean: team → drivers → stats
- Card interactions feel responsive and polished
- Transition to HQ feels intentional (wipe animation)
- Works well on both mobile and desktop
