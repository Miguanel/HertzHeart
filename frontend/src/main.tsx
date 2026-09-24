import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'
import { APP_BUILD } from './version'

// Tryb autoUpdate: gdy na serwerze jest nowa wersja, service worker ją pobiera i strona się przeładowuje.
registerSW({ immediate: true })

console.info(`[HeartzHeart] wersja z ${APP_BUILD}`)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
