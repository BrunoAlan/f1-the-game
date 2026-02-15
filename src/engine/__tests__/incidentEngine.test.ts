import { describe, it, expect } from 'vitest'
import { checkForIncident, compressGaps } from '../incidentEngine'

describe('checkForIncident', () => {
  it('returns an incident result', () => {
    const result = checkForIncident({ aggression: 50, reliability: 80 })
    expect(result).toHaveProperty('type')
    expect(['none', 'spin', 'mechanical', 'collision']).toContain(result.type)
  })
})

describe('compressGaps', () => {
  it('compresses all gaps to 0.2', () => {
    const gaps = [0, 1.5, 3.2, 8.0]
    const compressed = compressGaps(gaps)
    for (let i = 1; i < compressed.length; i++) {
      expect(compressed[i] - compressed[i - 1]).toBeCloseTo(0.2)
    }
  })
})
