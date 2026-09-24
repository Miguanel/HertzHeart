import { compositionDuration } from '../model/envelope'
import type { Composition, Waveform } from '../model/schema'
import { clamp } from '../model/time'
import { createMasterChain, scheduleComposition } from './schedule'

export type PlaybackState = 'stopped' | 'playing' | 'paused'

interface Voice {
  bus: GainNode
  oscillators: OscillatorNode[]
}

/**
 * Silnik audio niezależny od Reacta. Przy każdym play/seek buduje graf od zadanej
 * pozycji; pauza zapamiętuje pozycję i wycisza graf (dzięki temu edycje w trakcie
 * pauzy są uwzględniane przy wznowieniu).
 */
class AudioEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private voice: Voice | null = null
  private previewVoice: { osc: OscillatorNode; oscs: OscillatorNode[]; gain: GainNode; key: string } | null = null
  private from = 0
  private t0 = 0
  private duration = 0
  private heldPosition = 0
  private listeners = new Set<() => void>()

  state: PlaybackState = 'stopped'
  previewKey: string | null = null

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private emit() {
    this.listeners.forEach((l) => l())
  }

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext({ latencyHint: 'interactive' })
      const chain = createMasterChain(this.ctx, 0.5)
      chain.output.connect(this.ctx.destination)
      this.master = chain.input
    }
    return this.ctx
  }

  /** Musi być wywołane w obsłudze kliknięcia (polityka autoodtwarzania przeglądarek). */
  async unlock() {
    const ctx = this.ensureContext()
    if (ctx.state !== 'running') await ctx.resume()
  }

  async play(comp: Composition, from = this.getPosition()) {
    await this.unlock()
    const ctx = this.ctx!
    this.releaseVoice(0.02)
    this.setMasterVolume(comp.masterVolume)

    this.duration = compositionDuration(comp)
    this.from = clamp(from, 0, this.duration)
    this.t0 = ctx.currentTime + 0.05
    const bus = new GainNode(ctx, { gain: 1 })
    bus.connect(this.master!)
    this.voice = { bus, oscillators: scheduleComposition(ctx, bus, comp, this.from, this.t0) }
    this.state = 'playing'
    this.emit()
  }

  pause() {
    if (this.state !== 'playing') return
    this.heldPosition = this.getPosition()
    this.releaseVoice(0.03)
    this.state = 'paused'
    this.emit()
  }

  stop() {
    this.releaseVoice(0.03)
    this.heldPosition = 0
    this.state = 'stopped'
    this.emit()
  }

  /** Przewija; podczas odtwarzania przebudowuje graf od nowej pozycji. */
  seek(comp: Composition, position: number) {
    const pos = clamp(position, 0, compositionDuration(comp))
    if (this.state === 'playing') {
      void this.play(comp, pos)
    } else {
      this.heldPosition = pos
      if (this.state === 'stopped' && pos > 0) this.state = 'paused'
      this.emit()
    }
  }

  getPosition(): number {
    if (this.state !== 'playing' || !this.ctx) return this.heldPosition
    const latency = this.ctx.outputLatency || this.ctx.baseLatency || 0
    return clamp(this.from + (this.ctx.currentTime - this.t0) - latency, this.from, Math.max(this.from, this.duration))
  }

  getDuration() {
    return this.duration
  }

  setMasterVolume(volume: number) {
    if (!this.ctx || !this.master) return
    this.master.gain.setTargetAtTime(clamp(volume, 0, 1), this.ctx.currentTime, 0.02)
  }

  /** Krótki odsłuch pojedynczej częstotliwości z biblioteki. */
  /** Krótki odsłuch; z `beatMilliHz` gra parę binauralną (lewy/prawy kanał). */
  async togglePreview(key: string, frequencyMilliHz: number, beatMilliHz?: number | null, waveform: Waveform = 'sine', seconds = 6) {
    const wasSame = this.previewVoice?.key === key
    this.stopPreview()
    if (wasSame) return
    await this.unlock()
    const ctx = this.ctx!
    const now = ctx.currentTime
    const gain = new GainNode(ctx, { gain: 0 })
    gain.connect(this.master!)
    const voices = beatMilliHz
      ? [
          { f: frequencyMilliHz, pan: -1 },
          { f: frequencyMilliHz + beatMilliHz, pan: 1 },
        ]
      : [{ f: frequencyMilliHz, pan: 0 }]
    const oscs = voices.map(({ f, pan }) => {
      const osc = new OscillatorNode(ctx, { type: waveform, frequency: f / 1000 })
      if (pan) osc.connect(new StereoPannerNode(ctx, { pan })).connect(gain)
      else osc.connect(gain)
      osc.start(now)
      osc.stop(now + seconds + 0.05)
      return osc
    })
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.6, now + 0.3)
    gain.gain.setValueAtTime(0.6, now + seconds - 0.5)
    gain.gain.linearRampToValueAtTime(0, now + seconds)
    const osc = oscs[0]
    osc.onended = () => {
      if (this.previewVoice?.osc === osc) {
        this.previewVoice = null
        this.previewKey = null
        this.emit()
      }
    }
    this.previewVoice = { osc, oscs, gain, key }
    this.previewKey = key
    this.emit()
  }

  stopPreview() {
    const pv = this.previewVoice
    if (!pv || !this.ctx) return
    const now = this.ctx.currentTime
    pv.gain.gain.cancelScheduledValues(now)
    pv.gain.gain.setTargetAtTime(0, now, 0.02)
    pv.oscs.forEach((o) => o.stop(now + 0.1))
    this.previewVoice = null
    this.previewKey = null
    this.emit()
  }

  private releaseVoice(fade: number) {
    const voice = this.voice
    this.voice = null
    if (!voice || !this.ctx) return
    const now = this.ctx.currentTime
    const g = voice.bus.gain
    g.cancelScheduledValues(now)
    g.setValueAtTime(g.value, now)
    g.linearRampToValueAtTime(0, now + fade)
    for (const osc of voice.oscillators) {
      try {
        osc.stop(now + fade + 0.01)
      } catch {
        /* oscylator mógł się już zakończyć */
      }
    }
    setTimeout(() => voice.bus.disconnect(), (fade + 0.1) * 1000)
  }
}

export const engine = new AudioEngine()
