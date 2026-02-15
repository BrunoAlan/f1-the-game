import { describe, it, expect } from 'vitest'
import { calculateLapTime } from '../lapSimulator'
import type { WeatherCondition } from '../../data/types'

const baseCar = { topSpeed: 90, cornering: 90 }
const baseDriver = { speed: 85, tireManagement: 80 }
const baseParams = {
  car: baseCar,
  driver: baseDriver,
  tireCompound: 'medium' as const,
  lapsOnTire: 0,
  fuelLoad: 0.5,
  weather: 'dry' as WeatherCondition,
  baseLapTime: 80,
}

describe('calculateLapTime', () => {
  it('returns a time close to baseLapTime', () => {
    const time = calculateLapTime(baseParams)
    expect(time).toBeGreaterThan(60)
    expect(time).toBeLessThan(100)
  })

  it('faster car produces faster lap time on average', () => {
    const times: number[] = []
    for (let i = 0; i < 100; i++) {
      times.push(calculateLapTime({ ...baseParams, car: { topSpeed: 99, cornering: 99 } }))
    }
    const avgFast = times.reduce((a, b) => a + b) / times.length

    const slowTimes: number[] = []
    for (let i = 0; i < 100; i++) {
      slowTimes.push(calculateLapTime({ ...baseParams, car: { topSpeed: 60, cornering: 60 } }))
    }
    const avgSlow = slowTimes.reduce((a, b) => a + b) / slowTimes.length
    expect(avgFast).toBeLessThan(avgSlow)
  })

  it('more fuel makes laps slower on average', () => {
    const lightTimes: number[] = []
    const heavyTimes: number[] = []
    for (let i = 0; i < 100; i++) {
      lightTimes.push(calculateLapTime({ ...baseParams, fuelLoad: 0.1 }))
      heavyTimes.push(calculateLapTime({ ...baseParams, fuelLoad: 1.0 }))
    }
    const avgLight = lightTimes.reduce((a, b) => a + b) / lightTimes.length
    const avgHeavy = heavyTimes.reduce((a, b) => a + b) / heavyTimes.length
    expect(avgLight).toBeLessThan(avgHeavy)
  })
})
