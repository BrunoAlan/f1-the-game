import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWeekendStore } from '../stores/weekendStore'
import { tracks } from '../data/tracks'
import { tireSpecs, tireColors } from '../data/tires'
import { PixelButton } from '../components/PixelButton'
import { WeatherBadge } from '../components/WeatherBadge'
import type { TireCompound } from '../data/types'

const FP_SESSIONS: { name: string; label: string; compound: TireCompound; ticks: number }[] = [
  { name: 'FP1', label: 'FREE PRACTICE 1', compound: 'soft', ticks: 14 },
  { name: 'FP2', label: 'FREE PRACTICE 2', compound: 'medium', ticks: 14 },
  { name: 'FP3', label: 'FREE PRACTICE 3', compound: 'hard', ticks: 12 },
]

const TICK_INTERVAL = 500

const COMPOUND_DISPLAY: Record<string, { label: string; color: string }> = {
  soft: { label: 'SOFT', color: tireColors.soft },
  medium: { label: 'MEDIUM', color: tireColors.medium },
  hard: { label: 'HARD', color: tireColors.hard },
}

export function Practice() {
  const { setPracticeData, setPhase, weather } = useWeekendStore()
  const track = tracks[0]

  const [fpIndex, setFpIndex] = useState(0)
  const [tick, setTick] = useState(0)
  const [revealedCompounds, setRevealedCompounds] = useState<string[]>([])
  const [sessionComplete, setSessionComplete] = useState(false)
  const [transitioning, setTransitioning] = useState(false)

  const currentFP = FP_SESSIONS[fpIndex]
  const isLastSession = fpIndex >= FP_SESSIONS.length - 1
  const allComplete = isLastSession && sessionComplete

  useEffect(() => {
    if (sessionComplete || transitioning) return

    const interval = setInterval(() => {
      setTick((prev) => {
        const next = prev + 1
        if (next >= currentFP.ticks) {
          setSessionComplete(true)
          setRevealedCompounds((prev) => {
            if (prev.includes(currentFP.compound)) return prev
            return [...prev, currentFP.compound]
          })
          clearInterval(interval)
        }
        return next
      })
    }, TICK_INTERVAL)

    return () => clearInterval(interval)
  }, [sessionComplete, transitioning, currentFP])

  const sessionProgress = Math.min((tick / currentFP.ticks) * 100, 100)
  const overallProgress = ((fpIndex + (sessionComplete ? 1 : tick / currentFP.ticks)) / FP_SESSIONS.length) * 100

  const handleNextSession = useCallback(() => {
    setTransitioning(true)
    setTimeout(() => {
      setFpIndex((prev) => prev + 1)
      setTick(0)
      setSessionComplete(false)
      setTransitioning(false)
    }, 600)
  }, [])

  const handleSkip = useCallback(() => {
    setPracticeData({
      dataCollected: overallProgress,
      revealedCompounds,
    })
    setPhase('qualifying')
  }, [overallProgress, revealedCompounds, setPracticeData, setPhase])

  const handleContinue = useCallback(() => {
    setPracticeData({
      dataCollected: 100,
      revealedCompounds: ['soft', 'medium', 'hard'],
    })
    setPhase('qualifying')
  }, [setPracticeData, setPhase])

  return (
    <div className="min-h-screen bg-f1-bg px-4 py-8 flex flex-col items-center">
      {/* Header */}
      <div className="text-center mb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentFP.name}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="font-pixel text-2xl text-f1-accent mb-1">{currentFP.name}</h1>
            <p className="font-pixel text-[10px] text-f1-text/60 mb-1">{currentFP.label}</p>
          </motion.div>
        </AnimatePresence>
        <p className="font-pixel text-[10px] text-f1-text/40 mb-2">{track.name}</p>
        <WeatherBadge weather={weather} />
      </div>

      {/* Session Progress */}
      <div className="w-full max-w-xl mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-pixel text-[10px] text-f1-text/70">{currentFP.name} PROGRESS</span>
          <span className="font-pixel text-[10px] text-f1-accent">
            {Math.round(sessionProgress)}%
          </span>
        </div>
        <div className="w-full h-3 bg-slate-800 border border-f1-border rounded-sm overflow-hidden">
          <motion.div
            className="h-full bg-f1-accent"
            initial={{ width: 0 }}
            animate={{ width: `${sessionProgress}%` }}
            transition={{ duration: 0.3, ease: 'linear' }}
          />
        </div>
      </div>

      {/* Overall Progress */}
      <div className="w-full max-w-xl mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="font-pixel text-[10px] text-f1-text/40">OVERALL DATA</span>
          <span className="font-pixel text-[10px] text-f1-text/40">
            {Math.round(overallProgress)}%
          </span>
        </div>
        <div className="w-full h-2 bg-slate-800 border border-f1-border/50 rounded-sm overflow-hidden">
          <motion.div
            className="h-full bg-f1-accent/40"
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 0.3, ease: 'linear' }}
          />
        </div>
      </div>

      {/* FP Session Indicators */}
      <div className="flex gap-3 mb-6">
        {FP_SESSIONS.map((fp, i) => (
          <div
            key={fp.name}
            className={`font-pixel text-[10px] px-3 py-1 border rounded-sm ${
              i < fpIndex
                ? 'border-f1-success/50 text-f1-success bg-f1-success/10'
                : i === fpIndex
                  ? 'border-f1-accent text-f1-accent bg-f1-accent/10'
                  : 'border-f1-border text-f1-text/30'
            }`}
          >
            {fp.name} {i < fpIndex ? '✓' : i === fpIndex ? '●' : '○'}
          </div>
        ))}
      </div>

      {/* Tire Compound Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-xl mb-10">
        {(['soft', 'medium', 'hard'] as TireCompound[]).map((compound) => {
          const isRevealed = revealedCompounds.includes(compound)
          const isCurrentTarget = currentFP.compound === compound && !isRevealed
          const spec = tireSpecs[compound]
          const display = COMPOUND_DISPLAY[compound]

          return (
            <TireCard
              key={compound}
              label={display.label}
              color={display.color}
              isRevealed={isRevealed}
              isCurrentTarget={isCurrentTarget}
              degradationRate={spec.degradationRate}
              optimalLife={spec.optimalLife}
            />
          )
        })}
      </div>

      {/* Buttons */}
      <div className="flex gap-4">
        {!allComplete && (
          <PixelButton variant="warning" onClick={handleSkip}>
            SKIP TO QUALIFYING
          </PixelButton>
        )}
        {sessionComplete && !isLastSession && (
          <PixelButton variant="default" onClick={handleNextSession}>
            NEXT → {FP_SESSIONS[fpIndex + 1].name}
          </PixelButton>
        )}
        {allComplete && (
          <PixelButton variant="success" onClick={handleContinue}>
            PROCEED TO QUALIFYING
          </PixelButton>
        )}
      </div>
    </div>
  )
}

function TireCard({
  label,
  color,
  isRevealed,
  isCurrentTarget,
  degradationRate,
  optimalLife,
}: {
  label: string
  color: string
  isRevealed: boolean
  isCurrentTarget: boolean
  degradationRate: number
  optimalLife: number
}) {
  return (
    <div className="relative h-40 perspective-[600px]">
      {/* Locked state */}
      {!isRevealed && (
        <div
          className={`absolute inset-0 bg-slate-800/80 border-2 rounded-sm flex flex-col items-center justify-center gap-2 transition-colors ${
            isCurrentTarget
              ? 'border-f1-accent/50 animate-pulse'
              : 'border-f1-border'
          }`}
        >
          <span className="font-pixel text-[11px] text-f1-text/50">{label}</span>
          <span className="text-2xl">{isCurrentTarget ? '🔍' : '🔒'}</span>
          <span className="font-pixel text-[9px] text-f1-text/30">
            {isCurrentTarget ? 'COLLECTING...' : '???'}
          </span>
        </div>
      )}

      {/* Revealed state */}
      {isRevealed && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 200 }}
          className="absolute inset-0 border-2 rounded-sm flex flex-col items-center justify-center gap-2 bg-slate-800/80"
          style={{ borderColor: color }}
        >
          <span className="font-pixel text-[11px]" style={{ color }}>
            {label}
          </span>
          <span className="text-xl">✅</span>
          <div className="flex flex-col items-center gap-1">
            <span className="font-pixel text-[8px] text-f1-text/50">DEG RATE</span>
            <span className="font-pixel text-[10px] text-f1-text">
              {degradationRate.toFixed(3)}/lap
            </span>
            <span className="font-pixel text-[8px] text-f1-text/50 mt-1">OPT LIFE</span>
            <span className="font-pixel text-[10px] text-f1-text">{optimalLife} laps</span>
          </div>
        </motion.div>
      )}
    </div>
  )
}
