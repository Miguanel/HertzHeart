import { useCallback, useEffect, useState } from 'react'
import { fetchLibrary, fetchSharedProject } from './api/client'
import { renderToWav } from './audio/wav'
import { ClipInspector } from './components/ClipInspector'
import { Icon, type IconName } from './components/icons'
import { LibraryPanel } from './components/LibraryPanel'
import { ProjectsPanel } from './components/ProjectsPanel'
import { SharePanel } from './components/SharePanel'
import { Timeline } from './components/Timeline'
import { TopBar } from './components/TopBar'
import { TransportBar } from './components/TransportBar'
import { Sheet } from './components/ui'
import { getProject, lastProjectId, listProjects, requestPersistentStorage } from './db/db'
import { createComposition } from './model/envelope'
import { asNewProject, parseComposition } from './model/parse'
import type { Composition, LibraryFrequency } from './model/schema'
import { clearShareFromLocation, decodeComposition, downloadBlob, readShareFromLocation, safeFilename } from './share/codec'
import { startAutosave } from './store/autosave'
import { useProjectStore } from './store/projectStore'
import { openComposition, usePlaybackController } from './store/session'

type MobileView = 'library' | 'editor'
type SheetId = 'projects' | 'share' | null

/** Otwiera projekt startowy: udostępniony (link), ostatnio używany albo nowy. */
async function loadInitialProject(): Promise<string | null> {
  const shared = readShareFromLocation()
  try {
    if (shared) {
      const comp = shared.kind === 'hash' ? await decodeComposition(shared.payload) : await fetchSharedProject(shared.slug)
      // Odbiorca dostaje własną kopię – nie nadpisze projektu o tym samym id.
      openComposition(asNewProject(comp))
      return `Otwarto udostępniony projekt „${comp.title}”`
    }
    const id = lastProjectId()
    const record = (id && (await getProject(id))) || (await listProjects())[0]
    // parseComposition uzupełnia pola dodane w nowszych wersjach (np. kanał stereo)
    openComposition(record ? parseComposition(record.data) : createComposition())
    return null
  } catch (e) {
    openComposition(createComposition())
    return e instanceof Error ? e.message : 'Nie udało się otworzyć projektu.'
  } finally {
    if (shared) clearShareFromLocation()
  }
}

export default function App() {
  const [library, setLibrary] = useState<LibraryFrequency[]>([])
  const [libraryLoading, setLibraryLoading] = useState(true)
  const [offline, setOffline] = useState(false)
  const [view, setView] = useState<MobileView>('editor')
  const [sheet, setSheet] = useState<SheetId>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  usePlaybackController()

  const showToast = useCallback((text: string) => {
    setToast(text)
    setTimeout(() => setToast((t) => (t === text ? null : t)), 4500)
  }, [])

  useEffect(() => {
    void fetchLibrary().then((r) => {
      setLibrary(r.items)
      setOffline(r.offline)
      setLibraryLoading(false)
    })
  }, [])

  useEffect(() => {
    const stopAutosave = startAutosave()
    void requestPersistentStorage()
    void loadInitialProject().then((msg) => msg && showToast(msg))
    return stopAutosave
  }, [showToast])

  const closeSheet = useCallback(() => setSheet(null), [])

  const openPreset = (comp: Composition, name: string) => {
    openComposition(comp)
    setView('editor')
    showToast(`Otwarto zestaw „${name}” jako nowy projekt`)
  }

  const exportWav = async () => {
    const comp = useProjectStore.getState().composition
    setExporting(true)
    try {
      downloadBlob(await renderToWav(comp), `${safeFilename(comp.title)}.wav`)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Eksport nie powiódł się.')
    } finally {
      setExporting(false)
    }
  }

  const tab = (id: MobileView | 'projects', icon: IconName, label: string) => {
    const active = id === 'projects' ? sheet === 'projects' : view === id && sheet === null
    return (
      <button
        type="button"
        onClick={() => (id === 'projects' ? setSheet('projects') : (setView(id), setSheet(null)))}
        className={`flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-[11px] transition-colors ${
          active ? 'bg-neon/10 text-neon' : 'text-muted'
        }`}
        aria-current={active ? 'page' : undefined}
      >
        <Icon name={icon} className="size-5" />
        {label}
      </button>
    )
  }

  return (
    <div className="app-bg flex h-dvh flex-col overflow-hidden text-slate-100">
      <TopBar onProjects={() => setSheet('projects')} onShare={() => setSheet('share')} />

      <main className="mx-auto flex min-h-0 w-full max-w-[1920px] flex-1 gap-3 px-3 pb-3 sm:px-5">
        <aside className={`${view === 'library' ? 'flex' : 'hidden'} min-h-0 w-full shrink-0 flex-col lg:flex lg:w-[340px] xl:w-[380px]`}>
          <LibraryPanel
            library={library}
            loading={libraryLoading}
            offline={offline}
            onAdded={() => setView('editor')}
            onOpenPreset={openPreset}
          />
        </aside>
        <section className={`${view === 'editor' ? 'flex' : 'hidden'} min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-y-auto lg:flex`}>
          <Timeline onOpenLibrary={() => setView('library')} />
          <ClipInspector />
        </section>
      </main>

      <footer className="mx-auto w-full max-w-[1920px] space-y-2 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] sm:px-5 lg:pb-4">
        <TransportBar />
        <nav className="glass grid grid-cols-3 gap-1 p-1 lg:hidden" aria-label="Nawigacja">
          {tab('library', 'library', 'Biblioteka')}
          {tab('editor', 'wave', 'Edytor')}
          {tab('projects', 'folder', 'Projekty')}
        </nav>
      </footer>

      <Sheet open={sheet === 'projects'} title="Projekty" onClose={closeSheet}>
        <ProjectsPanel
          onOpened={() => {
            setSheet(null)
            setView('editor')
          }}
        />
      </Sheet>
      <Sheet open={sheet === 'share'} title="Udostępnij i eksportuj" onClose={closeSheet}>
        <SharePanel onExportWav={() => void exportWav()} exporting={exporting} />
      </Sheet>

      {toast && (
        <div role="status" className="glass-solid fixed left-1/2 top-4 z-[60] max-w-[90vw] -translate-x-1/2 px-4 py-2.5 text-sm text-slate-100">
          {toast}
        </div>
      )}
    </div>
  )
}
