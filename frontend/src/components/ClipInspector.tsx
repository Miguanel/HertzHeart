import { useState } from 'react'
import { DEFAULT_PRESET_OPTIONS, PRESETS, trackColor } from '../model/envelope'
import { formatHz } from '../model/frequency'
import { MIN_CLIP_S } from '../model/schema'
import { findClip, useProjectStore } from '../store/projectStore'
import { EnvelopeEditor } from './EnvelopeEditor'
import { Button, IconButton, NumberField, Panel } from './ui'

export function ClipInspector() {
  const comp = useProjectStore((s) => s.composition)
  const selectedClipId = useProjectStore((s) => s.selectedClipId)
  const setClipTiming = useProjectStore((s) => s.setClipTiming)
  const applyPreset = useProjectStore((s) => s.applyPreset)
  const removeClip = useProjectStore((s) => s.removeClip)
  const [opts, setOpts] = useState(DEFAULT_PRESET_OPTIONS)

  const found = findClip(comp, selectedClipId)
  if (!found) {
    return (
      <Panel title="Diagram segmentu" className="shrink-0" tour="inspector">
        <p className="p-6 text-center text-sm text-muted">Zaznacz segment na osi czasu, aby edytować jego diagram głośności.</p>
      </Panel>
    )
  }

  const { track, clip } = found
  const color = trackColor(comp.tracks.indexOf(track))

  return (
    <Panel
      className="shrink-0"
      tour="inspector"
      title={
        <span>
          Diagram · <span style={{ color }}>{track.name}</span>{' '}
          <span className="normal-case tracking-normal">{formatHz(track.frequencyMilliHz)} Hz</span>
        </span>
      }
      actions={<IconButton size="sm" icon="trash" label="Usuń segment" variant="danger" onClick={() => removeClip(clip.id)} />}
      bodyClassName="space-y-3 p-3 sm:p-4"
    >
      <div data-tour="inspector-timing" className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <NumberField label="Start [s]" value={clip.start} decimals={1} min={0} onCommit={(v) => setClipTiming(clip.id, v, clip.duration)} />
        <NumberField
          label="Długość [s]"
          value={clip.duration}
          decimals={1}
          min={MIN_CLIP_S}
          onCommit={(v) => setClipTiming(clip.id, clip.start, v)}
        />
        <NumberField
          label="Poziom szablonu [%]"
          value={opts.level * 100}
          decimals={0}
          min={0}
          max={100}
          onCommit={(v) => setOpts({ ...opts, level: v / 100 })}
        />
        <NumberField
          label="Narastanie / wygaszanie [s]"
          value={opts.fade}
          decimals={1}
          min={0}
          onCommit={(v) => setOpts({ ...opts, fade: v })}
        />
      </div>

      <div data-tour="inspector-presets" className="no-scrollbar -mx-3 flex gap-1.5 overflow-x-auto px-3 sm:mx-0 sm:flex-wrap sm:px-0">
        {PRESETS.map((p) => (
          <Button key={p.id} size="sm" onClick={() => applyPreset(clip.id, p.id, opts)}>
            {p.label}
          </Button>
        ))}
      </div>

      <EnvelopeEditor key={clip.id} clip={clip} color={color} />
    </Panel>
  )
}
