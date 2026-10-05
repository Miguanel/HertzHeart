import { create } from 'zustand'

/** Zdarzenie Chrome/Edge/Androida pozwalające pokazać okno instalacji aplikacji (PWA). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const standalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true)

export const useInstall = create<{ event: BeforeInstallPromptEvent | null; installed: boolean }>(() => ({
  event: null,
  installed: standalone(),
}))

/** iPhone/iPad nie mają przycisku instalacji – trzeba użyć „Udostępnij → Do ekranu początkowego”. */
export const isIos = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent)

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    useInstall.setState({ event: e as BeforeInstallPromptEvent })
  })
  window.addEventListener('appinstalled', () => useInstall.setState({ event: null, installed: true }))
}

export async function promptInstall() {
  const e = useInstall.getState().event
  if (!e) return
  await e.prompt()
  const { outcome } = await e.userChoice
  useInstall.setState({ event: null, installed: outcome === 'accepted' })
}
