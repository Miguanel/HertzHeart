import type { MotionSample, MotionSource } from './analysis'

/**
 * Dostęp do czujników ruchu przez zdarzenie `devicemotion`:
 * - `rotationRate` – żyroskop, prędkość kątowa [°/s] wokół osi alpha (z), beta (x), gamma (y),
 * - `accelerationIncludingGravity` – akcelerometr [m/s²] (zapas, gdy telefon nie ma żyroskopu).
 * Wymaga bezpiecznego połączenia (HTTPS). iOS 13+ wymaga zgody użytkownika wywołanej kliknięciem.
 */

type PermissionFn = () => Promise<'granted' | 'denied'>

interface MotionEventCtor {
  requestPermission?: PermissionFn
}

export type PermissionResult = 'granted' | 'denied' | 'unsupported' | 'insecure'

export function motionSupported(): boolean {
  return typeof window !== 'undefined' && 'DeviceMotionEvent' in window
}

/** Prośba o dostęp do czujników. Wywoływać bezpośrednio w obsłudze kliknięcia (wymóg Safari na iOS). */
export async function requestMotionPermission(): Promise<PermissionResult> {
  if (typeof window === 'undefined') return 'unsupported'
  if (!window.isSecureContext) return 'insecure'
  if (!motionSupported()) return 'unsupported'
  const ctor = window.DeviceMotionEvent as unknown as MotionEventCtor
  if (typeof ctor.requestPermission === 'function') {
    try {
      return (await ctor.requestPermission()) === 'granted' ? 'granted' : 'denied'
    } catch {
      return 'denied'
    }
  }
  return 'granted'
}

export interface MotionListener {
  stop: () => void
}

/**
 * Nasłuch czujników. Źródło wybierane po pierwszym zdarzeniu z danymi: żyroskop, a gdy go brak – akcelerometr.
 * `onSample` dostaje próbki z czasem zdarzenia [ms].
 */
export function listenMotion(onSample: (s: MotionSample, source: MotionSource) => void): MotionListener {
  let source: MotionSource | null = null
  const handler = (e: DeviceMotionEvent) => {
    const r = e.rotationRate
    const hasGyro = !!r && (r.alpha !== null || r.beta !== null || r.gamma !== null)
    if (!source) {
      const g = e.accelerationIncludingGravity
      if (hasGyro) source = 'gyro'
      else if (g && g.x !== null) source = 'accel'
      else return
    }
    const t = e.timeStamp || performance.now()
    if (source === 'gyro') {
      if (!r) return
      onSample({ t, x: r.beta ?? 0, y: r.gamma ?? 0, z: r.alpha ?? 0 }, source)
    } else {
      const g = e.accelerationIncludingGravity
      if (!g) return
      onSample({ t, x: g.x ?? 0, y: g.y ?? 0, z: g.z ?? 0 }, source)
    }
  }
  window.addEventListener('devicemotion', handler)
  return { stop: () => window.removeEventListener('devicemotion', handler) }
}

/** Blokada wygaszania ekranu na czas pomiaru (zablokowany ekran = brak danych z czujników). */
export async function keepScreenOn(): Promise<() => void> {
  try {
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }
    const lock = await nav.wakeLock?.request('screen')
    return () => void lock?.release().catch(() => undefined)
  } catch {
    return () => undefined
  }
}

/* ───────── sygnały dźwiękowe odliczania (osobny, mały kontekst audio – nie miesza się z silnikiem) ───────── */

let cueCtx: AudioContext | null = null

/** Odblokowanie dźwięku – wywoływać w obsłudze kliknięcia. */
export function unlockCues(): void {
  try {
    cueCtx ??= new AudioContext()
    void cueCtx.resume()
  } catch {
    cueCtx = null
  }
}

/** Krótki sygnał (z łagodnym narastaniem, bez trzasku). */
export function cue(hz = 880, ms = 120, volume = 0.18): void {
  const ctx = cueCtx
  if (!ctx) return
  const t = ctx.currentTime + 0.01
  const osc = new OscillatorNode(ctx, { frequency: hz })
  const g = new GainNode(ctx, { gain: 0 })
  osc.connect(g).connect(ctx.destination)
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(volume, t + 0.01)
  g.gain.setValueAtTime(volume, t + ms / 1000 - 0.02)
  g.gain.linearRampToValueAtTime(0, t + ms / 1000)
  osc.start(t)
  osc.stop(t + ms / 1000 + 0.02)
}

export function vibrate(pattern: number | number[]): void {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* pomijamy */
  }
}
