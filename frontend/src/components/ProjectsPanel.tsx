import { useCallback, useEffect, useRef, useState } from 'react'
import { deleteProject, listProjects, saveProject, type ProjectRecord } from '../db/db'
import { createComposition, newId } from '../model/envelope'
import { parseComposition } from '../model/parse'
import { compositionToFile, downloadBlob } from '../share/codec'
import { useSaveStatus } from '../store/autosave'
import { useProjectStore } from '../store/projectStore'
import { openComposition } from '../store/session'
import { Button, IconButton } from './ui'

const dateFmt = new Intl.DateTimeFormat('pl-PL', { dateStyle: 'medium', timeStyle: 'short' })

export function ProjectsPanel({ onOpened }: { onOpened: () => void }) {
  const currentId = useProjectStore((s) => s.composition.id)
  const saveStatus = useSaveStatus((s) => s.status)
  const [projects, setProjects] = useState<ProjectRecord[] | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const refresh = useCallback(async () => setProjects(await listProjects()), [])
  useEffect(() => {
    void refresh()
  }, [refresh, saveStatus])

  const open = (record: ProjectRecord) => {
    openComposition(record.data)
    onOpened()
  }

  const duplicate = async (record: ProjectRecord) => {
    const now = new Date().toISOString()
    await saveProject({ ...record.data, id: newId(), title: `${record.title} (kopia)`, createdAt: now, updatedAt: now })
    await refresh()
  }

  const remove = async (record: ProjectRecord) => {
    await deleteProject(record.id)
    setConfirmId(null)
    if (record.id === currentId) openComposition(createComposition())
    await refresh()
  }

  const importFile = async (file: File) => {
    setError(null)
    try {
      const comp = parseComposition(JSON.parse(await file.text()))
      openComposition({ ...comp, id: newId(), updatedAt: new Date().toISOString() })
      onOpened()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nie udało się wczytać pliku.')
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="primary"
          icon="plus"
          onClick={() => {
            openComposition(createComposition())
            onOpened()
          }}
        >
          Nowy projekt
        </Button>
        <Button icon="upload" onClick={() => fileRef.current?.click()}>
          Importuj plik
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void importFile(file)
            e.target.value = ''
          }}
        />
      </div>
      {error && <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}

      <p className="text-xs text-muted">Projekty są zapisywane automatycznie w pamięci tej przeglądarki (także offline).</p>

      <ul className="space-y-2">
        {projects === null && <li className="text-sm text-muted">Wczytywanie…</li>}
        {projects?.length === 0 && <li className="text-sm text-muted">Brak zapisanych projektów.</li>}
        {projects?.map((p) => {
          const current = p.id === currentId
          return (
            <li
              key={p.id}
              className={`rounded-xl border p-3 transition-colors ${current ? 'border-neon/50 bg-neon/5' : 'border-line/70 bg-white/[0.02]'}`}
            >
              <button type="button" className="block w-full text-left" onClick={() => open(p)}>
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-slate-100">{p.title}</span>
                  {current && <span className="rounded bg-neon/15 px-1.5 text-[10px] text-neon">otwarty</span>}
                </div>
                <div className="text-[11px] text-muted">
                  {dateFmt.format(new Date(p.updatedAt))} · {p.data.tracks.length} ścieżek
                </div>
              </button>
              <div className="mt-2 flex items-center gap-1">
                <IconButton size="sm" icon="copy" label="Duplikuj" onClick={() => void duplicate(p)} />
                <IconButton
                  size="sm"
                  icon="download"
                  label="Pobierz plik projektu"
                  onClick={() => {
                    const file = compositionToFile(p.data)
                    downloadBlob(file, file.name)
                  }}
                />
                <div className="ml-auto">
                  {confirmId === p.id ? (
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="danger" onClick={() => void remove(p)}>
                        Usuń na pewno
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setConfirmId(null)}>
                        Anuluj
                      </Button>
                    </div>
                  ) : (
                    <IconButton size="sm" icon="trash" label="Usuń projekt" onClick={() => setConfirmId(p.id)} />
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
