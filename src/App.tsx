import { AnimatePresence, motion } from 'framer-motion'
import { useWeekendStore } from './stores/weekendStore'
import { teams } from './data/teams'
import { TeamSelect } from './screens/TeamSelect'
import { HQ } from './screens/HQ'
import { Practice } from './screens/Practice'
import { Qualifying } from './screens/Qualifying'
import { SprintShootout } from './screens/SprintShootout'
import { SprintRace } from './screens/SprintRace'
import { StrategyRoom } from './screens/StrategyRoom'
import { Race } from './screens/Race'
import { SeasonEnd } from './screens/SeasonEnd'

function App() {
  const phase = useWeekendStore((s) => s.phase)
  const selectedTeamId = useWeekendStore((s) => s.selectedTeamId)
  const teamColor = teams.find((t) => t.id === selectedTeamId)?.primaryColor ?? '#47c7fc'

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
