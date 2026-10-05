import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as RPointerEvent } from 'react'
import { BRAIN_BANDS, type BrainBand } from '../data/brainwaves'
import { formatHz } from '../model/frequency'
import { clamp, round } from '../model/time'
import { useSettings } from '../store/settings'

/** Jak długo trzeba przytrzymać kciuk na granicy, żeby przejść do sąsiedniego pasma. */
const HOLD_MS = 700
/** Czas animacji przejścia skali do nowego pasma. */
const ANIM_MS = 450
/** O ile pikseli trzeba ruszyć palcem po zmianie pasma, zanim granica znowu zacznie reagować. */
const REARM_PX = 10

interface Range {
  min: number
  max: number
}

type Edge = 'min' | 'max'

// Skala logarytmiczna w obrębie pasma – działa tak samo dla 0,001–0,1 Hz i dla 250–500 Hz.
const toNorm = (hz: number, r: Range) => Math.log(hz / r.min) / Math.log(r.max / r.min)
const fromNorm = (n: number, r: Range) => r.min * (r.max / r.min) ** n
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

export function bandIndexOf(hz: number, bands: readonly BrainBand[] = BRAIN_BANDS): number {
  const i = bands.findIndex((b, k) => hz >= b.min && (hz < b.max || (k === bands.length - 1 && hz <= b.max)))
  if (i >= 0) return i
  return hz < bands[0].min ? 0 : bands.length - 1
}

const fmtEdge = (hz: number) => String(Number(hz.toPrecision(4))).replace('.', ',')

interface Props {
  /** Częstotliwość fali mózgowej [Hz]. */
  hz: number
  onChange: (hz: number) => void
  bands?: readonly BrainBand[]
  /** Wersja do listy: bez mapy pasm i strzałek. */
  compact?: boolean
  label?: string
}

/**
 * Suwak pracujący w obrębie JEDNEGO pasma fal mózgowych (np. Szybka Theta 6–8 Hz).
 * Przytrzymanie kciuka na granicy przez chwilę płynnie przesuwa skalę do sąsiedniego pasma –
 * kciuk zostaje na częstotliwości granicznej (dźwięk nie skacze), a nowe pasmo staje się głównym zakresem pracy.
 */
export function BandSlider({ hz, onChange, bands = BRAIN_BANDS, compact = false, label = 'Częstotliwość fali mózgowej' }: Props) {
  const decimals = useSettings((s) => s.decimals)
  const [bandIdx, setBandIdx] = useState(() => bandIndexOf(hz, bands))
  const [range, setRange] = useState<Range>(() => ({ min: bands[bandIdx].min, max: bands[bandIdx].max }))
  const [hold, setHold] = useState<{ edge: Edge; key: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const anim = useRef<number | null>(null)
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const drag = useRef<{ mode: 'abs' | 'rel'; anchorX: number; anchorNorm: number; lastX: number; armed: boolean } | null>(null)
  const state = useRef({ hz, bandIdx, range })
  state.current = { hz, bandIdx, range }

  const band = bands[bandIdx]
  const animating = anim.current !== null

  // Zmiana częstotliwości z zewnątrz (pole liczbowe, szybkie pasma) – pasmo dopasowuje się samo.
  useEffect(() => {
    if (anim.current !== null || drag.current) return
    const b = bands[bandIdx]
    if (hz >= b.min && hz <= b.max) return
    const i = bandIndexOf(hz, bands)
    setBandIdx(i)
    setRange({ min: bands[i].min, max: bands[i].max })
  }, [hz, bandIdx, bands])

  useEffect(
    () => () => {
      if (anim.current !== null) cancelAnimationFrame(anim.current)
      if (holdTimer.current) clearTimeout(holdTimer.current)
    },
    [],
  )

  const animateTo = (target: Range) => {
    if (anim.current !== null) cancelAnimationFrame(anim.current)
    const from = state.current.range
    const t0 = performance.now()
    const step = (now: number) => {
      const k = ease(Math.min(1, (now - t0) / ANIM_MS))
      // interpolacja w skali logarytmicznej – płynna dla pasm o bardzo różnej szerokości
      setRange({
        min: from.min * (target.min / from.min) ** k,
        max: from.max * (target.max / from.max) ** k,
      })
      anim.current = k < 1 ? requestAnimationFrame(step) : null
    }
    anim.current = requestAnimationFrame(step)
  }

  const clearHold = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current)
    holdTimer.current = null
    setHold(null)
  }

  /** Przejście do pasma `next`; `boundary` = częstotliwość, na której zostaje kciuk. */
  const goToBand = (next: number, value?: number) => {
    if (next < 0 || next >= bands.length || next === state.current.bandIdx) return
    const b = bands[next]
    const v = value ?? round(Math.sqrt(b.min * b.max), Math.max(decimals, 3))
    onChange(v)
    setBandIdx(next)
    animateTo({ min: b.min, max: b.max })
    navigator.vibrate?.(12)
  }

  const crossEdge = (edge: Edge) => {
    const { bandIdx: i } = state.current
    const cur = bands[i]
    const next = edge === 'max' ? i + 1 : i - 1
    if (next < 0 || next >= bands.length) return
    goToBand(next, edge === 'max' ? cur.max : cur.min)
    // kciuk zostaje na granicy: od teraz ruch jest liczony względnie od tego miejsca
    const d = drag.current
    if (d) {
      d.mode = 'rel'
      d.anchorX = d.lastX
      d.anchorNorm = edge === 'max' ? 0 : 1
      d.armed = false
    }
    clearHold()
  }

  const startHold = (edge: Edge) => {
    if (hold?.edge === edge && holdTimer.current) return
    const i = state.current.bandIdx
    if ((edge === 'max' && i >= bands.length - 1) || (edge === 'min' && i <= 0)) return
    if (holdTimer.current) clearTimeout(holdTimer.current)
    setHold({ edge, key: performance.now() })
    holdTimer.current = setTimeout(() => crossEdge(edge), HOLD_MS)
  }

  const applyPointer = (clientX: number) => {
    const el = trackRef.current
    const d = drag.current
    if (!el || !d) return
    d.lastX = clientX
    const rect = el.getBoundingClientRect()
    if (!d.armed && Math.abs(clientX - d.anchorX) > REARM_PX) d.armed = true
    const raw = d.mode === 'abs' ? (clientX - rect.left) / rect.width : d.anchorNorm + (clientX - d.anchorX) / rect.width
    const r = { min: bands[state.current.bandIdx].min, max: bands[state.current.bandIdx].max }
    const value = round(fromNorm(clamp(raw, 0, 1), r), Math.max(decimals, 3))
    if (value !== state.current.hz) onChange(clamp(value, r.min, r.max))

    const edge: Edge | null = raw <= 0.002 ? 'min' : raw >= 0.998 ? 'max' : null
    if (edge && d.armed && anim.current === null) startHold(edge)
    else if (!edge && holdTimer.current) clearHold()
  }

  const onPointerDown = (e: RPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
    drag.current = { mode: 'abs', anchorX: e.clientX, anchorNorm: 0, lastX: e.clientX, armed: true }
    applyPointer(e.clientX)
  }
  const onPointerMove = (e: RPointerEvent<HTMLDivElement>) => {
    if (drag.current) applyPointer(e.clientX)
  }
  const onPointerUp = () => {
    drag.current = null
    setDragging(false)
    clearHold()
  }

  const onKeyDown = (e: KeyboardEvent) => {
    const r = { min: band.min, max: band.max }
    const n = toNorm(clamp(hz, r.min, r.max), r)
    const stepN = e.shiftKey ? 0.002 : 0.02
    const set = (k: number) => onChange(round(fromNorm(clamp(k, 0, 1), r), Math.max(decimals, 3)))
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        if (n >= 1) crossEdge('max')
        else set(n + stepN)
        break
      case 'ArrowLeft':
      case 'ArrowDown':
        if (n <= 0) crossEdge('min')
        else set(n - stepN)
        break
      case 'PageUp':
        crossEdge('max')
        break
      case 'PageDown':
        crossEdge('min')
        break
      case 'Home':
        set(0)
        break
      case 'End':
        set(1)
        break
      default:
        return
    }
    e.preventDefault()
  }

  const pos = clamp(toNorm(clamp(hz, range.min, range.max), range), 0, 1) * 100
  const prev = bands[bandIdx - 1]
  const next = bands[bandIdx + 1]
  const color = band.color

  const edgeHint = (edge: Edge, nb: BrainBand | undefined) => {
    if (!nb) return null
    const active = hold?.edge === edge
    return (
      <div
        className={`pointer-events-none absolute inset-y-0 ${edge === 'min' ? 'left-0 rounded-l-lg' : 'right-0 rounded-r-lg'} w-1/4 overflow-hidden`}
      >
        {active && (
          <div
            key={hold.key}
            className={`band-hold absolute inset-y-0 ${edge === 'min' ? 'left-0 origin-left' : 'right-0 origin-right'} w-full`}
            style={{
              background: `linear-gradient(${edge === 'min' ? '90deg' : '270deg'}, color-mix(in oklab, ${nb.color} 55%, transparent), transparent)`,
              animationDuration: `${HOLD_MS}ms`,
            }}
          />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        {!compact && (
          <button
            type="button"
            onClick={() => crossEdge('min')}
            disabled={!prev || animating}
            aria-label={prev ? `Poprzednie pasmo: ${prev.name}` : 'Brak niższego pasma'}
            title={prev?.name}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:text-slate-100 disabled:opacity-30"
          >
            ◂
          </button>
        )}
        <div className="flex min-w-0 flex-1 items-baseline gap-2">
          <span className="size-2 shrink-0 self-center rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
          <span className={`truncate font-medium text-slate-100 ${compact ? 'text-xs' : 'text-sm'}`}>{band.name}</span>
          <span className="shrink-0 font-mono text-[10px] text-muted">
            {fmtEdge(band.min)}–{fmtEdge(band.max)} Hz
          </span>
        </div>
        <span className={`shrink-0 font-mono tabular-nums ${compact ? 'text-xs' : 'text-sm'}`} style={{ color }}>
          {formatHz(hz * 1000, decimals)} Hz
        </span>
        {!compact && (
          <button
            type="button"
            onClick={() => crossEdge('max')}
            disabled={!next || animating}
            aria-label={next ? `Następne pasmo: ${next.name}` : 'Brak wyższego pasma'}
            title={next?.name}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:text-slate-100 disabled:opacity-30"
          >
            ▸
          </button>
        )}
      </div>

      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label={`${label} – pasmo ${band.name}`}
        aria-valuemin={band.min}
        aria-valuemax={band.max}
        aria-valuenow={hz}
        aria-valuetext={`${formatHz(hz * 1000, decimals)} Hz, ${band.name}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        className={`relative cursor-pointer touch-none select-none rounded-lg border border-line/70 bg-black/30 outline-none focus-visible:ring-2 focus-visible:ring-neon/50 ${
          compact ? 'h-9' : 'h-12'
        }`}
      >
        {edgeHint('min', prev)}
        {edgeHint('max', next)}
        <div className="absolute inset-x-3 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#1c2742]">
          <div className="h-full rounded-full" style={{ width: `${pos}%`, background: color, boxShadow: `0 0 8px ${color}` }} />
          <div
            className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#e8fbff] transition-[width,height] ${
              dragging ? 'size-5' : 'size-4'
            }`}
            style={{ left: `${pos}%`, boxShadow: `0 0 0 3px color-mix(in oklab, ${color} 35%, transparent), 0 0 12px ${color}` }}
          />
        </div>
        {!compact && (
          <>
            <span className="pointer-events-none absolute bottom-0.5 left-3 font-mono text-[9px] text-muted">
              {prev ? `◂ ${prev.name}` : `${fmtEdge(band.min)} Hz`}
            </span>
            <span className="pointer-events-none absolute bottom-0.5 right-3 font-mono text-[9px] text-muted">
              {next ? `${next.name} ▸` : `${fmtEdge(band.max)} Hz`}
            </span>
          </>
        )}
      </div>

      {!compact && (
        <>
          <div className="flex h-2 gap-px overflow-hidden rounded-full" aria-hidden="true">
            {bands.map((b, i) => (
              <button
                key={b.id}
                type="button"
                tabIndex={-1}
                title={`${b.name} (${fmtEdge(b.min)}–${fmtEdge(b.max)} Hz)`}
                onClick={() => goToBand(i)}
                className="h-full flex-1 transition-opacity"
                style={{ background: b.color, opacity: i === bandIdx ? 1 : 0.25 }}
              />
            ))}
          </div>
          <p className="text-[11px] leading-snug text-muted">
            Suwak działa w obrębie jednego pasma. Przytrzymaj kciuk na granicy, aby płynnie przejść do sąsiedniego pasma
            (albo użyj strzałek ◂ ▸ lub kliknij pasmo na pasku).
          </p>
        </>
      )}
    </div>
  )
}
