import { create } from 'zustand'
import type { RaceState, DriverMode } from '../engine/raceSimulator'
import type { TireCompound } from '../data/types'

interface RaceStoreState {
  raceState: RaceState | null
  isRunning: boolean

  setRaceState: (state: RaceState) => void
  setRunning: (running: boolean) => void
  setPlayerMode: (mode: DriverMode) => void
  callPitStop: (compound: TireCompound) => void
  reset: () => void
}

export const useRaceStore = create<RaceStoreState>((set) => ({
  raceState: null,
  isRunning: false,

  setRaceState: (raceState) => set({ raceState }),
  setRunning: (isRunning) => set({ isRunning }),
  setPlayerMode: (mode) =>
    set((s) => {
      if (!s.raceState) return s
      const next = {
        ...s.raceState,
        cars: s.raceState.cars.map((c) =>
          c.driverId === s.raceState!.playerDriverId ? { ...c, mode } : c,
        ),
      }
      return { raceState: next }
    }),
  callPitStop: (compound) =>
    set((s) => {
      if (!s.raceState) return s
      const next = {
        ...s.raceState,
        cars: s.raceState.cars.map((c) =>
          c.driverId === s.raceState!.playerDriverId
            ? { ...c, pitting: true, tireCompound: compound }
            : c,
        ),
      }
      return { raceState: next }
    }),
  reset: () => set({ raceState: null, isRunning: false }),
}))
