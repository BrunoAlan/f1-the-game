import type { Team, Driver, Track, WeatherCondition } from '../data/types'
import { calculateLapTime } from './lapSimulator'
import { randomBetween, randomChance } from '../utils/random'

export type QualifyingMode = 'safe' | 'push' | 'full-send'

interface QualifyingParams {
  teams: Team[]
  drivers: Driver[]
  track: Track
  weather: WeatherCondition
  playerDriverId: string
  playerMode: QualifyingMode
}

export interface QualifyingResult {
  position: number
  driverId: string
  teamId: string
  time: number
  error: boolean
}

const modeModifiers: Record<
  QualifyingMode,
  { speedBoost: number; errorChance: number; errorPenalty: number }
> = {
  safe: { speedBoost: 0.9, errorChance: 0.02, errorPenalty: 0.5 },
  push: { speedBoost: 1.0, errorChance: 0.15, errorPenalty: 1.5 },
  'full-send': { speedBoost: 1.05, errorChance: 0.35, errorPenalty: 3.0 },
}

export function simulateQualifying(params: QualifyingParams): QualifyingResult[] {
  const { teams, drivers, track, weather, playerDriverId, playerMode } = params
  const teamMap = new Map(teams.map((t) => [t.id, t]))

  const results: QualifyingResult[] = drivers.map((driver) => {
    const team = teamMap.get(driver.teamId)!
    const isPlayer = driver.id === playerDriverId
    const mode = isPlayer ? playerMode : 'push'
    const modifier = modeModifiers[mode]

    const baseLap = calculateLapTime({
      car: { topSpeed: team.topSpeed * modifier.speedBoost, cornering: team.cornering },
      driver: { speed: driver.speed, tireManagement: driver.tireManagement },
      tireCompound: 'soft',
      lapsOnTire: 0,
      fuelLoad: 0.05,
      weather,
      baseLapTime: track.baseLapTime,
    })

    const error = randomChance(modifier.errorChance)
    const time = error ? baseLap + randomBetween(0.5, modifier.errorPenalty) : baseLap

    return { position: 0, driverId: driver.id, teamId: driver.teamId, time, error }
  })

  results.sort((a, b) => a.time - b.time)
  results.forEach((r, i) => {
    r.position = i + 1
  })

  return results
}
