import { teamLogos } from '../data/teamLogos'

interface TeamLogoProps {
  teamId: string
  size: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZES = { sm: 16, md: 24, lg: 32 }

export function TeamLogo({ teamId, size, className = '' }: TeamLogoProps) {
  const src = teamLogos[teamId]
  if (!src) return null

  const px = SIZES[size]

  return (
    <img
      src={src}
      alt=""
      width={px}
      height={px}
      className={`shrink-0 ${className}`}
      style={{ imageRendering: 'pixelated' }}
      draggable={false}
    />
  )
}
