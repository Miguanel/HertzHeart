import { compositionDuration } from '../model/envelope'
import type { Composition } from '../model/schema'
import { createMasterChain, scheduleComposition } from './schedule'

export const MAX_EXPORT_SECONDS = 60 * 60

/** Renderuje kompozycję offline (szybciej niż w czasie rzeczywistym) do pliku WAV 16-bit mono. */
export async function renderToWav(comp: Composition, sampleRate = 44_100): Promise<Blob> {
  const duration = compositionDuration(comp)
  if (duration <= 0) throw new Error('Projekt jest pusty.')
  if (duration > MAX_EXPORT_SECONDS) throw new Error('Eksport WAV jest ograniczony do 60 minut.')

  const length = Math.ceil((duration + 0.1) * sampleRate)
  const ctx = new OfflineAudioContext({ numberOfChannels: 1, length, sampleRate })
  const chain = createMasterChain(ctx, comp.masterVolume)
  chain.output.connect(ctx.destination)
  scheduleComposition(ctx, chain.input, comp, 0, 0)
  const buffer = await ctx.startRendering()
  return encodeWav(buffer)
}

function encodeWav(buffer: AudioBuffer): Blob {
  const samples = buffer.getChannelData(0)
  const bytesPerSample = 2
  const dataSize = samples.length * bytesPerSample
  const view = new DataView(new ArrayBuffer(44 + dataSize))
  const writeString = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i))
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true) // rozmiar bloku fmt
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, buffer.sampleRate, true)
  view.setUint32(28, buffer.sampleRate * bytesPerSample, true)
  view.setUint16(32, bytesPerSample, true)
  view.setUint16(34, 16, true)
  writeString(36, 'data')
  view.setUint32(40, dataSize, true)

  let offset = 44
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }
  return new Blob([view.buffer], { type: 'audio/wav' })
}
