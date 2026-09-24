import { valueAt } from '../model/envelope'
import type { Composition } from '../model/schema'

/** Czas łagodnego wejścia/wyjścia – eliminuje trzaski przy starcie, seeku i końcu segmentu. */
export const FADE = 0.015

/**
 * Planuje całą kompozycję w kontekście audio. Ten sam kod służy do odtwarzania
 * (AudioContext) i eksportu do WAV (OfflineAudioContext).
 *
 * @param from pozycja w kompozycji [s], od której gramy
 * @param t0   czas kontekstu, w którym ma zabrzmieć pozycja `from`
 */
export function scheduleComposition(
  ctx: BaseAudioContext,
  out: AudioNode,
  comp: Composition,
  from: number,
  t0: number,
): OscillatorNode[] {
  const at = (x: number) => t0 + (x - from)
  const oscillators: OscillatorNode[] = []

  for (const track of comp.tracks) {
    if (track.muted || track.volume <= 0) continue

    for (const clip of track.clips) {
      const clipEnd = clip.start + clip.duration
      const begin = Math.max(from, clip.start)
      if (begin >= clipEnd) continue

      // Punkty w czasie kompozycji, przemnożone przez głośność ścieżki.
      const pts = clip.envelope.map((p) => ({ t: clip.start + p.t, v: p.v * track.volume, curve: p.curve }))
      const v0 = valueAt(pts, begin)

      const osc = new OscillatorNode(ctx, { type: track.waveform, frequency: track.frequencyMilliHz / 1000 })
      const gain = new GainNode(ctx, { gain: 0 })
      osc.connect(gain).connect(out)

      const g = gain.gain
      g.setValueAtTime(0, at(begin)) // kotwica
      g.linearRampToValueAtTime(v0, at(begin) + FADE)
      let lastTime = at(begin) + FADE
      let prev = v0

      for (const p of pts) {
        const time = at(p.t)
        if (time <= lastTime) continue
        if (p.curve === 'hold') {
          // skok wartości, ale z mikro-rampą zamiast trzasku
          const holdStart = Math.max(lastTime, time - 0.005)
          g.setValueAtTime(prev, holdStart)
        }
        g.linearRampToValueAtTime(p.v, time)
        lastTime = time
        prev = p.v
      }

      const end = Math.max(at(clipEnd), lastTime)
      g.setValueAtTime(prev, end)
      g.linearRampToValueAtTime(0, end + FADE)
      osc.start(at(begin))
      osc.stop(end + FADE * 2)
      oscillators.push(osc)
    }
  }
  return oscillators
}

/** Szyna master: głośność → limiter (chroni przed przesterowaniem przy wielu ścieżkach). */
export function createMasterChain(ctx: BaseAudioContext, volume: number): { input: GainNode; output: AudioNode } {
  const input = new GainNode(ctx, { gain: volume })
  const limiter = new DynamicsCompressorNode(ctx, { threshold: -3, knee: 0, ratio: 20, attack: 0.003, release: 0.25 })
  input.connect(limiter)
  return { input, output: limiter }
}
