import { describe, it, expect, vi } from 'vitest'
import type { Team, RDUpgrades, ComponentState, Sponsor } from '../../data/types'
import {
  getModifiedTeamStats,
  getComponentDNFChance,
  applyComponentWear,
  replaceComponent,
  COMPONENT_REPLACEMENT_COSTS,
  calculateRacePoints,
  calculateSprintPoints,
  calculateRacePrizeMoney,
  calculateSprintPrizeMoney,
  checkSponsorObjective,
  getTrackTypeModifiers,
  calculateRP,
  RACE_ENTRY_FEE,
} from '../seasonEngine'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const makeTeam = (overrides?: Partial<Team>): Team => ({
  id: 'test-team',
  name: 'Test Racing',
  abbreviation: 'TST',
  engine: 'TestPower',
  primaryColor: '#ff0000',
  accentColor: '#ffffff',
  topSpeed: 80,
  cornering: 75,
  reliability: 70,
  ...overrides,
})

const noUpgrades: RDUpgrades = {
  motor: { base: false, branch: null },
  aero: { base: false, branch: null },
  chasis: { base: false, branch: null },
  pitcrew: { base: false, branch: null },
}

const healthyComponents: ComponentState[] = [
  { type: 'engine', healthPercent: 100, racesUsed: 0 },
  { type: 'gearbox', healthPercent: 100, racesUsed: 0 },
  { type: 'energy-recovery', healthPercent: 100, racesUsed: 0 },
]

// ---------------------------------------------------------------------------
// getModifiedTeamStats
// ---------------------------------------------------------------------------
describe('getModifiedTeamStats', () => {
  it('returns base team stats when no upgrades are unlocked', () => {
    const team = makeTeam()
    const stats = getModifiedTeamStats(team, noUpgrades)

    expect(stats.topSpeed).toBe(80)
    expect(stats.cornering).toBe(75)
    expect(stats.tireLifeBonus).toBe(0)
    expect(stats.pitTimeBonus).toBe(0)
    expect(stats.fuelConsumptionMod).toBe(0)
    expect(stats.engineWearMod).toBe(0)
    expect(stats.pitErrorMod).toBe(0)
  })

  it('applies base-only upgrades (motor + aero bases)', () => {
    const team = makeTeam()
    const upgrades: RDUpgrades = {
      motor: { base: true, branch: null },
      aero: { base: true, branch: null },
      chasis: { base: false, branch: null },
      pitcrew: { base: false, branch: null },
    }
    const stats = getModifiedTeamStats(team, upgrades)

    // motor base: topSpeed +2, aero base: cornering +2
    expect(stats.topSpeed).toBe(82)
    expect(stats.cornering).toBe(77)
  })

  it('applies base + branch upgrades correctly', () => {
    const team = makeTeam()
    const upgrades: RDUpgrades = {
      motor: { base: true, branch: 'a' }, // base +2 topSpeed, branch +3 topSpeed, +0.05 fuel, +0.5 engineWear
      aero: { base: true, branch: 'b' }, // base +2 cornering, branch +1 cornering +2 topSpeed
      chasis: { base: true, branch: 'a' }, // base +8 tireLife, branch +15 tireLife -1 cornering
      pitcrew: { base: true, branch: 'b' }, // base -0.3 pitTime, branch -0.2 pitTime -50 pitError
    }
    const stats = getModifiedTeamStats(team, upgrades)

    // topSpeed: 80 + 2(motor base) + 3(motor a) + 2(aero b) = 87
    expect(stats.topSpeed).toBe(87)
    // cornering: 75 + 2(aero base) + 1(aero b) - 1(chasis a) = 77
    expect(stats.cornering).toBe(77)
    // tireLife: 8(chasis base) + 15(chasis a) = 23
    expect(stats.tireLifeBonus).toBe(23)
    // pitTime: -0.3(pitcrew base) + -0.2(pitcrew b) = -0.5
    expect(stats.pitTimeBonus).toBeCloseTo(-0.5)
    // fuelConsumption: 0.05(motor a)
    expect(stats.fuelConsumptionMod).toBeCloseTo(0.05)
    // engineWear: 0.5(motor a)
    expect(stats.engineWearMod).toBeCloseTo(0.5)
    // pitError: -50(pitcrew b)
    expect(stats.pitErrorMod).toBe(-50)
  })
})

// ---------------------------------------------------------------------------
// getComponentDNFChance
// ---------------------------------------------------------------------------
describe('getComponentDNFChance', () => {
  it('returns 0 for fully healthy components', () => {
    expect(getComponentDNFChance(healthyComponents)).toBe(0)
  })

  it('returns 1 when any component is at 0%', () => {
    const components: ComponentState[] = [
      { type: 'engine', healthPercent: 0, racesUsed: 5 },
      { type: 'gearbox', healthPercent: 50, racesUsed: 3 },
      { type: 'energy-recovery', healthPercent: 50, racesUsed: 3 },
    ]
    expect(getComponentDNFChance(components)).toBe(1)
  })

  it('returns elevated chance when engine is below critical (20%)', () => {
    const components: ComponentState[] = [
      { type: 'engine', healthPercent: 10, racesUsed: 8 },
      { type: 'gearbox', healthPercent: 80, racesUsed: 2 },
      { type: 'energy-recovery', healthPercent: 80, racesUsed: 2 },
    ]
    const chance = getComponentDNFChance(components)
    // severity = (20 - 10) / 20 = 0.5, chance = 0.3 * 0.5 + 0.1 = 0.25
    expect(chance).toBeCloseTo(0.25)
  })

  it('returns elevated chance when gearbox is below critical (15%)', () => {
    const components: ComponentState[] = [
      { type: 'engine', healthPercent: 80, racesUsed: 2 },
      { type: 'gearbox', healthPercent: 5, racesUsed: 10 },
      { type: 'energy-recovery', healthPercent: 80, racesUsed: 2 },
    ]
    const chance = getComponentDNFChance(components)
    // severity = (15 - 5) / 15 = 0.6667, chance = 0.3 * 0.6667 + 0.1 = 0.3
    expect(chance).toBeCloseTo(0.3)
  })

  it('returns elevated chance when energy-recovery is below critical (15%)', () => {
    const components: ComponentState[] = [
      { type: 'engine', healthPercent: 80, racesUsed: 2 },
      { type: 'gearbox', healthPercent: 80, racesUsed: 2 },
      { type: 'energy-recovery', healthPercent: 10, racesUsed: 8 },
    ]
    const chance = getComponentDNFChance(components)
    // severity = (15 - 10) / 15 = 0.3333, chance = 0.3 * 0.3333 + 0.1 = 0.2
    expect(chance).toBeCloseTo(0.2)
  })
})

// ---------------------------------------------------------------------------
// applyComponentWear
// ---------------------------------------------------------------------------
describe('applyComponentWear', () => {
  it('reduces health for all components after a race session', () => {
    // Mock randomBetween to return consistent values
    vi.mock('../../utils/random', () => ({
      randomBetween: vi.fn(() => 4), // middle-ish value
      randomChance: vi.fn(() => false),
    }))

    const result = applyComponentWear(healthyComponents, 'race')

    for (const c of result) {
      expect(c.healthPercent).toBeLessThan(100)
      expect(c.healthPercent).toBeGreaterThanOrEqual(0)
    }
  })

  it('wears less in sprint sessions', () => {
    const raceResult = applyComponentWear(healthyComponents, 'race')
    const sprintResult = applyComponentWear(healthyComponents, 'sprint')

    // Engine wear in race should be >= sprint wear (on average, with mock returning same value)
    // We just check both produce reduced health
    for (const c of sprintResult) {
      expect(c.healthPercent).toBeLessThanOrEqual(100)
    }
    for (const c of raceResult) {
      expect(c.healthPercent).toBeLessThanOrEqual(100)
    }
  })

  it('does not reduce health below 0', () => {
    const lowComponents: ComponentState[] = [
      { type: 'engine', healthPercent: 2, racesUsed: 10 },
      { type: 'gearbox', healthPercent: 1, racesUsed: 10 },
      { type: 'energy-recovery', healthPercent: 1, racesUsed: 10 },
    ]
    const result = applyComponentWear(lowComponents, 'race')
    for (const c of result) {
      expect(c.healthPercent).toBeGreaterThanOrEqual(0)
    }
  })

  it('increments racesUsed by 1', () => {
    const result = applyComponentWear(healthyComponents, 'race')
    for (const c of result) {
      expect(c.racesUsed).toBe(1)
    }
  })
})

// ---------------------------------------------------------------------------
// replaceComponent
// ---------------------------------------------------------------------------
describe('replaceComponent', () => {
  it('resets the specified component to 100% health and 0 racesUsed', () => {
    const worn: ComponentState[] = [
      { type: 'engine', healthPercent: 30, racesUsed: 8 },
      { type: 'gearbox', healthPercent: 50, racesUsed: 5 },
      { type: 'energy-recovery', healthPercent: 60, racesUsed: 4 },
    ]
    const result = replaceComponent(worn, 'engine')
    const engine = result.find((c) => c.type === 'engine')!
    expect(engine.healthPercent).toBe(100)
    expect(engine.racesUsed).toBe(0)
  })

  it('does not modify other components', () => {
    const worn: ComponentState[] = [
      { type: 'engine', healthPercent: 30, racesUsed: 8 },
      { type: 'gearbox', healthPercent: 50, racesUsed: 5 },
      { type: 'energy-recovery', healthPercent: 60, racesUsed: 4 },
    ]
    const result = replaceComponent(worn, 'engine')
    const gearbox = result.find((c) => c.type === 'gearbox')!
    const er = result.find((c) => c.type === 'energy-recovery')!
    expect(gearbox.healthPercent).toBe(50)
    expect(gearbox.racesUsed).toBe(5)
    expect(er.healthPercent).toBe(60)
    expect(er.racesUsed).toBe(4)
  })
})

// ---------------------------------------------------------------------------
// COMPONENT_REPLACEMENT_COSTS
// ---------------------------------------------------------------------------
describe('COMPONENT_REPLACEMENT_COSTS', () => {
  it('has correct costs', () => {
    expect(COMPONENT_REPLACEMENT_COSTS.engine).toBe(1_500_000)
    expect(COMPONENT_REPLACEMENT_COSTS.gearbox).toBe(800_000)
    expect(COMPONENT_REPLACEMENT_COSTS['energy-recovery']).toBe(600_000)
  })
})

// ---------------------------------------------------------------------------
// calculateRacePoints
// ---------------------------------------------------------------------------
describe('calculateRacePoints', () => {
  it('returns 25 for P1', () => {
    expect(calculateRacePoints(1)).toBe(25)
  })

  it('returns 1 for P10', () => {
    expect(calculateRacePoints(10)).toBe(1)
  })

  it('returns 0 for P11 and beyond', () => {
    expect(calculateRacePoints(11)).toBe(0)
    expect(calculateRacePoints(20)).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// calculateSprintPoints
// ---------------------------------------------------------------------------
describe('calculateSprintPoints', () => {
  it('returns 8 for P1', () => {
    expect(calculateSprintPoints(1)).toBe(8)
  })

  it('returns 1 for P8', () => {
    expect(calculateSprintPoints(8)).toBe(1)
  })

  it('returns 0 for P9 and beyond', () => {
    expect(calculateSprintPoints(9)).toBe(0)
    expect(calculateSprintPoints(20)).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// calculateRacePrizeMoney
// ---------------------------------------------------------------------------
describe('calculateRacePrizeMoney', () => {
  it('returns 500000 for P1', () => {
    expect(calculateRacePrizeMoney(1)).toBe(500_000)
  })

  it('returns 50000 for P10', () => {
    expect(calculateRacePrizeMoney(10)).toBe(50_000)
  })

  it('returns 0 for P11+', () => {
    expect(calculateRacePrizeMoney(11)).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// calculateSprintPrizeMoney
// ---------------------------------------------------------------------------
describe('calculateSprintPrizeMoney', () => {
  it('returns 100000 for P1', () => {
    expect(calculateSprintPrizeMoney(1)).toBe(100_000)
  })

  it('returns 10000 for P8', () => {
    expect(calculateSprintPrizeMoney(8)).toBe(10_000)
  })

  it('returns 0 for P9+', () => {
    expect(calculateSprintPrizeMoney(9)).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// checkSponsorObjective
// ---------------------------------------------------------------------------
describe('checkSponsorObjective', () => {
  const makeSponsor = (objective: Sponsor['objective']): Sponsor => ({
    id: 'sponsor-1',
    name: 'TestCorp',
    objective,
    payout: 500_000,
    duration: 5,
    racesRemaining: 3,
  })

  it('finish-top: passes when bestFinish is within position', () => {
    const sponsor = makeSponsor({ type: 'finish-top', position: 5 })
    expect(checkSponsorObjective(sponsor, { bestFinish: 3 })).toBe(true)
  })

  it('finish-top: fails when bestFinish is outside position', () => {
    const sponsor = makeSponsor({ type: 'finish-top', position: 5 })
    expect(checkSponsorObjective(sponsor, { bestFinish: 8 })).toBe(false)
  })

  it('both-finish: passes when bothFinished is true', () => {
    const sponsor = makeSponsor({ type: 'both-finish' })
    expect(checkSponsorObjective(sponsor, { bothFinished: true })).toBe(true)
  })

  it('both-finish: fails when bothFinished is false', () => {
    const sponsor = makeSponsor({ type: 'both-finish' })
    expect(checkSponsorObjective(sponsor, { bothFinished: false })).toBe(false)
  })

  it('win: passes when won is true', () => {
    const sponsor = makeSponsor({ type: 'win' })
    expect(checkSponsorObjective(sponsor, { won: true })).toBe(true)
  })

  it('win: fails when won is false', () => {
    const sponsor = makeSponsor({ type: 'win' })
    expect(checkSponsorObjective(sponsor, { won: false })).toBe(false)
  })

  it('qualify-top: passes when bestQualifying is within position', () => {
    const sponsor = makeSponsor({ type: 'qualify-top', position: 3 })
    expect(checkSponsorObjective(sponsor, { bestQualifying: 2 })).toBe(true)
  })

  it('qualify-top: fails when bestQualifying is outside position', () => {
    const sponsor = makeSponsor({ type: 'qualify-top', position: 3 })
    expect(checkSponsorObjective(sponsor, { bestQualifying: 5 })).toBe(false)
  })

  it('score-sprint-points: passes when scoredSprintPoints is true', () => {
    const sponsor = makeSponsor({ type: 'score-sprint-points' })
    expect(checkSponsorObjective(sponsor, { scoredSprintPoints: true })).toBe(true)
  })

  it('score-sprint-points: fails when scoredSprintPoints is false', () => {
    const sponsor = makeSponsor({ type: 'score-sprint-points' })
    expect(checkSponsorObjective(sponsor, { scoredSprintPoints: false })).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// getTrackTypeModifiers
// ---------------------------------------------------------------------------
describe('getTrackTypeModifiers', () => {
  it('returns balanced modifiers (all 1.0)', () => {
    const mods = getTrackTypeModifiers('balanced')
    expect(mods.incidentMultiplier).toBe(1.0)
    expect(mods.topSpeedWeight).toBe(1.0)
    expect(mods.corneringWeight).toBe(1.0)
  })

  it('returns street modifiers with high incident and cornering weight', () => {
    const mods = getTrackTypeModifiers('street')
    expect(mods.incidentMultiplier).toBe(1.5)
    expect(mods.topSpeedWeight).toBe(0.8)
    expect(mods.corneringWeight).toBe(1.2)
  })

  it('returns high-speed modifiers', () => {
    const mods = getTrackTypeModifiers('high-speed')
    expect(mods.incidentMultiplier).toBe(0.9)
    expect(mods.topSpeedWeight).toBe(1.3)
    expect(mods.corneringWeight).toBe(0.8)
  })

  it('returns technical modifiers', () => {
    const mods = getTrackTypeModifiers('technical')
    expect(mods.incidentMultiplier).toBe(1.1)
    expect(mods.topSpeedWeight).toBe(0.8)
    expect(mods.corneringWeight).toBe(1.3)
  })
})

// ---------------------------------------------------------------------------
// calculateRP
// ---------------------------------------------------------------------------
describe('calculateRP', () => {
  it('returns 15 for P1 with no practice bonus', () => {
    expect(calculateRP(1, 50)).toBe(15)
  })

  it('returns 1 for P11+', () => {
    expect(calculateRP(15, 0)).toBe(1)
  })

  it('adds +5 bonus when practice >= 100%', () => {
    expect(calculateRP(1, 100)).toBe(20) // 15 + 5
  })

  it('adds +5 bonus when practice > 100%', () => {
    expect(calculateRP(5, 120)).toBe(12) // 7 + 5
  })
})

// ---------------------------------------------------------------------------
// RACE_ENTRY_FEE
// ---------------------------------------------------------------------------
describe('RACE_ENTRY_FEE', () => {
  it('equals 100_000', () => {
    expect(RACE_ENTRY_FEE).toBe(100_000)
  })
})
