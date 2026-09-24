import { useMemo, useState, type FormEvent } from 'react'
import { engine } from '../audio/engine'
import { usePreviewKey } from '../hooks/usePlayback'
import { createBinauralPair, createTrack } from '../model/envelope'
import { formatHz, parseHz } from '../model/frequency'
import type { Composition, LibraryFrequency } from '../model/schema'
import { useProjectStore } from '../store/projectStore'
import { useUi, type LibraryTab } from '../store/uiStore'
import { Badge, InfoContent, InfoHeader } from './InfoContent'
import { PresetsList } from './PresetsList'
import { Button, IconButton, Panel, Sheet } from './ui'

function CustomFrequency({ onAdd }: { onAdd: (name: string, mHz: number) => void }) {
  const [text, setText] = useState('')
  const [name, setName] = useState('')
  const mHz = parseHz(text)
  const invalid = text.trim() !== '' && mHz === null

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (mHz === null) return
    onAdd(name.trim() || `${formatHz(mHz)} Hz`, mHz)
    setText('')
    setName('')
  }

  return (
    <form onSubmit={submit} data-tour="custom-frequency" className="grid grid-cols-[1fr_auto] gap-2">
      <label className={`field flex h-10 items-center gap-2 ${invalid ? 'border-rose-500/70' : ''}`}>
        <span className="sr-only">Własna częstotliwość</span>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          inputMode="decimal"
          placeholder="Własna, np. 777,778"
          className="w-full min-w-0 bg-transparent font-mono text-sm tabular-nums text-neon outline-none placeholder:font-sans placeholder:text-muted/70"
        />
        <span className="text-xs text-muted">Hz</span>
      </label>
      <Button type="submit" variant="primary" icon="plus" disabled={mHz === null}>
        Dodaj
      </Button>
      {text.trim() !== '' && (
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nazwa (opcjonalnie)"
          className="field col-span-2 h-9 text-sm outline-none placeholder:text-muted/70"
        />
      )}
      {invalid && <p className="col-span-2 text-xs text-rose-300">Zakres 1–20 000 Hz, maks. 3 miejsca po przecinku.</p>}
    </form>
  )
}

interface Props {
  library: LibraryFrequency[]
  offline: boolean
  loading: boolean
  onAdded?: () => void
  onOpenPreset: (comp: Composition, name: string) => void
}

export function LibraryPanel({ library, offline, loading, onAdded, onOpenPreset }: Props) {
  const addTracks = useProjectStore((s) => s.addTracks)
  const previewKey = usePreviewKey()
  const tab = useUi((s) => s.libraryTab)
  const setTab = useUi((s) => s.setLibraryTab)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [info, setInfo] = useState<LibraryFrequency | null>(null)

  const categories = useMemo(() => [...new Set(library.map((f) => f.category))], [library])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace(',', '.')
    return library.filter(
      (f) =>
        (!category || f.category === category) &&
        (!q || f.name.toLowerCase().includes(q) || formatHz(f.frequencyMilliHz).includes(q) || f.description.toLowerCase().includes(q)),
    )
  }, [library, query, category])

  const addFromLibrary = (f: LibraryFrequency) => {
    addTracks(
      f.binauralBeatMilliHz
        ? createBinauralPair(f.name, f.frequencyMilliHz, f.binauralBeatMilliHz, 300, f.id)
        : [createTrack(f.name, f.frequencyMilliHz, { libraryRef: f.id })],
    )
    setInfo(null)
    onAdded?.()
  }

  const addCustom = (name: string, mHz: number) => {
    addTracks([createTrack(name, mHz)])
    onAdded?.()
  }

  const chip = (active: boolean) =>
    `shrink-0 rounded-full border px-3 py-1 text-xs transition-colors ${
      active ? 'border-neon/60 bg-neon/15 text-neon' : 'border-line text-muted hover:text-slate-100'
    }`

  const tabBtn = (id: LibraryTab, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={tab === id}
      onClick={() => setTab(id)}
      className={`flex-1 rounded-md px-3 py-1.5 font-display text-[10px] uppercase tracking-[0.18em] transition-colors ${
        tab === id ? 'bg-neon/15 text-neon' : 'text-muted hover:text-slate-200'
      }`}
    >
      {label}
    </button>
  )

  return (
    <Panel
      title={
        <div role="tablist" data-tour="library-tabs" className="flex w-60 gap-1 rounded-lg border border-line/70 p-0.5">
          {tabBtn('frequencies', 'Częstotliwości')}
          {tabBtn('presets', 'Zestawy')}
        </div>
      }
      actions={offline && <span className="rounded bg-warn/15 px-2 py-0.5 text-[10px] text-warn">offline</span>}
      className="h-full"
      bodyClassName="flex flex-col"
      tour="library"
    >
      {tab === 'presets' ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <PresetsList onOpen={onOpenPreset} />
        </div>
      ) : (
        <>
          <div className="space-y-3 border-b border-line/60 p-3">
            <CustomFrequency onAdd={addCustom} />
            <div data-tour="library-filters" className="space-y-3">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Szukaj nazwy lub Hz…"
              aria-label="Szukaj w bibliotece"
              className="field h-10 w-full text-sm outline-none placeholder:text-muted/70"
            />
            <div className="no-scrollbar -mx-3 flex gap-1.5 overflow-x-auto px-3">
              <button type="button" className={chip(category === null)} onClick={() => setCategory(null)}>
                Wszystkie
              </button>
              {categories.map((c) => (
                <button type="button" key={c} className={chip(category === c)} onClick={() => setCategory(category === c ? null : c)}>
                  {c}
                </button>
              ))}
            </div>
            </div>
          </div>

          <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-2">
            {filtered.map((f, index) => {
              const key = `lib:${f.id}`
              const playing = previewKey === key
              return (
                <li
                  key={f.id}
                  data-tour={index === 0 ? 'library-item' : undefined}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 transition-colors ${
                    playing ? 'border-neon/60 bg-neon/10' : 'border-line/60 bg-white/[0.02] hover:border-neon/30'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-mono text-[15px] tabular-nums text-neon">{formatHz(f.frequencyMilliHz)}</span>
                      <span className="text-[10px] text-muted">Hz</span>
                      {f.binauralBeatMilliHz && (
                        <span className="font-mono text-[11px] text-plasma">+{formatHz(f.binauralBeatMilliHz)} · L/P</span>
                      )}
                    </div>
                    <div className="truncate text-sm text-slate-200">{f.name}</div>
                    <div className="truncate text-[11px] text-muted">{f.description || f.category}</div>
                  </div>
                  <IconButton icon="info" label="Informacje" onClick={() => setInfo(f)} />
                  <IconButton
                    icon={playing ? 'stop' : 'headphones'}
                    label={playing ? 'Zatrzymaj odsłuch' : 'Odsłuchaj'}
                    active={playing}
                    onClick={() => void engine.togglePreview(key, f.frequencyMilliHz, f.binauralBeatMilliHz)}
                  />
                  <IconButton icon="plus" label="Dodaj do projektu" variant="outline" onClick={() => addFromLibrary(f)} />
                </li>
              )
            })}
            {loading && <li className="p-6 text-center text-sm text-muted">Wczytywanie biblioteki…</li>}
            {!loading && !filtered.length && (
              <li className="p-6 text-center text-sm text-muted">
                {library.length ? 'Brak wyników' : 'Biblioteka niedostępna (brak połączenia). Możesz wpisać własną częstotliwość powyżej.'}
              </li>
            )}
          </ul>
        </>
      )}

      <Sheet open={info !== null} onClose={() => setInfo(null)} title="Częstotliwość">
        {info && (
          <>
            <InfoHeader
              title={info.name}
              subtitle={
                info.binauralBeatMilliHz
                  ? `L ${formatHz(info.frequencyMilliHz)} Hz · P ${formatHz(info.frequencyMilliHz + info.binauralBeatMilliHz)} Hz`
                  : `${formatHz(info.frequencyMilliHz)} Hz`
              }
              badges={
                <>
                  <Badge>{info.category}</Badge>
                  {info.binauralBeatMilliHz && <Badge tone="warn">🎧 dudnienie {formatHz(info.binauralBeatMilliHz)} Hz</Badge>}
                </>
              }
            />
            <InfoContent text={info.info || info.description} />
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button
                icon="headphones"
                onClick={() => void engine.togglePreview(`lib:${info.id}`, info.frequencyMilliHz, info.binauralBeatMilliHz)}
              >
                {previewKey === `lib:${info.id}` ? 'Zatrzymaj' : 'Odsłuchaj'}
              </Button>
              <Button variant="primary" icon="plus" onClick={() => addFromLibrary(info)}>
                Dodaj do projektu
              </Button>
            </div>
          </>
        )}
      </Sheet>
    </Panel>
  )
}
