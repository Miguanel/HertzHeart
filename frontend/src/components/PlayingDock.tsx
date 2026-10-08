import { useSyncExternalStore } from 'react'
import { engine } from '../audio/engine'
import { bandRange, matchFrequency } from '../data/brainwaves'
import { usePlaybackState, usePosition } from '../hooks/usePlayback'
import { compositionDuration } from '../model/envelope'
import { formatHz } from '../model/frequency'
import { formatTime } from '../model/time'
import { useBinaural, type BinauralWave } from '../store/binauralStore'
import { useProjectStore } from '../store/projectStore'
import { togglePlay as toggleProject } from '../store/session'
import { useSettings } from '../store/settings'
import { useUi } from '../store/uiStore'
import { Icon } from './icons'
import { IconButton } from './ui'

const useFading = () => useSyncExternalStore(engine.subscribe, () => engine.fadingBinaural)
const usePreviewInfo = () => useSyncExternalStore(engine.subscribe, () => engine.previewInfo)
const useProjectFading = () => useSyncExternalStore(engine.subscribe, () => engine.projectFading)

/** Pierwsze zdanie opisu pasma – krótka informacja z bazy fal mózgowych. */
const firstSentence = (text: string) => {
  const m = /^.*?[.!?](\s|$)/.exec(text)
  return (m ? m[0] : text).trim()
}

function Item({
  color,
  title,
  detail,
  note,
  fading,
  active,
  onToggle,
  toggleLabel,
  onOpen,
}: {
  color: string
  title: string
  detail: string
  note?: string
  fading?: boolean
  active: boolean
  onToggle: () => void
  toggleLabel: string
  onOpen?: () => void
}) {
  return (
    <li
      className={`flex w-[min(19rem,82vw)] shrink-0 items-center gap-2 rounded-xl border px-2 py-1.5 transition-opacity sm:w-80 short:w-64 short:py-1 ${fading ? 'opacity-60' : ''}`}
      style={{ borderColor: `color-mix(in oklab, ${color} 45%, transparent)`, background: `color-mix(in oklab, ${color} 7%, transparent)` }}
    >
      <IconButton
        size="sm"
        variant={active ? 'primary' : 'outline'}
        icon={active ? 'stop' : 'play'}
        label={toggleLabel}
        onClick={onToggle}
        className="rounded-full!"
      />
      <button type="button" onClick={onOpen} disabled={!onOpen} className="min-w-0 flex-1 text-left">
        <div className="flex items-center gap-1.5">
          <span
            className={`size-2 shrink-0 rounded-full ${active && !fading ? 'animate-pulse' : ''}`}
            style={{ background: color, boxShadow: `0 0 8px ${color}` }}
          />
          <span className="truncate text-[13px] text-slate-100">{title}</span>
          {fading && <span className="shrink-0 text-[10px] text-warn">wygaszanie…</span>}
        </div>
        <div className="truncate font-mono text-[11px]" style={{ color }}>
          {detail}
        </div>
        {note && <div className="truncate text-[10px] text-muted short:hidden">{note}</div>}
      </button>
    </li>
  )
}

function ProjectItem() {
  const comp = useProjectStore((s) => s.composition)
  const state = usePlaybackState()
  const fading = useProjectFading()
  const position = usePosition(250)
  const setMode = useUi((s) => s.setMode)
  const freqs = [...new Set(comp.tracks.filter((t) => !t.muted).map((t) => formatHz(t.frequencyMilliHz, 3)))]
  return (
    <Item
      color="#22e4ff"
      title={comp.title}
      detail={`${formatTime(position)} / ${formatTime(compositionDuration(comp))} · ${comp.tracks.length} ścieżek`}
      note={freqs.length ? `${freqs.slice(0, 4).join(' · ')} Hz${freqs.length > 4 ? ' …' : ''}` : undefined}
      fading={fading && state !== 'playing'}
      active={state === 'playing'}
      onToggle={toggleProject}
      toggleLabel={state === 'playing' ? 'Pauza projektu' : 'Wznów projekt'}
      onOpen={() => setMode('sequencer')}
    />
  )
}

function WaveItem({ wave, fading }: { wave: BinauralWave; fading: boolean }) {
  const decimals = useSettings((s) => s.decimals)
  const simple = useSettings((s) => s.simpleMode)
  const setMode = useUi((s) => s.setMode)
  const beat = wave.beatMilliHz / 1000
  const band = matchFrequency(beat).band
  const color = band?.color ?? '#c86bff'
  return (
    <Item
      color={color}
      title={wave.name}
      detail={`${formatHz(wave.carrierMilliHz, Math.min(decimals, 3))} Hz · Δ ${formatHz(wave.beatMilliHz, decimals)} Hz${
        band ? ` · ${band.name} ${bandRange(band)}` : ''
      }`}
      note={band && !simple ? firstSentence(band.states) : undefined}
      fading={fading}
      active={!fading}
      onToggle={() => {
        void engine.unlock()
        useBinaural.getState().togglePlaying(wave.id)
      }}
      toggleLabel={fading ? `Włącz ponownie „${wave.name}”` : `Zatrzymaj „${wave.name}”`}
      onOpen={() => {
        useBinaural.getState().select(wave.id)
        setMode('binaural')
      }}
    />
  )
}

/**
 * Pasek „Teraz gra” na dole ekranu: wszystko, co aktualnie brzmi (fale binauralne, projekt, odsłuch z biblioteki),
 * z krótką informacją o częstotliwości i paśmie oraz jednym przyciskiem zatrzymania.
 */
export function PlayingDock() {
  const waves = useBinaural((s) => s.waves)
  const playing = useBinaural((s) => s.playing)
  const fading = useFading()
  const preview = usePreviewInfo()
  const state = usePlaybackState()
  const projectFading = useProjectFading()
  const mode = useUi((s) => s.mode)

  const active = waves.filter((w) => playing.includes(w.id))
  const fadingWaves = waves.filter((w) => fading.includes(w.id) && !playing.includes(w.id))
  // W sekwencerze projekt ma własny pasek transportu – tu pokazujemy go tylko w zakładce binauralnej.
  const showProject = mode === 'binaural' && (state === 'playing' || projectFading)
  const count = active.length + fadingWaves.length + (showProject ? 1 : 0) + (preview ? 1 : 0)
  if (!count) return null

  const stopAll = () => {
    useBinaural.getState().stopAll()
    if (engine.state === 'playing') engine.pause()
    engine.stopPreview()
  }

  return (
    <div className="glass flex items-center gap-2 px-2 py-1.5 lg:min-w-0 lg:max-w-[48%] lg:shrink-0 short:min-w-0 short:flex-1 short:py-1" role="region" aria-label="Teraz gra">
      <span className="hidden shrink-0 flex-col items-center px-1 sm:flex short:hidden">
        <Icon name="headphones" className="size-4 text-neon" />
        <span className="font-display text-[8px] uppercase tracking-[0.18em] text-muted">teraz gra</span>
      </span>
      <ul className="no-scrollbar flex min-w-0 flex-1 gap-1.5 overflow-x-auto">
        {showProject && <ProjectItem />}
        {active.map((w) => (
          <WaveItem key={w.id} wave={w} fading={false} />
        ))}
        {fadingWaves.map((w) => (
          <WaveItem key={w.id} wave={w} fading />
        ))}
        {preview && (
          <Item
            color={preview.beatMilliHz ? (matchFrequency(preview.beatMilliHz / 1000).band?.color ?? '#c86bff') : '#9dff6b'}
            title={`Odsłuch: ${preview.label}`}
            detail={`${formatHz(preview.frequencyMilliHz, 3)} Hz${preview.beatMilliHz ? ` · Δ ${formatHz(preview.beatMilliHz, 3)} Hz (L/P)` : ''}`}
            active
            onToggle={() => engine.stopPreview()}
            toggleLabel="Zatrzymaj odsłuch"
          />
        )}
      </ul>
      {count > 1 && <IconButton size="sm" variant="danger" icon="stop" label="Zatrzymaj wszystko (z wygaszeniem)" onClick={stopAll} />}
    </div>
  )
}
