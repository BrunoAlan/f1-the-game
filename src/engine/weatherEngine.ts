import type { WeatherCondition } from '../data/types'
import { randomChance } from '../utils/random'

const transitions: Record<WeatherCondition, WeatherCondition[]> = {
  dry: ['light-rain'],
  'light-rain': ['dry', 'heavy-rain'],
  'heavy-rain': ['light-rain'],
}

export function getNextWeather(current: WeatherCondition): WeatherCondition {
  const options = transitions[current]
  return options[Math.floor(Math.random() * options.length)]
}

export function simulateWeatherForLap(
  current: WeatherCondition,
  changeChance: number,
): WeatherCondition {
  if (randomChance(changeChance)) {
    return getNextWeather(current)
  }
  return current
}
