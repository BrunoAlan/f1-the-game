import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import type { Driver, Team } from '../data/types'
import type { TireCompound } from '../data/types'
import { DriverNumberBadge } from './DriverNumberBadge'
import { StatusBadge } from './StatusBadge'
import { TireCompoundIcon } from './TireCompoundIcon'

export interface TimingEntry {
  driverId: string
  teamId: string
  position: number
  // Time/points display
  value: string // formatted gap, time, or points
  // Optional status
  status?: 'pit' | 'dnf' | 'fastest-lap' | 'safety-car' | 'eliminated'
  // Position change (positive = gained, negative = lost)
  positionChange?: number
  // Tire compound (shown after pit stop)
  tireCompound?: TireCompound
  // Whether this entry is inactive (DNF, eliminated)
  inactive?: boolean
}

interface BroadcastTimingTowerProps {
  entries: TimingEntry[]
  drivers: Driver[]
  teams: Team[]
  playerDriverId: string
  /** Layout group ID for Framer Motion (unique per instance) */
  layoutId?: string
}

export function BroadcastTimingTower({
  entries,
  drivers,
  teams,
  playerDriverId,
  layoutId = 'timing-tower',
}: BroadcastTimingTowerProps) {
  const driverMap = new Map(drivers.map((d) => [d.id, d]))
  const teamMap = new Map(teams.map((t) => [t.id, t]))

  return (
    <LayoutGroup id={layoutId}>
      <div className="flex flex-col gap-px font-pixel text-[9px]">
        <AnimatePresence mode="popLayout">
          {entries.map((entry) => {
            const driver = driverMap.get(entry.driverId)
            const team = teamMap.get(entry.teamId)
            if (!driver || !team) return null

            const isPlayer = entry.driverId === playerDriverId

            return (
              <motion.div
                key={entry.driverId}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: entry.inactive ? 0.4 : 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className={`flex items-center gap-1.5 px-2 py-1.5 border-l-[3px] ${
                  isPlayer ? 'bg-f1-surface' : entry.inactive ? 'bg-f1-bg/50' : 'bg-f1-surface/60'
                }`}
                style={{
                  borderLeftColor: team.primaryColor,
                  boxShadow: isPlayer
                    ? `inset 0 0 20px ${team.primaryColor}15, 0 0 8px ${team.primaryColor}10`
                    : undefined,
                }}
              >
                {/* Position */}
                <span
                  className="w-5 h-5 flex items-center justify-center rounded-sm text-[8px] font-bold shrink-0"
                  style={{
                    backgroundColor: `${team.primaryColor}30`,
                    color: entry.inactive ? '#ffffff50' : '#ffffff',
                  }}
                >
                  {entry.inactive && entry.status === 'dnf' ? '--' : entry.position}
                </span>

                {/* Driver number */}
                <DriverNumberBadge number={driver.number} teamColor={team.primaryColor} size="sm" />

                {/* Driver name + team */}
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <span className={`${isPlayer ? 'text-white' : 'text-f1-text'} truncate`}>
                    {driver.shortName}
                  </span>
                  <span className="text-f1-text/30 text-[7px] truncate hidden sm:inline">
                    {team.abbreviation}
                  </span>
                </div>

                {/* Tire compound (if provided) */}
                {entry.tireCompound && !entry.inactive && (
                  <TireCompoundIcon compound={entry.tireCompound} size="sm" />
                )}

                {/* Time/gap/points */}
                <span className="text-f1-text/70 w-[72px] text-right tabular-nums shrink-0">
                  {entry.value}
                </span>

                {/* Status badges */}
                <div className="w-10 flex justify-end shrink-0">
                  {entry.status && <StatusBadge type={entry.status} />}
                  {!entry.status && entry.positionChange && entry.positionChange > 0 && (
                    <StatusBadge type="position-up" value={entry.positionChange} />
                  )}
                  {!entry.status && entry.positionChange && entry.positionChange < 0 && (
                    <StatusBadge type="position-down" value={Math.abs(entry.positionChange)} />
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  )
}
