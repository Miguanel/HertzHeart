import { MAX_FREQ_MHZ, MIN_FREQ_MHZ } from './schema'

/** Najmniejsza obsługiwana jednostka: 0,0000001 Hz = 0,0001 mHz. */
const UNITS_PER_HZ = 10_000_000
const UNITS_PER_MHZ = 10_000
export const MAX_FREQ_DECIMALS = 7

/** Zaokrągla wartość w mHz do rozdzielczości 0,0000001 Hz (usuwa szum zmiennoprzecinkowy). */
export const quantizeMilliHz = (mHz: number) => Math.round(mHz * UNITS_PER_MHZ) / UNITS_PER_MHZ

/** 777778 -> "777.778"; z `decimals` = 7: 7830.0001 -> "7.8300001" (bez błędów zaokrągleń float). */
export function formatHz(mHz: number, decimals = 3): string {
  const d = Math.max(0, Math.min(MAX_FREQ_DECIMALS, Math.round(decimals)))
  const step = 10 ** (MAX_FREQ_DECIMALS - d)
  const units = Math.round(Math.round(Math.abs(mHz) * UNITS_PER_MHZ) / step) * step
  const sign = mHz < 0 ? '-' : ''
  const whole = Math.floor(units / UNITS_PER_HZ)
  if (d === 0) return `${sign}${whole}`
  const frac = String(units % UNITS_PER_HZ).padStart(MAX_FREQ_DECIMALS, '0').slice(0, d)
  return `${sign}${whole}.${frac}`
}

export interface ParseHzOptions {
  /** Maksymalna liczba miejsc po przecinku (domyślnie 3). */
  decimals?: number
  min?: number
  max?: number
}

/** "777,778" / "777.778" / "777" -> 777778 (mHz). Zwraca null dla błędnych wartości. */
export function parseHz(input: string, { decimals = 3, min = MIN_FREQ_MHZ, max = MAX_FREQ_MHZ }: ParseHzOptions = {}): number | null {
  const text = input.trim().replace(',', '.')
  const match = /^(\d{0,5})(?:\.(\d*))?$/.exec(text)
  if (!match || (!match[1] && !match[2])) return null
  const frac = match[2] ?? ''
  if (frac.length > Math.min(decimals, MAX_FREQ_DECIMALS)) return null
  const units = Number(match[1] || '0') * UNITS_PER_HZ + Number(frac.padEnd(MAX_FREQ_DECIMALS, '0'))
  const mHz = units / UNITS_PER_MHZ
  if (mHz < min || mHz > max) return null
  return mHz
}

/** Przykład zakresu do komunikatów, np. „1–20 000 Hz, maks. 3 miejsca po przecinku”. */
export function decimalsLabel(decimals: number): string {
  if (decimals === 0) return 'bez miejsc po przecinku'
  if (decimals === 1) return 'maks. 1 miejsce po przecinku'
  return `maks. ${decimals} miejsc${decimals < 5 ? 'a' : ''} po przecinku`
}

export const WAVEFORM_LABELS = {
  sine: 'Sinus',
  triangle: 'Trójkąt',
  square: 'Prostokąt',
  sawtooth: 'Piła',
} as const
