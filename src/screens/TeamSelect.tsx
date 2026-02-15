import { teams } from '../data/teams'
import { drivers } from '../data/drivers'
import { tracks } from '../data/tracks'
import { useWeekendStore } from '../stores/weekendStore'
import { useSeasonStore } from '../stores/seasonStore'
import { PixelButton } from '../components/PixelButton'
import { getBestForTeam } from '../utils/storage'

export function TeamSelect() {
  const { selectedTeamId, selectedDriverId, selectTeam, setPhase } = useWeekendStore()

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
    <div className="min-h-screen bg-f1-bg px-4 py-8 flex flex-col items-center">
      <h1 className="font-pixel text-2xl text-f1-accent mb-2 text-center">F1 THE GAME</h1>
      <p className="font-pixel text-[10px] text-f1-text/60 mb-8 text-center">SELECT YOUR TEAM</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-5xl mb-8">
        {teams.map((team) => {
          const teamDrivers = drivers.filter((d) => d.teamId === team.id)
          const isSelected = selectedTeamId === team.id

          return (
            <div
              key={team.id}
              className={`bg-slate-800/60 border-2 rounded-sm p-4 transition-colors ${
                isSelected
                  ? 'border-f1-accent bg-slate-700/60'
                  : 'border-f1-border hover:border-f1-border/80'
              }`}
              style={{
                borderLeftWidth: '4px',
                borderLeftColor: isSelected ? team.primaryColor : team.primaryColor,
              }}
            >
              <div className="mb-3">
                <div className="font-pixel text-[11px] text-f1-text font-bold">{team.name}</div>
                <div className="font-pixel text-[9px] text-f1-text/40 mt-0.5">{team.engine}</div>
              </div>

              <div className="flex flex-col gap-1.5 mb-3">
                {teamDrivers.map((driver) => {
                  const isDriverSelected =
                    selectedTeamId === team.id && selectedDriverId === driver.id

                  return (
                    <button
                      key={driver.id}
                      onClick={() => handleDriverClick(team.id, driver.id)}
                      className={`w-full text-left px-3 py-2 font-pixel text-[10px] rounded-sm border transition-colors ${
                        isDriverSelected
                          ? 'bg-f1-accent/20 border-f1-accent text-f1-accent'
                          : 'bg-slate-900/40 border-slate-700 text-f1-text/80 hover:bg-slate-700/40 hover:border-slate-600'
                      }`}
                    >
                      {driver.name}
                    </button>
                  )
                })}
              </div>

              <div className="flex flex-col gap-1 font-pixel text-[8px]">
                <StatBar label="SPD" value={team.topSpeed} color={team.primaryColor} />
                <StatBar label="COR" value={team.cornering} color={team.primaryColor} />
                <StatBar label="REL" value={team.reliability} color={team.primaryColor} />
              </div>

              {(() => {
                const best = getBestForTeam(team.id, tracks[0].id)
                if (!best) return null
                return (
                  <div className="mt-2 font-pixel text-[8px] text-f1-accent/70 border-t border-f1-border/30 pt-1.5">
                    BEST: P{best.position} — {best.driverName}
                  </div>
                )
              })()}
            </div>
          )
        })}
      </div>

      <PixelButton
        variant="success"
        disabled={!selectedDriverId}
        onClick={handleStart}
        className="px-8 py-4"
      >
        START SEASON
      </PixelButton>
    </div>
  )
}

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 text-f1-text/40">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-700 rounded-sm overflow-hidden">
        <div
          className="h-full rounded-sm transition-all duration-300"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-6 text-right text-f1-text/50">{value}</span>
    </div>
  )
}
