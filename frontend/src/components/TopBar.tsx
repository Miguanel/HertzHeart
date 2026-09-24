import { useState } from 'react'
import { useStore } from 'zustand'
import { useSaveStatus } from '../store/autosave'
import { redo, undo, useProjectStore } from '../store/projectStore'
import { useTour } from '../tour/tourStore'
import { Button, IconButton } from './ui'

function Logo() {
  return (
    <div className="flex shrink-0 items-center gap-2.5">
      <svg viewBox="0 0 32 32" className="size-8 drop-shadow-[0_0_8px_var(--color-neon)]" aria-hidden="true">
        <defs>
          <linearGradient id="lg" x1="0" x2="1">
            <stop offset="0" stopColor="#22e4ff" />
            <stop offset="1" stopColor="#c86bff" />
          </linearGradient>
        </defs>
        <rect x="1.5" y="1.5" width="29" height="29" rx="8" fill="#070b16" stroke="url(#lg)" strokeWidth="1.5" />
        <path d="M5 16c2.2-7 4.4-7 6.6 0s4.4 7 6.6 0 4.4-7 6.6 0" fill="none" stroke="url(#lg)" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
      <span className="neon-text hidden font-display text-[13px] tracking-[0.28em] text-neon sm:inline">
        HEARTZ<span className="text-plasma">//</span>HEART
      </span>
    </div>
  )
}

const STATUS_LABEL = { idle: '', saving: 'Zapisywanie…', saved: 'Zapisano lokalnie', error: 'Błąd zapisu' } as const

export function TopBar({ onProjects, onShare }: { onProjects: () => void; onShare: () => void }) {
  const title = useProjectStore((s) => s.composition.title)
  const setTitle = useProjectStore((s) => s.setTitle)
  const canUndo = useStore(useProjectStore.temporal, (s) => s.pastStates.length > 0)
  const canRedo = useStore(useProjectStore.temporal, (s) => s.futureStates.length > 0)
  const status = useSaveStatus((s) => s.status)
  const offerTour = useTour((s) => s.offer)
  const [draft, setDraft] = useState<string | null>(null)

  const commit = () => {
    if (draft !== null) setTitle(draft.trim() || 'Bez tytułu')
    setDraft(null)
  }

  return (
    <header className="flex items-center gap-2 px-3 pb-3 pt-[max(env(safe-area-inset-top),0.75rem)] sm:gap-3 sm:px-5">
      <Logo />
      <div className="flex min-w-0 flex-1 flex-col">
        <input
          data-tour="title"
          aria-label="Nazwa projektu"
          value={draft ?? title}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          className="min-w-0 truncate rounded-md bg-transparent px-2 py-0.5 font-display text-sm tracking-wide text-slate-100 outline-none hover:bg-white/5 focus:bg-white/5 focus:ring-1 focus:ring-neon/50 sm:text-base"
        />
        <span className={`px-2 text-[10px] ${status === 'error' ? 'text-rose-300' : 'text-muted'}`} aria-live="polite">
          {STATUS_LABEL[status]}
        </span>
      </div>
      <div className="flex items-center gap-1 sm:gap-1.5">
        <IconButton icon="help" label="Poradnik" onClick={offerTour} data-tour="help-button" />
        <IconButton icon="undo" label="Cofnij (Ctrl+Z)" onClick={undo} disabled={!canUndo} data-tour="undo" />
        <IconButton icon="redo" label="Ponów (Ctrl+Shift+Z)" onClick={redo} disabled={!canRedo} className="max-sm:hidden" />
        <Button variant="primary" icon="share" onClick={onShare} aria-label="Udostępnij i eksportuj" data-tour="share-button">
          <span className="hidden sm:inline">Udostępnij</span>
        </Button>
        <Button icon="folder" onClick={onProjects} className="max-lg:hidden" data-tour="projects-button">
          Projekty
        </Button>
      </div>
    </header>
  )
}
