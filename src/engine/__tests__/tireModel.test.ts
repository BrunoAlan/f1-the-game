import { describe, it, expect } from 'vitest'
import { calculateTireGrip, getEffectiveDegradation, getWeatherGripMultiplier } from '../tireModel'

describe('calculateTireGrip', () => {
  it('returns gripBase on fresh tires (lap 0)', () => {
    const grip = calculateTireGrip('soft', 0, 50)
    expect(grip).toBeCloseTo(0.97)
  })

  it('degrades over laps', () => {
    const fresh = calculateTireGrip('soft', 0, 50)
    const worn = calculateTireGrip('soft', 10, 50)
    expect(worn).toBeGreaterThan(fresh)
  })

  it('better tire management reduces degradation', () => {
    const lowMgmt = calculateTireGrip('soft', 10, 30)
    const highMgmt = calculateTireGrip('soft', 10, 90)
    expect(highMgmt).toBeLessThan(lowMgmt)
  })
})

describe('getEffectiveDegradation', () => {
  it('reduces degradation based on driver skill', () => {
    const base = getEffectiveDegradation('soft', 0)
    const skilled = getEffectiveDegradation('soft', 100)
    expect(skilled).toBeLessThan(base)
  })
})

describe('getWeatherGripMultiplier', () => {
  it('slicks in dry = 1.0', () => {
    expect(getWeatherGripMultiplier('soft', 'dry')).toBe(1.0)
  })
  it('slicks in heavy rain = 1.60', () => {
    expect(getWeatherGripMultiplier('medium', 'heavy-rain')).toBe(1.60)
  })
  it('wets in heavy rain = 1.0', () => {
    expect(getWeatherGripMultiplier('wet', 'heavy-rain')).toBe(1.0)
  })
})
