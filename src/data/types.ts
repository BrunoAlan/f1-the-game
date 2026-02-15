export interface Team {
  id: string
  name: string
  engine: string
  primaryColor: string
  accentColor: string
  topSpeed: number
  cornering: number
  reliability: number
}

export interface Driver {
  id: string
  name: string
  shortName: string
  teamId: string
  speed: number
  aggression: number
  tireManagement: number
  wetSkill: number
}

export type TireCompound = 'soft' | 'medium' | 'hard' | 'intermediate' | 'wet'

export type WeatherCondition = 'dry' | 'light-rain' | 'heavy-rain'

export interface TireSpec {
  compound: TireCompound
  gripBase: number
  degradationRate: number
  optimalLife: number
}

export interface Track {
  id: string
  name: string
  country: string
  totalLaps: number
  baseLapTime: number
  overtakingDifficulty: number
  pitLaneTimeLoss: number
  weatherChangeChance: number
}
