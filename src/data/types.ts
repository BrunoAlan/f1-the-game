export interface Team {
  id: string
  name: string
  abbreviation: string
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
  number: number
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

export type TrackType = 'street' | 'high-speed' | 'technical' | 'balanced'

export interface Track {
  id: string
  name: string
  country: string
  circuit: string
  totalLaps: number
  baseLapTime: number
  overtakingDifficulty: number
  pitLaneTimeLoss: number
  weatherChangeChance: number
  tireWear: number
  fuelConsumption: number
  type: TrackType
  hasSprint: boolean
}

export interface CalendarEntry {
  round: number
  date: string
  gpName: string
  trackId: string
}

export type RDArea = 'motor' | 'aero' | 'chasis' | 'pitcrew'
export type RDBranch = 'a' | 'b'

export interface RDNode {
  area: RDArea
  level: 'base' | 'branch'
  branch?: RDBranch
  name: string
  description: string
  effects: {
    topSpeed?: number
    cornering?: number
    tireLife?: number
    pitTime?: number
    fuelConsumption?: number
    pitErrorChance?: number
    engineWear?: number
  }
  costRP: number
  costMoney: number
}

export type ComponentType = 'engine' | 'gearbox' | 'energy-recovery'

export interface ComponentState {
  type: ComponentType
  healthPercent: number
  racesUsed: number
}

export interface Sponsor {
  id: string
  name: string
  objective: SponsorObjective
  payout: number
  duration: number
  racesRemaining: number
}

export type SponsorObjective =
  | { type: 'finish-top'; position: number }
  | { type: 'both-finish' }
  | { type: 'win' }
  | { type: 'qualify-top'; position: number }
  | { type: 'score-sprint-points' }

export interface DriverStanding {
  driverId: string
  points: number
  positions: number[]
}

export interface TeamStanding {
  teamId: string
  points: number
}

export interface RDUpgrades {
  motor: { base: boolean; branch: RDBranch | null }
  aero: { base: boolean; branch: RDBranch | null }
  chasis: { base: boolean; branch: RDBranch | null }
  pitcrew: { base: boolean; branch: RDBranch | null }
}
