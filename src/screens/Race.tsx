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
import { BroadcastTimingTower, type TimingEntry } from '../components/BroadcastTimingTower'
import { TrackMiniMap, type CarDot } from '../components/TrackMiniMap'
import { TireCompoundIcon } from '../components/TireCompoundIcon'
import { WeatherBadge } from '../components/WeatherBadge'
import { RadioAlert } from '../components/RadioAlert'
import { PixelButton } from '../components/PixelButton'
import { saveBestResult } from '../utils/storage'
import { formatMoney } from '../utils/formatMoney'
import {
  calculateRacePoints,
  calculateRacePrizeMoney,
  checkSponsorObjective,
  applyComponentWear,
  calculateRP,
  getComponentDNFChance,
  getModifiedTeamStats,
} from '../engine/seasonEngine'

const DRY_COMPOUNDS: TireCompound[] = ['soft', 'medium', 'hard']
const RAIN_COMPOUNDS: TireCompound[] = ['soft', 'medium', 'hard', 'intermediate', 'wet']

export function Race() {
  const { qualifyingGrid, selectedDriverId, weather } = useWeekendStore()
  const currentTrackId = useWeekendStore((s) => s.currentTrackId)
  const stints = useStrategyStore((s) => s.stints)
  const { raceState, isRunning, setRaceState, setRunning, setPlayerMode } = useRaceStore()
  const callPitStop = useRaceStore((s) => s.callPitStop)

  const [showPitMenu, setShowPitMenu] = useState(false)

  // Position tracking for timing tower
  const prevPositions = useRef<Map<string, number>>(new Map())

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

  // Build timing entries for BroadcastTimingTower
  const timingEntries = useMemo((): TimingEntry[] => {
    if (!raceState) return []

    const activeCars = raceState.cars.filter((c) => !c.dnf)
    const dnfCars = raceState.cars.filter((c) => c.dnf)

    // Sort active cars by cumulative time
    const sortedActive = [...activeCars].sort((a, b) => a.cumulativeTime - b.cumulativeTime)

    // Find fastest lap among active cars
    const fastestLapTime = Math.min(
      ...activeCars.filter((c) => c.lastLapTime > 0).map((c) => c.lastLapTime),
    )
    const fastestLapDriverId = activeCars.find((c) => c.lastLapTime === fastestLapTime)?.driverId

    // Build current positions map and calculate position changes
    const currentPositions = new Map(sortedActive.map((car, i) => [car.driverId, i + 1]))
    const positionChanges = new Map<string, number>()
    for (const [driverId, pos] of currentPositions) {
      const prev = prevPositions.current.get(driverId)
      if (prev !== undefined && prev !== pos) {
        positionChanges.set(driverId, prev - pos)
      }
    }
    prevPositions.current = currentPositions

    const leaderTime = sortedActive.length > 0 ? sortedActive[0].cumulativeTime : 0

    const activeEntries: TimingEntry[] = sortedActive.map((car, i) => {
      const gap = car.cumulativeTime - leaderTime
      let status: TimingEntry['status'] = undefined
      if (car.pitting) status = 'pit'
      else if (car.driverId === fastestLapDriverId && raceState.currentLap > 1)
        status = 'fastest-lap'

      return {
        driverId: car.driverId,
        teamId: car.teamId,
        position: i + 1,
        value: i === 0 ? 'LEADER' : `+${gap.toFixed(1)}s`,
        status,
        tireCompound: car.tireCompound,
        positionChange: positionChanges.get(car.driverId),
      }
    })

    const dnfEntries: TimingEntry[] = dnfCars.map((car) => ({
      driverId: car.driverId,
      teamId: car.teamId,
      position: 0,
      value: 'DNF',
      status: 'dnf' as const,
      inactive: true,
    }))

    return [...activeEntries, ...dnfEntries]
  }, [raceState])

  // Build car dots for TrackMiniMap
  const carDots = useMemo((): CarDot[] => {
    if (!raceState) return []
    const baseProg = raceState.currentLap / raceState.totalLaps
    const sorted = [...raceState.cars]
      .filter((c) => !c.dnf)
      .sort((a, b) => a.cumulativeTime - b.cumulativeTime)

    return sorted.map((car, i) => ({
      driverId: car.driverId,
      teamId: car.teamId,
      progress: (baseProg + i * 0.03) % 1,
      dnf: car.dnf,
    }))
  }, [raceState])

  // Gap to car ahead for player
  const gapToCarAhead = useMemo(() => {
    if (!raceState || !playerCar || playerCar.dnf) return null
    const activeSorted = [...raceState.cars]
      .filter((c) => !c.dnf)
      .sort((a, b) => a.cumulativeTime - b.cumulativeTime)
    const playerIndex = activeSorted.findIndex((c) => c.driverId === playerCar.driverId)
    if (playerIndex <= 0) return null
    const carAhead = activeSorted[playerIndex - 1]
    return playerCar.cumulativeTime - carAhead.cumulativeTime
  }, [raceState, playerCar])

  // Player position
  const playerPosition = useMemo(() => {
    if (!raceState || !playerCar || playerCar.dnf) return null
    const activeSorted = [...raceState.cars]
      .filter((c) => !c.dnf)
      .sort((a, b) => a.cumulativeTime - b.cumulativeTime)
    return activeSorted.findIndex((c) => c.driverId === playerCar.driverId) + 1
  }, [raceState, playerCar])

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

  // Compute results data for the overlay
  const resultsData = useMemo(() => {
    if (!raceFinished || !raceState) return null

    const finalPositions = [...raceState.cars]
      .filter((c) => !c.dnf)
      .sort((a, b) => a.cumulativeTime - b.cumulativeTime)

    const pCar = raceState.cars.find((c) => c.driverId === raceState.playerDriverId)
    if (!pCar) return null

    const playerPos = pCar.dnf
      ? 0
      : finalPositions.findIndex((c) => c.driverId === pCar.driverId) + 1
    const points = pCar.dnf ? 0 : calculateRacePoints(playerPos)

    // Player team prize money
    const selectedTeamId = useWeekendStore.getState().selectedTeamId
    const driverPositions = raceState.cars.map((car) => {
      const pos = finalPositions.findIndex((c) => c.driverId === car.driverId)
      return { driverId: car.driverId, position: car.dnf ? 0 : pos + 1, dnf: car.dnf }
    })
    const playerTeamDrivers = driverPositions.filter((dp) => {
      const d = drivers.find((dr) => dr.id === dp.driverId)
      return d?.teamId === selectedTeamId
    })
    const bestPlayerFinish = Math.min(
      ...playerTeamDrivers.filter((d) => !d.dnf).map((d) => d.position),
      99,
    )
    const prizeMoney = calculateRacePrizeMoney(bestPlayerFinish)

    // Sponsors
    const seasonState = useSeasonStore.getState()
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

    const sponsorResults = seasonState.activeSponsors.map((sponsor) => {
      const met = checkSponsorObjective(sponsor, {
        bestFinish: bestPlayerFinish,
        bothFinished,
        won,
        bestQualifying,
      })
      return { name: sponsor.name, met, payout: sponsor.payout }
    })

    // RP
    const practiceData = useWeekendStore.getState().practiceData
    const rp = calculateRP(bestPlayerFinish, practiceData.dataCollected)

    // Component wear preview
    const components = seasonState.components
    const wornComponents = applyComponentWear(components, 'race')

    return {
      playerPos,
      points,
      prizeMoney,
      sponsorResults,
      rp,
      pCar,
      components,
      wornComponents,
    }
  }, [raceFinished, raceState])

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

  const currentMode = playerCar?.mode ?? 'neutral'

  return (
    <div className="h-screen bg-f1-bg flex flex-col overflow-hidden">
      {/* ── Sticky Header ── */}
      <div
        className={`sticky top-0 z-10 px-4 py-2 flex items-center justify-between border-b ${
          raceState.safetyCar
            ? 'bg-f1-warning text-black border-f1-warning'
            : 'bg-f1-surface border-f1-border'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="font-pixel text-[10px] uppercase tracking-wide">
            {raceState.track.name}
          </span>
          {raceState.safetyCar && (
            <span className="font-pixel text-[8px] font-bold animate-pulse">SAFETY CAR</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="font-pixel text-[10px] tabular-nums">
            LAP {raceState.currentLap}/{raceState.totalLaps}
          </span>
          <WeatherBadge weather={raceState.weather} />
          {raceFinished && (
            <span className="font-pixel text-[8px] text-f1-accent font-bold">FINISHED</span>
          )}
        </div>
      </div>

      {/* ── Main Content: 2 Columns ── */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left column: Timing Tower */}
        <div className="flex-1 overflow-y-auto p-2">
          <BroadcastTimingTower
            entries={timingEntries}
            drivers={drivers}
            teams={teams}
            playerDriverId={raceState.playerDriverId}
          />
        </div>

        {/* Right column: Player Panel (hidden on mobile) */}
        <div className="w-64 hidden md:flex flex-col border-l border-f1-border bg-f1-surface/40 overflow-y-auto">
          {/* Track Mini Map */}
          <div className="p-3 border-b border-f1-border">
            <p className="font-pixel text-[8px] text-f1-text/40 mb-2 uppercase">Track Map</p>
            <div className="h-36">
              <TrackMiniMap
                trackId={raceState.track.id}
                cars={carDots}
                teams={teams}
                playerDriverId={raceState.playerDriverId}
              />
            </div>
          </div>

          {/* Player Info */}
          {playerCar && !playerCar.dnf && (
            <div className="p-3 flex flex-col gap-3">
              {/* Position */}
              <div className="text-center">
                <p className="font-pixel text-[8px] text-f1-text/40 uppercase">Position</p>
                <p className="font-pixel text-3xl text-f1-accent leading-none mt-1">
                  P{playerPosition ?? '--'}
                </p>
                {gapToCarAhead !== null && (
                  <p className="font-pixel text-[9px] text-f1-text/50 mt-1">
                    +{gapToCarAhead.toFixed(1)}s to car ahead
                  </p>
                )}
              </div>

              {/* Tire info */}
              <div className="flex items-center gap-2">
                <TireCompoundIcon compound={playerCar.tireCompound} size="md" />
                <div>
                  <p className="font-pixel text-[9px] text-f1-text uppercase">
                    {playerCar.tireCompound}
                  </p>
                  <p className="font-pixel text-[8px] text-f1-text/40">
                    {playerCar.lapsOnTire} laps on tire
                  </p>
                </div>
              </div>

              {/* Fuel bar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="font-pixel text-[8px] text-f1-text/40 uppercase">Fuel</p>
                  <p className="font-pixel text-[8px] text-f1-text/50">
                    {Math.round(playerCar.fuelLoad * 100)}%
                  </p>
                </div>
                <div className="w-full h-2 bg-f1-bg rounded-sm overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${playerCar.fuelLoad * 100}%`,
                      backgroundColor:
                        playerCar.fuelLoad > 0.3
                          ? '#22c55e'
                          : playerCar.fuelLoad > 0.1
                            ? '#eab308'
                            : '#ef4444',
                    }}
                  />
                </div>
              </div>

              {/* Mode indicator */}
              <div>
                <p className="font-pixel text-[8px] text-f1-text/40 uppercase mb-1">Mode</p>
                <p
                  className={`font-pixel text-[10px] font-bold uppercase ${
                    currentMode === 'push'
                      ? 'text-f1-danger'
                      : currentMode === 'save'
                        ? 'text-f1-success'
                        : 'text-f1-warning'
                  }`}
                >
                  {currentMode}
                </p>
              </div>
            </div>
          )}

          {/* Player DNF notice */}
          {playerCar && playerCar.dnf && (
            <div className="p-4 text-center">
              <p className="font-pixel text-sm text-f1-danger">RETIRED</p>
              <p className="font-pixel text-[9px] text-f1-text/50 mt-1">Your race is over.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Race Results Overlay ── */}
      <AnimatePresence>
        {raceFinished && resultsData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 bg-f1-bg/95 flex flex-col items-center justify-center px-4 overflow-y-auto py-8"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 15 }}
              className="text-center mb-6"
            >
              <h1 className="font-pixel text-2xl text-f1-accent mb-2">RACE COMPLETE</h1>
              <p className="font-pixel text-[10px] text-f1-text/50">
                {raceState.track.name} -- {raceState.totalLaps} LAPS
              </p>
            </motion.div>

            {/* Player Result Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full max-w-sm bg-f1-surface border border-f1-border rounded-sm p-4 mb-4"
            >
              <p className="font-pixel text-[8px] text-f1-text/40 mb-3 uppercase">Your Result</p>
              <div className="text-center mb-4">
                <p className="font-pixel text-4xl text-f1-accent leading-none">
                  {resultsData.pCar.dnf ? 'DNF' : `P${resultsData.playerPos}`}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="font-pixel text-[8px] text-f1-text/40">POINTS</p>
                  <p className="font-pixel text-sm text-f1-accent">{resultsData.points}</p>
                </div>
                <div>
                  <p className="font-pixel text-[8px] text-f1-text/40">PRIZE</p>
                  <p className="font-pixel text-sm text-f1-success">
                    {formatMoney(resultsData.prizeMoney)}
                  </p>
                </div>
                <div>
                  <p className="font-pixel text-[8px] text-f1-text/40">RP</p>
                  <p className="font-pixel text-sm text-blue-400">+{resultsData.rp}</p>
                </div>
              </div>
            </motion.div>

            {/* Component Wear Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="w-full max-w-sm bg-f1-surface border border-f1-border rounded-sm p-4 mb-4"
            >
              <p className="font-pixel text-[8px] text-f1-text/40 mb-2 uppercase">Component Wear</p>
              <div className="flex flex-col gap-1">
                {resultsData.wornComponents.map((comp) => {
                  const prev = resultsData.components.find((c) => c.type === comp.type)
                  const wearDelta = prev ? prev.healthPercent - comp.healthPercent : 0
                  return (
                    <div key={comp.type} className="flex items-center justify-between">
                      <span className="font-pixel text-[9px] text-f1-text uppercase">
                        {comp.type}
                      </span>
                      <span
                        className={`font-pixel text-[9px] ${
                          comp.healthPercent > 50
                            ? 'text-f1-success'
                            : comp.healthPercent > 25
                              ? 'text-f1-warning'
                              : 'text-f1-danger'
                        }`}
                      >
                        {Math.round(comp.healthPercent)}%
                        {wearDelta > 0 ? ` (-${Math.round(wearDelta)})` : ''}
                      </span>
                    </div>
                  )
                })}
              </div>
            </motion.div>

            {/* Sponsor Objectives */}
            {resultsData.sponsorResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="w-full max-w-sm bg-f1-surface border border-f1-border rounded-sm p-4 mb-6"
              >
                <p className="font-pixel text-[8px] text-f1-text/40 mb-2 uppercase">Sponsors</p>
                <div className="flex flex-col gap-1">
                  {resultsData.sponsorResults.map((sr) => (
                    <div key={sr.name} className="flex items-center justify-between">
                      <span className="font-pixel text-[9px] text-f1-text">{sr.name}</span>
                      <span
                        className={`font-pixel text-[9px] ${sr.met ? 'text-f1-success' : 'text-f1-danger'}`}
                      >
                        {sr.met ? `+${formatMoney(sr.payout)}` : 'MISSED'}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <PixelButton variant="success" onClick={handleContinueToHQ} className="px-8">
                {isLastRace ? 'SEASON RESULTS' : 'CONTINUE TO HQ'}
              </PixelButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Sticky Bottom Action Bar ── */}
      {playerCar && !playerCar.dnf && !raceFinished && (
        <div className="sticky bottom-0 z-10 bg-f1-surface border-t border-f1-border px-4 py-3">
          <div className="flex items-center gap-2">
            {/* Mode buttons */}
            <button
              onClick={() => handleModeChange('save')}
              className={`flex-1 font-pixel text-[10px] py-2 rounded-sm border transition-colors ${
                currentMode === 'save'
                  ? 'bg-f1-success text-black border-f1-success'
                  : 'bg-transparent text-f1-success border-f1-success/50 hover:border-f1-success'
              }`}
            >
              SAVE
            </button>
            <button
              onClick={() => handleModeChange('neutral')}
              className={`flex-1 font-pixel text-[10px] py-2 rounded-sm border transition-colors ${
                currentMode === 'neutral'
                  ? 'bg-f1-warning text-black border-f1-warning'
                  : 'bg-transparent text-f1-warning border-f1-warning/50 hover:border-f1-warning'
              }`}
            >
              NEUTRAL
            </button>
            <button
              onClick={() => handleModeChange('push')}
              className={`flex-1 font-pixel text-[10px] py-2 rounded-sm border transition-colors ${
                currentMode === 'push'
                  ? 'bg-f1-danger text-black border-f1-danger'
                  : 'bg-transparent text-f1-danger border-f1-danger/50 hover:border-f1-danger'
              }`}
            >
              PUSH
            </button>

            {/* Separator */}
            <div className="w-px h-8 bg-f1-border mx-1" />

            {/* Box Now */}
            <div className="relative">
              <button
                onClick={() => setShowPitMenu((prev) => !prev)}
                disabled={playerCar.pitting}
                className={`font-pixel text-[10px] px-4 py-2 rounded-sm border transition-colors ${
                  playerCar.pitting
                    ? 'bg-f1-warning/20 text-f1-warning border-f1-warning/30 cursor-not-allowed'
                    : 'bg-f1-warning text-black border-f1-warning hover:bg-f1-warning/80'
                }`}
              >
                {playerCar.pitting ? 'BOXING...' : 'BOX NOW'}
              </button>

              <AnimatePresence>
                {showPitMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full right-0 mb-2 bg-f1-surface border border-f1-border rounded-sm p-2 flex gap-2 z-40"
                  >
                    {(raceState.weather === 'light-rain' || raceState.weather === 'heavy-rain'
                      ? RAIN_COMPOUNDS
                      : DRY_COMPOUNDS
                    ).map((compound) => (
                      <button
                        key={compound}
                        onClick={() => handlePitStop(compound)}
                        className="font-pixel text-[9px] px-3 py-1.5 bg-f1-bg border border-f1-border rounded-sm hover:border-f1-accent transition-colors uppercase text-f1-text"
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

      {/* Player DNF bar (mobile view) */}
      {playerCar && playerCar.dnf && !raceFinished && (
        <div className="sticky bottom-0 z-10 bg-f1-surface border-t border-f1-danger/50 px-4 py-3 text-center">
          <p className="font-pixel text-sm text-f1-danger">RETIRED</p>
          <p className="font-pixel text-[8px] text-f1-text/50 mt-1">
            Waiting for race to finish...
          </p>
        </div>
      )}

      {/* Radio Alerts */}
      <AnimatePresence>
        {currentMessage && <RadioAlert message={currentMessage} onDismiss={dismissMessage} />}
      </AnimatePresence>
    </div>
  )
}
