import type { TireCompound, WeatherCondition } from '../data/types'
import { calculateTireGrip, getWeatherGripMultiplier } from './tireModel'
import { randomBetween } from '../utils/random'

interface LapTimeParams {
  car: { topSpeed: number; cornering: number }
  driver: { speed: number; tireManagement: number }
  tireCompound: TireCompound
  lapsOnTire: number
  fuelLoad: number
  weather: WeatherCondition
  baseLapTime: number
}

export function calculateLapTime(params: LapTimeParams): number {
  const { car, driver, tireCompound, lapsOnTire, fuelLoad, weather, baseLapTime } = params
  const carFactor = 1 - car.topSpeed * 0.002
  const driverFactor = 1 - driver.speed * 0.001
  const fuelFactor = 1 + fuelLoad * 0.03
  const tireGrip = calculateTireGrip(tireCompound, lapsOnTire, driver.tireManagement)
  const tireFactor = 1 + (tireGrip - 1) * 4
  const weatherFactor = getWeatherGripMultiplier(tireCompound, weather)
  const noise = randomBetween(-0.3, 0.3)
  return baseLapTime * carFactor * driverFactor * fuelFactor * tireFactor * weatherFactor + noise
}
