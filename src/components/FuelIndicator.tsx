interface FuelIndicatorProps {
  fuelPercent: number
}

export function FuelIndicator({ fuelPercent }: FuelIndicatorProps) {
  const clamped = Math.max(0, Math.min(100, fuelPercent))

  const barColor = clamped > 50 ? 'bg-f1-success' : clamped >= 20 ? 'bg-f1-warning' : 'bg-f1-danger'

  return (
    <div className="flex items-center gap-2 font-pixel text-[10px]">
      <span className="text-f1-text/70">FUEL</span>
      <div className="w-20 h-2 bg-slate-700 rounded-sm overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-300`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="text-f1-text/50">{Math.round(clamped)}%</span>
    </div>
  )
}
