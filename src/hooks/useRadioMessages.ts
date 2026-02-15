import { useState, useEffect, useRef } from 'react'
import type { RaceState } from '../engine/raceSimulator'

export function useRadioMessages(raceState: RaceState | null) {
  const [messages, setMessages] = useState<string[]>([])
  const lastLap = useRef(0)

  useEffect(() => {
    if (!raceState || raceState.currentLap === lastLap.current) return
    lastLap.current = raceState.currentLap

    const newMessages: string[] = []

    // Add race events as radio messages
    for (const event of raceState.events) {
      newMessages.push(event.message)
    }

    // Player-specific messages
    const playerCar = raceState.cars.find((c) => c.driverId === raceState.playerDriverId)
    if (playerCar && !playerCar.dnf) {
      // Tire warning
      const gripPercent = Math.max(0, 1 - playerCar.lapsOnTire * 0.03) * 100
      if (gripPercent < 30 && gripPercent > 20) {
        newMessages.push('Tires are getting critical, consider boxing.')
      }
      if (gripPercent <= 20) {
        newMessages.push('Box, box! Tires are gone!')
      }
    }

    if (newMessages.length > 0) {
      setMessages((prev) => [...prev.slice(-4), ...newMessages])
    }
  }, [raceState])

  const dismissMessage = () => {
    setMessages((prev) => prev.slice(1))
  }

  return { currentMessage: messages[0] || null, dismissMessage }
}
