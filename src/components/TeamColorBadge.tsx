interface TeamColorBadgeProps {
  abbreviation: string
  color: string
  size?: 'sm' | 'lg'
}

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5
}

export function TeamColorBadge({ abbreviation, color, size = 'lg' }: TeamColorBadgeProps) {
  const textColor = isLightColor(color) ? '#0a0a0f' : '#ffffff'
  const dimensions = size === 'lg' ? 'w-10 h-10' : 'w-7 h-7'
  const fontSize = size === 'lg' ? 'text-[9px]' : 'text-[7px]'

  return (
    <div
      className={`${dimensions} flex items-center justify-center font-pixel ${fontSize} rounded-sm shrink-0`}
      style={{ backgroundColor: color, color: textColor }}
    >
      {abbreviation}
    </div>
  )
}
