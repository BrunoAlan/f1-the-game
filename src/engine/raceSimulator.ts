import type { Team, Driver, Track, WeatherCondition, TireCompound } from '../data/types'
import { calculateLapTime } from './lapSimulator'
import { reduceGap, attemptOvertake } from './overtakingEngine'
import { checkForIncident, compressGaps } from './incidentEngine'
import { simulateWeatherForLap } from './weatherEngine'

export type DriverMode = 'push' | 'neutral' | 'save'

export interface CarState {
  driverId: string
  teamId: string
  tireCompound: TireCompound
  lapsOnTire: number
  fuelLoad: number
  cumulativeTime: number
  lastLapTime: number
  position: number
  dnf: boolean
  pitting: boolean
  pitThisLap: boolean
  compoundsUsed: TireCompound[]
  mode: DriverMode
}

export interface RaceEvent {
  lap: number
  type: 'overtake' | 'incident' | 'safety-car' | 'weather-change' | 'pit-stop'
  driverId: string
  message: string
}

export interface RaceState {
  cars: CarState[]
  currentLap: number
  totalLaps: number
  weather: WeatherCondition
  safetyCar: boolean
  safetyCarLapsLeft: number
  track: Track
  teams: Team[]
  drivers: Driver[]
  playerDriverId: string
  events: RaceEvent[]
}

interface InitParams {
  teams: Team[]
  drivers: Driver[]
  track: Track
  grid: { driverId: string; position: number }[]
  weather: WeatherCondition
  playerDriverId: string
}

export function createInitialRaceState(params: InitParams): RaceState {
  const { teams, drivers, track, grid, weather, playerDriverId } = params
  const driverMap = new Map(drivers.map((d) => [d.id, d]))

  const cars: CarState[] = grid
    .sort((a, b) => a.position - b.position)
    .map((g, i) => {
      const driver = driverMap.get(g.driverId)!
      return {
        driverId: g.driverId,
        teamId: driver.teamId,
        tireCompound: 'medium' as TireCompound,
        lapsOnTire: 0,
        fuelLoad: 1.0,
        cumulativeTime: i * 0.5,
        lastLapTime: 0,
        position: i + 1,
        dnf: false,
        pitting: false,
        pitThisLap: false,
        compoundsUsed: ['medium'],
        mode: 'neutral' as DriverMode,
      }
    })

  return {
    cars,
    currentLap: 0,
    totalLaps: track.totalLaps,
    weather,
    safetyCar: false,
    safetyCarLapsLeft: 0,
    track,
    teams,
    drivers,
    playerDriverId,
    events: [],
  }
}

export function simulateLap(state: RaceState): RaceState {
  const next: RaceState = JSON.parse(JSON.stringify(state))
  next.currentLap += 1
  next.events = []

  const teamMap = new Map(next.teams.map((t) => [t.id, t]))
  const driverMap = new Map(next.drivers.map((d) => [d.id, d]))

  // Weather
  const newWeather = simulateWeatherForLap(next.weather, next.track.weatherChangeChance)
  if (newWeather !== next.weather) {
    next.events.push({
      lap: next.currentLap,
      type: 'weather-change',
      driverId: '',
      message: `Weather changed to ${newWeather}`,
    })
    next.weather = newWeather
  }

  // Safety Car countdown
  if (next.safetyCar) {
    next.safetyCarLapsLeft -= 1
    if (next.safetyCarLapsLeft <= 0) {
      next.safetyCar = false
      next.events.push({
        lap: next.currentLap,
        type: 'safety-car',
        driverId: '',
        message: 'Safety Car in!',
      })
    }
  }

  // Simulate each car
  const fuelPerLap = 1.0 / next.totalLaps

  for (const car of next.cars) {
    if (car.dnf) continue

    const driver = driverMap.get(car.driverId)!
    const team = teamMap.get(car.teamId)!

    // Pit stop
    if (car.pitting) {
      car.cumulativeTime += next.track.pitLaneTimeLoss
      car.lapsOnTire = 0
      car.pitting = false
      car.pitThisLap = true
      if (!car.compoundsUsed.includes(car.tireCompound)) {
        car.compoundsUsed.push(car.tireCompound)
      }
      next.events.push({
        lap: next.currentLap,
        type: 'pit-stop',
        driverId: car.driverId,
        message: `${driver.shortName} pits for ${car.tireCompound}`,
      })
    } else {
      car.pitThisLap = false
    }

    // AI pit strategy
    if (car.driverId !== next.playerDriverId && !car.pitting) {
      let shouldPit = false
      let newCompound: TireCompound = car.tireCompound

      // Weather-reactive pitting
      const isOnSlicks =
        car.tireCompound === 'soft' || car.tireCompound === 'medium' || car.tireCompound === 'hard'
      const isOnWets = car.tireCompound === 'intermediate' || car.tireCompound === 'wet'

      const isRaining = next.weather === 'light-rain' || next.weather === 'heavy-rain'

      if (isRaining && isOnSlicks && Math.random() < 0.5) {
        shouldPit = true
        newCompound = next.weather === 'heavy-rain' ? 'wet' : 'intermediate'
      } else if (next.weather === 'dry' && isOnWets && Math.random() < 0.5) {
        shouldPit = true
        newCompound = 'medium'
      }

      // Tire degradation pitting
      if (!shouldPit) {
        if (car.lapsOnTire > 20 && car.tireCompound === 'soft') {
          shouldPit = true
          newCompound = 'hard'
        } else if (car.lapsOnTire > 30 && car.tireCompound === 'medium') {
          shouldPit = true
          newCompound = 'hard'
        } else if (car.lapsOnTire > 40 && car.tireCompound === 'hard') {
          shouldPit = true
          newCompound = 'medium'
        }
      }

      // Mandatory compound rule: must use 2 different compounds
      if (
        !shouldPit &&
        car.compoundsUsed.length < 2 &&
        next.currentLap >= next.totalLaps * 0.4 &&
        next.currentLap <= next.totalLaps * 0.6
      ) {
        shouldPit = true
        newCompound =
          car.tireCompound === 'medium' ? 'hard' : car.tireCompound === 'hard' ? 'medium' : 'hard'
      }

      if (shouldPit) {
        car.pitting = true
        car.tireCompound = newCompound
      }
    }

    // Mode modifiers
    const modeSpeedMod = car.mode === 'push' ? 1.02 : car.mode === 'save' ? 0.97 : 1.0
    const modeDegMod = car.mode === 'push' ? 1.3 : car.mode === 'save' ? 0.7 : 1.0

    // Lap time
    const lapTime = calculateLapTime({
      car: { topSpeed: team.topSpeed * modeSpeedMod, cornering: team.cornering },
      driver: { speed: driver.speed, tireManagement: driver.tireManagement },
      tireCompound: car.tireCompound,
      lapsOnTire: Math.floor(car.lapsOnTire * modeDegMod),
      fuelLoad: car.fuelLoad,
      weather: next.weather,
      baseLapTime: next.track.baseLapTime,
    })

    car.lastLapTime = next.safetyCar ? lapTime * 1.3 : lapTime
    car.cumulativeTime += car.lastLapTime
    car.lapsOnTire += 1
    car.fuelLoad = Math.max(0, car.fuelLoad - fuelPerLap)

    // Incidents
    const incident = checkForIncident({
      aggression: driver.aggression,
      reliability: team.reliability,
    })
    if (incident.type !== 'none') {
      if (incident.dnf) {
        car.dnf = true
        next.events.push({
          lap: next.currentLap,
          type: 'incident',
          driverId: car.driverId,
          message: `${driver.shortName} retires — ${incident.type}`,
        })
        if (!next.safetyCar && incident.type === 'mechanical') {
          next.safetyCar = true
          next.safetyCarLapsLeft = 3 + Math.floor(Math.random() * 3)
          next.events.push({
            lap: next.currentLap,
            type: 'safety-car',
            driverId: '',
            message: 'Safety Car deployed!',
          })
        }
      } else {
        car.cumulativeTime += incident.timeLost
        next.events.push({
          lap: next.currentLap,
          type: 'incident',
          driverId: car.driverId,
          message: `${driver.shortName} has a ${incident.type}!`,
        })
      }
    }
  }

  // Safety car compression
  if (next.safetyCar) {
    const activeCars = next.cars.filter((c) => !c.dnf)
    activeCars.sort((a, b) => a.cumulativeTime - b.cumulativeTime)
    const times = activeCars.map((c) => c.cumulativeTime)
    const compressed = compressGaps(times)
    activeCars.forEach((car, i) => {
      car.cumulativeTime = compressed[i]
    })
  }

  // Overtaking
  const activeCars = next.cars.filter((c) => !c.dnf)
  activeCars.sort((a, b) => a.cumulativeTime - b.cumulativeTime)

  if (!next.safetyCar) {
    for (let i = 1; i < activeCars.length; i++) {
      const attacker = activeCars[i]
      const defender = activeCars[i - 1]
      const gap = attacker.cumulativeTime - defender.cumulativeTime
      const attackerDriver = driverMap.get(attacker.driverId)!
      const defenderDriver = driverMap.get(defender.driverId)!
      const attackerTeam = teamMap.get(attacker.teamId)!
      const defenderTeam = teamMap.get(defender.teamId)!

      const newGap = reduceGap(gap, defender.lastLapTime - attacker.lastLapTime)
      if (
        newGap <= 0 ||
        attemptOvertake({
          gap: newGap,
          attackerAggression: attackerDriver.aggression,
          speedDiff: attackerTeam.topSpeed - defenderTeam.topSpeed,
          overtakingDifficulty: next.track.overtakingDifficulty,
        }).overtook
      ) {
        const tempTime = defender.cumulativeTime
        defender.cumulativeTime = attacker.cumulativeTime
        attacker.cumulativeTime = tempTime - 0.3
        next.events.push({
          lap: next.currentLap,
          type: 'overtake',
          driverId: attacker.driverId,
          message: `${attackerDriver.shortName} overtakes ${defenderDriver.shortName}!`,
        })
      }
    }
  }

  // Update positions
  const allSorted = [...next.cars]
    .filter((c) => !c.dnf)
    .sort((a, b) => a.cumulativeTime - b.cumulativeTime)
  allSorted.forEach((car, i) => {
    car.position = i + 1
  })
  next.cars
    .filter((c) => c.dnf)
    .forEach((car) => {
      car.position = 99
    })

  return next
}
