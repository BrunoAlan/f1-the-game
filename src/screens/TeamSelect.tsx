import { motion } from 'framer-motion'
import { teams } from '../data/teams'
import { drivers } from '../data/drivers'
import { useWeekendStore } from '../stores/weekendStore'
import { useSeasonStore } from '../stores/seasonStore'
import { PixelButton } from '../components/PixelButton'
import { TeamSelectCard } from '../components/TeamSelectCard'

export function TeamSelect() {
  const { selectedTeamId, selectedDriverId, selectTeam, setPhase } = useWeekendStore()

  const selectedTeam = teams.find((t) => t.id === selectedTeamId)

  const handleDriverClick = (teamId: string, driverId: string) => {
    selectTeam(teamId, driverId)
  }

  const handleStart = () => {
    if (selectedDriverId) {
      useSeasonStore.getState().startSeason()
      setPhase('hq')
    }
  }

  return (
    <div className="min-h-screen bg-f1-bg px-4 py-6 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-3xl flex justify-between items-baseline mb-6">
        <h1 className="font-pixel text-base text-f1-text">F1 THE GAME</h1>
        <span className="font-pixel text-[9px] text-f1-text/40">SEASON 2026</span>
      </div>

      <p className="font-pixel text-[10px] text-f1-warning mb-6 self-start max-w-3xl w-full">
        SELECT YOUR TEAM
      </p>

      {/* Team Cards */}
      <motion.div
        className="flex flex-col gap-3 w-full max-w-3xl mb-8"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.05 } },
        }}
      >
        {teams.map((team) => {
          const teamDrivers = drivers.filter((d) => d.teamId === team.id)
          return (
            <motion.div
              key={team.id}
              variants={{
                hidden: { opacity: 0, y: 12 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.3 }}
            >
              <TeamSelectCard
                team={team}
                drivers={teamDrivers}
                selectedDriverId={selectedDriverId}
                isTeamSelected={selectedTeamId === team.id}
                onDriverClick={handleDriverClick}
              />
            </motion.div>
          )
        })}
      </motion.div>

      {/* Bottom Action Bar */}
      <div className="sticky bottom-0 w-full max-w-3xl py-4 bg-f1-bg/90 backdrop-blur-sm border-t border-f1-border/30 flex justify-center">
        <PixelButton
          variant="success"
          disabled={!selectedDriverId}
          onClick={handleStart}
          className="px-8 py-4"
          style={
            selectedTeam
              ? { borderColor: selectedTeam.primaryColor, color: selectedTeam.primaryColor }
              : undefined
          }
        >
          START SEASON {'\u2192'}
        </PixelButton>
      </div>
    </div>
  )
}
