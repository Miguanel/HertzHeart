import { useCallback, useEffect, useState } from 'react'
import { fetchLibrary, fetchSharedProject } from './api/client'
import { renderToWav } from './audio/wav'
import { BinauralStudio, useBinauralPlayback } from './components/BinauralStudio'
import { BrainInfoSheet, ProjectBrainStrip, useBrainwaveNotices } from './components/Brainwaves'
import { ClipInspector } from './components/ClipInspector'
import { Icon, type IconName } from './components/icons'
import { LibraryPanel } from './components/LibraryPanel'
import { ProjectsPanel } from './components/ProjectsPanel'
import { SettingsPanel } from './components/SettingsPanel'
import { SharePanel } from './components/SharePanel'
import { Timeline } from './components/Timeline'
import { TopBar } from './components/TopBar'
import { TransportBar } from './components/TransportBar'
import { IconButton, Sheet } from './components/ui'
import { getProject, lastProjectId, listProjects, requestPersistentStorage } from './db/db'
import { createComposition } from './model/envelope'
import { asNewProject, parseComposition } from './model/parse'
import type { Composition, LibraryFrequency } from './model/schema'
import { clearShareFromLocation, decodeComposition, downloadBlob, readShareFromLocation, safeFilename } from './share/codec'
import { startAutosave } from './store/autosave'
import { useProjectStore } from './store/projectStore'
import { useSettings } from './store/settings'
import { openComposition, usePlaybackController } from './store/session'
import { useUi, type MobileView } from './store/uiStore'
import { Tour } from './tour/Tour'
import { useTour } from './tour/tourStore'

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
  const { view, setView, sheet, setSheet, mode, setMode } = useUi()
  const simpleMode = useSettings((s) => s.simpleMode)
  const [toast, setToast] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  usePlaybackController()
  useBinauralPlayback()
  useBrainwaveNotices()

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
    void loadInitialProject().then((msg) => {
      if (msg) showToast(msg)
      useTour.getState().offerIfFirstVisit()
    })
    return stopAutosave
  }, [showToast])

  const closeSheet = useCallback(() => setSheet(null), [setSheet])

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

  const tab = (id: MobileView | 'projects' | 'binaural', icon: IconName, label: string) => {
    const active =
      id === 'projects'
        ? sheet === 'projects'
        : sheet === null && (id === 'binaural' ? mode === 'binaural' : mode === 'sequencer' && view === id)
    const go = () => {
      if (id === 'projects') return setSheet('projects')
      setSheet(null)
      if (id === 'binaural') setMode('binaural')
      else setView(id)
    }
    return (
      <button
        type="button"
        onClick={go}
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
      <TopBar onProjects={() => setSheet('projects')} onShare={() => setSheet('share')} onSettings={() => setSheet('settings')} />

      <main className="mx-auto flex min-h-0 w-full max-w-[1920px] flex-1 gap-3 px-3 pb-3 sm:px-5">
        {mode === 'binaural' ? (
          <BinauralStudio />
        ) : (
          <>
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
          {!simpleMode && <ProjectBrainStrip />}
          <Timeline onOpenLibrary={() => setView('library')} />
          <ClipInspector />
        </section>
          </>
        )}
      </main>

      <footer className="mx-auto w-full max-w-[1920px] space-y-2 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] sm:px-5 lg:pb-4">
        {mode === 'sequencer' && <TransportBar />}
        <nav data-tour="mobile-nav" className="glass grid grid-cols-4 gap-1 p-1 lg:hidden" aria-label="Nawigacja">
          {tab('library', 'library', 'Biblioteka')}
          {tab('editor', 'wave', 'Edytor')}
          {tab('binaural', 'binaural', 'Binauralne')}
          {tab('projects', 'folder', 'Projekty')}
        </nav>
      </footer>

      <Sheet open={sheet === 'projects'} title="Projekty" onClose={closeSheet} tour="sheet-projects">
        <ProjectsPanel
          onOpened={() => {
            setSheet(null)
            setView('editor')
          }}
        />
      </Sheet>
      <Sheet open={sheet === 'share'} title="Udostępnij i eksportuj" onClose={closeSheet} tour="sheet-share">
        <SharePanel onExportWav={() => void exportWav()} exporting={exporting} />
      </Sheet>

      <Sheet open={sheet === 'settings'} title="Ustawienia" onClose={closeSheet}>
        <SettingsPanel />
      </Sheet>
      <BrainInfoSheet />

      <Tour />
      <NoticeBar />

      {toast && (
        <div role="status" className="glass-solid fixed left-1/2 top-4 z-[60] max-w-[90vw] -translate-x-1/2 px-4 py-2.5 text-sm text-slate-100">
          {toast}
        </div>
      )}
    </div>
  )
}

/** Komunikat z akcją „Szczegóły” (np. informacja o paśmie fal mózgowych). */
function NoticeBar() {
  const notice = useUi((s) => s.notice)
  const showNotice = useUi((s) => s.showNotice)
  const showBrainInfo = useUi((s) => s.showBrainInfo)
  useEffect(() => {
    if (!notice) return
    const id = setTimeout(() => showNotice(null), notice.info ? 12_000 : 5000)
    return () => clearTimeout(id)
  }, [notice, showNotice])
  if (!notice) return null
  return (
    <div
      role="status"
      className={`glass-solid fixed bottom-[calc(env(safe-area-inset-bottom)+8.5rem)] left-1/2 z-[55] flex w-[min(36rem,calc(100vw-1.5rem))] -translate-x-1/2 items-start gap-2 p-3 lg:bottom-24 ${
        notice.tone === 'warn' ? 'border-warn/50!' : 'border-plasma/40!'
      }`}
    >
      <p className={`min-w-0 flex-1 text-[13px] leading-snug ${notice.tone === 'warn' ? 'text-warn' : 'text-slate-200'}`}>{notice.text}</p>
      {notice.info && (
        <button
          type="button"
          onClick={() => {
            showBrainInfo(notice.info!)
            showNotice(null)
          }}
          className="shrink-0 rounded-lg border border-plasma/50 px-2.5 py-1 text-xs text-plasma hover:bg-plasma/10"
        >
          Szczegóły
        </button>
      )}
      <IconButton size="sm" icon="close" label="Zamknij" onClick={() => showNotice(null)} />
    </div>
  )
}
