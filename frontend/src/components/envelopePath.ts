import type { EnvelopePoint } from '../model/schema'

/** Ścieżka SVG linii obwiedni (odcinki liniowe lub „skok”). */
export function envelopeLine(points: readonly EnvelopePoint[], x: (t: number) => number, y: (v: number) => number): string {
  if (!points.length) return ''
  let d = `M${x(points[0].t)} ${y(points[0].v)}`
  for (let i = 1; i < points.length; i++) {
    const p = points[i]
    d += p.curve === 'hold' ? ` H${x(p.t)} V${y(p.v)}` : ` L${x(p.t)} ${y(p.v)}`
  }
  return d
}

export function envelopeArea(points: readonly EnvelopePoint[], x: (t: number) => number, y: (v: number) => number): string {
  if (!points.length) return ''
  const first = points[0]
  const last = points[points.length - 1]
  return `${envelopeLine(points, x, y)} L${x(last.t)} ${y(0)} L${x(first.t)} ${y(0)} Z`
}

/** „Ładny” krok podziałki, tak aby etykiety nie nachodziły na siebie. */
export function niceStep(pxPerSecond: number, minPx = 70): number {
  const steps = [0.1, 0.25, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600]
  return steps.find((s) => s * pxPerSecond >= minPx) ?? 3600
}
