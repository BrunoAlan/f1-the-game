import { create } from 'zustand'
import type { WeatherCondition } from '../data/types'

export type Phase = 'team-select' | 'practice' | 'qualifying' | 'strategy' | 'race' | 'results'

interface WeekendState {
  phase: Phase
  selectedTeamId: string | null
  selectedDriverId: string | null
  weather: WeatherCondition
  practiceData: { dataCollected: number; revealedCompounds: string[] }
  qualifyingGrid: { driverId: string; position: number; time: number }[]

  setPhase: (phase: Phase) => void
  selectTeam: (teamId: string, driverId: string) => void
  setPracticeData: (data: { dataCollected: number; revealedCompounds: string[] }) => void
  setQualifyingGrid: (grid: { driverId: string; position: number; time: number }[]) => void
  reset: () => void
}

export const useWeekendStore = create<WeekendState>((set) => ({
  phase: 'team-select',
  selectedTeamId: null,
  selectedDriverId: null,
  weather: 'dry',
  practiceData: { dataCollected: 0, revealedCompounds: [] },
  qualifyingGrid: [],

  setPhase: (phase) => set({ phase }),
  selectTeam: (teamId, driverId) => set({ selectedTeamId: teamId, selectedDriverId: driverId }),
  setPracticeData: (data) => set({ practiceData: data }),
  setQualifyingGrid: (grid) => set({ qualifyingGrid: grid }),
  reset: () => set({
    phase: 'team-select',
    selectedTeamId: null,
    selectedDriverId: null,
    weather: 'dry',
    practiceData: { dataCollected: 0, revealedCompounds: [] },
    qualifyingGrid: [],
  }),
}))
