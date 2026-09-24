import { useEffect, useMemo, useState } from 'react'
import { fetchRemotePresets } from '../api/client'
import { BUILTIN_PRESETS, type PresetEntry } from '../data/templates'
import { compositionDuration } from '../model/envelope'
import { asNewProject, parseComposition } from '../model/parse'
import type { Composition } from '../model/schema'
import { formatTime } from '../model/time'
import { Badge, InfoContent, InfoHeader } from './InfoContent'
import { Button, IconButton, Sheet } from './ui'

function fromRemote(): Promise<PresetEntry[]> {
  return fetchRemotePresets().then((list) =>
    list.flatMap((p) => {
      try {
        const comp = parseComposition(p.data)
        return [
          {
            id: p.id,
            name: p.name,
            category: p.category,
            description: p.description,
            info: p.info,
            headphones: p.headphones,
            duration: compositionDuration(comp),
            build: () => ({ ...parseComposition(p.data), title: p.name }),
          },
        ]
      } catch {
        return [] // niepoprawny zestaw w bazie – pomijamy
      }
    }),
  )
}

export function PresetsList({ onOpen }: { onOpen: (comp: Composition, name: string) => void }) {
  const [remote, setRemote] = useState<PresetEntry[]>([])
  const [info, setInfo] = useState<PresetEntry | null>(null)

  useEffect(() => {
    let alive = true
    void fromRemote().then((list) => alive && setRemote(list))
    return () => {
      alive = false
    }
  }, [])

  const groups = useMemo(() => {
    const map = new Map<string, PresetEntry[]>()
    for (const p of [...BUILTIN_PRESETS, ...remote]) map.set(p.category, [...(map.get(p.category) ?? []), p])
    return [...map.entries()]
  }, [remote])

  const open = (p: PresetEntry) => {
    setInfo(null)
    onOpen(asNewProject(p.build()), p.name)
  }

  return (
    <>
      <div className="space-y-4 p-2">
        <p className="px-1 text-xs text-muted">Gotowe projekty – otwierają się jako nowy projekt, który możesz dowolnie zmieniać.</p>
        {groups.map(([category, items]) => (
          <section key={category} className="space-y-1.5">
            <h3 className="px-1 font-display text-[10px] uppercase tracking-[0.2em] text-muted">{category}</h3>
            {items.map((p) => (
              <article key={p.id} className="rounded-xl border border-line/60 bg-white/[0.02] p-3 transition-colors hover:border-plasma/40">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-slate-100">{p.name}</div>
                    <div className="text-[11px] text-muted">{p.description}</div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <Badge>{formatTime(p.duration, 0)}</Badge>
                      {p.headphones && <Badge tone="warn">🎧 słuchawki</Badge>}
                    </div>
                  </div>
                  <IconButton icon="info" label="Informacje o zestawie" onClick={() => setInfo(p)} />
                  <IconButton icon="folder" label="Otwórz jako nowy projekt" variant="outline" onClick={() => open(p)} />
                </div>
              </article>
            ))}
          </section>
        ))}
      </div>

      <Sheet open={info !== null} onClose={() => setInfo(null)} title="Zestaw">
        {info && (
          <>
            <InfoHeader
              title={info.name}
              subtitle={info.description}
              badges={
                <>
                  <Badge>{info.category}</Badge>
                  <Badge>{formatTime(info.duration, 0)}</Badge>
                  {info.headphones && <Badge tone="warn">🎧 wymaga słuchawek</Badge>}
                </>
              }
            />
            <InfoContent text={info.info} />
            <Button variant="primary" icon="folder" className="mt-5 w-full" onClick={() => open(info)}>
              Otwórz jako nowy projekt
            </Button>
          </>
        )}
      </Sheet>
    </>
  )
}
