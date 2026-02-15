import { randomChance, randomBetween } from '../utils/random'

type IncidentType = 'none' | 'spin' | 'mechanical' | 'collision'

export interface IncidentResult {
  type: IncidentType
  timeLost: number
  dnf: boolean
}

export function checkForIncident(params: {
  aggression: number
  reliability: number
  extraDNFChance?: number
  incidentMultiplier?: number
}): IncidentResult {
  // Component-based DNF chance (spread over ~53 laps)
  if (params.extraDNFChance && params.extraDNFChance > 0) {
    if (randomChance(params.extraDNFChance / 53)) {
      return { type: 'mechanical', timeLost: 0, dnf: true }
    }
  }

  const baseChance = 0.002
  const modifier = 1 + params.aggression * 0.005 - params.reliability * 0.003
  const chance = baseChance * Math.max(0.1, modifier) * (params.incidentMultiplier ?? 1)
  if (!randomChance(chance)) return { type: 'none', timeLost: 0, dnf: false }
  const roll = Math.random()
  if (roll < 0.5) return { type: 'spin', timeLost: randomBetween(3, 7), dnf: false }
  if (roll < 0.8) return { type: 'mechanical', timeLost: 0, dnf: true }
  return { type: 'collision', timeLost: randomBetween(5, 15), dnf: Math.random() < 0.3 }
}

export function compressGaps(cumulativeTimes: number[]): number[] {
  if (cumulativeTimes.length === 0) return []
  const leader = cumulativeTimes[0]
  return cumulativeTimes.map((_, i) => leader + i * 0.2)
}
