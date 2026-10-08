import { useSyncExternalStore, type ReactNode } from 'react'
import { engine } from '../audio/engine'
import { formatHz } from '../model/frequency'
import { MAX_DECIMALS, MAX_SMOOTHING_S, MAX_STOP_FADE_S, MIN_SMOOTHING_S, MIN_STOP_FADE_S, useSettings } from '../store/settings'
import { CoffeeCard } from './Coffee'
import { Slider } from './ui'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-xl border border-line/70 bg-white/[0.02] p-4">
      <h3 className="font-display text-[11px] uppercase tracking-[0.2em] text-neon">{title}</h3>
      {children}
    </section>
  )
}

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden="true"
        className={`mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full border p-0.5 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-neon/60 ${
          checked ? 'border-neon/60 bg-neon/25' : 'border-line bg-white/5'
        }`}
      >
        <span className={`size-3.5 rounded-full transition-transform ${checked ? 'translate-x-4 bg-neon' : 'bg-muted'}`} />
      </span>
      <span className="space-y-0.5">
        <span className="block text-sm text-slate-200">{label}</span>
        {hint && <span className="block text-xs leading-relaxed text-muted">{hint}</span>}
      </span>
    </label>
  )
}

const usePrecise = () => useSyncExternalStore(engine.subscribe, () => engine.preciseOscillator)

export function SettingsPanel() {
  const s = useSettings()
  const precise = usePrecise()
  const example = formatHz(432_123.4567, s.decimals)

  return (
    <div className="space-y-4">
      <Section title="Tryb pracy">
        <Toggle
          checked={s.simpleMode}
          onChange={s.setSimpleMode}
          label="Tryb prosty"
          hint="Wersja okrojona z opisów i analiz (fale mózgowe, CFC, komunikaty). W zakładce Binauralne na wierzchu jest „Szybkie uruchamianie”: projekty zapisane na urządzeniu uruchamiasz jednym dotknięciem, zapisujesz fale jako projekt i kopię pliku na telefonie."
        />
      </Section>

      <Section title="Bufor łagodzący zmiany">
        <p className="text-xs leading-relaxed text-muted">
          Każda zmiana w trakcie odtwarzania (częstotliwość, głośność, kanał, diagram, wyciszenie, dodanie lub usunięcie ścieżki,
          pokrętła binauralne) nie jest wykonywana skokowo, tylko płynnie w podanym czasie. Częstotliwość przesuwa się po rampie,
          a generator gra ciągle – bez przeskoku fazy, który słychać jako trzask.
        </p>
        <div className="flex items-center gap-3">
          <Slider
            label="Czas bufora"
            value={s.smoothing}
            min={MIN_SMOOTHING_S}
            max={MAX_SMOOTHING_S}
            step={0.05}
            onChange={s.setSmoothing}
            className="flex-1"
          />
          <span className="w-14 text-right font-mono text-sm tabular-nums text-neon">{s.smoothing.toFixed(2)} s</span>
        </div>
        <div className="space-y-1">
          <div className="text-sm text-slate-200">Delikatne wygaszanie przy zatrzymaniu</div>
          <div className="flex items-center gap-3">
            <Slider
              label="Czas wygaszania"
              value={s.stopFade ?? 2}
              min={MIN_STOP_FADE_S}
              max={MAX_STOP_FADE_S}
              step={0.1}
              onChange={s.setStopFade}
              className="flex-1"
            />
            <span className="w-14 text-right font-mono text-sm tabular-nums text-neon">{(s.stopFade ?? 2).toFixed(1)} s</span>
          </div>
          <p className="text-xs leading-relaxed text-muted">
            Stop, pauza i wyłączenie fali binauralnej nie ucinają dźwięku – głośność opada płynnie (krzywa wykładnicza, równo w decybelach).
          </p>
        </div>
        <Toggle
          checked={s.smoothTransport}
          onChange={s.setSmoothTransport}
          label="Łagodny start, pauza i przewijanie"
          hint="Łagodne wejście przy starcie (maks. 1,5 s), wygaszanie przy zatrzymaniu (czas powyżej) i przenikanie przy przewijaniu (maks. 0,3 s)."
        />
        <p className="text-xs leading-relaxed text-muted">
          Ochrona wyjścia działa zawsze: filtr składowej stałej, limiter oraz płynne wyciszenie i powrót dźwięku, gdy urządzenie
          zgłosi problem (zmiana słuchawek, przerwanie przez system, wybudzenie z uśpienia).
        </p>
      </Section>

      <Section title="Dokładność częstotliwości">
        <div className="grid grid-cols-8 gap-1" role="radiogroup" aria-label="Miejsca po przecinku">
          {Array.from({ length: MAX_DECIMALS + 1 }, (_, d) => (
            <button
              key={d}
              type="button"
              role="radio"
              aria-checked={s.decimals === d}
              onClick={() => s.setDecimals(d)}
              className={`h-9 rounded-lg border font-mono text-sm transition-colors ${
                s.decimals === d ? 'border-neon/60 bg-neon/15 text-neon' : 'border-line text-muted hover:text-slate-100'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
        <div className="flex items-baseline justify-between gap-2 rounded-lg bg-black/30 px-3 py-2">
          <span className="text-xs text-muted">Przykład</span>
          <span className="font-mono text-base text-neon">{example} Hz</span>
        </div>
        <p className="text-xs leading-relaxed text-muted">
          Liczba miejsc po przecinku przy wpisywaniu i wyświetlaniu częstotliwości – od 1 Hz do 0,0000001 Hz. Wartości
          zapisane z większą dokładnością są zachowane, nawet jeśli wyświetlasz mniej cyfr.
        </p>
        <p className="text-xs leading-relaxed text-muted">
          Generator:{' '}
          {precise === null ? (
            <span className="text-slate-300">uruchomi się przy pierwszym odtworzeniu</span>
          ) : precise ? (
            <span className="text-signal">precyzyjny 64-bit – pełna dokładność 0,0000001 Hz</span>
          ) : (
            <span className="text-warn">standardowy (float32, ok. 0,0001 Hz) – przeglądarka nie obsługuje generatora precyzyjnego lub strona nie działa przez HTTPS</span>
          )}
          . Bezwzględna dokładność zależy też od zegara karty dźwiękowej (zwykle ±20 ppm), ale różnica między kanałami
          w dudnieniu binauralnym jest zachowana dokładnie.
        </p>
      </Section>

      <Section title="Fale mózgowe">
        <Toggle
          checked={s.brainwaveNotices}
          onChange={s.setBrainwaveNotices}
          label="Informuj o paśmie fal mózgowych"
          hint="Po dodaniu ścieżki lub zmianie częstotliwości pokazuje, do jakiej podsekcji (Delta, Theta, Alpha, SMR, Beta, Gamma, Ripples…) należy i jakie ma opisane efekty. Dla par L/P – częstotliwość dudnienia."
        />
      </Section>
      <CoffeeCard />
    </div>
  )
}
