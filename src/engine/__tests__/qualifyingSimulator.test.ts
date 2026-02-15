import { describe, it, expect } from 'vitest'
import { simulateQualifying } from '../qualifyingSimulator'
import { teams } from '../../data/teams'
import { drivers } from '../../data/drivers'
import { tracks } from '../../data/tracks'

describe('simulateQualifying', () => {
  it('returns 22 results sorted by time', () => {
    const results = simulateQualifying({
      teams,
      drivers,
      track: tracks[0],
      weather: 'dry',
      playerDriverId: 'verstappen',
      playerMode: 'push',
    })
    expect(results).toHaveLength(22)
    for (let i = 1; i < results.length; i++) {
      expect(results[i].time).toBeGreaterThanOrEqual(results[i - 1].time)
    }
  })

  it('each result has position, driverId, time', () => {
    const results = simulateQualifying({
      teams,
      drivers,
      track: tracks[0],
      weather: 'dry',
      playerDriverId: 'verstappen',
      playerMode: 'safe',
    })
    expect(results[0]).toHaveProperty('position')
    expect(results[0]).toHaveProperty('driverId')
    expect(results[0]).toHaveProperty('time')
    expect(results[0].position).toBe(1)
  })
})
