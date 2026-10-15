import { describe, expect, it } from 'vitest'
import { analyzeSway, fft, syntheticSamples, type MotionSample } from './analysis'
import { FINDINGS, SOURCES, findingsFor } from './research'

describe('analiza bujania', () => {
  it('FFT daje prążek w odpowiednim miejscu', () => {
    const n = 64
    const re = new Float64Array(n)
    const im = new Float64Array(n)
    for (let i = 0; i < n; i++) re[i] = Math.cos((2 * Math.PI * 5 * i) / n)
    fft(re, im)
    expect(Math.hypot(re[5], im[5])).toBeCloseTo(32, 6)
    expect(Math.hypot(re[6], im[6])).toBeLessThan(1e-9)
  })

  it.each([0.083, 0.25, 0.618, 1.234, 2.05])('znajduje rytm bujania %f Hz z dokładnością 0,005 Hz (60 s, nierówne próbkowanie)', (hz: number) => {
    const a = analyzeSway(syntheticSamples({ seconds: 60, swayHz: hz, seed: 3 }), 'gyro')!
    expect(a.sway).not.toBeNull()
    expect(Math.abs(a.sway!.hz - hz)).toBeLessThan(0.005)
    expect(a.swayQuality).toBe('clear')
  })

  it('oddziela szybkie drgania (drżenie fizjologiczne) od bujania', () => {
    const a = analyzeSway(syntheticSamples({ seconds: 30, swayHz: 0.4, tremorHz: 9.2, tremorDegS: 4 }), 'gyro')!
    expect(Math.abs(a.sway!.hz - 0.4)).toBeLessThan(0.01)
    expect(Math.abs(a.tremor!.hz - 9.2)).toBeLessThan(0.02)
    expect(a.tremorQuality).not.toBe('weak')
  })

  it('szacuje wychylenie kąta z prędkości kątowej', () => {
    // 25 °/s · 0,8 (oś x) przy 0,25 Hz → amplituda kąta ≈ v / (2πf); suma osi ≈ 25·√(0,8²+0,35²+0,15²) ≈ 22,3 °/s
    const a = analyzeSway(syntheticSamples({ seconds: 60, swayHz: 0.25, noise: 0.2 }), 'gyro')!
    const expected = (25 * Math.hypot(0.8, 0.35, 0.15)) / (2 * Math.PI * 0.25)
    expect(a.swayAngleDeg!).toBeGreaterThan(expected * 0.85)
    expect(a.swayAngleDeg!).toBeLessThan(expected * 1.1)
  })

  it('pomija znikome szybkie drgania (poniżej szumu czujnika)', () => {
    const a = analyzeSway(syntheticSamples({ seconds: 30, swayHz: 1.1, swayDegS: 12, tremorDegS: 0.03, noise: 0.02 }), 'gyro')!
    expect(a.swayQuality).toBe('clear')
    expect(a.tremorQuality).toBe('weak')
  })

  it('przy szumie bez rytmu zgłasza słaby wynik', () => {
    const s = syntheticSamples({ seconds: 30, swayHz: 0.5, swayDegS: 0, tremorDegS: 0, noise: 2 })
    const a = analyzeSway(s, 'gyro')!
    expect(a.swayQuality).toBe('weak')
  })

  it('pasma posturograficzne sumują się do 1, a wolne bujanie trafia do pasma niskiego', () => {
    const a = analyzeSway(syntheticSamples({ seconds: 40, swayHz: 0.3 }), 'gyro')!
    expect(a.bands.reduce((s, b) => s + b.share, 0)).toBeCloseTo(1, 6)
    expect(a.bands[0].share).toBeGreaterThan(0.9)
  })

  it('odrzuca zbyt krótkie nagranie', () => {
    expect(analyzeSway(syntheticSamples({ seconds: 3, swayHz: 1 }), 'gyro')).toBeNull()
    expect(analyzeSway([] as MotionSample[], 'gyro')).toBeNull()
  })

  it('wykrywa przerwę w danych (np. zablokowany ekran)', () => {
    const s = syntheticSamples({ seconds: 30, swayHz: 0.5 }).filter((p) => p.t < 10_000 || p.t > 13_000)
    expect(analyzeSway(s, 'gyro')!.maxGap).toBeGreaterThan(2.9)
  })
})

describe('interpretacje i źródła', () => {
  it('każdy opis ma istniejące źródło z adresem https', () => {
    for (const f of FINDINGS) {
      expect(f.sources.length).toBeGreaterThan(0)
      for (const id of f.sources) expect(SOURCES[id]?.url).toMatch(/^https:\/\//)
    }
  })

  it('dobiera opisy do częstotliwości', () => {
    expect(findingsFor(0.25, 'sway').map((f) => f.id)).toEqual(['visuo-vestibular', 'breathing', 'rocking-sleep', 'motion-sickness'])
    expect(findingsFor(2, 'sway').map((f) => f.id)).toEqual(['locomotion', 'proprioceptive'])
    expect(findingsFor(9.5, 'tremor').map((f) => f.id)).toEqual(['proprioceptive', 'tremor-physiological'])
    expect(findingsFor(6, 'tremor').map((f) => f.id)).toContain('tremor-4-8')
    expect(findingsFor(6, 'sway')).toHaveLength(1)
  })
})
