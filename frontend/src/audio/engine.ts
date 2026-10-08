import { compositionDuration } from '../model/envelope'
import type { Composition, Track, Waveform } from '../model/schema'
import { clamp } from '../model/time'
import { seekFade, smoothingTime, stopFadeTime, transportFade } from '../store/settings'
import { fadeOut, holdAt, makeOsc, prepareContext, type Osc } from './osc'
import {
  createMasterChain,
  createTrackVoice,
  glidePan,
  releaseTrackVoice,
  scheduleGain,
  trackGainPoints,
  type TrackVoice,
} from './schedule'

export type PlaybackState = 'stopped' | 'playing' | 'paused'

/** Parametry jednej fali binauralnej: lewy kanał = nośna, prawy = nośna + dudnienie. */
export interface BinauralVoiceParams {
  id: string
  carrierMilliHz: number
  beatMilliHz: number
  volume: number
}

interface BinauralVoice {
  left: Osc
  right: Osc
  gain: GainNode
  out: AudioNode
  carrier: number
  beat: number
  volume: number
}

/** Opóźnienie startu nowych zdarzeń względem `currentTime` – zapas na planowanie w wątku audio. */
const LOOKAHEAD = 0.03

/**
 * Silnik audio niezależny od Reacta.
 *
 * Każda ścieżka ma jeden ciągły generator. Edycje w trakcie odtwarzania nie przebudowują grafu, tylko
 * płynnie „doprowadzają” bieżący dźwięk do nowego stanu w czasie bufora (ustawienie „Bufor łagodzący”):
 * częstotliwość przesuwa się po rampie, głośność i kanał przechodzą liniowo, a zmiana kształtu fali
 * to przenikanie dwóch generatorów. Dzięki temu nie ma trzasków ani nagłych skoków.
 */
class AudioEngine {
  private ctx: AudioContext | null = null
  private ready: Promise<boolean> | null = null
  private precise = false
  private master: GainNode | null = null
  private guard: GainNode | null = null
  private voices = new Map<string, TrackVoice>()
  private bus: GainNode | null = null
  private binaural = new Map<string, BinauralVoice>()
  private previewVoice: { oscs: Osc[]; gain: GainNode; key: string; timer: ReturnType<typeof setTimeout> } | null = null
  private from = 0
  private t0 = 0
  private duration = 0
  private heldPosition = 0
  private listeners = new Set<() => void>()
  private wasInterrupted = false

  state: PlaybackState = 'stopped'
  previewKey: string | null = null
  /** Opis bieżącego odsłuchu z biblioteki (do paska „Teraz gra”). */
  previewInfo: { label: string; frequencyMilliHz: number; beatMilliHz: number | null } | null = null
  /** Fale binauralne, które właśnie się wygaszają (pokazywane w pasku „Teraz gra”). */
  fadingBinaural: readonly string[] = []
  /** Czy projekt właśnie się wygasza po pauzie/stopie. */
  projectFading = false
  private projectFadeTimer: ReturnType<typeof setTimeout> | null = null

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private emit() {
    this.listeners.forEach((l) => l())
  }

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const ctx = new AudioContext({ latencyHint: 'interactive' })
      const chain = createMasterChain(ctx, 0.5)
      chain.output.connect(ctx.destination)
      this.ctx = ctx
      this.master = chain.input
      this.guard = chain.guard
      this.ready = prepareContext(ctx).then((ok) => (this.precise = ok))
      this.installProtection(ctx)
    }
    return this.ctx
  }

  /**
   * Ochrona przed trzaskami urządzenia: gdy system przerwie dźwięk (zmiana słuchawek, połączenie, uśpienie),
   * po powrocie wyjście jest najpierw wyciszone i płynnie przywracane w czasie bufora.
   */
  private installProtection(ctx: AudioContext) {
    ctx.addEventListener('statechange', () => {
      if (ctx.state === 'running') {
        if (this.wasInterrupted) this.softRecover()
        this.wasInterrupted = false
      } else {
        this.wasInterrupted = true
      }
    })
    navigator.mediaDevices?.addEventListener?.('devicechange', () => this.softRecover())
    document.addEventListener('visibilitychange', () => {
      // iOS potrafi zawiesić kontekst w tle – wznawiamy, jeśli coś powinno grać.
      if (document.visibilityState === 'visible' && ctx.state !== 'running' && this.isSounding()) void ctx.resume()
    })
  }

  private isSounding() {
    return this.state === 'playing' || this.binaural.size > 0 || this.previewVoice !== null
  }

  /** Szybkie, bezpieczne wyciszenie i płynny powrót poziomu. */
  private softRecover() {
    const ctx = this.ctx
    const g = this.guard?.gain
    if (!ctx || !g) return
    const now = ctx.currentTime
    holdAt(g, now)
    g.linearRampToValueAtTime(0, now + 0.02)
    g.linearRampToValueAtTime(1, now + 0.02 + Math.max(smoothingTime(), 0.2))
  }

  /** Musi być wywołane w obsłudze kliknięcia (polityka autoodtwarzania przeglądarek). */
  async unlock() {
    const ctx = this.ensureContext()
    if (ctx.state !== 'running') await ctx.resume()
    await this.ready
  }

  /** Czy działa generator 64-bitowy (null = audio jeszcze nieuruchomione). */
  get preciseOscillator(): boolean | null {
    return this.ctx ? this.precise : null
  }

  // ───────────────────────── Odtwarzanie projektu ─────────────────────────

  async play(comp: Composition, from = this.getPosition()) {
    const wasPlaying = this.state === 'playing'
    await this.unlock()
    const ctx = this.ctx!
    const fade = wasPlaying ? seekFade() : transportFade()
    this.releaseAll(fade)
    this.setMasterVolume(comp.masterVolume)

    this.duration = compositionDuration(comp)
    this.from = clamp(from, 0, this.duration)
    this.t0 = ctx.currentTime + LOOKAHEAD
    const bus = new GainNode(ctx, { gain: 1 })
    bus.connect(this.master!)
    this.bus = bus
    for (const track of comp.tracks) this.startVoice(track, fade)
    this.state = 'playing'
    this.emit()
  }

  private startVoice(track: Track, glide: number) {
    const ctx = this.ctx!
    const pts = trackGainPoints(track)
    if (!pts.length || !this.bus) return
    const startAt = Math.max(ctx.currentTime + LOOKAHEAD, this.t0)
    const voice = createTrackVoice(ctx, track, this.bus, startAt, this.precise)
    scheduleGain(voice.env.gain, pts, this.positionAt(startAt), startAt, 0, glide)
    this.voices.set(track.id, voice)
  }

  /** Pozycja kompozycji odpowiadająca czasowi kontekstu `time`. */
  private positionAt(time: number) {
    return this.from + (time - this.t0)
  }

  /**
   * Zmiany projektu w trakcie odtwarzania – stosowane płynnie w czasie bufora, bez przebudowy całego grafu.
   */
  update(comp: Composition) {
    if (this.state !== 'playing' || !this.ctx) return
    const ctx = this.ctx
    const glide = smoothingTime()
    const now = ctx.currentTime
    this.duration = compositionDuration(comp)
    if (this.positionAt(now) >= this.duration) {
      this.stop()
      return
    }

    const seen = new Set<string>()
    for (const track of comp.tracks) {
      seen.add(track.id)
      const voice = this.voices.get(track.id)
      const pts = trackGainPoints(track)
      if (voice && voice.waveform !== track.waveform) {
        // inny kształt fali = przenikanie starego i nowego generatora
        this.voices.delete(track.id)
        releaseTrackVoice(ctx, voice, glide)
        if (pts.length) this.startVoice(track, glide)
        continue
      }
      if (!voice) {
        if (pts.length) this.startVoice(track, glide)
        continue
      }
      const hz = track.frequencyMilliHz / 1000
      if (hz !== voice.hz) {
        voice.osc.setFrequency(hz, glide)
        voice.hz = hz
      }
      glidePan(ctx, voice, track.pan ?? 0, glide)
      scheduleGain(voice.env.gain, pts, this.positionAt(now), now, null, glide)
    }
    for (const [id, voice] of this.voices) {
      if (seen.has(id)) continue
      this.voices.delete(id)
      releaseTrackVoice(ctx, voice, glide)
    }
  }

  pause() {
    if (this.state !== 'playing') return
    this.heldPosition = this.getPosition()
    this.releaseAll(this.markProjectFading())
    this.state = 'paused'
    this.emit()
  }

  /** Ustawia stan „wygaszanie” projektu na czas wygaszania i zwraca ten czas. */
  private markProjectFading(): number {
    const fade = stopFadeTime()
    if (!this.voices.size) return fade
    this.projectFading = true
    if (this.projectFadeTimer) clearTimeout(this.projectFadeTimer)
    this.projectFadeTimer = setTimeout(() => {
      this.projectFading = false
      this.emit()
    }, fade * 1000)
    return fade
  }

  stop() {
    this.releaseAll(this.state === 'playing' ? this.markProjectFading() : transportFade())
    this.heldPosition = 0
    this.state = 'stopped'
    this.emit()
  }

  /** Przewija; podczas odtwarzania przenika do nowej pozycji. */
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
    return clamp(this.positionAt(this.ctx.currentTime) - latency, this.from, Math.max(this.from, this.duration))
  }

  getDuration() {
    return this.duration
  }

  setMasterVolume(volume: number) {
    if (!this.ctx || !this.master) return
    const now = this.ctx.currentTime
    holdAt(this.master.gain, now)
    this.master.gain.linearRampToValueAtTime(clamp(volume, 0, 1), now + Math.max(0.05, Math.min(smoothingTime(), 1)))
  }

  private releaseAll(fade: number) {
    const ctx = this.ctx
    const bus = this.bus
    this.bus = null
    if (!ctx) return
    for (const voice of this.voices.values()) releaseTrackVoice(ctx, voice, fade)
    this.voices.clear()
    if (bus) setTimeout(() => bus.disconnect(), (fade + 0.3) * 1000)
  }

  // ───────────────────────── Fale binauralne ─────────────────────────

  /**
   * Synchronizuje grające fale binauralne z listą `active`: nowe płynnie wchodzą, usunięte płynnie
   * gasną, a zmiany nośnej, dudnienia i głośności przechodzą w czasie bufora.
   */
  async setBinaural(active: BinauralVoiceParams[]) {
    if (!active.length && !this.binaural.size) return
    await this.unlock()
    const ctx = this.ctx!
    const glide = smoothingTime()
    const now = ctx.currentTime
    const seen = new Set<string>()
    for (const p of active) {
      seen.add(p.id)
      const carrier = p.carrierMilliHz / 1000
      const beat = p.beatMilliHz / 1000
      const voice = this.binaural.get(p.id)
      if (!voice) {
        const startAt = now + LOOKAHEAD
        const gain = new GainNode(ctx, { gain: 0 })
        const merger = new ChannelMergerNode(ctx, { numberOfInputs: 2 })
        const left = makeOsc(ctx, { waveform: 'sine', hz: carrier, startAt }, this.precise)
        const right = makeOsc(ctx, { waveform: 'sine', hz: carrier + beat, startAt }, this.precise)
        left.output.connect(merger, 0, 0)
        right.output.connect(merger, 0, 1)
        merger.connect(gain).connect(this.master!)
        gain.gain.setValueAtTime(0, startAt)
        gain.gain.linearRampToValueAtTime(p.volume, startAt + Math.max(glide, 0.05))
        this.binaural.set(p.id, { left, right, gain, out: merger, carrier, beat, volume: p.volume })
        continue
      }
      if (voice.carrier !== carrier || voice.beat !== beat) {
        if (voice.carrier !== carrier) voice.left.setFrequency(carrier, glide)
        voice.right.setFrequency(carrier + beat, glide)
        voice.carrier = carrier
        voice.beat = beat
      }
      if (voice.volume !== p.volume) {
        holdAt(voice.gain.gain, now)
        voice.gain.gain.linearRampToValueAtTime(p.volume, now + Math.max(glide, 0.05))
        voice.volume = p.volume
      }
    }
    for (const [id, voice] of this.binaural) {
      if (seen.has(id)) continue
      this.binaural.delete(id)
      const fade = Math.max(stopFadeTime(), 0.05)
      fadeOut(voice.gain.gain, now, fade)
      voice.left.stop(now + fade + 0.05)
      voice.right.stop(now + fade + 0.05)
      this.fadingBinaural = [...this.fadingBinaural.filter((x) => x !== id), id]
      this.emit()
      setTimeout(() => {
        voice.left.disconnect()
        voice.right.disconnect()
        voice.gain.disconnect()
        if (!this.binaural.has(id) || this.fadingBinaural.includes(id)) {
          this.fadingBinaural = this.fadingBinaural.filter((x) => x !== id)
          this.emit()
        }
      }, (fade + 0.2) * 1000)
    }
    // fala włączona ponownie w trakcie wygaszania – już nie „wygasa”
    const restarted = this.fadingBinaural.filter((x) => this.binaural.has(x))
    if (restarted.length) {
      this.fadingBinaural = this.fadingBinaural.filter((x) => !this.binaural.has(x))
      this.emit()
    }
  }

  // ───────────────────────── Odsłuch z biblioteki ─────────────────────────

  /** Krótki odsłuch; z `beatMilliHz` gra parę binauralną (lewy/prawy kanał). */
  async togglePreview(
    key: string,
    frequencyMilliHz: number,
    beatMilliHz?: number | null,
    waveform: Waveform = 'sine',
    seconds = 6,
    label = 'Odsłuch',
  ) {
    const wasSame = this.previewVoice?.key === key
    this.stopPreview()
    if (wasSame) return
    await this.unlock()
    const ctx = this.ctx!
    const now = ctx.currentTime + LOOKAHEAD
    const gain = new GainNode(ctx, { gain: 0 })
    gain.connect(this.master!)
    const voices = beatMilliHz
      ? [
          { f: frequencyMilliHz, ch: 0 },
          { f: frequencyMilliHz + beatMilliHz, ch: 1 },
        ]
      : [{ f: frequencyMilliHz, ch: -1 }]
    const merger = new ChannelMergerNode(ctx, { numberOfInputs: 2 })
    merger.connect(gain)
    const oscs = voices.map(({ f, ch }) => {
      const osc = makeOsc(ctx, { waveform, hz: f / 1000, startAt: now, stopAt: now + seconds + 0.05 }, this.precise)
      if (ch < 0) {
        osc.output.connect(merger, 0, 0)
        osc.output.connect(merger, 0, 1)
      } else {
        osc.output.connect(merger, 0, ch)
      }
      return osc
    })
    const fadeIn = Math.min(0.3, seconds / 4)
    const fadeEnd = Math.min(1.5, seconds / 4)
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.6, now + fadeIn)
    gain.gain.setValueAtTime(0.6, now + seconds - fadeEnd)
    gain.gain.setTargetAtTime(0, now + seconds - fadeEnd, fadeEnd / 4) // miękkie zejście
    const timer = setTimeout(() => {
      if (this.previewVoice?.key === key) {
        this.previewVoice = null
        this.previewKey = null
        this.previewInfo = null
        this.emit()
      }
      oscs.forEach((o) => o.disconnect())
      gain.disconnect()
    }, (seconds + 0.3) * 1000)
    this.previewVoice = { oscs, gain, key, timer }
    this.previewKey = key
    this.previewInfo = { label, frequencyMilliHz, beatMilliHz: beatMilliHz ?? null }
    this.emit()
  }

  stopPreview() {
    const pv = this.previewVoice
    if (!pv || !this.ctx) return
    const now = this.ctx.currentTime
    const fade = Math.min(1.5, Math.max(0.08, stopFadeTime()))
    fadeOut(pv.gain.gain, now, fade)
    pv.oscs.forEach((o) => o.stop(now + fade + 0.05))
    clearTimeout(pv.timer)
    setTimeout(() => {
      pv.oscs.forEach((o) => o.disconnect())
      pv.gain.disconnect()
    }, (fade + 0.3) * 1000)
    this.previewVoice = null
    this.previewKey = null
    this.previewInfo = null
    this.emit()
  }
}

export const engine = new AudioEngine()
