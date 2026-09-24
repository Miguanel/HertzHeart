/** 83.4 -> "01:23.4", 3723 -> "1:02:03.0" */
export function formatTime(seconds: number, decimals = 1): string {
  const s = Math.max(0, seconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = (s % 60).toFixed(decimals).padStart(decimals ? 3 + decimals : 2, '0')
  const mm = String(m).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${sec}` : `${mm}:${sec}`
}

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
export const snap = (v: number, step: number) => Math.round(v / step) * step
export const round = (v: number, decimals = 3) => Math.round(v * 10 ** decimals) / 10 ** decimals
