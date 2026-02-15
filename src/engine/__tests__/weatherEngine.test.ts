import { describe, it, expect } from 'vitest'
import { getNextWeather, simulateWeatherForLap } from '../weatherEngine'

describe('getNextWeather', () => {
  it('dry can transition to light-rain', () => {
    const options = new Set<string>()
    for (let i = 0; i < 200; i++) {
      options.add(getNextWeather('dry'))
    }
    expect(options.has('light-rain')).toBe(true)
    expect(options.has('heavy-rain')).toBe(false)
  })

  it('light-rain can go to dry or heavy-rain', () => {
    const options = new Set<string>()
    for (let i = 0; i < 200; i++) {
      options.add(getNextWeather('light-rain'))
    }
    expect(options.has('dry')).toBe(true)
    expect(options.has('heavy-rain')).toBe(true)
  })
})

describe('simulateWeatherForLap', () => {
  it('returns same weather when chance is 0', () => {
    for (let i = 0; i < 50; i++) {
      expect(simulateWeatherForLap('dry', 0)).toBe('dry')
    }
  })
})
