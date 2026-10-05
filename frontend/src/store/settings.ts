import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import { clamp } from '../model/time'

/** Maksymalna liczba miejsc po przecinku (0,0000001 Hz). */
export const MAX_DECIMALS = 7
export const MIN_SMOOTHING_S = 0.05
export const MAX_SMOOTHING_S = 5

export interface SettingsState {
  /** Ile miejsc po przecinku pokazywać i przyjmować przy częstotliwościach (0–7). */
  decimals: number
  /** Czas bufora łagodzącego zmiany [s] – każda zmiana w trakcie odtwarzania przechodzi płynnie w tym czasie. */
  smoothing: number
  /** Łagodne wejście/wyjście przy starcie, pauzie i przewijaniu. */
  smoothTransport: boolean
  /** Informowanie o pasmach fal mózgowych przy wpisywaniu częstotliwości. */
  brainwaveNotices: boolean
  /** Tryb prosty: bez opisów i analiz – szybkie uruchamianie projektów i fal. */
  simpleMode: boolean
  /** Czy rysunek mózgu jest rozwinięty (zapamiętane między oknami). */
  brainMapOpen: boolean
  setDecimals: (decimals: number) => void
  setSmoothing: (seconds: number) => void
  setSmoothTransport: (on: boolean) => void
  setBrainwaveNotices: (on: boolean) => void
  setSimpleMode: (on: boolean) => void
  setBrainMapOpen: (open: boolean) => void
}

/** localStorage bywa niedostępny (tryb prywatny) – wtedy ustawienia żyją tylko w pamięci. */
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
      /* pomijamy */
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

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      decimals: 3,
      smoothing: 1,
      smoothTransport: true,
      brainwaveNotices: true,
      simpleMode: false,
      brainMapOpen: false,
      setDecimals: (decimals) => set({ decimals: clamp(Math.round(decimals), 0, MAX_DECIMALS) }),
      setSmoothing: (seconds) => set({ smoothing: clamp(seconds, MIN_SMOOTHING_S, MAX_SMOOTHING_S) }),
      setSmoothTransport: (smoothTransport) => set({ smoothTransport }),
      setBrainwaveNotices: (brainwaveNotices) => set({ brainwaveNotices }),
      setSimpleMode: (simpleMode) => set({ simpleMode }),
      setBrainMapOpen: (brainMapOpen) => set({ brainMapOpen }),
    }),
    { name: 'heartzheart:settings', version: 1, storage: createJSONStorage(() => safeStorage) },
  ),
)

/** Czas bufora dla zmian w projekcie i generatorze binauralnym. */
export const smoothingTime = () => useSettings.getState().smoothing

/** Czas wejścia/wyjścia przy starcie, pauzie i stopie. */
export const transportFade = () => {
  const s = useSettings.getState()
  return s.smoothTransport ? Math.min(s.smoothing, 1.5) : 0.03
}

/** Czas przenikania przy przewijaniu – krótszy, bo przewijanie suwakiem generuje wiele zdarzeń. */
export const seekFade = () => {
  const s = useSettings.getState()
  return s.smoothTransport ? Math.min(s.smoothing, 0.3) : 0.03
}
