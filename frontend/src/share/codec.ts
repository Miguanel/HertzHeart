import type { Composition } from '../model/schema'
import { parseComposition } from '../model/parse'

type Bytes = Uint8Array<ArrayBuffer>

async function transform(bytes: Bytes, stream: CompressionStream | DecompressionStream): Promise<Bytes> {
  const piped = new Blob([bytes]).stream().pipeThrough(stream)
  return new Uint8Array(await new Response(piped).arrayBuffer())
}

function toBase64Url(bytes: Bytes): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(text: string): Bytes {
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}

/** Projekt -> tekst do umieszczenia w adresie (#p=...). */
export async function encodeComposition(comp: Composition): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(comp))
  return toBase64Url(await transform(json, new CompressionStream('deflate-raw')))
}

export async function decodeComposition(encoded: string): Promise<Composition> {
  const bytes = await transform(fromBase64Url(encoded), new DecompressionStream('deflate-raw'))
  return parseComposition(JSON.parse(new TextDecoder().decode(bytes)))
}

export async function buildShareUrl(comp: Composition): Promise<string> {
  return `${location.origin}/#p=${await encodeComposition(comp)}`
}

export type ShareSource = { kind: 'hash'; payload: string } | { kind: 'slug'; slug: string }

export function readShareFromLocation(): ShareSource | null {
  const hash = new URLSearchParams(location.hash.slice(1)).get('p')
  if (hash) return { kind: 'hash', payload: hash }
  const match = /^\/s\/([\w-]{4,16})\/?$/.exec(location.pathname)
  if (match) return { kind: 'slug', slug: match[1] }
  return null
}

export function clearShareFromLocation() {
  history.replaceState(null, '', '/')
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function safeFilename(title: string) {
  return (title.trim() || 'projekt').replace(/[^\p{L}\p{N}_ -]+/gu, '').replace(/\s+/g, '_').slice(0, 60)
}

export function compositionToFile(comp: Composition): File {
  return new File([JSON.stringify(comp, null, 2)], `${safeFilename(comp.title)}.heartz.json`, { type: 'application/json' })
}
