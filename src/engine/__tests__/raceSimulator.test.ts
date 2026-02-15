import { describe, it, expect } from 'vitest'
import { createInitialRaceState, simulateLap } from '../raceSimulator'
import { teams } from '../../data/teams'
import { drivers } from '../../data/drivers'
import { tracks } from '../../data/tracks'

describe('createInitialRaceState', () => {
  it('creates state with 22 car entries', () => {
    const grid = drivers.map((d, i) => ({ driverId: d.id, position: i + 1 }))
    const state = createInitialRaceState({
      teams,
      drivers,
      track: tracks[0],
      grid,
      weather: 'dry',
      playerDriverId: 'verstappen',
    })
    expect(state.cars).toHaveLength(22)
    expect(state.currentLap).toBe(0)
  })
})

describe('simulateLap', () => {
  it('advances lap by 1', () => {
    const grid = drivers.map((d, i) => ({ driverId: d.id, position: i + 1 }))
    const state = createInitialRaceState({
      teams,
      drivers,
      track: tracks[0],
      grid,
      weather: 'dry',
      playerDriverId: 'verstappen',
    })
    const next = simulateLap(state)
    expect(next.currentLap).toBe(1)
  })

  it('reduces fuel load', () => {
    const grid = drivers.map((d, i) => ({ driverId: d.id, position: i + 1 }))
    const state = createInitialRaceState({
      teams,
      drivers,
      track: tracks[0],
      grid,
      weather: 'dry',
      playerDriverId: 'verstappen',
    })
    const next = simulateLap(state)
    expect(next.cars[0].fuelLoad).toBeLessThan(state.cars[0].fuelLoad)
  })
})
