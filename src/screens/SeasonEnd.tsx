import { useCallback } from 'react'
import { motion } from 'framer-motion'
import { useSeasonStore } from '../stores/seasonStore'
import { useWeekendStore } from '../stores/weekendStore'
import { useRaceStore } from '../stores/raceStore'
import { useStrategyStore } from '../stores/strategyStore'
import { teams } from '../data/teams'
import { drivers } from '../data/drivers'
import { PixelButton } from '../components/PixelButton'

export function SeasonEnd() {
  const driverStandings = useSeasonStore((s) => s.driverStandings)
  const teamStandings = useSeasonStore((s) => s.teamStandings)
  const selectedTeamId = useWeekendStore((s) => s.selectedTeamId)
  const selectedDriverId = useWeekendStore((s) => s.selectedDriverId)

  const driverMap = new Map(drivers.map((d) => [d.id, d]))
  const teamMap = new Map(teams.map((t) => [t.id, t]))

  const sortedDrivers = [...driverStandings].sort((a, b) => b.points - a.points)
  const sortedTeams = [...teamStandings].sort((a, b) => b.points - a.points)

  const playerTeamDriverIds = new Set(
    drivers.filter((d) => d.teamId === selectedTeamId).map((d) => d.id),
  )

  const handleNewSeason = useCallback(() => {
    useSeasonStore.getState().reset()
    useWeekendStore.getState().reset()
    useRaceStore.getState().reset()
    useStrategyStore.getState().reset()
  }, [])

  return (
    <div className="min-h-screen bg-f1-bg px-4 py-8 flex flex-col items-center">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 12, stiffness: 100 }}
        className="text-center mb-8"
      >
        <h1 className="font-pixel text-2xl text-f1-accent mb-2">SEASON COMPLETE</h1>
        <div className="w-32 h-0.5 bg-f1-accent/30 mx-auto" />
      </motion.div>

      {/* Drivers Championship */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-2xl mb-8"
      >
        <h2 className="font-pixel text-sm text-f1-accent mb-3 text-center">DRIVERS CHAMPIONSHIP</h2>
        <div className="flex flex-col gap-0.5">
          {sortedDrivers.map((standing, index) => {
            const driver = driverMap.get(standing.driverId)
            if (!driver) return null
            const team = teamMap.get(driver.teamId)
            if (!team) return null
            const isPlayerDriver =
              standing.driverId === selectedDriverId || playerTeamDriverIds.has(standing.driverId)

            return (
              <motion.div
                key={standing.driverId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.03 }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-sm font-pixel text-[10px] ${
                  isPlayerDriver ? 'bg-slate-700/80 border-l-2' : 'bg-slate-800/40'
                }`}
                style={isPlayerDriver ? { borderLeftColor: team.primaryColor } : undefined}
              >
                <span className="w-6 text-right text-f1-accent font-bold">{index + 1}.</span>
                <div
                  className="w-1 h-4 rounded-sm shrink-0"
                  style={{ backgroundColor: team.primaryColor }}
                />
                <span className={`w-16 ${isPlayerDriver ? 'text-f1-accent' : 'text-f1-text'}`}>
                  {driver.shortName}
                  <span className="text-f1-text/30 ml-1">#{driver.number}</span>
                </span>
                <span className="flex-1 text-f1-text/50 truncate">{team.name}</span>
                <span className="w-12 text-right text-f1-text font-bold">{standing.points}</span>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Constructors Championship */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="w-full max-w-2xl mb-10"
      >
        <h2 className="font-pixel text-sm text-f1-accent mb-3 text-center">
          CONSTRUCTORS CHAMPIONSHIP
        </h2>
        <div className="flex flex-col gap-0.5">
          {sortedTeams.map((standing, index) => {
            const team = teamMap.get(standing.teamId)
            if (!team) return null
            const isPlayerTeam = standing.teamId === selectedTeamId

            return (
              <motion.div
                key={standing.teamId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + index * 0.05 }}
                className={`flex items-center gap-2 px-3 py-2 rounded-sm font-pixel text-[10px] ${
                  isPlayerTeam ? 'bg-slate-700/80 border-l-2' : 'bg-slate-800/40'
                }`}
                style={isPlayerTeam ? { borderLeftColor: team.primaryColor } : undefined}
              >
                <span className="w-6 text-right text-f1-accent font-bold">{index + 1}.</span>
                <div
                  className="w-1 h-5 rounded-sm shrink-0"
                  style={{ backgroundColor: team.primaryColor }}
                />
                <span className={`flex-1 ${isPlayerTeam ? 'text-f1-accent' : 'text-f1-text'}`}>
                  {team.name}
                </span>
                <span className="w-12 text-right text-f1-text font-bold">{standing.points}</span>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* New Season Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
      >
        <PixelButton variant="success" onClick={handleNewSeason} className="px-8">
          NEW SEASON
        </PixelButton>
      </motion.div>
    </div>
  )
}
