/**
 * Interpretacje częstotliwości bujania i drgań na podstawie badań laboratoryjnych.
 * Każdy opis ma źródło (link do artykułu – PubMed Central, PubMed lub DOI wydawcy).
 * Źródła zweryfikowano z tekstami artykułów (październik 2026).
 */

export interface ResearchSource {
  id: string
  /** Krótki opis do przycisku, np. „Bhatia i in., Movement Disorders 2018”. */
  short: string
  /** Pełny tytuł artykułu. */
  title: string
  /** Instytucja / czasopismo (informacyjnie). */
  publisher: string
  url: string
}

export const SOURCES: Record<string, ResearchSource> = {
  paillard2015: {
    id: 'paillard2015',
    short: 'Paillard i Noé, BioMed Research International 2015',
    title: 'Techniques and Methods for Testing the Postural Function in Healthy and Pathological Subjects',
    publisher: 'BioMed Research International (Hindawi), 2015 · doi:10.1155/2015/891390',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4659957/',
  },
  malakhov2014: {
    id: 'malakhov2014',
    short: 'Malakhov i in., Asian Journal of Sports Medicine 2014',
    title: 'The Influence of Different Modes of Ventilation on Standing Balance of Athletes',
    publisher: 'Asian Journal of Sports Medicine, 2014 · doi:10.5812/asjsm.22767',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4267484/',
  },
  manor2012: {
    id: 'manor2012',
    short: 'Manor i in., Gait & Posture 2012',
    title: 'Posturo-respiratory synchronization: Effects of aging and stroke',
    publisher: 'Gait & Posture, 2012 · doi:10.1016/j.gaitpost.2012.03.002',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3387343/',
  },
  golding2001: {
    id: 'golding2001',
    short: 'Golding, Mueller i Gresty, 2001',
    title: 'A motion sickness maximum around the 0.2 Hz frequency range of horizontal translational oscillation',
    publisher: 'Badanie laboratoryjne na platformie ruchomej, 2001',
    url: 'https://core.ac.uk/works/8396757',
  },
  bayer2011: {
    id: 'bayer2011',
    short: 'Bayer i in., Current Biology 2011',
    title: 'Rocking synchronizes brain waves during a short nap',
    publisher: 'Current Biology (Uniwersytet Genewski), 2011 · doi:10.1016/j.cub.2011.05.012',
    url: 'https://doi.org/10.1016/j.cub.2011.05.012',
  },
  perrault2019: {
    id: 'perrault2019',
    short: 'Perrault i in., Current Biology 2019',
    title: 'Whole-Night Continuous Rocking Entrains Spontaneous Neural Oscillations with Benefits for Sleep and Memory',
    publisher: 'Current Biology (Uniwersytet Genewski), 2019 · doi:10.1016/j.cub.2018.12.028',
    url: 'https://doi.org/10.1016/j.cub.2018.12.028',
  },
  conforto2001: {
    id: 'conforto2001',
    short: 'Conforto i in., Gait & Posture 2001',
    title: 'Hemodynamics as a possible internal mechanical disturbance to balance',
    publisher: 'Gait & Posture, 2001 · doi:10.1016/S0966-6362(01)00112-6',
    url: 'https://doi.org/10.1016/S0966-6362(01)00112-6',
  },
  macdougall2005: {
    id: 'macdougall2005',
    short: 'MacDougall i Moore, Journal of Applied Physiology 2005',
    title: 'Marching to the beat of the same drummer: the spontaneous tempo of human locomotion',
    publisher: 'Journal of Applied Physiology, 2005 · doi:10.1152/japplphysiol.00138.2005',
    url: 'https://doi.org/10.1152/japplphysiol.00138.2005',
  },
  krafczyk1999: {
    id: 'krafczyk1999',
    short: 'Krafczyk i in., Neuroscience Letters 1999',
    title: 'Increased body sway at 3.5–8 Hz in patients with phobic postural vertigo',
    publisher: 'Neuroscience Letters, 1999 · doi:10.1016/s0304-3940(98)00917-3',
    url: 'https://pubmed.ncbi.nlm.nih.gov/10025580/',
  },
  bhatia2018: {
    id: 'bhatia2018',
    short: 'Bhatia i in. (MDS), Movement Disorders 2018',
    title: 'Consensus Statement on the Classification of Tremors. From the Task Force on Tremor of the International Parkinson and Movement Disorder Society',
    publisher: 'International Parkinson and Movement Disorder Society · Movement Disorders, 2018 · doi:10.1002/mds.27121',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6530552/',
  },
  sahin2022: {
    id: 'sahin2022',
    short: 'Sahin i in., Frontiers in Neuroscience 2022',
    title: 'Tremor evaluation using smartphone accelerometry in standardized settings',
    publisher: 'Frontiers in Neuroscience, 2022 · doi:10.3389/fnins.2022.861668',
    url: 'https://doi.org/10.3389/fnins.2022.861668',
  },
}

export type FindingKind = 'sway' | 'tremor'

export interface Finding {
  id: string
  title: string
  /** Zakres częstotliwości [Hz], w którym opis pasuje do wyniku. */
  from: number
  to: number
  /** Których wyników dotyczy: głównego rytmu bujania czy szybkich drgań. */
  kinds: FindingKind[]
  /** Opis – co mówią badania. */
  text: string
  /** Opis ostrożności (zdrowie) – wyświetlany wyróżnionym kolorem. */
  caution?: string
  sources: string[]
}

export const FINDINGS: Finding[] = [
  {
    id: 'visuo-vestibular',
    title: 'Niskie częstotliwości – regulacja wzrokowo-błędnikowa',
    from: 0.02,
    to: 0.5,
    kinds: ['sway'],
    text:
      'W posturografii (pomiar wahań środka nacisku stóp na platformie) wolne wahania poniżej ok. 0,5 Hz przypisuje się głównie regulacji równowagi na podstawie wzroku i błędnika (narządu równowagi w uchu wewnętrznym). Granice pasm różnią się między autorami – Malakhov i wsp. przyjęli 0–0,2 Hz jako pasmo „wzrokowe”.',
    sources: ['paillard2015', 'malakhov2014'],
  },
  {
    id: 'breathing',
    title: 'Rytm spokojnego oddechu',
    from: 0.15,
    to: 0.3,
    kinds: ['sway'],
    text:
      'Spokojny oddech dorosłego to ok. 13–15 oddechów na minutę (≈ 0,22–0,25 Hz) – tyle zmierzyli Malakhov i wsp. u sportowców i osób nietrenujących. Oddychanie zmienia objętość tułowia i przesuwa środek masy ciała. Manor i wsp. wyodrębnili dominujący rytm oddechu w zakresie 0,16–0,27 Hz i pokazali, że kołysanie w kierunku przód–tył synchronizuje się z oddechem – silniej u osób starszych, po udarze i przy zamkniętych oczach. Wynik w tym zakresie może oznaczać, że telefon rejestruje ruchy oddechowe.',
    sources: ['manor2012', 'malakhov2014'],
  },
  {
    id: 'rocking-sleep',
    title: 'Kołysanie usypiające – 0,25 Hz',
    from: 0.2,
    to: 0.3,
    kinds: ['sway'],
    text:
      'W badaniach laboratoryjnych Uniwersytetu Genewskiego łóżko kołysało się z częstotliwością 0,25 Hz (jeden cykl na 4 s). Podczas drzemki (Bayer i in., 2011) kołysanie ułatwiało przejście od czuwania do snu, wydłużało fazę N2 i nasilało wolne oscylacje oraz wrzeciona snu. W badaniu całonocnym (Perrault i in., 2019) skracało czas zasypiania, wydłużało sen głęboki N3, zmniejszało liczbę wybudzeń i poprawiało zapamiętywanie w nocy. Autorzy łączą to z dostrajaniem się rytmów snu w mózgu do rytmu kołysania.',
    sources: ['bayer2011', 'perrault2019'],
  },
  {
    id: 'motion-sickness',
    title: 'Okolice 0,2 Hz a choroba lokomocyjna',
    from: 0.1,
    to: 0.4,
    kinds: ['sway'],
    text:
      'Golding, Mueller i Gresty poruszali siedzących ochotników (osoby bardzo podatne na chorobę lokomocyjną) poziomym ruchem o częstotliwości 0,1, 0,2 i 0,4 Hz. Przy 0,2 Hz mdłości pojawiały się najszybciej (średnio po 11,2 min) i u wszystkich 12 osób; przy 0,1 Hz u 8, a przy 0,4 Hz u 7 osób.',
    caution:
      'Badanie dotyczyło długiego, biernego ruchu całego ciała wymuszonego z zewnątrz (jak na statku czy w aucie), a nie własnego bujania. Jeśli przy kołysaniu w tym rytmie robi Ci się niedobrze – przerwij.',
    sources: ['golding2001'],
  },
  {
    id: 'cerebellar',
    title: 'Średnie częstotliwości – udział móżdżku',
    from: 0.5,
    to: 2,
    kinds: ['sway'],
    text:
      'Wahania postawy w zakresie ok. 0,5–2 Hz przypisuje się w posturografii udziałowi móżdżku w regulacji równowagi (Malakhov i wsp. przyjęli dla tego pasma 0,2–2 Hz). Wyższa średnia częstotliwość wahań oznacza szybsze i mniejsze korekty postawy; bywa też traktowana jako wskaźnik sztywności w stawach skokowych.',
    sources: ['paillard2015', 'malakhov2014'],
  },
  {
    id: 'heartbeat',
    title: 'Rytm serca',
    from: 0.8,
    to: 1.7,
    kinds: ['sway'],
    text:
      'Tętno spoczynkowe 50–100 uderzeń na minutę to 0,8–1,7 Hz. Conforto i wsp. zmierzyli u 20 młodych osób stojących spokojnie, że każdy skurcz serca i ruch krwi w naczyniach wytwarza siłę działającą na środek masy ciała (wypadkowa rzędu 0,6–1,7 N) – to wewnętrzne zakłócenie równowagi, które może dokładać się do kołysania. Przy bardzo spokojnym staniu z telefonem przy klatce piersiowej czujnik może rejestrować ten rytm.',
    sources: ['conforto2001'],
  },
  {
    id: 'locomotion',
    title: 'Naturalne tempo kroków – ok. 2 Hz',
    from: 1.7,
    to: 2.2,
    kinds: ['sway'],
    text:
      'MacDougall i Moore mierzyli pionowe przyspieszenie głowy 20 osób w trakcie chodzenia. Chód miał wyraźny rezonans przy 2 Hz (odchylenie 0,13 Hz; zakres 1,70–2,16 Hz), czyli ok. 120 kroków na minutę – niezależnie od wieku, wzrostu, masy ciała i płci. Wynik w tym zakresie często oznacza chodzenie albo bujanie się w rytmie kroków.',
    sources: ['macdougall2005'],
  },
  {
    id: 'proprioceptive',
    title: 'Wysokie częstotliwości – czucie głębokie',
    from: 2,
    to: 20,
    kinds: ['sway', 'tremor'],
    text:
      'Szybkie wahania postawy (powyżej ok. 2 Hz) przypisuje się regulacji opartej na czuciu głębokim (proprioceptorach mięśni, ścięgien i stawów). Malakhov i wsp. przyjęli dla tego pasma 2–6 Hz.',
    sources: ['paillard2015', 'malakhov2014'],
  },
  {
    id: 'ppv-band',
    title: 'Pasmo 3,5–8 Hz a świadoma kontrola postawy',
    from: 3.5,
    to: 8,
    kinds: ['tremor'],
    text:
      'Krafczyk i wsp. porównali 12 pacjentów z fobicznymi zawrotami głowy i 12 zdrowych osób. U pacjentów aktywność kołysania w paśmie 3,5–8 Hz była wyraźnie większa, ale nie pogarszała stabilności. Autorzy tłumaczą to zmianą strategii: świadomym „pilnowaniem” postawy i współskurczem mięśni antygrawitacyjnych – tak samo robią zdrowe osoby przy trudnych zadaniach równowagi.',
    sources: ['krafczyk1999'],
  },
  {
    id: 'tremor-4-8',
    title: 'Drżenie 4–8 Hz',
    from: 4,
    to: 8,
    kinds: ['tremor'],
    text:
      'Według klasyfikacji drżeń Międzynarodowego Towarzystwa Choroby Parkinsona i Zaburzeń Ruchowych (MDS) większość drżeń chorobowych ma częstotliwość 4–8 Hz, dlatego sama częstotliwość rzadko wystarcza do rozpoznania. W badaniu ze smartfonem (iPhone 8, 100 próbek/s) drżenie samoistne miało 6,0 ± 1,0 Hz, a drżenie posturalne w chorobie Parkinsona 6,3 ± 1,3 Hz.',
    caution:
      'Ruch w tym zakresie powstaje też przy celowym potrząsaniu, zmęczeniu mięśni czy trzymaniu cięższego przedmiotu. Pomiar telefonem nie jest diagnozą – jeśli zauważasz drżenie, które przeszkadza w codziennych czynnościach, skonsultuj się z neurologiem.',
    sources: ['bhatia2018', 'sahin2022'],
  },
  {
    id: 'tremor-physiological',
    title: 'Drżenie fizjologiczne 8–12 Hz',
    from: 8,
    to: 12,
    kinds: ['tremor'],
    text:
      'Ośrodkowa składowa drżenia fizjologicznego – obecnego u każdego zdrowego człowieka – ma 8–12 Hz (klasyfikacja MDS). Telefon trzymany w dłoni zwykle je rejestruje. Drżenie fizjologiczne nasila się przejściowo m.in. przy lęku, zmęczeniu, nadczynności tarczycy i po niektórych lekach; po usunięciu przyczyny ustępuje.',
    sources: ['bhatia2018'],
  },
  {
    id: 'tremor-orthostatic',
    title: 'Drżenie ortostatyczne 13–18 Hz',
    from: 12,
    to: 18,
    kinds: ['tremor'],
    text:
      'Pierwotne drżenie ortostatyczne to uogólnione drżenie o wysokiej częstotliwości 13–18 Hz, występujące w pozycji stojącej; bywa wyczuwalne, choć niewidoczne, a klasyfikacja MDS wymaga potwierdzenia badaniem EMG. Drżenia powyżej 12 Hz MDS zalicza do osobnej kategorii częstotliwości.',
    caution:
      'Przy częstotliwości próbkowania czujników telefonu (zwykle ok. 60 próbek/s) pomiar w tym zakresie jest mało dokładny i może wynikać z drgań otoczenia. Uczucie drżenia lub niestabilności nóg podczas stania warto skonsultować z neurologiem.',
    sources: ['bhatia2018'],
  },
]

/** Opisy pasujące do częstotliwości danego rodzaju wyniku. */
export function findingsFor(hz: number, kind: FindingKind): Finding[] {
  return FINDINGS.filter((f) => f.kinds.includes(kind) && hz >= f.from && hz < f.to)
}

/** Źródło opisu średniej częstotliwości i pasm posturograficznych. */
export const BANDS_SOURCES = ['paillard2015', 'malakhov2014']
