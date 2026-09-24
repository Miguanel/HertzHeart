import { z } from 'zod'
import { DEFAULT_LIBRARY } from '../data/defaultLibrary'
import { parseComposition } from '../model/parse'
import { LibraryFrequencySchema, type Composition, type LibraryFrequency } from '../model/schema'

export async function fetchLibrary(): Promise<{ items: LibraryFrequency[]; offline: boolean }> {
  try {
    const res = await fetch('/api/frequencies/', { headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error(String(res.status))
    const items = z.array(LibraryFrequencySchema).parse(await res.json())
    return { items: items.length ? items : DEFAULT_LIBRARY, offline: false }
  } catch {
    return { items: DEFAULT_LIBRARY, offline: true }
  }
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
