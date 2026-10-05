/** Obszary mózgu używane na schemacie (BrainMap). `deep` = struktura pod korą (rysowana przerywaną linią). */
export const BRAIN_REGIONS = {
  cortex: { name: 'Rozległa kora', deep: false },
  frontal: { name: 'Płat czołowy', deep: false },
  prefrontal: { name: 'Kora przedczołowa', deep: false },
  motor: { name: 'Kora ruchowa (M1)', deep: false },
  sensory: { name: 'Kora czuciowa (somatosensoryczna)', deep: false },
  parietal: { name: 'Płat ciemieniowy', deep: false },
  occipital: { name: 'Płat potyliczny (kora wzrokowa)', deep: false },
  temporal: { name: 'Płat skroniowy', deep: false },
  auditory: { name: 'Kora słuchowa', deep: false },
  cerebellum: { name: 'Móżdżek', deep: false },
  brainstem: { name: 'Pień mózgu', deep: true },
  reticular: { name: 'Układ siatkowaty (pień)', deep: true },
  thalamus: { name: 'Wzgórze', deep: true },
  hypothalamus: { name: 'Podwzgórze', deep: true },
  basalGanglia: { name: 'Zwoje podstawy', deep: true },
  hippocampus: { name: 'Hipokamp', deep: true },
  amygdala: { name: 'Ciało migdałowate', deep: true },
  acc: { name: 'Przednia kora obręczy (ACC)', deep: true },
  mpfc: { name: 'Przyśrodkowa kora przedczołowa', deep: true },
  pcc: { name: 'Tylna kora obręczy', deep: true },
  dmn: { name: 'Sieć domyślna (DMN)', deep: true },
} as const satisfies Record<string, { name: string; deep: boolean }>

export type BrainRegionId = keyof typeof BRAIN_REGIONS
