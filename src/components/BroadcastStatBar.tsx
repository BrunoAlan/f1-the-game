interface BroadcastStatBarProps {
  label: string
  value: number
  color: string
}

export function BroadcastStatBar({ label, value, color }: BroadcastStatBarProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-pixel text-[7px] text-f1-text/40 w-7 shrink-0">{label}</span>
      <div className="flex-1 h-[3px] bg-f1-border/50 rounded-sm overflow-hidden">
        <div
          className="h-full rounded-sm transition-all duration-500"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span className="font-pixel text-[7px] text-f1-text/60 w-5 text-right shrink-0">{value}</span>
    </div>
  )
}
