import { tireSpecs, tireColors } from '../data/tires'
import type { TireCompound } from '../data/types'

const ALL_DRY_COMPOUNDS: TireCompound[] = ['soft', 'medium', 'hard']
const MAX_LIFE = 35

interface DegradationChartProps {
  revealedCompounds: string[]
}

export function DegradationChart({ revealedCompounds }: DegradationChartProps) {
  return (
    <div className="bg-slate-800 border-2 border-f1-border rounded-sm p-4">
      <h2 className="font-pixel text-[11px] text-f1-accent mb-4">TIRE DATA</h2>

      <div className="flex flex-col gap-3">
        {ALL_DRY_COMPOUNDS.map((compound) => {
          const isRevealed = revealedCompounds.includes(compound)
          const spec = tireSpecs[compound]
          const color = tireColors[compound]
          const barWidthPercent = (spec.optimalLife / MAX_LIFE) * 100

          if (!isRevealed) {
            return (
              <div key={compound} className="flex items-center gap-3">
                <span className="font-pixel text-[9px] text-f1-text/30 w-16 uppercase shrink-0">
                  {compound}
                </span>
                <div className="flex-1 h-5 bg-slate-900 border border-f1-border/40 rounded-sm flex items-center justify-center">
                  <span className="font-pixel text-[8px] text-f1-text/30">LOCKED</span>
                </div>
                <span className="font-pixel text-[8px] text-f1-text/20 w-20 text-right shrink-0">
                  ???
                </span>
              </div>
            )
          }

          return (
            <div key={compound} className="flex items-center gap-3">
              <span className="font-pixel text-[9px] w-16 uppercase shrink-0" style={{ color }}>
                {compound}
              </span>
              <div className="flex-1 h-5 bg-slate-900 border border-f1-border/40 rounded-sm overflow-hidden">
                <div
                  className="h-full rounded-sm transition-all duration-500"
                  style={{
                    width: `${barWidthPercent}%`,
                    backgroundColor: color,
                    opacity: 0.8,
                  }}
                />
              </div>
              <div className="flex flex-col items-end shrink-0 w-20">
                <span className="font-pixel text-[8px] text-f1-text/70">
                  ~{spec.optimalLife} laps
                </span>
                <span className="font-pixel text-[7px] text-f1-text/40">
                  {spec.degradationRate}/lap
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
