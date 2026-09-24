import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import { engine } from '../audio/engine'
import { useAnimationFrame, useDoubleTap } from '../hooks/usePlayback'
import { compositionDuration, trackColor } from '../model/envelope'
import { WAVEFORMS, type Clip, type Track, type Waveform } from '../model/schema'
import { WAVEFORM_LABELS } from '../model/frequency'
import { clamp, formatTime, snap } from '../model/time'
import { useProjectStore } from '../store/projectStore'
import { envelopeArea, envelopeLine, niceStep } from './envelopePath'
import { Button, FrequencyField, IconButton, Panel, Slider } from './ui'

const HEADER_W = 336
const RULER_H = 28

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(800)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, width] as const
}

export function Timeline({ onOpenLibrary }: { onOpenLibrary: () => void }) {
  const comp = useProjectStore((s) => s.composition)
  const [scrollerRef, viewW] = useWidth<HTMLDivElement>()
  const [zoom, setZoom] = useState<number | null>(null)
  const playheadRef = useRef<HTMLDivElement>(null)
  const selectedTrackId = useProjectStore((s) => s.selectedTrackId)
  const trackCount = comp.tracks.length
  const prevCount = useRef(trackCount)

  // Nowo dodana ścieżka zawsze trafia w pole widzenia (na telefonie była ukryta poniżej).
  useEffect(() => {
    const added = trackCount > prevCount.current
    prevCount.current = trackCount
    if (!added || !selectedTrackId) return
    const row = document.querySelector(`[data-track-id="${selectedTrackId}"]`)
    row?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [trackCount, selectedTrackId])

  const wide = viewW >= 640
  const headerW = wide ? HEADER_W : 0
  const laneH = wide ? 84 : 60
  const duration = compositionDuration(comp)
  const span = Math.max(duration * 1.08 + 5, 60)
  const fitPps = Math.max(0.05, (viewW - headerW - 12) / span)
  const pps = zoom ?? fitPps
  const laneW = Math.max(viewW - headerW, span * pps)
  const step = niceStep(pps)
  const decimals = step < 1 ? 1 : 0

  useAnimationFrame((pos) => {
    if (playheadRef.current) playheadRef.current.style.transform = `translateX(${headerW + pos * pps}px)`
  })

  const seekFromRuler = (e: RPointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    engine.seek(useProjectStore.getState().composition, Math.max(0, (e.clientX - rect.left) / pps))
  }

  const zoomBy = (k: number) => setZoom(clamp(pps * k, 0.05, 400))

  return (
    <Panel
      title={`Oś czasu · ${trackCount} ${trackLabel(trackCount)}`}
      actions={
        <>
          <IconButton size="sm" icon="zoomOut" label="Oddal" onClick={() => zoomBy(1 / 1.5)} />
          <IconButton size="sm" icon="fit" label="Dopasuj" onClick={() => setZoom(null)} active={zoom === null} />
          <IconButton size="sm" icon="zoomIn" label="Przybliż" onClick={() => zoomBy(1.5)} />
        </>
      }
      className="shrink-0"
    >
      {/* Bez wewnętrznego limitu wysokości – przewija się cała kolumna edytora, więc żadna ścieżka się nie chowa. */}
      <div ref={scrollerRef} className="relative overflow-x-auto overflow-y-hidden">
        {comp.tracks.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <div className="text-sm text-slate-300">Projekt jest pusty.</div>
            <div className="max-w-sm text-xs text-muted">
              Dodaj częstotliwość z biblioteki – każda staje się ścieżką z segmentami czasowymi i własnym diagramem głośności.
            </div>
            <Button variant="primary" icon="library" onClick={onOpenLibrary} className="lg:hidden">
              Otwórz bibliotekę
            </Button>
          </div>
        ) : (
          <div className="relative" style={{ width: headerW + laneW }}>
            {/* Linijka */}
            <div className="relative z-30 flex border-b border-line/70 bg-panel" style={{ height: RULER_H }}>
              {wide && <div className="sticky left-0 z-10 shrink-0 bg-panel" style={{ width: headerW }} />}
              <div className="relative cursor-pointer" style={{ width: laneW }} onPointerDown={seekFromRuler} title="Kliknij, aby przewinąć">
                {Array.from({ length: Math.floor(laneW / pps / step) + 1 }, (_, i) => i * step).map((t) => (
                  <div key={t} className="absolute top-0 h-full border-l border-line/80 pl-1" style={{ left: t * pps }}>
                    <span className="font-mono text-[10px] text-muted">{formatTime(t, decimals)}</span>
                  </div>
                ))}
              </div>
            </div>

            {comp.tracks.map((track, i) => (
              <TrackRow
                key={track.id}
                track={track}
                color={trackColor(i)}
                wide={wide}
                viewW={viewW}
                headerW={headerW}
                laneW={laneW}
                laneH={laneH}
                pps={pps}
                gridStep={step}
              />
            ))}

            <div
              ref={playheadRef}
              className="pointer-events-none absolute bottom-0 left-0 top-0 z-30 w-px bg-signal shadow-[0_0_10px_var(--color-signal)]"
            />
          </div>
        )}
      </div>
    </Panel>
  )
}

interface RowProps {
  track: Track
  color: string
  wide: boolean
  viewW: number
  headerW: number
  laneW: number
  laneH: number
  pps: number
  gridStep: number
}

function TrackRow({ track, color, wide, viewW, headerW, laneW, laneH, pps, gridStep }: RowProps) {
  const selectedTrackId = useProjectStore((s) => s.selectedTrackId)
  const selectedClipId = useProjectStore((s) => s.selectedClipId)
  const addClip = useProjectStore((s) => s.addClip)
  const select = useProjectStore((s) => s.select)
  const selected = selectedTrackId === track.id

  const onLaneTap = useDoubleTap((e) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    addClip(track.id, snap((e.clientX - rect.left) / pps, 0.5))
  })

  return (
    <div
      data-track-id={track.id}
      className={`relative flex scroll-my-4 border-b border-line/50 ${wide ? 'flex-row' : 'flex-col'} ${selected ? 'bg-white/[0.025]' : ''}`}
    >
      <div
        className="sticky left-0 z-40 shrink-0 border-r border-line/50 bg-panel"
        style={{ width: wide ? headerW : viewW, height: wide ? laneH : undefined, boxShadow: selected ? `inset 3px 0 0 ${color}` : undefined }}
        onPointerDown={() => !selected && select(track.id, track.clips[0]?.id ?? null)}
      >
        <TrackHeader track={track} color={color} />
      </div>
      <div
        className="relative shrink-0"
        style={{
          width: laneW,
          height: laneH,
          backgroundImage: 'linear-gradient(to right, rgba(125,139,171,0.07) 1px, transparent 1px)',
          backgroundSize: `${gridStep * pps}px 100%`,
        }}
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) onLaneTap(e)
        }}
        title="Dwuklik / podwójne stuknięcie – nowy segment"
      >
        {track.clips.map((clip) => (
          <ClipBlock
            key={clip.id}
            clip={clip}
            track={track}
            color={color}
            pps={pps}
            selected={selectedClipId === clip.id}
          />
        ))}
      </div>
    </div>
  )
}

function TrackHeader({ track, color }: { track: Track; color: string }) {
  const updateTrack = useProjectStore((s) => s.updateTrack)
  const removeTrack = useProjectStore((s) => s.removeTrack)
  const addClip = useProjectStore((s) => s.addClip)
  const [name, setName] = useState<string | null>(null)
  const pan = track.pan ?? 0

  const panBtn = (value: number, label: string, title: string) => (
    <button
      type="button"
      title={title}
      aria-pressed={pan === value}
      onClick={() => updateTrack(track.id, { pan: value })}
      className={`h-full min-w-8 px-1.5 font-mono text-[11px] transition-colors ${
        pan === value ? 'bg-plasma/20 text-plasma' : 'text-muted hover:text-slate-100'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="flex h-full flex-col justify-center gap-1.5 px-2.5 py-2">
      <div className="flex items-center gap-1.5">
        <span className="size-2.5 shrink-0 rounded-full" style={{ background: color, boxShadow: `0 0 10px ${color}` }} />
        <input
          aria-label="Nazwa ścieżki"
          value={name ?? track.name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => {
            if (name !== null) updateTrack(track.id, { name: name.trim() || 'Ścieżka' })
            setName(null)
          }}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          className="min-w-0 flex-1 truncate rounded bg-transparent px-1 text-sm text-slate-100 outline-none focus:bg-white/5"
        />
        <Slider
          label={`Głośność ścieżki ${Math.round(track.volume * 100)}%`}
          value={track.volume}
          onChange={(v) => updateTrack(track.id, { volume: v })}
          className="w-16 shrink-0 sm:w-20"
        />
        <IconButton
          size="sm"
          icon={track.muted ? 'mute' : 'volume'}
          label={track.muted ? 'Włącz ścieżkę' : 'Wycisz ścieżkę'}
          variant={track.muted ? 'danger' : 'ghost'}
          onClick={() => updateTrack(track.id, { muted: !track.muted })}
        />
        <IconButton size="sm" icon="plus" label="Dodaj segment" onClick={() => addClip(track.id)} />
        <IconButton size="sm" icon="trash" label="Usuń ścieżkę" onClick={() => removeTrack(track.id)} />
      </div>
      <div className="flex items-center gap-1.5">
        <FrequencyField
          mHz={track.frequencyMilliHz}
          onCommit={(mHz) => updateTrack(track.id, { frequencyMilliHz: mHz })}
          className="w-[7.75rem] shrink-0"
        />
        <select
          aria-label="Kształt fali"
          value={track.waveform}
          onChange={(e) => updateTrack(track.id, { waveform: e.target.value as Waveform })}
          className="field h-8 min-w-0 flex-1 text-xs outline-none"
        >
          {WAVEFORMS.map((w) => (
            <option key={w} value={w}>
              {WAVEFORM_LABELS[w]}
            </option>
          ))}
        </select>
        <div role="group" aria-label="Kanał stereo" className="flex h-8 shrink-0 overflow-hidden rounded-lg border border-line">
          {panBtn(-1, 'L', 'Tylko lewy głośnik / słuchawka')}
          {panBtn(0, 'L+P', 'Oba kanały')}
          {panBtn(1, 'P', 'Tylko prawy głośnik / słuchawka')}
        </div>
      </div>
    </div>
  )
}

const trackLabel = (n: number) => (n === 1 ? 'ścieżka' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 'ścieżki' : 'ścieżek')

interface DragState {
  mode: 'move' | 'resize'
  x: number
  start: number
  duration: number
  moved: boolean
}

function ClipBlock({ clip, track, color, pps, selected }: { clip: Clip; track: Track; color: string; pps: number; selected: boolean }) {
  const setClipTiming = useProjectStore((s) => s.setClipTiming)
  const removeClip = useProjectStore((s) => s.removeClip)
  const select = useProjectStore((s) => s.select)
  const drag = useRef<DragState | null>(null)
  const width = Math.max(6, clip.duration * pps)
  const timeStep = pps > 40 ? 0.1 : pps > 4 ? 0.5 : 5

  const begin = (e: RPointerEvent<HTMLElement>, mode: DragState['mode']) => {
    e.stopPropagation()
    const wasSelected = selected
    select(track.id, clip.id)
    // Dotyk: pierwsze stuknięcie tylko zaznacza (żeby dało się przewijać oś czasu palcem).
    if (e.pointerType === 'touch' && !wasSelected) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { mode, x: e.clientX, start: clip.start, duration: clip.duration, moved: false }
  }

  const move = (e: RPointerEvent<HTMLElement>) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.x
    if (!d.moved && Math.abs(dx) < 4) return
    d.moved = true
    const dt = dx / pps
    if (d.mode === 'move') setClipTiming(clip.id, snap(d.start + dt, timeStep), d.duration)
    else setClipTiming(clip.id, d.start, snap(d.duration + dt, timeStep))
  }

  const end = () => {
    drag.current = null
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Segment ${formatTime(clip.start)} – ${formatTime(clip.start + clip.duration)}`}
      aria-pressed={selected}
      className="absolute bottom-1.5 top-1.5 cursor-grab overflow-hidden rounded-lg border outline-none active:cursor-grabbing"
      style={{
        left: clip.start * pps,
        width,
        borderColor: `${color}99`,
        background: `linear-gradient(180deg, ${color}2e, ${color}0a)`,
        boxShadow: selected ? `0 0 0 1.5px ${color}, 0 0 24px -4px ${color}` : undefined,
        opacity: track.muted ? 0.35 : 1,
        touchAction: selected ? 'none' : 'auto',
      }}
      onPointerDown={(e) => begin(e, 'move')}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      onKeyDown={(e) => {
        if (e.key === 'Delete' || e.key === 'Backspace') removeClip(clip.id)
        if (e.key === 'ArrowLeft') setClipTiming(clip.id, clip.start - (e.shiftKey ? 10 : 1), clip.duration)
        if (e.key === 'ArrowRight') setClipTiming(clip.id, clip.start + (e.shiftKey ? 10 : 1), clip.duration)
      }}
    >
      <svg className="pointer-events-none absolute inset-0 size-full" viewBox={`0 0 ${clip.duration} 1`} preserveAspectRatio="none">
        <path d={envelopeArea(clip.envelope, (t) => t, (v) => 1 - v * 0.9)} fill={color} fillOpacity={0.22} />
        <path
          d={envelopeLine(clip.envelope, (t) => t, (v) => 1 - v * 0.9)}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {width > 64 && (
        <span className="pointer-events-none absolute left-2 top-1 font-mono text-[10px] text-slate-100/80">
          {formatTime(clip.duration, 0)}
        </span>
      )}
      <div
        className="absolute right-0 top-0 h-full w-3 cursor-ew-resize"
        onPointerDown={(e) => begin(e, 'resize')}
        aria-hidden="true"
      >
        <span className="absolute right-1 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded bg-white/60" />
      </div>
    </div>
  )
}
