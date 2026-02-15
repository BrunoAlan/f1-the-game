export function formatLapTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  const wholeSecs = Math.floor(secs)
  const ms = Math.round((secs - wholeSecs) * 1000)
  return `${mins}:${String(wholeSecs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`
}

export function formatGap(gap: number): string {
  if (gap === 0) return 'LEADER'
  return `+${gap.toFixed(3)}`
}
