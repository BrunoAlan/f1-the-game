import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useWeekendStore } from '../stores/weekendStore'
import { teams } from '../data/teams'
import { drivers } from '../data/drivers'
import { tracks } from '../data/tracks'
import { PixelButton } from '../components/PixelButton'
import { formatLapTime } from '../utils/formatTime'
import { simulateQualifying, type QualifyingMode, type QualifyingResult } from '../engine/qualifyingSimulator'

type QualifyingPhase = 'mode-select' | 'lap-animation' | 'results'

const MODE_OPTIONS: {
  mode: QualifyingMode
  label: string
  sublabel: string
  emoji: string
  pace: string
  error: string
  color: string
  borderColor: string
}[] = [
  {
    mode: 'safe',
    label: 'SAFE',
    sublabel: '',
    emoji: '🟢',
    pace: '90% pace',
    error: '2% error',
    color: 'text-f1-success',
    borderColor: 'border-f1-success/60 hover:border-f1-success',
  },
  {
    mode: 'push',
    label: 'PUSH',
    sublabel: '',
    emoji: '🟡',
    pace: '100% pace',
    error: '15% error',
    color: 'text-f1-warning',
    borderColor: 'border-f1-warning/60 hover:border-f1-warning',
  },
  {
    mode: 'full-send',
    label: 'FULL',
    sublabel: 'SEND',
    emoji: '🔴',
    pace: '105% pace',
    error: '35% error',
    color: 'text-f1-danger',
    borderColor: 'border-f1-danger/60 hover:border-f1-danger',
  },
]

export function Qualifying() {
  const { selectedDriverId, weather, setQualifyingGrid, setPhase } = useWeekendStore()
  const track = tracks[0]

  const [qualifyingPhase, setQualifyingPhase] = useState<QualifyingPhase>('mode-select')
  const [results, setResults] = useState<QualifyingResult[]>([])
  const [playerResult, setPlayerResult] = useState<QualifyingResult | null>(null)

  const handleModeSelect = (mode: QualifyingMode) => {
    const simResults = simulateQualifying({
      teams,
      drivers,
      track,
      weather,
      playerDriverId: selectedDriverId!,
      playerMode: mode,
    })

    setResults(simResults)
    const player = simResults.find((r) => r.driverId === selectedDriverId) ?? null
    setPlayerResult(player)
    setQualifyingPhase('lap-animation')
  }

  const handleAnimationComplete = () => {
    setQualifyingPhase('results')
  }

  const handleProceed = () => {
    setQualifyingGrid(
      results.map((r) => ({
        driverId: r.driverId,
        position: r.position,
        time: r.time,
      }))
    )
    setPhase('strategy')
  }

  return (
    <div className="min-h-screen bg-f1-bg px-4 py-8 flex flex-col items-center">
      {qualifyingPhase === 'mode-select' && (
        <ModeSelectPhase onSelect={handleModeSelect} trackName={track.name} />
      )}
      {qualifyingPhase === 'lap-animation' && playerResult && (
        <LapAnimationPhase
          playerResult={playerResult}
          onComplete={handleAnimationComplete}
        />
      )}
      {qualifyingPhase === 'results' && (
        <ResultsPhase
          results={results}
          playerDriverId={selectedDriverId!}
          onProceed={handleProceed}
        />
      )}
    </div>
  )
}

/* ─── Phase A: Mode Selection ─── */

function ModeSelectPhase({
  onSelect,
  trackName,
}: {
  onSelect: (mode: QualifyingMode) => void
  trackName: string
}) {
  return (
    <>
      <div className="text-center mb-8">
        <h1 className="font-pixel text-xl text-f1-accent mb-1">QUALIFYING</h1>
        <p className="font-pixel text-[10px] text-f1-text/60 mb-1">{trackName}</p>
        <p className="font-pixel text-[10px] text-f1-text/40">
          Choose Your Approach
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
        {MODE_OPTIONS.map((opt) => (
          <button
            key={opt.mode}
            onClick={() => onSelect(opt.mode)}
            className={`bg-slate-800/60 border-2 ${opt.borderColor} rounded-sm p-6 flex flex-col items-center gap-3 transition-colors hover:bg-slate-700/60 cursor-pointer`}
          >
            <span className="text-2xl">{opt.emoji}</span>
            <div className="text-center">
              <span className={`font-pixel text-sm ${opt.color}`}>
                {opt.label}
              </span>
              {opt.sublabel && (
                <span className={`font-pixel text-sm ${opt.color} block`}>
                  {opt.sublabel}
                </span>
              )}
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="font-pixel text-[9px] text-f1-text/60">
                {opt.pace}
              </span>
              <span className="font-pixel text-[9px] text-f1-text/40">
                {opt.error}
              </span>
            </div>
          </button>
        ))}
      </div>
    </>
  )
}

/* ─── Phase B: Lap Animation ─── */

const SECTOR_DURATIONS = [1.5, 1.5, 2.0] // seconds
const SECTOR_LABELS = ['S1', 'S2', 'S3']
const SECTOR_COLORS = ['#22c55e', '#eab308', '#a855f7']

function LapAnimationPhase({
  playerResult,
  onComplete,
}: {
  playerResult: QualifyingResult
  onComplete: () => void
}) {
  const [activeSector, setActiveSector] = useState(0)
  const [showTime, setShowTime] = useState(false)

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []

    let cumulative = 0
    SECTOR_DURATIONS.forEach((duration, i) => {
      cumulative += duration * 1000
      timers.push(
        setTimeout(() => {
          setActiveSector(i + 1)
        }, cumulative)
      )
    })

    // Show final time after all sectors
    const totalDuration = SECTOR_DURATIONS.reduce((sum, d) => sum + d, 0) * 1000
    timers.push(
      setTimeout(() => {
        setShowTime(true)
      }, totalDuration + 300)
    )

    // Auto-advance after showing time
    timers.push(
      setTimeout(() => {
        onComplete()
      }, totalDuration + 2000)
    )

    return () => timers.forEach(clearTimeout)
  }, [onComplete])

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="font-pixel text-xl text-f1-accent mb-1">HOT LAP</h1>
        <p className="font-pixel text-[10px] text-f1-text/40">
          {playerResult.error ? 'MISTAKE DETECTED!' : 'PUSHING THE LIMITS...'}
        </p>
      </div>

      <div className="w-full max-w-md flex flex-col gap-4 mb-8">
        {SECTOR_DURATIONS.map((duration, i) => {
          const isFilling = activeSector === i
          const isFilled = activeSector > i

          return (
            <div key={i} className="flex items-center gap-3">
              <span className="font-pixel text-[10px] text-f1-text/50 w-8">
                {SECTOR_LABELS[i]}
              </span>
              <div className="flex-1 h-5 bg-slate-800 border border-f1-border rounded-sm overflow-hidden">
                <motion.div
                  className="h-full"
                  style={{ backgroundColor: SECTOR_COLORS[i] }}
                  initial={{ width: '0%' }}
                  animate={{
                    width: isFilled ? '100%' : isFilling ? '100%' : '0%',
                  }}
                  transition={
                    isFilling
                      ? { duration, ease: 'easeInOut' }
                      : { duration: 0 }
                  }
                />
              </div>
            </div>
          )
        })}
      </div>

      {showTime && (
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 12 }}
          className="text-center"
        >
          <p className="font-pixel text-[10px] text-f1-text/50 mb-1">
            LAP TIME
          </p>
          <p
            className={`font-pixel text-2xl ${
              playerResult.error ? 'text-f1-danger' : 'text-f1-accent'
            }`}
          >
            {formatLapTime(playerResult.time)}
          </p>
          {playerResult.error && (
            <p className="font-pixel text-[9px] text-f1-danger/70 mt-1">
              ERROR — TIME PENALTY
            </p>
          )}
        </motion.div>
      )}
    </>
  )
}

/* ─── Phase C: Results Grid ─── */

function ResultsPhase({
  results,
  playerDriverId,
  onProceed,
}: {
  results: QualifyingResult[]
  playerDriverId: string
  onProceed: () => void
}) {
  const driverMap = new Map(drivers.map((d) => [d.id, d]))
  const teamMap = new Map(teams.map((t) => [t.id, t]))
  const playerPosition = results.find((r) => r.driverId === playerDriverId)?.position ?? 0

  return (
    <>
      <div className="text-center mb-6">
        <h1 className="font-pixel text-xl text-f1-accent mb-1">
          QUALIFYING RESULTS
        </h1>
      </div>

      <div className="w-full max-w-xl flex flex-col gap-0.5 mb-6">
        {results.map((result) => {
          const driver = driverMap.get(result.driverId)
          const team = teamMap.get(result.teamId)
          if (!driver || !team) return null

          const isPlayer = result.driverId === playerDriverId

          return (
            <motion.div
              key={result.driverId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: result.position * 0.04 }}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-sm font-pixel text-[10px] ${
                isPlayer
                  ? 'bg-slate-700/80 border-l-2'
                  : 'bg-slate-800/40'
              }`}
              style={isPlayer ? { borderLeftColor: team.primaryColor } : undefined}
            >
              <span className="w-8 text-right text-f1-text/50">
                P{result.position}
              </span>
              <div
                className="w-1.5 h-4 rounded-sm shrink-0"
                style={{ backgroundColor: team.primaryColor }}
              />
              <span
                className={`w-10 ${isPlayer ? 'text-f1-accent' : 'text-f1-text'}`}
              >
                {driver.shortName}
              </span>
              <span className="flex-1 text-f1-text/50 truncate">
                {team.name}
              </span>
              <span
                className={`w-24 text-right ${
                  result.error ? 'text-f1-danger/70' : 'text-f1-text/70'
                }`}
              >
                {formatLapTime(result.time)}
              </span>
              {isPlayer && (
                <span className="text-f1-accent text-[8px] ml-1">YOU</span>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Player position summary */}
      <div className="text-center mb-6">
        <p className="font-pixel text-[10px] text-f1-text/50 mb-1">
          YOUR STARTING POSITION
        </p>
        <p className="font-pixel text-2xl text-f1-accent">P{playerPosition}</p>
      </div>

      <PixelButton variant="success" onClick={onProceed} className="px-6">
        PROCEED TO STRATEGY
      </PixelButton>
    </>
  )
}
