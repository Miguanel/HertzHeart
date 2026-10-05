import type { Waveform } from '../model/schema'

/**
 * Generator z fazą liczoną w 64-bitowej precyzji (AudioWorklet).
 *
 * Standardowy OscillatorNode przechowuje częstotliwość jako float32 – przy 432 Hz rozdzielczość to ok. 0,00003 Hz,
 * więc ustawienie 0,0000001 Hz nie miałoby efektu. Tutaj częstotliwość i faza są typu double, a zmiany
 * częstotliwości przechodzą płynnie (rampa w skali logarytmicznej), bez skoków fazy.
 * Kształty prostokąt/piła są wygładzane PolyBLEP (mniej aliasingu i „cyfrowego” trzasku).
 */
const WORKLET_SOURCE = /* js */ `
const TWO_PI = Math.PI * 2
function blep(t, dt) {
  if (t < dt) { t /= dt; return t + t - t * t - 1 }
  if (t > 1 - dt) { t = (t - 1) / dt; return t * t + t + t + 1 }
  return 0
}
class PreciseOscillator extends AudioWorkletProcessor {
  constructor(options) {
    super()
    const o = options.processorOptions || {}
    this.logF = Math.log(o.frequency || 440)
    this.step = 0
    this.left = 0
    this.wave = o.waveform || 'sine'
    this.phase = 0
    this.startAt = o.startAt || 0
    this.stopAt = o.stopAt == null ? Infinity : o.stopAt
    this.port.onmessage = (e) => {
      const m = e.data
      if (m.type === 'frequency') {
        const target = Math.log(m.hz)
        const n = Math.max(1, Math.round((m.glide || 0) * sampleRate))
        this.step = (target - this.logF) / n
        this.left = n
        this.target = target
      } else if (m.type === 'stop') {
        this.stopAt = m.at
      }
    }
  }
  process(_inputs, outputs) {
    const out = outputs[0][0]
    if (!out) return true
    const dtTime = 1 / sampleRate
    let t = currentTime
    if (t >= this.stopAt) return false
    let f = Math.exp(this.logF)
    for (let i = 0; i < out.length; i++, t += dtTime) {
      if (t < this.startAt || t >= this.stopAt) { out[i] = 0; continue }
      if (this.left > 0) {
        this.left--
        this.logF = this.left === 0 ? this.target : this.logF + this.step
        f = Math.exp(this.logF)
      }
      const dt = f / sampleRate
      const p = this.phase
      let v
      switch (this.wave) {
        case 'square': {
          v = p < 0.5 ? 1 : -1
          v += blep(p, dt)
          let q = p + 0.5; if (q >= 1) q -= 1
          v -= blep(q, dt)
          break
        }
        case 'sawtooth':
          v = 2 * p - 1 - blep(p, dt)
          break
        case 'triangle':
          v = p < 0.25 ? 4 * p : p < 0.75 ? 2 - 4 * p : 4 * p - 4
          break
        default:
          v = Math.sin(TWO_PI * p)
      }
      out[i] = v
      let next = p + dt
      if (next >= 1) next -= Math.floor(next)
      this.phase = next
    }
    return true
  }
}
registerProcessor('precise-oscillator', PreciseOscillator)
`

const PROCESSOR = 'precise-oscillator'
const loaded = new WeakMap<BaseAudioContext, Promise<boolean>>()

/** Ładuje generator precyzyjny do kontekstu; `false` = przeglądarka go nie obsługuje (np. strona bez HTTPS). */
export function prepareContext(ctx: BaseAudioContext): Promise<boolean> {
  let p = loaded.get(ctx)
  if (!p) {
    p = (async () => {
      if (!ctx.audioWorklet || typeof AudioWorkletNode === 'undefined') return false
      const url = URL.createObjectURL(new Blob([WORKLET_SOURCE], { type: 'text/javascript' }))
      try {
        await ctx.audioWorklet.addModule(url)
        return true
      } catch {
        return false
      } finally {
        URL.revokeObjectURL(url)
      }
    })()
    loaded.set(ctx, p)
  }
  return p
}

let precise = false
/** Czy ostatnio przygotowany kontekst ma generator 64-bitowy (do wyświetlenia w ustawieniach). */
export const isPreciseOscillator = () => precise

export interface Osc {
  output: AudioNode
  /** Płynna zmiana częstotliwości w czasie `glide` [s]. */
  setFrequency: (hz: number, glide: number) => void
  stop: (at: number) => void
  disconnect: () => void
}

interface OscOptions {
  waveform: Waveform
  hz: number
  startAt: number
  stopAt?: number
}

/** Tworzy generator – precyzyjny (AudioWorklet), a gdy niedostępny – standardowy OscillatorNode. */
export async function createOsc(ctx: BaseAudioContext, opts: OscOptions): Promise<Osc> {
  return makeOsc(ctx, opts, await prepareContext(ctx))
}

/** Wersja synchroniczna – wymaga wcześniejszego `await prepareContext(ctx)`. */
export function makeOsc(ctx: BaseAudioContext, { waveform, hz, startAt, stopAt }: OscOptions, usePrecise: boolean): Osc {
  precise = usePrecise
  if (usePrecise) {
    const node = new AudioWorkletNode(ctx, PROCESSOR, {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [1],
      processorOptions: { frequency: hz, waveform, startAt, stopAt: stopAt ?? null },
    })
    return {
      output: node,
      setFrequency: (f, glide) => node.port.postMessage({ type: 'frequency', hz: f, glide }),
      stop: (at) => node.port.postMessage({ type: 'stop', at }),
      disconnect: () => {
        node.port.close()
        node.disconnect()
      },
    }
  }
  const osc = new OscillatorNode(ctx, { type: waveform, frequency: hz })
  osc.start(startAt)
  if (stopAt !== undefined) osc.stop(stopAt)
  return {
    output: osc,
    setFrequency: (f, glide) => {
      const now = ctx.currentTime
      holdAt(osc.frequency, now)
      if (glide > 0) osc.frequency.exponentialRampToValueAtTime(f, now + glide)
      else osc.frequency.setValueAtTime(f, now)
    },
    stop: (at) => {
      try {
        osc.stop(at)
      } catch {
        /* już zatrzymany */
      }
    },
    disconnect: () => osc.disconnect(),
  }
}

/** Zamraża bieżącą wartość parametru w chwili `t` i usuwa późniejsze zmiany (podstawa płynnych przejść). */
export function holdAt(param: AudioParam, t: number) {
  if (typeof param.cancelAndHoldAtTime === 'function') {
    param.cancelAndHoldAtTime(t)
  } else {
    const v = param.value
    param.cancelScheduledValues(t)
    param.setValueAtTime(v, t)
  }
}
