import { useCallback, useEffect, useRef, useState } from 'react'
import { useSway, type SwayMode } from '../store/swayStore'
import { MIN_ANALYSIS_S, analyzeSway, syntheticSamples, type MotionSample, type MotionSource, type SwayAnalysis } from './analysis'
import { cue, keepScreenOn, listenMotion, requestMotionPermission, unlockCues, vibrate, type MotionListener } from './sensors'

export type MeasurePhase = 'idle' | 'countdown' | 'recording' | 'done' | 'error'
export type MeasureError = 'insecure' | 'denied' | 'unsupported' | 'nodata' | 'interrupted' | 'short'

export interface MeasureState {
  phase: MeasurePhase
  /** Pozostałe sekundy odliczania przed startem. */
  countdown: number
  /** Czas nagrywania [s]. */
  elapsed: number
  duration: number
  source: MotionSource | null
  /** Bieżące oszacowanie w trakcie nagrywania (co 1 s, gdy jest dość danych). */
  live: SwayAnalysis | null
  /** Ostatnie ~8 s sygnału z najbardziej ruchliwej osi (do wykresu na żywo). */
  trace: number[]
  error: MeasureError | null
  result: SwayAnalysis | null
  /** Wynik na danych symulowanych (pokaz) – nie trafia do historii. */
  demo: boolean
  /** Id wyniku w historii. */
  savedId: string | null
}

const INITIAL: MeasureState = {
  phase: 'idle',
  countdown: 0,
  elapsed: 0,
  duration: 30,
  source: null,
  live: null,
  trace: [],
  error: null,
  result: null,
  demo: false,
  savedId: null,
}

/** Odliczanie przed startem [s]: przy pomiarze ciała trzeba zdążyć przyłożyć telefon do klatki piersiowej. */
export const COUNTDOWN_S: Record<SwayMode, number> = { hand: 3, body: 5 }
const TRACE_S = 8
const LIVE_WINDOW_S = 30

function traceOf(buf: MotionSample[]): number[] {
  if (buf.length < 4) return []
  const end = buf[buf.length - 1].t
  let i = buf.length - 1
  while (i > 0 && end - buf[i - 1].t <= TRACE_S * 1000) i--
  const part = buf.slice(i)
  // oś o największej wariancji
  const keys = ['x', 'y', 'z'] as const
  let best: (typeof keys)[number] = 'x'
  let bestVar = -1
  for (const k of keys) {
    const m = part.reduce((s, p) => s + p[k], 0) / part.length
    const v = part.reduce((s, p) => s + (p[k] - m) ** 2, 0)
    if (v > bestVar) {
      bestVar = v
      best = k
    }
  }
  const mean = part.reduce((s, p) => s + p[best], 0) / part.length
  const step = Math.max(1, Math.floor(part.length / 200))
  const out: number[] = []
  for (let j = 0; j < part.length; j += step) out.push(part[j][best] - mean)
  return out
}

export function useSwayMeasurement() {
  const [state, setState] = useState<MeasureState>(INITIAL)
  const run = useRef<{
    listener: MotionListener | null
    buffer: MotionSample[]
    source: MotionSource | null
    gotData: boolean
    recording: boolean
    startedAt: number
    timers: number[]
    releaseWake: (() => void) | null
    mode: SwayMode
    duration: number
    lastLive: number
  } | null>(null)

  const cleanup = useCallback(() => {
    const r = run.current
    if (!r) return
    r.listener?.stop()
    r.timers.forEach((t) => clearInterval(t))
    r.releaseWake?.()
    run.current = null
  }, [])

  useEffect(() => cleanup, [cleanup])

  const fail = useCallback(
    (error: MeasureError) => {
      cleanup()
      setState((s) => ({ ...s, phase: 'error', error, live: null }))
    },
    [cleanup],
  )

  const finish = useCallback(() => {
    const r = run.current
    if (!r) return
    const samples = r.buffer
    const source = r.source ?? 'gyro'
    const mode = r.mode
    cleanup()
    const result = analyzeSway(samples, source)
    if (!result) return fail('short')
    const savedId = useSway.getState().save(mode, result)
    cue(880, 110)
    setTimeout(() => cue(1175, 160), 170)
    vibrate([80, 60, 80])
    setState((s) => ({ ...s, phase: 'done', result, live: null, savedId, demo: false, error: null }))
  }, [cleanup, fail])

  // przerwanie, gdy ekran zostanie zablokowany lub karta ukryta (przeglądarka wstrzymuje czujniki)
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden' && run.current) fail('interrupted')
    }
    document.addEventListener('visibilitychange', onHide)
    return () => document.removeEventListener('visibilitychange', onHide)
  }, [fail])

  /** Start pomiaru – wywoływać bezpośrednio w obsłudze kliknięcia. */
  const start = useCallback(
    async (mode: SwayMode, duration: number) => {
      cleanup()
      unlockCues()
      const permission = await requestMotionPermission()
      if (permission !== 'granted') return fail(permission)

      const r = {
        listener: null as MotionListener | null,
        buffer: [] as MotionSample[],
        source: null as MotionSource | null,
        gotData: false,
        recording: false,
        startedAt: 0,
        timers: [] as number[],
        releaseWake: null as (() => void) | null,
        mode,
        duration,
        lastLive: 0,
      }
      run.current = r
      r.listener = listenMotion((sample, source) => {
        r.gotData = true
        r.source ??= source
        if (r.recording) r.buffer.push(sample)
      })
      void keepScreenOn().then((release) => {
        if (run.current === r) r.releaseWake = release
        else release()
      })

      let left = COUNTDOWN_S[mode]
      setState({ ...INITIAL, phase: 'countdown', countdown: left, duration })
      cue(660, 90)
      const countdown = window.setInterval(() => {
        if (run.current !== r) return
        left -= 1
        if (left > 0) {
          cue(660, 90)
          setState((s) => ({ ...s, countdown: left }))
          return
        }
        clearInterval(countdown)
        if (!r.gotData) return fail('nodata')
        r.recording = true
        r.startedAt = performance.now()
        cue(880, 260)
        vibrate(40)
        setState((s) => ({ ...s, phase: 'recording', countdown: 0, source: r.source }))
        const tick = window.setInterval(() => {
          if (run.current !== r) return
          const elapsed = (performance.now() - r.startedAt) / 1000
          if (elapsed >= r.duration) return finish()
          let live: SwayAnalysis | null | undefined
          if (elapsed >= MIN_ANALYSIS_S + 2 && elapsed - r.lastLive >= 1) {
            r.lastLive = elapsed
            // podgląd liczony z ostatnich 30 s – na telefonie pełna analiza długiego nagrania co sekundę byłaby za ciężka
            const from = r.buffer.length ? r.buffer[r.buffer.length - 1].t - LIVE_WINDOW_S * 1000 : 0
            live = analyzeSway(r.buffer.filter((p) => p.t >= from), r.source ?? 'gyro')
          }
          const trace = traceOf(r.buffer)
          setState((s) => ({ ...s, elapsed, trace, source: r.source, ...(live !== undefined ? { live } : {}) }))
        }, 100)
        r.timers.push(tick)
      }, 1000)
      r.timers.push(countdown)
    },
    [cleanup, fail, finish],
  )

  /** Zakończenie przed czasem: analiza, jeśli nagranie jest wystarczająco długie, inaczej anulowanie. */
  const stop = useCallback(() => {
    const r = run.current
    if (r?.recording && (performance.now() - r.startedAt) / 1000 >= MIN_ANALYSIS_S + 2) return finish()
    cleanup()
    setState((s) => ({ ...INITIAL, duration: s.duration }))
  }, [cleanup, finish])

  /** Pokaz działania na danych symulowanych (np. na komputerze bez czujników). */
  const demo = useCallback((duration: number) => {
    cleanup()
    const swayHz = 0.2 + Math.random() * 0.15
    const result = analyzeSway(syntheticSamples({ seconds: duration, swayHz, tremorHz: 8.5 + Math.random() * 2, tremorDegS: 2.5, seed: Date.now() % 1000 }), 'gyro')
    setState({ ...INITIAL, phase: 'done', duration, result, demo: true })
  }, [cleanup])

  /** Pokazuje zapisany wynik z historii. */
  const show = useCallback(
    (id: string) => {
      const m = useSway.getState().history.find((h) => h.id === id)
      if (!m) return
      cleanup()
      setState({ ...INITIAL, phase: 'done', duration: Math.round(m.analysis.duration), result: m.analysis, savedId: id })
    },
    [cleanup],
  )

  const reset = useCallback(() => {
    cleanup()
    setState((s) => ({ ...INITIAL, duration: s.duration }))
  }, [cleanup])

  return { state, start, stop, demo, show, reset }
}
