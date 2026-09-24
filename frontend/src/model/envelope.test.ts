import { describe, expect, it } from 'vitest'
import { makePreset, normalizeEnvelope, scaleEnvelope, valueAt } from './envelope'
import { formatHz, parseHz } from './frequency'
import type { EnvelopePoint } from './schema'

const p = (t: number, v: number, curve: 'linear' | 'hold' = 'linear'): EnvelopePoint => ({ id: `${t}`, t, v, curve })

describe('valueAt', () => {
  it('interpoluje liniowo', () => {
    expect(valueAt([p(0, 0), p(10, 1)], 5)).toBeCloseTo(0.5)
  })
  it('trzyma wartość dla odcinka hold', () => {
    const pts = [p(0, 0.2), p(10, 1, 'hold')]
    expect(valueAt(pts, 9.99)).toBe(0.2)
    expect(valueAt(pts, 10)).toBe(1)
  })
  it('poza zakresem zwraca skrajne wartości', () => {
    expect(valueAt([p(1, 0.3), p(2, 0.6)], 0)).toBe(0.3)
    expect(valueAt([p(1, 0.3), p(2, 0.6)], 5)).toBe(0.6)
  })
})

describe('normalizeEnvelope', () => {
  it('dodaje punkty na krańcach i sortuje', () => {
    const out = normalizeEnvelope([p(8, 0.5), p(2, 1)], 10)
    expect(out.map((x) => x.t)).toEqual([0, 2, 8, 10])
  })
  it('skaluje proporcjonalnie', () => {
    const out = scaleEnvelope([p(0, 0), p(5, 1), p(10, 0)], 10, 20)
    expect(out.map((x) => x.t)).toEqual([0, 10, 20])
  })
})

describe('presety', () => {
  it('fade in/out zaczyna i kończy się ciszą', () => {
    const pts = makePreset('fadeInOut', 60)
    expect(pts[0].v).toBe(0)
    expect(pts.at(-1)!.v).toBe(0)
    expect(pts.at(-1)!.t).toBe(60)
  })
})

describe('częstotliwość', () => {
  it('parsuje i formatuje 3 miejsca po przecinku', () => {
    expect(parseHz('777,778')).toBe(777778)
    expect(parseHz('440')).toBe(440000)
    expect(parseHz('0.5')).toBeNull()
    expect(parseHz('12.3456')).toBeNull()
    expect(formatHz(777778)).toBe('777.778')
    expect(formatHz(1000)).toBe('1.000')
  })
})
