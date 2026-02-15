import { create } from 'zustand'
import type { TireCompound } from '../data/types'

export interface Stint {
  compound: TireCompound
  laps: number
}

interface StrategyState {
  stints: Stint[]

  addStint: (stint: Stint) => void
  removeStint: (index: number) => void
  updateStint: (index: number, stint: Stint) => void
  setStints: (stints: Stint[]) => void
  reset: () => void
}

export const useStrategyStore = create<StrategyState>((set) => ({
  stints: [
    { compound: 'medium', laps: 25 },
    { compound: 'hard', laps: 28 },
  ],

  addStint: (stint) => set((s) => ({ stints: [...s.stints, stint] })),
  removeStint: (index) => set((s) => ({ stints: s.stints.filter((_, i) => i !== index) })),
  updateStint: (index, stint) =>
    set((s) => ({
      stints: s.stints.map((existing, i) => (i === index ? stint : existing)),
    })),
  setStints: (stints) => set({ stints }),
  reset: () =>
    set({
      stints: [
        { compound: 'medium', laps: 25 },
        { compound: 'hard', laps: 28 },
      ],
    }),
}))
