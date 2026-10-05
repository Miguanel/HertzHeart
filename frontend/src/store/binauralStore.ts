import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
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
  select: (id: string) => void
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

export const useBinaural = create<BinauralState>()(
  persist(
    (set, get) => ({
      waves: [first],
      selectedId: first.id,
      playing: [],
      select: (selectedId) => set({ selectedId }),
      add: (w) => {
        const wave = makeWave(w)
        set((s) => ({ waves: [...s.waves, wave], selectedId: wave.id }))
        return wave.id
      },
      duplicate: (id) => {
        const src = get().waves.find((w) => w.id === id)
        if (!src) return
        const copy = { ...src, id: newId(), name: `${src.name} (kopia)` }
        set((s) => {
          const i = s.waves.findIndex((w) => w.id === id)
          const waves = [...s.waves]
          waves.splice(i + 1, 0, copy)
          return { waves, selectedId: copy.id }
        })
      },
      update: (id, patch) => set((s) => ({ waves: s.waves.map((w) => (w.id === id ? { ...w, ...sanitize(patch) } : w)) })),
      remove: (id) =>
        set((s) => {
          const waves = s.waves.filter((w) => w.id !== id)
          return {
            waves,
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
      partialize: (s) => ({ waves: s.waves, selectedId: s.selectedId }),
    },
  ),
)
