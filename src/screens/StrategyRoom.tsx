import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useWeekendStore } from '../stores/weekendStore'
import { useStrategyStore } from '../stores/strategyStore'
import { tracks } from '../data/tracks'
import { drivers } from '../data/drivers'
import { teams } from '../data/teams'
import { DegradationChart } from '../components/DegradationChart'
import { StintPlanner } from '../components/StintPlanner'
import { PixelButton } from '../components/PixelButton'
import type { TireCompound } from '../data/types'

const WEATHER_EMOJI: Record<string, string> = {
  dry: '\u2600\uFE0F',
  'light-rain': '\uD83C\uDF27\uFE0F',
  'heavy-rain': '\u26C8\uFE0F',
}

const DRY_COMPOUNDS: TireCompound[] = ['soft', 'medium', 'hard']

export function StrategyRoom() {
  const { selectedDriverId, selectedTeamId, weather, practiceData, qualifyingGrid, setPhase } =
    useWeekendStore()

  const stints = useStrategyStore((s) => s.stints)

  const track = tracks[0]
  const driver = drivers.find((d) => d.id === selectedDriverId)
  const team = teams.find((t) => t.id === selectedTeamId)

  const startingPosition = useMemo(() => {
    const entry = qualifyingGrid.find((g) => g.driverId === selectedDriverId)
    return entry?.position ?? 20
  }, [qualifyingGrid, selectedDriverId])

  const predictedFinish = useMemo(() => {
    const offset = Math.floor(Math.random() * 7) - 3 // -3 to +3
    return Math.max(1, Math.min(22, startingPosition + offset))
  }, [startingPosition])

  const showWeatherCompounds = weather !== 'dry'

  // Validation: total laps match and 2+ dry compounds
  const allocatedLaps = stints.reduce((sum, s) => sum + s.laps, 0)
  const lapsMatch = allocatedLaps === track.totalLaps
  const uniqueDryCompounds = new Set(
    stints.map((s) => s.compound).filter((c) => DRY_COMPOUNDS.includes(c)),
  )
  const hasTwoDryCompounds = uniqueDryCompounds.size >= 2
  const isStrategyValid = lapsMatch && hasTwoDryCompounds

  const handleStartRace = () => {
    setPhase('race')
  }

  return (
    <div className="min-h-screen bg-f1-bg px-4 py-8 flex flex-col items-center">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6 w-full max-w-4xl"
      >
        <h1 className="font-pixel text-xl text-f1-accent mb-2">STRATEGY ROOM</h1>
        <div className="flex items-center justify-center gap-4 font-pixel text-[9px] text-f1-text/60">
          <span>{track.name}</span>
          <span className="text-f1-border">|</span>
          <span>{track.totalLaps} LAPS</span>
          <span className="text-f1-border">|</span>
          <span>
            {WEATHER_EMOJI[weather] ?? ''} {weather.toUpperCase()}
          </span>
          {driver && team && (
            <>
              <span className="text-f1-border">|</span>
              <span style={{ color: team.primaryColor }}>{driver.shortName}</span>
            </>
          )}
        </div>
      </motion.div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl mb-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <DegradationChart revealedCompounds={practiceData.revealedCompounds} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <StintPlanner
            totalLaps={track.totalLaps}
            revealedCompounds={practiceData.revealedCompounds}
            showWeatherCompounds={showWeatherCompounds}
          />
        </motion.div>
      </div>

      {/* Bottom section: position info + start button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-4xl bg-slate-800 border-2 border-f1-border rounded-sm p-4"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="font-pixel text-[8px] text-f1-text/40 mb-1">STARTING</p>
              <p className="font-pixel text-lg text-f1-accent">P{startingPosition}</p>
            </div>
            <div className="text-center">
              <p className="font-pixel text-[8px] text-f1-text/40 mb-1">PREDICTED</p>
              <p className="font-pixel text-lg text-f1-text/70">
                P{predictedFinish} <span className="text-[8px] text-f1-text/30">(+/-3)</span>
              </p>
            </div>
          </div>

          <PixelButton
            variant="success"
            onClick={handleStartRace}
            disabled={!isStrategyValid}
            className="px-8"
          >
            START RACE
          </PixelButton>
        </div>

        {!isStrategyValid && (
          <p className="font-pixel text-[8px] text-f1-danger mt-3 text-center sm:text-right">
            FIX STRATEGY BEFORE STARTING
          </p>
        )}
      </motion.div>
    </div>
  )
}
