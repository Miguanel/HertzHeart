import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import { formatHz } from '../model/frequency'
import { useBinaural } from '../store/binauralStore'
import { SWAY_DURATIONS, useSway, type SwayMode } from '../store/swayStore'
import { useUi } from '../store/uiStore'
import { POSTURE_BANDS, SWAY_RANGE, TREMOR_RANGE, type PeakQuality, type SwayAnalysis } from '../sway/analysis'
import { BANDS_SOURCES, FINDINGS, SOURCES, findingsFor, type Finding } from '../sway/research'
import { COUNTDOWN_S, useSwayMeasurement, type MeasureError, type MeasureState } from '../sway/useSwayMeasurement'
import { Icon } from './icons'
import { Button, IconButton, Panel } from './ui'

/* ───────────── wspólne ───────────── */

const hz3 = (hz: number) => formatHz(hz * 1000, 3)
const fixed = (v: number, d: number) => v.toFixed(d)

const BAND_COLORS: Record<string, string> = { low: '#5b7cff', mid: '#22e4ff', high: '#c86bff' }
const SWAY_COLOR = '#22e4ff'
const TREMOR_COLOR = '#c86bff'

const QUALITY_LABEL: Record<PeakQuality, { text: string; cls: string }> = {
  clear: { text: 'wyraźny rytm', cls: 'border-signal/50 text-signal bg-signal/10' },
  moderate: { text: 'umiarkowanie wyraźny', cls: 'border-neon/40 text-neon bg-neon/10' },
  weak: { text: 'brak wyraźnego rytmu', cls: 'border-warn/50 text-warn bg-warn/10' },
}

function QualityPill({ q }: { q: PeakQuality }) {
  const l = QUALITY_LABEL[q]
  return <span className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${l.cls}`}>{l.text}</span>
}

/** Link do badania – zawsze w nowej karcie. */
function SourceLink({ id, compact = false }: { id: string; compact?: boolean }) {
  const s = SOURCES[id]
  if (!s) return null
  return (
    <a
      href={s.url}
      target="_blank"
      rel="noopener noreferrer"
      title={`${s.title}\n${s.publisher}`}
      className="group inline-flex max-w-full items-center gap-1.5 rounded-lg border border-neon/40 bg-neon/[0.06] px-2.5 py-1 text-[11px] text-neon transition-colors hover:bg-neon/15"
    >
      <span className="font-display text-[9px] uppercase tracking-[0.16em]">Źródło</span>
      <span className="min-w-0 truncate text-slate-300 group-hover:text-slate-100">{compact ? s.short.split(',')[0] : s.short}</span>
      <Icon name="external" className="size-3.5 shrink-0" />
    </a>
  )
}

function rangeLabel(f: Finding) {
  if (f.from <= 0.05) return `< ${f.to} Hz`
  return f.to >= 20 ? `> ${f.from} Hz` : `${f.from}–${f.to} Hz`
}

function FindingCard({ f, accent = SWAY_COLOR, dim = false }: { f: Finding; accent?: string; dim?: boolean }) {
  return (
    <article
      className={`space-y-2.5 rounded-xl border p-3 ${dim ? 'border-line/60 bg-white/[0.015]' : 'bg-white/[0.03]'}`}
      style={dim ? undefined : { borderColor: `color-mix(in oklab, ${accent} 40%, transparent)` }}
    >
      <header className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span
          className="shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] tabular-nums text-black"
          style={{ background: accent }}
        >
          {rangeLabel(f)}
        </span>
        <h4 className="min-w-0 text-sm font-medium text-slate-100">{f.title}</h4>
      </header>
      <p className="text-[13px] leading-relaxed text-slate-300">{f.text}</p>
      {f.caution && (
        <p className="rounded-lg border border-warn/30 bg-warn/[0.06] px-2.5 py-2 text-[12px] leading-relaxed text-warn">{f.caution}</p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {f.sources.map((id) => (
          <SourceLink key={id} id={id} />
        ))}
      </div>
    </article>
  )
}

function Disclaimer() {
  return (
    <p className="text-[11px] leading-relaxed text-muted">
      Pomiar ma charakter edukacyjny i nie jest badaniem medycznym. Telefon mierzy ruch samego urządzenia: w dłoni dochodzi ruch
      ręki, przy klatce piersiowej – oddech i praca serca. Cytowane badania prowadzono w laboratoriach (platformy posturograficzne,
      czujniki ruchu, EMG), więc wynik z telefonu można z nimi porównywać tylko orientacyjnie.
    </p>
  )
}

/** Szerokość elementu w pikselach (wykresy rysowane w rzeczywistej skali – czytelne napisy na telefonie). */
function useWidth<T extends HTMLElement>(): [RefObject<T | null>, number] {
  const ref = useRef<T>(null)
  const [w, setW] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)))
    ro.observe(el)
    setW(Math.round(el.getBoundingClientRect().width))
    return () => ro.disconnect()
  }, [])
  return [ref, w]
}

/* ───────────── pomiar ───────────── */

const ERRORS: Record<MeasureError, { title: string; text: ReactNode }> = {
  insecure: {
    title: 'Czujniki wymagają bezpiecznego połączenia',
    text: 'Przeglądarka udostępnia żyroskop tylko stronom otwartym przez HTTPS – otwórz aplikację pod adresem https://heartzheart.onrender.com.',
  },
  denied: {
    title: 'Brak zgody na czujniki ruchu',
    text: 'Odśwież stronę i przy pytaniu o „ruch i orientację” wybierz „Zezwól”. Na Androidzie (Chrome): ikona obok adresu → Ustawienia witryny → Czujniki ruchu.',
  },
  unsupported: {
    title: 'Ta przeglądarka nie obsługuje czujników ruchu',
    text: 'Otwórz aplikację na telefonie w Chrome (Android) lub Safari (iPhone).',
  },
  nodata: {
    title: 'Nie wykryto żyroskopu ani akcelerometru',
    text: 'To urządzenie nie przesyła danych o ruchu (zwykle komputer). Otwórz Hertz Hearth na telefonie – albo zobacz pokaz na danych symulowanych.',
  },
  interrupted: {
    title: 'Pomiar przerwany',
    text: 'Ekran został zablokowany albo przełączono kartę – przeglądarka wstrzymuje wtedy czujniki. Zacznij pomiar od nowa.',
  },
  short: {
    title: 'Za mało danych',
    text: 'Nagranie było zbyt krótkie albo czujnik przesłał za mało próbek. Spróbuj dłuższego pomiaru.',
  },
}

const MODE_INFO: Record<SwayMode, { label: string; short: string; steps: string[] }> = {
  hand: {
    label: 'Telefon w dłoni',
    short: 'Dłoń',
    steps: [
      'Trzymaj telefon swobodnie w dłoni.',
      'Bujaj nim w swoim naturalnym rytmie – albo trzymaj go nieruchomo, żeby zmierzyć mikroruchy dłoni.',
      'Utrzymuj ten sam rytm do sygnału końca.',
    ],
  },
  body: {
    label: 'Całe ciało',
    short: 'Ciało',
    steps: [
      'Po starcie masz 5 s: przyciśnij telefon płasko do mostka (środek klatki piersiowej) obiema dłońmi.',
      'Stań swobodnie, stopy na szerokość bioder, patrz przed siebie.',
      'Kołysz się całym ciałem w swoim rytmie albo stój spokojnie – zmierzysz naturalne wahania postawy.',
    ],
  },
}

function Chip({ active, onClick, children, disabled }: { active: boolean; onClick: () => void; children: ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1 font-mono text-xs transition-colors disabled:opacity-40 ${
        active ? 'border-neon/60 bg-neon/15 text-neon' : 'border-line text-muted hover:text-slate-100'
      }`}
    >
      {children}
    </button>
  )
}

/** Pierścień postępu z czasem i bieżącą częstotliwością. */
function ProgressRing({ state }: { state: MeasureState }) {
  const counting = state.phase === 'countdown'
  const p = counting ? 0 : Math.min(1, state.elapsed / state.duration)
  const r = 54
  const c = 2 * Math.PI * r
  const left = Math.max(0, Math.ceil(state.duration - state.elapsed))
  const live = state.live?.sway
  return (
    <div className="relative mx-auto size-40 shrink-0 sm:size-44">
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#1a2540" strokeWidth="6" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="url(#swayRing)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p)}
          style={{ transition: 'stroke-dashoffset 0.12s linear', filter: 'drop-shadow(0 0 6px #22e4ff)' }}
        />
        <defs>
          <linearGradient id="swayRing" x1="0" x2="1">
            <stop offset="0" stopColor="#22e4ff" />
            <stop offset="1" stopColor="#c86bff" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {counting ? (
          <>
            <span className="font-display text-5xl text-neon neon-text tabular-nums">{state.countdown}</span>
            <span className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted">przygotuj się</span>
          </>
        ) : (
          <>
            <span className="font-mono text-3xl tabular-nums text-slate-100">{left}s</span>
            <span className="mt-1 font-mono text-sm tabular-nums text-neon">{live ? `≈ ${hz3(live.hz)} Hz` : 'zbieram dane…'}</span>
          </>
        )}
      </div>
    </div>
  )
}

/** Sygnał z czujnika na żywo (ostatnie ~8 s). */
function LiveTrace({ trace }: { trace: number[] }) {
  const [ref, w] = useWidth<HTMLDivElement>()
  const h = 64
  const path = useMemo(() => {
    if (trace.length < 2 || !w) return ''
    const max = Math.max(1e-6, ...trace.map(Math.abs))
    return trace.map((v, i) => `${i ? 'L' : 'M'}${((i / (trace.length - 1)) * w).toFixed(1)},${(h / 2 - (v / max) * (h / 2 - 4)).toFixed(1)}`).join('')
  }, [trace, w])
  return (
    <div ref={ref} className="h-16 w-full overflow-hidden rounded-lg border border-line/60 bg-black/30">
      {w > 0 && (
        <svg width={w} height={h} aria-hidden="true">
          <line x1="0" x2={w} y1={h / 2} y2={h / 2} stroke="#1a2540" />
          <path d={path} fill="none" stroke={SWAY_COLOR} strokeWidth="1.6" style={{ filter: 'drop-shadow(0 0 4px #22e4ff)' }} />
        </svg>
      )}
    </div>
  )
}

function MeasureCard({ m }: { m: ReturnType<typeof useSwayMeasurement> }) {
  const mode = useSway((s) => s.mode)
  const setMode = useSway((s) => s.setMode)
  const duration = useSway((s) => s.duration)
  const setDuration = useSway((s) => s.setDuration)
  const { state } = m
  const busy = state.phase === 'countdown' || state.phase === 'recording'
  const err = state.phase === 'error' && state.error ? ERRORS[state.error] : null

  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-2 gap-1 rounded-xl border border-line/70 p-1" role="radiogroup" aria-label="Sposób pomiaru">
        {(['hand', 'body'] as const).map((id) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={mode === id}
            disabled={busy}
            onClick={() => setMode(id)}
            className={`rounded-lg px-3 py-2 text-sm transition-colors disabled:opacity-50 ${
              mode === id ? 'bg-neon/15 text-neon shadow-[0_0_18px_-8px_var(--color-neon)]' : 'text-muted hover:text-slate-100'
            }`}
          >
            {MODE_INFO[id].label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-wider text-muted">Czas pomiaru</span>
        {SWAY_DURATIONS.map((d) => (
          <Chip key={d} active={duration === d} onClick={() => setDuration(d)} disabled={busy}>
            {d < 60 ? `${d} s` : `${d / 60} min`}
          </Chip>
        ))}
      </div>

      {busy ? (
        <div className="space-y-3">
          <ProgressRing state={state} />
          {state.phase === 'recording' && <LiveTrace trace={state.trace} />}
          <p className="text-center text-xs text-muted">
            {state.phase === 'countdown'
              ? mode === 'body'
                ? 'Przyłóż telefon do mostka i stań swobodnie…'
                : 'Chwyć telefon swobodnie…'
              : `Pomiar trwa · ${state.source === 'accel' ? 'akcelerometr' : 'żyroskop'} · nie blokuj ekranu`}
          </p>
          <div className="flex justify-center">
            <Button variant="danger" icon="stop" onClick={m.stop}>
              {state.phase === 'recording' && state.elapsed >= 8 ? 'Zakończ i policz' : 'Anuluj'}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <ol className="space-y-1.5 text-[13px] leading-relaxed text-slate-300">
            {MODE_INFO[mode].steps.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-neon/40 font-mono text-[10px] text-neon">
                  {i + 1}
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
          {mode === 'body' && (
            <p className="text-[11px] leading-relaxed text-warn/90">Stań blisko ściany lub oparcia krzesła i przerwij, jeśli zakręci Ci się w głowie.</p>
          )}
          {err && (
            <div role="alert" className="space-y-1 rounded-xl border border-warn/40 bg-warn/[0.06] p-3">
              <div className="text-sm font-medium text-warn">{err.title}</div>
              <p className="text-xs leading-relaxed text-slate-300">{err.text}</p>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => void m.start(mode, duration)}
              className="group relative flex h-14 items-center gap-3 rounded-full border border-neon/60 bg-neon/15 px-7 font-display text-sm uppercase tracking-[0.2em] text-neon shadow-[0_0_32px_-8px_var(--color-neon)] transition-colors hover:bg-neon/25"
            >
              <Icon name="sway" className="size-6" />
              {state.phase === 'done' ? 'Zmierz ponownie' : 'Rozpocznij pomiar'}
            </button>
            {state.error === 'nodata' || state.error === 'unsupported' || state.error === 'insecure' ? (
              <Button variant="ghost" icon="play" onClick={() => m.demo(duration)}>
                Pokaz (dane symulowane)
              </Button>
            ) : null}
          </div>
          <p className="text-center text-[11px] text-muted">
            Odliczanie {COUNTDOWN_S[mode]} s, potem sygnał dźwiękowy i wibracja na start i koniec.
          </p>
        </>
      )}
    </div>
  )
}

/* ───────────── wynik ───────────── */

const TICKS = [0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20]

/** Widmo ruchu w skali log częstotliwości z pasmami posturograficznymi i zaznaczonymi szczytami. */
function SpectrumChart({ a }: { a: SwayAnalysis }) {
  const [ref, w] = useWidth<HTMLDivElement>()
  const h = 180
  const pad = { l: 8, r: 8, t: 22, b: 22 }
  const xMax = Math.max(4, a.spectrum.hz[a.spectrum.hz.length - 1] ?? 20)
  const lx0 = Math.log(SWAY_RANGE[0])
  const lx1 = Math.log(xMax)
  const iw = Math.max(1, w - pad.l - pad.r)
  const ih = h - pad.t - pad.b
  const x = (hz: number) => pad.l + ((Math.log(Math.min(xMax, Math.max(SWAY_RANGE[0], hz))) - lx0) / (lx1 - lx0)) * iw
  const maxP = Math.max(1e-12, ...a.spectrum.power)
  const DB = 45
  const y = (p: number) => pad.t + ih * Math.min(1, Math.max(0, -10 * Math.log10(Math.max(p, 1e-15) / maxP)) / DB)

  const line = a.spectrum.hz.map((hz, i) => `${i ? 'L' : 'M'}${x(hz).toFixed(1)},${y(a.spectrum.power[i]).toFixed(1)}`).join('')
  const area = line ? `${line}L${x(a.spectrum.hz[a.spectrum.hz.length - 1]).toFixed(1)},${pad.t + ih}L${x(a.spectrum.hz[0]).toFixed(1)},${pad.t + ih}Z` : ''
  const marks = [
    a.sway && { hz: a.sway.hz, color: SWAY_COLOR, label: `${hz3(a.sway.hz)} Hz` },
    a.tremor && a.tremorQuality !== 'weak' && { hz: a.tremor.hz, color: TREMOR_COLOR, label: `${formatHz(a.tremor.hz * 1000, 2)} Hz` },
  ].filter(Boolean) as { hz: number; color: string; label: string }[]

  return (
    <figure className="space-y-1.5">
      <div ref={ref} className="w-full overflow-hidden rounded-xl border border-line/60 bg-black/30">
        {w > 0 && (
          <svg width={w} height={h} role="img" aria-label="Widmo ruchu telefonu">
            <defs>
              <linearGradient id="swayArea" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor={SWAY_COLOR} stopOpacity="0.45" />
                <stop offset="1" stopColor={SWAY_COLOR} stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {POSTURE_BANDS.map((b) => {
              const x0 = x(b.from)
              const x1 = x(Math.min(b.to, xMax))
              return (
                <g key={b.id}>
                  <rect x={x0} y={pad.t} width={Math.max(0, x1 - x0)} height={ih} fill={BAND_COLORS[b.id]} opacity="0.07" />
                  <line x1={x1} x2={x1} y1={pad.t} y2={pad.t + ih} stroke={BAND_COLORS[b.id]} strokeOpacity="0.25" strokeDasharray="2 3" />
                  {x1 - x0 > 46 && (
                    <text x={(x0 + x1) / 2} y={14} textAnchor="middle" fontSize="9" fill={BAND_COLORS[b.id]} opacity="0.85" letterSpacing="1">
                      {b.id === 'low' ? 'WZROK · BŁĘDNIK' : b.id === 'mid' ? 'MÓŻDŻEK' : 'CZUCIE GŁĘBOKIE'}
                    </text>
                  )}
                </g>
              )
            })}
            <path d={area} fill="url(#swayArea)" />
            <path d={line} fill="none" stroke={SWAY_COLOR} strokeWidth="1.5" />
            {marks.map((mk, i) => {
              const mx = x(mk.hz)
              const anchor = mx > w - 70 ? 'end' : mx < 70 ? 'start' : 'middle'
              return (
                <g key={i}>
                  <line x1={mx} x2={mx} y1={pad.t} y2={pad.t + ih} stroke={mk.color} strokeWidth="1.2" strokeDasharray="4 3" />
                  <circle cx={mx} cy={pad.t + 3} r="3" fill={mk.color} />
                  <text
                    x={mx + (anchor === 'start' ? 5 : anchor === 'end' ? -5 : 0)}
                    y={pad.t + 16 + i * 13}
                    textAnchor={anchor}
                    fontSize="10.5"
                    fontWeight="600"
                    fontFamily="JetBrains Mono, monospace"
                    fill={mk.color}
                    stroke="#04060c"
                    strokeWidth="3.5"
                    strokeLinejoin="round"
                    paintOrder="stroke"
                  >
                    {mk.label}
                  </text>
                </g>
              )
            })}
            {TICKS.filter((t) => t <= xMax).map((t) => (
              <g key={t}>
                <line x1={x(t)} x2={x(t)} y1={pad.t + ih} y2={pad.t + ih + 4} stroke="#7d8bab" />
                <text
                  x={x(t)}
                  y={h - 6}
                  textAnchor={x(t) < 16 ? 'start' : x(t) > w - 16 ? 'end' : 'middle'}
                  fontSize="9.5"
                  fill="#7d8bab"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {t}
                </text>
              </g>
            ))}
          </svg>
        )}
      </div>
      <figcaption className="text-[11px] text-muted">
        Widmo mocy ruchu (skala logarytmiczna, Hz). Tło: pasma posturograficzne wg Paillarda i Noé.
      </figcaption>
    </figure>
  )
}

function Metric({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl border border-line/60 bg-white/[0.02] px-3 py-2">
      <div className="text-[10px] uppercase leading-tight tracking-wider text-muted">{label}</div>
      <div className="font-mono text-sm tabular-nums text-slate-100">{value}</div>
      {hint && <div className="mt-0.5 text-[10px] leading-snug text-muted">{hint}</div>}
    </div>
  )
}

function BandsBar({ a }: { a: SwayAnalysis }) {
  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-[10px] uppercase tracking-[0.18em] text-muted">Udział pasm (przemieszczenie)</h3>
        <div className="flex flex-wrap gap-1.5">
          {BANDS_SOURCES.map((id) => (
            <SourceLink key={id} id={id} compact />
          ))}
        </div>
      </div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/5">
        {a.bands.map((b) => (
          <div key={b.id} style={{ width: `${b.share * 100}%`, background: BAND_COLORS[b.id] }} title={`${b.label}: ${Math.round(b.share * 100)}%`} />
        ))}
      </div>
      <ul className="grid gap-x-5 gap-y-1 text-[12px] sm:grid-cols-3">
        {a.bands.map((b) => (
          <li key={b.id} className="flex items-center gap-1.5 text-slate-300">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: BAND_COLORS[b.id] }} />
            <span className="min-w-0 truncate">{b.label}</span>
            <span className="ml-auto font-mono tabular-nums text-slate-100">{Math.round(b.share * 100)}%</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function ResultView({ state, onBinaural }: { state: MeasureState; onBinaural: (hz: number) => void }) {
  const a = state.result!
  const s = a.sway
  const perMin = s ? s.hz * 60 : 0
  const tremorShown = a.tremor && a.tremorQuality !== 'weak'
  return (
    <div className="space-y-4 border-t border-line/60 p-4">
      {state.demo && (
        <p className="rounded-lg border border-plasma/40 bg-plasma/10 px-3 py-2 text-xs text-plasma">
          Pokaz na danych symulowanych (kołysanie + drżenie fizjologiczne) – wynik nie jest zapisywany.
        </p>
      )}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="font-display text-[10px] uppercase tracking-[0.22em] text-muted">Częstotliwość bujania</div>
          {s ? (
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="neon-text font-mono text-5xl tabular-nums text-neon sm:text-6xl">{hz3(s.hz)}</span>
              <span className="text-lg text-neon/80">Hz</span>
            </div>
          ) : (
            <div className="font-mono text-3xl text-muted">—</div>
          )}
          {s && (
            <div className="mt-1 font-mono text-[13px] tabular-nums text-slate-300">
              {fixed(perMin, 1)} cykli/min · okres {fixed(1 / s.hz, 2)} s
              {a.swayAngleDeg !== null && a.swayAngleDeg > 0.05 && <> · wychylenie ≈ ±{fixed(a.swayAngleDeg, a.swayAngleDeg < 10 ? 1 : 0)}°</>}
            </div>
          )}
        </div>
        <span className="self-start sm:self-auto">
          <QualityPill q={a.swayQuality} />
        </span>
      </section>

      {a.swayQuality === 'weak' && (
        <p className="text-xs leading-relaxed text-warn">
          W zakresie 0,05–3,5 Hz nie widać jednego wyraźnego rytmu. Kołysz się równomiernie przez cały pomiar albo wybierz dłuższy czas.
          Średnia częstotliwość ruchu: {hz3(a.meanHz)} Hz.
        </p>
      )}

      <SpectrumChart a={a} />

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Metric
          label="Średnia częstotliwość"
          value={`${hz3(a.meanHz)} Hz`}
          hint={<>wyższa = szybsze, drobniejsze korekty postawy</>}
        />
        <Metric
          label="Szybkie drgania"
          value={tremorShown ? `${formatHz(a.tremor!.hz * 1000, 2)} Hz` : 'brak wyraźnych'}
          hint={`${Math.round(a.tremorShare * 100)}% mocy ruchu (${TREMOR_RANGE[0]}–${TREMOR_RANGE[1]} Hz)`}
        />
        <Metric label="Rozdzielczość" value={`${formatHz(a.resolution * 1000, 3)} Hz`} hint="1 / czas nagrania; szczyt doprecyzowany do 0.001 Hz" />
        <Metric
          label="Czujnik"
          value={`${a.source === 'gyro' ? 'żyroskop' : 'akcelerometr'} · ${a.fs} Hz`}
          hint={`${fixed(a.duration, 1)} s nagrania${a.maxGap > 0.5 ? ` · przerwa ${fixed(a.maxGap, 1)} s!` : ''}`}
        />
      </div>

      <BandsBar a={a} />

      <div className="flex flex-wrap gap-2">
        {s && (
          <Button icon="binaural" onClick={() => onBinaural(s.hz)} title="Tworzy falę binauralną z dudnieniem równym zmierzonej częstotliwości">
            Użyj jako dudnienia binauralnego
          </Button>
        )}
        {state.savedId && !state.demo && (
          <span className="inline-flex items-center gap-1.5 text-xs text-signal">
            <Icon name="check" className="size-4" /> Zapisano w historii na tym urządzeniu
          </span>
        )}
      </div>
    </div>
  )
}

/* ───────────── badania ───────────── */

function FindingsPanel({ a }: { a: SwayAnalysis | null }) {
  const [showAll, setShowAll] = useState(false)
  const swayF = a?.sway ? findingsFor(a.sway.hz, 'sway') : []
  const tremorF = a?.tremor && a.tremorQuality !== 'weak' ? findingsFor(a.tremor.hz, 'tremor') : []
  const matched = new Set([...swayF, ...tremorF].map((f) => f.id))
  const rest = FINDINGS.filter((f) => !matched.has(f.id))

  return (
    <Panel
      title={
        <span className="flex items-center gap-2">
          <Icon name="info" className="size-4 shrink-0 text-plasma" />
          Co mówią badania
        </span>
      }
      bodyClassName="space-y-4 p-4 lg:overflow-y-auto"
      className="min-w-0 shrink-0 lg:min-h-0 lg:flex-1"
    >
      {a ? (
        <>
          {a.sway && (
            <section className="space-y-2">
              <h3 className="font-display text-[10px] uppercase tracking-[0.18em] text-neon">
                Bujanie {hz3(a.sway.hz)} Hz {a.swayQuality === 'weak' && <span className="normal-case tracking-normal text-warn">(rytm niewyraźny)</span>}
              </h3>
              {swayF.length ? swayF.map((f) => <FindingCard key={f.id} f={f} />) : <p className="text-xs text-muted">Brak opisów dla tej częstotliwości.</p>}
            </section>
          )}
          {tremorF.length > 0 && (
            <section className="space-y-2">
              <h3 className="font-display text-[10px] uppercase tracking-[0.18em] text-plasma">Szybkie drgania {formatHz(a.tremor!.hz * 1000, 2)} Hz</h3>
              {tremorF.map((f) => (
                <FindingCard key={f.id} f={f} accent={TREMOR_COLOR} />
              ))}
            </section>
          )}
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            aria-expanded={showAll}
            className="flex w-full items-center justify-between rounded-lg border border-line/70 px-3 py-2 text-xs text-muted hover:text-slate-100"
          >
            {showAll ? 'Schowaj pozostałe zakresy' : `Pozostałe zakresy częstotliwości (${rest.length})`}
            <span aria-hidden="true">{showAll ? '▴' : '▾'}</span>
          </button>
          {showAll && rest.map((f) => <FindingCard key={f.id} f={f} dim />)}
        </>
      ) : (
        <>
          <p className="text-[13px] leading-relaxed text-slate-300">
            Po pomiarze zobaczysz tu opisy badań pasujące do Twojej częstotliwości. Zakresy opisane w aplikacji:
          </p>
          <FrequencyMap />
          {FINDINGS.map((f) => (
            <FindingCard key={f.id} f={f} dim accent={f.kinds.includes('tremor') && !f.kinds.includes('sway') ? TREMOR_COLOR : SWAY_COLOR} />
          ))}
        </>
      )}
      <Disclaimer />
    </Panel>
  )
}

/** Mapa opisanych zakresów na osi log 0,05–20 Hz. */
function FrequencyMap() {
  const [ref, w] = useWidth<HTMLDivElement>()
  const rowH = 14
  const rows = FINDINGS.length
  const h = rows * rowH + 22
  const x = (hz: number) => 4 + ((Math.log(Math.max(0.05, Math.min(20, hz))) - Math.log(0.05)) / (Math.log(20) - Math.log(0.05))) * (w - 8)
  return (
    <div ref={ref} className="w-full overflow-hidden rounded-xl border border-line/60 bg-black/30 p-0">
      {w > 0 && (
        <svg width={w} height={h} role="img" aria-label="Zakresy częstotliwości opisane w badaniach">
          {FINDINGS.map((f, i) => {
            const color = f.kinds.includes('tremor') && !f.kinds.includes('sway') ? TREMOR_COLOR : SWAY_COLOR
            const x0 = x(f.from)
            const x1 = x(f.to)
            return (
              <g key={f.id}>
                <title>{`${f.title} (${rangeLabel(f)})`}</title>
                <rect x={x0} y={6 + i * rowH} width={Math.max(3, x1 - x0)} height={rowH - 5} rx="4" fill={color} opacity="0.55" />
              </g>
            )
          })}
          {TICKS.map((t) => (
            <text
              key={t}
              x={x(t)}
              y={h - 4}
              textAnchor={x(t) < 16 ? 'start' : x(t) > w - 16 ? 'end' : 'middle'}
              fontSize="9"
              fill="#7d8bab"
              fontFamily="JetBrains Mono, monospace"
            >
              {t}
            </text>
          ))}
        </svg>
      )}
    </div>
  )
}

/* ───────────── historia ───────────── */

function HistoryPanel({ currentId, onShow }: { currentId: string | null; onShow: (id: string) => void }) {
  const history = useSway((s) => s.history)
  const remove = useSway((s) => s.remove)
  const fmt = useMemo(() => new Intl.DateTimeFormat('pl-PL', { dateStyle: 'short', timeStyle: 'short' }), [])
  return (
    <Panel
      title={
        <span className="flex items-center gap-2">
          <Icon name="folder" className="size-4 shrink-0 text-neon" />
          Historia pomiarów
        </span>
      }
      className="min-w-0 shrink-0 lg:max-h-[40%]"
      bodyClassName="lg:overflow-y-auto"
    >
      {history.length ? (
        <ul className="divide-y divide-line/50">
          {history.map((h) => {
            const s = h.analysis.sway
            return (
              <li key={h.id} className={`flex items-center gap-2 px-3 py-2 ${h.id === currentId ? 'bg-neon/[0.06]' : ''}`}>
                <button type="button" onClick={() => onShow(h.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <span className="w-[5.5rem] shrink-0 font-mono text-sm tabular-nums text-neon">{s ? `${hz3(s.hz)}` : '—'}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs text-slate-200">
                      {MODE_INFO[h.mode].short} · {Math.round(h.analysis.duration)} s · {QUALITY_LABEL[h.analysis.swayQuality].text}
                    </span>
                    <span className="block text-[10px] text-muted">{fmt.format(new Date(h.at))}</span>
                  </span>
                </button>
                <IconButton size="sm" icon="trash" label="Usuń pomiar" onClick={() => remove(h.id)} />
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="p-4 text-center text-xs text-muted">Brak pomiarów. Wyniki zapisują się na tym urządzeniu.</p>
      )}
    </Panel>
  )
}

/* ───────────── zakładka ───────────── */

export function SwayLab() {
  const m = useSwayMeasurement()
  const { state } = m
  const result = state.phase === 'done' ? state.result : null
  const resultRef = useRef<HTMLDivElement>(null)

  // po pomiarze przewiń do wyniku (na telefonie wynik jest pod przyciskiem)
  useEffect(() => {
    if (result) resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [result])

  const toBinaural = (hz: number) => {
    useBinaural.getState().add({ name: `Bujanie ${hz3(hz)} Hz`, beatMilliHz: hz * 1000, carrierMilliHz: 200_000, volume: 0.5 })
    useUi.getState().setMode('binaural')
    useUi.getState().showNotice({ text: `Utworzono falę binauralną z dudnieniem ${hz3(hz)} Hz (nośna 200 Hz). Załóż słuchawki i naciśnij odtwarzanie.` })
  }

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:overflow-hidden xl:grid-cols-[minmax(0,1fr)_460px]">
      <Panel
        title={
          <span className="flex items-center gap-2">
            <Icon name="sway" className="size-4 shrink-0 text-neon" />
            Częstotliwość bujania<span className="hidden sm:inline"> · czujniki ruchu telefonu</span>
          </span>
        }
        className="min-w-0 shrink-0 lg:min-h-0 lg:shrink"
        bodyClassName="lg:overflow-y-auto"
      >
        <MeasureCard m={m} />
        <div ref={resultRef} className="scroll-mt-2">
          {result && <ResultView state={state} onBinaural={toBinaural} />}
        </div>
      </Panel>
      <div className="flex min-w-0 shrink-0 flex-col gap-3 lg:min-h-0 lg:shrink">
        <FindingsPanel a={result} />
        <HistoryPanel currentId={state.savedId} onShow={m.show} />
      </div>
    </div>
  )
}
