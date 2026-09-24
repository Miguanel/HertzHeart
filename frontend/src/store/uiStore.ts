import { create } from 'zustand'

export type MobileView = 'library' | 'editor'
export type SheetId = 'projects' | 'share' | null
export type LibraryTab = 'frequencies' | 'presets'

/** Stan interfejsu wspólny dla aplikacji i poradnika (poradnik sam przełącza widoki). */
interface UiState {
  view: MobileView
  sheet: SheetId
  libraryTab: LibraryTab
  setView: (view: MobileView) => void
  setSheet: (sheet: SheetId) => void
  setLibraryTab: (tab: LibraryTab) => void
}

export const useUi = create<UiState>()((set) => ({
  view: 'editor',
  sheet: null,
  libraryTab: 'frequencies',
  setView: (view) => set({ view }),
  setSheet: (sheet) => set({ sheet }),
  setLibraryTab: (libraryTab) => set({ libraryTab }),
}))
