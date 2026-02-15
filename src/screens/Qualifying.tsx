import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWeekendStore } from '../stores/weekendStore'
import { teams } from '../data/teams'
import { drivers } from '../data/drivers'
import { tracks } from '../data/tracks'
import { PixelButton } from '../components/PixelButton'
import { BroadcastTimingTower, type TimingEntry } from '../components/BroadcastTimingTower'
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

const RISK_COLORS = {
  safe: '#00ff41',
  push: '#ffd700',
  'full-send': '#ff2a6d',
} as const

const MODE_OPTIONS: {
  mode: QualifyingMode
  label: string
  sublabel: string
  pace: string
  error: string
  color: string
  riskColor: string
}[] = [
  {
    mode: 'safe',
    label: 'SAFE',
    sublabel: '',
    pace: '90% pace',
    error: '2% error',
    color: 'text-f1-success',
    riskColor: RISK_COLORS.safe,
  },
  {
    mode: 'push',
    label: 'PUSH',
    sublabel: '',
    pace: '100% pace',
    error: '15% error',
    color: 'text-f1-warning',
    riskColor: RISK_COLORS.push,
  },
  {
    mode: 'full-send',
    label: 'FULL',
    sublabel: 'SEND',
    pace: '105% pace',
    error: '35% error',
    color: 'text-f1-danger',
    riskColor: RISK_COLORS['full-send'],
  },
]

export function Qualifying() {
  const { selectedDriverId, weather, setQualifyingGrid, setPhase, isSprint } = useWeekendStore()
  const currentTrackId = useWeekendStore((s) => s.currentTrackId)
  const track = tracks.find((t) => t.id === currentTrackId) ?? tracks[0]

  const [qIndex, setQIndex] = useState(0)
  const [internalPhase, setInternalPhase] = useState<InternalPhase>('mode-select')
  const [sessionResults, setSessionResults] = useState<QualifyingResult[]>([])
  const [playerResult, setPlayerResult] = useState<QualifyingResult | null>(null)
  const [eliminatedIds, setEliminatedIds] = useState<Set<string>>(new Set())
  const [finalGrid, setFinalGrid] = useState<
    { driverId: string; position: number; time: number }[]
  >([])

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
    setPhase(isSprint ? 'sprint-shootout' : 'strategy')
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
    setPhase(isSprint ? 'sprint-shootout' : 'strategy')
  }

  const weatherLabel =
    weather === 'dry' ? 'DRY' : weather === 'light-rain' ? 'LIGHT RAIN' : 'HEAVY RAIN'

  return (
    <div className="min-h-screen bg-f1-bg flex flex-col">
      {/* Header */}
      <div className="bg-f1-surface border-b border-f1-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-pixel text-f1-accent text-sm">{currentQ.name}</span>
          <span className="font-pixel text-[9px] text-f1-text/50">{track.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-pixel text-[9px] text-f1-text/40">{weatherLabel}</span>
          {/* Q Session Indicators */}
          <div className="flex gap-2">
            {Q_SESSIONS.map((q, i) => (
              <div
                key={q.name}
                className={`font-pixel text-[8px] px-2 py-0.5 border rounded-sm ${
                  i < qIndex
                    ? 'border-f1-success/50 text-f1-success bg-f1-success/10'
                    : i === qIndex
                      ? 'border-f1-accent text-f1-accent bg-f1-accent/10'
                      : 'border-f1-border text-f1-text/30'
                }`}
              >
                {q.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 px-4 py-8 flex flex-col items-center">
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
              <h1 className="font-pixel text-xl text-f1-danger mb-2">
                ELIMINATED IN {Q_SESSIONS[qIndex - 1]?.name}
              </h1>
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
                sessionResults={sessionResults}
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
                isSprint={isSprint}
                onNext={isLastSession ? handleFinish : handleNextSession}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

/* ─── Phase A: Mode Selection ─── */

function ModeSelectPhase({
  onSelect,
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
  const [hoveredMode, setHoveredMode] = useState<QualifyingMode | null>(null)

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="font-pixel text-2xl text-f1-accent mb-1">{sessionName}</h1>
        <p className="font-pixel text-[10px] text-f1-text/60 mb-1">{sessionLabel}</p>
        <p className="font-pixel text-[9px] text-f1-text/30">
          {driversCount} DRIVERS
          {eliminatedCount > 0
            ? ` — BOTTOM ${eliminatedCount} ELIMINATED`
            : ' — POLE POSITION SHOOTOUT'}
        </p>
      </div>

      <p className="font-pixel text-[10px] text-f1-text/40 mb-4">Choose Your Approach</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
        {MODE_OPTIONS.map((opt) => {
          const isHovered = hoveredMode === opt.mode
          return (
            <button
              key={opt.mode}
              onClick={() => onSelect(opt.mode)}
              onMouseEnter={() => setHoveredMode(opt.mode)}
              onMouseLeave={() => setHoveredMode(null)}
              className="bg-f1-surface border border-f1-border rounded-sm p-6 flex flex-col items-center gap-3 transition-all cursor-pointer border-l-[3px]!"
              style={{
                borderLeftColor: opt.riskColor,
                boxShadow: isHovered
                  ? `inset 0 0 30px ${opt.riskColor}15, 0 0 12px ${opt.riskColor}20`
                  : undefined,
                backgroundColor: isHovered ? `${opt.riskColor}08` : undefined,
              }}
            >
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
          )
        })}
      </div>
    </>
  )
}

/* ─── Phase B: Lap Animation ─── */

const SECTOR_DURATIONS = [1.5, 1.5, 2.0]
const SECTOR_LABELS = ['S1', 'S2', 'S3']

/** Determine sector color based on context:
 *  Purple (#a855f7): session best
 *  Green (#00ff41): personal best
 *  Yellow (#ffd700): slower than personal best */
function getSectorColor(
  sectorIndex: number,
  playerResult: QualifyingResult,
  sessionResults: QualifyingResult[],
): string {
  // For qualifying we use a simplified heuristic:
  // - If no error and this is a top result: purple (session best)
  // - If no error: green (personal best)
  // - If error or slow: yellow
  const playerTime = playerResult.time
  const bestTime = Math.min(...sessionResults.map((r) => r.time))

  // Distribute the sectors based on position
  const isSessionBest = playerTime <= bestTime * 1.001
  const hasError = playerResult.error

  if (hasError) {
    // If error, later sectors are yellow
    if (sectorIndex >= 1) return '#ffd700'
    return '#00ff41'
  }

  if (isSessionBest) {
    // Session best: purple for last sector, green for others
    if (sectorIndex === 2) return '#a855f7'
    return '#00ff41'
  }

  // Personal best but not session best
  const isClose = playerTime <= bestTime * 1.005
  if (isClose) {
    return '#00ff41'
  }

  return '#ffd700'
}

function LapAnimationPhase({
  playerResult,
  sessionResults,
  sessionName,
  onComplete,
}: {
  playerResult: QualifyingResult
  sessionResults: QualifyingResult[]
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
          const sectorColor = getSectorColor(i, playerResult, sessionResults)

          return (
            <div key={i} className="flex items-center gap-3">
              <span
                className="font-pixel text-[10px] w-8"
                style={{ color: isFilled ? sectorColor : 'rgba(255,255,255,0.3)' }}
              >
                {SECTOR_LABELS[i]}
              </span>
              <div className="flex-1 h-5 bg-f1-surface border border-f1-border rounded-sm overflow-hidden">
                <motion.div
                  className="h-full"
                  style={{ backgroundColor: sectorColor }}
                  initial={{ width: '0%' }}
                  animate={{
                    width: isFilled ? '100%' : isFilling ? '100%' : '0%',
                  }}
                  transition={isFilling ? { duration, ease: 'easeInOut' } : { duration: 0 }}
                />
              </div>
              {isFilled && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-pixel text-[9px] w-12 text-right"
                  style={{ color: sectorColor }}
                >
                  {sectorColor === '#a855f7' ? 'BEST' : sectorColor === '#00ff41' ? 'PB' : 'SLOW'}
                </motion.span>
              )}
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
            className={`font-pixel ${playerResult.error ? 'text-f1-danger' : 'text-f1-accent'}`}
            style={{ fontSize: '24px' }}
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

/* ─── Phase C: Results (BroadcastTimingTower) ─── */

function ResultsPhase({
  results,
  playerDriverId,
  sessionName,
  eliminatedCount,
  isLastSession,
  isSprint,
  onNext,
}: {
  results: QualifyingResult[]
  playerDriverId: string
  sessionName: string
  eliminatedCount: number
  isLastSession: boolean
  isSprint: boolean
  onNext: () => void
}) {
  const playerPosition = results.find((r) => r.driverId === playerDriverId)?.position ?? 0
  const cutoffPosition = results.length - eliminatedCount
  const playerIsEliminated = playerPosition > cutoffPosition && eliminatedCount > 0

  // Build TimingEntry[] from results
  const bestTime = Math.min(...results.map((r) => r.time))
  const timingEntries: TimingEntry[] = results.map((result) => {
    const isEliminated = eliminatedCount > 0 && result.position > cutoffPosition
    const gap = result.time - bestTime
    const value = result.position === 1 ? formatLapTime(result.time) : `+${gap.toFixed(3)}`

    return {
      driverId: result.driverId,
      teamId: result.teamId,
      position: result.position,
      value,
      status: isEliminated ? ('eliminated' as const) : undefined,
      inactive: isEliminated,
    }
  })

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

      <div className="w-full max-w-xl mb-6">
        <BroadcastTimingTower
          entries={timingEntries}
          drivers={drivers}
          teams={teams}
          playerDriverId={playerDriverId}
          layoutId={`qualifying-${sessionName}`}
        />
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
              {isLastSession
                ? 'GRID POSITION'
                : `ADVANCING TO ${Q_SESSIONS[Math.min(results.length - 1, 2)]?.name || 'NEXT'}`}
            </p>
            <p className="font-pixel text-2xl text-f1-accent">P{playerPosition}</p>
          </>
        )}
      </div>

      {/* Sticky bottom bar */}
      <div className="sticky bottom-0 bg-f1-surface/95 backdrop-blur border-t border-f1-border px-4 py-3 flex items-center justify-between w-full max-w-xl rounded-sm">
        <div className="font-pixel text-[9px] text-f1-text/50">
          {eliminatedCount > 0 ? `ELIMINATION ZONE: P${cutoffPosition + 1}+` : 'FINAL SESSION'}
        </div>
        <PixelButton variant="success" onClick={onNext} className="px-6">
          {isLastSession
            ? isSprint
              ? 'SPRINT SHOOTOUT'
              : 'STRATEGY ROOM'
            : playerIsEliminated
              ? 'SIMULATE & PROCEED'
              : `CONTINUE TO ${Q_SESSIONS[Math.min(results.length, 2)]?.name || 'NEXT'}`}
        </PixelButton>
      </div>
    </>
  )
}
