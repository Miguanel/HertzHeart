import { useMemo, useState, type FormEvent } from 'react'
import { engine } from '../audio/engine'
import { usePreviewKey } from '../hooks/usePlayback'
import { formatHz, parseHz } from '../model/frequency'
import type { LibraryFrequency } from '../model/schema'
import { useProjectStore } from '../store/projectStore'
import { Button, IconButton, Panel } from './ui'

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
    <form onSubmit={submit} className="grid grid-cols-[1fr_auto] gap-2">
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

export function LibraryPanel({ library, offline, onAdded }: { library: LibraryFrequency[]; offline: boolean; onAdded?: () => void }) {
  const addTrack = useProjectStore((s) => s.addTrack)
  const previewKey = usePreviewKey()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string | null>(null)

  const categories = useMemo(() => [...new Set(library.map((f) => f.category))], [library])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace(',', '.')
    return library.filter(
      (f) =>
        (!category || f.category === category) &&
        (!q || f.name.toLowerCase().includes(q) || formatHz(f.frequencyMilliHz).includes(q) || f.description.toLowerCase().includes(q)),
    )
  }, [library, query, category])

  const add = (name: string, mHz: number, ref?: string) => {
    addTrack(name, mHz, ref)
    onAdded?.()
  }

  const chip = (active: boolean) =>
    `shrink-0 rounded-full border px-3 py-1 text-xs transition-colors ${
      active ? 'border-neon/60 bg-neon/15 text-neon' : 'border-line text-muted hover:text-slate-100'
    }`

  return (
    <Panel
      title="Biblioteka częstotliwości"
      actions={offline && <span className="rounded bg-warn/15 px-2 py-0.5 text-[10px] text-warn">offline</span>}
      className="h-full"
      bodyClassName="flex flex-col"
    >
      <div className="space-y-3 border-b border-line/60 p-3">
        <CustomFrequency onAdd={(name, mHz) => add(name, mHz)} />
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

      <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-2">
        {filtered.map((f) => {
          const key = `lib:${f.id}`
          const playing = previewKey === key
          return (
            <li
              key={f.id}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors ${
                playing ? 'border-neon/60 bg-neon/10' : 'border-line/60 bg-white/[0.02] hover:border-neon/30'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono text-[15px] tabular-nums text-neon">{formatHz(f.frequencyMilliHz)}</span>
                  <span className="text-[10px] text-muted">Hz</span>
                </div>
                <div className="truncate text-sm text-slate-200">{f.name}</div>
                <div className="truncate text-[11px] text-muted">
                  {f.category}
                  {f.description && ` · ${f.description}`}
                </div>
              </div>
              <IconButton
                icon={playing ? 'stop' : 'headphones'}
                label={playing ? 'Zatrzymaj odsłuch' : 'Odsłuchaj'}
                active={playing}
                onClick={() => void engine.togglePreview(key, f.frequencyMilliHz)}
              />
              <IconButton icon="plus" label="Dodaj do projektu" variant="outline" onClick={() => add(f.name, f.frequencyMilliHz, f.id)} />
            </li>
          )
        })}
        {!filtered.length && <li className="p-6 text-center text-sm text-muted">Brak wyników</li>}
      </ul>
    </Panel>
  )
}
