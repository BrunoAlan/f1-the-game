import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { useSeasonStore } from '../stores/seasonStore'
import { useWeekendStore } from '../stores/weekendStore'
import { useRaceStore } from '../stores/raceStore'
import { useStrategyStore } from '../stores/strategyStore'
import { teams } from '../data/teams'
import { drivers } from '../data/drivers'
import { DriverNumberBadge } from '../components/DriverNumberBadge'
import { TeamLogo } from '../components/TeamLogo'
import { BroadcastTimingTower, type TimingEntry } from '../components/BroadcastTimingTower'

const CONFETTI_COLORS = ['#ffd700', '#ff2a6d', '#00ff41', '#47c7fc', '#a855f7']
const INITIAL_BUDGET = 10_000_000

export function SeasonEnd() {
  const driverStandings = useSeasonStore((s) => s.driverStandings)
  const teamStandings = useSeasonStore((s) => s.teamStandings)
  const budget = useSeasonStore((s) => s.budget)
  const researchPoints = useSeasonStore((s) => s.researchPoints)
  const selectedTeamId = useWeekendStore((s) => s.selectedTeamId)
  const selectedDriverId = useWeekendStore((s) => s.selectedDriverId)

  const [standingsTab, setStandingsTab] = useState<'drivers' | 'constructors'>('drivers')

  const driverMap = new Map(drivers.map((d) => [d.id, d]))
  const teamMap = new Map(teams.map((t) => [t.id, t]))

  const sortedDrivers = [...driverStandings].sort((a, b) => b.points - a.points)
  const sortedTeams = [...teamStandings].sort((a, b) => b.points - a.points)

  const playerTeam = teamMap.get(selectedTeamId ?? '')

  // Champions
  const wdcChampion = sortedDrivers[0]
  const wdcDriver = wdcChampion ? driverMap.get(wdcChampion.driverId) : undefined
  const wdcTeam = wdcDriver ? teamMap.get(wdcDriver.teamId) : undefined

  const wccChampion = sortedTeams[0]
  const wccTeam = wccChampion ? teamMap.get(wccChampion.teamId) : undefined

  // Player stats
  const playerStanding = sortedDrivers.find((s) => s.driverId === selectedDriverId)
  const playerPosition = playerStanding ? sortedDrivers.indexOf(playerStanding) + 1 : 0
  const playerPositions = playerStanding?.positions ?? []
  const playerWins = playerPositions.filter((p) => p === 1).length
  const playerPodiums = playerPositions.filter((p) => p <= 3).length
  const playerPoints = playerStanding?.points ?? 0
  const moneyEarned = Math.max(0, budget - INITIAL_BUDGET)

  // Is the player a champion?
  const isDriverChampion = wdcChampion?.driverId === selectedDriverId
  const isTeamChampion = wccChampion?.teamId === selectedTeamId
  const isChampion = isDriverChampion || isTeamChampion

  // Timing tower entries
  const driverEntries: TimingEntry[] = sortedDrivers.map((standing, i) => {
    const driver = driverMap.get(standing.driverId)
    return {
      driverId: standing.driverId,
      teamId: driver?.teamId ?? '',
      position: i + 1,
      value: `${standing.points} PTS`,
    }
  })

  const constructorEntries: TimingEntry[] = sortedTeams.map((standing, i) => {
    // Find first driver for the team to use as entry driverId
    const teamDrivers = drivers.filter((d) => d.teamId === standing.teamId)
    const firstDriver = teamDrivers[0]
    return {
      driverId: firstDriver?.id ?? '',
      teamId: standing.teamId,
      position: i + 1,
      value: `${standing.points} PTS`,
    }
  })

  const statCards = [
    { label: 'FINAL POSITION', value: playerPosition ? `P${playerPosition}` : '--' },
    { label: 'WINS', value: `${playerWins}` },
    { label: 'PODIUMS', value: `${playerPodiums}` },
    { label: 'TOTAL POINTS', value: `${playerPoints}` },
    { label: 'MONEY EARNED', value: `$${(moneyEarned / 1_000_000).toFixed(1)}M` },
    { label: 'RP ACCUMULATED', value: `${researchPoints}` },
  ]

  const handleNewSeason = useCallback(() => {
    useSeasonStore.getState().reset()
    useWeekendStore.getState().reset()
    useRaceStore.getState().reset()
    useStrategyStore.getState().reset()
  }, [])

  return (
    <div className="min-h-screen bg-f1-bg flex flex-col pb-16">
      {/* Confetti */}
      {isChampion &&
        Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="fixed w-2 h-2 pointer-events-none z-50"
            style={{
              backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              left: `${Math.random() * 100}%`,
            }}
            initial={{ y: -20, rotate: 0, opacity: 1 }}
            animate={{
              y: window.innerHeight + 20,
              rotate: Math.random() * 720,
              opacity: 0,
            }}
            transition={{
              duration: 2 + Math.random(),
              delay: Math.random() * 0.5,
              ease: 'easeIn',
            }}
          />
        ))}

      {/* Header */}
      <div className="bg-f1-surface border-b border-f1-border px-4 py-4 text-center">
        <h1 className="font-pixel text-sm text-f1-accent">2026 SEASON COMPLETE</h1>
      </div>

      <div className="flex-1 px-4 py-6 flex flex-col items-center gap-6 max-w-4xl mx-auto w-full">
        {/* Champions Section */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* WDC Card */}
          {wdcDriver && wdcTeam && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-f1-surface border-l-4 rounded-sm p-4 flex items-center gap-3"
              style={{
                borderLeftColor: wdcTeam.primaryColor,
                boxShadow: isDriverChampion ? '0 0 20px #ffd700' : undefined,
              }}
            >
              <DriverNumberBadge
                number={wdcDriver.number}
                teamColor={wdcTeam.primaryColor}
                size="lg"
              />
              <div className="flex-1 min-w-0">
                <div className="font-pixel text-[8px] text-f1-text/50 mb-1">
                  WORLD DRIVERS CHAMPION
                </div>
                <div className="font-pixel text-xs text-white truncate">{wdcDriver.name}</div>
                <div className="font-pixel text-[8px] text-f1-text/50 mt-0.5 flex items-center gap-1.5">
                  <TeamLogo teamId={wdcTeam.id} size="sm" />
                  {wdcTeam.name}
                </div>
              </div>
              <div
                className="font-pixel text-lg font-bold shrink-0"
                style={{ color: wdcTeam.primaryColor }}
              >
                {wdcChampion.points}
                <span className="text-[8px] text-f1-text/50 ml-1">PTS</span>
              </div>
            </motion.div>
          )}

          {/* WCC Card */}
          {wccTeam && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-f1-surface border-l-4 rounded-sm p-4 flex items-center gap-3"
              style={{
                borderLeftColor: wccTeam.primaryColor,
                boxShadow: isTeamChampion ? '0 0 20px #ffd700' : undefined,
              }}
            >
              <TeamLogo teamId={wccTeam.id} size="lg" />
              <div className="flex-1 min-w-0">
                <div className="font-pixel text-[8px] text-f1-text/50 mb-1">
                  WORLD CONSTRUCTORS CHAMPION
                </div>
                <div className="font-pixel text-xs text-white truncate">{wccTeam.name}</div>
              </div>
              <div
                className="font-pixel text-lg font-bold shrink-0"
                style={{ color: wccTeam.primaryColor }}
              >
                {wccChampion.points}
                <span className="text-[8px] text-f1-text/50 ml-1">PTS</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Your Season Stats */}
        <div className="w-full">
          <h2 className="font-pixel text-[10px] text-f1-text/50 mb-3 text-center">YOUR SEASON</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="bg-f1-surface rounded-sm p-3 text-center"
              >
                <div
                  className="font-pixel text-[16px] sm:text-[20px] font-bold"
                  style={{ color: playerTeam?.primaryColor ?? '#47c7fc' }}
                >
                  {stat.value}
                </div>
                <div className="font-pixel text-[8px] sm:text-[9px] text-f1-text/50 mt-1">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Final Standings */}
        <div className="w-full">
          <h2 className="font-pixel text-[10px] text-f1-text/50 mb-3 text-center">
            FINAL STANDINGS
          </h2>

          {/* Desktop: side by side */}
          <div className="hidden sm:grid sm:grid-cols-2 gap-4">
            <div>
              <div className="font-pixel text-[9px] text-f1-accent mb-2">DRIVERS</div>
              <BroadcastTimingTower
                entries={driverEntries}
                drivers={drivers}
                teams={teams}
                playerDriverId={selectedDriverId ?? ''}
                layoutId="season-end-drivers"
              />
            </div>
            <div>
              <div className="font-pixel text-[9px] text-f1-accent mb-2">CONSTRUCTORS</div>
              <BroadcastTimingTower
                entries={constructorEntries}
                drivers={drivers}
                teams={teams}
                playerDriverId={selectedDriverId ?? ''}
                layoutId="season-end-constructors"
              />
            </div>
          </div>

          {/* Mobile: tabs */}
          <div className="sm:hidden">
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setStandingsTab('drivers')}
                className={`flex-1 font-pixel text-[9px] py-2 rounded-sm border transition-colors ${
                  standingsTab === 'drivers'
                    ? 'bg-f1-surface border-f1-accent text-f1-accent'
                    : 'bg-f1-bg border-f1-border text-f1-text/50'
                }`}
              >
                DRIVERS
              </button>
              <button
                onClick={() => setStandingsTab('constructors')}
                className={`flex-1 font-pixel text-[9px] py-2 rounded-sm border transition-colors ${
                  standingsTab === 'constructors'
                    ? 'bg-f1-surface border-f1-accent text-f1-accent'
                    : 'bg-f1-bg border-f1-border text-f1-text/50'
                }`}
              >
                CONSTRUCTORS
              </button>
            </div>
            {standingsTab === 'drivers' ? (
              <BroadcastTimingTower
                entries={driverEntries}
                drivers={drivers}
                teams={teams}
                playerDriverId={selectedDriverId ?? ''}
                layoutId="season-end-drivers-mobile"
              />
            ) : (
              <BroadcastTimingTower
                entries={constructorEntries}
                drivers={drivers}
                teams={teams}
                playerDriverId={selectedDriverId ?? ''}
                layoutId="season-end-constructors-mobile"
              />
            )}
          </div>
        </div>
      </div>

      {/* Sticky bottom button */}
      <div className="sticky bottom-0 bg-f1-bg/90 backdrop-blur-sm border-t border-f1-border px-4 py-3 flex justify-center">
        <button
          onClick={handleNewSeason}
          className="font-pixel text-xs px-8 py-3 rounded-sm font-bold transition-colors"
          style={{
            backgroundColor: playerTeam?.primaryColor ?? '#47c7fc',
            color: '#ffffff',
          }}
        >
          START NEW SEASON
        </button>
      </div>
    </div>
  )
}
