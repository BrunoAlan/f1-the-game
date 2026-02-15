import { useStrategyStore } from '../stores/strategyStore'
import { tireColors } from '../data/tires'
import type { TireCompound } from '../data/types'

const DRY_COMPOUNDS: TireCompound[] = ['soft', 'medium', 'hard']
const WEATHER_COMPOUNDS: TireCompound[] = ['intermediate', 'wet']

const COMPOUND_LABELS: Record<TireCompound, string> = {
  soft: 'S',
  medium: 'M',
  hard: 'H',
  intermediate: 'I',
  wet: 'W',
}

interface StintPlannerProps {
  totalLaps: number
  revealedCompounds: string[]
  showWeatherCompounds?: boolean
}

export function StintPlanner({
  totalLaps,
  revealedCompounds,
  showWeatherCompounds = false,
}: StintPlannerProps) {
  const { stints, addStint, removeStint, updateStint } = useStrategyStore()

  const allocatedLaps = stints.reduce((sum, s) => sum + s.laps, 0)
  const lapsMatch = allocatedLaps === totalLaps
  const lapsOverflow = allocatedLaps > totalLaps

  // Validate: at least 2 different dry compounds
  const uniqueDryCompounds = new Set(
    stints
      .map((s) => s.compound)
      .filter((c) => DRY_COMPOUNDS.includes(c))
  )
  const hasTwoDryCompounds = uniqueDryCompounds.size >= 2

  const availableCompounds = showWeatherCompounds
    ? [...DRY_COMPOUNDS, ...WEATHER_COMPOUNDS]
    : DRY_COMPOUNDS

  const handleAddStint = () => {
    const remainingLaps = Math.max(1, totalLaps - allocatedLaps)
    addStint({ compound: 'medium', laps: remainingLaps })
  }

  const handleLapsChange = (index: number, newLaps: number) => {
    const clamped = Math.max(1, Math.min(newLaps, totalLaps))
    updateStint(index, { ...stints[index], laps: clamped })
  }

  const handleCompoundChange = (index: number, compound: TireCompound) => {
    updateStint(index, { ...stints[index], compound })
  }

  return (
    <div className="bg-slate-800 border-2 border-f1-border rounded-sm p-4">
      <h2 className="font-pixel text-[11px] text-f1-accent mb-4">
        STINT PLANNER
      </h2>

      <div className="flex flex-col gap-3 mb-4">
        {stints.map((stint, index) => (
          <div
            key={index}
            className="bg-slate-900/60 border border-f1-border/40 rounded-sm p-3"
          >
            {/* Stint header row */}
            <div className="flex items-center justify-between mb-2">
              <span className="font-pixel text-[9px] text-f1-text/60">
                STINT {index + 1}
              </span>
              {stints.length > 2 && (
                <button
                  onClick={() => removeStint(index)}
                  className="font-pixel text-[9px] text-f1-danger/60 hover:text-f1-danger transition-colors cursor-pointer"
                >
                  X
                </button>
              )}
            </div>

            {/* Compound selector */}
            <div className="flex gap-1.5 mb-2">
              {availableCompounds.map((compound) => {
                const isActive = stint.compound === compound
                const isLocked = !revealedCompounds.includes(compound) && DRY_COMPOUNDS.includes(compound)
                const color = tireColors[compound]

                return (
                  <button
                    key={compound}
                    onClick={() => !isLocked && handleCompoundChange(index, compound)}
                    disabled={isLocked}
                    className={`
                      font-pixel text-[9px] px-2.5 py-1.5 border rounded-sm transition-colors cursor-pointer
                      disabled:opacity-30 disabled:cursor-not-allowed
                      ${isActive
                        ? 'border-current bg-slate-700'
                        : 'border-f1-border/40 hover:border-f1-border bg-slate-800/60'
                      }
                    `}
                    style={{
                      color: isActive ? color : isLocked ? undefined : color,
                      borderColor: isActive ? color : undefined,
                    }}
                  >
                    {COMPOUND_LABELS[compound]}
                  </button>
                )
              })}
            </div>

            {/* Laps input */}
            <div className="flex items-center gap-2">
              <span className="font-pixel text-[8px] text-f1-text/40">LAPS</span>
              <input
                type="number"
                min={1}
                max={totalLaps}
                value={stint.laps}
                onChange={(e) => handleLapsChange(index, parseInt(e.target.value) || 1)}
                className="w-16 bg-slate-900 border border-f1-border/40 rounded-sm px-2 py-1 font-pixel text-[10px] text-f1-text text-center outline-none focus:border-f1-accent transition-colors"
              />
              <span className="font-pixel text-[8px] text-f1-text/30">
                / {totalLaps}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add pit stop button */}
      <button
        onClick={handleAddStint}
        className="w-full border-2 border-dashed border-f1-border/40 hover:border-f1-accent/60 rounded-sm py-2 font-pixel text-[9px] text-f1-text/50 hover:text-f1-accent transition-colors mb-4 cursor-pointer"
      >
        + ADD PIT STOP
      </button>

      {/* Lap summary */}
      <div className="flex items-center justify-between border-t border-f1-border/30 pt-3">
        <span className="font-pixel text-[9px] text-f1-text/50">TOTAL</span>
        <span
          className={`font-pixel text-[10px] ${
            lapsMatch
              ? 'text-f1-success'
              : lapsOverflow
                ? 'text-f1-danger'
                : 'text-f1-warning'
          }`}
        >
          {allocatedLaps} / {totalLaps} LAPS
        </span>
      </div>

      {/* Warnings */}
      {!lapsMatch && (
        <p className={`font-pixel text-[8px] mt-2 ${lapsOverflow ? 'text-f1-danger' : 'text-f1-warning'}`}>
          {lapsOverflow
            ? 'TOO MANY LAPS ALLOCATED!'
            : `${totalLaps - allocatedLaps} LAPS UNALLOCATED`}
        </p>
      )}

      {!hasTwoDryCompounds && (
        <p className="font-pixel text-[8px] text-f1-warning mt-1">
          MUST USE AT LEAST 2 DIFFERENT DRY COMPOUNDS
        </p>
      )}
    </div>
  )
}
