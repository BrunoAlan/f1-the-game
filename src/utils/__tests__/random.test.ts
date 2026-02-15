import { describe, it, expect } from 'vitest'
import { randomBetween, randomChance } from '../random'

describe('randomBetween', () => {
  it('returns a value within the specified range', () => {
    for (let i = 0; i < 100; i++) {
      const val = randomBetween(-0.3, 0.3)
      expect(val).toBeGreaterThanOrEqual(-0.3)
      expect(val).toBeLessThanOrEqual(0.3)
    }
  })
})

describe('randomChance', () => {
  it('returns boolean', () => {
    expect(typeof randomChance(0.5)).toBe('boolean')
  })

  it('always true at 100%', () => {
    for (let i = 0; i < 50; i++) {
      expect(randomChance(1)).toBe(true)
    }
  })

  it('always false at 0%', () => {
    for (let i = 0; i < 50; i++) {
      expect(randomChance(0)).toBe(false)
    }
  })
})
