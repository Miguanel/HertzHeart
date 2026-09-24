import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Button, IconButton } from '../components/ui'
import { useProjectStore } from '../store/projectStore'
import { useUi } from '../store/uiStore'
import { silence, type TourStep } from './steps'
import { APP_BUILD_LABEL } from '../version'
import { useTour } from './tourStore'

const PAD = 8
const MARGIN = 12

interface Box {
  top: number
  left: number
  width: number
  height: number
}

/** Śledzi położenie podświetlanego elementu (przewijanie, zmiana rozmiaru, animacje). */
function useTargetBox(step: TourStep | undefined, stepIndex: number): Box | null {
  const [box, setBox] = useState<Box | null>(null)

  useEffect(() => {
    if (!step?.target) {
      setBox(null)
      return
    }
    const selectors = step.target
    const find = () =>
      selectors
        .map((s) => document.querySelector(s))
        .find((el): el is Element => !!el && el.getBoundingClientRect().width > 0) ?? null

    let el: Element | null = null
    let raf = 0
    // Po zmianie widoku (zakładka, okno) element pojawia się w kolejnej klatce.
    const scrollTimer = setTimeout(() => {
      el = find()
      el?.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' })
    }, 80)

    const loop = () => {
      el = el?.isConnected ? el : find()
      const r = el?.getBoundingClientRect()
      setBox((prev) => {
        if (!r) return prev === null ? prev : null
        const next = { top: r.top, left: r.left, width: r.width, height: r.height }
        return prev && Math.abs(prev.top - next.top) < 0.5 && Math.abs(prev.left - next.left) < 0.5 &&
          Math.abs(prev.width - next.width) < 0.5 && Math.abs(prev.height - next.height) < 0.5
          ? prev
          : next
      })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      clearTimeout(scrollTimer)
      cancelAnimationFrame(raf)
    }
  }, [step, stepIndex])

  return box
}

function useViewport() {
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight })
  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return vp
}

function Running() {
  const { steps, step, next, back, end } = useTour()
  const current = steps[step]
  const box = useTargetBox(current, step)
  const vp = useViewport()
  const bubbleRef = useRef<HTMLDivElement>(null)
  const [bubbleH, setBubbleH] = useState(220)

  // Ustaw widok wymagany przez krok (zakładka biblioteki, otwarte okno, widok na telefonie).
  useEffect(() => {
    if (!current) return
    silence()
    const ui = useUi.getState()
    ui.setView(current.ui.view)
    ui.setSheet(current.ui.sheet ?? null)
    if (current.ui.libraryTab) ui.setLibraryTab(current.ui.libraryTab)
    const ps = useProjectStore.getState()
    if (!ps.selectedClipId && ps.composition.tracks[0]?.clips[0]) {
      ps.select(ps.composition.tracks[0].id, ps.composition.tracks[0].clips[0].id)
    }
  }, [current])

  useLayoutEffect(() => {
    if (bubbleRef.current) setBubbleH(bubbleRef.current.offsetHeight)
  })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') end()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') back()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, back, end])

  if (!current) return null

  const width = Math.min(380, vp.w - MARGIN * 2)
  let bubbleStyle: CSSProperties
  let spot: Box | null = null

  if (box) {
    spot = {
      top: Math.max(MARGIN / 2, box.top - PAD),
      left: Math.max(MARGIN / 2, box.left - PAD),
      width: Math.min(box.width + PAD * 2, vp.w - MARGIN),
      height: Math.min(box.height + PAD * 2, vp.h - MARGIN),
    }
    const below = vp.h - (spot.top + spot.height)
    const above = spot.top
    const left = Math.min(Math.max(MARGIN, box.left + box.width / 2 - width / 2), vp.w - width - MARGIN)
    if (below >= bubbleH + MARGIN * 2) bubbleStyle = { top: spot.top + spot.height + MARGIN, left }
    else if (above >= bubbleH + MARGIN * 2) bubbleStyle = { top: spot.top - bubbleH - MARGIN, left }
    // brak miejsca (duży element, np. cały panel na telefonie) – dymek przy dolnej krawędzi
    else bubbleStyle = { bottom: MARGIN + 8, left: (vp.w - width) / 2 }
  } else {
    bubbleStyle = { top: Math.max(MARGIN, (vp.h - bubbleH) / 2), left: (vp.w - width) / 2 }
  }

  const last = step === steps.length - 1
  const progress = ((step + 1) / steps.length) * 100

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label={`Poradnik: ${current.title}`}>
      {/* Przyciemnienie z „wycięciem” wokół elementu; blokuje kliknięcia pod spodem. */}
      {spot ? (
        <div
          className="pointer-events-none fixed rounded-xl border border-neon/80 transition-all duration-300 ease-out"
          style={{
            ...spot,
            boxShadow: '0 0 0 9999px rgb(2 4 10 / 0.72), 0 0 24px 2px color-mix(in oklab, var(--color-neon) 55%, transparent)',
          }}
        />
      ) : (
        <div className="fixed inset-0 bg-[rgb(2_4_10/0.72)] backdrop-blur-[2px]" />
      )}
      <div className="fixed inset-0" onClick={(e) => e.stopPropagation()} />

      <div
        ref={bubbleRef}
        className="glass-solid animate-slide-in fixed z-[71] flex flex-col gap-3 p-4 transition-[top,left,bottom] duration-300"
        style={{ ...bubbleStyle, width }}
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-muted">
            {step + 1} / {steps.length}
          </span>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-neon transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <IconButton size="sm" icon="close" label="Zakończ poradnik" onClick={end} />
        </div>
        <h3 className="font-display text-sm tracking-wide text-neon">{current.title}</h3>
        <p className="max-h-[40dvh] overflow-y-auto whitespace-pre-line text-sm leading-relaxed text-slate-200">{current.text}</p>
        {current.action && (
          <Button size="sm" variant="outline" className="self-start" onClick={current.action.run}>
            {current.action.label}
          </Button>
        )}
        <div className="flex items-center gap-2 pt-1">
          <Button size="sm" variant="ghost" onClick={end}>
            Pomiń
          </Button>
          <div className="ml-auto flex gap-2">
            <Button size="sm" onClick={back} disabled={step === 0}>
              Wstecz
            </Button>
            <Button size="sm" variant="primary" onClick={next} autoFocus>
              {last ? 'Zakończ' : 'Dalej'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Modal({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgb(2_4_10/0.75)] p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="glass-solid animate-slide-in w-full max-w-md space-y-4 p-5 sm:p-6">{children}</div>
    </div>
  )
}

function Welcome() {
  const { begin, dismissWelcome } = useTour()
  return (
    <Modal>
      <div className="flex items-center gap-3">
        <svg viewBox="0 0 32 32" className="size-10 drop-shadow-[0_0_10px_var(--color-neon)]" aria-hidden="true">
          <rect x="1.5" y="1.5" width="29" height="29" rx="8" fill="#070b16" stroke="#22e4ff" strokeOpacity=".6" />
          <path d="M5 16c2.2-7 4.4-7 6.6 0s4.4 7 6.6 0 4.4-7 6.6 0" fill="none" stroke="#22e4ff" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
        <h2 className="font-display text-lg tracking-wide text-neon">Witaj w HeartzHeart</h2>
      </div>
      <p className="text-sm leading-relaxed text-slate-200">
        HeartzHeart to sekwencer częstotliwości: wybierasz tony z biblioteki (albo wpisujesz własne z dokładnością do 0,001 Hz),
        układasz je na osi czasu i rysujesz, jak ma zmieniać się ich głośność.
      </p>
      <p className="text-sm leading-relaxed text-muted">
        Poradnik trwa ok. 3 minuty i krok po kroku pokazuje każdą funkcję na przykładowym projekcie z niską częstotliwością
        136,1 Hz. Twój obecny projekt zostanie zachowany.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <Button variant="primary" icon="play" className="flex-1" onClick={begin} autoFocus>
          Rozpocznij poradnik
        </Button>
        <Button variant="ghost" className="flex-1" onClick={dismissWelcome}>
          Nie teraz
        </Button>
      </div>
      <p className="text-center text-[11px] text-muted">
        Poradnik uruchomisz w każdej chwili przyciskiem „?” u góry ekranu.
        <br />
        Wersja aplikacji: {APP_BUILD_LABEL}
      </p>
    </Modal>
  )
}

function Finish() {
  const close = useTour((s) => s.close)
  const hadPrevious = useTour((s) => (s.previous?.tracks.length ?? 0) > 0)
  const [showAgain, setShowAgain] = useState(false)
  return (
    <Modal>
      <h2 className="font-display text-lg tracking-wide text-neon">Gotowe!</h2>
      <p className="text-sm leading-relaxed text-slate-200">
        Znasz już wszystkie funkcje. Najprościej zacząć od zakładki „Zestawy” w bibliotece albo dodać jedną częstotliwość i
        pobawić się jej diagramem głośności.
      </p>
      <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-line/70 p-3 text-sm text-slate-200">
        <input type="checkbox" checked={showAgain} onChange={(e) => setShowAgain(e.target.checked)} className="size-4 accent-[var(--color-neon)]" />
        Pokaż poradnik ponownie przy następnym uruchomieniu
      </label>
      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <Button variant="primary" className="flex-1" onClick={() => close({ keepDemo: !hadPrevious, showAgain })} autoFocus>
          {hadPrevious ? 'Wróć do mojego projektu' : 'Zacznij pracę'}
        </Button>
        {hadPrevious && (
          <Button variant="ghost" className="flex-1" onClick={() => close({ keepDemo: true, showAgain })}>
            Zostań przy projekcie demo
          </Button>
        )}
      </div>
    </Modal>
  )
}

export function Tour() {
  const phase = useTour((s) => s.phase)
  if (phase === 'closed') return null
  return createPortal(phase === 'welcome' ? <Welcome /> : phase === 'finish' ? <Finish /> : <Running />, document.body)
}
