import { useCallback, useEffect, useRef, useState } from 'react'
import { engine } from '../audio/engine'
import { listProjects, saveProject, type ProjectRecord } from '../db/db'
import { usePlaybackState, usePosition } from '../hooks/usePlayback'
import { compositionDuration, createBinauralPair, createComposition } from '../model/envelope'
import { asNewProject, parseComposition } from '../model/parse'
import { formatTime } from '../model/time'
import { saveCompositionToDevice } from '../share/codec'
import { useSaveStatus } from '../store/autosave'
import { useBinaural } from '../store/binauralStore'
import { isIos, promptInstall, useInstall } from '../store/pwaInstall'
import { useProjectStore } from '../store/projectStore'
import { openComposition, togglePlay } from '../store/session'
import { useUi } from '../store/uiStore'
import { Icon } from './icons'
import { Button, IconButton, NumberField, Panel } from './ui'

/** Zapisuje bieżący projekt (bez czekania na autozapis) i otwiera inny. */
async function switchTo(record: ProjectRecord) {
  const current = useProjectStore.getState().composition
  if (record.id === current.id) return
  await saveProject(current)
  openComposition(parseComposition(record.data))
}

function NowPlaying() {
  const comp = useProjectStore((s) => s.composition)
  const state = usePlaybackState()
  const position = usePosition(250)
  const duration = compositionDuration(comp)
  return (
    <div className="flex items-center gap-2 rounded-xl border border-neon/30 bg-neon/[0.05] p-2">
      <IconButton
        variant="primary"
        icon={state === 'playing' ? 'pause' : 'play'}
        label={state === 'playing' ? 'Pauza' : 'Odtwórz bieżący projekt'}
        onClick={togglePlay}
        disabled={duration === 0}
        className="rounded-full!"
      />
      <IconButton icon="stop" label="Stop" onClick={() => engine.stop()} disabled={state === 'stopped'} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm text-slate-100">{comp.title}</div>
        <div className="font-mono text-[11px] text-muted">
          {formatTime(position)} / {formatTime(duration)} · {comp.tracks.length} ścieżek
        </div>
      </div>
    </div>
  )
}

/**
 * Szybkie uruchamianie: lista projektów zapisanych lokalnie z odtwarzaniem jednym dotknięciem,
 * zapis fal binauralnych jako projekt, zapis/wczytanie pliku na telefonie i instalacja aplikacji.
 */
export function QuickLaunch({ simple }: { simple: boolean }) {
  const [open, setOpen] = useState(simple)
  const [projects, setProjects] = useState<ProjectRecord[] | null>(null)
  const [minutes, setMinutes] = useState(20)
  const [message, setMessage] = useState<string | null>(null)
  const saveStatus = useSaveStatus((s) => s.status)
  const currentId = useProjectStore((s) => s.composition.id)
  const install = useInstall()
  const setMode = useUi((s) => s.setMode)
  const setView = useUi((s) => s.setView)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => setOpen(simple), [simple])

  const refresh = useCallback(async () => {
    try {
      setProjects(await listProjects())
    } catch {
      setProjects([])
    }
  }, [])
  useEffect(() => {
    void refresh()
  }, [refresh, saveStatus])

  const flash = (text: string) => {
    setMessage(text)
    setTimeout(() => setMessage((m) => (m === text ? null : m)), 4000)
  }

  const play = async (record: ProjectRecord) => {
    void engine.unlock() // jeszcze w obsłudze dotknięcia – wymóg przeglądarek mobilnych
    await switchTo(record)
    await engine.play(useProjectStore.getState().composition, 0)
  }

  const edit = async (record: ProjectRecord) => {
    await switchTo(record)
    setView('editor')
    setMode('sequencer')
  }

  const toPhone = async (record: ProjectRecord) => {
    const result = await saveCompositionToDevice(record.data)
    if (result === 'downloaded') flash(`Pobrano plik „${record.title}.heartz.json”.`)
    else if (result === 'shared') flash('Zapisano / udostępniono plik projektu.')
  }

  /** Grające fale (albo wybrana, gdy nic nie gra) jako nowy projekt zapisany lokalnie. */
  const saveWaves = async () => {
    const { waves, playing, selectedId } = useBinaural.getState()
    const chosen = waves.filter((w) => playing.includes(w.id))
    const list = chosen.length ? chosen : waves.filter((w) => w.id === selectedId)
    if (!list.length) return flash('Najpierw utwórz falę.')
    const title = list.length === 1 ? list[0].name : `Fale binauralne (${list.length})`
    const comp = createComposition(title)
    comp.tracks = list.flatMap((w) => createBinauralPair(w.name, w.carrierMilliHz, w.beatMilliHz, Math.max(1, minutes) * 60))
    await saveProject(comp)
    // zapis zmienia „ostatni projekt” – przywracamy wskazanie na bieżący
    await saveProject(useProjectStore.getState().composition)
    await refresh()
    flash(`Zapisano projekt „${title}” na tym urządzeniu.`)
  }

  const importFile = async (file: File) => {
    try {
      const comp = asNewProject(parseComposition(JSON.parse(await file.text())))
      await saveProject(comp)
      await saveProject(useProjectStore.getState().composition)
      await refresh()
      flash(`Wczytano „${comp.title}”.`)
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Nie udało się wczytać pliku.')
    }
  }

  return (
    <Panel
      title={
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex items-center gap-2 uppercase">
          <Icon name="play" className="size-3.5 text-neon" /> Szybkie uruchamianie {open ? '▴' : '▾'}
        </button>
      }
      className="shrink-0"
      bodyClassName={open ? 'space-y-3 p-3' : 'hidden'}
    >
      <NowPlaying />

      <section className="space-y-1.5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-[10px] uppercase tracking-[0.18em] text-muted">Moje projekty</h3>
          <button type="button" onClick={() => fileRef.current?.click()} className="text-[11px] text-neon hover:underline">
            Wczytaj z pliku / telefonu
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void importFile(f)
              e.target.value = ''
            }}
          />
        </div>
        <ul className="max-h-64 space-y-1 overflow-y-auto pr-1">
          {projects === null && <li className="text-xs text-muted">Wczytywanie…</li>}
          {projects?.length === 0 && <li className="text-xs text-muted">Brak zapisanych projektów.</li>}
          {projects?.map((p) => {
            const current = p.id === currentId
            const tracks = p.data.tracks ?? []
            return (
              <li
                key={p.id}
                className={`flex items-center gap-1 rounded-lg border px-2 py-1.5 ${current ? 'border-neon/40 bg-neon/[0.05]' : 'border-line/60'}`}
              >
                <IconButton size="sm" variant="outline" icon="play" label={`Odtwórz „${p.title}” od początku`} onClick={() => void play(p)} />
                <div className="min-w-0 flex-1 px-1">
                  <div className="truncate text-[13px] text-slate-200">{p.title}</div>
                  <div className="font-mono text-[10px] text-muted">
                    {tracks.length} ścieżek · {formatTime(compositionDuration(p.data), 0)}
                    {current && <span className="text-neon"> · otwarty</span>}
                  </div>
                </div>
                <IconButton size="sm" icon="wave" label="Otwórz w edytorze" onClick={() => void edit(p)} />
                <IconButton size="sm" icon="download" label="Zapisz na telefonie / pobierz plik" onClick={() => void toPhone(p)} />
              </li>
            )
          })}
        </ul>
      </section>

      <section className="flex flex-wrap items-end gap-2 border-t border-line/60 pt-3">
        <NumberField label="Długość [min]" value={minutes} decimals={0} min={1} max={720} onCommit={setMinutes} className="w-24" />
        <Button icon="plus" onClick={() => void saveWaves()} className="flex-1">
          Zapisz fale jako projekt
        </Button>
      </section>

      {!install.installed && (
        <section className="space-y-1.5 border-t border-line/60 pt-3">
          {install.event ? (
            <Button variant="primary" icon="download" onClick={() => void promptInstall()} className="w-full">
              Zainstaluj aplikację na tym urządzeniu
            </Button>
          ) : isIos ? (
            <p className="text-[11px] leading-snug text-muted">
              Na iPhonie: <span className="text-slate-300">Udostępnij → Do ekranu początkowego</span> – aplikacja działa wtedy
              jak zwykła aplikacja, także offline.
            </p>
          ) : null}
        </section>
      )}

      <p className="text-[11px] leading-snug text-muted">
        Projekty i fale zapisują się automatycznie w pamięci tego urządzenia (działa offline). Przycisk
        <Icon name="download" className="mx-1 inline size-3" />
        zapisuje kopię pliku na telefonie lub komputerze.
      </p>
      {message && <p className="rounded-lg bg-neon/10 px-2 py-1.5 text-xs text-neon">{message}</p>}
    </Panel>
  )
}
