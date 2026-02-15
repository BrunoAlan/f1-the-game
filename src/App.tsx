import { useWeekendStore } from './stores/weekendStore'
import { TeamSelect } from './screens/TeamSelect'
import { Practice } from './screens/Practice'
import { Qualifying } from './screens/Qualifying'
import { StrategyRoom } from './screens/StrategyRoom'

function App() {
  const phase = useWeekendStore((s) => s.phase)

  switch (phase) {
    case 'team-select':
      return <TeamSelect />
    case 'practice':
      return <Practice />
    case 'qualifying':
      return <Qualifying />
    case 'strategy':
      return <StrategyRoom />
    default:
      return <TeamSelect />
  }
}

export default App
