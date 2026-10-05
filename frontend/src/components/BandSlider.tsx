import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as RPointerEvent } from 'react'
import { BRAIN_BANDS, bandRange, type BrainBand } from '../data/brainwaves'
import { formatHz } from '../model/frequency'
import { clamp, round } from '../model/time'
import { useSettings } from '../store/settings'

/** Jak długo trzeba przytrzymać kciuk w strefie sąsiedniego pasma, żeby do niego przejść. */
const HOLD_MS = 700
/** Czas animacji przejścia skali do nowego pasma. */
const ANIM_MS = 450
/** O ile pikseli trzeba ruszyć palcem po zmianie pasma, zanim strefa graniczna znowu zacznie reagować. */
const REARM_PX = 10

/** Częstotliwość zapisana gdzie indziej (inne fale, projekty) – pokazywana jako znacznik na suwaku. */
export interface FrequencyMarker {
  hz: number
  label: string
}

interface Range {
  min: number
  max: number
}

type Edge = 'min' | 'max'

// Skala logarytmiczna w obrębie pasma – działa tak samo dla 0,001–0,1 Hz i dla 250–500 Hz.
const toNorm = (hz: number, r: Range) => Math.log(hz / r.min) / Math.log(r.max / r.min)
const fromNorm = (n: number, r: Range) => r.min * (r.max / r.min) ** n
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
const inBand = (hz: number, b: Range) => hz >= b.min && hz <= b.max

export function bandIndexOf(hz: number, bands: readonly BrainBand[] = BRAIN_BANDS): number {
  const i = bands.findIndex((b, k) => hz >= b.min && (hz < b.max || (k === bands.length - 1 && hz <= b.max)))
  if (i >= 0) return i
  return hz < bands[0].min ? 0 : bands.length - 1
}

interface Props {
  /** Częstotliwość fali mózgowej [Hz]. */
  hz: number
  onChange: (hz: number) => void
  bands?: readonly BrainBand[]
  /** Wersja do listy: mniejsza, bez paska wszystkich pasm. */
  compact?: boolean
  label?: string
  markers?: FrequencyMarker[]
}

/**
 * Suwak pracujący w obrębie JEDNEGO pasma fal mózgowych (np. Szybka Theta 6–8 Hz).
 * Po obu stronach widać strefy sąsiednich pasm w ich kolorach. Przytrzymanie kciuka w takiej strefie płynnie
 * przesuwa skalę do sąsiedniego pasma – kciuk zostaje na częstotliwości granicznej (dźwięk nie skacze),
 * a nowe pasmo staje się głównym zakresem pracy.
 */
export function BandSlider({ hz, onChange, bands = BRAIN_BANDS, compact = false, label = 'Częstotliwość fali mózgowej', markers = [] }: Props) {
  const decimals = useSettings((s) => s.decimals)
  const [bandIdx, setBandIdx] = useState(() => bandIndexOf(hz, bands))
  const [range, setRange] = useState<Range>(() => ({ min: bands[bandIdx].min, max: bands[bandIdx].max }))
  const [hold, setHold] = useState<{ edge: Edge; key: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const [animating, setAnimating] = useState(false)
  const mainRef = useRef<HTMLDivElement>(null)
  const anim = useRef<number | null>(null)
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const drag = useRef<{ mode: 'abs' | 'rel'; anchorX: number; anchorNorm: number; lastX: number; armed: boolean } | null>(null)
  const state = useRef({ hz, bandIdx, range })
  state.current = { hz, bandIdx, range }
  const valueDecimals = Math.max(decimals, 3)

  const band = bands[bandIdx]
  const prev = bands[bandIdx - 1]
  const next = bands[bandIdx + 1]

  // Zmiana częstotliwości z zewnątrz (pole liczbowe, szybkie pasma) – pasmo dopasowuje się samo.
  useEffect(() => {
    if (anim.current !== null || drag.current) return
    if (inBand(hz, bands[bandIdx])) return
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
    setAnimating(true)
    const step = (now: number) => {
      const k = ease(Math.min(1, (now - t0) / ANIM_MS))
      // interpolacja w skali logarytmicznej – płynna dla pasm o bardzo różnej szerokości
      setRange({ min: from.min * (target.min / from.min) ** k, max: from.max * (target.max / from.max) ** k })
      if (k < 1) {
        anim.current = requestAnimationFrame(step)
      } else {
        anim.current = null
        setAnimating(false)
      }
    }
    anim.current = requestAnimationFrame(step)
  }

  const clearHold = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current)
    holdTimer.current = null
    setHold(null)
  }

  /** Przejście do pasma `index`; `value` = częstotliwość, na której zostaje kciuk (domyślnie środek pasma). */
  const goToBand = (index: number, value?: number) => {
    if (index < 0 || index >= bands.length || index === state.current.bandIdx) return
    const b = bands[index]
    onChange(value ?? round(Math.sqrt(b.min * b.max), valueDecimals))
    setBandIdx(index)
    animateTo({ min: b.min, max: b.max })
    navigator.vibrate?.(12)
  }

  const crossEdge = (edge: Edge) => {
    const i = state.current.bandIdx
    const cur = bands[i]
    const target = edge === 'max' ? i + 1 : i - 1
    if (target < 0 || target >= bands.length) return
    goToBand(target, edge === 'max' ? cur.max : cur.min)
    // kciuk zostaje na granicy: od teraz ruch jest liczony względnie od tego miejsca (bez skoku częstotliwości)
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
    const el = mainRef.current
    const d = drag.current
    if (!el || !d) return
    d.lastX = clientX
    if (!d.armed && Math.abs(clientX - d.anchorX) > REARM_PX) d.armed = true
    const rect = el.getBoundingClientRect()
    const raw = d.mode === 'abs' ? (clientX - rect.left) / rect.width : d.anchorNorm + (clientX - d.anchorX) / rect.width
    const b = bands[state.current.bandIdx]
    const value = clamp(round(fromNorm(clamp(raw, 0, 1), b), valueDecimals), b.min, b.max)
    if (value !== state.current.hz) onChange(value)

    const edge: Edge | null = raw <= 0 ? 'min' : raw >= 1 ? 'max' : null
    if (edge && d.armed && anim.current === null) startHold(edge)
    else if (!edge && holdTimer.current) clearHold()
  }

  const onPointerDown = (e: RPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    if ((e.target as HTMLElement).closest('[data-marker]')) return
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
    const n = toNorm(clamp(hz, band.min, band.max), band)
    const stepN = e.shiftKey ? 0.002 : 0.02
    const set = (k: number) => onChange(round(fromNorm(clamp(k, 0, 1), band), valueDecimals))
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
  const color = band.color
  const visibleMarkers = markers.filter((m) => inBand(m.hz, range))

  /** Strefa sąsiedniego pasma przy krawędzi suwaka. */
  const zone = (edge: Edge, nb: BrainBand | undefined) => {
    const active = hold?.edge === edge
    const side = edge === 'min' ? 'rounded-l-lg border-r' : 'rounded-r-lg border-l'
    if (!nb) return <div className={`w-[13%] shrink-0 ${side} border-line/50 bg-white/[0.015]`} />
    return (
      <div
        className={`relative flex w-[13%] shrink-0 items-center overflow-hidden ${side} ${edge === 'min' ? 'justify-start pl-1.5' : 'justify-end pr-1.5'}`}
        style={{ background: `color-mix(in oklab, ${nb.color} 22%, transparent)`, borderColor: `color-mix(in oklab, ${nb.color} 60%, transparent)` }}
        title={`${nb.name} · ${bandRange(nb)} – przytrzymaj tutaj, aby przejść`}
      >
        {active && (
          <div
            key={hold.key}
            className={`band-hold absolute inset-0 ${edge === 'min' ? 'origin-right' : 'origin-left'}`}
            style={{ background: `color-mix(in oklab, ${nb.color} 65%, transparent)`, animationDuration: `${HOLD_MS}ms` }}
          />
        )}
        <span className="pointer-events-none relative z-10 font-mono text-[10px] font-semibold" style={{ color: nb.color }}>
          {edge === 'min' ? '◂' : '▸'}
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className={`flex items-end gap-2 ${compact ? '' : 'flex-wrap'}`}>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
            <span className={`truncate font-medium text-slate-100 ${compact ? 'text-xs' : 'text-sm'}`}>{band.name}</span>
          </div>
          <div className={`font-mono ${compact ? 'text-[10px]' : 'text-xs'}`} style={{ color }}>
            zakres {bandRange(band)}
          </div>
        </div>
        <div
          className={`shrink-0 font-mono font-semibold leading-none tabular-nums ${compact ? 'text-lg' : 'text-3xl sm:text-4xl'}`}
          style={{ color, textShadow: `0 0 18px color-mix(in oklab, ${color} 45%, transparent)` }}
          aria-live="polite"
        >
          {formatHz(hz * 1000, decimals)}
          <span className={`ml-1 font-normal text-muted ${compact ? 'text-[10px]' : 'text-sm'}`}>Hz</span>
        </div>
      </div>

      <div
        role="slider"
        tabIndex={0}
        aria-label={`${label} – pasmo ${band.name} ${bandRange(band)}`}
        aria-valuemin={band.min}
        aria-valuemax={band.max}
        aria-valuenow={hz}
        aria-valuetext={`${formatHz(hz * 1000, decimals)} Hz, ${band.name}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        className={`flex cursor-pointer touch-none select-none overflow-hidden rounded-lg border border-line/70 outline-none focus-visible:ring-2 focus-visible:ring-neon/50 ${
          compact ? 'h-10' : 'h-14'
        }`}
      >
        {zone('min', prev)}
        <div
          ref={mainRef}
          className="relative min-w-0 flex-1"
          style={{ background: `linear-gradient(180deg, color-mix(in oklab, ${color} 12%, transparent), color-mix(in oklab, ${color} 4%, transparent))` }}
        >
          <div className="absolute inset-x-2 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#1c2742]">
            <div className="h-full rounded-full" style={{ width: `${pos}%`, background: color, boxShadow: `0 0 8px ${color}` }} />
            {visibleMarkers.map((m, i) => (
              <button
                key={i}
                type="button"
                data-marker
                title={`${m.label}: ${formatHz(m.hz * 1000, decimals)} Hz – kliknij, aby ustawić`}
                aria-label={`Ustaw ${formatHz(m.hz * 1000, decimals)} Hz (${m.label})`}
                onClick={() => onChange(m.hz)}
                className="absolute top-1/2 h-5 w-2.5 -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${clamp(toNorm(m.hz, range), 0, 1) * 100}%` }}
              >
                <span className="mx-auto block h-full w-0.5 rounded-full bg-white/70 shadow-[0_0_4px_white]" />
              </button>
            ))}
            <div
              className={`pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#e8fbff] transition-[width,height] ${
                dragging ? 'size-6' : 'size-5'
              }`}
              style={{ left: `${pos}%`, boxShadow: `0 0 0 3px color-mix(in oklab, ${color} 40%, transparent), 0 0 14px ${color}` }}
            />
          </div>
          {!compact && (
            <>
              <span className="pointer-events-none absolute bottom-0.5 left-2 font-mono text-[9px] text-muted">{formatHz(band.min * 1000, Math.min(decimals, 3))}</span>
              <span className="pointer-events-none absolute bottom-0.5 right-2 font-mono text-[9px] text-muted">{formatHz(band.max * 1000, Math.min(decimals, 3))}</span>
            </>
          )}
        </div>
        {zone('max', next)}
      </div>

      {!compact && (
        <div className="flex items-center justify-between gap-2 text-[10px]">
          <button
            type="button"
            onClick={() => crossEdge('min')}
            disabled={!prev || animating}
            className="min-w-0 truncate rounded-md px-1 py-0.5 text-left hover:bg-white/5 disabled:opacity-30"
            style={{ color: prev?.color }}
          >
            {prev ? `◂ ${prev.name} · ${bandRange(prev)}` : ''}
          </button>
          <button
            type="button"
            onClick={() => crossEdge('max')}
            disabled={!next || animating}
            className="min-w-0 truncate rounded-md px-1 py-0.5 text-right hover:bg-white/5 disabled:opacity-30"
            style={{ color: next?.color }}
          >
            {next ? `${next.name} · ${bandRange(next)} ▸` : ''}
          </button>
        </div>
      )}

      {!compact && (
        <>
          <div className="flex h-4 gap-px overflow-hidden rounded-md" aria-hidden="true">
            {bands.map((b, i) => (
              <button
                key={b.id}
                type="button"
                tabIndex={-1}
                title={`${b.name} · ${bandRange(b)}`}
                onClick={() => goToBand(i)}
                className="relative h-full flex-1 transition-opacity"
                style={{ background: b.color, opacity: i === bandIdx ? 1 : 0.35 }}
              >
                {markers
                  .filter((m) => inBand(m.hz, b))
                  .map((m, k) => (
                    <span
                      key={k}
                      className="absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_3px_black]"
                      style={{ left: `${clamp(toNorm(m.hz, b), 0, 1) * 100}%` }}
                    />
                  ))}
              </button>
            ))}
          </div>
          <p className="text-[11px] leading-snug text-muted">
            Przesuń kciuk do kolorowej strefy z boku i przytrzymaj, aby płynnie przejść do sąsiedniego pasma. Białe kreski to
            częstotliwości zapisane w innych falach i projektach – kliknij, aby ją ustawić.
          </p>
        </>
      )}
    </div>
  )
}
