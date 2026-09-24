import { MAX_FREQ_MHZ, MIN_FREQ_MHZ } from './schema'

/** 777778 -> "777.778" (bez błędów zaokrągleń float). */
export function formatHz(mHz: number): string {
  const whole = Math.trunc(mHz / 1000)
  const frac = String(Math.abs(mHz % 1000)).padStart(3, '0')
  return `${whole}.${frac}`
}

/** "777,778" / "777.778" / "777" -> 777778. Zwraca null dla błędnych wartości. */
export function parseHz(input: string): number | null {
  const text = input.trim().replace(',', '.')
  const match = /^(\d{1,5})(?:\.(\d{0,3}))?$/.exec(text)
  if (!match) return null
  const mHz = Number(match[1]) * 1000 + Number((match[2] ?? '').padEnd(3, '0'))
  if (mHz < MIN_FREQ_MHZ || mHz > MAX_FREQ_MHZ) return null
  return mHz
}

export const WAVEFORM_LABELS = {
  sine: 'Sinus',
  triangle: 'Trójkąt',
  square: 'Prostokąt',
  sawtooth: 'Piła',
} as const
