import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import { useAnimationFrame, useDoubleTap } from '../hooks/usePlayback'
import { newId, valueAt } from '../model/envelope'
import type { Clip } from '../model/schema'
import { clamp, formatTime, round, snap } from '../model/time'
import { useProjectStore } from '../store/projectStore'
import { envelopeArea, envelopeLine, niceStep } from './envelopePath'
import { Button, IconButton, NumberField } from './ui'

const PAD = { l: 38, r: 14, t: 14, b: 24 }

export function EnvelopeEditor({ clip, color }: { clip: Clip; color: string }) {
  const setEnvelope = useProjectStore((s) => s.setEnvelope)
  const wrapRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const playheadRef = useRef<SVGLineElement>(null)
  const drag = useRef<string | null>(null)
  const [width, setWidth] = useState(640)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const points = clip.envelope
  const height = width < 520 ? 200 : 260
  const iw = Math.max(10, width - PAD.l - PAD.r)
  const ih = height - PAD.t - PAD.b
  const x = (t: number) => PAD.l + (t / clip.duration) * iw
  const y = (v: number) => PAD.t + (1 - v) * ih
  const tStep = clip.duration <= 30 ? 0.1 : clip.duration <= 600 ? 0.5 : 1
  const gridStep = niceStep(iw / clip.duration, 56)
  const selectedIndex = points.findIndex((p) => p.id === selectedId)
  const selected = selectedIndex >= 0 ? points[selectedIndex] : null
  const isEdge = selectedIndex === 0 || selectedIndex === points.length - 1

  useAnimationFrame((pos) => {
    const line = playheadRef.current
    if (!line) return
    const local = pos - clip.start
    const visible = local > 0 && local < clip.duration
    line.style.opacity = visible ? '1' : '0'
    if (visible) line.setAttribute('transform', `translate(${x(local) - PAD.l} 0)`)
  })

  const toData = (clientX: number, clientY: number) => {
    const r = svgRef.current!.getBoundingClientRect()
    return {
      t: clamp(((clientX - r.left - PAD.l) / iw) * clip.duration, 0, clip.duration),
      v: clamp(1 - (clientY - r.top - PAD.t) / ih, 0, 1),
    }
  }

  const movePoint = (id: string, t: number, v: number) => {
    const idx = points.findIndex((p) => p.id === id)
    if (idx < 0) return
    const last = points.length - 1
    const nt =
      idx === 0 ? 0 : idx === last ? clip.duration : clamp(snap(t, tStep), points[idx - 1].t, points[idx + 1].t)
    const nv = round(snap(v, 0.01), 2)
    setEnvelope(clip.id, points.map((p, i) => (i === idx ? { ...p, t: round(nt), v: nv } : p)))
  }

  const addPoint = (t: number, v: number) => {
    const point = { id: newId(), t: round(snap(t, tStep)), v: round(snap(v, 0.01), 2), curve: 'linear' as const }
    setEnvelope(clip.id, [...points, point])
    setSelectedId(point.id)
  }

  const addInLargestGap = () => {
    let best = 0
    for (let i = 1; i < points.length - 1; i++) if (points[i + 1].t - points[i].t > points[best + 1].t - points[best].t) best = i
    const t = (points[best].t + points[best + 1].t) / 2
    addPoint(t, valueAt(points, t))
  }

  const removeSelected = () => {
    if (!selected || isEdge) return
    setEnvelope(clip.id, points.filter((p) => p.id !== selected.id))
    setSelectedId(null)
  }

  const toggleCurve = () => {
    if (!selected || selectedIndex === 0) return
    setEnvelope(
      clip.id,
      points.map((p) => (p.id === selected.id ? { ...p, curve: p.curve === 'hold' ? 'linear' : 'hold' } : p)),
    )
  }

  const onBackgroundTap = useDoubleTap((e) => {
    const { t, v } = toData(e.clientX, e.clientY)
    addPoint(t, v)
  })

  const onPointDown = (e: RPointerEvent, id: string) => {
    e.stopPropagation()
    setSelectedId(id)
    svgRef.current?.setPointerCapture(e.pointerId)
    drag.current = id
  }

  return (
    <div className="space-y-2.5">
      <div ref={wrapRef} className="overflow-hidden rounded-xl border border-line/70 bg-void/60">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="block outline-none focus-visible:ring-1 focus-visible:ring-neon/60"
          style={{ touchAction: 'none' }}
          tabIndex={0}
          role="application"
          aria-label="Edytor diagramu głośności"
          onPointerDown={(e) => {
            setSelectedId(null)
            onBackgroundTap(e)
          }}
          onPointerMove={(e) => {
            if (!drag.current) return
            const { t, v } = toData(e.clientX, e.clientY)
            movePoint(drag.current, t, v)
          }}
          onPointerUp={() => (drag.current = null)}
          onPointerCancel={() => (drag.current = null)}
          onKeyDown={(e) => {
            if (e.key === 'Delete' || e.key === 'Backspace') removeSelected()
          }}
        >
          <defs>
            <linearGradient id={`fill-${clip.id}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={color} stopOpacity={0.35} />
              <stop offset="1" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((v) => (
            <g key={v}>
              <line x1={PAD.l} x2={PAD.l + iw} y1={y(v)} y2={y(v)} stroke="#16213a" strokeDasharray={v % 0.5 ? '3 4' : undefined} />
              <text x={PAD.l - 6} y={y(v) + 3} textAnchor="end" className="fill-muted font-mono text-[10px]">
                {v * 100}%
              </text>
            </g>
          ))}
          {Array.from({ length: Math.floor(clip.duration / gridStep) + 1 }, (_, i) => i * gridStep).map((t) => (
            <g key={t}>
              <line x1={x(t)} x2={x(t)} y1={PAD.t} y2={PAD.t + ih} stroke="#16213a" />
              <text x={x(t)} y={height - 7} textAnchor="middle" className="fill-muted font-mono text-[10px]">
                {formatTime(t, gridStep < 1 ? 1 : 0)}
              </text>
            </g>
          ))}

          <path d={envelopeArea(points, x, y)} fill={`url(#fill-${clip.id})`} />
          <path
            d={envelopeLine(points, x, y)}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinejoin="round"
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />

          <line
            ref={playheadRef}
            x1={PAD.l}
            x2={PAD.l}
            y1={PAD.t}
            y2={PAD.t + ih}
            stroke="var(--color-signal)"
            strokeWidth={1.5}
            opacity={0}
            pointerEvents="none"
          />

          {points.map((p) => {
            const active = p.id === selectedId
            return (
              <g key={p.id} style={{ cursor: 'grab' }} onPointerDown={(e) => onPointDown(e, p.id)}>
                <circle cx={x(p.t)} cy={y(p.v)} r={18} fill="transparent" />
                <circle
                  cx={x(p.t)}
                  cy={y(p.v)}
                  r={active ? 7 : 5.5}
                  fill={active ? '#fff' : '#070b16'}
                  stroke={color}
                  strokeWidth={2.5}
                  style={active ? { filter: `drop-shadow(0 0 6px ${color})` } : undefined}
                />
              </g>
            )
          })}
        </svg>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <Button size="sm" icon="plus" onClick={addInLargestGap}>
          Punkt
        </Button>
        {selected && (
          <>
            <NumberField
              label="Czas [s]"
              value={selected.t}
              decimals={1}
              min={0}
              max={clip.duration}
              onCommit={(t) => movePoint(selected.id, t, selected.v)}
              className="w-24"
            />
            <NumberField
              label="Poziom [%]"
              value={selected.v * 100}
              decimals={0}
              min={0}
              max={100}
              onCommit={(v) => movePoint(selected.id, selected.t, v / 100)}
              className="w-24"
            />
            <Button size="sm" onClick={toggleCurve} disabled={selectedIndex === 0} title="Kształt odcinka dochodzącego do punktu">
              {selected.curve === 'hold' ? 'Skok' : 'Liniowo'}
            </Button>
            <IconButton size="sm" icon="trash" label="Usuń punkt" variant="danger" onClick={removeSelected} disabled={isEdge} />
          </>
        )}
        <span className="ml-auto hidden text-[11px] text-muted md:inline">
          Przeciągnij punkt · dwuklik dodaje · Delete usuwa
        </span>
      </div>
    </div>
  )
}
