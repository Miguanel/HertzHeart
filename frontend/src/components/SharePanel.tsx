import { useEffect, useState, type ReactNode } from 'react'
import { createShortLink } from '../api/client'
import { buildShareUrl, compositionToFile, downloadBlob } from '../share/codec'
import { useProjectStore } from '../store/projectStore'
import { Button } from './ui'

const LONG_LINK = 8000

function Section({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <section className="space-y-2 rounded-xl border border-line/70 bg-white/[0.02] p-3">
      <h3 className="font-display text-[11px] uppercase tracking-[0.2em] text-slate-200">{title}</h3>
      <p className="text-xs text-muted">{hint}</p>
      {children}
    </section>
  )
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export function SharePanel({ onExportWav, exporting }: { onExportWav: () => void; exporting: boolean }) {
  const comp = useProjectStore((s) => s.composition)
  const [link, setLink] = useState<{ for: typeof comp; url: string } | null>(null)
  const [short, setShort] = useState<{ for: typeof comp; url: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const canNativeShare = typeof navigator.share === 'function'

  useEffect(() => {
    let alive = true
    buildShareUrl(comp)
      .then((url) => alive && setLink({ for: comp, url }))
      .catch(() => alive && setMessage('Ta przeglądarka nie obsługuje kompresji linków – użyj pliku projektu.'))
    return () => {
      alive = false
    }
  }, [comp])

  const hashUrl = link?.for === comp ? link.url : null
  const shortUrl = short?.for === comp ? short.url : null

  const copy = async (text: string) => setMessage((await copyText(text)) ? 'Skopiowano do schowka.' : 'Nie udało się skopiować – zaznacz link ręcznie.')

  const nativeShare = async (url: string) => {
    try {
      await navigator.share({ title: comp.title, text: `Projekt HeartzHeart: ${comp.title}`, url })
    } catch {
      /* użytkownik anulował */
    }
  }

  const makeShort = async () => {
    setBusy(true)
    setMessage(null)
    try {
      setShort({ for: comp, url: await createShortLink(comp) })
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Błąd serwera.')
    } finally {
      setBusy(false)
    }
  }

  const shareFile = async () => {
    const file = compositionToFile(comp)
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: comp.title })
        return
      } catch {
        /* anulowano – pobierz plik */
      }
    }
    downloadBlob(file, file.name)
  }

  const linkBox = (url: string) => (
    <div className="space-y-2">
      <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="field h-9 w-full font-mono text-xs text-neon outline-none" />
      <div className="flex gap-2">
        <Button size="sm" icon="copy" onClick={() => void copy(url)}>
          Kopiuj
        </Button>
        {canNativeShare && (
          <Button size="sm" icon="share" onClick={() => void nativeShare(url)}>
            Wyślij…
          </Button>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-3">
      {message && <p className="rounded-lg border border-neon/30 bg-neon/5 p-2.5 text-xs text-slate-200">{message}</p>}

      <Section title="Link z projektem" hint="Cały projekt jest zakodowany w adresie. Działa bez serwera; odbiorca dostaje własną kopię.">
        {hashUrl ? linkBox(hashUrl) : <p className="text-xs text-muted">Generowanie…</p>}
        {hashUrl && hashUrl.length > LONG_LINK && (
          <p className="text-xs text-warn">Link jest bardzo długi – niektóre komunikatory mogą go uciąć. Użyj krótkiego linku.</p>
        )}
      </Section>

      <Section title="Krótki link" hint="Migawka projektu zapisana na serwerze. Zmiany wprowadzone później wymagają nowego linku.">
        {shortUrl ? (
          linkBox(shortUrl)
        ) : (
          <Button size="sm" icon="link" onClick={() => void makeShort()} disabled={busy}>
            {busy ? 'Tworzenie…' : 'Utwórz krótki link'}
          </Button>
        )}
      </Section>

      <Section title="Plik projektu" hint="Plik .heartz.json do zachowania kopii lub przesłania dalej (import w zakładce Projekty).">
        <Button size="sm" icon="file" onClick={() => void shareFile()}>
          {canNativeShare ? 'Udostępnij / pobierz plik' : 'Pobierz plik'}
        </Button>
      </Section>

      <Section
        title="Audio WAV"
        hint="Nagranie całej kompozycji (mono, 16 bit). Na telefonie odtwarzacz plików gra także przy zablokowanym ekranie. Maks. 60 minut."
      >
        <Button size="sm" icon="download" onClick={onExportWav} disabled={exporting || comp.tracks.length === 0}>
          {exporting ? 'Renderowanie…' : 'Eksportuj WAV'}
        </Button>
      </Section>
    </div>
  )
}
