import { AnimatePresence, motion } from 'framer-motion'
import { useWeekendStore } from './stores/weekendStore'
import { TeamSelect } from './screens/TeamSelect'
import { Practice } from './screens/Practice'
import { Qualifying } from './screens/Qualifying'
import { StrategyRoom } from './screens/StrategyRoom'
import { Race } from './screens/Race'

function App() {
  const phase = useWeekendStore((s) => s.phase)

  function renderPhase() {
    switch (phase) {
      case 'team-select':
        return <TeamSelect />
      case 'practice':
        return <Practice />
      case 'qualifying':
        return <Qualifying />
      case 'strategy':
        return <StrategyRoom />
      case 'race':
        return <Race />
      case 'results':
        return <Race />
      default:
        return <TeamSelect />
    }
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={phase}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen"
      >
        {renderPhase()}
      </motion.div>
    </AnimatePresence>
  )
}

export default App
