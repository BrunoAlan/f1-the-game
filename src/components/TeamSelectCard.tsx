import { motion } from 'framer-motion'
import { TeamColorBadge } from './TeamColorBadge'
import { BroadcastStatBar } from './BroadcastStatBar'
import type { Team, Driver } from '../data/types'

interface TeamSelectCardProps {
  team: Team
  drivers: Driver[]
  selectedDriverId: string | null
  isTeamSelected: boolean
  onDriverClick: (teamId: string, driverId: string) => void
}

export function TeamSelectCard({
  team,
  drivers,
  selectedDriverId,
  isTeamSelected,
  onDriverClick,
}: TeamSelectCardProps) {
  return (
    <motion.div
      className="bg-f1-surface border border-f1-border rounded-sm p-3 transition-shadow duration-200"
      style={{
        borderLeftWidth: '4px',
        borderLeftColor: team.primaryColor,
        boxShadow: isTeamSelected
          ? `0 0 16px ${team.primaryColor}33, inset 0 0 8px ${team.primaryColor}11`
          : 'none',
      }}
      whileHover={{ borderColor: `${team.primaryColor}66` }}
    >
      <div className="flex items-center gap-4">
        {/* Zone 1+2: Badge + Team Name */}
        <div className="flex items-center gap-3 min-w-[160px]">
          <TeamColorBadge abbreviation={team.abbreviation} color={team.primaryColor} />
          <div>
            <div className="font-pixel text-[10px] text-f1-text">{team.name}</div>
            <div className="font-pixel text-[7px] text-f1-text/40 mt-0.5">{team.engine}</div>
          </div>
        </div>

        {/* Zone 3: Stats */}
        <div className="flex-1 flex flex-col gap-1 min-w-[140px]">
          <BroadcastStatBar label="SPD" value={team.topSpeed} color={team.primaryColor} />
          <BroadcastStatBar label="COR" value={team.cornering} color={team.primaryColor} />
          <BroadcastStatBar label="REL" value={team.reliability} color={team.primaryColor} />
        </div>

        {/* Zone 4: Driver Selection */}
        <div className="flex flex-col gap-1.5 shrink-0">
          {drivers.map((driver) => {
            const isSelected = isTeamSelected && selectedDriverId === driver.id
            return (
              <button
                key={driver.id}
                onClick={() => onDriverClick(team.id, driver.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-sm font-pixel text-[8px] transition-colors border ${
                  isSelected
                    ? 'border-current bg-current/10'
                    : 'border-f1-border/50 text-f1-text/60 hover:text-f1-text hover:border-f1-border'
                }`}
                style={isSelected ? { color: team.primaryColor } : undefined}
              >
                <span className="text-[10px]">{isSelected ? '\u25CF' : '\u25CB'}</span>
                {driver.name}
              </button>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
