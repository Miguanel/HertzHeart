import { z } from 'zod'
import { parseComposition } from '../model/parse'
import {
  LibraryFrequencySchema,
  RemotePresetSchema,
  type Composition,
  type LibraryFrequency,
  type RemotePreset,
} from '../model/schema'

/** Ostatnia udana odpowiedź API zapamiętana lokalnie (na wypadek pracy offline). */
async function fetchWithCache<T>(url: string, schema: z.ZodType<T>, cacheKey: string): Promise<{ items: T; offline: boolean } | null> {
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error(String(res.status))
    const items = schema.parse(await res.json())
    try {
      localStorage.setItem(cacheKey, JSON.stringify(items))
    } catch {
      /* brak miejsca / tryb prywatny */
    }
    return { items, offline: false }
  } catch {
    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) return { items: schema.parse(JSON.parse(cached)), offline: true }
    } catch {
      /* uszkodzony cache */
    }
    return null
  }
}

export async function fetchLibrary(): Promise<{ items: LibraryFrequency[]; offline: boolean }> {
  return (await fetchWithCache('/api/frequencies/', z.array(LibraryFrequencySchema), 'heartzheart:library')) ?? { items: [], offline: true }
}

export async function fetchRemotePresets(): Promise<RemotePreset[]> {
  return (await fetchWithCache('/api/presets/', z.array(RemotePresetSchema), 'heartzheart:presets'))?.items ?? []
}

export async function createShortLink(comp: Composition): Promise<string> {
  const res = await fetch('/api/shares/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ data: comp }),
  })
  if (res.status === 429) throw new Error('Zbyt wiele udostępnień – spróbuj za chwilę.')
  if (!res.ok) throw new Error('Nie udało się utworzyć linku (serwer niedostępny?).')
  const body = (await res.json()) as { path: string }
  return `${location.origin}${body.path}`
}

export async function fetchSharedProject(slug: string): Promise<Composition> {
  const res = await fetch(`/api/shares/${encodeURIComponent(slug)}/`, { headers: { Accept: 'application/json' } })
  if (res.status === 404) throw new Error('Ten link nie istnieje lub wygasł.')
  if (!res.ok) throw new Error('Nie udało się pobrać projektu.')
  const body = (await res.json()) as { data: unknown }
  return parseComposition(body.data)
}
