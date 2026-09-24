import { useEffect, useRef } from 'react'
import { engine } from '../audio/engine'
import type { Composition } from '../model/schema'
import { clearHistory, redo, undo, useProjectStore } from './projectStore'

/** Otwiera projekt jako bieżący (zatrzymuje odtwarzanie, czyści historię cofania). */
export function openComposition(comp: Composition) {
  engine.stop()
  engine.stopPreview()
  useProjectStore.getState().loadComposition(comp)
  clearHistory()
}

export function togglePlay() {
  if (engine.state === 'playing') engine.pause()
  else void engine.play(useProjectStore.getState().composition)
}

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))

/** Łączy stan projektu z silnikiem: edycje na żywo, głośność, koniec utworu, skróty klawiszowe. */
export function usePlaybackController() {
  const tracks = useProjectStore((s) => s.composition.tracks)
  const masterVolume = useProjectStore((s) => s.composition.masterVolume)
  const lastTracks = useRef(tracks)

  // Zmiana ścieżek podczas odtwarzania -> przebudowa grafu od bieżącej pozycji.
  useEffect(() => {
    if (lastTracks.current === tracks) return
    lastTracks.current = tracks
    if (engine.state !== 'playing') return
    const id = setTimeout(() => {
      if (engine.state === 'playing') void engine.play(useProjectStore.getState().composition, engine.getPosition())
    }, 120)
    return () => clearTimeout(id)
  }, [tracks])

  useEffect(() => engine.setMasterVolume(masterVolume), [masterVolume])

  useEffect(() => {
    const id = setInterval(() => {
      if (engine.state === 'playing' && engine.getPosition() >= engine.getDuration() - 0.001) engine.stop()
    }, 200)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return
      const mod = e.ctrlKey || e.metaKey
      if (e.code === 'Space' && !mod) {
        e.preventDefault()
        togglePlay()
      } else if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
