import { useEffect, useState, useMemo, useCallback } from 'react'
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
import { Leaderboard } from '../components/Leaderboard'
import { TireIndicator } from '../components/TireIndicator'
import { FuelIndicator } from '../components/FuelIndicator'
import { WeatherBadge } from '../components/WeatherBadge'
import { LapCounter } from '../components/LapCounter'
import { RadioAlert } from '../components/RadioAlert'
import { SafetyCarBanner } from '../components/SafetyCarBanner'
import { PixelButton } from '../components/PixelButton'
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
          <p className="font-pixel text-[9px] text-f1-warning tracking-widest mb-2">
            SPRINT WEEKEND
          </p>
          <h1 className="font-pixel text-2xl text-f1-warning mb-2">SPRINT RACE COMPLETE</h1>
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
                  isPlayer ? 'bg-slate-700/80 border-l-2' : 'bg-slate-800/40'
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
                className="flex items-center gap-2 px-3 py-2 rounded-sm font-pixel text-[10px] bg-slate-800/20"
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
    <div className="min-h-screen bg-f1-bg px-4 py-4 flex flex-col">
      <SafetyCarBanner active={raceState.safetyCar} />

      {/* Sprint header */}
      <div className="text-center mb-2">
        <p className="font-pixel text-[9px] text-f1-warning tracking-widest">SPRINT RACE</p>
      </div>

      {/* Top Bar */}
      <div className="flex items-center justify-between mb-4 px-2">
        <LapCounter currentLap={raceState.currentLap} totalLaps={raceState.totalLaps} />
        <WeatherBadge weather={raceState.weather} />
      </div>

      {/* Leaderboard */}
      <div className="flex-1 overflow-y-auto mb-4 border-2 border-f1-border rounded-sm p-2 bg-slate-900/40">
        <Leaderboard
          cars={raceState.cars}
          drivers={drivers}
          teams={teams}
          playerDriverId={raceState.playerDriverId}
        />
      </div>

      {/* Player Status */}
      {playerCar && !playerCar.dnf && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-2 border-f1-border rounded-sm p-3 mb-4 bg-slate-900/60"
        >
          <p className="font-pixel text-[9px] text-f1-text/40 mb-2">YOUR CAR</p>
          <div className="flex flex-wrap items-center gap-4">
            <TireIndicator
              compound={playerCar.tireCompound}
              gripPercent={gripPercent}
              lapsOnTire={playerCar.lapsOnTire}
            />
            <FuelIndicator fuelPercent={playerCar.fuelLoad * 100} />
          </div>
        </motion.div>
      )}

      {/* Player DNF notice */}
      {playerCar && playerCar.dnf && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border-2 border-f1-danger rounded-sm p-3 mb-4 bg-red-950/30 text-center"
        >
          <p className="font-pixel text-sm text-f1-danger">RETIRED</p>
          <p className="font-pixel text-[9px] text-f1-text/50 mt-1">Your sprint race is over.</p>
        </motion.div>
      )}

      {/* Controls */}
      {playerCar && !playerCar.dnf && (
        <div className="border-2 border-f1-border rounded-sm p-3 bg-slate-900/60">
          {/* Mode Buttons */}
          <div className="flex gap-2 mb-3">
            <PixelButton
              variant="danger"
              onClick={() => handleModeChange('push')}
              className={`flex-1 ${currentMode === 'push' ? 'ring-2 ring-f1-danger' : 'opacity-60'}`}
            >
              PUSH
            </PixelButton>
            <PixelButton
              variant="default"
              onClick={() => handleModeChange('neutral')}
              className={`flex-1 ${currentMode === 'neutral' ? 'ring-2 ring-f1-accent' : 'opacity-60'}`}
            >
              NEUTRAL
            </PixelButton>
            <PixelButton
              variant="success"
              onClick={() => handleModeChange('save')}
              className={`flex-1 ${currentMode === 'save' ? 'ring-2 ring-f1-success' : 'opacity-60'}`}
            >
              SAVE
            </PixelButton>
          </div>

          {/* Pit Stop — optional in sprint */}
          <div className="relative">
            <PixelButton
              variant="warning"
              onClick={() => setShowPitMenu((prev) => !prev)}
              className="w-full"
              disabled={playerCar.pitting}
            >
              {playerCar.pitting ? 'PITTING...' : 'BOX NOW (OPTIONAL)'}
            </PixelButton>

            <AnimatePresence>
              {showPitMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute bottom-full left-0 right-0 mb-2 bg-slate-800 border-2 border-f1-border rounded-sm p-2 flex gap-2 z-40"
                >
                  {PIT_COMPOUNDS.map((compound) => (
                    <PixelButton
                      key={compound}
                      onClick={() => handlePitStop(compound)}
                      className="flex-1 uppercase"
                    >
                      {compound}
                    </PixelButton>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
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
