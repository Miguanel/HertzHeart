import { Dexie, type EntityTable } from 'dexie'
import type { Composition } from '../model/schema'

export interface ProjectRecord {
  id: string
  title: string
  updatedAt: string
  data: Composition
}

export const db = new Dexie('heartzheart') as Dexie & { projects: EntityTable<ProjectRecord, 'id'> }

db.version(1).stores({ projects: 'id, updatedAt, title' })

const LAST_KEY = 'heartzheart:lastProject'

export async function saveProject(comp: Composition) {
  await db.projects.put({ id: comp.id, title: comp.title, updatedAt: comp.updatedAt, data: comp })
  try {
    localStorage.setItem(LAST_KEY, comp.id)
  } catch {
    /* tryb prywatny – pomijamy */
  }
}

export const listProjects = () => db.projects.orderBy('updatedAt').reverse().toArray()
export const getProject = (id: string) => db.projects.get(id)
export const deleteProject = (id: string) => db.projects.delete(id)

export function lastProjectId(): string | null {
  try {
    return localStorage.getItem(LAST_KEY)
  } catch {
    return null
  }
}

/** Prosi przeglądarkę, aby nie czyściła danych przy braku miejsca. */
export async function requestPersistentStorage() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) await navigator.storage.persist()
  } catch {
    /* nieobsługiwane */
  }
}
