import type {
  Team,
  RDUpgrades,
  RDArea,
  ComponentState,
  ComponentType,
  Sponsor,
  TrackType,
} from '../data/types'
import { rdTree } from '../data/rdTree'
import { randomBetween } from '../utils/random'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const RACE_ENTRY_FEE = 100_000

export const COMPONENT_REPLACEMENT_COSTS: Record<ComponentType, number> = {
  engine: 1_500_000,
  gearbox: 800_000,
  'energy-recovery': 600_000,
}

const RACE_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]
const SPRINT_POINTS = [8, 7, 6, 5, 4, 3, 2, 1]
const RACE_PRIZE_MONEY = [
  500_000, 450_000, 400_000, 350_000, 300_000, 250_000, 200_000, 150_000, 100_000, 50_000,
]
const SPRINT_PRIZE_MONEY = [100_000, 85_000, 70_000, 60_000, 50_000, 40_000, 25_000, 10_000]
const RP_TABLE = [15, 12, 10, 8, 7, 6, 5, 4, 3, 2]

const CRITICAL_THRESHOLDS: Record<ComponentType, number> = {
  engine: 20,
  gearbox: 15,
  'energy-recovery': 15,
}

const WEAR_RANGES: Record<ComponentType, { race: [number, number]; sprint: [number, number] }> = {
  engine: { race: [3, 5], sprint: [2, 3] },
  gearbox: { race: [2, 4], sprint: [1, 2] },
  'energy-recovery': { race: [2, 3], sprint: [1, 2] },
}

// ---------------------------------------------------------------------------
// 1. getModifiedTeamStats
// ---------------------------------------------------------------------------

export interface ModifiedTeamStats {
  topSpeed: number
  cornering: number
  tireLifeBonus: number
  pitTimeBonus: number
  fuelConsumptionMod: number
  engineWearMod: number
  pitErrorMod: number
}

export function getModifiedTeamStats(team: Team, rdUpgrades: RDUpgrades): ModifiedTeamStats {
  let topSpeed = team.topSpeed
  let cornering = team.cornering
  let tireLifeBonus = 0
  let pitTimeBonus = 0
  let fuelConsumptionMod = 0
  let engineWearMod = 0
  let pitErrorMod = 0

  const areas: RDArea[] = ['motor', 'aero', 'chasis', 'pitcrew']

  for (const area of areas) {
    const upgrade = rdUpgrades[area]
    const tree = rdTree[area]

    if (upgrade.base) {
      const effects = tree.base.effects
      topSpeed += effects.topSpeed ?? 0
      cornering += effects.cornering ?? 0
      tireLifeBonus += effects.tireLife ?? 0
      pitTimeBonus += effects.pitTime ?? 0
      fuelConsumptionMod += effects.fuelConsumption ?? 0
      engineWearMod += effects.engineWear ?? 0
      pitErrorMod += effects.pitErrorChance ?? 0
    }

    if (upgrade.branch !== null) {
      const branchNode =
        upgrade.branch === 'a' ? tree.branches[0] : tree.branches[1]
      const effects = branchNode.effects
      topSpeed += effects.topSpeed ?? 0
      cornering += effects.cornering ?? 0
      tireLifeBonus += effects.tireLife ?? 0
      pitTimeBonus += effects.pitTime ?? 0
      fuelConsumptionMod += effects.fuelConsumption ?? 0
      engineWearMod += effects.engineWear ?? 0
      pitErrorMod += effects.pitErrorChance ?? 0
    }
  }

  return {
    topSpeed,
    cornering,
    tireLifeBonus,
    pitTimeBonus,
    fuelConsumptionMod,
    engineWearMod,
    pitErrorMod,
  }
}

// ---------------------------------------------------------------------------
// 2. getComponentDNFChance
// ---------------------------------------------------------------------------

export function getComponentDNFChance(components: ComponentState[]): number {
  // Any component at 0%: guaranteed DNF
  if (components.some((c) => c.healthPercent <= 0)) {
    return 1
  }

  // Check each component against its critical threshold
  let maxChance = 0
  for (const c of components) {
    const threshold = CRITICAL_THRESHOLDS[c.type]
    if (c.healthPercent < threshold) {
      const severity = (threshold - c.healthPercent) / threshold
      const chance = 0.3 * severity + 0.1
      maxChance = Math.max(maxChance, chance)
    }
  }

  return maxChance
}

// ---------------------------------------------------------------------------
// 3. applyComponentWear
// ---------------------------------------------------------------------------

export function applyComponentWear(
  components: ComponentState[],
  sessionType: 'race' | 'sprint',
  extraEngineWear: number = 0,
): ComponentState[] {
  return components.map((c) => {
    const range = WEAR_RANGES[c.type][sessionType]
    let wear = randomBetween(range[0], range[1])

    if (c.type === 'engine') {
      wear += extraEngineWear
    }

    return {
      type: c.type,
      healthPercent: Math.max(0, c.healthPercent - wear),
      racesUsed: c.racesUsed + 1,
    }
  })
}

// ---------------------------------------------------------------------------
// 4. replaceComponent
// ---------------------------------------------------------------------------

export function replaceComponent(
  components: ComponentState[],
  type: ComponentType,
): ComponentState[] {
  return components.map((c) =>
    c.type === type ? { type: c.type, healthPercent: 100, racesUsed: 0 } : { ...c },
  )
}

// ---------------------------------------------------------------------------
// 5. calculateRacePoints
// ---------------------------------------------------------------------------

export function calculateRacePoints(position: number): number {
  if (position >= 1 && position <= 10) {
    return RACE_POINTS[position - 1]
  }
  return 0
}

// ---------------------------------------------------------------------------
// 6. calculateSprintPoints
// ---------------------------------------------------------------------------

export function calculateSprintPoints(position: number): number {
  if (position >= 1 && position <= 8) {
    return SPRINT_POINTS[position - 1]
  }
  return 0
}

// ---------------------------------------------------------------------------
// 7. calculateRacePrizeMoney
// ---------------------------------------------------------------------------

export function calculateRacePrizeMoney(position: number): number {
  if (position >= 1 && position <= 10) {
    return RACE_PRIZE_MONEY[position - 1]
  }
  return 0
}

// ---------------------------------------------------------------------------
// 8. calculateSprintPrizeMoney
// ---------------------------------------------------------------------------

export function calculateSprintPrizeMoney(position: number): number {
  if (position >= 1 && position <= 8) {
    return SPRINT_PRIZE_MONEY[position - 1]
  }
  return 0
}

// ---------------------------------------------------------------------------
// 9. checkSponsorObjective
// ---------------------------------------------------------------------------

export interface SponsorOutcome {
  bestFinish?: number
  bothFinished?: boolean
  won?: boolean
  bestQualifying?: number
  scoredSprintPoints?: boolean
}

export function checkSponsorObjective(sponsor: Sponsor, outcome: SponsorOutcome): boolean {
  const obj = sponsor.objective

  switch (obj.type) {
    case 'finish-top':
      return (outcome.bestFinish ?? Infinity) <= obj.position
    case 'both-finish':
      return outcome.bothFinished === true
    case 'win':
      return outcome.won === true
    case 'qualify-top':
      return (outcome.bestQualifying ?? Infinity) <= obj.position
    case 'score-sprint-points':
      return outcome.scoredSprintPoints === true
    default:
      return false
  }
}

// ---------------------------------------------------------------------------
// 10. getTrackTypeModifiers
// ---------------------------------------------------------------------------

export interface TrackTypeModifiers {
  incidentMultiplier: number
  topSpeedWeight: number
  corneringWeight: number
}

const TRACK_TYPE_MODIFIERS: Record<TrackType, TrackTypeModifiers> = {
  street: { incidentMultiplier: 1.5, topSpeedWeight: 0.8, corneringWeight: 1.2 },
  'high-speed': { incidentMultiplier: 0.9, topSpeedWeight: 1.3, corneringWeight: 0.8 },
  technical: { incidentMultiplier: 1.1, topSpeedWeight: 0.8, corneringWeight: 1.3 },
  balanced: { incidentMultiplier: 1.0, topSpeedWeight: 1.0, corneringWeight: 1.0 },
}

export function getTrackTypeModifiers(type: TrackType): TrackTypeModifiers {
  return TRACK_TYPE_MODIFIERS[type]
}

// ---------------------------------------------------------------------------
// 11. calculateRP
// ---------------------------------------------------------------------------

export function calculateRP(racePosition: number, practiceDataPercent: number): number {
  const baseRP = racePosition >= 1 && racePosition <= 10 ? RP_TABLE[racePosition - 1] : 1
  const bonus = practiceDataPercent >= 100 ? 5 : 0
  return baseRP + bonus
}
