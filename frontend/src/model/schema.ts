import { z } from 'zod'

export const WAVEFORMS = ['sine', 'triangle', 'square', 'sawtooth'] as const
export const CURVES = ['linear', 'hold'] as const

/** 1.000 Hz – 20 000.000 Hz, przechowywane jako liczba całkowita mHz. */
export const MIN_FREQ_MHZ = 1_000
export const MAX_FREQ_MHZ = 20_000_000
/** Maksymalna długość kompozycji: 12 h. */
export const MAX_TIME_S = 12 * 3600
export const MIN_CLIP_S = 0.5

const id = z.string().min(1).max(64)

export const EnvelopePointSchema = z.object({
  id,
  /** Sekundy względem początku segmentu. */
  t: z.number().min(0).max(MAX_TIME_S),
  /** Głośność 0–1. */
  v: z.number().min(0).max(1),
  /** Kształt odcinka dochodzącego do tego punktu. */
  curve: z.enum(CURVES),
})

export const ClipSchema = z.object({
  id,
  start: z.number().min(0).max(MAX_TIME_S),
  duration: z.number().min(MIN_CLIP_S).max(MAX_TIME_S),
  envelope: z.array(EnvelopePointSchema).min(2).max(512),
})

export const TrackSchema = z.object({
  id,
  name: z.string().max(120),
  frequencyMilliHz: z.number().int().min(MIN_FREQ_MHZ).max(MAX_FREQ_MHZ),
  libraryRef: z.string().max(64).optional(),
  waveform: z.enum(WAVEFORMS),
  volume: z.number().min(0).max(1),
  /** Kanał stereo: -1 = lewy, 0 = oba, 1 = prawy. Starsze projekty nie mają tego pola. */
  pan: z.number().min(-1).max(1).default(0),
  muted: z.boolean(),
  clips: z.array(ClipSchema).max(256),
})

export const CompositionSchema = z.object({
  schemaVersion: z.literal(1),
  id,
  title: z.string().max(200),
  createdAt: z.string(),
  updatedAt: z.string(),
  masterVolume: z.number().min(0).max(1),
  tracks: z.array(TrackSchema).max(64),
})

export const LibraryFrequencySchema = z.object({
  id: z.string(),
  key: z.string().nullish(),
  name: z.string(),
  frequencyMilliHz: z.number().int().min(MIN_FREQ_MHZ).max(MAX_FREQ_MHZ),
  /** Dudnienie binauralne: lewy kanał = frequency, prawy = frequency + beat. */
  binauralBeatMilliHz: z.number().int().positive().nullish(),
  category: z.string(),
  description: z.string().default(''),
  info: z.string().default(''),
  tags: z.array(z.string()).default([]),
})

/** Zestaw (gotowy projekt) pobierany z API; `data` walidowane dopiero przy otwarciu. */
export const RemotePresetSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  description: z.string().default(''),
  info: z.string().default(''),
  headphones: z.boolean().default(false),
  data: z.unknown(),
})

export type Waveform = (typeof WAVEFORMS)[number]
export type Curve = (typeof CURVES)[number]
export type EnvelopePoint = z.infer<typeof EnvelopePointSchema>
export type Clip = z.infer<typeof ClipSchema>
export type Track = z.infer<typeof TrackSchema>
export type Composition = z.infer<typeof CompositionSchema>
export type LibraryFrequency = z.infer<typeof LibraryFrequencySchema>
export type RemotePreset = z.infer<typeof RemotePresetSchema>
