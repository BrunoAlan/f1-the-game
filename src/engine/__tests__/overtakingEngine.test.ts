import { describe, it, expect } from 'vitest'
import { reduceGap, attemptOvertake } from '../overtakingEngine'

describe('reduceGap', () => {
  it('reduces gap by 70% of time difference', () => {
    expect(reduceGap(2.0, 0.5)).toBeCloseTo(1.65)
  })
  it('gap cannot go below 0', () => {
    expect(reduceGap(0.1, 2.0)).toBe(0)
  })
})

describe('attemptOvertake', () => {
  it('returns false if gap > 0.5', () => {
    const result = attemptOvertake({
      gap: 1.0,
      attackerAggression: 90,
      speedDiff: 5,
      overtakingDifficulty: 30,
    })
    expect(result.overtook).toBe(false)
  })
  it('returns a boolean when gap < 0.5', () => {
    const result = attemptOvertake({
      gap: 0.3,
      attackerAggression: 90,
      speedDiff: 5,
      overtakingDifficulty: 30,
    })
    expect(typeof result.overtook).toBe('boolean')
  })
})
