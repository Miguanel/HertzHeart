import { useRef, type KeyboardEvent, type PointerEvent as RPointerEvent, type ReactNode } from 'react'
import { clamp } from '../model/time'

interface KnobProps {
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  label: string
  /** Skala logarytmiczna – dla częstotliwości (równy obrót = ten sam stosunek wartości). */
  log?: boolean
  color?: string
  size?: number
  /** Tekst w środku pokrętła. */
  display?: ReactNode
  /** Kolorowe łuki pod pokrętłem, np. pasma fal mózgowych. */
  arcs?: { min: number; max: number; color: string }[]
}

const START = -135
const SWEEP = 270

/**
 * Pokrętło: przeciąganie w górę/dół (lub w bok), kółko myszy, strzałki. Shift = precyzyjnie, PageUp/Down = szybko.
 * Na dotyku przeciąganie palcem nie przewija strony.
 */
export function Knob({ value, min, max, onChange, label, log = false, color = 'var(--color-neon)', size = 168, display, arcs }: KnobProps) {
  const toNorm = (v: number) => {
    const c = clamp(v, min, max)
    return log ? Math.log(c / min) / Math.log(max / min) : (c - min) / (max - min)
  }
  const fromNorm = (n: number) => {
    const k = clamp(n, 0, 1)
    return log ? min * (max / min) ** k : min + (max - min) * k
  }
  const norm = toNorm(value)
  const drag = useRef<{ y: number; x: number; n: number } | null>(null)

  const nudge = (delta: number) => onChange(fromNorm(toNorm(value) + delta))

  const onPointerDown = (e: RPointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { y: e.clientY, x: e.clientX, n: norm }
  }
  const onPointerMove = (e: RPointerEvent<SVGSVGElement>) => {
    const d = drag.current
    if (!d) return
    const px = d.y - e.clientY + (e.clientX - d.x)
    const range = e.shiftKey ? 2000 : 260
    onChange(fromNorm(d.n + px / range))
  }
  const onPointerUp = () => {
    drag.current = null
  }
  const onKeyDown = (e: KeyboardEvent) => {
    const fine = e.shiftKey ? 0.001 : 0.01
    const map: Record<string, number> = { ArrowUp: fine, ArrowRight: fine, ArrowDown: -fine, ArrowLeft: -fine, PageUp: 0.1, PageDown: -0.1 }
    if (e.key in map) {
      e.preventDefault()
      nudge(map[e.key])
    } else if (e.key === 'Home') onChange(min)
    else if (e.key === 'End') onChange(max)
  }

  const r = 42
  const polar = (deg: number, radius = r) => {
    const a = ((deg - 90) * Math.PI) / 180
    return [50 + radius * Math.cos(a), 50 + radius * Math.sin(a)] as const
  }
  const arc = (from: number, to: number, radius = r) => {
    const [x1, y1] = polar(from, radius)
    const [x2, y2] = polar(to, radius)
    const large = to - from > 180 ? 1 : 0
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`
  }
  const angle = START + SWEEP * norm
  const [px, py] = polar(angle, 30)

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      className="max-w-full cursor-grab touch-none select-none outline-none active:cursor-grabbing focus-visible:drop-shadow-[0_0_6px_var(--color-neon)]"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      onWheel={(e) => nudge((e.deltaY < 0 ? 1 : -1) * (e.shiftKey ? 0.002 : 0.01))}
    >
      <defs>
        <radialGradient id="knob-face" cx="40%" cy="35%">
          <stop offset="0" stopColor="#1b2645" />
          <stop offset="1" stopColor="#070b16" />
        </radialGradient>
      </defs>
      <path d={arc(START, START + SWEEP)} stroke="#1c2742" strokeWidth="5" fill="none" strokeLinecap="round" />
      {arcs?.map((a, i) => {
        const from = START + SWEEP * toNorm(a.min)
        const to = START + SWEEP * toNorm(a.max)
        return to - from > 0.5 ? <path key={i} d={arc(from, to, 48)} stroke={a.color} strokeOpacity="0.55" strokeWidth="2" fill="none" /> : null
      })}
      {norm > 0.002 && (
        <path
          d={arc(START, angle)}
          stroke={color}
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 3px ${color})` }}
        />
      )}
      <circle cx="50" cy="50" r="34" fill="url(#knob-face)" stroke="#24314f" strokeWidth="1" />
      <line x1="50" y1="50" x2={px} y2={py} stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
      <circle cx={px} cy={py} r="2.6" fill="#e8fbff" />
      {display && (
        <foreignObject x="18" y="56" width="64" height="22">
          <div className="text-center font-mono text-[7px] leading-tight text-slate-300">{display}</div>
        </foreignObject>
      )}
    </svg>
  )
}
