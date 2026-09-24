/** Wersja zbudowanej aplikacji, np. „24.09.2026 17:52”. */
export const APP_BUILD = __APP_BUILD__

export const APP_BUILD_LABEL = new Intl.DateTimeFormat('pl-PL', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(APP_BUILD))
