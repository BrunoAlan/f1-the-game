import { tireSpecs, weatherGripMatrix } from '../data/tires'
import type { TireCompound, WeatherCondition } from '../data/types'

export function getEffectiveDegradation(compound: TireCompound, tireManagement: number): number {
  const base = tireSpecs[compound].degradationRate
  return base * (1 - tireManagement * 0.005)
}

export function calculateTireGrip(
  compound: TireCompound,
  lapsOnTire: number,
  tireManagement: number,
): number {
  const base = tireSpecs[compound].gripBase
  const deg = getEffectiveDegradation(compound, tireManagement)
  return base + lapsOnTire * deg
}

export function getWeatherGripMultiplier(
  compound: TireCompound,
  weather: WeatherCondition,
): number {
  return weatherGripMatrix[weather][compound]
}
