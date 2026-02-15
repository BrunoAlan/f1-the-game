# F1 Broadcast UI Redesign - Phase 1: Design Foundation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Establish the visual foundation for the F1 Broadcast UI redesign - color palette, team logos, base component library, and React integration infrastructure.

**Architecture:** Asset-first approach - create pixel art assets in Aseprite, export to organized sprite directories, build React wrapper components for sprite rendering, establish design token system in CSS.

**Tech Stack:** Aseprite (pixel art), React 19, TypeScript, Tailwind CSS, existing Vite setup

---

## Task 1: Project Setup & File Structure

**Files:**

- Create: `public/sprites/teams/.gitkeep`
- Create: `public/sprites/cars/.gitkeep`
- Create: `public/sprites/components/.gitkeep`
- Create: `public/sprites/ui/.gitkeep`
- Create: `public/sprites/tracks/.gitkeep`
- Create: `public/sprites/animations/.gitkeep`
- Create: `assets-source/teams/.gitkeep`
- Create: `assets-source/cars/.gitkeep`
- Create: `assets-source/components/.gitkeep`
- Create: `src/styles/design-tokens.css`
- Create: `.gitattributes`

**Step 1: Create sprite directories**

```bash
mkdir -p public/sprites/{teams,cars,components,ui,tracks,animations}
touch public/sprites/teams/.gitkeep
touch public/sprites/cars/.gitkeep
touch public/sprites/components/.gitkeep
touch public/sprites/ui/.gitkeep
touch public/sprites/tracks/.gitkeep
touch public/sprites/animations/.gitkeep
```

**Step 2: Create source asset directories**

```bash
mkdir -p assets-source/{teams,cars,components}
touch assets-source/teams/.gitkeep
touch assets-source/cars/.gitkeep
touch assets-source/components/.gitkeep
```

**Step 3: Create design tokens CSS file**

File: `src/styles/design-tokens.css`

```css
/**
 * F1 Broadcast UI Design Tokens
 * Color palette and spacing system for pixel art UI
 */

:root {
  /* Background Neutral */
  --bg-base: #0a0a0f;
  --bg-surface: #1a1a24;
  --border: #2a2a38;

  /* McLaren */
  --team-mclaren-primary: #ff8000;
  --team-mclaren-secondary: #47c7fc;

  /* Ferrari */
  --team-ferrari-primary: #dc0000;
  --team-ferrari-secondary: #ffd700;

  /* Red Bull */
  --team-redbull-primary: #0600ef;
  --team-redbull-secondary: #fcd700;

  /* Mercedes */
  --team-mercedes-primary: #00d2be;
  --team-mercedes-secondary: #c0c0c0;

  /* Williams */
  --team-williams-primary: #005aff;
  --team-williams-secondary: #ffffff;

  /* Aston Martin */
  --team-astonmartin-primary: #006f62;
  --team-astonmartin-secondary: #cedc00;

  /* Audi */
  --team-audi-primary: #bb0a30;
  --team-audi-secondary: #1c1c1c;

  /* Alpine */
  --team-alpine-primary: #0090ff;
  --team-alpine-secondary: #ff1801;

  /* Haas */
  --team-haas-primary: #ffffff;
  --team-haas-secondary: #b6babd;

  /* Racing Bulls */
  --team-racingbulls-primary: #6692ff;
  --team-racingbulls-secondary: #1b2838;

  /* Cadillac */
  --team-cadillac-primary: #000000;
  --team-cadillac-secondary: #b8860b;

  /* Broadcast Accents */
  --accent-warning: #ffd700;
  --accent-success: #00ff41;
  --accent-critical: #ff2a6d;
  --accent-info: #47c7fc;

  /* Spacing (8px base unit) */
  --space-1: 8px;
  --space-2: 16px;
  --space-3: 24px;
  --space-4: 32px;
  --space-5: 40px;
  --space-6: 48px;
  --space-8: 64px;

  /* Border */
  --border-width: 2px;
}
```

**Step 4: Set up Git LFS for sprites**

File: `.gitattributes`

```
*.png filter=lfs diff=lfs merge=lfs -text
*.aseprite filter=lfs diff=lfs merge=lfs -text
```

**Step 5: Initialize Git LFS**

```bash
git lfs install
git lfs track "*.png"
git lfs track "*.aseprite"
```

**Step 6: Commit file structure**

```bash
git add public/sprites/ assets-source/ src/styles/design-tokens.css .gitattributes
git commit -m "feat: add sprite directories and design tokens for broadcast UI"
```

---

## Task 2: Aseprite Palette Setup

**Files:**

- Create: `assets-source/f1-broadcast-palette.aseprite`

**Step 1: Create master palette in Aseprite**

Launch Aseprite and create a new file:

- Size: 16x16px (doesn't matter, this is just for palette)
- Color mode: RGB
- Background: Transparent

**Step 2: Add all colors to palette**

Add these colors to the palette in Aseprite (Edit → Palette):

**Neutrals:**

- #0a0a0f (bg-base)
- #1a1a24 (bg-surface)
- #2a2a38 (border)

**Team Colors (10 teams × 2 colors):**

- McLaren: #ff8000, #47c7fc
- Ferrari: #dc0000, #ffd700
- Red Bull: #0600ef, #fcd700
- Mercedes: #00d2be, #c0c0c0
- Williams: #005aff, #ffffff
- Aston Martin: #006f62, #cedc00
- Audi: #bb0a30, #1c1c1c
- Alpine: #0090ff, #ff1801
- Haas: #ffffff, #b6babd
- Racing Bulls: #6692ff, #1b2838
- Cadillac: #000000, #b8860b

**Accents:**

- #ffd700 (warning)
- #00ff41 (success)
- #ff2a6d (critical)
- #47c7fc (info)

**Grays (for disabled states):**

- #333333
- #666666
- #999999
- #cccccc

**Step 3: Save palette**

File → Save As → `assets-source/f1-broadcast-palette.aseprite`

**Step 4: Export palette for reference**

File → Export → Export Palette As → `assets-source/f1-broadcast-palette.gpl` (GIMP palette format for documentation)

**Step 5: Commit palette**

```bash
git add assets-source/f1-broadcast-palette.aseprite assets-source/f1-broadcast-palette.gpl
git commit -m "feat: add master F1 color palette for pixel art"
```

---

## Task 3: McLaren Team Logo (64x64)

**Files:**

- Create: `assets-source/teams/mclaren-logo.aseprite`
- Create: `public/sprites/teams/mclaren-logo-64.png`

**Step 1: Create new sprite in Aseprite**

- File → New
- Size: 64x64px
- Color mode: RGB
- Background: Transparent
- File → Import Palette → Select `f1-broadcast-palette.aseprite`

**Step 2: Design McLaren logo**

Design guidelines:

- Use McLaren orange (#ff8000) as primary
- Use papaya blue (#47c7fc) as accent
- Pixel art representation of McLaren logo (simplified papaya swoosh)
- Readable silhouette at 1x zoom
- Center the design in the 64x64 canvas

Design approach:

- Create a stylized "M" shape or simplified papaya emblem
- Use 2-3 colors max (orange primary, blue accent, white highlights)
- Keep it bold and recognizable

**Step 3: Save source file**

File → Save As → `assets-source/teams/mclaren-logo.aseprite`

**Step 4: Export PNG**

File → Export → Export As → `public/sprites/teams/mclaren-logo-64.png`

- Scale: 100%
- Format: PNG
- Transparency: Yes

**Step 5: Optimize PNG**

If you have pngquant installed:

```bash
pngquant --quality=95-100 --ext .png --force public/sprites/teams/mclaren-logo-64.png
```

Otherwise, skip optimization for now.

**Step 6: Commit McLaren logo**

```bash
git add assets-source/teams/mclaren-logo.aseprite public/sprites/teams/mclaren-logo-64.png
git commit -m "feat: add McLaren team logo (64x64)"
```

---

## Task 4: McLaren Team Badge (32x32)

**Files:**

- Create: `assets-source/teams/mclaren-badge.aseprite`
- Create: `public/sprites/teams/mclaren-badge-32.png`

**Step 1: Create new sprite in Aseprite**

- File → New
- Size: 32x32px
- Color mode: RGB
- Background: Transparent
- Import palette from master

**Step 2: Design McLaren badge**

This is a simplified version of the 64x64 logo:

- Same design language as the large logo
- Fewer details (this needs to be readable at 32x32)
- Could be just the "M" or papaya icon without text
- Use the same McLaren orange primary

**Step 3: Save and export**

Save: `assets-source/teams/mclaren-badge.aseprite`
Export: `public/sprites/teams/mclaren-badge-32.png`

**Step 4: Commit McLaren badge**

```bash
git add assets-source/teams/mclaren-badge.aseprite public/sprites/teams/mclaren-badge-32.png
git commit -m "feat: add McLaren team badge (32x32)"
```

---

## Task 5: Ferrari Team Logo (64x64)

**Files:**

- Create: `assets-source/teams/ferrari-logo.aseprite`
- Create: `public/sprites/teams/ferrari-logo-64.png`

**Step 1: Create new sprite**

- 64x64px, transparent, import master palette

**Step 2: Design Ferrari logo**

Design guidelines:

- Use Ferrari red (#dc0000) as primary
- Use yellow (#ffd700) as accent
- Stylized prancing horse or "SF" (Scuderia Ferrari)
- Bold, iconic, recognizable

**Step 3: Save and export**

Save: `assets-source/teams/ferrari-logo.aseprite`
Export: `public/sprites/teams/ferrari-logo-64.png`

**Step 4: Commit**

```bash
git add assets-source/teams/ferrari-logo.aseprite public/sprites/teams/ferrari-logo-64.png
git commit -m "feat: add Ferrari team logo (64x64)"
```

---

## Task 6: Ferrari Team Badge (32x32)

**Files:**

- Create: `assets-source/teams/ferrari-badge.aseprite`
- Create: `public/sprites/teams/ferrari-badge-32.png`

**Step 1: Create and design**

- 32x32px simplified Ferrari logo
- Same red/yellow colors
- Simplified prancing horse or just "F" icon

**Step 2: Save and export**

Save: `assets-source/teams/ferrari-badge.aseprite`
Export: `public/sprites/teams/ferrari-badge-32.png`

**Step 3: Commit**

```bash
git add assets-source/teams/ferrari-badge.aseprite public/sprites/teams/ferrari-badge-32.png
git commit -m "feat: add Ferrari team badge (32x32)"
```

---

## Task 7: Red Bull Team Logo & Badge

**Files:**

- Create: `assets-source/teams/redbull-logo.aseprite`
- Create: `public/sprites/teams/redbull-logo-64.png`
- Create: `assets-source/teams/redbull-badge.aseprite`
- Create: `public/sprites/teams/redbull-badge-32.png`

**Design:**

- Primary: #0600ef (dark blue)
- Secondary: #fcd700 (yellow)
- Stylized bulls or "RB" logo
- 64x64 detailed, 32x32 simplified

**Commit:**

```bash
git add assets-source/teams/redbull-* public/sprites/teams/redbull-*
git commit -m "feat: add Red Bull team logo and badge"
```

---

## Task 8: Mercedes Team Logo & Badge

**Files:**

- Create: `assets-source/teams/mercedes-logo.aseprite`
- Create: `public/sprites/teams/mercedes-logo-64.png`
- Create: `assets-source/teams/mercedes-badge.aseprite`
- Create: `public/sprites/teams/mercedes-badge-32.png`

**Design:**

- Primary: #00d2be (turquoise)
- Secondary: #c0c0c0 (silver)
- Three-pointed star or "M" logo
- Clean, modern aesthetic

**Commit:**

```bash
git add assets-source/teams/mercedes-* public/sprites/teams/mercedes-*
git commit -m "feat: add Mercedes team logo and badge"
```

---

## Task 9: Williams Team Logo & Badge

**Files:**

- Create: `assets-source/teams/williams-logo.aseprite`
- Create: `public/sprites/teams/williams-logo-64.png`
- Create: `assets-source/teams/williams-badge.aseprite`
- Create: `public/sprites/teams/williams-badge-32.png`

**Design:**

- Primary: #005aff (blue)
- Secondary: #ffffff (white)
- Stylized "W" or wing design
- Classic racing aesthetic

**Commit:**

```bash
git add assets-source/teams/williams-* public/sprites/teams/williams-*
git commit -m "feat: add Williams team logo and badge"
```

---

## Task 10: Aston Martin Team Logo & Badge

**Files:**

- Create: `assets-source/teams/astonmartin-logo.aseprite`
- Create: `public/sprites/teams/astonmartin-logo-64.png`
- Create: `assets-source/teams/astonmartin-badge.aseprite`
- Create: `public/sprites/teams/astonmartin-badge-32.png`

**Design:**

- Primary: #006f62 (British racing green)
- Secondary: #cedc00 (lime)
- Wings logo or "AM" monogram
- Elegant, premium feel

**Commit:**

```bash
git add assets-source/teams/astonmartin-* public/sprites/teams/astonmartin-*
git commit -m "feat: add Aston Martin team logo and badge"
```

---

## Task 11: Audi Team Logo & Badge

**Files:**

- Create: `assets-source/teams/audi-logo.aseprite`
- Create: `public/sprites/teams/audi-logo-64.png`
- Create: `assets-source/teams/audi-badge.aseprite`
- Create: `public/sprites/teams/audi-badge-32.png`

**Design:**

- Primary: #bb0a30 (Audi red)
- Secondary: #1c1c1c (black)
- Four rings or stylized "A"
- German precision aesthetic

**Commit:**

```bash
git add assets-source/teams/audi-* public/sprites/teams/audi-*
git commit -m "feat: add Audi team logo and badge"
```

---

## Task 12: Alpine Team Logo & Badge

**Files:**

- Create: `assets-source/teams/alpine-logo.aseprite`
- Create: `public/sprites/teams/alpine-logo-64.png`
- Create: `assets-source/teams/alpine-badge.aseprite`
- Create: `public/sprites/teams/alpine-badge-32.png`

**Design:**

- Primary: #0090ff (blue)
- Secondary: #ff1801 (red/pink)
- French flag colors or "A" logo
- Dynamic, sporty feel

**Commit:**

```bash
git add assets-source/teams/alpine-* public/sprites/teams/alpine-*
git commit -m "feat: add Alpine team logo and badge"
```

---

## Task 13: Haas Team Logo & Badge

**Files:**

- Create: `assets-source/teams/haas-logo.aseprite`
- Create: `public/sprites/teams/haas-logo-64.png`
- Create: `assets-source/teams/haas-badge.aseprite`
- Create: `public/sprites/teams/haas-badge-32.png`

**Design:**

- Primary: #ffffff (white)
- Secondary: #b6babd (gray/silver)
- "H" logo or checkered elements
- American racing style

**Commit:**

```bash
git add assets-source/teams/haas-* public/sprites/teams/haas-*
git commit -m "feat: add Haas team logo and badge"
```

---

## Task 14: Racing Bulls Team Logo & Badge

**Files:**

- Create: `assets-source/teams/racingbulls-logo.aseprite`
- Create: `public/sprites/teams/racingbulls-logo-64.png`
- Create: `assets-source/teams/racingbulls-badge.aseprite`
- Create: `public/sprites/teams/racingbulls-badge-32.png`

**Design:**

- Primary: #6692ff (blue)
- Secondary: #1b2838 (dark blue)
- Bull icon or "RB" with different style than Red Bull
- Energetic, youthful

**Commit:**

```bash
git add assets-source/teams/racingbulls-* public/sprites/teams/racingbulls-*
git commit -m "feat: add Racing Bulls team logo and badge"
```

---

## Task 15: Cadillac Team Logo & Badge

**Files:**

- Create: `assets-source/teams/cadillac-logo.aseprite`
- Create: `public/sprites/teams/cadillac-logo-64.png`
- Create: `assets-source/teams/cadillac-badge.aseprite`
- Create: `public/sprites/teams/cadillac-badge-32.png`

**Design:**

- Primary: #000000 (black)
- Secondary: #b8860b (gold)
- Cadillac crest or wreath logo
- Luxury American brand aesthetic

**Commit:**

```bash
git add assets-source/teams/cadillac-* public/sprites/teams/cadillac-*
git commit -m "feat: add Cadillac team logo and badge"
```

---

## Task 16: Base Sprite Component

**Files:**

- Create: `src/components/ui/Sprite.tsx`
- Create: `src/components/ui/Sprite.test.tsx`

**Step 1: Write failing test**

File: `src/components/ui/Sprite.test.tsx`

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Sprite } from './Sprite'

describe('Sprite', () => {
  it('renders an img element with correct src', () => {
    render(<Sprite src="/sprites/teams/mclaren-logo-64.png" alt="McLaren" size={64} />)

    const img = screen.getByRole('img', { name: 'McLaren' })
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', '/sprites/teams/mclaren-logo-64.png')
  })

  it('applies correct width and height based on size prop', () => {
    render(<Sprite src="/test.png" alt="Test" size={32} />)

    const img = screen.getByRole('img')
    expect(img).toHaveStyle({ width: '32px', height: '32px' })
  })

  it('applies image-rendering: pixelated for crisp pixels', () => {
    render(<Sprite src="/test.png" alt="Test" size={64} />)

    const img = screen.getByRole('img')
    expect(img).toHaveStyle({ imageRendering: 'pixelated' })
  })

  it('applies additional className if provided', () => {
    render(<Sprite src="/test.png" alt="Test" size={64} className="custom-class" />)

    const img = screen.getByRole('img')
    expect(img).toHaveClass('custom-class')
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm run test src/components/ui/Sprite.test.tsx
```

Expected output: `FAIL` - Sprite component doesn't exist

**Step 3: Implement Sprite component**

File: `src/components/ui/Sprite.tsx`

```typescript
import React from 'react'

interface SpriteProps {
  src: string
  alt: string
  size: number
  className?: string
}

export const Sprite: React.FC<SpriteProps> = ({ src, alt, size, className = '' }) => {
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        imageRendering: 'pixelated',
      }}
      className={className}
    />
  )
}
```

**Step 4: Run test to verify it passes**

```bash
npm run test src/components/ui/Sprite.test.tsx
```

Expected output: `PASS` - All tests passing

**Step 5: Commit**

```bash
git add src/components/ui/Sprite.tsx src/components/ui/Sprite.test.tsx
git commit -m "feat: add Sprite component for pixel-perfect image rendering"
```

---

## Task 17: TeamBadge Component

**Files:**

- Create: `src/components/ui/TeamBadge.tsx`
- Create: `src/components/ui/TeamBadge.test.tsx`

**Step 1: Write failing test**

File: `src/components/ui/TeamBadge.test.tsx`

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TeamBadge } from './TeamBadge'

describe('TeamBadge', () => {
  it('renders large McLaren logo correctly', () => {
    render(<TeamBadge teamId="mclaren" size="large" variant="logo" />)

    const img = screen.getByRole('img', { name: /McLaren/i })
    expect(img).toHaveAttribute('src', '/sprites/teams/mclaren-logo-64.png')
    expect(img).toHaveStyle({ width: '64px', height: '64px' })
  })

  it('renders small Ferrari badge correctly', () => {
    render(<TeamBadge teamId="ferrari" size="small" variant="badge" />)

    const img = screen.getByRole('img', { name: /Ferrari/i })
    expect(img).toHaveAttribute('src', '/sprites/teams/ferrari-badge-32.png')
    expect(img).toHaveStyle({ width: '32px', height: '32px' })
  })

  it('defaults to large logo if size not specified', () => {
    render(<TeamBadge teamId="redbull" variant="logo" />)

    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', '/sprites/teams/redbull-logo-64.png')
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm run test src/components/ui/TeamBadge.test.tsx
```

Expected: `FAIL` - TeamBadge doesn't exist

**Step 3: Implement TeamBadge component**

File: `src/components/ui/TeamBadge.tsx`

```typescript
import React from 'react'
import { Sprite } from './Sprite'

interface TeamBadgeProps {
  teamId: string
  size?: 'large' | 'small'
  variant: 'logo' | 'badge'
  className?: string
}

const TEAM_NAMES: Record<string, string> = {
  mclaren: 'McLaren',
  ferrari: 'Ferrari',
  redbull: 'Red Bull',
  mercedes: 'Mercedes',
  williams: 'Williams',
  astonmartin: 'Aston Martin',
  audi: 'Audi',
  alpine: 'Alpine',
  haas: 'Haas',
  racingbulls: 'Racing Bulls',
  cadillac: 'Cadillac',
}

export const TeamBadge: React.FC<TeamBadgeProps> = ({
  teamId,
  size = 'large',
  variant,
  className,
}) => {
  const spriteSize = size === 'large' ? 64 : 32
  const spriteVariant = variant === 'logo' ? 'logo' : 'badge'
  const spriteSuffix = size === 'large' ? '64' : '32'

  const src = `/sprites/teams/${teamId}-${spriteVariant}-${spriteSuffix}.png`
  const alt = `${TEAM_NAMES[teamId] || teamId} ${variant}`

  return <Sprite src={src} alt={alt} size={spriteSize} className={className} />
}
```

**Step 4: Run test to verify it passes**

```bash
npm run test src/components/ui/TeamBadge.test.tsx
```

Expected: `PASS`

**Step 5: Commit**

```bash
git add src/components/ui/TeamBadge.tsx src/components/ui/TeamBadge.test.tsx
git commit -m "feat: add TeamBadge component for team logo/badge rendering"
```

---

## Task 18: Update Team Data with Sprite Paths

**Files:**

- Modify: `src/data/teams.ts`

**Step 1: Read current team data structure**

```bash
cat src/data/teams.ts | head -30
```

**Step 2: Add spritePaths to Team interface**

Find the `Team` interface and add:

```typescript
interface Team {
  id: string
  name: string
  colors: {
    primary: string
    secondary: string
  }
  spritePaths: {
    logo64: string
    logo32: string
    badge: string
  }
  // ... existing fields
}
```

**Step 3: Update each team with sprite paths**

For McLaren:

```typescript
{
  id: 'mclaren',
  name: 'McLaren',
  colors: {
    primary: '#ff8000',
    secondary: '#47c7fc',
  },
  spritePaths: {
    logo64: '/sprites/teams/mclaren-logo-64.png',
    logo32: '/sprites/teams/mclaren-badge-32.png',
    badge: '/sprites/teams/mclaren-badge-32.png',
  },
  // ... rest of McLaren data
}
```

Repeat for all 10 teams.

**Step 4: Commit**

```bash
git add src/data/teams.ts
git commit -m "feat: add sprite paths to team data"
```

---

## Task 19: Import Design Tokens into App

**Files:**

- Modify: `src/main.tsx` or `src/App.tsx`

**Step 1: Import design tokens CSS**

At the top of `src/main.tsx` (or wherever global styles are imported):

```typescript
import './styles/design-tokens.css'
```

**Step 2: Verify import works**

```bash
npm run dev
```

Open browser dev tools, inspect an element, check that CSS variables are available:

- Should see `--bg-base`, `--team-mclaren-primary`, etc. in computed styles

**Step 3: Commit**

```bash
git add src/main.tsx
git commit -m "feat: import design tokens CSS globally"
```

---

## Task 20: Create Pixel Art Style Guide Document

**Files:**

- Create: `docs/pixel-art-style-guide.md`

**Step 1: Write style guide**

File: `docs/pixel-art-style-guide.md`

```markdown
# F1 Broadcast UI - Pixel Art Style Guide

## Overview

This guide defines the standards for creating pixel art assets for the F1 racing game UI.

## Palette

**Always use the master palette:** `assets-source/f1-broadcast-palette.aseprite`

Import this palette into every new Aseprite project before starting.

## Color Usage

### Backgrounds

- `#0a0a0f` - Base background (almost black)
- `#1a1a24` - Elevated surfaces (cards, panels)
- `#2a2a38` - Borders and dividers

### Team Colors

Use team primary colors for:

- Main branding elements (logos, team names)
- Timing tower backgrounds
- Button accents

Use team secondary colors for:

- Highlights and accents
- Secondary branding elements

### Broadcast Accents

- `#ffd700` (yellow) - Warnings, important info
- `#00ff41` (green) - Success, confirmations
- `#ff2a6d` (magenta) - Critical alerts, errors
- `#47c7fc` (blue) - Info, tooltips

## Sprite Sizes

Stick to these standard sizes:

- **64x64px** - Large logos, main team branding
- **48x48px** - Cars, component icons
- **32x32px** - Small badges, UI icons (large)
- **24x24px** - UI icons (medium)
- **16x16px** - Tiny indicators, status icons

## Design Principles

### 1. Readability First

- **Test at 1x zoom** - If you can't tell what it is at actual size, redesign it
- **Strong silhouettes** - The shape should be recognizable even as a black outline
- **High contrast** - Don't use similar colors next to each other

### 2. Pixel Placement

- **Every pixel matters** - Each pixel is a deliberate design decision
- **No anti-aliasing by default** - Embrace hard edges (exceptions: diagonal lines)
- **Avoid dithering** - Use solid colors, reserve dithering for special cases

### 3. Color Economy

- **2-4 colors per sprite** - More colors = harder to read at small sizes
- **Use palette colors only** - Never pick colors outside the master palette

### 4. Animation

- **4 frames or fewer** - Most loops should be 3-4 frames
- **Discrete frames** - No sub-pixel movement
- **Purposeful motion** - Every animation should communicate something

## Do's and Don'ts

### ✅ DO

- Use the master palette
- Test readability at actual size (1x zoom)
- Keep designs simple and bold
- Use hard edges and solid colors
- Center sprites in their canvas
- Export with transparency

### ❌ DON'T

- Add anti-aliasing everywhere (only on diagonals if needed)
- Use gradients (use stepped color transitions instead)
- Make sprites too detailed for their size
- Use colors outside the palette
- Forget to save source .aseprite files

## Workflow Checklist

For every new sprite:

- [ ] Create new file in Aseprite
- [ ] Import master palette
- [ ] Design at target size (don't scale up/down)
- [ ] Test readability at 1x zoom
- [ ] Save .aseprite source to `assets-source/`
- [ ] Export PNG to `public/sprites/`
- [ ] Optimize with pngquant (optional)
- [ ] Commit both source and exported PNG

## File Naming

Pattern: `{category}-{name}-{variant}-{size}.png`

Examples:

- `team-mclaren-logo-64.png`
- `car-ferrari-damaged-48.png`
- `ui-icon-money-24.png`
- `component-engine-critical-48.png`

## References

- Aseprite tutorials: https://www.aseprite.org/docs/
- Pixel art fundamentals: https://blog.studiominiboss.com/pixelart
- Design document: `docs/plans/2026-02-15-f1-broadcast-ui-redesign-design.md`
```

**Step 2: Commit style guide**

```bash
git add docs/pixel-art-style-guide.md
git commit -m "docs: add pixel art style guide for broadcast UI"
```

---

## Task 21: Phase 1 Complete - Validation & Review

**Step 1: Verify all team sprites exist**

```bash
ls -la public/sprites/teams/
```

Expected output: 20 PNG files (10 teams × 2 sizes)

**Step 2: Verify React components work**

Create a test page to render all team badges:

File: `src/components/ui/TeamBadgeShowcase.tsx` (temporary, for validation)

```typescript
import { TeamBadge } from './TeamBadge'

const TEAMS = ['mclaren', 'ferrari', 'redbull', 'mercedes', 'williams',
               'astonmartin', 'audi', 'alpine', 'haas', 'racingbulls', 'cadillac']

export const TeamBadgeShowcase = () => {
  return (
    <div style={{ background: '#0a0a0f', padding: '32px' }}>
      <h2 style={{ color: 'white' }}>Large Logos (64x64)</h2>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '32px' }}>
        {TEAMS.map(team => (
          <TeamBadge key={team} teamId={team} size="large" variant="logo" />
        ))}
      </div>

      <h2 style={{ color: 'white' }}>Small Badges (32x32)</h2>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {TEAMS.map(team => (
          <TeamBadge key={team} teamId={team} size="small" variant="badge" />
        ))}
      </div>
    </div>
  )
}
```

**Step 3: Temporarily add to App for visual testing**

In `App.tsx`:

```typescript
import { TeamBadgeShowcase } from './components/ui/TeamBadgeShowcase'

// Add to render:
<TeamBadgeShowcase />
```

**Step 4: Run dev server and verify**

```bash
npm run dev
```

Open browser, verify:

- All 10 teams have logos visible
- Logos are crisp (pixelated rendering)
- Colors match design tokens
- No missing images (broken image icons)

**Step 5: Remove showcase component (clean up)**

```bash
git rm src/components/ui/TeamBadgeShowcase.tsx
```

Remove import from App.tsx

**Step 6: Run tests**

```bash
npm run test
```

All tests should pass.

**Step 7: Final commit**

```bash
git add .
git commit -m "feat: complete Phase 1 - design foundation with all team sprites and base components"
```

---

## Phase 1 Complete! ✅

**Deliverables:**

- ✅ Color palette system (CSS variables)
- ✅ Master Aseprite palette
- ✅ 10 team logos (64x64)
- ✅ 10 team badges (32x32)
- ✅ Sprite component infrastructure (Sprite, TeamBadge)
- ✅ Team data updated with sprite paths
- ✅ File organization (sprites/, assets-source/)
- ✅ Pixel art style guide documentation

**What's Next:**

- **Phase 2**: Component Library - cars, components, UI icons, track layouts
- **Phase 3**: Team Select & HQ screen redesign
- **Phase 4+**: Race weekend screens, animations, polish

**Assets Created:** 20 sprite files + React components + design system
**Estimated Time:** 1-2 weeks (depending on pixel art experience)

---

## Notes for Implementation

1. **Aseprite Required**: You'll need Aseprite installed (or alternative like Pixelorama)
2. **Pixel Art Skills**: If new to pixel art, start with simpler shapes, iterate
3. **Git LFS**: Make sure Git LFS is set up before committing large PNG files
4. **Flexibility**: The exact design of each team logo is creative - use the color palette but express team personality
5. **Testing**: Visual testing is important - actually view the sprites in-browser to ensure they work

**Ready to implement? Follow tasks 1-21 in sequence!**
