import { useEffect, useRef } from 'react'
import { useRaceStore } from '../stores/raceStore'
import { simulateLap } from '../engine/raceSimulator'

export function useRaceLoop() {
  const { raceState, isRunning, setRaceState } = useRaceStore()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!isRunning || !raceState) return

    intervalRef.current = setInterval(() => {
      const current = useRaceStore.getState().raceState
      if (!current) return

      if (current.currentLap >= current.totalLaps) {
        useRaceStore.getState().setRunning(false)
        if (intervalRef.current) clearInterval(intervalRef.current)
        return
      }

      const next = simulateLap(current)
      setRaceState(next)
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, raceState, setRaceState])
}
