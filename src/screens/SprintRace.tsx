import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWeekendStore } from '../stores/weekendStore'
import { useRaceStore } from '../stores/raceStore'
import { useSeasonStore } from '../stores/seasonStore'
import { createInitialRaceState } from '../engine/raceSimulator'
import type { DriverMode } from '../engine/raceSimulator'
import type { TireCompound } from '../data/types'
import { teams } from '../data/teams'
import { drivers } from '../data/drivers'
import { tracks } from '../data/tracks'
import { useRaceLoop } from '../hooks/useRaceLoop'
import { useRadioMessages } from '../hooks/useRadioMessages'
import { BroadcastTimingTower, type TimingEntry } from '../components/BroadcastTimingTower'
import { TrackMiniMap, type CarDot } from '../components/TrackMiniMap'
import { TireIndicator } from '../components/TireIndicator'
import { FuelIndicator } from '../components/FuelIndicator'
import { WeatherBadge } from '../components/WeatherBadge'
import { LapCounter } from '../components/LapCounter'
import { RadioAlert } from '../components/RadioAlert'
import { SafetyCarBanner } from '../components/SafetyCarBanner'
import { PixelButton } from '../components/PixelButton'
import { formatGap } from '../utils/formatTime'
import {
  calculateSprintPoints,
  calculateSprintPrizeMoney,
  checkSponsorObjective,
  applyComponentWear,
  calculateRP,
  getComponentDNFChance,
  getModifiedTeamStats,
} from '../engine/seasonEngine'

const PIT_COMPOUNDS: TireCompound[] = ['soft', 'medium', 'hard']

export function SprintRace() {
  const { sprintGrid, selectedDriverId, weather } = useWeekendStore()
  const currentTrackId = useWeekendStore((s) => s.currentTrackId)
  const { raceState, isRunning, setRaceState, setRunning, setPlayerMode } = useRaceStore()
  const callPitStop = useRaceStore((s) => s.callPitStop)

  const [showPitMenu, setShowPitMenu] = useState(false)

  // Track starting positions for position change indicators
  const startPositionsRef = useRef<Map<string, number>>(new Map())

  // Initialize sprint race state on mount
  useEffect(() => {
    if (raceState) return

    const track = tracks.find((t) => t.id === currentTrackId) ?? tracks[0]
    const playerDriverId = selectedDriverId ?? drivers[0].id
    const sprintLaps = Math.round(track.totalLaps / 3)

    const grid =
      sprintGrid.length > 0
        ? sprintGrid.map((g) => ({
            driverId: g.driverId,
            position: g.position,
          }))
        : drivers.map((d, i) => ({ driverId: d.id, position: i + 1 }))

    // Store starting positions
    const startMap = new Map<string, number>()
    for (const g of grid) {
      startMap.set(g.driverId, g.position)
    }
    startPositionsRef.current = startMap

    // Apply R&D-modified team stats
    const rdUpgrades = useSeasonStore.getState().rdUpgrades
    const selectedTeamId = useWeekendStore.getState().selectedTeamId
    const modifiedTeams = teams.map((team) => {
      if (team.id === selectedTeamId) {
        const mods = getModifiedTeamStats(team, rdUpgrades)
        return { ...team, topSpeed: mods.topSpeed, cornering: mods.cornering }
      }
      return team
    })

    // Component DNF chance for player team
    const components = useSeasonStore.getState().components
    const extraDNFChance = getComponentDNFChance(components)

    const initial = createInitialRaceState({
      teams: modifiedTeams,
      drivers,
      track,
      grid,
      weather,
      playerDriverId,
      extraDNFChance,
    })

    // Override total laps for sprint
    initial.totalLaps = sprintLaps

    // Set tire compounds — no mandatory pit stop for sprint
    // Everyone starts on medium by default
    initial.cars = initial.cars.map((car) => {
      const compound: TireCompound = car.position <= 10 ? 'soft' : 'medium'
      return {
        ...car,
        tireCompound: compound,
        compoundsUsed: [compound],
      }
    })

    setRaceState(initial)
    setRunning(true)
  }, [raceState, sprintGrid, selectedDriverId, weather, setRaceState, setRunning, currentTrackId])

  // Drive the simulation
  useRaceLoop()

  // Radio messages
  const { currentMessage, dismissMessage } = useRadioMessages(raceState)

  // Determine if the race is finished
  const raceFinished =
    raceState !== null && raceState.currentLap >= raceState.totalLaps && !isRunning

  // Position changes for results screen
  const positionChanges = useMemo(() => {
    if (!raceState || !raceFinished) return new Map<string, number>()
    const changes = new Map<string, number>()
    for (const car of raceState.cars) {
      const gridEntry = sprintGrid.find((g) => g.driverId === car.driverId)
      const startPos = gridEntry?.position ?? 20
      const change = startPos - car.position
      changes.set(car.driverId, change)
    }
    return changes
  }, [raceState, raceFinished, sprintGrid])

  // Find the player car
  const playerCar = useMemo(() => {
    if (!raceState) return null
    return raceState.cars.find((c) => c.driverId === raceState.playerDriverId) ?? null
  }, [raceState])

  // Grip calculation for player
  const gripPercent = useMemo(() => {
    if (!playerCar) return 100
    return Math.max(0, 1 - playerCar.lapsOnTire * 0.03) * 100
  }, [playerCar])

  // Fastest lap driver
  const fastestLapDriverId = useMemo(() => {
    if (!raceState) return null
    let fastest = Infinity
    let fastestId: string | null = null
    for (const car of raceState.cars) {
      if (!car.dnf && car.lastLapTime > 0 && car.lastLapTime < fastest) {
        fastest = car.lastLapTime
        fastestId = car.driverId
      }
    }
    return fastestId
  }, [raceState])

  // Build BroadcastTimingTower entries
  const timingEntries: TimingEntry[] = useMemo(() => {
    if (!raceState) return []

    const sorted = [...raceState.cars].sort((a, b) => {
      if (a.dnf && !b.dnf) return 1
      if (!a.dnf && b.dnf) return -1
      if (a.dnf && b.dnf) return 0
      return a.cumulativeTime - b.cumulativeTime
    })

    const leaderTime = sorted.find((c) => !c.dnf)?.cumulativeTime ?? 0

    return sorted.map((car, index) => {
      const startPos = startPositionsRef.current.get(car.driverId) ?? index + 1
      const positionChange = startPos - (index + 1)

      let status: TimingEntry['status'] = undefined
      if (car.dnf) status = 'dnf'
      else if (car.pitting || car.pitThisLap) status = 'pit'
      else if (car.driverId === fastestLapDriverId) status = 'fastest-lap'

      const gap = car.dnf ? 'DNF' : formatGap(car.cumulativeTime - leaderTime)

      return {
        driverId: car.driverId,
        teamId: car.teamId,
        position: index + 1,
        value: gap,
        status,
        positionChange,
        tireCompound: car.tireCompound,
        inactive: car.dnf,
      }
    })
  }, [raceState, fastestLapDriverId])

  // Build TrackMiniMap car dots
  const carDots: CarDot[] = useMemo(() => {
    if (!raceState) return []
    return raceState.cars.map((car) => ({
      driverId: car.driverId,
      teamId: car.teamId,
      progress:
        raceState.totalLaps > 0
          ? ((raceState.currentLap - 1 + (car.cumulativeTime > 0 ? 0.5 : 0)) / raceState.totalLaps +
              (1 - car.position / raceState.cars.length) * 0.05) %
            1
          : 0,
      dnf: car.dnf,
    }))
  }, [raceState])

  const handleModeChange = useCallback(
    (mode: DriverMode) => {
      setPlayerMode(mode)
    },
    [setPlayerMode],
  )

  const handlePitStop = useCallback(
    (compound: TireCompound) => {
      callPitStop(compound)
      setShowPitMenu(false)
    },
    [callPitStop],
  )

  const handleContinueToStrategy = useCallback(() => {
    const seasonState = useSeasonStore.getState()
    const currentRaceState = useRaceStore.getState().raceState
    if (!currentRaceState) return

    // Calculate results for all drivers
    const finalPositions = [...currentRaceState.cars]
      .filter((c) => !c.dnf)
      .sort((a, b) => a.cumulativeTime - b.cumulativeTime)

    const driverPositions = currentRaceState.cars.map((car) => {
      const pos = finalPositions.findIndex((c) => c.driverId === car.driverId)
      return {
        driverId: car.driverId,
        position: car.dnf ? 0 : pos + 1,
        dnf: car.dnf,
      }
    })

    // Sprint points for all drivers
    const pointsPerDriver = driverPositions.map((dp) => ({
      driverId: dp.driverId,
      points: dp.dnf ? 0 : calculateSprintPoints(dp.position),
    }))

    // Player team prize money (sprint prize scale)
    const selectedTeamId = useWeekendStore.getState().selectedTeamId
    const playerTeamDrivers = driverPositions.filter((dp) => {
      const d = drivers.find((dr) => dr.id === dp.driverId)
      return d?.teamId === selectedTeamId
    })
    const bestPlayerFinish = Math.min(
      ...playerTeamDrivers.filter((d) => !d.dnf).map((d) => d.position),
      99,
    )
    const prizeMoney = calculateSprintPrizeMoney(bestPlayerFinish)

    // Check sponsors (sprint-specific)
    const bothFinished = playerTeamDrivers.every((d) => !d.dnf)
    const scoredSprintPoints = pointsPerDriver.some(
      (pp) => pp.points > 0 && drivers.find((d) => d.id === pp.driverId)?.teamId === selectedTeamId,
    )

    let sponsorPayouts = 0
    for (const sponsor of seasonState.activeSponsors) {
      if (
        checkSponsorObjective(sponsor, {
          bestFinish: bestPlayerFinish,
          bothFinished,
          scoredSprintPoints,
        })
      ) {
        sponsorPayouts += sponsor.payout
      }
    }

    // RP from practice data
    const practiceData = useWeekendStore.getState().practiceData
    const rp = calculateRP(bestPlayerFinish, practiceData.dataCollected)

    // Apply component wear (sprint level - lighter)
    const newComponents = applyComponentWear(seasonState.components, 'sprint')
    useSeasonStore.getState().setComponents(newComponents)

    // Add sprint results to season
    useSeasonStore.getState().addRaceResults({
      driverPositions,
      prizeMoney,
      sponsorPayouts,
      rp,
      pointsPerDriver,
    })

    // Clean up race state and move to strategy for main race
    useRaceStore.getState().reset()
    useWeekendStore.getState().setPhase('strategy')
  }, [])

  if (!raceState) {
    return (
      <div className="min-h-screen bg-f1-bg flex items-center justify-center">
        <p className="font-pixel text-f1-warning text-sm animate-pulse">
          INITIALIZING SPRINT RACE...
        </p>
      </div>
    )
  }

  // -- Results Mode --
  if (raceFinished) {
    const finalStandings = [...raceState.cars]
      .filter((c) => !c.dnf)
      .sort((a, b) => a.cumulativeTime - b.cumulativeTime)
    const dnfCars = raceState.cars.filter((c) => c.dnf)
    const driverMap = new Map(drivers.map((d) => [d.id, d]))
    const teamMap = new Map(teams.map((t) => [t.id, t]))

    return (
      <div className="min-h-screen bg-f1-bg px-4 py-8 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="text-center mb-8"
        >
          <span className="bg-f1-warning text-black font-pixel text-[7px] px-1.5 py-0.5 rounded-sm">
            SPRINT
          </span>
          <h1 className="font-pixel text-2xl text-f1-warning mt-2 mb-2">SPRINT RACE COMPLETE</h1>
          <p className="font-pixel text-[10px] text-f1-text/50">
            {raceState.track.name} -- {raceState.totalLaps} LAPS
          </p>
        </motion.div>

        <div className="w-full max-w-2xl flex flex-col gap-1 mb-8">
          {finalStandings.map((car, index) => {
            const driver = driverMap.get(car.driverId)
            const team = teamMap.get(car.teamId)
            if (!driver || !team) return null
            const isPlayer = car.driverId === raceState.playerDriverId
            const change = positionChanges.get(car.driverId) ?? 0
            const sprintPts = calculateSprintPoints(index + 1)

            return (
              <motion.div
                key={car.driverId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-2 px-3 py-2 rounded-sm font-pixel text-[10px] ${
                  isPlayer ? 'bg-f1-surface border-l-2' : 'bg-f1-surface/40'
                }`}
                style={isPlayer ? { borderLeftColor: team.primaryColor } : undefined}
              >
                <span className="w-6 text-right text-f1-warning font-bold">P{index + 1}</span>
                <div
                  className="w-1 h-4 rounded-sm shrink-0"
                  style={{ backgroundColor: team.primaryColor }}
                />
                <span className={`w-10 ${isPlayer ? 'text-f1-warning' : 'text-f1-text'}`}>
                  {driver.shortName}
                </span>
                <span className="flex-1 text-f1-text/50 truncate">{team.name}</span>
                {sprintPts > 0 && (
                  <span className="text-f1-warning/80 w-10 text-right">+{sprintPts}pts</span>
                )}
                <span
                  className={`w-16 text-right ${
                    change > 0
                      ? 'text-f1-success'
                      : change < 0
                        ? 'text-f1-danger'
                        : 'text-f1-text/40'
                  }`}
                >
                  {change > 0 ? `\u25B2${change}` : change < 0 ? `\u25BC${Math.abs(change)}` : '--'}
                </span>
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
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                className="flex items-center gap-2 px-3 py-2 rounded-sm font-pixel text-[10px] bg-f1-surface/20"
              >
                <span className="w-6 text-right text-f1-text/30">--</span>
                <div
                  className="w-1 h-4 rounded-sm shrink-0 opacity-30"
                  style={{ backgroundColor: team.primaryColor }}
                />
                <span className="w-10 text-f1-text/30 line-through">{driver.shortName}</span>
                <span className="flex-1 text-f1-text/20 truncate">{team.name}</span>
                <span className="text-f1-danger/60 w-16 text-right font-bold">DNF</span>
              </motion.div>
            )
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <PixelButton variant="success" onClick={handleContinueToStrategy} className="px-8">
            CONTINUE TO STRATEGY
          </PixelButton>
        </motion.div>
      </div>
    )
  }

  // -- Race Mode --
  const currentMode = playerCar?.mode ?? 'neutral'

  return (
    <div className="min-h-screen bg-f1-bg flex flex-col">
      <SafetyCarBanner active={raceState.safetyCar} />

      {/* Sticky broadcast header */}
      <div
        className={`sticky top-0 z-30 px-4 py-2 border-b flex items-center justify-between ${
          raceState.safetyCar
            ? 'bg-f1-warning/20 border-f1-warning/40'
            : 'bg-f1-bg border-f1-border'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="bg-f1-warning text-black font-pixel text-[7px] px-1.5 py-0.5 rounded-sm">
            SPRINT
          </span>
          <span className="font-pixel text-[9px] text-f1-text/70">{raceState.track.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <LapCounter currentLap={raceState.currentLap} totalLaps={raceState.totalLaps} />
          <WeatherBadge weather={raceState.weather} />
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col lg:flex-row gap-2 px-2 py-2 overflow-hidden">
        {/* Timing tower */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <BroadcastTimingTower
            entries={timingEntries}
            drivers={drivers}
            teams={teams}
            playerDriverId={raceState.playerDriverId}
            layoutId="sprint-timing-tower"
          />
        </div>

        {/* Right panel: track map (hidden on mobile) */}
        <div className="hidden lg:flex flex-col gap-2 w-64 shrink-0">
          <div className="bg-f1-surface rounded-sm border border-f1-border p-2">
            <p className="font-pixel text-[7px] text-f1-text/40 mb-1 text-center">TRACK MAP</p>
            <TrackMiniMap
              trackId={raceState.track.id}
              cars={carDots}
              teams={teams}
              playerDriverId={raceState.playerDriverId}
              className="h-48"
            />
          </div>

          {/* Player telemetry on desktop */}
          {playerCar && !playerCar.dnf && (
            <div className="bg-f1-surface rounded-sm border border-f1-border p-2">
              <p className="font-pixel text-[7px] text-f1-text/40 mb-2">YOUR CAR</p>
              <div className="flex flex-wrap items-center gap-3">
                <TireIndicator
                  compound={playerCar.tireCompound}
                  gripPercent={gripPercent}
                  lapsOnTire={playerCar.lapsOnTire}
                />
                <FuelIndicator fuelPercent={playerCar.fuelLoad * 100} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile-only player telemetry */}
      {playerCar && !playerCar.dnf && (
        <div className="lg:hidden px-2 pb-1">
          <div className="bg-f1-surface rounded-sm border border-f1-border p-2 flex items-center gap-4">
            <p className="font-pixel text-[7px] text-f1-text/40">YOUR CAR</p>
            <TireIndicator
              compound={playerCar.tireCompound}
              gripPercent={gripPercent}
              lapsOnTire={playerCar.lapsOnTire}
            />
            <FuelIndicator fuelPercent={playerCar.fuelLoad * 100} />
          </div>
        </div>
      )}

      {/* Player DNF notice */}
      {playerCar && playerCar.dnf && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mx-2 mb-2 border-2 border-f1-danger rounded-sm p-3 bg-red-950/30 text-center"
        >
          <p className="font-pixel text-sm text-f1-danger">RETIRED</p>
          <p className="font-pixel text-[9px] text-f1-text/50 mt-1">Your sprint race is over.</p>
        </motion.div>
      )}

      {/* Sticky bottom action bar */}
      {playerCar && !playerCar.dnf && (
        <div className="sticky bottom-0 z-30 bg-f1-bg border-t border-f1-border px-3 py-2">
          <div className="flex items-center gap-2">
            {/* Mode buttons */}
            <button
              onClick={() => handleModeChange('save')}
              className={`flex-1 font-pixel text-[9px] py-2 rounded-sm border transition-colors ${
                currentMode === 'save'
                  ? 'bg-f1-success text-black border-f1-success'
                  : 'bg-transparent text-f1-success border-f1-success/50 hover:bg-f1-success/10'
              }`}
            >
              SAVE
            </button>
            <button
              onClick={() => handleModeChange('neutral')}
              className={`flex-1 font-pixel text-[9px] py-2 rounded-sm border transition-colors ${
                currentMode === 'neutral'
                  ? 'bg-f1-warning text-black border-f1-warning'
                  : 'bg-transparent text-f1-warning border-f1-warning/50 hover:bg-f1-warning/10'
              }`}
            >
              NEUTRAL
            </button>
            <button
              onClick={() => handleModeChange('push')}
              className={`flex-1 font-pixel text-[9px] py-2 rounded-sm border transition-colors ${
                currentMode === 'push'
                  ? 'bg-f1-danger text-black border-f1-danger'
                  : 'bg-transparent text-f1-danger border-f1-danger/50 hover:bg-f1-danger/10'
              }`}
            >
              PUSH
            </button>

            {/* Pit button */}
            <div className="relative">
              <button
                onClick={() => setShowPitMenu((prev) => !prev)}
                disabled={playerCar.pitting}
                className={`font-pixel text-[9px] px-3 py-2 rounded-sm border transition-colors ${
                  playerCar.pitting
                    ? 'bg-f1-warning/20 text-f1-warning/50 border-f1-warning/30 cursor-not-allowed'
                    : 'bg-transparent text-f1-warning border-f1-warning/50 hover:bg-f1-warning/10'
                }`}
              >
                {playerCar.pitting ? 'PIT...' : 'BOX'}
              </button>

              <AnimatePresence>
                {showPitMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full right-0 mb-2 bg-f1-surface border border-f1-border rounded-sm p-1.5 flex gap-1.5 z-40"
                  >
                    {PIT_COMPOUNDS.map((compound) => (
                      <button
                        key={compound}
                        onClick={() => handlePitStop(compound)}
                        className="font-pixel text-[8px] px-2 py-1.5 rounded-sm bg-f1-bg border border-f1-border text-f1-text hover:bg-f1-surface transition-colors uppercase"
                      >
                        {compound}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}

      {/* Radio Alerts */}
      <AnimatePresence>
        {currentMessage && <RadioAlert message={currentMessage} onDismiss={dismissMessage} />}
      </AnimatePresence>
    </div>
  )
}
