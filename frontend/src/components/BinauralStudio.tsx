import { useEffect, useMemo, useState } from 'react'
import { listProjects } from '../db/db'
import { useSaveStatus } from '../store/autosave'
import { engine } from '../audio/engine'
import { BRAIN_BANDS, QUICK_BANDS, bandLabel, bandRange, detectCouplings, matchFrequency } from '../data/brainwaves'
import { createBinauralPair } from '../model/envelope'
import { formatHz } from '../model/frequency'
import { BEAT_MAX, BEAT_MIN, CARRIER_MAX, CARRIER_MIN, stackOf, useBinaural, type BinauralWave } from '../store/binauralStore'
import { useProjectStore } from '../store/projectStore'
import { useSettings } from '../store/settings'
import { useUi } from '../store/uiStore'
import { BrainInfoView, CouplingCard, Disclaimer, projectBeats } from './Brainwaves'
import { Icon } from './icons'
import { BandSlider, bandIndexOf, type FrequencyMarker } from './BandSlider'
import { QuickLaunch } from './QuickLaunch'
import { Button, FrequencyField, IconButton, NumberField, Panel, Slider } from './ui'

/** Łączy listę grających fal z silnikiem audio – działa także po przełączeniu na sekwencer. */
export function useBinauralPlayback() {
  const waves = useBinaural((s) => s.waves)
  const playing = useBinaural((s) => s.playing)
  useEffect(() => {
    const active = waves.filter((w) => playing.includes(w.id))
    void engine.setBinaural(
      active.map((w) => ({ id: w.id, carrierMilliHz: w.carrierMilliHz, beatMilliHz: w.beatMilliHz, volume: w.volume })),
    )
  }, [waves, playing])
}

/**
 * Częstotliwości fal mózgowych zapisane gdzie indziej: inne fale z listy, dudnienia w bieżącym projekcie
 * i w projektach zapisanych na urządzeniu. Pokazywane jako znaczniki na suwaku pasma.
 */
function useSavedMarkers(excludeId?: string): FrequencyMarker[] {
  const waves = useBinaural((s) => s.waves)
  const tracks = useProjectStore((s) => s.composition.tracks)
  const saveStatus = useSaveStatus((s) => s.status)
  const [stored, setStored] = useState<FrequencyMarker[]>([])
  useEffect(() => {
    let alive = true
    listProjects()
      .then((list) => {
        if (!alive) return
        setStored(list.flatMap((p) => projectBeats(p.data.tracks ?? []).map((b) => ({ hz: b.hz, label: `Projekt „${p.title}”` }))))
      })
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [saveStatus])
  return useMemo(() => {
    const all: FrequencyMarker[] = [
      ...waves.filter((w) => w.id !== excludeId).map((w) => ({ hz: w.beatMilliHz / 1000, label: `Fala „${w.name}”` })),
      ...projectBeats(tracks).map((b) => ({ hz: b.hz, label: `Bieżący projekt („${b.name}”)` })),
      ...stored,
    ]
    const seen = new Set<string>()
    return all.filter((m) => {
      const k = m.hz.toFixed(7)
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
  }, [waves, tracks, stored, excludeId])
}

const logNorm = (v: number, min: number, max: number) => Math.log(v / min) / Math.log(max / min)
const logValue = (n: number, min: number, max: number) => min * (max / min) ** n

const togglePlay = (id: string) => {
  void engine.unlock() // w obsłudze kliknięcia – wymóg przeglądarek
  useBinaural.getState().togglePlaying(id)
}

/** Popularne nośne do szybkiego wyboru [Hz]. */
const CARRIER_PRESETS = [100, 136.1, 200, 250, 300, 432, 528]

/** Jedna warstwa generatora: własna nośna i własny zakres fali mózgowej. */
function LayerCard({ wave, index, focused, canRemove }: { wave: BinauralWave; index: number; focused: boolean; canRemove: boolean }) {
  const update = useBinaural((s) => s.update)
  const focus = useBinaural((s) => s.focus)
  const removeLayer = useBinaural((s) => s.removeLayer)
  const allWaves = useBinaural((s) => s.waves)
  const playing = useBinaural((s) => s.playing.includes(wave.id))
  const decimals = useSettings((s) => s.decimals)
  const [name, setName] = useState<string | null>(null)
  const markers = useSavedMarkers(wave.id)

  const carrier = wave.carrierMilliHz / 1000
  const beat = wave.beatMilliHz / 1000
  const band = matchFrequency(beat).band
  const color = band?.color ?? '#7d8bab'
  const set = (patch: Partial<BinauralWave>) => update(wave.id, patch)
  const carrierChoices = useMemo(() => {
    const others = allWaves.filter((w) => w.id !== wave.id).map((w) => Number((w.carrierMilliHz / 1000).toFixed(3)))
    return [...new Set([...CARRIER_PRESETS, ...others])].sort((x, y) => x - y)
  }, [allWaves, wave.id])

  return (
    <article
      onPointerDownCapture={() => !focused && focus(wave.id)}
      className={`space-y-3 rounded-2xl border p-3 transition-colors ${focused ? 'bg-white/[0.03]' : 'border-line/60 bg-white/[0.015]'}`}
      style={focused ? { borderColor: `color-mix(in oklab, ${color} 55%, transparent)` } : undefined}
    >
      <header className="flex items-center gap-2">
        <span
          className="flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-semibold text-black"
          style={{ background: color }}
          title={`Warstwa ${index + 1}`}
        >
          {index + 1}
        </span>
        <input
          aria-label="Nazwa fali"
          value={name ?? wave.name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => {
            if (name !== null) set({ name: name.trim() || 'Fala binauralna' })
            setName(null)
          }}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          className="field h-9 min-w-0 flex-1 text-sm outline-none"
        />
        <IconButton
          variant="primary"
          icon={playing ? 'stop' : 'play'}
          label={playing ? 'Zatrzymaj warstwę' : 'Odtwórz warstwę'}
          onClick={() => togglePlay(wave.id)}
          active={playing}
          className="rounded-full!"
        />
        {canRemove && <IconButton icon="close" label="Usuń warstwę z generatora (fala zostaje na liście)" onClick={() => removeLayer(wave.id)} />}
      </header>

      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-[10px] uppercase tracking-[0.2em] text-muted">Fala nośna · lewe ucho</h3>
          <FrequencyField
            label="Częstotliwość nośna w Hz"
            mHz={wave.carrierMilliHz}
            min={CARRIER_MIN}
            max={CARRIER_MAX}
            onCommit={(mHz) => set({ carrierMilliHz: mHz })}
            className={`${decimals > 4 ? 'w-40' : 'w-32'} shrink-0`}
          />
        </div>
        <Slider
          label="Częstotliwość nośna"
          value={logNorm(carrier, CARRIER_MIN / 1000, CARRIER_MAX / 1000)}
          min={0}
          max={1}
          step={0.0005}
          onChange={(n) => set({ carrierMilliHz: Math.round(logValue(n, CARRIER_MIN / 1000, CARRIER_MAX / 1000) * 1000) })}
        />
        <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1" role="group" aria-label="Szybki wybór nośnej">
          {carrierChoices.map((c) => {
            const active = Math.abs(c - carrier) < 0.0005
            return (
              <button
                key={c}
                type="button"
                onClick={() => set({ carrierMilliHz: Math.round(c * 1000) })}
                className={`shrink-0 rounded-full border px-2.5 py-0.5 font-mono text-[11px] transition-colors ${
                  active ? 'border-neon/60 bg-neon/15 text-neon' : 'border-line text-muted hover:text-slate-100'
                }`}
              >
                {String(c).replace('.', ',')}
              </button>
            )
          })}
        </div>
      </section>

      <section className="space-y-2 border-t border-line/50 pt-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-[10px] uppercase tracking-[0.2em] text-muted">Fala mózgowa (wynik)</h3>
          <FrequencyField
            label="Częstotliwość fali mózgowej w Hz"
            mHz={wave.beatMilliHz}
            min={BEAT_MIN}
            max={BEAT_MAX}
            onCommit={(mHz) => set({ beatMilliHz: mHz })}
            className={`${decimals > 4 ? 'w-40' : 'w-32'} shrink-0`}
          />
        </div>
        <BandSlider hz={beat} onChange={(hz) => set({ beatMilliHz: hz * 1000 })} markers={markers} compact={!focused} />
        <div className="flex justify-between font-mono text-[11px] text-muted">
          <span>L {formatHz(wave.carrierMilliHz, decimals)} Hz</span>
          <span>P {formatHz(wave.carrierMilliHz + wave.beatMilliHz, decimals)} Hz</span>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <Icon name="volume" className="size-4 text-muted" />
        <Slider label="Głośność warstwy" value={wave.volume} onChange={(v) => set({ volume: v })} className="flex-1" />
        <span className="w-9 text-right font-mono text-xs tabular-nums text-muted">{Math.round(wave.volume * 100)}%</span>
      </div>

      {(beat > 40 || carrier > 1000 || beat >= carrier) && (
        <div className="space-y-1 rounded-xl border border-warn/40 bg-warn/[0.06] p-2.5 text-xs leading-relaxed text-warn">
          {beat > 40 && <p>Dudnienie binauralne powyżej ok. 30–40 Hz jest słabo odczuwalne – mózg zaczyna słyszeć dwa osobne tony.</p>}
          {carrier > 1000 && <p>Efekt binauralny jest najwyraźniejszy przy nośnej poniżej ok. 1000 Hz.</p>}
          {beat >= carrier && <p>Dudnienie jest większe od nośnej – to już dwa różne dźwięki, a nie dudnienie.</p>}
        </div>
      )}
    </article>
  )
}

/** Generator: stos warstw (kolejnych fal binauralnych) edytowanych i odtwarzanych razem. */
function Generator() {
  const waves = useBinaural((s) => s.waves)
  const stackIds = useBinaural((s) => stackOf(s).join(','))
  const selectedId = useBinaural((s) => s.selectedId)
  const playing = useBinaural((s) => s.playing)
  const { addLayer, playStack, stopStack } = useBinaural.getState()
  const decimals = useSettings((s) => s.decimals)
  const simple = useSettings((s) => s.simpleMode)
  const addTracks = useProjectStore((s) => s.addTracks)
  const showNotice = useUi((s) => s.showNotice)
  const [minutes, setMinutes] = useState(5)

  const layers = stackIds
    .split(',')
    .map((id) => waves.find((w) => w.id === id))
    .filter((w): w is BinauralWave => !!w)
  const focused = layers.find((w) => w.id === selectedId) ?? layers[0]
  const anyPlaying = layers.some((w) => playing.includes(w.id))

  const addToProject = () => {
    addTracks(layers.flatMap((w) => createBinauralPair(w.name, w.carrierMilliHz, w.beatMilliHz, Math.max(1, minutes) * 60)))
    showNotice({ text: `Dodano ${layers.length === 1 ? `„${layers[0].name}”` : `${layers.length} warstwy`} do projektu jako pary ścieżek L/P (${minutes} min).` })
  }

  return (
    <div className="space-y-3 p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-display text-[10px] uppercase tracking-[0.2em] text-muted">Warstwy: {layers.length}</span>
        <div className="ml-auto flex gap-1.5">
          {layers.length > 1 && (
            <Button
              size="sm"
              variant={anyPlaying ? 'danger' : 'primary'}
              icon={anyPlaying ? 'stop' : 'play'}
              onClick={() => {
                void engine.unlock()
                if (anyPlaying) stopStack()
                else playStack()
              }}
            >
              {anyPlaying ? 'Zatrzymaj warstwy' : 'Odtwórz wszystkie'}
            </Button>
          )}
        </div>
      </div>

      {layers.map((w, i) => (
        <LayerCard key={w.id} wave={w} index={i} focused={w.id === focused?.id} canRemove={layers.length > 1} />
      ))}

      <button
        type="button"
        onClick={() => addLayer()}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-neon/50 bg-neon/[0.04] px-4 py-3 text-sm text-neon transition-colors hover:bg-neon/10"
      >
        <Icon name="plus" className="size-5" />
        Dodaj kolejną falę binauralną
        <span className="hidden text-[11px] text-muted sm:inline">– nowy zakres i nowa nośna</span>
      </button>

      <div className="flex flex-wrap items-end gap-2">
        <NumberField label="Długość w projekcie [min]" value={minutes} decimals={0} min={1} max={720} onCommit={setMinutes} className="w-36" />
        <Button variant="primary" icon="plus" onClick={addToProject} disabled={!layers.length}>
          {layers.length > 1 ? 'Dodaj warstwy do projektu' : 'Dodaj do projektu'}
        </Button>
      </div>

      {!simple && focused && (
        <div className="space-y-3 border-t border-line/60 pt-4">
          <h3 className="flex items-center gap-2 font-display text-[11px] uppercase tracking-[0.2em] text-plasma">
            <Icon name="brain" className="size-4" /> Warstwa {layers.indexOf(focused) + 1}: {formatHz(focused.beatMilliHz, decimals)} Hz – pasmo fal mózgowych
          </h3>
          <BrainInfoView hz={focused.beatMilliHz / 1000} />
          <Disclaimer />
        </div>
      )}
    </div>
  )
}

function WaveList() {
  const waves = useBinaural((s) => s.waves)
  const playing = useBinaural((s) => s.playing)
  const selectedId = useBinaural((s) => s.selectedId)
  const { select, add, update, remove, stopAll } = useBinaural.getState()
  const decimals = useSettings((s) => s.decimals)
  const masterVolume = useProjectStore((s) => s.composition.masterVolume)
  const setMasterVolume = useProjectStore((s) => s.setMasterVolume)
  const simple = useSettings((s) => s.simpleMode)
  const markers = useSavedMarkers()

  const couplings = useMemo(
    () => detectCouplings(waves.filter((w) => playing.includes(w.id)).map((w) => w.beatMilliHz / 1000)),
    [waves, playing],
  )

  return (
    <Panel
      title="Moje fale binauralne"
      className="min-h-[320px] lg:min-h-0 lg:flex-1"
      bodyClassName="flex flex-col"
      actions={
        <>
          {playing.length > 0 && <IconButton size="sm" icon="stop" label="Zatrzymaj wszystkie" variant="danger" onClick={stopAll} />}
          <IconButton size="sm" icon="plus" label="Nowa fala" variant="outline" onClick={() => add()} />
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-1.5 border-b border-line/60 p-3">
        <span className="mr-1 text-[11px] text-muted">Nowa:</span>
        {QUICK_BANDS.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => {
              const band = BRAIN_BANDS[bandIndexOf(b.center)]
              add({ name: `${b.label} ${b.center} Hz · ${band.name} ${bandRange(band)}`, beatMilliHz: b.center * 1000 })
            }}
            className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[11px] text-muted hover:text-slate-100"
          >
            <span className="size-1.5 rounded-full" style={{ background: b.color }} />
            {b.label}
          </button>
        ))}
      </div>

      <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-2">
        {waves.map((w) => {
          const on = playing.includes(w.id)
          const sel = w.id === selectedId
          const band = matchFrequency(w.beatMilliHz / 1000).band
          return (
            <li
              key={w.id}
              onClick={() => select(w.id)}
              className={`cursor-pointer space-y-1.5 rounded-xl border px-3 py-2 transition-colors ${
                sel ? 'border-neon/60 bg-neon/[0.07]' : 'border-line/60 bg-white/[0.02] hover:border-neon/30'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`size-2.5 shrink-0 rounded-full ${on ? 'animate-pulse' : ''}`}
                  style={{ background: band?.color ?? '#7d8bab', boxShadow: on ? `0 0 10px ${band?.color ?? '#7d8bab'}` : undefined }}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-slate-200">{w.name}</div>
                  <div className="truncate font-mono text-[11px] text-muted">
                    {formatHz(w.carrierMilliHz, Math.min(decimals, 3))} Hz · Δ{' '}
                    <span className="text-plasma">{formatHz(w.beatMilliHz, decimals)} Hz</span>
                    {band && ` · ${bandLabel(band)}`}
                  </div>
                </div>
                <IconButton
                  size="sm"
                  icon={on ? 'stop' : 'play'}
                  label={on ? 'Zatrzymaj' : 'Odtwórz'}
                  active={on}
                  onClick={(e) => {
                    e.stopPropagation()
                    togglePlay(w.id)
                  }}
                />
                <IconButton
                  size="sm"
                  icon="trash"
                  label="Usuń falę"
                  onClick={(e) => {
                    e.stopPropagation()
                    remove(w.id)
                  }}
                />
              </div>
              <div onClick={(e) => e.stopPropagation()} className="space-y-1">
                <BandSlider compact hz={w.beatMilliHz / 1000} onChange={(hz) => update(w.id, { beatMilliHz: hz * 1000 })} label={`Fala mózgowa ${w.name}`} markers={markers.filter((m) => m.label !== `Fala „${w.name}”`)} />
                <div className="flex items-center gap-2">
                  <Icon name="volume" className="size-3.5 shrink-0 text-muted" />
                  <Slider label={`Głośność ${w.name}`} value={w.volume} onChange={(v) => update(w.id, { volume: v })} className="flex-1" />
                </div>
              </div>
            </li>
          )
        })}
        {!waves.length && <li className="p-6 text-center text-sm text-muted">Brak fal. Dodaj pierwszą przyciskiem +.</li>}
      </ul>

      {!simple && couplings.length > 0 && (
        <div className="max-h-[40%] space-y-2 overflow-y-auto border-t border-line/60 p-3">
          <div className="font-display text-[10px] uppercase tracking-[0.18em] text-plasma">Sprzężenia CFC grających fal</div>
          {couplings.map((c) => (
            <CouplingCard key={c.coupling.id} match={c} decimals={decimals} compact />
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 border-t border-line/60 px-3 py-2">
        <span className="text-[11px] text-muted">Głośność główna</span>
        <Slider label="Głośność główna" value={masterVolume} onChange={setMasterVolume} className="flex-1" />
        <span className="w-9 text-right font-mono text-xs tabular-nums text-muted">{Math.round(masterVolume * 100)}%</span>
      </div>
    </Panel>
  )
}

function SimpleToggle() {
  const simple = useSettings((s) => s.simpleMode)
  const setSimple = useSettings((s) => s.setSimpleMode)
  return (
    <button
      type="button"
      onClick={() => setSimple(!simple)}
      aria-pressed={simple}
      title="Tryb prosty: bez opisów, szybkie uruchamianie projektów"
      className={`rounded-full border px-2.5 py-1 text-[10px] normal-case tracking-normal transition-colors ${
        simple ? 'border-neon/60 bg-neon/15 text-neon' : 'border-line text-muted hover:text-slate-100'
      }`}
    >
      {simple ? '✓ Tryb prosty' : 'Tryb prosty'}
    </button>
  )
}

export function BinauralStudio() {
  const wave = useBinaural((s) => s.waves.find((w) => w.id === s.selectedId) ?? null)
  const add = useBinaural((s) => s.add)
  const simple = useSettings((s) => s.simpleMode)
  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:overflow-hidden xl:grid-cols-[minmax(0,1fr)_400px]">
      <Panel
        title={
          <span className="flex items-center gap-2">
            <Icon name="headphones" className="size-4 shrink-0 text-warn" />
            {simple ? 'Fale binauralne' : (
              <>
                Generator binauralny<span className="hidden sm:inline"> · słuchawki wymagane</span>
              </>
            )}
          </span>
        }
        actions={<SimpleToggle />}
        className="min-w-0 shrink-0 lg:min-h-0 lg:shrink"
        bodyClassName="lg:overflow-y-auto"
      >
        {wave ? (
          <Generator />
        ) : (
          <div className="flex flex-col items-center gap-3 p-10 text-center">
            <p className="text-sm text-muted">Wybierz falę z listy albo utwórz nową.</p>
            <Button variant="primary" icon="plus" onClick={() => add()}>
              Nowa fala
            </Button>
          </div>
        )}
      </Panel>
      <div className={`flex min-w-0 shrink-0 flex-col gap-3 lg:min-h-0 lg:shrink lg:overflow-y-auto ${simple ? 'order-first lg:order-none' : ''}`}>
        <QuickLaunch simple={simple} />
        <WaveList />
      </div>
    </div>
  )
}
