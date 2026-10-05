import { create } from 'zustand'

export type MobileView = 'library' | 'editor'
export type AppMode = 'sequencer' | 'binaural'
export type SheetId = 'projects' | 'share' | 'settings' | null
export type LibraryTab = 'frequencies' | 'presets'

/** Zapytanie o opis pasm fal mózgowych dla częstotliwości (okno „Fale mózgowe”). */
export interface BrainInfoRequest {
  /** Częstotliwość [Hz]. */
  hz: number
  /** Skąd pochodzi, np. „Ścieżka 432 Hz” albo „Dudnienie binauralne”. */
  source: string
}

export interface Notice {
  id: number
  text: string
  info?: BrainInfoRequest
  tone?: 'neutral' | 'warn'
}

/** Stan interfejsu wspólny dla aplikacji i poradnika (poradnik sam przełącza widoki). */
interface UiState {
  mode: AppMode
  view: MobileView
  sheet: SheetId
  libraryTab: LibraryTab
  brainInfo: BrainInfoRequest | null
  notice: Notice | null
  setMode: (mode: AppMode) => void
  setView: (view: MobileView) => void
  setSheet: (sheet: SheetId) => void
  setLibraryTab: (tab: LibraryTab) => void
  showBrainInfo: (info: BrainInfoRequest | null) => void
  showNotice: (notice: Omit<Notice, 'id'> | null) => void
}

let noticeId = 0

export const useUi = create<UiState>()((set) => ({
  mode: 'sequencer',
  view: 'editor',
  sheet: null,
  libraryTab: 'frequencies',
  brainInfo: null,
  notice: null,
  setMode: (mode) => set({ mode }),
  // wybór widoku biblioteki/edytora zawsze wraca do sekwencera
  setView: (view) => set({ view, mode: 'sequencer' }),
  setSheet: (sheet) => set({ sheet }),
  setLibraryTab: (libraryTab) => set({ libraryTab }),
  showBrainInfo: (brainInfo) => set({ brainInfo }),
  showNotice: (notice) => set({ notice: notice ? { ...notice, id: ++noticeId } : null }),
}))
