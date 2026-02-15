import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWeekendStore } from '../stores/weekendStore'
import { useStrategyStore } from '../stores/strategyStore'
import { useRaceStore } from '../stores/raceStore'
import { useSeasonStore } from '../stores/seasonStore'
import { createInitialRaceState } from '../engine/raceSimulator'
import type { DriverMode } from '../engine/raceSimulator'
import type { TireCompound } from '../data/types'
import { teams } from '../data/teams'
import { drivers } from '../data/drivers'
import { tracks } from '../data/tracks'
import { calendar } from '../data/calendar'
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
import { saveBestResult } from '../utils/storage'
import {
  calculateRacePoints,
  calculateRacePrizeMoney,
  checkSponsorObjective,
  applyComponentWear,
  calculateRP,
  getComponentDNFChance,
  getModifiedTeamStats,
} from '../engine/seasonEngine'

const PIT_COMPOUNDS: TireCompound[] = ['soft', 'medium', 'hard']

export function Race() {
  const { qualifyingGrid, selectedDriverId, weather } = useWeekendStore()
  const currentTrackId = useWeekendStore((s) => s.currentTrackId)
  const stints = useStrategyStore((s) => s.stints)
  const { raceState, isRunning, setRaceState, setRunning, setPlayerMode } = useRaceStore()
  const callPitStop = useRaceStore((s) => s.callPitStop)

  const [showPitMenu, setShowPitMenu] = useState(false)

  // Initialize race state on mount
  useEffect(() => {
    if (raceState) return

    const track = tracks.find((t) => t.id === currentTrackId) ?? tracks[0]
    const playerDriverId = selectedDriverId ?? drivers[0].id
    const playerInitialTire: TireCompound = stints.length > 0 ? stints[0].compound : 'medium'

    const grid =
      qualifyingGrid.length > 0
        ? qualifyingGrid.map((g) => ({
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

    // Set player's initial tire compound from strategy
    initial.cars = initial.cars.map((car) => {
      if (car.driverId === playerDriverId) {
        return {
          ...car,
          tireCompound: playerInitialTire,
          compoundsUsed: [playerInitialTire],
        }
      }
      // AI drivers alternate between medium and hard
      const aiCompound: TireCompound = car.position % 2 === 0 ? 'medium' : 'hard'
      return {
        ...car,
        tireCompound: aiCompound,
        compoundsUsed: [aiCompound],
      }
    })

    setRaceState(initial)
    setRunning(true)
  }, [
    raceState,
    qualifyingGrid,
    selectedDriverId,
    weather,
    stints,
    setRaceState,
    setRunning,
    currentTrackId,
  ])

  // Drive the simulation
  useRaceLoop()

  // Radio messages
  const { currentMessage, dismissMessage } = useRadioMessages(raceState)

  // Determine if the race is finished
  const raceFinished =
    raceState !== null && raceState.currentLap >= raceState.totalLaps && !isRunning

  // Check if this is the last race
  const isLastRace = useSeasonStore.getState().currentRaceIndex >= calendar.length - 1

  // Save best result on race finish
  const savedRef = useRef(false)
  useEffect(() => {
    if (!raceFinished || !raceState || savedRef.current) return
    savedRef.current = true

    const playerCar = raceState.cars.find((c) => c.driverId === raceState.playerDriverId)
    if (playerCar && !playerCar.dnf) {
      const driver = drivers.find((d) => d.id === playerCar.driverId)
      if (driver) {
        saveBestResult({
          teamId: playerCar.teamId,
          driverName: driver.name,
          position: playerCar.position,
          trackId: raceState.track.id,
        })
      }
    }
  }, [raceFinished, raceState])

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

  // Position changes for results screen
  const positionChanges = useMemo(() => {
    if (!raceState || !raceFinished) return new Map<string, number>()
    const changes = new Map<string, number>()
    for (const car of raceState.cars) {
      const gridEntry = qualifyingGrid.find((g) => g.driverId === car.driverId)
      const startPos = gridEntry?.position ?? 20
      const change = startPos - car.position
      changes.set(car.driverId, change)
    }
    return changes
  }, [raceState, raceFinished, qualifyingGrid])

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

  const handleContinueToHQ = useCallback(() => {
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

    // Points for all drivers
    const pointsPerDriver = driverPositions.map((dp) => ({
      driverId: dp.driverId,
      points: dp.dnf ? 0 : calculateRacePoints(dp.position),
    }))

    // Player team prize money
    const selectedTeamId = useWeekendStore.getState().selectedTeamId
    const playerTeamDrivers = driverPositions.filter((dp) => {
      const d = drivers.find((dr) => dr.id === dp.driverId)
      return d?.teamId === selectedTeamId
    })
    const bestPlayerFinish = Math.min(
      ...playerTeamDrivers.filter((d) => !d.dnf).map((d) => d.position),
      99,
    )
    const prizeMoney = calculateRacePrizeMoney(bestPlayerFinish)

    // Check sponsors
    const bothFinished = playerTeamDrivers.every((d) => !d.dnf)
    const won = bestPlayerFinish === 1
    const bestQualifying = Math.min(
      ...useWeekendStore
        .getState()
        .qualifyingGrid.filter(
          (g) => drivers.find((d) => d.id === g.driverId)?.teamId === selectedTeamId,
        )
        .map((g) => g.position),
      99,
    )

    let sponsorPayouts = 0
    for (const sponsor of seasonState.activeSponsors) {
      if (
        checkSponsorObjective(sponsor, {
          bestFinish: bestPlayerFinish,
          bothFinished,
          won,
          bestQualifying,
        })
      ) {
        sponsorPayouts += sponsor.payout
      }
    }

    // RP from practice data
    const practiceData = useWeekendStore.getState().practiceData
    const rp = calculateRP(bestPlayerFinish, practiceData.dataCollected)

    // Apply component wear
    const newComponents = applyComponentWear(seasonState.components, 'race')
    useSeasonStore.getState().setComponents(newComponents)

    // Add results
    useSeasonStore.getState().addRaceResults({
      driverPositions,
      prizeMoney,
      sponsorPayouts,
      rp,
      pointsPerDriver,
    })

    // Clean up race state
    useRaceStore.getState().reset()
    useStrategyStore.getState().reset()

    // Navigate
    const currentIsLastRace = seasonState.currentRaceIndex >= calendar.length - 1
    if (currentIsLastRace) {
      useWeekendStore.getState().setPhase('season-end')
    } else {
      useSeasonStore.getState().advanceToNextRace()
      useWeekendStore.getState().resetWeekend()
    }
  }, [])

  if (!raceState) {
    return (
      <div className="min-h-screen bg-f1-bg flex items-center justify-center">
        <p className="font-pixel text-f1-accent text-sm animate-pulse">INITIALIZING RACE...</p>
      </div>
    )
  }

  // ── Results Mode ──
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
          <h1 className="font-pixel text-2xl text-f1-accent mb-2">RACE COMPLETE</h1>
          <p className="font-pixel text-[10px] text-f1-text/50">
            {raceState.track.name} — {raceState.totalLaps} LAPS
          </p>
        </motion.div>

        <div className="w-full max-w-2xl flex flex-col gap-1 mb-8">
          {finalStandings.map((car, index) => {
            const driver = driverMap.get(car.driverId)
            const team = teamMap.get(car.teamId)
            if (!driver || !team) return null
            const isPlayer = car.driverId === raceState.playerDriverId
            const change = positionChanges.get(car.driverId) ?? 0

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
                <span className="w-6 text-right text-f1-accent font-bold">P{index + 1}</span>
                <div
                  className="w-1 h-4 rounded-sm shrink-0"
                  style={{ backgroundColor: team.primaryColor }}
                />
                <span className={`w-10 ${isPlayer ? 'text-f1-accent' : 'text-f1-text'}`}>
                  {driver.shortName}
                </span>
                <span className="flex-1 text-f1-text/50 truncate">{team.name}</span>
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
          <PixelButton variant="success" onClick={handleContinueToHQ} className="px-8">
            {isLastRace ? 'SEASON RESULTS' : 'CONTINUE TO HQ →'}
          </PixelButton>
        </motion.div>
      </div>
    )
  }

  // ── Race Mode ──
  const currentMode = playerCar?.mode ?? 'neutral'

  return (
    <div className="min-h-screen bg-f1-bg px-4 py-4 flex flex-col">
      <SafetyCarBanner active={raceState.safetyCar} />

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
          <p className="font-pixel text-[9px] text-f1-text/50 mt-1">Your race is over.</p>
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

          {/* Pit Stop */}
          <div className="relative">
            <PixelButton
              variant="warning"
              onClick={() => setShowPitMenu((prev) => !prev)}
              className="w-full"
              disabled={playerCar.pitting}
            >
              {playerCar.pitting ? 'PITTING...' : 'BOX NOW'}
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
