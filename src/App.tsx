import { useWeekendStore } from './stores/weekendStore'
import { TeamSelect } from './screens/TeamSelect'

function App() {
  const phase = useWeekendStore((s) => s.phase)

  switch (phase) {
    case 'team-select': return <TeamSelect />
    default: return <TeamSelect />
  }
}

export default App
