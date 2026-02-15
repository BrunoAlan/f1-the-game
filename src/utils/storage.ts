interface BestResult {
  teamId: string
  driverName: string
  position: number
  trackId: string
}

const STORAGE_KEY = 'f1-game-best-results'

export function saveBestResult(result: BestResult): void {
  const existing = getBestResults()
  const key = `${result.teamId}-${result.trackId}`
  const current = existing[key]
  if (!current || result.position < current.position) {
    existing[key] = result
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
  }
}

export function getBestResults(): Record<string, BestResult> {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : {}
  } catch {
    return {}
  }
}

export function getBestForTeam(teamId: string, trackId: string): BestResult | null {
  const results = getBestResults()
  return results[`${teamId}-${trackId}`] || null
}
