import type { WeatherCondition } from '../data/types'

interface WeatherBadgeProps {
  weather: WeatherCondition
}

const weatherDisplay: Record<WeatherCondition, { emoji: string; label: string }> = {
  dry: { emoji: '\u2600\uFE0F', label: 'DRY' },
  'light-rain': { emoji: '\uD83C\uDF27\uFE0F', label: 'LIGHT RAIN' },
  'heavy-rain': { emoji: '\u26C8\uFE0F', label: 'HEAVY RAIN' },
}

export function WeatherBadge({ weather }: WeatherBadgeProps) {
  const { emoji, label } = weatherDisplay[weather]
  const isRain = weather !== 'dry'

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 font-pixel text-[10px] text-f1-text ${
        isRain ? 'bg-blue-900/50 rounded' : ''
      }`}
    >
      <span>{emoji}</span>
      <span>{label}</span>
    </span>
  )
}
