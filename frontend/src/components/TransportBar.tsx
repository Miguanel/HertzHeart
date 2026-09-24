import { useState } from 'react'
import { engine } from '../audio/engine'
import { usePlaybackState, usePosition } from '../hooks/usePlayback'
import { compositionDuration } from '../model/envelope'
import { formatTime } from '../model/time'
import { useProjectStore } from '../store/projectStore'
import { togglePlay } from '../store/session'
import { IconButton, Slider } from './ui'

function MasterVolume() {
  const volume = useProjectStore((s) => s.composition.masterVolume)
  const setMasterVolume = useProjectStore((s) => s.setMasterVolume)
  return (
    <div className="flex w-full items-center gap-2">
      <Slider label="Głośność główna" value={volume} onChange={setMasterVolume} className="flex-1" />
      <span className="w-9 text-right font-mono text-xs tabular-nums text-muted">{Math.round(volume * 100)}%</span>
    </div>
  )
}

export function TransportBar() {
  const comp = useProjectStore((s) => s.composition)
  const state = usePlaybackState()
  const position = usePosition(100)
  const [showVolume, setShowVolume] = useState(false)
  const duration = compositionDuration(comp)

  return (
    <div data-tour="transport" className="glass relative flex items-center gap-2 px-2.5 py-2 sm:gap-3 sm:px-4">
      <IconButton
        size="lg"
        variant="primary"
        icon={state === 'playing' ? 'pause' : 'play'}
        label={state === 'playing' ? 'Pauza (spacja)' : 'Odtwórz (spacja)'}
        onClick={togglePlay}
        disabled={duration === 0}
        className="rounded-full!"
      />
      <IconButton icon="stop" label="Stop" onClick={() => engine.stop()} disabled={state === 'stopped'} />

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex justify-between font-mono text-[11px] tabular-nums sm:text-xs">
          <span className="text-neon">{formatTime(position)}</span>
          <span className="text-muted">{formatTime(duration)}</span>
        </div>
        <Slider
          label="Pozycja odtwarzania"
          value={Math.min(position, duration)}
          min={0}
          max={Math.max(duration, 0.1)}
          step={0.1}
          onChange={(v) => engine.seek(useProjectStore.getState().composition, v)}
        />
      </div>

      <div className="hidden w-44 items-center gap-2 sm:flex">
        <span className="text-muted" aria-hidden="true">
          ♪
        </span>
        <MasterVolume />
      </div>
      <IconButton icon="volume" label="Głośność główna" className="sm:hidden" active={showVolume} onClick={() => setShowVolume(!showVolume)} />
      {showVolume && (
        <div className="glass-solid absolute bottom-full right-2 mb-2 w-60 p-3 sm:hidden">
          <MasterVolume />
        </div>
      )}
    </div>
  )
}
