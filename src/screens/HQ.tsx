import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSeasonStore } from '../stores/seasonStore'
import { useWeekendStore } from '../stores/weekendStore'
import { calendar } from '../data/calendar'
import { tracks } from '../data/tracks'
import { rdTree } from '../data/rdTree'
import { teams } from '../data/teams'
import { drivers } from '../data/drivers'
import { COMPONENT_REPLACEMENT_COSTS } from '../engine/seasonEngine'
import { PixelButton } from '../components/PixelButton'
import { BroadcastTimingTower, type TimingEntry } from '../components/BroadcastTimingTower'
import { TrackMiniMap } from '../components/TrackMiniMap'
import { formatMoney } from '../utils/formatMoney'
import type { RDArea, RDBranch, ComponentType, SponsorObjective } from '../data/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatObjective(objective: SponsorObjective): string {
  switch (objective.type) {
    case 'finish-top':
      return `Finish in Top ${objective.position}`
    case 'both-finish':
      return 'Both drivers finish'
    case 'win':
      return 'Win a race'
    case 'qualify-top':
      return `Qualify in Top ${objective.position}`
    case 'score-sprint-points':
      return 'Score Sprint points'
  }
}

const RD_AREA_LABELS: Record<RDArea, string> = {
  motor: 'Motor',
  aero: 'Aero',
  chasis: 'Chassis',
  pitcrew: 'Pit Crew',
}

const COMPONENT_LABELS: Record<ComponentType, string> = {
  engine: 'Engine',
  gearbox: 'Gearbox',
  'energy-recovery': 'Energy Recovery',
}

const CRITICAL_THRESHOLDS: Record<ComponentType, number> = {
  engine: 20,
  gearbox: 15,
  'energy-recovery': 15,
}

function getHealthColor(percent: number): string {
  if (percent > 60) return '#00ff41'
  if (percent > 30) return '#ffd700'
  return '#ff2a6d'
}

type TabId = 'rd' | 'components' | 'sponsors' | 'standings' | 'next-race'

const TABS: { id: TabId; label: string }[] = [
  { id: 'rd', label: 'R&D' },
  { id: 'components', label: 'COMP' },
  { id: 'sponsors', label: 'SPON' },
  { id: 'standings', label: 'STAND' },
  { id: 'next-race', label: 'NEXT' },
]

// ---------------------------------------------------------------------------
// Main HQ Component
// ---------------------------------------------------------------------------

export function HQ() {
  const [activeTab, setActiveTab] = useState<TabId>('next-race')

  const currentRaceIndex = useSeasonStore((s) => s.currentRaceIndex)
  const budget = useSeasonStore((s) => s.budget)
  const researchPoints = useSeasonStore((s) => s.researchPoints)
  const selectedTeamId = useWeekendStore((s) => s.selectedTeamId)

  const team = teams.find((t) => t.id === selectedTeamId)
  const race = calendar[currentRaceIndex]
  const track = tracks.find((t) => t.id === race.trackId)

  const teamColor = team?.primaryColor ?? '#47c7fc'

  return (
    <div className="min-h-screen bg-f1-bg flex flex-col">
      {/* Sticky Header Bar */}
      <div
        className="sticky top-0 z-10 bg-f1-surface border-b-2 px-4 py-3"
        style={{ borderBottomColor: teamColor }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          {/* Left: Team badge + name + engine */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: teamColor }} />
            <div className="min-w-0">
              <span className="font-pixel text-[10px] text-f1-text truncate block">
                {team?.name ?? 'Unknown'}
              </span>
              <span className="font-pixel text-[7px] text-f1-text/40">{team?.engine ?? ''}</span>
            </div>
          </div>

          {/* Center: Race counter + track name */}
          <div className="text-center hidden sm:block">
            <span className="font-pixel text-[10px] text-f1-accent">RACE {race.round}/24</span>
            <span className="font-pixel text-[7px] text-f1-text/50 block">
              {track?.circuit ?? race.gpName}
            </span>
          </div>

          {/* Right: Budget + RP */}
          <div className="text-right shrink-0">
            <span className="font-pixel text-[9px] block">
              <span className={budget < 0 ? 'text-f1-danger' : 'text-f1-success'}>
                {formatMoney(budget)}
              </span>
            </span>
            <span className="font-pixel text-[8px] text-f1-text/50">
              RP: <span className="text-f1-accent">{researchPoints}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-f1-surface/80 border-b border-f1-border">
        <div className="max-w-2xl mx-auto flex">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`font-pixel text-[9px] px-4 py-2.5 transition-colors border-b-2 ${
                  isActive
                    ? 'text-f1-text'
                    : 'text-f1-text/40 hover:text-f1-text/60 border-transparent'
                }`}
                style={isActive ? { borderBottomColor: teamColor } : undefined}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 px-4 py-4 pb-20">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'rd' && <RDTab teamColor={teamColor} />}
              {activeTab === 'components' && <ComponentsTab />}
              {activeTab === 'sponsors' && <SponsorsTab />}
              {activeTab === 'standings' && <StandingsTab />}
              {activeTab === 'next-race' && <NextRaceTab teamColor={teamColor} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="sticky bottom-0 z-10 bg-f1-surface border-t border-f1-border px-4 py-3">
        <div className="max-w-2xl mx-auto flex justify-center">
          <StartRaceButton teamColor={teamColor} />
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Start Race Button (bottom bar)
// ---------------------------------------------------------------------------

function StartRaceButton({ teamColor }: { teamColor: string }) {
  const currentRaceIndex = useSeasonStore((s) => s.currentRaceIndex)
  const resetWeekend = useWeekendStore((s) => s.resetWeekend)

  const race = calendar[currentRaceIndex]
  const track = tracks.find((t) => t.id === race.trackId)

  const handleStart = () => {
    if (!track) return
    resetWeekend()
    useWeekendStore.setState({
      currentTrackId: track.id,
      isSprint: track.hasSprint,
      phase: 'practice',
    })
  }

  return (
    <button
      onClick={handleStart}
      className="font-pixel text-[10px] text-white px-6 py-2.5 rounded-sm transition-opacity hover:opacity-90 active:opacity-75"
      style={{ backgroundColor: teamColor }}
    >
      START RACE WEEKEND
    </button>
  )
}

// ---------------------------------------------------------------------------
// Tab 1: R&D
// ---------------------------------------------------------------------------

function RDTab({ teamColor }: { teamColor: string }) {
  const rdUpgrades = useSeasonStore((s) => s.rdUpgrades)
  const budget = useSeasonStore((s) => s.budget)
  const researchPoints = useSeasonStore((s) => s.researchPoints)
  const purchaseBase = useSeasonStore((s) => s.purchaseBaseUpgrade)
  const purchaseBranch = useSeasonStore((s) => s.purchaseBranchUpgrade)

  const areas: RDArea[] = ['motor', 'aero', 'chasis', 'pitcrew']

  return (
    <div className="space-y-6">
      {areas.map((area) => {
        const upgrade = rdUpgrades[area]
        const tree = rdTree[area]
        const baseNode = tree.base
        const branchA = tree.branches[0]
        const branchB = tree.branches[1]

        const baseUnlocked = upgrade.base
        const branchSelected = upgrade.branch

        const canAffordBase =
          !baseUnlocked && budget >= baseNode.costMoney && researchPoints >= baseNode.costRP

        const canAffordBranchA =
          baseUnlocked &&
          branchSelected === null &&
          budget >= branchA.costMoney &&
          researchPoints >= branchA.costRP

        const canAffordBranchB =
          baseUnlocked &&
          branchSelected === null &&
          budget >= branchB.costMoney &&
          researchPoints >= branchB.costRP

        return (
          <div key={area} className="bg-f1-surface border border-f1-border rounded-sm p-3">
            <h3 className="font-pixel text-[11px] text-f1-accent mb-3">{RD_AREA_LABELS[area]}</h3>

            {/* Base upgrade */}
            <div
              className={`border-2 rounded-sm p-2 mb-3 ${
                baseUnlocked
                  ? 'border-f1-success/60 bg-f1-success/5'
                  : canAffordBase
                    ? 'bg-f1-surface/50'
                    : 'border-f1-border bg-f1-surface/30 opacity-50'
              }`}
              style={!baseUnlocked && canAffordBase ? { borderColor: teamColor } : undefined}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-pixel text-[10px] text-f1-text">{baseNode.name}</span>
                {baseUnlocked && (
                  <span className="font-pixel text-[9px] text-f1-success">UNLOCKED</span>
                )}
              </div>
              <p className="font-pixel text-[9px] text-f1-text/50 mb-2">{baseNode.description}</p>
              {!baseUnlocked && (
                <div className="flex items-center justify-between">
                  <span className="font-pixel text-[9px] text-f1-text/40">
                    {baseNode.costRP} RP + {formatMoney(baseNode.costMoney)}
                  </span>
                  <PixelButton
                    onClick={() => purchaseBase(area)}
                    disabled={!canAffordBase}
                    className="px-2! py-1! text-[9px]!"
                  >
                    RESEARCH
                  </PixelButton>
                </div>
              )}
            </div>

            {/* CSS connector line */}
            <div className="flex justify-center mb-3">
              <div className="w-px h-4 bg-f1-border" />
            </div>

            {/* Branch options */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { node: branchA, branch: 'a' as RDBranch, canAfford: canAffordBranchA },
                { node: branchB, branch: 'b' as RDBranch, canAfford: canAffordBranchB },
              ].map(({ node, branch, canAfford }) => {
                const isSelected = branchSelected === branch
                const isOtherSelected = branchSelected !== null && branchSelected !== branch
                const isLocked = !baseUnlocked

                return (
                  <div
                    key={branch}
                    className={`border-2 rounded-sm p-2 ${
                      isSelected
                        ? 'border-f1-success/60 bg-f1-success/5'
                        : isLocked || isOtherSelected
                          ? 'border-f1-border/30 bg-f1-surface/20 opacity-50'
                          : canAfford
                            ? 'bg-f1-surface/50'
                            : 'border-f1-border bg-f1-surface/30'
                    }`}
                    style={
                      !isSelected && !isLocked && !isOtherSelected && canAfford
                        ? { borderColor: teamColor }
                        : undefined
                    }
                  >
                    <span className="font-pixel text-[10px] text-f1-text block mb-1">
                      {node.name}
                    </span>
                    <p className="font-pixel text-[9px] text-f1-text/50 mb-2">{node.description}</p>
                    {isSelected && (
                      <span className="font-pixel text-[9px] text-f1-success">SELECTED</span>
                    )}
                    {!isSelected && !isOtherSelected && !isLocked && (
                      <div className="flex items-center justify-between">
                        <span className="font-pixel text-[9px] text-f1-text/40">
                          {node.costRP} RP + {formatMoney(node.costMoney)}
                        </span>
                        <PixelButton
                          onClick={() => purchaseBranch(area, branch)}
                          disabled={!canAfford}
                          className="px-2! py-1! text-[9px]!"
                        >
                          RESEARCH
                        </PixelButton>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab 2: Components
// ---------------------------------------------------------------------------

function ComponentsTab() {
  const components = useSeasonStore((s) => s.components)
  const budget = useSeasonStore((s) => s.budget)
  const replaceComponent = useSeasonStore((s) => s.replaceComponentAction)

  return (
    <div className="space-y-4">
      {components.map((comp) => {
        const cost = COMPONENT_REPLACEMENT_COSTS[comp.type]
        const canAfford = budget >= cost
        const threshold = CRITICAL_THRESHOLDS[comp.type]
        const isCritical = comp.healthPercent < threshold
        const isLow = comp.healthPercent < 30

        return (
          <div
            key={comp.type}
            className={`bg-f1-surface border rounded-sm p-3 ${
              isCritical ? 'border-f1-danger/60' : 'border-f1-border'
            } ${isLow ? 'animate-pulse-border' : ''}`}
            style={
              isLow
                ? {
                    animation: 'pulse-border 2s ease-in-out infinite',
                    borderColor: '#ff2a6d',
                  }
                : undefined
            }
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-pixel text-[11px] text-f1-text">
                {COMPONENT_LABELS[comp.type]}
              </span>
              <span
                className={`font-pixel text-[10px] ${
                  isCritical ? 'text-f1-danger' : 'text-f1-text/70'
                }`}
              >
                {Math.round(comp.healthPercent)}%
              </span>
            </div>

            {/* Health bar */}
            <div className="w-full h-3 bg-f1-bg border border-f1-border rounded-sm overflow-hidden mb-2">
              <div
                className="h-full transition-all"
                style={{
                  width: `${comp.healthPercent}%`,
                  backgroundColor: getHealthColor(comp.healthPercent),
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="font-pixel text-[9px] text-f1-text/40">
                Races used: {comp.racesUsed}
              </span>
              <PixelButton
                variant="warning"
                onClick={() => replaceComponent(comp.type)}
                disabled={!canAfford}
                className="px-2! py-1! text-[9px]!"
              >
                REPLACE — {formatMoney(cost)}
              </PixelButton>
            </div>

            {isCritical && (
              <p className="font-pixel text-[9px] text-f1-danger mt-2">
                WARNING: Below critical threshold ({threshold}%) — high DNF risk!
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab 3: Sponsors
// ---------------------------------------------------------------------------

function SponsorsTab() {
  const activeSponsors = useSeasonStore((s) => s.activeSponsors)
  const availableSponsors = useSeasonStore((s) => s.availableSponsors)
  const signSponsor = useSeasonStore((s) => s.signSponsor)
  const dropSponsor = useSeasonStore((s) => s.dropSponsor)

  const atMax = activeSponsors.length >= 3

  return (
    <div className="space-y-6">
      {/* Active Sponsors */}
      <div>
        <h3 className="font-pixel text-[11px] text-f1-accent mb-3">
          ACTIVE SPONSORS ({activeSponsors.length}/3)
        </h3>
        {activeSponsors.length === 0 && (
          <p className="font-pixel text-[9px] text-f1-text/30">No active sponsors</p>
        )}
        <div className="space-y-2">
          {activeSponsors.map((sponsor) => (
            <div
              key={sponsor.id}
              className="bg-f1-surface border border-f1-success/30 rounded-sm p-2 flex items-center justify-between"
            >
              <div>
                <span className="font-pixel text-[10px] text-f1-text block">{sponsor.name}</span>
                <span className="font-pixel text-[9px] text-f1-text/50">
                  {formatObjective(sponsor.objective)}
                </span>
                <div className="flex gap-3 mt-1">
                  <span className="font-pixel text-[9px] text-f1-warning">
                    {formatMoney(sponsor.payout)}/race
                  </span>
                  <span className="font-pixel text-[9px] text-f1-text/40">
                    {sponsor.racesRemaining} races left
                  </span>
                </div>
              </div>
              <PixelButton
                variant="danger"
                onClick={() => dropSponsor(sponsor.id)}
                className="px-2! py-1! text-[9px]!"
              >
                DROP
              </PixelButton>
            </div>
          ))}
        </div>
      </div>

      {/* Available Sponsors */}
      <div>
        <h3 className="font-pixel text-[11px] text-f1-accent mb-3">AVAILABLE SPONSORS</h3>
        {availableSponsors.length === 0 && (
          <p className="font-pixel text-[9px] text-f1-text/30">No sponsors available</p>
        )}
        <div className="space-y-2">
          {availableSponsors.map((sponsor) => (
            <div
              key={sponsor.id}
              className="bg-f1-surface border border-f1-border rounded-sm p-2 flex items-center justify-between"
            >
              <div>
                <span className="font-pixel text-[10px] text-f1-text block">{sponsor.name}</span>
                <span className="font-pixel text-[9px] text-f1-text/50">
                  {formatObjective(sponsor.objective)}
                </span>
                <div className="flex gap-3 mt-1">
                  <span className="font-pixel text-[9px] text-f1-warning">
                    {formatMoney(sponsor.payout)}/race
                  </span>
                  <span className="font-pixel text-[9px] text-f1-text/40">
                    {sponsor.duration} races
                  </span>
                </div>
              </div>
              <PixelButton
                onClick={() => signSponsor(sponsor.id)}
                disabled={atMax}
                className="px-2! py-1! text-[9px]!"
              >
                SIGN
              </PixelButton>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab 4: Standings
// ---------------------------------------------------------------------------

function StandingsTab() {
  const [view, setView] = useState<'drivers' | 'constructors'>('drivers')

  const selectedDriverId = useWeekendStore((s) => s.selectedDriverId)
  const driverStandings = useSeasonStore((s) => s.driverStandings)
  const teamStandings = useSeasonStore((s) => s.teamStandings)

  const sortedDrivers = [...driverStandings].sort((a, b) => b.points - a.points)
  const sortedTeams = [...teamStandings].sort((a, b) => b.points - a.points)

  // Build driver timing entries
  const driverEntries: TimingEntry[] = sortedDrivers.map((ds, i) => {
    const driver = drivers.find((d) => d.id === ds.driverId)
    return {
      driverId: ds.driverId,
      teamId: driver?.teamId ?? '',
      position: i + 1,
      value: `${ds.points} pts`,
    }
  })

  // Build constructor timing entries (use the team's first driver as driverId for the component key)
  const constructorEntries: TimingEntry[] = sortedTeams.map((ts, i) => {
    const teamDrivers = drivers.filter((d) => d.teamId === ts.teamId)
    const firstDriver = teamDrivers[0]
    return {
      driverId: firstDriver?.id ?? ts.teamId,
      teamId: ts.teamId,
      position: i + 1,
      value: `${ts.points} pts`,
    }
  })

  return (
    <div>
      {/* Toggle buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setView('drivers')}
          className={`font-pixel text-[10px] px-3 py-1 border rounded-sm transition-colors ${
            view === 'drivers'
              ? 'border-f1-accent text-f1-accent bg-f1-accent/10'
              : 'border-f1-border text-f1-text/30'
          }`}
        >
          DRIVERS
        </button>
        <button
          onClick={() => setView('constructors')}
          className={`font-pixel text-[10px] px-3 py-1 border rounded-sm transition-colors ${
            view === 'constructors'
              ? 'border-f1-accent text-f1-accent bg-f1-accent/10'
              : 'border-f1-border text-f1-text/30'
          }`}
        >
          CONSTRUCTORS
        </button>
      </div>

      {view === 'drivers' ? (
        <BroadcastTimingTower
          entries={driverEntries}
          drivers={drivers}
          teams={teams}
          playerDriverId={selectedDriverId ?? ''}
          layoutId="hq-driver-standings"
        />
      ) : (
        <BroadcastTimingTower
          entries={constructorEntries}
          drivers={drivers}
          teams={teams}
          playerDriverId={selectedDriverId ?? ''}
          layoutId="hq-constructor-standings"
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab 5: Next Race
// ---------------------------------------------------------------------------

function NextRaceTab({ teamColor }: { teamColor: string }) {
  const currentRaceIndex = useSeasonStore((s) => s.currentRaceIndex)

  const race = calendar[currentRaceIndex]
  const track = tracks.find((t) => t.id === race.trackId)

  if (!track) {
    return <p className="font-pixel text-[10px] text-f1-danger">Track not found for this race.</p>
  }

  const typeLabel: Record<string, string> = {
    street: 'STREET',
    'high-speed': 'HIGH-SPEED',
    technical: 'TECHNICAL',
    balanced: 'BALANCED',
  }

  const typeBadgeColor: Record<string, string> = {
    street: 'text-f1-warning border-f1-warning/40',
    'high-speed': 'text-f1-danger border-f1-danger/40',
    technical: 'text-f1-accent border-f1-accent/40',
    balanced: 'text-f1-success border-f1-success/40',
  }

  return (
    <div className="space-y-4">
      {/* Round badge + GP name */}
      <div className="text-center">
        <span className="font-pixel text-[9px] text-f1-text/40 border border-f1-border rounded-sm px-2 py-0.5 inline-block mb-2">
          ROUND {race.round}
        </span>
        <h2 className="font-pixel text-lg text-f1-text">{race.gpName}</h2>
        <p className="font-pixel text-[10px] text-f1-text/50 mt-1">
          {track.circuit} — {track.country}
        </p>
      </div>

      {/* Track Mini Map */}
      <div
        className="border border-f1-border rounded-sm p-4 bg-f1-surface flex items-center justify-center"
        style={{ minHeight: 180 }}
      >
        <TrackMiniMap
          trackId={track.id}
          cars={[]}
          teams={teams}
          playerDriverId=""
          className="max-h-40"
        />
      </div>

      {/* Track stats */}
      <div className="bg-f1-surface border border-f1-border rounded-sm p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-pixel text-[9px] text-f1-text/50">LAPS</span>
          <span className="font-pixel text-[10px] text-f1-text">{track.totalLaps}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-pixel text-[9px] text-f1-text/50">TYPE</span>
          <span
            className={`font-pixel text-[9px] border rounded-sm px-2 py-0.5 ${typeBadgeColor[track.type]}`}
          >
            {typeLabel[track.type]}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-pixel text-[9px] text-f1-text/50">TIRE WEAR</span>
          <span className="font-pixel text-[10px] text-f1-text">{track.tireWear.toFixed(2)}x</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-pixel text-[9px] text-f1-text/50">OVERTAKING</span>
          <span className="font-pixel text-[10px] text-f1-text">
            {track.overtakingDifficulty}/100
          </span>
        </div>
        {track.hasSprint && (
          <div className="flex items-center justify-between">
            <span className="font-pixel text-[9px] text-f1-text/50">FORMAT</span>
            <span
              className="font-pixel text-[9px] border rounded-sm px-2 py-0.5"
              style={{ color: teamColor, borderColor: `${teamColor}66` }}
            >
              SPRINT WEEKEND
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
