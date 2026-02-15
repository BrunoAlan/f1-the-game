import { motion } from 'framer-motion'

type BadgeType =
  | 'pit'
  | 'dnf'
  | 'fastest-lap'
  | 'position-up'
  | 'position-down'
  | 'safety-car'
  | 'eliminated'

interface StatusBadgeProps {
  type: BadgeType
  value?: number // for position changes (+2, -1)
}

const BADGE_CONFIG: Record<
  BadgeType,
  { bg: string; text: string; label: string; pulse?: boolean }
> = {
  pit: { bg: '#ffd700', text: '#000000', label: 'PIT', pulse: true },
  dnf: { bg: '#ff2a6d', text: '#ffffff', label: 'DNF' },
  'fastest-lap': { bg: '#a855f7', text: '#ffffff', label: 'FL', pulse: true },
  'position-up': { bg: '#00ff41', text: '#000000', label: '' },
  'position-down': { bg: '#ff2a6d', text: '#ffffff', label: '' },
  'safety-car': { bg: '#ffd700', text: '#000000', label: 'SC' },
  eliminated: { bg: '#ff2a6d', text: '#ffffff', label: 'OUT' },
}

export function StatusBadge({ type, value }: StatusBadgeProps) {
  const config = BADGE_CONFIG[type]

  const label =
    type === 'position-up'
      ? `▲${value ?? ''}`
      : type === 'position-down'
        ? `▼${value ?? ''}`
        : config.label

  const badge = (
    <span
      className="inline-flex items-center justify-center rounded-sm font-pixel text-[7px] px-1.5 py-0.5 leading-none"
      style={{ backgroundColor: config.bg, color: config.text }}
    >
      {label}
    </span>
  )

  if (config.pulse) {
    return (
      <motion.span
        animate={{ opacity: [1, 0.5, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {badge}
      </motion.span>
    )
  }

  if (type === 'position-up' || type === 'position-down') {
    return (
      <motion.span
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: 1.5, duration: 0.5 }}
      >
        {badge}
      </motion.span>
    )
  }

  return badge
}
