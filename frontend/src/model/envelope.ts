import type { Clip, Composition, EnvelopePoint, Track } from './schema'
import { MIN_CLIP_S } from './schema'
import { clamp, round } from './time'

/** Losowe id; działa także poza „secure context” (np. test na telefonie przez IP w sieci LAN). */
export function newId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

type PointLike = Pick<EnvelopePoint, 't' | 'v' | 'curve'>

/** Wartość obwiedni w chwili t (sekundy względem początku segmentu). Punkty muszą być posortowane. */
export function valueAt(points: readonly PointLike[], t: number): number {
  if (points.length === 0) return 0
  if (t <= points[0].t) return points[0].v
  for (let i = 1; i < points.length; i++) {
    const b = points[i]
    if (t <= b.t) {
      const a = points[i - 1]
      if (b.curve === 'hold') return t < b.t ? a.v : b.v
      const span = b.t - a.t
      return span <= 0 ? b.v : a.v + ((b.v - a.v) * (t - a.t)) / span
    }
  }
  return points[points.length - 1].v
}

/** Sortuje, przycina do [0, duration], gwarantuje punkt na początku i na końcu segmentu. */
export function normalizeEnvelope(points: readonly EnvelopePoint[], duration: number): EnvelopePoint[] {
  const sorted = points
    .map((p) => ({ ...p, t: round(clamp(p.t, 0, duration)), v: round(clamp(p.v, 0, 1)) }))
    .sort((a, b) => a.t - b.t)
  if (sorted.length === 0) sorted.push({ id: newId(), t: 0, v: 0, curve: 'linear' })
  if (sorted[0].t > 0) sorted.unshift({ id: newId(), t: 0, v: sorted[0].v, curve: 'linear' })
  const last = sorted[sorted.length - 1]
  if (last.t < duration) sorted.push({ id: newId(), t: duration, v: last.v, curve: 'linear' })
  sorted[0] = { ...sorted[0], curve: 'linear' }
  return sorted
}

export function scaleEnvelope(points: readonly EnvelopePoint[], from: number, to: number): EnvelopePoint[] {
  const k = from > 0 ? to / from : 1
  return normalizeEnvelope(points.map((p) => ({ ...p, t: p.t * k })), to)
}

export type PresetId = 'constant' | 'fadeIn' | 'fadeOut' | 'fadeInOut' | 'swell' | 'pulse'

export const PRESETS: { id: PresetId; label: string }[] = [
  { id: 'fadeInOut', label: 'Wejście + wyjście' },
  { id: 'fadeIn', label: 'Narastanie' },
  { id: 'fadeOut', label: 'Wygaszanie' },
  { id: 'constant', label: 'Stały poziom' },
  { id: 'swell', label: 'Fala' },
  { id: 'pulse', label: 'Pulsowanie' },
]

export interface PresetOptions {
  level: number
  fade: number
  pulses: number
}

export const DEFAULT_PRESET_OPTIONS: PresetOptions = { level: 0.8, fade: 5, pulses: 4 }

export function makePreset(id: PresetId, duration: number, opts: PresetOptions = DEFAULT_PRESET_OPTIONS): EnvelopePoint[] {
  const L = clamp(opts.level, 0, 1)
  const d = duration
  const f = clamp(opts.fade, 0, d / 2)
  const pts: [number, number][] = (() => {
    switch (id) {
      case 'constant':
        return [[0, L], [d, L]]
      case 'fadeIn':
        return [[0, 0], [clamp(opts.fade, 0, d), L], [d, L]]
      case 'fadeOut':
        return [[0, L], [d - clamp(opts.fade, 0, d), L], [d, 0]]
      case 'fadeInOut':
        return [[0, 0], [f, L], [d - f, L], [d, 0]]
      case 'swell':
        return [[0, 0], [d / 2, L], [d, 0]]
      case 'pulse': {
        const n = Math.max(1, Math.round(opts.pulses))
        const period = d / n
        const low = L * 0.15
        const out: [number, number][] = [[0, low]]
        for (let k = 0; k < n; k++) {
          out.push([k * period + period / 2, L], [(k + 1) * period, low])
        }
        return out
      }
    }
  })()
  return normalizeEnvelope(
    pts.map(([t, v]) => ({ id: newId(), t, v, curve: 'linear' as const })),
    d,
  )
}

export function createClip(start: number, duration = 60): Clip {
  const d = Math.max(MIN_CLIP_S, duration)
  return { id: newId(), start: round(start), duration: round(d), envelope: makePreset('fadeInOut', d) }
}

export function createTrack(name: string, frequencyMilliHz: number, libraryRef?: string): Track {
  return {
    id: newId(),
    name,
    frequencyMilliHz,
    ...(libraryRef ? { libraryRef } : {}),
    waveform: 'sine',
    volume: 0.8,
    muted: false,
    clips: [createClip(0)],
  }
}

export function createComposition(title = 'Nowy projekt'): Composition {
  const now = new Date().toISOString()
  return { schemaVersion: 1, id: newId(), title, createdAt: now, updatedAt: now, masterVolume: 0.5, tracks: [] }
}

export function compositionDuration(comp: Composition): number {
  let end = 0
  for (const t of comp.tracks) for (const c of t.clips) end = Math.max(end, c.start + c.duration)
  return end
}

export const TRACK_COLORS = ['#22e4ff', '#c86bff', '#9dff6b', '#ffb547', '#ff5fa2', '#5f8bff', '#3dffc5', '#ff7a45']
export const trackColor = (index: number) => TRACK_COLORS[index % TRACK_COLORS.length]
