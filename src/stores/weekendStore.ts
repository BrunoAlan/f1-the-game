import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WeatherCondition } from '../data/types'

export type Phase =
  | 'team-select'
  | 'hq'
  | 'practice'
  | 'qualifying'
  | 'sprint-shootout'
  | 'sprint-race'
  | 'strategy'
  | 'race'
  | 'results'
  | 'season-end'

interface WeekendState {
  phase: Phase
  selectedTeamId: string | null
  selectedDriverId: string | null
  weather: WeatherCondition
  practiceData: { dataCollected: number; revealedCompounds: string[] }
  qualifyingGrid: { driverId: string; position: number; time: number }[]
  currentTrackId: string | null
  isSprint: boolean
  sprintGrid: { driverId: string; position: number; time: number }[]

  setPhase: (phase: Phase) => void
  selectTeam: (teamId: string, driverId: string) => void
  setPracticeData: (data: { dataCollected: number; revealedCompounds: string[] }) => void
  setQualifyingGrid: (grid: { driverId: string; position: number; time: number }[]) => void
  setCurrentTrack: (trackId: string, isSprint: boolean) => void
  setSprintGrid: (grid: { driverId: string; position: number; time: number }[]) => void
  resetWeekend: () => void
  reset: () => void
}

export const useWeekendStore = create<WeekendState>()(
  persist(
    (set) => ({
      phase: 'team-select',
      selectedTeamId: null,
      selectedDriverId: null,
      weather: 'dry',
      practiceData: { dataCollected: 0, revealedCompounds: [] },
      qualifyingGrid: [],
      currentTrackId: null,
      isSprint: false,
      sprintGrid: [],

      setPhase: (phase) => set({ phase }),
      selectTeam: (teamId, driverId) => set({ selectedTeamId: teamId, selectedDriverId: driverId }),
      setPracticeData: (data) => set({ practiceData: data }),
      setQualifyingGrid: (grid) => set({ qualifyingGrid: grid }),
      setCurrentTrack: (trackId, isSprint) => set({ currentTrackId: trackId, isSprint }),
      setSprintGrid: (grid) => set({ sprintGrid: grid }),
      resetWeekend: () =>
        set({
          phase: 'hq',
          weather: 'dry',
          practiceData: { dataCollected: 0, revealedCompounds: [] },
          qualifyingGrid: [],
          currentTrackId: null,
          isSprint: false,
          sprintGrid: [],
        }),
      reset: () =>
        set({
          phase: 'team-select',
          selectedTeamId: null,
          selectedDriverId: null,
          weather: 'dry',
          practiceData: { dataCollected: 0, revealedCompounds: [] },
          qualifyingGrid: [],
          currentTrackId: null,
          isSprint: false,
          sprintGrid: [],
        }),
    }),
    { name: 'f1-game-weekend' },
  ),
)
