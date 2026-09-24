import { useEffect, useRef, useState, useSyncExternalStore, type PointerEvent as RPointerEvent } from 'react'
import { engine } from '../audio/engine'

export const usePlaybackState = () => useSyncExternalStore(engine.subscribe, () => engine.state)
export const usePreviewKey = () => useSyncExternalStore(engine.subscribe, () => engine.previewKey)

/** Wywołuje callback w każdej klatce z bieżącą pozycją – bez re-renderów Reacta. */
export function useAnimationFrame(callback: (position: number) => void) {
  const ref = useRef(callback)
  useEffect(() => {
    ref.current = callback
  })
  useEffect(() => {
    let id = 0
    const loop = () => {
      ref.current(engine.getPosition())
      id = requestAnimationFrame(loop)
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [])
}

/** Pozycja odtwarzania odświeżana kilka razy na sekundę (do wyświetlania czasu). */
export function usePosition(intervalMs = 100) {
  const [position, setPosition] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setPosition(engine.getPosition()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return position
}

/** Podwójne kliknięcie / stuknięcie działające tak samo dla myszy i dotyku. */
export function useDoubleTap(onDouble: (e: RPointerEvent) => void, delay = 320) {
  const last = useRef<{ t: number; x: number; y: number } | null>(null)
  return (e: RPointerEvent) => {
    const now = e.timeStamp
    const prev = last.current
    if (prev && now - prev.t < delay && Math.hypot(e.clientX - prev.x, e.clientY - prev.y) < 24) {
      last.current = null
      onDouble(e)
    } else {
      last.current = { t: now, x: e.clientX, y: e.clientY }
    }
  }
}
