import { valueAt } from '../model/envelope'
import type { Composition, Curve, Track } from '../model/schema'
import { holdAt, makeOsc, prepareContext, type Osc } from './osc'

/** Krawędzie segmentów: łagodne wejście/wyjście – eliminuje trzaski na początku i końcu segmentu. */
export const FADE = 0.015
/** Mikro-rampa dla skoków typu „hold” w diagramie (zamiast natychmiastowego skoku). */
const HOLD_RAMP = 0.01

export interface GainPoint {
  /** Czas w kompozycji [s]. */
  t: number
  v: number
  curve: Curve
}

const isActive = (track: Track) => !track.muted && track.volume > 0 && track.clips.length > 0

/**
 * Obwiednia całej ścieżki w czasie kompozycji: segmenty z łagodnymi krawędziami, cisza pomiędzy.
 * Segmenty stykające się ze sobą są łączone bez przerwy (generator gra ciągle, więc nie ma przeskoku fazy).
 */
export function trackGainPoints(track: Track): GainPoint[] {
  if (!isActive(track)) return []
  const clips = [...track.clips].sort((a, b) => a.start - b.start)
  const out: GainPoint[] = []
  const push = (p: GainPoint) => {
    const last = out[out.length - 1]
    if (last && p.t <= last.t + 1e-9) {
      if (p.t < last.t - 1e-9) return
      out[out.length - 1] = { ...p, curve: last.curve === 'hold' ? 'hold' : p.curve }
      return
    }
    out.push(p)
  }

  clips.forEach((clip, i) => {
    const start = clip.start
    const end = clip.start + clip.duration
    const edge = Math.min(FADE, clip.duration / 4)
    const prev = clips[i - 1]
    const next = clips[i + 1]
    const joinedPrev = !!prev && start - (prev.start + prev.duration) < 1e-6
    const joinedNext = !!next && next.start - end < 1e-6
    const env = clip.envelope.map((p) => ({ t: start + p.t, v: p.v * track.volume, curve: p.curve }))

    if (joinedPrev) {
      // połączenie z poprzednim segmentem: krótka rampa do pierwszej wartości zamiast skoku
      push({ t: start + edge, v: env[0].v, curve: 'linear' })
    } else {
      push({ t: start, v: 0, curve: 'linear' })
      push({ t: start + edge, v: valueAt(env, start + edge), curve: 'linear' })
    }
    for (const p of env) {
      if (p.t <= start + edge) continue
      if (!joinedNext && p.t >= end - edge) continue
      push(p)
    }
    if (joinedNext) {
      push({ t: end, v: env[env.length - 1].v, curve: 'linear' })
    } else {
      push({ t: end - edge, v: valueAt(env, end - edge), curve: 'linear' })
      push({ t: end, v: 0, curve: 'linear' })
    }
  })
  return out
}

/**
 * Planuje głośność od chwili `startTime` (czas kontekstu) – najpierw płynne przejście (bufor) od bieżącej
 * wartości do docelowej obwiedni w czasie `glide`, potem dokładnie według obwiedni.
 *
 * @param fromPos pozycja kompozycji [s] odpowiadająca `startTime`
 * @param startValue wartość początkowa; `null` = zamroź bieżącą wartość parametru (edycja na żywo)
 */
export function scheduleGain(param: AudioParam, pts: GainPoint[], fromPos: number, startTime: number, startValue: number | null, glide: number) {
  const ctxTime = (pos: number) => startTime + (pos - fromPos)
  if (startValue === null) {
    holdAt(param, startTime)
  } else {
    param.cancelScheduledValues(startTime)
    param.setValueAtTime(startValue, startTime)
  }
  const glideEnd = startTime + Math.max(glide, 0.005)
  const target = pts.length ? valueAt(pts, fromPos + (glideEnd - startTime)) : 0
  param.linearRampToValueAtTime(target, glideEnd)
  let last = glideEnd
  let prev = target
  for (const p of pts) {
    const time = ctxTime(p.t)
    if (time <= last) continue
    if (p.curve === 'hold') param.setValueAtTime(prev, Math.max(last, time - HOLD_RAMP))
    param.linearRampToValueAtTime(p.v, time)
    last = time
    prev = p.v
  }
  if (prev !== 0) param.linearRampToValueAtTime(0, last + FADE)
}

/** Balans L/P bez spadku poziomu w środku: -1 = tylko lewy, 0 = oba po 100%, 1 = tylko prawy. */
export const panGains = (pan: number): [number, number] => [pan > 0 ? 1 - pan : 1, pan < 0 ? 1 + pan : 1]

/** Jedna ścieżka = jeden ciągły generator + obwiednia + balans L/P. */
export interface TrackVoice {
  osc: Osc
  env: GainNode
  left: GainNode
  right: GainNode
  out: AudioNode
  waveform: Track['waveform']
  hz: number
  pan: number
}

export function createTrackVoice(ctx: BaseAudioContext, track: Track, dest: AudioNode, startAt: number, precise: boolean, stopAt?: number): TrackVoice {
  const hz = track.frequencyMilliHz / 1000
  const pan = track.pan ?? 0
  const osc = makeOsc(ctx, { waveform: track.waveform, hz, startAt, stopAt }, precise)
  const env = new GainNode(ctx, { gain: 0 })
  const [gl, gr] = panGains(pan)
  const left = new GainNode(ctx, { gain: gl })
  const right = new GainNode(ctx, { gain: gr })
  const merger = new ChannelMergerNode(ctx, { numberOfInputs: 2 })
  osc.output.connect(env)
  env.connect(left).connect(merger, 0, 0)
  env.connect(right).connect(merger, 0, 1)
  merger.connect(dest)
  return { osc, env, left, right, out: merger, waveform: track.waveform, hz, pan }
}

/** Płynnie zmienia kanał stereo istniejącego głosu. */
export function glidePan(ctx: BaseAudioContext, voice: TrackVoice, pan: number, glide: number) {
  if (voice.pan === pan) return
  const now = ctx.currentTime
  const [gl, gr] = panGains(pan)
  for (const [node, v] of [[voice.left, gl], [voice.right, gr]] as const) {
    holdAt(node.gain, now)
    node.gain.linearRampToValueAtTime(v, now + Math.max(glide, 0.005))
  }
  voice.pan = pan
}

/** Wycisza i zwalnia głos po czasie `fade`. */
export function releaseTrackVoice(ctx: BaseAudioContext, voice: TrackVoice, fade: number) {
  const now = ctx.currentTime
  holdAt(voice.env.gain, now)
  voice.env.gain.linearRampToValueAtTime(0, now + Math.max(fade, 0.005))
  voice.osc.stop(now + fade + 0.05)
  setTimeout(() => {
    voice.osc.disconnect()
    voice.out.disconnect()
  }, (fade + 0.2) * 1000)
}

/**
 * Renderuje całą kompozycję w kontekście offline (eksport WAV). Ten sam model obwiedni co odtwarzanie na żywo.
 */
export async function scheduleOffline(ctx: BaseAudioContext, out: AudioNode, comp: Composition, duration: number) {
  const precise = await prepareContext(ctx)
  for (const track of comp.tracks) {
    const pts = trackGainPoints(track)
    if (!pts.length) continue
    const voice = createTrackVoice(ctx, track, out, 0, precise, duration + 0.05)
    scheduleGain(voice.env.gain, pts, 0, 0, 0, FADE)
  }
}

/**
 * Szyna master: głośność → filtr DC (usuwa stałą składową, która „stuka” w membranę) → bezpiecznik
 * (płynne wyciszenie/przywrócenie przy problemach urządzenia) → limiter (chroni przed przesterowaniem).
 */
export function createMasterChain(ctx: BaseAudioContext, volume: number): { input: GainNode; guard: GainNode; output: AudioNode } {
  const input = new GainNode(ctx, { gain: volume })
  const dcBlock = new BiquadFilterNode(ctx, { type: 'highpass', frequency: 0.5, Q: 0.5 })
  const guard = new GainNode(ctx, { gain: 1 })
  const limiter = new DynamicsCompressorNode(ctx, { threshold: -3, knee: 0, ratio: 20, attack: 0.003, release: 0.25 })
  input.connect(dcBlock).connect(guard).connect(limiter)
  return { input, guard, output: limiter }
}
