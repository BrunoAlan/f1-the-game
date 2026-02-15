interface LapCounterProps {
  currentLap: number
  totalLaps: number
}

export function LapCounter({ currentLap, totalLaps }: LapCounterProps) {
  return (
    <div className="text-center font-pixel text-f1-accent text-sm">
      LAP {currentLap}/{totalLaps}
    </div>
  )
}
