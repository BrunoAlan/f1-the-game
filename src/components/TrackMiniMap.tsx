import { useEffect, useMemo, useRef, useState } from 'react'
import type { Team } from '../data/types'
import { getTrackPath } from '../data/trackPaths'

export interface CarDot {
  driverId: string
  teamId: string
  progress: number // 0-1, how far along the track
  dnf?: boolean
}

interface TrackMiniMapProps {
  trackId: string
  cars: CarDot[]
  teams: Team[]
  playerDriverId: string
  className?: string
}

export function TrackMiniMap({
  trackId,
  cars,
  teams,
  playerDriverId,
  className = '',
}: TrackMiniMapProps) {
  const trackPath = getTrackPath(trackId)
  const pathRef = useRef<SVGPathElement>(null)
  const [pathReady, setPathReady] = useState(false)
  const teamMap = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams])

  useEffect(() => {
    if (pathRef.current) setPathReady(true)
  }, [])

  if (!trackPath) return null

  const activeCars = cars.filter((c) => !c.dnf)

  function getPosition(progress: number): { x: number; y: number } {
    if (!pathRef.current) return { x: 0, y: 0 }
    const length = pathRef.current.getTotalLength()
    const point = pathRef.current.getPointAtLength(length * (progress % 1))
    return { x: point.x, y: point.y }
  }

  return (
    <svg viewBox={trackPath.viewBox} className={`w-full h-full ${className}`}>
      {/* Track outline (shadow) */}
      <path
        d={trackPath.path}
        fill="none"
        stroke="#2a2a38"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Track surface */}
      <path
        ref={pathRef}
        d={trackPath.path}
        fill="none"
        stroke="#4a4a5a"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Car dots */}
      {pathReady &&
        activeCars.map((car) => {
          const team = teamMap.get(car.teamId)
          if (!team) return null
          const isPlayer = car.driverId === playerDriverId
          const pos = getPosition(car.progress)

          return (
            <circle
              key={car.driverId}
              cx={pos.x}
              cy={pos.y}
              r={isPlayer ? 5 : 3.5}
              fill={team.primaryColor}
              stroke={isPlayer ? '#ffffff' : 'none'}
              strokeWidth={isPlayer ? 1.5 : 0}
              opacity={0.9}
            />
          )
        })}
    </svg>
  )
}
