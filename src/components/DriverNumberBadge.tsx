const SIZES = { sm: 20, md: 28, lg: 36 } as const

interface DriverNumberBadgeProps {
  number: number
  teamColor: string
  size?: keyof typeof SIZES
}

function getContrastText(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#000000' : '#ffffff'
}

export function DriverNumberBadge({ number, teamColor, size = 'md' }: DriverNumberBadgeProps) {
  const px = SIZES[size]
  const fontSize = size === 'sm' ? 7 : size === 'md' ? 9 : 12

  return (
    <div
      className="inline-flex items-center justify-center rounded-sm font-pixel font-bold shrink-0"
      style={{
        width: px,
        height: px,
        backgroundColor: teamColor,
        color: getContrastText(teamColor),
        fontSize,
        lineHeight: 1,
      }}
    >
      {number}
    </div>
  )
}
