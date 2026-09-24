import { create } from 'zustand'
import { engine } from '../audio/engine'
import { deleteProject } from '../db/db'
import { createClip, createTrack, newId } from '../model/envelope'
import type { Composition } from '../model/schema'
import { useProjectStore } from '../store/projectStore'
import { openComposition } from '../store/session'
import { useUi } from '../store/uiStore'
import { buildSteps, type TourStep } from './steps'

const SEEN_KEY = 'heartzheart:tourSeen'

function readSeen(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === '1'
  } catch {
    return true // bez dostępu do pamięci nie pokazujemy automatycznie przy każdym wejściu
  }
}

function writeSeen(seen: boolean) {
  try {
    if (seen) localStorage.setItem(SEEN_KEY, '1')
    else localStorage.removeItem(SEEN_KEY)
  } catch {
    /* tryb prywatny */
  }
}

/** Projekt, na którym pokazujemy funkcje: jedna niska częstotliwość 136,100 Hz („OM”). */
export function createDemoProject(): Composition {
  const now = new Date().toISOString()
  return {
    schemaVersion: 1,
    id: newId(),
    title: 'Poradnik · projekt demonstracyjny',
    createdAt: now,
    updatedAt: now,
    masterVolume: 0.5,
    tracks: [
      createTrack('Ziemia – rok (OM)', 136_100, {
        clips: [createClip(0, 40, 'fadeInOut', { fade: 5, level: 0.8 })],
      }),
    ],
  }
}

type Phase = 'closed' | 'welcome' | 'running' | 'finish'

interface TourState {
  phase: Phase
  step: number
  steps: TourStep[]
  previous: Composition | null
  demoId: string | null
  /** Ekran powitalny z wyborem: rozpocznij / nie teraz. */
  offer: () => void
  offerIfFirstVisit: () => void
  begin: () => void
  go: (step: number) => void
  next: () => void
  back: () => void
  /** Przejście do ekranu końcowego (także po „Pomiń”). */
  end: () => void
  dismissWelcome: () => void
  close: (opts: { keepDemo: boolean; showAgain: boolean }) => void
}

const isMobile = () => window.matchMedia('(max-width: 1023px)').matches

export const useTour = create<TourState>()((set, get) => ({
  phase: 'closed',
  step: 0,
  steps: [],
  previous: null,
  demoId: null,

  offer: () => set({ phase: 'welcome' }),

  offerIfFirstVisit: () => {
    const params = new URLSearchParams(location.search)
    const forced = params.has('poradnik')
    if (forced) {
      params.delete('poradnik')
      const query = params.toString()
      history.replaceState(null, '', `${location.pathname}${query ? `?${query}` : ''}${location.hash}`)
    }
    const seen = readSeen()
    console.info(`[HeartzHeart] poradnik: ${forced ? 'wymuszony adresem ?poradnik' : seen ? 'pominięty – już widziany na tym urządzeniu' : 'pokazany (pierwsza wizyta)'}`)
    if ((forced || !seen) && get().phase === 'closed') set({ phase: 'welcome' })
  },

  begin: () => {
    const previous = useProjectStore.getState().composition
    const demo = createDemoProject()
    engine.stop()
    openComposition(demo)
    set({ phase: 'running', step: 0, steps: buildSteps(isMobile()), previous, demoId: demo.id })
  },

  go: (step) => {
    const { steps } = get()
    if (step >= steps.length) get().end()
    else set({ step: Math.max(0, step) })
  },
  next: () => get().go(get().step + 1),
  back: () => get().go(get().step - 1),

  end: () => {
    engine.stop()
    engine.stopPreview()
    useUi.getState().setSheet(null)
    set({ phase: 'finish' })
  },

  dismissWelcome: () => {
    writeSeen(true)
    set({ phase: 'closed' })
  },

  close: ({ keepDemo, showAgain }) => {
    const { previous, demoId } = get()
    writeSeen(!showAgain)
    engine.stop()
    if (!keepDemo && previous) {
      openComposition(previous)
      if (demoId) void deleteProject(demoId)
    }
    useUi.getState().setView('editor')
    useUi.getState().setLibraryTab('frequencies')
    set({ phase: 'closed', previous: null, demoId: null })
  },
}))
