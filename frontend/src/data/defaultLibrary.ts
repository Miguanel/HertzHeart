import type { LibraryFrequency } from '../model/schema'

/** Zapasowa biblioteka – używana, gdy API jest niedostępne (offline, pierwsze uruchomienie). Zgodna z migracją 0002. */
const raw: [string, number, string, string][] = [
  ['Solfeggio 174', 174_000, 'Solfeggio', 'Skala Solfeggio'],
  ['Solfeggio 285', 285_000, 'Solfeggio', 'Skala Solfeggio'],
  ['Solfeggio 396 (UT)', 396_000, 'Solfeggio', 'Skala Solfeggio'],
  ['Solfeggio 417 (RE)', 417_000, 'Solfeggio', 'Skala Solfeggio'],
  ['Solfeggio 528 (MI)', 528_000, 'Solfeggio', 'Skala Solfeggio'],
  ['Solfeggio 639 (FA)', 639_000, 'Solfeggio', 'Skala Solfeggio'],
  ['Solfeggio 741 (SOL)', 741_000, 'Solfeggio', 'Skala Solfeggio'],
  ['Solfeggio 852 (LA)', 852_000, 'Solfeggio', 'Skala Solfeggio'],
  ['Solfeggio 963', 963_000, 'Solfeggio', 'Skala Solfeggio'],
  ['Słońce', 126_220, 'Kosmiczna oktawa', 'Wg H. Cousto'],
  ['Ziemia – rok (OM)', 136_100, 'Kosmiczna oktawa', 'Wg H. Cousto'],
  ['Merkury', 141_270, 'Kosmiczna oktawa', 'Wg H. Cousto'],
  ['Mars', 144_720, 'Kosmiczna oktawa', 'Wg H. Cousto'],
  ['Saturn', 147_850, 'Kosmiczna oktawa', 'Wg H. Cousto'],
  ['Jowisz', 183_580, 'Kosmiczna oktawa', 'Wg H. Cousto'],
  ['Ziemia – doba', 194_180, 'Kosmiczna oktawa', 'Wg H. Cousto'],
  ['Księżyc synodyczny', 210_420, 'Kosmiczna oktawa', 'Wg H. Cousto'],
  ['Wenus', 221_230, 'Kosmiczna oktawa', 'Wg H. Cousto'],
  ['C4 (strój naukowy)', 256_000, 'Strojenie', 'C4 przy stroju naukowym'],
  ['C4 (A=440)', 261_626, 'Strojenie', 'C4 w stroju równomiernie temperowanym'],
  ['A4 = 432 Hz', 432_000, 'Strojenie', 'Alternatywny strój A4'],
  ['A4 = 440 Hz', 440_000, 'Strojenie', 'Standardowy strój A4 (ISO 16)'],
  ['Ton testowy 100 Hz', 100_000, 'Tony testowe', 'Niski ton kontrolny'],
  ['Ton testowy 1 kHz', 1_000_000, 'Tony testowe', 'Ton odniesienia 1 kHz'],
]

export const DEFAULT_LIBRARY: LibraryFrequency[] = raw.map(([name, frequencyMilliHz, category, description], i) => ({
  id: `local-${i}`,
  name,
  frequencyMilliHz,
  category,
  description,
  tags: [],
}))
