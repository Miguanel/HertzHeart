import { useEffect, useMemo, useRef, useState } from 'react'
import { detectCouplings, hasBrainMatch, matchFrequency, type BrainCoupling, type BrainTone, type CouplingMatch } from '../data/brainwaves'
import { formatHz } from '../model/frequency'
import type { Track } from '../model/schema'
import { useProjectStore } from '../store/projectStore'
import { useSettings } from '../store/settings'
import { useUi } from '../store/uiStore'
import { BrainMap } from './BrainMap'
import { Icon } from './icons'
import { Badge } from './InfoContent'
import { Sheet } from './ui'

const fmtRange = (min: number, max: number) => `${trimHz(min)}–${trimHz(max)} Hz`
const trimHz = (hz: number) => String(Number(hz.toFixed(3))).replace('.', ',')

function Field({ label, children }: { label: string; children: string }) {
  return (
    <section className="space-y-1">
      <h4 className="font-display text-[10px] uppercase tracking-[0.18em] text-muted">{label}</h4>
      <p className="text-sm leading-relaxed text-slate-300">{children}</p>
    </section>
  )
}

const toneBorder = (tone: BrainTone) => (tone === 'warn' ? 'border-warn/40 bg-warn/[0.06]' : 'border-line/70 bg-white/[0.02]')

export function Disclaimer() {
  return (
    <p className="text-[11px] leading-relaxed text-muted">
      Opisy dotyczą oscylacji mierzonych w mózgu (EEG/iEEG) i mają charakter edukacyjny. Dźwięk lub dudnienie o tej
      częstotliwości nie oznacza, że mózg zacznie ją wytwarzać – badania nad „dostrajaniem” mózgu dźwiękiem dają
      niejednoznaczne wyniki. To nie jest porada medyczna.
    </p>
  )
}

/** Pełny opis: pasmo (podsekcja), zjawiska precyzyjne i ostrzeżenia. */
export function BrainInfoView({ hz, compact = false }: { hz: number; compact?: boolean }) {
  const decimals = useSettings((s) => s.decimals)
  const match = matchFrequency(hz)
  if (!hasBrainMatch(match)) {
    return (
      <p className="text-sm text-muted">
        {formatHz(hz * 1000, decimals)} Hz nie należy do żadnego pasma z tabeli fal mózgowych (0,001–1000 Hz).
      </p>
    )
  }
  const { band, phenomena } = match
  const phenRegions = [...new Set(phenomena.flatMap((p) => p.regions))].filter((r) => !band?.regions.includes(r))
  return (
    <div className="space-y-3">
      <BrainMap
        size={compact ? 'sm' : 'md'}
        highlights={[
          ...(band ? [{ regions: band.regions, color: band.color, label: band.name }] : []),
          ...(phenRegions.length ? [{ regions: phenRegions, color: '#c86bff', label: 'zjawiska' }] : []),
        ]}
      />
      {band && (
        <div className={`space-y-3 rounded-xl border p-3 ${toneBorder(band.tone)}`}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ background: band.color, boxShadow: `0 0 10px ${band.color}` }} />
            <span className="font-medium text-slate-100">{band.name}</span>
            <Badge>{fmtRange(band.min, band.max)}</Badge>
            {band.tone === 'warn' && <Badge tone="warn">⚠ stan niepożądany / kliniczny</Badge>}
          </div>
          <Field label="Odczuwane stany / efekty">{band.states}</Field>
          {!compact && <Field label="Aktywny obszar mózgu">{band.area}</Field>}
          {!compact && <Field label="Ciekawostki i raporty kliniczne">{band.notes}</Field>}
        </div>
      )}
      {phenomena.map((p) => (
        <div key={p.id} className={`space-y-2 rounded-xl border p-3 ${toneBorder(p.tone)}`}>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={p.tone === 'warn' ? 'warn' : 'neon'}>{p.label}</Badge>
            <span className="text-sm font-medium text-slate-100">{p.name}</span>
          </div>
          {!compact && <Field label="Obszar mózgu / źródło">{p.area}</Field>}
          <Field label="Znaczenie naukowe i kliniczne">{p.notes}</Field>
        </div>
      ))}
    </div>
  )
}

export function CouplingCard({ match, decimals, compact = false }: { match: CouplingMatch; decimals: number; compact?: boolean }) {
  const c: BrainCoupling = match.coupling
  return (
    <div className={`space-y-2 rounded-xl border p-3 ${toneBorder(c.tone)}`}>
      <div className="flex flex-wrap items-center gap-2">
        <Icon name="brain" className="size-4 text-plasma" />
        <span className="text-sm font-medium text-slate-100">{c.name}</span>
        <Badge tone={c.tone === 'warn' ? 'warn' : 'neon'}>{c.subtitle}</Badge>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {c.components.map((comp, i) => (
          <Badge key={comp.label}>
            {comp.label}: {match.hits[i].map((f) => `${formatHz(f * 1000, Math.min(decimals, 3))} Hz`).join(', ')}
          </Badge>
        ))}
      </div>
      <Field label="Odczuwany stan / zastosowanie">{c.states}</Field>
      <Field label="Obszary i płaszczyzny">{c.areas}</Field>
      <BrainMap size="sm" highlights={[{ regions: c.regions, color: c.tone === 'warn' ? '#ffb547' : '#c86bff' }]} />
      {!compact && <Field label="Mechanizm działania">{c.mechanism}</Field>}
    </div>
  )
}

/** Mały przycisk z kolorem pasma – otwiera opis. */
export function BrainBadge({ hz, source, className = '' }: { hz: number; source: string; className?: string }) {
  const show = useUi((s) => s.showBrainInfo)
  const match = matchFrequency(hz)
  if (!hasBrainMatch(match)) return null
  const color = match.band?.color ?? '#c86bff'
  const warn = match.band?.tone === 'warn' || match.phenomena.some((p) => p.tone === 'warn')
  const label = `Fale mózgowe: ${match.band?.name ?? match.phenomena[0].name}`
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={() => show({ hz, source })}
      className={`relative inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-line transition-colors hover:border-plasma/60 ${className}`}
      style={{ color }}
    >
      <Icon name="brain" className="size-4" />
      {warn && <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-warn" />}
    </button>
  )
}

/** Okno z opisem pasma – jedno dla całej aplikacji. */
export function BrainInfoSheet() {
  const info = useUi((s) => s.brainInfo)
  const show = useUi((s) => s.showBrainInfo)
  const decimals = useSettings((s) => s.decimals)
  return (
    <Sheet open={info !== null} onClose={() => show(null)} title="Fale mózgowe">
      {info && (
        <div className="space-y-4">
          <div className="space-y-1 border-b border-line/70 pb-3">
            <div className="text-xs text-muted">{info.source}</div>
            <div className="font-mono text-lg text-neon">{formatHz(info.hz * 1000, decimals)} Hz</div>
          </div>
          <BrainInfoView hz={info.hz} />
          <Disclaimer />
        </div>
      )}
    </Sheet>
  )
}

/** Dudnienia binauralne w projekcie: sąsiednie ścieżki L i P (tak tworzy je biblioteka i zakładka binauralna). */
export function projectBeats(tracks: readonly Track[]): { hz: number; name: string }[] {
  const beats: { hz: number; name: string }[] = []
  for (let i = 0; i + 1 < tracks.length; i++) {
    const a = tracks[i]
    const b = tracks[i + 1]
    if (a.muted || b.muted) continue
    if ((a.pan ?? 0) <= -0.5 && (b.pan ?? 0) >= 0.5) {
      const hz = Math.abs(b.frequencyMilliHz - a.frequencyMilliHz) / 1000
      if (hz > 0 && hz <= 1000) beats.push({ hz, name: a.name.replace(/\s*·\s*L$/, '') })
      i++
    }
  }
  return beats
}

function projectFrequencies(tracks: readonly Track[]): number[] {
  const tones = tracks.filter((t) => !t.muted).map((t) => t.frequencyMilliHz / 1000)
  return [...tones, ...projectBeats(tracks).map((b) => b.hz)]
}

/** Pasek nad osią czasu: dudnienia binauralne w projekcie i wykryte sprzężenia CFC. */
export function ProjectBrainStrip() {
  const tracks = useProjectStore((s) => s.composition.tracks)
  const decimals = useSettings((s) => s.decimals)
  const show = useUi((s) => s.showBrainInfo)
  const [beats, couplings] = useMemo(() => {
    return [projectBeats(tracks), detectCouplings(projectFrequencies(tracks))] as const
  }, [tracks])
  const [openCfc, setOpenCfc] = useState(false)

  if (!beats.length && !couplings.length) return null
  return (
    <div className="glass shrink-0 space-y-2 px-3 py-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <Icon name="brain" className="size-4 text-plasma" />
        <span className="mr-1 font-display text-[10px] uppercase tracking-[0.18em] text-muted">Fale mózgowe</span>
        {beats.map((b, i) => {
          const m = matchFrequency(b.hz)
          return (
            <button
              key={i}
              type="button"
              onClick={() => show({ hz: b.hz, source: `Dudnienie binauralne „${b.name}”` })}
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[11px] text-slate-200 hover:border-plasma/60"
            >
              <span className="size-2 rounded-full" style={{ background: m.band?.color ?? '#7d8bab' }} />
              🎧 {formatHz(b.hz * 1000, Math.min(decimals, 3))} Hz · {m.band?.name ?? 'poza tabelą'}
            </button>
          )
        })}
        {couplings.length > 0 && (
          <button
            type="button"
            onClick={() => setOpenCfc(!openCfc)}
            className="inline-flex items-center gap-1 rounded-full border border-plasma/50 bg-plasma/10 px-2.5 py-1 text-[11px] text-plasma"
            aria-expanded={openCfc}
          >
            Sprzężenia CFC: {couplings.length} {openCfc ? '▴' : '▾'}
          </button>
        )}
      </div>
      {openCfc && couplings.length > 0 && (
        <div className="grid gap-2 pb-1 xl:grid-cols-2">
          {couplings.map((c) => (
            <CouplingCard key={c.coupling.id} match={c} decimals={decimals} compact />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Jawna informacja przy dodaniu ścieżki lub zmianie częstotliwości: do jakiego pasma fal mózgowych należy
 * wybrana częstotliwość (dla pary L/P – częstotliwość dudnienia).
 */
export function useBrainwaveNotices() {
  const comp = useProjectStore((s) => s.composition)
  const enabled = useSettings((s) => s.brainwaveNotices)
  const decimals = useSettings((s) => s.decimals)
  const prev = useRef<{ id: string; freqs: Map<string, number> } | null>(null)

  useEffect(() => {
    const freqs = new Map(comp.tracks.map((t) => [t.id, t.frequencyMilliHz]))
    const before = prev.current
    prev.current = { id: comp.id, freqs }
    if (!enabled || !before || before.id !== comp.id) return
    const changed = comp.tracks.filter((t) => before.freqs.get(t.id) !== t.frequencyMilliHz)
    if (!changed.length || changed.length > 2) return

    let hz: number
    let source: string
    if (changed.length === 2 && (changed[0].pan ?? 0) <= -0.5 && (changed[1].pan ?? 0) >= 0.5) {
      hz = Math.abs(changed[1].frequencyMilliHz - changed[0].frequencyMilliHz) / 1000
      source = `Dudnienie binauralne „${changed[0].name.replace(/\s*·\s*L$/, '')}”`
    } else {
      const t = changed[changed.length - 1]
      hz = t.frequencyMilliHz / 1000
      source = `Ścieżka „${t.name}”`
    }
    const m = matchFrequency(hz)
    if (!hasBrainMatch(m)) return
    const warn = m.band?.tone === 'warn' || m.phenomena.some((p) => p.tone === 'warn')
    const parts = [m.band ? `${m.band.name} (${fmtRange(m.band.min, m.band.max)})` : null, ...m.phenomena.map((p) => p.name)].filter(Boolean)
    useUi.getState().showNotice({
      text: `${source}: ${formatHz(hz * 1000, Math.min(decimals, 3))} Hz należy do podsekcji ${parts.join(' · ')}.${
        m.band ? ` ${m.band.states}` : ''
      }`,
      info: { hz, source },
      tone: warn ? 'warn' : 'neutral',
    })
  }, [comp, enabled, decimals])
}
