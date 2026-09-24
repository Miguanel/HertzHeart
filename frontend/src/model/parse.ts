import { CompositionSchema, type Composition } from './schema'
import { newId, normalizeEnvelope } from './envelope'

/** Waliduje dane z niezaufanego źródła (link, plik, API) i doprowadza je do spójnej postaci. */
export function parseComposition(raw: unknown): Composition {
  const result = CompositionSchema.safeParse(raw)
  if (!result.success) {
    const issue = result.error.issues[0]
    throw new Error(`Nieprawidłowy projekt: ${issue?.path.join('.') || 'dane'} – ${issue?.message ?? 'błąd'}`)
  }
  const comp = result.data
  return {
    ...comp,
    tracks: comp.tracks.map((track) => ({
      ...track,
      clips: [...track.clips]
        .sort((a, b) => a.start - b.start)
        .map((clip) => ({ ...clip, envelope: normalizeEnvelope(clip.envelope, clip.duration) })),
    })),
  }
}

/** Świeża kopia projektu (nowe id i daty) – do otwierania zestawów, linków i importów. */
export function asNewProject(comp: Composition): Composition {
  const now = new Date().toISOString()
  return { ...comp, id: newId(), createdAt: now, updatedAt: now }
}
