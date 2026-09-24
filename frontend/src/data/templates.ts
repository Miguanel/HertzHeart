import { createClip, createTrack, newId, type PresetId, type PresetOptions } from '../model/envelope'
import type { Composition, Track } from '../model/schema'

/** Zestaw z biblioteki „Zestawy”: opis + funkcja budująca świeży projekt. */
export interface PresetEntry {
  id: string
  name: string
  category: string
  description: string
  info: string
  headphones: boolean
  /** Czas trwania w sekundach (do wyświetlenia). */
  duration: number
  build: () => Composition
}

const MIN = 60
const hz = (value: number) => Math.round(value * 1000)
const et = (base: number, semitones: number) => base * 2 ** (semitones / 12)
/** 207.83 -> "207,83" (bez artefaktów float, np. 207.82999…). */
const fmt = (value: number) => String(Math.round(value * 1000) / 1000).replace('.', ',')

interface Seg {
  start: number
  duration: number
  preset?: PresetId
  opts?: Partial<PresetOptions>
}

function track(name: string, frequency: number, segs: Seg[], pan = 0, volume = 0.8): Track {
  return createTrack(name, hz(frequency), {
    pan,
    volume,
    clips: segs.map((s) => createClip(s.start, s.duration, s.preset ?? 'fadeInOut', s.opts)),
  })
}

function composition(title: string, tracks: Track[], masterVolume = 0.5): Composition {
  const now = new Date().toISOString()
  return { schemaVersion: 1, id: newId(), title, createdAt: now, updatedAt: now, masterVolume, tracks }
}

/** Para binauralna na całą długość sesji. */
function binaural(title: string, carrier: number, beat: number, minutes: number, fadeIn = 30, fadeOut = 60): Composition {
  const d = minutes * MIN
  const seg = (): Seg[] => [{ start: 0, duration: d, preset: 'constant', opts: { level: 0.7 } }]
  const tracks = [track(`Nośna ${fmt(carrier)} Hz · L`, carrier, seg(), -1), track(`${fmt(carrier + beat)} Hz · P`, carrier + beat, seg(), 1)]
  // miękkie wejście i wyjście
  for (const t of tracks) {
    const c = t.clips[0]
    c.envelope = [
      { id: newId(), t: 0, v: 0, curve: 'linear' },
      { id: newId(), t: fadeIn, v: 0.7, curve: 'linear' },
      { id: newId(), t: d - fadeOut, v: 0.7, curve: 'linear' },
      { id: newId(), t: d, v: 0, curve: 'linear' },
    ]
  }
  return composition(title, tracks)
}

const BINAURAL_HOWTO =
  '## Jak słuchać\nZałóż słuchawki stereo (lewa słuchawka na lewe ucho), ustaw cichą, komfortową głośność i usiądź lub połóż się wygodnie. Na głośnikach efekt dudnienia binauralnego nie powstaje.\n\n' +
  '## Bezpieczeństwo\nNie słuchaj podczas prowadzenia pojazdu ani pracy wymagającej czujności. Osoby z padaczką lub zaburzeniami rytmu serca powinny skonsultować się z lekarzem. To nie jest metoda leczenia; działanie dudnień binauralnych jest przedmiotem badań, a wyniki są niejednoznaczne.'

const brain = (
  id: string,
  name: string,
  description: string,
  about: string,
  carrier: number,
  beat: number,
  minutes: number,
): PresetEntry => ({
  id,
  name,
  category: 'Fale mózgowe',
  description,
  info: `## O zestawie\n${about}\n\nLewy kanał: ${fmt(carrier)} Hz, prawy: ${fmt(carrier + beat)} Hz – różnica ${fmt(beat)} Hz.\n\n${BINAURAL_HOWTO}`,
  headphones: true,
  duration: minutes * MIN,
  build: () => binaural(name, carrier, beat, minutes),
})

export const BUILTIN_PRESETS: PresetEntry[] = [
  brain('b-delta', 'Delta · głęboki odpoczynek', 'Dudnienie 2,5 Hz · 30 min', 'Pasmo delta (0,5–4 Hz) dominuje w głębokim śnie. Sesja przeznaczona do wyciszenia przed snem.', 150, 2.5, 30),
  brain('b-theta', 'Theta · medytacja', 'Dudnienie 6 Hz · 20 min', 'Pasmo theta (4–8 Hz) towarzyszy senności i głębokiej medytacji.', 200, 6, 20),
  brain('b-alpha', 'Alfa · spokojne skupienie', 'Dudnienie 10 Hz · 15 min', 'Pasmo alfa (8–13 Hz) to rytm zrelaksowanego czuwania, np. przy zamkniętych oczach.', 220, 10, 15),
  brain('b-beta', 'Beta · koncentracja', 'Dudnienie 15 Hz · 20 min', 'Pasmo beta (13–30 Hz) wiąże się z aktywnym myśleniem i czujnością.', 250, 15, 20),
  brain('b-gamma', 'Gamma 40 Hz', 'Dudnienie 40 Hz · 10 min', 'Rytm 40 Hz jest badany eksperymentalnie w kontekście uwagi i pamięci; wyniki u ludzi są wstępne.', 300, 40, 10),
  brain('b-schumann', 'Rezonans Schumanna 7,83 Hz', 'Dudnienie 7,83 Hz · 20 min', 'Dudnienie równe rezonansowi Schumanna (wnęka Ziemia–jonosfera), na granicy pasm theta i alfa.', 200, 7.83, 20),
  {
    id: 'b-descent',
    name: 'Zejście: alfa → theta → delta',
    category: 'Fale mózgowe',
    description: 'Płynne przejście 10 → 6 → 2,5 Hz · 30 min',
    info:
      '## O zestawie\nTon nośny 200 Hz gra w lewym kanale przez całą sesję. W prawym kanale co 10 minut zmienia się ton (210 → 206 → 202,5 Hz), więc dudnienie przechodzi z alfy (10 Hz) przez thetę (6 Hz) do delty (2,5 Hz). Kolejne etapy nakładają się przez minutę, dzięki czemu zmiana jest płynna.\n\n' +
      'To dobry przykład projektu z wieloma segmentami czasowymi – otwórz go i zobacz, jak zbudowane są przejścia.\n\n' +
      BINAURAL_HOWTO,
    headphones: true,
    duration: 30 * MIN,
    build: () =>
      composition('Zejście: alfa → theta → delta', [
        track('Nośna 200 Hz · L', 200, [{ start: 0, duration: 30 * MIN, opts: { level: 0.7, fade: 30 } }], -1),
        track('Alfa 210 Hz · P', 210, [{ start: 0, duration: 10.5 * MIN, opts: { level: 0.7, fade: 30 } }], 1),
        track('Theta 206 Hz · P', 206, [{ start: 9.5 * MIN, duration: 11 * MIN, opts: { level: 0.7, fade: 60 } }], 1),
        track('Delta 202,5 Hz · P', 202.5, [{ start: 19.5 * MIN, duration: 10.5 * MIN, opts: { level: 0.7, fade: 60 } }], 1),
      ]),
  },
  {
    id: 's-solfeggio',
    name: 'Solfeggio · pełna skala',
    category: 'Dźwięk',
    description: '9 tonów po 2 min z płynnymi przejściami · 16,5 min',
    info:
      '## O zestawie\nKolejne tony skali Solfeggio (174 → 963 Hz), każdy przez 2 minuty. Sąsiednie tony nakładają się przez 10 s (płynne przejście), każdy leży na własnej ścieżce.\n\n' +
      '## Uwaga\nDeklarowane właściwości poszczególnych tonów nie są potwierdzone badaniami – szczegóły w bibliotece częstotliwości (przycisk „i”). Działa na głośnikach.',
    headphones: false,
    duration: 9 * 110 + 10,
    build: () => {
      const tones = [174, 285, 396, 417, 528, 639, 741, 852, 963]
      const tracks = tones.map((f, i) =>
        track(`Solfeggio ${f}`, f, [{ start: i * 110, duration: 120, opts: { level: 0.75, fade: 10 } }]),
      )
      return composition('Solfeggio · pełna skala', tracks)
    },
  },
  {
    id: 's-om',
    name: 'OM 136,1 Hz · bordun',
    category: 'Dźwięk',
    description: 'Ton „Ziemia – rok” z kwintą · 15 min',
    info:
      '## O zestawie\nBordun (ciągły ton) 136,1 Hz – według H. Cousto odpowiada okresowi obiegu Ziemi wokół Słońca, popularny w jodze jako „OM”. Po minucie dochodzi ciszej kwinta czysta (204,15 Hz), która wzbogaca brzmienie.\n\n' +
      '## Uwaga\nWartość ma charakter symboliczny; brak badań potwierdzających szczególny wpływ tego tonu. Działa na głośnikach.',
    headphones: false,
    duration: 15 * MIN,
    build: () =>
      composition('OM 136,1 Hz · bordun', [
        track('OM 136,1 Hz', 136.1, [{ start: 0, duration: 15 * MIN, opts: { level: 0.8, fade: 20 } }]),
        track('Kwinta 204,15 Hz', 204.15, [{ start: 60, duration: 13 * MIN, opts: { level: 0.4, fade: 45 } }], 0, 0.7),
      ]),
  },
  {
    id: 's-a432-chord',
    name: 'Akord A-dur (A4 = 432 Hz)',
    category: 'Dźwięk',
    description: 'Składniki akordu wchodzą kolejno · 10 min',
    info:
      '## O zestawie\nAkord A-dur w stroju równomiernie temperowanym, liczony od A4 = 432 Hz: A (432), Cis (' +
      (Math.round(et(432, 4) * 1000) / 1000).toString().replace('.', ',') +
      ' Hz) i E (' +
      (Math.round(et(432, 7) * 1000) / 1000).toString().replace('.', ',') +
      ' Hz). Składniki wchodzą co 30 s i razem wybrzmiewają do końca. Pokazuje dokładność 0,001 Hz przy wartościach niecałkowitych.\n\n## Uwaga\nDziała na głośnikach.',
    headphones: false,
    duration: 10 * MIN,
    build: () =>
      composition('Akord A-dur (A4 = 432 Hz)', [
        track('A 432 Hz', 432, [{ start: 0, duration: 10 * MIN, opts: { level: 0.6, fade: 15 } }]),
        track('Cis', Math.round(et(432, 4) * 1000) / 1000, [{ start: 30, duration: 9.5 * MIN, opts: { level: 0.5, fade: 15 } }]),
        track('E', Math.round(et(432, 7) * 1000) / 1000, [{ start: 60, duration: 9 * MIN, opts: { level: 0.5, fade: 15 } }]),
      ]),
  },
  {
    id: 's-pulse-528',
    name: 'Pulsujący 528 Hz',
    category: 'Dźwięk',
    description: 'Łagodne pulsowanie co 10 s · 10 min',
    info:
      '## O zestawie\nTon 528 Hz z powolnym, oddechowym narastaniem i opadaniem głośności (cykl 10 s ≈ 6 oddechów na minutę). Przykład użycia szablonu „Pulsowanie”.\n\n' +
      '## Uwaga\nRytm można wykorzystać jako tempo spokojnego oddechu. Deklarowane właściwości samego tonu 528 Hz nie są potwierdzone badaniami. Działa na głośnikach.',
    headphones: false,
    duration: 10 * MIN,
    build: () =>
      composition('Pulsujący 528 Hz', [
        track('528 Hz', 528, [{ start: 0, duration: 10 * MIN, preset: 'pulse', opts: { level: 0.8, pulses: 60 } }]),
      ]),
  },
]
