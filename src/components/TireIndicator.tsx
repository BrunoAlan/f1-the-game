import type { TireCompound } from '../data/types'
import { tireColors } from '../data/tires'

interface TireIndicatorProps {
  compound: TireCompound
  gripPercent: number
  lapsOnTire: number
}

export function TireIndicator({ compound, gripPercent, lapsOnTire }: TireIndicatorProps) {
  const color = tireColors[compound]
  const clampedGrip = Math.max(0, Math.min(100, gripPercent))

  return (
    <div className="flex flex-row items-stretch gap-2 font-pixel text-[10px]">
      <div className="w-1 min-h-[24px] rounded-sm" style={{ backgroundColor: color }} />
      <div className="flex flex-col justify-center gap-0.5">
        <div className="flex items-center gap-2">
          <span style={{ color }} className="uppercase font-bold">
            {compound}
          </span>
          <span className="text-f1-text/70">{Math.round(clampedGrip)}%</span>
          <span className="text-f1-text/50">L{lapsOnTire}</span>
        </div>
      </div>
    </div>
  )
}
