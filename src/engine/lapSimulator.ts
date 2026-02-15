import type { TireCompound, WeatherCondition, TrackType } from '../data/types'
import { calculateTireGrip, getWeatherGripMultiplier } from './tireModel'
import { getTrackTypeModifiers } from './seasonEngine'
import { randomBetween } from '../utils/random'

interface LapTimeParams {
  car: { topSpeed: number; cornering: number }
  driver: { speed: number; tireManagement: number }
  tireCompound: TireCompound
  lapsOnTire: number
  fuelLoad: number
  weather: WeatherCondition
  baseLapTime: number
  trackType?: TrackType
}

export function calculateLapTime(params: LapTimeParams): number {
  const { car, driver, tireCompound, lapsOnTire, fuelLoad, weather, baseLapTime, trackType } =
    params

  let effectiveTopSpeed = car.topSpeed

  if (trackType) {
    const mods = getTrackTypeModifiers(trackType)
    effectiveTopSpeed = car.topSpeed * mods.topSpeedWeight
  }

  const carFactor = 1 - effectiveTopSpeed * 0.002
  const driverFactor = 1 - driver.speed * 0.001
  const fuelFactor = 1 + fuelLoad * 0.03
  const tireGrip = calculateTireGrip(tireCompound, lapsOnTire, driver.tireManagement)
  const tireFactor = 1 + (tireGrip - 1) * 4
  const weatherFactor = getWeatherGripMultiplier(tireCompound, weather)
  const noise = randomBetween(-0.3, 0.3)
  return baseLapTime * carFactor * driverFactor * fuelFactor * tireFactor * weatherFactor + noise
}
