import { describe, it, expect } from 'vitest'
import { formatLapTime, formatGap } from '../formatTime'

describe('formatLapTime', () => {
  it('formats seconds to m:ss.sss', () => {
    expect(formatLapTime(78.432)).toBe('1:18.432')
  })

  it('handles times over 2 minutes', () => {
    expect(formatLapTime(125.1)).toBe('2:05.100')
  })
})

describe('formatGap', () => {
  it('formats positive gap', () => {
    expect(formatGap(1.234)).toBe('+1.234')
  })

  it('formats leader', () => {
    expect(formatGap(0)).toBe('LEADER')
  })
})
