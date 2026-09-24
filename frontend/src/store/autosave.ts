import { create } from 'zustand'
import { saveProject } from '../db/db'
import { useProjectStore } from './projectStore'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export const useSaveStatus = create<{ status: SaveStatus }>(() => ({ status: 'idle' }))

/** Zapisuje projekt w IndexedDB po każdej zmianie (z opóźnieniem). */
export function startAutosave(delay = 600): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined
  const unsubscribe = useProjectStore.subscribe((state, prev) => {
    if (state.composition === prev.composition) return
    clearTimeout(timer)
    useSaveStatus.setState({ status: 'saving' })
    timer = setTimeout(async () => {
      try {
        await saveProject(useProjectStore.getState().composition)
        useSaveStatus.setState({ status: 'saved' })
      } catch {
        useSaveStatus.setState({ status: 'error' })
      }
    }, delay)
  })
  return () => {
    clearTimeout(timer)
    unsubscribe()
  }
}
