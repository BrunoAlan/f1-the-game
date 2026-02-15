import { useWeekendStore } from './stores/weekendStore'
import { TeamSelect } from './screens/TeamSelect'
import { Practice } from './screens/Practice'
import { Qualifying } from './screens/Qualifying'

function App() {
  const phase = useWeekendStore((s) => s.phase)

  switch (phase) {
    case 'team-select': return <TeamSelect />
    case 'practice': return <Practice />
    case 'qualifying': return <Qualifying />
    default: return <TeamSelect />
  }
}

export default App
