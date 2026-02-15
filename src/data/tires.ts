import type { TireSpec, TireCompound, WeatherCondition } from './types'

export const tireSpecs: Record<TireCompound, TireSpec> = {
  soft: { compound: 'soft', gripBase: 0.97, degradationRate: 0.025, optimalLife: 10 },
  medium: { compound: 'medium', gripBase: 1.0, degradationRate: 0.015, optimalLife: 20 },
  hard: { compound: 'hard', gripBase: 1.03, degradationRate: 0.008, optimalLife: 35 },
  intermediate: {
    compound: 'intermediate',
    gripBase: 0.95,
    degradationRate: 0.012,
    optimalLife: 25,
  },
  wet: { compound: 'wet', gripBase: 0.92, degradationRate: 0.01, optimalLife: 30 },
}

export const weatherGripMatrix: Record<WeatherCondition, Record<TireCompound, number>> = {
  dry: { soft: 1.0, medium: 1.0, hard: 1.0, intermediate: 1.1, wet: 1.2 },
  'light-rain': { soft: 1.25, medium: 1.25, hard: 1.25, intermediate: 1.0, wet: 1.05 },
  'heavy-rain': { soft: 1.6, medium: 1.6, hard: 1.6, intermediate: 1.15, wet: 1.0 },
}

export const tireColors: Record<TireCompound, string> = {
  soft: '#ef4444',
  medium: '#eab308',
  hard: '#f8fafc',
  intermediate: '#22c55e',
  wet: '#3b82f6',
}
