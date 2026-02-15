import type { TireCompound } from '../data/types'

const COMPOUND_STYLES: Record<TireCompound, { bg: string; text: string; letter: string }> = {
  soft: { bg: '#dc0000', text: '#ffffff', letter: 'S' },
  medium: { bg: '#ffd700', text: '#000000', letter: 'M' },
  hard: { bg: '#ffffff', text: '#000000', letter: 'H' },
  intermediate: { bg: '#00c853', text: '#ffffff', letter: 'I' },
  wet: { bg: '#0090ff', text: '#ffffff', letter: 'W' },
}

const SIZES = { sm: 16, md: 24, lg: 32 } as const

interface TireCompoundIconProps {
  compound: TireCompound
  size?: keyof typeof SIZES
}

export function TireCompoundIcon({ compound, size = 'md' }: TireCompoundIconProps) {
  const style = COMPOUND_STYLES[compound]
  const px = SIZES[size]
  const fontSize = size === 'sm' ? 7 : size === 'md' ? 9 : 12

  return (
    <div
      className="inline-flex items-center justify-center rounded-full font-pixel font-bold shrink-0"
      style={{
        width: px,
        height: px,
        backgroundColor: style.bg,
        color: style.text,
        fontSize,
        lineHeight: 1,
      }}
    >
      {style.letter}
    </div>
  )
}
