import { AnimatePresence, motion } from 'framer-motion'
import type { CarState } from '../engine/raceSimulator'
import type { Driver, Team } from '../data/types'

interface LeaderboardProps {
  cars: CarState[]
  drivers: Driver[]
  teams: Team[]
  playerDriverId: string
}

export function Leaderboard({ cars, drivers, teams, playerDriverId }: LeaderboardProps) {
  const driverMap = new Map(drivers.map((d) => [d.id, d]))
  const teamMap = new Map(teams.map((t) => [t.id, t]))

  const activeCars = cars.filter((c) => !c.dnf).sort((a, b) => a.cumulativeTime - b.cumulativeTime)

  const dnfCars = cars.filter((c) => c.dnf)

  const leaderTime = activeCars.length > 0 ? activeCars[0].cumulativeTime : 0

  function formatGap(car: CarState, index: number): string {
    if (index === 0) return 'LEADER'
    const gap = car.cumulativeTime - leaderTime
    return `+${gap.toFixed(1)}s`
  }

  return (
    <div className="flex flex-col gap-0.5 font-pixel text-[10px]">
      <AnimatePresence mode="popLayout">
        {activeCars.map((car, index) => {
          const driver = driverMap.get(car.driverId)
          const team = teamMap.get(car.teamId)
          if (!driver || !team) return null

          const isPlayer = car.driverId === playerDriverId

          return (
            <motion.div
              key={car.driverId}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-sm ${
                isPlayer ? 'bg-slate-700/80 border-l-2' : 'bg-slate-800/40'
              }`}
              style={isPlayer ? { borderLeftColor: team.primaryColor } : undefined}
            >
              <span className="w-6 text-right text-f1-text/50">{index + 1}</span>
              <div
                className="w-1 h-4 rounded-sm shrink-0"
                style={{ backgroundColor: team.primaryColor }}
              />
              <span className={`w-10 ${isPlayer ? 'text-f1-accent' : 'text-f1-text'}`}>
                {driver.shortName}
              </span>
              <span className="flex-1 text-f1-text/50 truncate">{team.name}</span>
              <span className="text-f1-text/70 w-20 text-right">{formatGap(car, index)}</span>
            </motion.div>
          )
        })}

        {dnfCars.map((car) => {
          const driver = driverMap.get(car.driverId)
          const team = teamMap.get(car.teamId)
          if (!driver || !team) return null

          return (
            <motion.div
              key={car.driverId}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 px-2 py-1.5 rounded-sm bg-slate-800/20"
            >
              <span className="w-6 text-right text-f1-text/30">--</span>
              <div
                className="w-1 h-4 rounded-sm shrink-0 opacity-30"
                style={{ backgroundColor: team.primaryColor }}
              />
              <span className="w-10 text-f1-text/30 line-through">{driver.shortName}</span>
              <span className="flex-1 text-f1-text/20 truncate">{team.name}</span>
              <span className="text-f1-danger/60 w-20 text-right font-bold">DNF</span>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
