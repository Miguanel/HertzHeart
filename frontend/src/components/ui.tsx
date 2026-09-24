import { useEffect, useState, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { formatHz, parseHz } from '../model/frequency'
import { Icon, type IconName } from './icons'

type Variant = 'primary' | 'outline' | 'ghost' | 'danger'

const VARIANTS: Record<Variant, string> = {
  primary: 'border-neon/50 bg-neon/15 text-neon hover:bg-neon/25 shadow-[0_0_20px_-6px_var(--color-neon)]',
  outline: 'border-line bg-white/[0.02] text-slate-200 hover:border-neon/50 hover:text-neon',
  ghost: 'border-transparent text-muted hover:bg-white/5 hover:text-slate-100',
  danger: 'border-rose-500/40 text-rose-300 hover:bg-rose-500/15',
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; icon?: IconName; size?: 'sm' | 'md' }

export function Button({ variant = 'outline', icon, size = 'md', className = '', children, ...rest }: ButtonProps) {
  const sz = size === 'sm' ? 'h-8 gap-1.5 px-2.5 text-xs' : 'h-10 gap-2 px-3.5 text-sm'
  return (
    <button
      type="button"
      className={`inline-flex shrink-0 select-none items-center justify-center rounded-lg border font-medium transition-colors disabled:pointer-events-none disabled:opacity-40 ${sz} ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {icon && <Icon name={icon} className={size === 'sm' ? 'size-4' : 'size-[18px]'} />}
      {children}
    </button>
  )
}

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: IconName
  label: string
  variant?: Variant
  active?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function IconButton({ icon, label, variant = 'ghost', active, size = 'md', className = '', ...rest }: IconButtonProps) {
  const sz = size === 'sm' ? 'size-8' : size === 'lg' ? 'size-12' : 'size-10'
  const iconSz = size === 'sm' ? 'size-4' : size === 'lg' ? 'size-6' : 'size-5'
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={`inline-flex shrink-0 items-center justify-center rounded-lg border transition-colors disabled:pointer-events-none disabled:opacity-40 ${sz} ${VARIANTS[active ? 'primary' : variant]} ${className}`}
      {...rest}
    >
      <Icon name={icon} className={iconSz} />
    </button>
  )
}

export function Panel({
  title,
  actions,
  children,
  className = '',
  bodyClassName = '',
  tour,
}: {
  title?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
  /** Punkt zaczepienia dla poradnika (data-tour). */
  tour?: string
}) {
  return (
    <section data-tour={tour} className={`glass flex min-h-0 flex-col ${className}`}>
      {(title || actions) && (
        <header className="flex min-h-12 items-center justify-between gap-2 border-b border-line/70 px-4 py-1.5">
          <h2 className="truncate font-display text-[11px] uppercase tracking-[0.22em] text-muted">{title}</h2>
          <div className="flex items-center gap-1">{actions}</div>
        </header>
      )}
      <div className={`min-h-0 flex-1 ${bodyClassName}`}>{children}</div>
    </section>
  )
}

/**
 * Panel boczny / pełnoekranowy. Renderowany przez portal w <body> – inaczej `backdrop-filter`
 * panelu-rodzica zamyka `position: fixed` w jego obrębie (okno byłoby ucięte).
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  tour,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  tour?: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Zamknij" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        data-tour={tour}
        className="glass-solid animate-slide-in relative flex h-full w-full flex-col pb-[env(safe-area-inset-bottom)] sm:max-w-md sm:rounded-l-2xl"
      >
        <header className="flex items-center justify-between border-b border-line/70 px-4 pb-3 pt-[max(env(safe-area-inset-top),0.75rem)]">
          <h2 className="font-display text-sm uppercase tracking-[0.22em] text-neon">{title}</h2>
          <IconButton icon="close" label="Zamknij" onClick={onClose} />
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

interface NumberFieldProps {
  value: number
  onCommit: (value: number) => void
  label?: string
  min?: number
  max?: number
  decimals?: number
  suffix?: string
  className?: string
}

/** Pole liczbowe zatwierdzane Enterem lub po opuszczeniu (bez zapisu każdej wciśniętej cyfry). */
export function NumberField({ value, onCommit, label, min = -Infinity, max = Infinity, decimals = 2, suffix, className = '' }: NumberFieldProps) {
  const [draft, setDraft] = useState<string | null>(null)
  const commit = () => {
    if (draft === null) return
    const n = Number(draft.replace(',', '.'))
    if (draft.trim() !== '' && Number.isFinite(n)) onCommit(Math.min(max, Math.max(min, n)))
    setDraft(null)
  }
  return (
    <label className={`flex min-w-0 flex-col gap-1 ${className}`}>
      {label && <span className="truncate text-[10px] uppercase tracking-wider text-muted">{label}</span>}
      <span className="field flex h-9 items-center gap-1">
        <input
          inputMode="decimal"
          value={draft ?? value.toFixed(decimals)}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
            if (e.key === 'Escape') setDraft(null)
          }}
          className="w-full min-w-0 bg-transparent font-mono text-sm tabular-nums outline-none"
        />
        {suffix && <span className="text-[11px] text-muted">{suffix}</span>}
      </span>
    </label>
  )
}

/** Częstotliwość z dokładnością 0,001 Hz. */
export function FrequencyField({ mHz, onCommit, className = '' }: { mHz: number; onCommit: (mHz: number) => void; className?: string }) {
  const [draft, setDraft] = useState<string | null>(null)
  const parsed = draft === null ? mHz : parseHz(draft)
  const commit = () => {
    if (draft !== null && parsed !== null) onCommit(parsed)
    setDraft(null)
  }
  return (
    <span className={`field flex h-8 items-center gap-1 ${parsed === null ? 'border-rose-500/70' : ''} ${className}`}>
      <input
        aria-label="Częstotliwość w Hz"
        inputMode="decimal"
        value={draft ?? formatHz(mHz)}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'Escape') setDraft(null)
        }}
        className="w-full min-w-0 bg-transparent font-mono text-sm tabular-nums text-neon outline-none"
      />
      <span className="text-[10px] text-muted">Hz</span>
    </span>
  )
}

export function Slider({
  value,
  onChange,
  label,
  min = 0,
  max = 1,
  step = 0.01,
  className = '',
}: {
  value: number
  onChange: (value: number) => void
  label: string
  min?: number
  max?: number
  step?: number
  className?: string
}) {
  const fill = max > min ? ((value - min) / (max - min)) * 100 : 0
  return (
    <input
      type="range"
      aria-label={label}
      title={label}
      className={`range ${className}`}
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{ '--fill': `${fill}%` } as CSSProperties}
    />
  )
}
