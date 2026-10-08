import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { BRAIN_BANDS, bandRange } from '../data/brainwaves'
import { newId } from '../model/envelope'
import { quantizeMilliHz } from '../model/frequency'
import { clamp } from '../model/time'

/** Zakresy pokręteł [mHz]. */
export const CARRIER_MIN = 20_000
export const CARRIER_MAX = 1_500_000
export const BEAT_MIN = 1 // 0,001 Hz
export const BEAT_MAX = 1_000_000 // 1000 Hz

export interface BinauralWave {
  id: string
  name: string
  /** Częstotliwość nośna (lewy kanał) [mHz]. */
  carrierMilliHz: number
  /** Częstotliwość wynikowa (dudnienie = prawy − lewy) [mHz]. */
  beatMilliHz: number
  volume: number
}

interface BinauralState {
  waves: BinauralWave[]
  selectedId: string | null
  /** Grające fale (niezapisywane – po odświeżeniu strony nic nie gra samo). */
  playing: string[]
  /** Warstwy pokazane razem w generatorze (kolejne fale binauralne edytowane i odtwarzane wspólnie). */
  stack: string[]
  select: (id: string) => void
  /** Ustawia aktywną warstwę bez zmiany zestawu warstw. */
  focus: (id: string) => void
  /** Dodaje kolejną falę jako nową warstwę: sąsiedni zakres fal mózgowych i inna nośna. */
  addLayer: () => string
  /** Usuwa warstwę z generatora (fala zostaje na liście). */
  removeLayer: (id: string) => void
  playStack: () => void
  stopStack: () => void
  add: (wave?: Partial<Omit<BinauralWave, 'id'>>) => string
  duplicate: (id: string) => void
  update: (id: string, patch: Partial<Omit<BinauralWave, 'id'>>) => void
  remove: (id: string) => void
  togglePlaying: (id: string) => void
  stopAll: () => void
}

const sanitize = (patch: Partial<Omit<BinauralWave, 'id'>>) => {
  const out = { ...patch }
  if (out.carrierMilliHz !== undefined) out.carrierMilliHz = quantizeMilliHz(clamp(out.carrierMilliHz, CARRIER_MIN, CARRIER_MAX))
  if (out.beatMilliHz !== undefined) out.beatMilliHz = quantizeMilliHz(clamp(out.beatMilliHz, BEAT_MIN, BEAT_MAX))
  if (out.volume !== undefined) out.volume = clamp(out.volume, 0, 1)
  if (out.name !== undefined) out.name = out.name.slice(0, 80)
  return out
}

const makeWave = (w: Partial<Omit<BinauralWave, 'id'>> = {}): BinauralWave => ({
  id: newId(),
  name: 'Fala binauralna',
  carrierMilliHz: 200_000,
  beatMilliHz: 10_000,
  volume: 0.6,
  ...sanitize(w),
})

const first = makeWave({ name: 'Alfa 10 Hz' })

/** Warstwy istniejących fal; starsze zapisy nie miały warstw – wtedy warstwą jest wybrana fala. */
export function stackOf(s: Pick<BinauralState, 'stack' | 'waves' | 'selectedId'>): string[] {
  const ids = new Set(s.waves.map((w) => w.id))
  const stack = (s.stack ?? []).filter((id) => ids.has(id))
  if (stack.length) return stack
  return s.selectedId && ids.has(s.selectedId) ? [s.selectedId] : s.waves[0] ? [s.waves[0].id] : []
}

export const useBinaural = create<BinauralState>()(
  persist(
    (set, get) => ({
      waves: [first],
      selectedId: first.id,
      playing: [],
      stack: [first.id],
      select: (selectedId) => set((s) => ({ selectedId, stack: stackOf(s).includes(selectedId) ? stackOf(s) : [selectedId] })),
      focus: (selectedId) => set({ selectedId }),
      add: (w) => {
        const wave = makeWave(w)
        set((s) => ({ waves: [...s.waves, wave], selectedId: wave.id, stack: [wave.id] }))
        return wave.id
      },
      addLayer: () => {
        const s = get()
        const stack = stackOf(s)
        const last = s.waves.find((w) => w.id === stack[stack.length - 1])
        const beat = (last?.beatMilliHz ?? 10_000) / 1000
        const idx = Math.max(0, BRAIN_BANDS.findIndex((b) => beat >= b.min && beat <= b.max))
        // kolejny zakres: następne pasmo (dudnienie binauralne ma sens mniej więcej do 100 Hz), inaczej poprzednie
        const nextIdx = BRAIN_BANDS[idx + 1] && BRAIN_BANDS[idx + 1].max <= 100 ? idx + 1 : Math.max(0, idx - 1)
        const band = BRAIN_BANDS[nextIdx]
        const carrier = last ? last.carrierMilliHz + 40_000 : 200_000
        const wave = makeWave({
          name: `${band.name} · ${bandRange(band)}`,
          beatMilliHz: Math.round(Math.sqrt(band.min * band.max) * 1000),
          carrierMilliHz: carrier > 1_000_000 ? Math.max(CARRIER_MIN, (last?.carrierMilliHz ?? 200_000) - 40_000) : carrier,
          volume: last?.volume ?? 0.6,
        })
        set((st) => ({ waves: [...st.waves, wave], selectedId: wave.id, stack: [...stackOf(st), wave.id] }))
        return wave.id
      },
      removeLayer: (id) =>
        set((s) => {
          const stack = stackOf(s).filter((x) => x !== id)
          return { stack, selectedId: s.selectedId === id ? (stack[stack.length - 1] ?? s.selectedId) : s.selectedId }
        }),
      playStack: () => set((s) => ({ playing: [...new Set([...s.playing, ...stackOf(s)])] })),
      stopStack: () => set((s) => ({ playing: s.playing.filter((p) => !stackOf(s).includes(p)) })),
      duplicate: (id) => {
        const src = get().waves.find((w) => w.id === id)
        if (!src) return
        const copy = { ...src, id: newId(), name: `${src.name} (kopia)` }
        set((s) => {
          const i = s.waves.findIndex((w) => w.id === id)
          const waves = [...s.waves]
          waves.splice(i + 1, 0, copy)
          return { waves, selectedId: copy.id, stack: [...stackOf(s), copy.id] }
        })
      },
      update: (id, patch) => set((s) => ({ waves: s.waves.map((w) => (w.id === id ? { ...w, ...sanitize(patch) } : w)) })),
      remove: (id) =>
        set((s) => {
          const waves = s.waves.filter((w) => w.id !== id)
          const stack = stackOf(s).filter((x) => x !== id)
          return {
            waves,
            stack: stack.length ? stack : waves[0] ? [waves[0].id] : [],
            playing: s.playing.filter((p) => p !== id),
            selectedId: s.selectedId === id ? (waves[0]?.id ?? null) : s.selectedId,
          }
        }),
      togglePlaying: (id) => set((s) => ({ playing: s.playing.includes(id) ? s.playing.filter((p) => p !== id) : [...s.playing, id] })),
      stopAll: () => set({ playing: [] }),
    }),
    {
      name: 'heartzheart:binaural',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ waves: s.waves, selectedId: s.selectedId, stack: s.stack }),
    },
  ),
)
