import { useId } from 'react'

/** Strona wsparcia autora na buycoffee.to. */
export const COFFEE_URL = 'https://buycoffee.to/elmigu'

/** Neonowa filiżanka kawy z parą – na powierzchni kawy fala jak w logo. */
export function CoffeeCup({ className = '', steam = true }: { className?: string; steam?: boolean }) {
  const id = useId()
  const body = `${id}-body`
  const glow = `${id}-glow`
  const brew = `${id}-brew`
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={glow} x1="0" x2="1">
          <stop offset="0" stopColor="#22e4ff" />
          <stop offset="1" stopColor="#c86bff" />
        </linearGradient>
        <linearGradient id={body} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a1430" />
          <stop offset="1" stopColor="#070b16" />
        </linearGradient>
        <radialGradient id={brew} cx="0.5" cy="0.5" r="0.6">
          <stop offset="0" stopColor="#c98a4b" />
          <stop offset="1" stopColor="#5a3418" />
        </radialGradient>
      </defs>
      {steam && (
        <g fill="none" stroke={`url(#${glow})`} strokeWidth="1.6" strokeLinecap="round">
          <path className="coffee-steam" d="M17 15c-2-2.5 2-4.5 0-7.5" />
          <path className="coffee-steam [animation-delay:0.6s]" d="M23 14c-2-2.5 2-4.5 0-8" />
          <path className="coffee-steam [animation-delay:1.2s]" d="M29 15c-2-2.5 2-4.5 0-7.5" />
        </g>
      )}
      {/* spodek */}
      <ellipse cx="23" cy="40.5" rx="17" ry="3.2" fill="#070b16" stroke={`url(#${glow})`} strokeWidth="1.3" opacity="0.85" />
      {/* ucho */}
      <path d="M35 23.5h2.2a4.3 4.3 0 0 1 0 8.6H34" fill="none" stroke={`url(#${glow})`} strokeWidth="2" strokeLinecap="round" />
      {/* filiżanka */}
      <path d="M9 19h28l-2.4 14.5A6 6 0 0 1 28.7 38.5h-11.4A6 6 0 0 1 11.4 33.5z" fill={`url(#${body})`} stroke={`url(#${glow})`} strokeWidth="1.6" strokeLinejoin="round" />
      {/* kawa */}
      <ellipse cx="23" cy="19" rx="14" ry="2.6" fill={`url(#${brew})`} stroke={`url(#${glow})`} strokeWidth="1.2" />
      <path d="M14.5 19c1.4-1.6 2.8-1.6 4.2 0s2.8 1.6 4.2 0 2.8-1.6 4.2 0 2.8 1.6 4.2 0" fill="none" stroke="#ffe2b8" strokeWidth="0.9" strokeLinecap="round" opacity="0.85" />
      {/* serce na filiżance */}
      <path d="M23 32.2c-3.2-2-4.6-3.6-4.6-5.3a2.3 2.3 0 0 1 4.6-.6 2.3 2.3 0 0 1 4.6.6c0 1.7-1.4 3.3-4.6 5.3z" fill="#c86bff" opacity="0.9" />
    </svg>
  )
}

const linkProps = { href: COFFEE_URL, target: '_blank', rel: 'noopener noreferrer' } as const

/** Mały przycisk z filiżanką do nagłówka. */
export function CoffeeButton({ className = '' }: { className?: string }) {
  return (
    <a
      {...linkProps}
      aria-label="Postaw mi kawę (buycoffee.to)"
      title="Postaw mi kawę ☕"
      className={`group inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-warn/30 bg-warn/[0.06] transition-colors hover:border-warn/60 hover:bg-warn/15 hover:shadow-[0_0_18px_-6px_var(--color-warn)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warn/60 ${className}`}
    >
      <CoffeeCup className="size-7 transition-transform group-hover:-translate-y-0.5" />
    </a>
  )
}

/** Większa karta „Postaw kawę” – np. w ustawieniach. */
export function CoffeeCard({ className = '' }: { className?: string }) {
  return (
    <a
      {...linkProps}
      className={`group flex items-center gap-4 rounded-xl border border-warn/30 bg-gradient-to-r from-warn/[0.08] via-plasma/[0.05] to-neon/[0.06] p-4 transition-colors hover:border-warn/60 hover:shadow-[0_0_28px_-10px_var(--color-warn)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warn/60 ${className}`}
    >
      <CoffeeCup className="size-16 shrink-0 drop-shadow-[0_0_10px_rgba(200,107,255,0.35)] transition-transform group-hover:-translate-y-0.5 group-hover:rotate-[-4deg]" />
      <span className="min-w-0 flex-1 space-y-1">
        <span className="block font-display text-[12px] uppercase tracking-[0.2em] text-warn">Postaw mi kawę</span>
        <span className="block text-xs leading-relaxed text-muted">
          Aplikacja jest darmowa. Jeśli Ci się przydaje, możesz wesprzeć jej rozwój małą kawą.
        </span>
        <span className="block font-mono text-[11px] text-slate-300 group-hover:text-warn">buycoffee.to/elmigu ↗</span>
      </span>
    </a>
  )
}
