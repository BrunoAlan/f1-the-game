import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWeekendStore } from '../stores/weekendStore'
import { teams } from '../data/teams'
import { drivers } from '../data/drivers'
import { tracks } from '../data/tracks'
import { PixelButton } from '../components/PixelButton'
import { formatLapTime } from '../utils/formatTime'
import {
  simulateQualifying,
  type QualifyingMode,
  type QualifyingResult,
} from '../engine/qualifyingSimulator'

type InternalPhase = 'mode-select' | 'lap-animation' | 'results'

interface QSession {
  name: string
  label: string
  totalDrivers: number
  eliminatedCount: number
}

const Q_SESSIONS: QSession[] = [
  { name: 'Q1', label: 'QUALIFYING 1', totalDrivers: 22, eliminatedCount: 5 },
  { name: 'Q2', label: 'QUALIFYING 2', totalDrivers: 17, eliminatedCount: 7 },
  { name: 'Q3', label: 'QUALIFYING 3', totalDrivers: 10, eliminatedCount: 0 },
]

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

  const [qIndex, setQIndex] = useState(0)
  const [internalPhase, setInternalPhase] = useState<InternalPhase>('mode-select')
  const [sessionResults, setSessionResults] = useState<QualifyingResult[]>([])
  const [playerResult, setPlayerResult] = useState<QualifyingResult | null>(null)
  const [eliminatedIds, setEliminatedIds] = useState<Set<string>>(new Set())
  const [finalGrid, setFinalGrid] = useState<{ driverId: string; position: number; time: number }[]>([])

  const currentQ = Q_SESSIONS[qIndex]
  const isLastSession = qIndex >= Q_SESSIONS.length - 1
  const playerEliminated = eliminatedIds.has(selectedDriverId!)

  const activeDrivers = useMemo(
    () => drivers.filter((d) => !eliminatedIds.has(d.id)),
    [eliminatedIds],
  )

  const handleModeSelect = (mode: QualifyingMode) => {
    const simResults = simulateQualifying({
      teams,
      drivers: activeDrivers,
      track,
      weather,
      playerDriverId: selectedDriverId!,
      playerMode: mode,
    })

    setSessionResults(simResults)
    const player = simResults.find((r) => r.driverId === selectedDriverId) ?? null
    setPlayerResult(player)
    setInternalPhase('lap-animation')
  }

  const handleAnimationComplete = () => {
    setInternalPhase('results')
  }

  const handleNextSession = () => {
    // Eliminate bottom drivers from this session
    const sorted = [...sessionResults].sort((a, b) => a.time - b.time)
    const toEliminate = sorted.slice(sorted.length - currentQ.eliminatedCount)
    const newEliminated = new Set(eliminatedIds)
    const newGridEntries: { driverId: string; position: number; time: number }[] = []

    toEliminate.forEach((r, i) => {
      newEliminated.add(r.driverId)
      // Assign final grid positions for eliminated drivers
      const gridPos = currentQ.totalDrivers - i
      newGridEntries.push({ driverId: r.driverId, position: gridPos, time: r.time })
    })

    setEliminatedIds(newEliminated)
    setFinalGrid((prev) => [...prev, ...newGridEntries])

    // Move to next Q session
    setQIndex((prev) => prev + 1)
    setInternalPhase('mode-select')
    setSessionResults([])
    setPlayerResult(null)
  }

  const handleFinish = () => {
    // Q3 results determine P1-P10
    const sorted = [...sessionResults].sort((a, b) => a.time - b.time)
    const q3Grid = sorted.map((r, i) => ({
      driverId: r.driverId,
      position: i + 1,
      time: r.time,
    }))

    const fullGrid = [...q3Grid, ...finalGrid].sort((a, b) => a.position - b.position)
    setQualifyingGrid(fullGrid)
    setPhase('strategy')
  }

  // If player is eliminated, skip mode select and auto-simulate remaining sessions
  const handleSkipToEnd = () => {
    // Simulate remaining sessions without player
    let currentEliminated = new Set(eliminatedIds)
    let currentGrid = [...finalGrid]
    let remainingDrivers = drivers.filter((d) => !currentEliminated.has(d.id))

    for (let i = qIndex; i < Q_SESSIONS.length; i++) {
      const session = Q_SESSIONS[i]
      const simResults = simulateQualifying({
        teams,
        drivers: remainingDrivers,
        track,
        weather,
        playerDriverId: selectedDriverId!,
        playerMode: 'push',
      })

      const sorted = [...simResults].sort((a, b) => a.time - b.time)

      if (session.eliminatedCount > 0) {
        const toEliminate = sorted.slice(sorted.length - session.eliminatedCount)
        toEliminate.forEach((r, j) => {
          currentEliminated.add(r.driverId)
          currentGrid.push({
            driverId: r.driverId,
            position: session.totalDrivers - j,
            time: r.time,
          })
        })
        remainingDrivers = drivers.filter((d) => !currentEliminated.has(d.id))
      } else {
        // Q3 final
        sorted.forEach((r, j) => {
          currentGrid.push({ driverId: r.driverId, position: j + 1, time: r.time })
        })
      }
    }

    const fullGrid = currentGrid.sort((a, b) => a.position - b.position)
    setQualifyingGrid(fullGrid)
    setPhase('strategy')
  }

  return (
    <div className="min-h-screen bg-f1-bg px-4 py-8 flex flex-col items-center">
      {/* Q Session Indicators */}
      <div className="flex gap-3 mb-6">
        {Q_SESSIONS.map((q, i) => (
          <div
            key={q.name}
            className={`font-pixel text-[10px] px-3 py-1 border rounded-sm ${
              i < qIndex
                ? 'border-f1-success/50 text-f1-success bg-f1-success/10'
                : i === qIndex
                  ? 'border-f1-accent text-f1-accent bg-f1-accent/10'
                  : 'border-f1-border text-f1-text/30'
            }`}
          >
            {q.name} {i < qIndex ? '✓' : i === qIndex ? '●' : '○'}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {internalPhase === 'mode-select' && !playerEliminated && (
          <motion.div
            key={`mode-${qIndex}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center w-full"
          >
            <ModeSelectPhase
              onSelect={handleModeSelect}
              trackName={track.name}
              sessionName={currentQ.name}
              sessionLabel={currentQ.label}
              driversCount={activeDrivers.length}
              eliminatedCount={currentQ.eliminatedCount}
            />
          </motion.div>
        )}

        {internalPhase === 'mode-select' && playerEliminated && (
          <motion.div
            key="eliminated"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center"
          >
            <h1 className="font-pixel text-xl text-f1-danger mb-2">ELIMINATED IN {Q_SESSIONS[qIndex - 1]?.name}</h1>
            <p className="font-pixel text-[10px] text-f1-text/50 mb-6">
              Your qualifying session is over. Remaining sessions will be simulated.
            </p>
            <PixelButton variant="warning" onClick={handleSkipToEnd}>
              SIMULATE REMAINING & PROCEED
            </PixelButton>
          </motion.div>
        )}

        {internalPhase === 'lap-animation' && playerResult && (
          <motion.div
            key={`lap-${qIndex}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center w-full"
          >
            <LapAnimationPhase
              playerResult={playerResult}
              sessionName={currentQ.name}
              onComplete={handleAnimationComplete}
            />
          </motion.div>
        )}

        {internalPhase === 'results' && (
          <motion.div
            key={`results-${qIndex}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center w-full"
          >
            <ResultsPhase
              results={sessionResults}
              playerDriverId={selectedDriverId!}
              sessionName={currentQ.name}
              eliminatedCount={currentQ.eliminatedCount}
              isLastSession={isLastSession}
              onNext={isLastSession ? handleFinish : handleNextSession}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Phase A: Mode Selection ─── */

function ModeSelectPhase({
  onSelect,
  trackName,
  sessionName,
  sessionLabel,
  driversCount,
  eliminatedCount,
}: {
  onSelect: (mode: QualifyingMode) => void
  trackName: string
  sessionName: string
  sessionLabel: string
  driversCount: number
  eliminatedCount: number
}) {
  return (
    <>
      <div className="text-center mb-8">
        <h1 className="font-pixel text-2xl text-f1-accent mb-1">{sessionName}</h1>
        <p className="font-pixel text-[10px] text-f1-text/60 mb-1">{sessionLabel}</p>
        <p className="font-pixel text-[10px] text-f1-text/40 mb-1">{trackName}</p>
        <p className="font-pixel text-[9px] text-f1-text/30">
          {driversCount} DRIVERS{eliminatedCount > 0 ? ` — BOTTOM ${eliminatedCount} ELIMINATED` : ' — POLE POSITION SHOOTOUT'}
        </p>
      </div>

      <p className="font-pixel text-[10px] text-f1-text/40 mb-4">Choose Your Approach</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
        {MODE_OPTIONS.map((opt) => (
          <button
            key={opt.mode}
            onClick={() => onSelect(opt.mode)}
            className={`bg-slate-800/60 border-2 ${opt.borderColor} rounded-sm p-6 flex flex-col items-center gap-3 transition-colors hover:bg-slate-700/60 cursor-pointer`}
          >
            <span className="text-2xl">{opt.emoji}</span>
            <div className="text-center">
              <span className={`font-pixel text-sm ${opt.color}`}>{opt.label}</span>
              {opt.sublabel && (
                <span className={`font-pixel text-sm ${opt.color} block`}>{opt.sublabel}</span>
              )}
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="font-pixel text-[9px] text-f1-text/60">{opt.pace}</span>
              <span className="font-pixel text-[9px] text-f1-text/40">{opt.error}</span>
            </div>
          </button>
        ))}
      </div>
    </>
  )
}

/* ─── Phase B: Lap Animation ─── */

const SECTOR_DURATIONS = [1.5, 1.5, 2.0]
const SECTOR_LABELS = ['S1', 'S2', 'S3']
const SECTOR_COLORS = ['#22c55e', '#eab308', '#a855f7']

function LapAnimationPhase({
  playerResult,
  sessionName,
  onComplete,
}: {
  playerResult: QualifyingResult
  sessionName: string
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
        }, cumulative),
      )
    })

    const totalDuration = SECTOR_DURATIONS.reduce((sum, d) => sum + d, 0) * 1000
    timers.push(
      setTimeout(() => {
        setShowTime(true)
      }, totalDuration + 300),
    )

    timers.push(
      setTimeout(() => {
        onComplete()
      }, totalDuration + 2000),
    )

    return () => timers.forEach(clearTimeout)
  }, [onComplete])

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="font-pixel text-xl text-f1-accent mb-1">{sessionName} — HOT LAP</h1>
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
              <span className="font-pixel text-[10px] text-f1-text/50 w-8">{SECTOR_LABELS[i]}</span>
              <div className="flex-1 h-5 bg-slate-800 border border-f1-border rounded-sm overflow-hidden">
                <motion.div
                  className="h-full"
                  style={{ backgroundColor: SECTOR_COLORS[i] }}
                  initial={{ width: '0%' }}
                  animate={{
                    width: isFilled ? '100%' : isFilling ? '100%' : '0%',
                  }}
                  transition={isFilling ? { duration, ease: 'easeInOut' } : { duration: 0 }}
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
          <p className="font-pixel text-[10px] text-f1-text/50 mb-1">LAP TIME</p>
          <p
            className={`font-pixel text-2xl ${
              playerResult.error ? 'text-f1-danger' : 'text-f1-accent'
            }`}
          >
            {formatLapTime(playerResult.time)}
          </p>
          {playerResult.error && (
            <p className="font-pixel text-[9px] text-f1-danger/70 mt-1">ERROR — TIME PENALTY</p>
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
  sessionName,
  eliminatedCount,
  isLastSession,
  onNext,
}: {
  results: QualifyingResult[]
  playerDriverId: string
  sessionName: string
  eliminatedCount: number
  isLastSession: boolean
  onNext: () => void
}) {
  const driverMap = new Map(drivers.map((d) => [d.id, d]))
  const teamMap = new Map(teams.map((t) => [t.id, t]))
  const playerPosition = results.find((r) => r.driverId === playerDriverId)?.position ?? 0
  const cutoffPosition = results.length - eliminatedCount
  const playerIsEliminated = playerPosition > cutoffPosition && eliminatedCount > 0

  return (
    <>
      <div className="text-center mb-6">
        <h1 className="font-pixel text-xl text-f1-accent mb-1">{sessionName} RESULTS</h1>
        {eliminatedCount > 0 && (
          <p className="font-pixel text-[9px] text-f1-text/40">
            TOP {cutoffPosition} ADVANCE — BOTTOM {eliminatedCount} ELIMINATED
          </p>
        )}
      </div>

      <div className="w-full max-w-xl flex flex-col gap-0.5 mb-6">
        {results.map((result) => {
          const driver = driverMap.get(result.driverId)
          const team = teamMap.get(result.teamId)
          if (!driver || !team) return null

          const isPlayer = result.driverId === playerDriverId
          const isEliminated = eliminatedCount > 0 && result.position > cutoffPosition

          return (
            <motion.div
              key={result.driverId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: result.position * 0.04 }}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-sm font-pixel text-[10px] ${
                isPlayer
                  ? 'bg-slate-700/80 border-l-2'
                  : isEliminated
                    ? 'bg-red-950/30'
                    : 'bg-slate-800/40'
              }`}
              style={isPlayer ? { borderLeftColor: team.primaryColor } : undefined}
            >
              <span
                className={`w-8 text-right ${isEliminated ? 'text-f1-danger/50' : 'text-f1-text/50'}`}
              >
                P{result.position}
              </span>
              <div
                className={`w-1.5 h-4 rounded-sm shrink-0 ${isEliminated ? 'opacity-30' : ''}`}
                style={{ backgroundColor: team.primaryColor }}
              />
              <span
                className={`w-10 ${
                  isPlayer ? 'text-f1-accent' : isEliminated ? 'text-f1-text/30' : 'text-f1-text'
                }`}
              >
                {driver.shortName}
              </span>
              <span
                className={`flex-1 truncate ${isEliminated ? 'text-f1-text/20' : 'text-f1-text/50'}`}
              >
                {team.name}
              </span>
              <span
                className={`w-24 text-right ${
                  result.error
                    ? 'text-f1-danger/70'
                    : isEliminated
                      ? 'text-f1-text/30'
                      : 'text-f1-text/70'
                }`}
              >
                {formatLapTime(result.time)}
              </span>
              {isPlayer && <span className="text-f1-accent text-[8px] ml-1">YOU</span>}
              {isEliminated && !isPlayer && (
                <span className="text-f1-danger/50 text-[8px] ml-1">OUT</span>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Player position summary */}
      <div className="text-center mb-6">
        {playerIsEliminated ? (
          <>
            <p className="font-pixel text-[10px] text-f1-danger/70 mb-1">ELIMINATED</p>
            <p className="font-pixel text-lg text-f1-danger">P{playerPosition}</p>
          </>
        ) : (
          <>
            <p className="font-pixel text-[10px] text-f1-text/50 mb-1">
              {isLastSession ? 'GRID POSITION' : `ADVANCING TO ${Q_SESSIONS[Math.min(results.length - 1, 2)]?.name || 'NEXT'}`}
            </p>
            <p className="font-pixel text-2xl text-f1-accent">P{playerPosition}</p>
          </>
        )}
      </div>

      <PixelButton variant="success" onClick={onNext} className="px-6">
        {isLastSession ? 'PROCEED TO STRATEGY' : playerIsEliminated ? 'SIMULATE REMAINING & PROCEED' : `CONTINUE TO ${Q_SESSIONS[Math.min(results.length, 2)]?.name || 'NEXT'}`}
      </PixelButton>
    </>
  )
}
