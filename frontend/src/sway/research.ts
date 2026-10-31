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
  lehrer2014: {
    id: 'lehrer2014',
    short: 'Lehrer i Gevirtz, Frontiers in Psychology 2014',
    title: 'Heart rate variability biofeedback: how and why does it work?',
    publisher: 'Frontiers in Psychology, 2014 · doi:10.3389/fpsyg.2014.00756',
    url: 'https://doi.org/10.3389/fpsyg.2014.00756',
  },
  hanson2014: {
    id: 'hanson2014',
    short: 'Hanson i in., Frontiers in Physiology 2014',
    title: 'Oscillatory behavior of ventricular action potential duration in heart failure patients at respiratory rate and low frequency',
    publisher: 'Frontiers in Physiology, 2014 · doi:10.3389/fphys.2014.00414',
    url: 'https://doi.org/10.3389/fphys.2014.00414',
  },
  taskforce1996: {
    id: 'taskforce1996',
    short: 'Task Force ESC i NASPE, Circulation 1996',
    title: 'Heart Rate Variability: Standards of Measurement, Physiological Interpretation, and Clinical Use',
    publisher: 'Europejskie Towarzystwo Kardiologiczne (ESC) i North American Society of Pacing and Electrophysiology · Circulation, 1996',
    url: 'https://www.ahajournals.org/doi/10.1161/01.CIR.93.5.1043',
  },
  williams2023: {
    id: 'williams2023',
    short: 'Williams i in., Frontiers in Cardiovascular Medicine 2023',
    title: 'Exaggerated postural sway improves orthostatic cardiovascular and cerebrovascular control',
    publisher: 'Frontiers in Cardiovascular Medicine, 2023 · doi:10.3389/fcvm.2023.1040036',
    url: 'https://doi.org/10.3389/fcvm.2023.1040036',
  },
  duarte2010: {
    id: 'duarte2010',
    short: 'Duarte, Freitas i Zatsiorsky, Oxford University Press 2010',
    title: 'Control of Equilibrium in Humans: Sway over Sway (rozdział w książce „Motor Control”)',
    publisher: 'Oxford University Press, 2010 – omówienie badania Duarte i Zatsiorsky (1999) nad 30-minutowym staniem',
    url: 'https://bmclab.pesquisa.ufabc.edu.br/pubs/pmcvii.pdf',
  },
  dai2014: {
    id: 'dai2014',
    short: 'Dai i in., Frontiers in Neurology 2014',
    title: 'Readaptation of the Vestibulo-Ocular Reflex Relieves the Mal De Debarquement Syndrome',
    publisher: 'Frontiers in Neurology, 2014 · doi:10.3389/fneur.2014.00124',
    url: 'https://doi.org/10.3389/fneur.2014.00124',
  },
  ats2015: {
    id: 'ats2015',
    short: 'American Thoracic Society, Sleep Fragments',
    title: 'Sleep Fragments – rytmiczne ruchy w czasie snu (rhythmic movement disorder), kryteria ICSD-3',
    publisher: 'American Thoracic Society · Morkous, Lewis, Auckley (Case Western Reserve University)',
    url: 'https://www.thoracic.org/professionals/clinical-resources/sleep/sleep-fragments/2015-september-1.php',
  },
  zhou2014: {
    id: 'zhou2014',
    short: 'Zhou i Griffin, Ergonomics 2014',
    title: 'Response of the seated human body to whole-body vertical vibration: biodynamic responses to sinusoidal and random vibration',
    publisher: 'Ergonomics, 2014 (University of Southampton)',
    url: 'https://eprints.soton.ac.uk/372117/2/14750_ZZ_MJG_2014_Biodynamic_response_to_vertical_vibration.pdf',
  },
  pauelsen2020: {
    id: 'pauelsen2020',
    short: 'Pauelsen i in., PLOS ONE 2020',
    title: 'Frequency domain shows: Fall-related concerns and sensorimotor decline explain inability to adjust postural control strategy in older adults',
    publisher: 'PLOS ONE, 2020 · doi:10.1371/journal.pone.0242608',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7678972/',
  },
  gu1996: {
    id: 'gu1996',
    short: 'Gu i in., Journal of Biomechanics 1996',
    title: 'Postural control in young and elderly adults when stance is perturbed: dynamics',
    publisher: 'Journal of Biomechanics, 1996 · doi:10.1016/0021-9290(95)00052-6',
    url: 'https://pubmed.ncbi.nlm.nih.gov/8850638/',
  },
  horiuchi2021: {
    id: 'horiuchi2021',
    short: 'Horiuchi i in., PLOS ONE 2021',
    title: 'Postural sway in the moving room scenario: New evidence for functional dissociation between self-motion perception and postural control',
    publisher: 'PLOS ONE, 2021 · doi:10.1371/journal.pone.0257212',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8432855/',
  },
  watson2018: {
    id: 'watson2018',
    short: 'Watson, Frontiers in Systems Neuroscience 2018',
    title: 'Cognitive and Physiologic Impacts of the Infraslow Oscillation',
    publisher: 'Frontiers in Systems Neuroscience, 2018 · doi:10.3389/fnsys.2018.00044',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6198276/',
  },
}

export type FindingKind = 'sway' | 'tremor'

/**
 * Kształt fali na miniwykresie:
 * - `sine` – ruch sinusoidalny (np. kołyszące się łóżko, platforma),
 * - `breath` – oddech (wdech szybszy niż wydech),
 * - `pulse` – uderzenia serca (impuls na każdy skurcz),
 * - `steps` – kroki (przyspieszenie głowy w chodzie),
 * - `tremor` – drżenie (oscylacja o zmiennej amplitudzie),
 * - `band` – wahania z całego pasma (jak zapis środka nacisku stóp w posturografii),
 * - `shift` – skokowe zmiany pozycji i powolny dryf (długie stanie).
 */
export type WaveShape = 'sine' | 'breath' | 'pulse' | 'steps' | 'tremor' | 'band' | 'shift'

/** Fala użyta lub zmierzona w badaniu, które potwierdza dany zakres. */
export interface StudyWave {
  /** Częstotliwość [Hz] (dla `band` – środek pasma, rysowane jest całe `band`). */
  hz: number
  /** Krótki podpis, np. „łóżko 0,25 Hz”. */
  label: string
  shape: WaveShape
  band?: [number, number]
  /** Fala główna (wyróżniona kolorem); pozostałe są porównawcze. */
  main?: boolean
}

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
  /** Fale z badań (miniwykres przy nazwie zakresu). */
  waves: StudyWave[]
  /** Co pokazuje miniwykres. */
  waveNote: string
}

/** Opisy uporządkowane od najwolniejszych zakresów. */
export const FINDINGS: Finding[] = [
  {
    id: 'very-slow',
    title: 'Bardzo wolne rytmy krążenia – poniżej 0,04 Hz',
    from: 0.01,
    to: 0.04,
    kinds: ['sway'],
    text:
      'W zmienności rytmu serca wyróżnia się pasmo bardzo niskich częstotliwości VLF (poniżej 0,04 Hz) – według norm Europejskiego Towarzystwa Kardiologicznego i NASPE jego fizjologiczne podłoże wciąż nie jest poznane. Lehrer i Gevirtz opisują, że oprócz głównego rezonansu przy 0,1 Hz układ krążenia może mieć drugi rezonans ok. 0,02–0,03 Hz, związany z ciśnieniem krwi i napięciem naczyń; o treningu w tym zakresie wiadomo jednak niewiele.',
    sources: ['taskforce1996', 'lehrer2014'],
    waves: [{ hz: 0.025, label: 'rezonans ~0,025 Hz', shape: 'sine', main: true }],
    waveNote: 'Rytm ok. 0,02–0,03 Hz (jeden cykl na 30–50 s) – drugi zakres rezonansu krążenia.',
  },
  {
    id: 'infraslow-brain',
    title: 'Oscylacja infrawolna mózgu – ok. 0,02 Hz (raz na minutę)',
    from: 0.01,
    to: 0.1,
    kinds: ['sway'],
    text:
      'Mózg ma też rytm znacznie wolniejszy od fal EEG: oscylację infrawolną (0,01–0,1 Hz) z najsilniejszą mocą przy ok. 0,02 Hz – mniej więcej jeden cykl na minutę. W tym rytmie wahają się sieci spoczynkowe mózgu widoczne w fMRI (szczyt 0,02–0,03 Hz). Oscylacja dzieli sen nREM na podokresy, a jej faza wiąże się z wynikami w zadaniach – w fazie wznoszącej ludzie częściej trafnie wykrywali bodźce. U osób z ADHD moc w zakresie 0,02–0,2 Hz była o ok. 10% niższa. Watson wskazuje wzgórze (i komórki glejowe) jako możliwe źródło tego rytmu.',
    caution: 'To rytm aktywności mózgu, a nie ruchu ciała – telefon go nie zmierzy. Opis pokazuje tylko, jakie procesy w organizmie mają podobne tempo.',
    sources: ['watson2018'],
    waves: [{ hz: 0.02, label: 'ISO ~0,02 Hz', shape: 'sine', main: true }],
    waveNote: 'Oscylacja infrawolna mózgu: ok. 0,02 Hz (cykl ok. 50 s).',
  },
  {
    id: 'prolonged-standing',
    title: 'Długie stanie – zmiana pozycji średnio co 20\u00a0s',
    from: 0.01,
    to: 0.07,
    kinds: ['sway'],
    text:
      'Duarte i Zatsiorsky obserwowali osoby stojące swobodnie przez 30 minut. W zapisie środka nacisku stóp wyróżnili trzy wzorce: „przesunięcie” (szybkie przeniesienie ciężaru w nowe położenie), „wiercenie się” (szybki, duży ruch i powrót – najczęstszy) oraz „dryf” (powolne przesuwanie trwające ponad 60 s). Średnio jedna zmiana pozycji następowała co ok. 20 s, czyli z częstotliwością ok. 0,05 Hz.',
    sources: ['duarte2010'],
    waves: [{ hz: 0.05, label: 'zmiana co ~20 s', shape: 'shift', main: true }],
    waveNote: 'Schemat zapisu środka nacisku przy długim staniu: skokowe zmiany pozycji co ok. 20 s i powolny dryf.',
  },
  {
    id: 'quiet-standing',
    title: 'Spokojne stanie – średnio ok. 0,05 Hz',
    from: 0.03,
    to: 0.08,
    kinds: ['sway'],
    text:
      'W badaniu Williams i wsp. (20 zdrowych dorosłych na platformie posturograficznej) średnia częstotliwość kołysania przy spokojnym staniu wynosiła ok. 0,05 Hz. W tym samym badaniu analizowano też ciśnienie krwi w paśmie 0,05–0,15 Hz, odzwierciedlającym współczulną regulację odruchem z baroreceptorów.',
    sources: ['williams2023'],
    waves: [{ hz: 0.05, label: 'spokojne stanie ~0,05 Hz', shape: 'band', band: [0.02, 0.1], main: true }],
    waveNote: 'Wahania środka nacisku przy spokojnym staniu – przewaga rytmu ok. 0,05 Hz.',
  },
  {
    id: 'mayer',
    title: 'Fale Mayera – rytm ciśnienia krwi ok. 0,1 Hz',
    from: 0.03,
    to: 0.15,
    kinds: ['sway'],
    text:
      'Ciśnienie tętnicze faluje z częstotliwością ok. 0,1 Hz (fale Mayera); zakres tych fal jest dość szeroki – ok. 0,03–0,15 Hz. Przypisuje się je oscylacjom napięcia współczulnego: według jednej teorii wytwarza je „rozrusznik” w pniu mózgu, według drugiej – odruch z baroreceptorów. Normy ESC/NASPE dla zmienności rytmu serca nazywają pasmo 0,04–0,15 Hz pasmem niskich częstotliwości (LF).',
    sources: ['hanson2014', 'taskforce1996'],
    waves: [{ hz: 0.1, label: 'ciśnienie ~0,1 Hz', shape: 'sine', main: true }],
    waveNote: 'Falowanie ciśnienia tętniczego ok. 0,1 Hz (cykl ok. 10 s).',
  },
  {
    id: 'moving-room',
    title: 'Ciało podąża za ruchem obrazu – 0,08 Hz',
    from: 0.06,
    to: 0.1,
    kinds: ['sway'],
    text:
      'Horiuchi i wsp. pokazywali 19 młodym osobom stojącym na platformie obraz kropek, które sinusoidalnie przybliżały się i oddalały z częstotliwością 0,08 Hz (wolniej niż naturalne kołysanie w stawach skokowych, ok. 0,2–0,3 Hz). Środek nacisku stóp podążał za obrazem (korelacja 0,35–0,54) i rósł wraz z amplitudą ruchu obrazu. Obraz w widzeniu obwodowym dawał silniejsze wrażenie ruchu własnego i lepszą kontrolę postawy, ale samo to wrażenie nie wpływało na kołysanie – o stabilności decydowały bodźce wzrokowe.',
    sources: ['horiuchi2021'],
    waves: [
      { hz: 0.08, label: 'ruch obrazu 0,08 Hz', shape: 'sine', main: true },
      { hz: 0.08, label: 'kołysanie (środek nacisku)', shape: 'band', band: [0.07, 0.3] },
    ],
    waveNote: 'Sinusoidalny ruch obrazu 0,08 Hz i podążające za nim kołysanie ciała.',
  },
  {
    id: 'resonance-breathing',
    title: 'Oddech rezonansowy – 0,1 Hz (6 oddechów na minutę)',
    from: 0.075,
    to: 0.12,
    kinds: ['sway'],
    text:
      'W treningu zmienności rytmu serca (biofeedback HRV) największe efekty daje oddychanie z częstotliwością ok. 0,1 Hz – 6 oddechów na minutę; późniejsze pomiary wskazują średnio ok. 0,09 Hz (5,5 oddechu/min, ok. 11 s na oddech). Przy tej częstotliwości tętno i ciśnienie oscylują w przeciwnych fazach, a amplituda wahań tętna rośnie wielokrotnie w porównaniu ze spoczynkiem; rośnie też czułość odruchu z baroreceptorów. Wyższe osoby i mężczyźni mają zwykle niższą częstotliwość rezonansową.',
    sources: ['lehrer2014'],
    waves: [
      { hz: 0.1, label: '6 oddechów/min', shape: 'breath', main: true },
      { hz: 0.09, label: '5,5 oddechu/min', shape: 'breath' },
    ],
    waveNote: 'Powolny oddech rezonansowy 0,1 Hz i średnia z pomiarów 0,09 Hz.',
  },
  {
    id: 'older-adults',
    title: 'Starsze osoby i obawa przed upadkiem',
    from: 0.05,
    to: 0.2,
    kinds: ['sway'],
    text:
      'Pauelsen i wsp. badali 45 starszych osób (30 s spokojnego stania na platformie). Szczyt widma kołysania wynosił średnio 0,069 Hz przy oczach otwartych i 0,117 Hz przy zamkniętych (średnia częstotliwość 0,30 i 0,40 Hz). Osoby z mniejszym pogorszeniem czucia i siły oraz bez obaw przed upadkiem miały wyższe częstotliwości i po zamknięciu oczu przechodziły na szybsze korekty (szczyt 0,165 Hz). Osoby z większym pogorszeniem i obawami tego nie robiły (0,060 Hz) – ich równowaga silnie zależała od wzroku. W innym typie zadania (reakcja na zaburzenie postawy) Gu i wsp. obserwowali raczej wyższe częstotliwości oscylacji u starszych niż u młodych, choć tylko część różnic była istotna.',
    caution: 'Wynik z telefonu nie ocenia ryzyka upadku. Jeśli zdarzają się upadki albo boisz się upaść, warto ocenić równowagę u lekarza lub fizjoterapeuty.',
    sources: ['pauelsen2020', 'gu1996'],
    waves: [
      { hz: 0.165, label: 'grupa 1 · oczy zamknięte 0,165 Hz', shape: 'sine', main: true },
      { hz: 0.06, label: 'grupa 2 · oczy zamknięte 0,060 Hz', shape: 'sine' },
    ],
    waveNote: 'Szczyty widma kołysania przy zamkniętych oczach: grupa bez obaw (0,165 Hz) i z obawami przed upadkiem (0,060 Hz).',
  },
  {
    id: 'visuo-vestibular',
    title: 'Niskie częstotliwości – regulacja wzrokowo-błędnikowa',
    from: 0.01,
    to: 0.5,
    kinds: ['sway'],
    text:
      'W posturografii (pomiar wahań środka nacisku stóp na platformie) wolne wahania poniżej ok. 0,5 Hz przypisuje się głównie regulacji równowagi na podstawie wzroku i błędnika (narządu równowagi w uchu wewnętrznym). Granice pasm różnią się między autorami – Malakhov i wsp. przyjęli 0–0,2 Hz jako pasmo „wzrokowe”.',
    sources: ['paillard2015', 'malakhov2014'],
    waves: [{ hz: 0.2, label: 'COP < 0,5 Hz', shape: 'band', band: [0.03, 0.5], main: true }],
    waveNote: 'Zapis wahań środka nacisku stóp złożony z częstotliwości poniżej 0,5 Hz.',
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
    waves: [
      { hz: 0.23, label: 'oddech ~14/min', shape: 'breath', main: true },
      { hz: 0.23, label: 'kołysanie przód–tył', shape: 'band', band: [0.16, 0.27] },
    ],
    waveNote: 'Oddech ok. 14/min i zsynchronizowane z nim kołysanie przód–tył (0,16–0,27 Hz).',
  },
  {
    id: 'mdds',
    title: 'Kołysanie 0,2 Hz po podróży (mal de débarquement)',
    from: 0.15,
    to: 0.3,
    kinds: ['sway'],
    text:
      'Zespół mal de débarquement to uporczywe uczucie kołysania po zejściu ze statku lub po innej podróży. Dai i wsp. opisali u 24 pacjentów kołysanie ciała z częstotliwością 0,2 Hz. Terapia readaptacji odruchu przedsionkowo-ocznego (ruchy głowy na boki przy obracającym się obrazie) przyniosła pełną lub znaczną poprawę u 17 z 24 osób (ok. 70%).',
    caution: 'Jeśli po podróży długo czujesz kołysanie, którego nie ma, porozmawiaj z laryngologiem lub neurologiem – to rozpoznawalny i leczony zespół.',
    sources: ['dai2014'],
    waves: [{ hz: 0.2, label: 'kołysanie ciała 0,2 Hz', shape: 'sine', main: true }],
    waveNote: 'Kołysanie ciała 0,2 Hz (cykl 5 s) opisane u pacjentów.',
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
    waves: [{ hz: 0.25, label: 'łóżko 0,25 Hz', shape: 'sine', main: true }],
    waveNote: 'Ruch kołyszącego się łóżka w obu badaniach: sinus 0,25 Hz (cykl 4 s).',
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
    waves: [
      { hz: 0.1, label: '0,1 Hz · 8/12 osób', shape: 'sine' },
      { hz: 0.2, label: '0,2 Hz · 12/12 osób', shape: 'sine', main: true },
      { hz: 0.4, label: '0,4 Hz · 7/12 osób', shape: 'sine' },
    ],
    waveNote: 'Trzy ruchy platformy użyte w badaniu; najsilniej działał 0,2 Hz.',
  },
  {
    id: 'exaggerated-sway',
    title: 'Celowe, mocne kołysanie wspiera krążenie przy staniu',
    from: 0.3,
    to: 0.45,
    kinds: ['sway'],
    text:
      'Williams i wsp. poprosili 20 zdrowych osób, by kołysały się możliwie mocno (przód–tył, na boki lub „po kwadracie”) bez odrywania stóp. Średnia częstotliwość kołysania wzrosła z ok. 0,05 Hz do 0,34–0,40 Hz. W porównaniu ze spokojnym staniem kołysanie zmniejszyło spadek objętości wyrzutowej serca po wstaniu (z −22,5% do ok. −8–10%) i spadek przepływu krwi w mózgu (z −24,6% do ok. −16%), a ciśnienie skurczowe rosło bardziej. Autorzy proponują to jako prosty manewr dla osób skłonnych do omdleń – badanie dotyczyło jednak osób zdrowych.',
    sources: ['williams2023'],
    waves: [
      { hz: 0.37, label: 'mocne kołysanie 0,34–0,40 Hz', shape: 'sine', main: true },
      { hz: 0.05, label: 'spokojne stanie 0,05 Hz', shape: 'band', band: [0.02, 0.1] },
    ],
    waveNote: 'Kołysanie celowe (ok. 0,37 Hz) w porównaniu ze spokojnym staniem (ok. 0,05 Hz).',
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
    waves: [{ hz: 1, label: 'COP 0,5–2 Hz', shape: 'band', band: [0.5, 2], main: true }],
    waveNote: 'Zapis wahań środka nacisku stóp złożony z częstotliwości 0,5–2 Hz.',
  },
  {
    id: 'rmd',
    title: 'Rytmiczne kołysanie przy zasypianiu – 0,5–2 Hz',
    from: 0.5,
    to: 2,
    kinds: ['sway'],
    text:
      'Zaburzenie rytmicznych ruchów związanych ze snem (rhythmic movement disorder – np. kołysanie całym ciałem czy uderzanie głową przy zasypianiu) ujmuje Międzynarodowa Klasyfikacja Zaburzeń Snu ICSD-3 Amerykańskiej Akademii Medycyny Snu. W badaniu polisomnograficznym ruchy te mają częstotliwość od 0,5 do 2 Hz.',
    sources: ['ats2015'],
    waves: [{ hz: 1, label: 'kołysanie ~1 Hz', shape: 'sine', main: true }],
    waveNote: 'Rytmiczne kołysanie ciała w środku zakresu 0,5–2 Hz.',
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
    waves: [{ hz: 1.2, label: 'tętno 72/min', shape: 'pulse', main: true }],
    waveNote: 'Siła od każdego skurczu serca – impuls na uderzenie (przykład: tętno 72/min).',
  },
  {
    id: 'hyperventilation',
    title: 'Bardzo szybki oddech (hiperwentylacja)',
    from: 0.8,
    to: 1.05,
    kinds: ['sway'],
    text:
      'Przy maksymalnej dowolnej hiperwentylacji badani przez Malakhova i wsp. oddychali 52–59 razy na minutę (ok. 0,9–1 Hz). Wszystkie wskaźniki kołysania na platformie wyraźnie wzrosły w obu grupach – szybki, głęboki oddech mocno zaburza równowagę. Także wstrzymanie oddechu zwiększało prędkość i częstotliwość wahań środka nacisku.',
    caution: 'Nie hiperwentyluj celowo – może wywołać zawroty głowy, mrowienie i omdlenie.',
    sources: ['malakhov2014'],
    waves: [
      { hz: 0.92, label: 'hiperwentylacja ~55/min', shape: 'breath', main: true },
      { hz: 0.23, label: 'spokojny oddech ~14/min', shape: 'breath' },
    ],
    waveNote: 'Oddech przy hiperwentylacji (ok. 55/min) w porównaniu ze spokojnym (ok. 14/min).',
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
    waves: [{ hz: 2, label: 'kroki 2 Hz', shape: 'steps', main: true }],
    waveNote: 'Pionowe przyspieszenie głowy w chodzie – rezonans 2 Hz (ok. 120 kroków/min).',
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
    waves: [{ hz: 4, label: 'COP 2–6 Hz', shape: 'band', band: [2, 6], main: true }],
    waveNote: 'Zapis wahań środka nacisku stóp złożony z częstotliwości 2–6 Hz.',
  },
  {
    id: 'tremor-slow',
    title: 'Wolne drżenia – poniżej 5 Hz',
    from: 1,
    to: 5,
    kinds: ['tremor'],
    text:
      'Według klasyfikacji MDS wolne drżenia to m.in. drżenie zamiarowe (narastające przy zbliżaniu ręki do celu, poniżej 5 Hz), drżenie Holmesa (spoczynkowe, posturalne i zamiarowe, poniżej 5 Hz) oraz bardzo rzadka miorytmia (1–4 Hz), zwykle z innymi objawami pnia mózgu. Drżenie podniebienia ma 0,5–5 Hz.',
    caution: 'Wolne, rytmiczne ruchy w tym zakresie najczęściej wynikają po prostu z bujania lub chodu. Drżenie, które pojawia się przy sięganiu po przedmioty i utrudnia czynności, warto skonsultować z neurologiem.',
    sources: ['bhatia2018'],
    waves: [{ hz: 3, label: 'drżenie < 5 Hz', shape: 'tremor', main: true }],
    waveNote: 'Przykład drżenia ok. 3 Hz (zakres wolnych drżeń: poniżej 5 Hz).',
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
    waves: [{ hz: 5.5, label: 'kołysanie 3,5–8 Hz', shape: 'band', band: [3.5, 8], main: true }],
    waveNote: 'Szybkie składowe kołysania w paśmie 3,5–8 Hz, zwiększone u pacjentów.',
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
    waves: [
      { hz: 6.0, label: 'drżenie samoistne 6,0 Hz', shape: 'tremor', main: true },
      { hz: 6.3, label: 'parkinsonowskie posturalne 6,3 Hz', shape: 'tremor' },
    ],
    waveNote: 'Średnie częstotliwości drżeń zmierzone smartfonem (Sahin i in.).',
  },
  {
    id: 'tremor-parkinson-rest',
    title: 'Drżenie spoczynkowe w parkinsonizmie – 4–7 Hz',
    from: 4,
    to: 7,
    kinds: ['tremor'],
    text:
      'Klasyczne drżenie parkinsonowskie to drżenie spoczynkowe ręki („kręcenie pigułek”), nogi, żuchwy, języka lub stopy o częstotliwości zwykle 4–7 Hz, występujące razem ze spowolnieniem ruchów i sztywnością. Mogą mu towarzyszyć drżenia posturalne lub kinetyczne o tej samej albo innej częstotliwości; opisywano też wyższe częstotliwości.',
    caution:
      'Telefon trzymany w dłoni mierzy drżenie posturalne, a nie spoczynkowe – wynik w tym zakresie niczego nie przesądza. Objawy takie jak spowolnienie i sztywność wymagają oceny neurologa.',
    sources: ['bhatia2018'],
    waves: [{ hz: 5.5, label: 'spoczynkowe 4–7 Hz', shape: 'tremor', main: true }],
    waveNote: 'Przykład drżenia spoczynkowego ok. 5,5 Hz.',
  },
  {
    id: 'body-resonance',
    title: 'Rezonans ciała w drganiach pojazdu – ok. 5 Hz',
    from: 4,
    to: 6.5,
    kinds: ['tremor'],
    text:
      'Zhou i Griffin (University of Southampton) poddawali siedzące osoby pionowym drganiom całego ciała. Główny rezonans ciała wypadał w okolicy 5 Hz i obniżał się wraz z siłą drgań – z ok. 6,5 Hz do 4,5 Hz przy drganiach losowych i z 6,3 do 4,0 Hz przy sinusoidalnych. Jeśli mierzysz w jadącym aucie, autobusie czy pociągu, wynik w tym zakresie to najpewniej drgania pojazdu przenoszone przez ciało.',
    sources: ['zhou2014'],
    waves: [{ hz: 5, label: 'rezonans ~5 Hz', shape: 'sine', main: true }],
    waveNote: 'Drgania z częstotliwością głównego rezonansu siedzącego ciała (ok. 5 Hz).',
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
    waves: [{ hz: 10, label: 'fizjologiczne 8–12 Hz', shape: 'tremor', main: true }],
    waveNote: 'Przykład drżenia fizjologicznego ok. 10 Hz.',
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
    waves: [{ hz: 15.5, label: 'ortostatyczne 13–18 Hz', shape: 'tremor', main: true }],
    waveNote: 'Przykład drżenia ortostatycznego ok. 15,5 Hz (potwierdzanego w EMG).',
  },
]

/** Opisy pasujące do częstotliwości danego rodzaju wyniku. */
export function findingsFor(hz: number, kind: FindingKind): Finding[] {
  return FINDINGS.filter((f) => f.kinds.includes(kind) && hz >= f.from && hz < f.to)
}

/** Źródło opisu średniej częstotliwości i pasm posturograficznych. */
export const BANDS_SOURCES = ['paillard2015', 'malakhov2014']

/* ───────────── miniwykresy fal ───────────── */

/** Okno czasu miniwykresu [s]: 3–4 cykle najwolniejszej fali (0,8–120 s). */
export function waveWindow(waves: StudyWave[]): number {
  const slowest = Math.min(...waves.map((w) => (w.shape === 'band' && w.band ? w.band[0] * 2 : w.hz)))
  return Math.min(120, Math.max(0.8, (slowest >= 2 ? 4 : 3) / slowest))
}

/** Deterministyczne „losowe” liczby (te same wykresy przy każdym renderze). */
function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

/**
 * Próbki fali w oknie [0, T] (n punktów), znormalizowane do zakresu −1…1.
 * Kształty są schematyczne – oddają częstotliwość i charakter sygnału z badania, nie dokładny zapis.
 */
export function sampleWave(w: StudyWave, T: number, n: number, seed = 1): number[] {
  const r = rng(seed * 7919 + Math.round(w.hz * 1000))
  const out: number[] = []
  const f = w.hz
  let comps: { f: number; a: number; p: number }[] = []
  if (w.shape === 'band') {
    const [lo, hi] = w.band ?? [f * 0.5, f * 1.5]
    const k = 7
    comps = Array.from({ length: k }, (_, i) => {
      const fi = lo * (hi / lo) ** ((i + 0.5) / k)
      return { f: fi, a: (lo / fi) ** 0.5 * (0.6 + 0.4 * r()), p: r() * Math.PI * 2 }
    })
  }
  const shiftTimes: number[] = []
  const shiftLevels: number[] = []
  if (w.shape === 'shift') {
    let t = 0
    let level = 0
    while (t < T) {
      t += (0.6 + 0.8 * r()) / f
      level = Math.max(-0.8, Math.min(0.8, level + (r() - 0.5) * 1.2))
      shiftTimes.push(t)
      shiftLevels.push(level)
    }
  }
  for (let i = 0; i < n; i++) {
    const t = (i / (n - 1)) * T
    const ph = 2 * Math.PI * f * t
    let y = 0
    switch (w.shape) {
      case 'sine':
        y = Math.sin(ph)
        break
      case 'breath':
        // wdech krótszy i szybszy niż wydech
        y = Math.sin(ph - 0.35 * Math.sin(ph))
        break
      case 'pulse': {
        const c = (f * t) % 1
        y = Math.exp(-(((c - 0.18) / 0.035) ** 2)) - 0.55 * Math.exp(-(((c - 0.3) / 0.05) ** 2)) + 0.2 * Math.exp(-(((c - 0.5) / 0.08) ** 2))
        y = y * 1.6 - 0.25
        break
      }
      case 'steps':
        y = 0.75 * Math.sin(ph) + 0.35 * Math.sin(2 * ph + 0.6)
        break
      case 'tremor':
        y = Math.sin(ph) * (0.7 + 0.3 * Math.sin(2 * Math.PI * (f / 9) * t + 1))
        break
      case 'band':
        y = comps.reduce((s, c) => s + c.a * Math.sin(2 * Math.PI * c.f * t + c.p), 0)
        break
      case 'shift': {
        let k = shiftTimes.findIndex((s) => s > t)
        if (k < 0) k = shiftTimes.length
        const base = k === 0 ? 0 : shiftLevels[k - 1]
        y = base + 0.12 * Math.sin(2 * Math.PI * f * 6 * t) + 0.25 * Math.sin((2 * Math.PI * t) / (T * 1.3))
        break
      }
    }
    out.push(y)
  }
  const max = Math.max(1e-9, ...out.map(Math.abs))
  return out.map((v) => v / max)
}
