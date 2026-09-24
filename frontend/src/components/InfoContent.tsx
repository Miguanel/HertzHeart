import type { ReactNode } from 'react'

/** Prosty format opisów: sekcje zaczynają się od „## Tytuł”, akapity oddziela pusta linia. */
export function InfoContent({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).filter((b) => b.trim())
  if (!blocks.length) return <p className="text-sm text-muted">Brak dodatkowych informacji.</p>
  return (
    <div className="space-y-3">
      {blocks.map((block, i) => {
        const [first, ...rest] = block.split('\n')
        const heading = first.startsWith('## ') ? first.slice(3) : null
        const body = heading ? rest.join('\n') : block
        return (
          <section key={i} className="space-y-1">
            {heading && <h4 className="font-display text-[11px] uppercase tracking-[0.18em] text-neon">{heading}</h4>}
            {body && <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">{body}</p>}
          </section>
        )
      })}
    </div>
  )
}

export function InfoHeader({ title, subtitle, badges }: { title: string; subtitle?: string; badges?: ReactNode }) {
  return (
    <div className="mb-4 space-y-1.5 border-b border-line/70 pb-4">
      <div className="text-lg font-medium text-slate-100">{title}</div>
      {subtitle && <div className="font-mono text-sm text-neon">{subtitle}</div>}
      {badges && <div className="flex flex-wrap gap-1.5">{badges}</div>}
    </div>
  )
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'neon' | 'warn' }) {
  const cls = {
    neutral: 'border-line text-muted',
    neon: 'border-neon/40 bg-neon/10 text-neon',
    warn: 'border-warn/40 bg-warn/10 text-warn',
  }[tone]
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] ${cls}`}>{children}</span>
}
