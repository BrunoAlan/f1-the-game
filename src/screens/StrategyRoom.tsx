import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useWeekendStore } from '../stores/weekendStore'
import { useStrategyStore } from '../stores/strategyStore'
import { tracks } from '../data/tracks'
import { drivers } from '../data/drivers'
import { teams } from '../data/teams'
import { tireColors, tireSpecs } from '../data/tires'
import { DegradationChart } from '../components/DegradationChart'
import { StintPlanner } from '../components/StintPlanner'
import { TireCompoundIcon } from '../components/TireCompoundIcon'
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
    <div className="min-h-screen bg-f1-bg flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-f1-surface border-b border-f1-border px-4 py-4 text-center"
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
      <div className="flex-1 px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl mx-auto mb-6">
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

        {/* Validation indicators */}
        <div className="max-w-4xl mx-auto flex items-center gap-4 font-pixel text-[9px] mb-4">
          <span className={lapsMatch ? 'text-f1-success' : 'text-f1-danger'}>
            {lapsMatch ? '\u2713' : '\u2717'} LAPS {allocatedLaps}/{track.totalLaps}
          </span>
          <span className={hasTwoDryCompounds ? 'text-f1-success' : 'text-f1-danger'}>
            {hasTwoDryCompounds ? '\u2713' : '\u2717'} 2+ DRY COMPOUNDS
          </span>
        </div>
      </div>

      {/* Sticky bottom bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="sticky bottom-0 bg-f1-surface border-t border-f1-border px-4 py-4"
      >
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            {/* Position info */}
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

            {/* Compound life summary */}
            <div className="hidden sm:flex items-center gap-3 border-l border-f1-border pl-6">
              {DRY_COMPOUNDS.map((compound) => (
                <div key={compound} className="flex items-center gap-1.5">
                  <TireCompoundIcon compound={compound} size="sm" />
                  <span className="font-pixel text-[8px]" style={{ color: tireColors[compound] }}>
                    ~{tireSpecs[compound].optimalLife}L
                  </span>
                </div>
              ))}
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
      </motion.div>
    </div>
  )
}
