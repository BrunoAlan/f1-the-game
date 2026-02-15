import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWeekendStore } from '../stores/weekendStore'
import { useStrategyStore } from '../stores/strategyStore'
import { useRaceStore } from '../stores/raceStore'
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
import { saveBestResult } from '../utils/storage'

const PIT_COMPOUNDS: TireCompound[] = ['soft', 'medium', 'hard']

export function Race() {
  const { qualifyingGrid, selectedDriverId, weather, setPhase } = useWeekendStore()
  const stints = useStrategyStore((s) => s.stints)
  const { raceState, isRunning, setRaceState, setRunning, setPlayerMode } = useRaceStore()
  const callPitStop = useRaceStore((s) => s.callPitStop)
  const resetRace = useRaceStore((s) => s.reset)

  const [showPitMenu, setShowPitMenu] = useState(false)

  // Initialize race state on mount
  useEffect(() => {
    if (raceState) return

    const track = tracks[0]
    const playerDriverId = selectedDriverId ?? drivers[0].id
    const playerInitialTire: TireCompound = stints.length > 0 ? stints[0].compound : 'medium'

    const grid =
      qualifyingGrid.length > 0
        ? qualifyingGrid.map((g) => ({
            driverId: g.driverId,
            position: g.position,
          }))
        : drivers.map((d, i) => ({ driverId: d.id, position: i + 1 }))

    const initial = createInitialRaceState({
      teams,
      drivers,
      track,
      grid,
      weather,
      playerDriverId,
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
  }, [raceState, qualifyingGrid, selectedDriverId, weather, stints, setRaceState, setRunning])

  // Drive the simulation
  useRaceLoop()

  // Radio messages
  const { currentMessage, dismissMessage } = useRadioMessages(raceState)

  // Determine if the race is finished
  const raceFinished =
    raceState !== null && raceState.currentLap >= raceState.totalLaps && !isRunning

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

  const handleRaceAgain = useCallback(() => {
    resetRace()
    useWeekendStore.getState().reset()
    useStrategyStore.getState().reset()
    setPhase('team-select')
  }, [resetRace, setPhase])

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
          <PixelButton variant="success" onClick={handleRaceAgain} className="px-8">
            RACE AGAIN
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
