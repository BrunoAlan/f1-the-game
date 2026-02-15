import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useWeekendStore } from './stores/weekendStore'
import { useSeasonStore } from './stores/seasonStore'
import { useRaceStore } from './stores/raceStore'
import { useStrategyStore } from './stores/strategyStore'
import { teams } from './data/teams'
import { tracks } from './data/tracks'
import { calendar } from './data/calendar'
import { TeamSelect } from './screens/TeamSelect'
import { HQ } from './screens/HQ'
import { Practice } from './screens/Practice'
import { Qualifying } from './screens/Qualifying'
import { SprintShootout } from './screens/SprintShootout'
import { SprintRace } from './screens/SprintRace'
import { StrategyRoom } from './screens/StrategyRoom'
import { Race } from './screens/Race'
import { SeasonEnd } from './screens/SeasonEnd'

// Phases that require raceStore (not persisted) — fall back to HQ
const RACE_PHASES = new Set(['race', 'results', 'sprint-race'])

function App() {
  const phase = useWeekendStore((s) => s.phase)
  const selectedTeamId = useWeekendStore((s) => s.selectedTeamId)
  const seasonActive = useSeasonStore((s) => s.seasonActive)
  const teamColor = teams.find((t) => t.id === selectedTeamId)?.primaryColor ?? '#47c7fc'

  const [showContinueDialog, setShowContinueDialog] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // On mount: if there's an active season saved, ask the player
    if (seasonActive && phase !== 'team-select') {
      // If player was mid-race, fall back to HQ since raceStore isn't persisted
      if (RACE_PHASES.has(phase)) {
        useWeekendStore.getState().setPhase('hq')
        // Re-set the current track for the HQ screen
        const raceIndex = useSeasonStore.getState().currentRaceIndex
        const entry = calendar[raceIndex]
        if (entry) {
          const track = tracks.find((t) => t.id === entry.trackId)
          useWeekendStore.getState().setCurrentTrack(entry.trackId, track?.hasSprint ?? false)
        }
      }
      setShowContinueDialog(true)
    } else {
      setReady(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleContinue() {
    setShowContinueDialog(false)
    setReady(true)
  }

  function handleNewSeason() {
    useSeasonStore.getState().reset()
    useWeekendStore.getState().reset()
    useRaceStore.getState().reset()
    useStrategyStore.getState().reset()
    setShowContinueDialog(false)
    setReady(true)
  }

  if (showContinueDialog) {
    const team = teams.find((t) => t.id === selectedTeamId)
    const raceIndex = useSeasonStore.getState().currentRaceIndex
    return (
      <div className="min-h-screen bg-f1-bg flex items-center justify-center p-4">
        <div className="bg-f1-surface border-2 border-f1-border p-8 max-w-md w-full text-center">
          <div className="text-f1-accent font-pixel text-[10px] mb-4">SAVE FOUND</div>
          <div className="text-f1-text font-pixel text-[12px] mb-2">Season in progress</div>
          {team && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: team.primaryColor }} />
              <span className="text-f1-text font-pixel text-[10px]">{team.name}</span>
            </div>
          )}
          <div className="text-f1-text/60 font-pixel text-[9px] mb-6">
            Race {raceIndex + 1} / {calendar.length}
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleContinue}
              className="font-pixel text-[10px] px-6 py-3 bg-f1-accent text-f1-bg hover:brightness-110 transition-all uppercase tracking-wider"
            >
              Continue Season
            </button>
            <button
              onClick={handleNewSeason}
              className="font-pixel text-[10px] px-6 py-3 bg-f1-bg border border-f1-border text-f1-text hover:border-f1-accent transition-all uppercase tracking-wider"
            >
              New Season
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!ready) return null

  function renderPhase() {
    switch (phase) {
      case 'team-select':
        return <TeamSelect />
      case 'hq':
        return <HQ />
      case 'practice':
        return <Practice />
      case 'qualifying':
        return <Qualifying />
      case 'sprint-shootout':
        return <SprintShootout />
      case 'sprint-race':
        return <SprintRace />
      case 'strategy':
        return <StrategyRoom />
      case 'race':
        return <Race />
      case 'results':
        return <Race />
      case 'season-end':
        return <SeasonEnd />
      default:
        return <TeamSelect />
    }
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={phase}
        initial={{ opacity: 0, clipPath: 'inset(0 100% 0 0)' }}
        animate={{ opacity: 1, clipPath: 'inset(0 0% 0 0)' }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
        className="min-h-screen"
        style={{ '--team-color': teamColor } as React.CSSProperties}
      >
        {renderPhase()}
      </motion.div>
    </AnimatePresence>
  )
}

export default App
