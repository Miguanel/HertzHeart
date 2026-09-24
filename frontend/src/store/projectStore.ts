import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { temporal } from 'zundo'
import {
  createClip,
  createComposition,
  makePreset,
  normalizeEnvelope,
  scaleEnvelope,
  type PresetId,
  type PresetOptions,
} from '../model/envelope'
import type { Clip, Composition, EnvelopePoint, Track } from '../model/schema'
import { MAX_TIME_S, MIN_CLIP_S } from '../model/schema'
import { clamp, round } from '../model/time'

type TrackPatch = Partial<Pick<Track, 'name' | 'frequencyMilliHz' | 'waveform' | 'volume' | 'muted' | 'pan'>>

export interface ProjectState {
  composition: Composition
  selectedTrackId: string | null
  selectedClipId: string | null

  loadComposition: (comp: Composition) => void
  setTitle: (title: string) => void
  setMasterVolume: (volume: number) => void
  addTracks: (tracks: Track[]) => void
  updateTrack: (trackId: string, patch: TrackPatch) => void
  removeTrack: (trackId: string) => void
  addClip: (trackId: string, start?: number) => void
  setClipTiming: (clipId: string, start: number, duration: number) => void
  removeClip: (clipId: string) => void
  setEnvelope: (clipId: string, points: EnvelopePoint[]) => void
  applyPreset: (clipId: string, preset: PresetId, options: PresetOptions) => void
  select: (trackId: string | null, clipId?: string | null) => void
}

export function findClip(comp: Composition, clipId: string | null): { track: Track; clip: Clip; index: number } | null {
  if (!clipId) return null
  for (const track of comp.tracks) {
    const index = track.clips.findIndex((c) => c.id === clipId)
    if (index >= 0) return { track, clip: track.clips[index], index }
  }
  return null
}

/** Wolny przedział wokół segmentu (żeby segmenty na jednej ścieżce się nie nakładały). */
export function clipBounds(track: Track, clipId: string): { min: number; max: number } {
  const others = track.clips.filter((c) => c.id !== clipId).sort((a, b) => a.start - b.start)
  const self = track.clips.find((c) => c.id === clipId)
  const mid = self ? self.start + self.duration / 2 : 0
  let min = 0
  let max = MAX_TIME_S
  for (const c of others) {
    if (c.start + c.duration <= mid) min = Math.max(min, c.start + c.duration)
    else if (c.start >= mid) max = Math.min(max, c.start)
  }
  return { min, max }
}

const touch = (c: Composition) => {
  c.updatedAt = new Date().toISOString()
}

/** Seria zmian w krótkim czasie (np. przeciąganie punktu) = jeden krok cofania. */
function batchHistory<A extends unknown[]>(fn: (...args: A) => void, wait = 400) {
  let timer: ReturnType<typeof setTimeout> | undefined
  return (...args: A) => {
    if (!timer) fn(...args)
    clearTimeout(timer)
    timer = setTimeout(() => (timer = undefined), wait)
  }
}

export const useProjectStore = create<ProjectState>()(
  temporal(
    immer((set) => {
      const mutate = (fn: (c: Composition) => void) =>
        set((s) => {
          fn(s.composition)
          touch(s.composition)
        })

      const withClip = (clipId: string, fn: (clip: Clip, track: Track) => void) =>
        mutate((c) => {
          const found = findClip(c, clipId)
          if (found) fn(found.clip, found.track)
        })

      return {
        composition: createComposition(),
        selectedTrackId: null,
        selectedClipId: null,

        loadComposition: (comp) =>
          set((s) => {
            s.composition = comp
            s.selectedTrackId = comp.tracks[0]?.id ?? null
            s.selectedClipId = comp.tracks[0]?.clips[0]?.id ?? null
          }),

        setTitle: (title) => mutate((c) => void (c.title = title.slice(0, 200))),

        setMasterVolume: (volume) => mutate((c) => void (c.masterVolume = clamp(volume, 0, 1))),

        addTracks: (tracks) =>
          set((s) => {
            if (!tracks.length) return
            s.composition.tracks.push(...tracks)
            touch(s.composition)
            s.selectedTrackId = tracks[0].id
            s.selectedClipId = tracks[0].clips[0]?.id ?? null
          }),

        updateTrack: (trackId, patch) =>
          mutate((c) => {
            const track = c.tracks.find((t) => t.id === trackId)
            if (track) Object.assign(track, patch)
          }),

        removeTrack: (trackId) =>
          set((s) => {
            s.composition.tracks = s.composition.tracks.filter((t) => t.id !== trackId)
            touch(s.composition)
            if (s.selectedTrackId === trackId) {
              s.selectedTrackId = null
              s.selectedClipId = null
            }
          }),

        addClip: (trackId, start) =>
          set((s) => {
            const track = s.composition.tracks.find((t) => t.id === trackId)
            if (!track) return
            const sorted = [...track.clips].sort((a, b) => a.start - b.start)
            let at = start ?? (sorted.length ? sorted[sorted.length - 1].start + sorted[sorted.length - 1].duration : 0)
            at = round(Math.max(0, at), 1)
            if (sorted.some((c) => at >= c.start && at < c.start + c.duration)) return // wewnątrz istniejącego segmentu
            const next = sorted.find((c) => c.start > at)
            const room = (next ? next.start : MAX_TIME_S) - at
            if (room < MIN_CLIP_S) return
            const clip = createClip(at, Math.min(60, room))
            track.clips.push(clip)
            track.clips.sort((a, b) => a.start - b.start)
            touch(s.composition)
            s.selectedTrackId = track.id
            s.selectedClipId = clip.id
          }),

        setClipTiming: (clipId, start, duration) =>
          withClip(clipId, (clip, track) => {
            const { min, max } = clipBounds(track, clipId)
            const d = round(clamp(duration, MIN_CLIP_S, max - min))
            const st = round(clamp(start, min, max - d))
            if (d !== clip.duration) clip.envelope = scaleEnvelope(clip.envelope, clip.duration, d)
            clip.start = st
            clip.duration = d
            track.clips.sort((a, b) => a.start - b.start)
          }),

        removeClip: (clipId) =>
          set((s) => {
            for (const t of s.composition.tracks) t.clips = t.clips.filter((c) => c.id !== clipId)
            touch(s.composition)
            if (s.selectedClipId === clipId) s.selectedClipId = null
          }),

        setEnvelope: (clipId, points) =>
          withClip(clipId, (clip) => {
            clip.envelope = normalizeEnvelope(points, clip.duration)
          }),

        applyPreset: (clipId, preset, options) =>
          withClip(clipId, (clip) => {
            clip.envelope = makePreset(preset, clip.duration, options)
          }),

        select: (trackId, clipId = null) =>
          set((s) => {
            s.selectedTrackId = trackId
            s.selectedClipId = clipId
          }),
      }
    }),
    {
      limit: 100,
      partialize: (s) => ({ composition: s.composition }),
      equality: (a, b) => a.composition === b.composition,
      handleSet: (handleSet) => batchHistory(handleSet),
    },
  ),
)

export const undo = () => useProjectStore.temporal.getState().undo()
export const redo = () => useProjectStore.temporal.getState().redo()
export const clearHistory = () => useProjectStore.temporal.getState().clear()
