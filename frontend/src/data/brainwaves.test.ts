import { describe, expect, it } from 'vitest'
import { createClip, createTrack } from '../model/envelope'
import { trackGainPoints } from '../audio/schedule'
import { detectCouplings, matchFrequency } from './brainwaves'

describe('fale mózgowe', () => {
  it('przypisuje częstotliwość do podsekcji i zjawisk', () => {
    expect(matchFrequency(7).band?.id).toBe('theta-fm')
    expect(matchFrequency(7).phenomena.map((p) => p.id)).toContain('theta-hippo')
    expect(matchFrequency(14).phenomena.map((p) => p.id)).toEqual(['spindles-fast', 'smr-classic'])
    expect(matchFrequency(3).phenomena[0].tone).toBe('warn')
    expect(matchFrequency(1000).band?.id).toBe('ultra-fast')
    expect(matchFrequency(1500).band).toBeNull()
    expect(matchFrequency(0.05).band?.id).toBe('isf')
  })

  it('wykrywa sprzężenia CFC, gdy występują wszystkie składniki', () => {
    expect(detectCouplings([6, 40]).map((c) => c.coupling.id)).toContain('theta-gamma')
    expect(detectCouplings([1, 14, 200]).map((c) => c.coupling.id)).toContain('so-spindle-ripple')
    expect(detectCouplings([1, 14]).map((c) => c.coupling.id)).not.toContain('so-spindle-ripple')
    // jedna częstotliwość nie może być jednocześnie thetą i alfą
    expect(detectCouplings([8]).map((c) => c.coupling.id)).not.toContain('theta-alpha')
  })
})

describe('obwiednia ścieżki', () => {
  it('ma łagodne krawędzie i ciszę między segmentami', () => {
    const track = createTrack('t', 440_000, { clips: [createClip(0, 10, 'constant'), createClip(20, 10, 'constant')] })
    const pts = trackGainPoints(track)
    expect(pts[0]).toMatchObject({ t: 0, v: 0 })
    expect(pts.at(-1)).toMatchObject({ t: 30, v: 0 })
    for (let i = 1; i < pts.length; i++) expect(pts[i].t).toBeGreaterThan(pts[i - 1].t)
  })

  it('łączy stykające się segmenty bez przerwy', () => {
    const track = createTrack('t', 440_000, { clips: [createClip(0, 10, 'constant'), createClip(10, 10, 'constant')] })
    const pts = trackGainPoints(track)
    expect(pts.filter((p) => p.v === 0)).toHaveLength(2)
  })

  it('wyciszona ścieżka nie gra', () => {
    const track = { ...createTrack('t', 440_000), muted: true }
    expect(trackGainPoints(track)).toEqual([])
  })
})
