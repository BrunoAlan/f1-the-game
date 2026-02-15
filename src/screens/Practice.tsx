import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useWeekendStore } from '../stores/weekendStore'
import { tracks } from '../data/tracks'
import { tireSpecs, tireColors } from '../data/tires'
import { PixelButton } from '../components/PixelButton'
import { WeatherBadge } from '../components/WeatherBadge'
import type { TireCompound } from '../data/types'

const TOTAL_TICKS = 40
const TICK_INTERVAL = 500
const REVEAL_THRESHOLDS: { tick: number; compound: TireCompound }[] = [
  { tick: 10, compound: 'soft' },
  { tick: 20, compound: 'medium' },
  { tick: 30, compound: 'hard' },
]

const COMPOUND_DISPLAY: Record<string, { label: string; color: string }> = {
  soft: { label: 'SOFT', color: tireColors.soft },
  medium: { label: 'MEDIUM', color: tireColors.medium },
  hard: { label: 'HARD', color: tireColors.hard },
}

export function Practice() {
  const { setPracticeData, setPhase, weather } = useWeekendStore()
  const track = tracks[0]

  const [tick, setTick] = useState(0)
  const [revealedCompounds, setRevealedCompounds] = useState<string[]>([])
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (isComplete) return

    const interval = setInterval(() => {
      setTick((prev) => {
        const next = prev + 1

        REVEAL_THRESHOLDS.forEach(({ tick: threshold, compound }) => {
          if (next === threshold) {
            setRevealedCompounds((prev) => {
              if (prev.includes(compound)) return prev
              return [...prev, compound]
            })
          }
        })

        if (next >= TOTAL_TICKS) {
          setIsComplete(true)
          clearInterval(interval)
        }

        return next
      })
    }, TICK_INTERVAL)

    return () => clearInterval(interval)
  }, [isComplete])

  const progress = Math.min((tick / TOTAL_TICKS) * 100, 100)

  const handleSkip = useCallback(() => {
    setPracticeData({
      dataCollected: progress,
      revealedCompounds,
    })
    setPhase('qualifying')
  }, [progress, revealedCompounds, setPracticeData, setPhase])

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
        <h1 className="font-pixel text-xl text-f1-accent mb-1">
          PRACTICE SESSION
        </h1>
        <p className="font-pixel text-[10px] text-f1-text/60 mb-2">
          {track.name}
        </p>
        <WeatherBadge weather={weather} />
      </div>

      {/* Progress Section */}
      <div className="w-full max-w-xl mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="font-pixel text-[10px] text-f1-text/70">
            DATA COLLECTED
          </span>
          <span className="font-pixel text-[10px] text-f1-accent">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="w-full h-4 bg-slate-800 border border-f1-border rounded-sm overflow-hidden">
          <motion.div
            className="h-full bg-f1-accent"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'linear' }}
          />
        </div>
      </div>

      {/* Tire Compound Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-xl mb-10">
        {(['soft', 'medium', 'hard'] as TireCompound[]).map((compound) => {
          const isRevealed = revealedCompounds.includes(compound)
          const spec = tireSpecs[compound]
          const display = COMPOUND_DISPLAY[compound]

          return (
            <TireCard
              key={compound}
              label={display.label}
              color={display.color}
              isRevealed={isRevealed}
              degradationRate={spec.degradationRate}
              optimalLife={spec.optimalLife}
            />
          )
        })}
      </div>

      {/* Buttons */}
      <div className="flex gap-4">
        {!isComplete && (
          <PixelButton variant="warning" onClick={handleSkip}>
            SKIP
          </PixelButton>
        )}
        {isComplete && (
          <PixelButton variant="success" onClick={handleContinue}>
            CONTINUE
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
  degradationRate,
  optimalLife,
}: {
  label: string
  color: string
  isRevealed: boolean
  degradationRate: number
  optimalLife: number
}) {
  return (
    <div className="relative h-40 perspective-[600px]">
      {/* Locked state */}
      {!isRevealed && (
        <div className="absolute inset-0 bg-slate-800/80 border-2 border-f1-border rounded-sm flex flex-col items-center justify-center gap-2">
          <span className="font-pixel text-[11px] text-f1-text/50">{label}</span>
          <span className="text-2xl">🔒</span>
          <span className="font-pixel text-[9px] text-f1-text/30">???</span>
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
            <span className="font-pixel text-[8px] text-f1-text/50 mt-1">
              OPT LIFE
            </span>
            <span className="font-pixel text-[10px] text-f1-text">
              {optimalLife} laps
            </span>
          </div>
        </motion.div>
      )}
    </div>
  )
}
