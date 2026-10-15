import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import { newId } from '../model/envelope'
import type { SwayAnalysis } from '../sway/analysis'

/** Sposób pomiaru: telefon w dłoni (bujanie telefonem) albo przy klatce piersiowej (postawa całego ciała). */
export type SwayMode = 'hand' | 'body'

export const SWAY_DURATIONS = [20, 30, 60, 120] as const
export const HISTORY_LIMIT = 30

export interface SwayMeasurement {
  id: string
  /** Data pomiaru (ISO 8601). */
  at: string
  mode: SwayMode
  analysis: SwayAnalysis
}

interface SwayState {
  mode: SwayMode
  /** Czas pomiaru [s]. */
  duration: number
  history: SwayMeasurement[]
  setMode: (mode: SwayMode) => void
  setDuration: (seconds: number) => void
  /** Zapisuje wynik w historii (najnowszy na początku) i zwraca jego id. */
  save: (mode: SwayMode, analysis: SwayAnalysis) => string
  remove: (id: string) => void
}

const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name)
    } catch {
      return null
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value)
    } catch {
      /* brak miejsca lub tryb prywatny – historia zostaje tylko w pamięci */
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name)
    } catch {
      /* pomijamy */
    }
  },
}

/** Zaokrągla widmo do 4 cyfr znaczących – historia zajmuje kilka razy mniej miejsca. */
const compact = (a: SwayAnalysis): SwayAnalysis => ({
  ...a,
  spectrum: { hz: a.spectrum.hz.map((v) => Number(v.toPrecision(4))), power: a.spectrum.power.map((v) => Number(v.toPrecision(3))) },
})

export const useSway = create<SwayState>()(
  persist(
    (set) => ({
      mode: 'hand',
      duration: 30,
      history: [],
      setMode: (mode) => set({ mode }),
      setDuration: (duration) => set({ duration }),
      save: (mode, analysis) => {
        const m: SwayMeasurement = { id: newId(), at: new Date().toISOString(), mode, analysis: compact(analysis) }
        set((s) => ({ history: [m, ...s.history].slice(0, HISTORY_LIMIT) }))
        return m.id
      },
      remove: (id) => set((s) => ({ history: s.history.filter((h) => h.id !== id) })),
    }),
    {
      name: 'heartzheart:sway',
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ mode: s.mode, duration: s.duration, history: s.history }),
    },
  ),
)
