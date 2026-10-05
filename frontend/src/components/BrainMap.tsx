import { useState } from 'react'
import { BRAIN_REGIONS, type BrainRegionId } from '../data/brainRegions'

export interface BrainHighlight {
  regions: readonly BrainRegionId[]
  color: string
  label?: string
}

/* Schematyczny widok mózgu z boku (lewa półkula): przód po lewej, tył po prawej. */
const CEREBRUM =
  'M40 122C28 84 58 36 114 24C160 14 216 17 256 40C291 59 302 97 291 126C285 141 271 149 256 151C242 153 226 151 212 149C192 166 160 172 130 165C106 160 92 151 86 141C70 146 50 141 40 122Z'
const CEREBELLUM = 'M214 151C232 147 266 150 279 162C287 177 271 194 246 194C223 194 208 182 210 166Z'
const BRAINSTEM = 'M176 152C186 156 197 156 207 152L203 214L183 214Z'

// Płaty i pasy kory jako wielokąty przycięte do obrysu półkuli.
const CORTEX: Partial<Record<BrainRegionId, string>> = {
  frontal: 'M0 0H175V10L152 113L80 138L70 220H0Z',
  prefrontal: 'M0 0H113V22L93 134L80 138L70 220H0Z',
  motor: 'M157 10H175L152 113L135 118Z',
  sensory: 'M175 10L193 14L169 110L152 113Z',
  parietal: 'M175 0H251V30L249 104H210L152 113L175 10Z',
  occipital: 'M251 0H330V220L256 152L249 104L251 30Z',
  temporal: 'M80 138L152 113L210 104L249 104L256 152L212 220H80Z',
  auditory: 'M128 123L201 108L204 119L131 133Z',
}

// Struktury głębokie (rysowane przerywaną linią – „pod korą”).
const DEEP: Partial<Record<BrainRegionId, { d: string; stroke?: boolean }>> = {
  acc: { d: 'M108 88C130 58 178 52 208 70', stroke: true },
  mpfc: { d: 'M60 78a18 22 0 1 0 36 0a18 22 0 1 0-36 0Z' },
  pcc: { d: 'M206 82a10 10 0 1 0 20 0a10 10 0 1 0-20 0Z' },
  basalGanglia: { d: 'M132 100a18 12 0 1 0 36 0a18 12 0 1 0-36 0Z' },
  thalamus: { d: 'M158 114a15 10 0 1 0 30 0a15 10 0 1 0-30 0Z' },
  hypothalamus: { d: 'M148 131a8 6 0 1 0 16 0a8 6 0 1 0-16 0Z' },
  amygdala: { d: 'M126 142a6.5 6.5 0 1 0 13 0a6.5 6.5 0 1 0-13 0Z' },
  hippocampus: { d: 'M142 141C160 133 186 131 207 128', stroke: true },
  reticular: { d: 'M193 158L192 210', stroke: true },
}

function regionShape(id: BrainRegionId, color: string, opacity: number) {
  if (id === 'cortex') return <path key={id} d={CEREBRUM} fill={color} fillOpacity={opacity * 0.55} />
  if (id === 'cerebellum') return <path key={id} d={CEREBELLUM} fill={color} fillOpacity={opacity} />
  if (id === 'brainstem') return <path key={id} d={BRAINSTEM} fill={color} fillOpacity={opacity} />
  if (id === 'dmn') {
    return (
      <g key={id}>
        {regionShape('mpfc', color, opacity)}
        {regionShape('pcc', color, opacity)}
        {regionShape('parietal', color, opacity * 0.6)}
      </g>
    )
  }
  const cortex = CORTEX[id]
  if (cortex) return <path key={id} d={cortex} fill={color} fillOpacity={opacity} clipPath="url(#hh-cerebrum)" />
  const deep = DEEP[id]
  if (!deep) return null
  return deep.stroke ? (
    <path key={id} d={deep.d} fill="none" stroke={color} strokeWidth={id === 'reticular' ? 5 : 7} strokeLinecap="round" strokeOpacity={opacity + 0.15} />
  ) : (
    <path key={id} d={deep.d} fill={color} fillOpacity={opacity + 0.15} stroke={color} strokeWidth="1.5" strokeDasharray="3 2" />
  )
}

/**
 * Schemat mózgu z zaznaczonymi obszarami. Przełącznik obraca rysunek: przód–tył poziomo (lewo–prawo)
 * albo pionowo (góra–dół).
 */
export function BrainMap({ highlights, size = 'md' }: { highlights: BrainHighlight[]; size?: 'sm' | 'md' }) {
  const [vertical, setVertical] = useState(false)
  const all = highlights.filter((h) => h.regions.length)
  if (!all.length) return null
  const ids = [...new Set(all.flatMap((h) => h.regions))]

  return (
    <figure className="space-y-2 rounded-xl border border-line/70 bg-black/25 p-3">
      <div className="flex items-center justify-between gap-2">
        <figcaption className="font-display text-[10px] uppercase tracking-[0.18em] text-muted">Obszar mózgu</figcaption>
        <button
          type="button"
          onClick={() => setVertical(!vertical)}
          className="rounded-md border border-line px-2 py-0.5 text-[10px] text-muted hover:text-slate-100"
          title="Obróć rysunek"
        >
          {vertical ? '↻ przód → góra' : '↻ przód → lewo'}
        </button>
      </div>
      <div className={`relative mx-auto ${size === 'sm' ? 'max-w-[220px]' : 'max-w-[340px]'}`}>
        <svg
          viewBox={vertical ? '0 0 230 330' : '0 0 330 230'}
          className="w-full"
          role="img"
          aria-label={`Schemat mózgu: ${ids.map((id) => BRAIN_REGIONS[id].name).join(', ')}`}
        >
          <defs>
            <clipPath id="hh-cerebrum">
              <path d={CEREBRUM} />
            </clipPath>
          </defs>
          {/* w pionie obracamy o 90°: przód (lewa strona) trafia na górę */}
          <g transform={vertical ? 'translate(230 0) rotate(90)' : undefined}>
            <g transform="translate(0 4)">
              <path d={BRAINSTEM} fill="#0d1428" stroke="#2a3a60" strokeWidth="1.2" />
              <path d={CEREBELLUM} fill="#0d1428" stroke="#2a3a60" strokeWidth="1.2" />
              <path d={CEREBRUM} fill="#0d1428" stroke="#2a3a60" strokeWidth="1.4" />
              {/* bruzdy: środkowa, boczna, ciemieniowo-potyliczna; spoidło wielkie jako tło dla struktur głębokich */}
              <g fill="none" stroke="#24314f" strokeWidth="1.2" strokeLinecap="round">
                <path d="M175 18L152 113" />
                <path d="M84 138C110 126 160 112 210 104" />
                <path d="M251 34L250 100" />
                <path d="M116 96C140 74 188 70 214 90" strokeDasharray="2 3" />
                <path d="M222 168C238 160 260 163 272 172M218 180C236 172 258 176 268 184" />
              </g>
              {all.map((h, i) => (
                <g key={i} style={{ filter: `drop-shadow(0 0 4px ${h.color})` }}>
                  {h.regions.map((id) => regionShape(id, h.color, 0.45))}
                </g>
              ))}
            </g>
          </g>
          <text x="6" y={vertical ? 14 : 20} className="fill-muted font-mono text-[9px]">
            PRZÓD
          </text>
          <text x={vertical ? 6 : 300} y={vertical ? 322 : 20} className="fill-muted font-mono text-[9px]">
            TYŁ
          </text>
        </svg>
      </div>
      <ul className="flex flex-wrap gap-1.5">
        {all.map((h) =>
          h.regions.map((id) => (
            <li key={`${h.color}-${id}`} className="inline-flex items-center gap-1.5 rounded-full border border-line px-2 py-0.5 text-[10px] text-slate-300">
              <span
                className="size-2 rounded-full"
                style={BRAIN_REGIONS[id].deep ? { border: `1.5px dashed ${h.color}` } : { background: h.color }}
              />
              {BRAIN_REGIONS[id].name}
              {BRAIN_REGIONS[id].deep && <span className="text-muted">· głęboko</span>}
            </li>
          )),
        )}
      </ul>
    </figure>
  )
}
