/**
 * Analiza częstotliwości bujania z czujników ruchu telefonu.
 *
 * Wejście: próbki żyroskopu (prędkość kątowa, °/s) lub – gdy żyroskopu brak – akcelerometru (m/s² z grawitacją),
 * zbierane w nierównych odstępach (zdarzenia `devicemotion`). Kolejne kroki:
 *  1. przepróbkowanie na równą siatkę czasu (interpolacja liniowa),
 *  2. usunięcie trendu liniowego w każdej osi,
 *  3. widmo mocy metodą Welcha (okno Hanna, 50% nakładania) – suma trzech osi, więc wynik nie zależy od tego,
 *     jak telefon jest obrócony,
 *  4. szczyt w zakresie bujania (0,05–3,5 Hz) i osobno w zakresie szybkich drgań (3,5–20 Hz), doprecyzowany
 *     transformatą DTFT całego nagrania (krok 0,0005 Hz + interpolacja paraboliczna),
 *  5. udziały pasm posturograficznych liczone w dziedzinie kąta (moc prędkości / (2πf)²) – tak jak w badaniach,
 *     które analizują przemieszczenie, a nie prędkość.
 */

export type MotionSource = 'gyro' | 'accel'

export interface MotionSample {
  /** Czas [ms] (performance.now / event.timeStamp). */
  t: number
  x: number
  y: number
  z: number
}

export interface SpectrumPeak {
  /** Częstotliwość szczytu [Hz] (doprecyzowana). */
  hz: number
  /** Wyrazistość: moc szczytu / mediana mocy w przeszukiwanym zakresie (szum: ok. 1,5–3). */
  prominence: number
  /** Udział mocy (prędkości) w paśmie ±2 prążki wokół szczytu względem całego zakresu 0,05–20 Hz. */
  share: number
  /** Amplituda prędkości w paśmie szczytu (°/s albo m/s²). */
  amplitude: number
}

export type PeakQuality = 'clear' | 'moderate' | 'weak'

export interface BandShare {
  id: 'low' | 'mid' | 'high'
  label: string
  from: number
  to: number
  /** Udział w mocy przemieszczenia (kąta) w zakresie 0,05–20 Hz, 0–1. */
  share: number
}

export interface SwayAnalysis {
  source: MotionSource
  /** Częstotliwość próbkowania po przepróbkowaniu [Hz]. */
  fs: number
  /** Długość analizowanego nagrania [s]. */
  duration: number
  /** Rozdzielczość widma całego nagrania (1/T) [Hz]. */
  resolution: number
  /** Główny wynik: rytm bujania w zakresie 0,05–3,5 Hz (null, gdy nagranie za krótkie). */
  sway: SpectrumPeak | null
  swayQuality: PeakQuality
  /** Średnia częstotliwość (centroid widma prędkości) w zakresie bujania [Hz]. */
  meanHz: number
  /** Szybkie drgania 3,5–20 Hz (drżenie, mikroruchy). */
  tremor: SpectrumPeak | null
  tremorQuality: PeakQuality
  /** Udział szybkich drgań w całkowitej mocy prędkości (0–1). */
  tremorShare: number
  bands: BandShare[]
  /** Szacowane wychylenie (amplituda kąta) przy szczycie bujania [°] – tylko dla żyroskopu. */
  swayAngleDeg: number | null
  /** RMS prędkości kątowej (°/s) lub przyspieszenia (m/s²) w zakresie 0,05–20 Hz. */
  rms: number
  /** Widmo do wykresu (skala log częstotliwości, ≤ 240 punktów): częstotliwość [Hz] i moc prędkości. */
  spectrum: { hz: number[]; power: number[] }
  /** Najdłuższa przerwa w danych [s] – duża oznacza np. zablokowany ekran w trakcie pomiaru. */
  maxGap: number
}

export const SWAY_RANGE: [number, number] = [0.05, 3.5]
export const TREMOR_RANGE: [number, number] = [3.5, 20]
const ANALYSIS_MAX = 20

/** Pasma posturograficzne (Paillard i Noé 2015: wzrokowo-błędnikowe < 0,5 Hz, móżdżkowe 0,5–2 Hz, proprioceptywne > 2 Hz). */
export const POSTURE_BANDS: Omit<BandShare, 'share'>[] = [
  { id: 'low', label: 'Niskie · wzrok i błędnik', from: 0.05, to: 0.5 },
  { id: 'mid', label: 'Średnie · móżdżek', from: 0.5, to: 2 },
  { id: 'high', label: 'Wysokie · czucie głębokie', from: 2, to: ANALYSIS_MAX },
]

/* ───────────── pomocnicze ───────────── */

function median(values: number[]): number {
  if (!values.length) return 0
  const s = [...values].sort((a, b) => a - b)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/** Przepróbkowanie na równą siatkę [s] (interpolacja liniowa). */
export function resample(samples: MotionSample[], fs: number): { x: Float64Array; y: Float64Array; z: Float64Array; maxGap: number } {
  const t0 = samples[0].t
  const T = (samples[samples.length - 1].t - t0) / 1000
  const n = Math.max(0, Math.floor(T * fs) + 1)
  const x = new Float64Array(n)
  const y = new Float64Array(n)
  const z = new Float64Array(n)
  let j = 0
  let maxGap = 0
  for (let k = 1; k < samples.length; k++) maxGap = Math.max(maxGap, (samples[k].t - samples[k - 1].t) / 1000)
  for (let i = 0; i < n; i++) {
    const t = t0 + (i / fs) * 1000
    while (j < samples.length - 2 && samples[j + 1].t < t) j++
    const a = samples[j]
    const b = samples[Math.min(j + 1, samples.length - 1)]
    const span = b.t - a.t
    const w = span > 0 ? Math.min(1, Math.max(0, (t - a.t) / span)) : 0
    x[i] = a.x + (b.x - a.x) * w
    y[i] = a.y + (b.y - a.y) * w
    z[i] = a.z + (b.z - a.z) * w
  }
  return { x, y, z, maxGap }
}

/** Usuwa trend liniowy (regresja najmniejszych kwadratów), w miejscu. */
export function detrend(v: Float64Array): Float64Array {
  const n = v.length
  if (n < 2) return v
  const mt = (n - 1) / 2
  let mv = 0
  for (let i = 0; i < n; i++) mv += v[i]
  mv /= n
  let num = 0
  let den = 0
  for (let i = 0; i < n; i++) {
    num += (i - mt) * (v[i] - mv)
    den += (i - mt) ** 2
  }
  const slope = den ? num / den : 0
  for (let i = 0; i < n; i++) v[i] -= mv + slope * (i - mt)
  return v
}

/** FFT radix-2 w miejscu (re, im o długości potęgi 2). */
export function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) {
      ;[re[i], re[j]] = [re[j], re[i]]
      ;[im[i], im[j]] = [im[j], im[i]]
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len
    const wr = Math.cos(ang)
    const wi = Math.sin(ang)
    for (let i = 0; i < n; i += len) {
      let cr = 1
      let ci = 0
      for (let k = 0; k < len / 2; k++) {
        const a = i + k
        const b = a + len / 2
        const tr = re[b] * cr - im[b] * ci
        const ti = re[b] * ci + im[b] * cr
        re[b] = re[a] - tr
        im[b] = im[a] - ti
        re[a] += tr
        im[a] += ti
        const nr = cr * wr - ci * wi
        ci = cr * wi + ci * wr
        cr = nr
      }
    }
  }
}

const nextPow2 = (n: number) => 2 ** Math.ceil(Math.log2(Math.max(2, n)))

function hann(n: number): Float64Array {
  const w = new Float64Array(n)
  for (let i = 0; i < n; i++) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1 || 1))
  return w
}

/**
 * Jednostronna gęstość widmowa mocy metodą Welcha (okno Hanna, 50% nakładania, uzupełnienie zerami do 2× potęgi 2).
 * Zwraca częstotliwości prążków i moc [jednostka²/Hz].
 */
export function welch(signal: Float64Array, fs: number, segment: number): { hz: Float64Array; psd: Float64Array; df: number } {
  const seg = Math.max(8, Math.min(signal.length, segment))
  const nfft = nextPow2(seg) * 2
  const win = hann(seg)
  let u = 0
  for (let i = 0; i < seg; i++) u += win[i] * win[i]
  const step = Math.max(1, Math.floor(seg / 2))
  const bins = nfft / 2 + 1
  const psd = new Float64Array(bins)
  let count = 0
  for (let start = 0; start + seg <= signal.length; start += step) {
    const re = new Float64Array(nfft)
    const im = new Float64Array(nfft)
    let mean = 0
    for (let i = 0; i < seg; i++) mean += signal[start + i]
    mean /= seg
    for (let i = 0; i < seg; i++) re[i] = (signal[start + i] - mean) * win[i]
    fft(re, im)
    for (let k = 0; k < bins; k++) psd[k] += re[k] * re[k] + im[k] * im[k]
    count++
  }
  const scale = 1 / (fs * u * Math.max(1, count))
  for (let k = 0; k < bins; k++) psd[k] *= scale * (k === 0 || k === bins - 1 ? 1 : 2)
  const df = fs / nfft
  const hz = new Float64Array(bins)
  for (let k = 0; k < bins; k++) hz[k] = k * df
  return { hz, psd, df }
}

/** Moc DTFT sygnału okienkowanego przy dowolnej częstotliwości (do doprecyzowania szczytu). */
function dtftPower(signals: Float64Array[], win: Float64Array, fs: number, f: number): number {
  const w = (2 * Math.PI * f) / fs
  const c = Math.cos(w)
  const s = Math.sin(w)
  let total = 0
  for (const v of signals) {
    // rekurencja obrotu fazora zamiast cos/sin dla każdej próbki
    let pr = 1
    let pi = 0
    let re = 0
    let im = 0
    for (let i = 0; i < v.length; i++) {
      const a = v[i] * win[i]
      re += a * pr
      im -= a * pi
      const nr = pr * c - pi * s
      pi = pr * s + pi * c
      pr = nr
    }
    total += re * re + im * im
  }
  return total
}

function refinePeak(signals: Float64Array[], win: Float64Array, fs: number, coarse: number, halfWidth: number): number {
  const step = 0.0005
  const lo = Math.max(step, coarse - halfWidth)
  const hi = coarse + halfWidth
  let best = coarse
  let bestP = -1
  const grid: { f: number; p: number }[] = []
  for (let f = lo; f <= hi + 1e-12; f += step) {
    const p = dtftPower(signals, win, fs, f)
    grid.push({ f, p })
    if (p > bestP) {
      bestP = p
      best = f
    }
  }
  const i = grid.findIndex((g) => g.f === best)
  if (i > 0 && i < grid.length - 1) {
    const [a, b, c] = [grid[i - 1].p, grid[i].p, grid[i + 1].p]
    const d = a - 2 * b + c
    if (d < 0) best += (0.5 * (a - c) * step) / d
  }
  return best
}

function findPeak(
  hz: Float64Array,
  psd: Float64Array,
  df: number,
  range: [number, number],
  totalPower: number,
): { k: number; prominence: number; share: number; bandPower: number } | null {
  let best = -1
  let bestP = -1
  const inRange: number[] = []
  for (let k = 1; k < hz.length - 1; k++) {
    if (hz[k] < range[0] || hz[k] > range[1]) continue
    inRange.push(psd[k])
    // tylko maksima lokalne – brzeg zakresu (np. dryf przy 0,05 Hz) nie jest rytmem
    if (psd[k] >= psd[k - 1] && psd[k] >= psd[k + 1] && psd[k] > bestP) {
      bestP = psd[k]
      best = k
    }
  }
  if (best < 0 || inRange.length < 3) return null
  let bandPower = 0
  for (let k = Math.max(0, best - 2); k <= Math.min(hz.length - 1, best + 2); k++) bandPower += psd[k] * df
  const med = median(inRange)
  return { k: best, prominence: med > 0 ? bestP / med : Infinity, share: totalPower > 0 ? bandPower / totalPower : 0, bandPower }
}

/**
 * Najmniejsza amplituda uznawana za ruch, a nie szum czujnika: żyroskop telefonu szumi na poziomie setnych °/s,
 * akcelerometr – tysięcznych m/s². Słabszy „szczyt” to szum, nawet jeśli wystaje ponad tło widma.
 */
export const MIN_AMPLITUDE: Record<MotionSource, number> = { gyro: 0.2, accel: 0.03 }

const quality = (p: SpectrumPeak | null, source: MotionSource): PeakQuality =>
  !p || p.amplitude < MIN_AMPLITUDE[source] ? 'weak' : p.prominence >= 10 ? 'clear' : p.prominence >= 4 ? 'moderate' : 'weak'

/** Szacuje częstotliwość próbkowania z mediany odstępów między zdarzeniami (zaokrąglone, 20–100 Hz). */
export function estimateRate(samples: MotionSample[]): number {
  const dts: number[] = []
  for (let k = 1; k < samples.length; k++) {
    const d = samples[k].t - samples[k - 1].t
    if (d > 0) dts.push(d)
  }
  const dt = median(dts)
  if (!dt) return 50
  return Math.min(100, Math.max(20, Math.round(1000 / dt)))
}

/** Minimalna liczba sekund nagrania potrzebna do analizy. */
export const MIN_ANALYSIS_S = 6

export function analyzeSway(samples: MotionSample[], source: MotionSource): SwayAnalysis | null {
  if (samples.length < 20) return null
  const duration = (samples[samples.length - 1].t - samples[0].t) / 1000
  if (duration < MIN_ANALYSIS_S) return null
  const fs = estimateRate(samples)
  const r = resample(samples, fs)
  const axes = [detrend(r.x), detrend(r.y), detrend(r.z)]
  const n = axes[0].length
  const fMax = Math.min(ANALYSIS_MAX, fs / 2 - 1)

  // segment Welcha: do 20 s (rozdzielczość ≥ 0,025 Hz po uzupełnieniu zerami), ale co najmniej 2 segmenty przy dłuższych nagraniach
  const segment = Math.min(n, Math.round(fs * Math.min(20, Math.max(8, duration / 1.5))))
  let hz: Float64Array | null = null
  let psd: Float64Array | null = null
  let df = 0
  for (const a of axes) {
    const w = welch(a, fs, segment)
    if (!psd) {
      psd = w.psd
      hz = w.hz
      df = w.df
    } else for (let k = 0; k < psd.length; k++) psd[k] += w.psd[k]
  }
  if (!psd || !hz) return null

  const fMin = Math.max(SWAY_RANGE[0], 2 / duration) // co najmniej dwa pełne cykle w nagraniu
  let total = 0
  for (let k = 0; k < hz.length; k++) if (hz[k] >= fMin && hz[k] <= fMax) total += psd[k] * df

  const win = hann(n)
  const toPeak = (range: [number, number]): SpectrumPeak | null => {
    const p = findPeak(hz!, psd!, df, [Math.max(range[0], fMin), Math.min(range[1], fMax)], total)
    if (!p) return null
    const refined = refinePeak(axes, win, fs, hz![p.k], Math.max(df * 1.5, 1.5 / (segment / fs)))
    return { hz: refined, prominence: p.prominence, share: p.share, amplitude: Math.sqrt(2 * p.bandPower) }
  }

  const sway = toPeak(SWAY_RANGE)
  const tremor = fMax > TREMOR_RANGE[0] + 1 ? toPeak(TREMOR_RANGE) : null

  let swayP = 0
  let swayW = 0
  let tremorP = 0
  for (let k = 0; k < hz.length; k++) {
    if (hz[k] < fMin || hz[k] > fMax) continue
    if (hz[k] <= SWAY_RANGE[1]) {
      swayP += psd[k]
      swayW += psd[k] * hz[k]
    } else tremorP += psd[k] * df
  }

  // udziały pasm w dziedzinie kąta (przemieszczenia): moc prędkości / (2πf)²
  const disp = POSTURE_BANDS.map(() => 0)
  let dispTotal = 0
  for (let k = 0; k < hz.length; k++) {
    if (hz[k] < fMin || hz[k] > fMax) continue
    const p = (psd[k] * df) / (2 * Math.PI * hz[k]) ** 2
    dispTotal += p
    const b = POSTURE_BANDS.findIndex((band) => hz![k] >= band.from && hz![k] < band.to)
    if (b >= 0) disp[b] += p
  }
  const bands = POSTURE_BANDS.map((b, i) => ({ ...b, share: dispTotal > 0 ? disp[i] / dispTotal : 0 }))

  // widmo do wykresu: przedziały logarytmiczne 0,05–20 Hz (maksimum w przedziale, żeby nie zgubić wąskiego szczytu)
  const spectrum = { hz: [] as number[], power: [] as number[] }
  const points = 240
  const lo = Math.log(SWAY_RANGE[0])
  const hi = Math.log(Math.max(fMax, 4))
  for (let i = 0; i < points; i++) {
    const a = Math.exp(lo + ((hi - lo) * i) / points)
    const b = Math.exp(lo + ((hi - lo) * (i + 1)) / points)
    let best = -1
    let bestHz = Math.sqrt(a * b)
    for (let k = 0; k < hz.length; k++) {
      if (hz[k] < a || hz[k] >= b) continue
      if (psd[k] > best) {
        best = psd[k]
        bestHz = hz[k]
      }
    }
    if (best < 0) {
      // przedział węższy niż prążek – interpolacja
      const k = Math.min(hz.length - 2, Math.floor(bestHz / df))
      const w = bestHz / df - k
      best = psd[k] * (1 - w) + psd[k + 1] * w
    }
    if (spectrum.hz.length && Math.abs(spectrum.hz[spectrum.hz.length - 1] - bestHz) < 1e-9) continue
    spectrum.hz.push(bestHz)
    spectrum.power.push(best)
  }

  const swayAngleDeg = source === 'gyro' && sway ? sway.amplitude / (2 * Math.PI * sway.hz) : null

  return {
    source,
    fs,
    duration,
    resolution: 1 / duration,
    sway,
    swayQuality: quality(sway, source),
    meanHz: swayP > 0 ? swayW / swayP : 0,
    tremor,
    tremorQuality: quality(tremor, source),
    tremorShare: total > 0 ? tremorP / total : 0,
    bands,
    swayAngleDeg,
    rms: Math.sqrt(total),
    spectrum,
    maxGap: r.maxGap,
  }
}

/** Sygnał testowy / pokazowy: kołysanie + drżenie fizjologiczne + szum, z nierównym próbkowaniem jak w przeglądarce. */
export function syntheticSamples(opts: {
  seconds: number
  swayHz: number
  swayDegS?: number
  tremorHz?: number
  tremorDegS?: number
  noise?: number
  rate?: number
  seed?: number
}): MotionSample[] {
  const { seconds, swayHz, swayDegS = 25, tremorHz = 9.2, tremorDegS = 1.5, noise = 0.6, rate = 60 } = opts
  let seed = opts.seed ?? 7
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
  const out: MotionSample[] = []
  let t = 0
  const phase = rnd() * Math.PI * 2
  while (t <= seconds * 1000) {
    const s = t / 1000
    const sway = swayDegS * Math.sin(2 * Math.PI * swayHz * s + phase)
    const trem = tremorDegS * Math.sin(2 * Math.PI * tremorHz * s)
    out.push({
      t,
      x: 0.8 * sway + trem + (rnd() - 0.5) * noise,
      y: 0.35 * sway + 0.6 * trem + (rnd() - 0.5) * noise,
      z: 0.15 * sway + (rnd() - 0.5) * noise,
    })
    t += (1000 / rate) * (0.85 + rnd() * 0.3)
  }
  return out
}
