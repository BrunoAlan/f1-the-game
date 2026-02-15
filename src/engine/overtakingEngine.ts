import { randomChance } from '../utils/random'

interface OvertakeParams {
  gap: number
  attackerAggression: number
  speedDiff: number
  overtakingDifficulty: number
}

interface OvertakeResult {
  overtook: boolean
}

export function reduceGap(currentGap: number, timeDifference: number): number {
  return Math.max(0, currentGap - timeDifference * 0.7)
}

export function attemptOvertake(params: OvertakeParams): OvertakeResult {
  const { gap, attackerAggression, speedDiff, overtakingDifficulty } = params
  if (gap > 0.5) return { overtook: false }
  const chance = (attackerAggression * 0.4 + speedDiff * 0.3) * (1 - overtakingDifficulty * 0.01) / 100
  return { overtook: randomChance(Math.max(0, Math.min(1, chance))) }
}
