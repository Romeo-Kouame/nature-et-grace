/**
 * Mesure d'audience (Google Analytics 4), chargée UNIQUEMENT après accord du visiteur.
 *
 * - Sans `VITE_GA_ID` dans le `.env` du site : aucun outil n'est chargé et aucun bandeau ne s'affiche
 *   (le site n'utilise alors que des éléments indispensables, qui ne demandent pas de consentement).
 * - Avec `VITE_GA_ID=G-XXXXXXX` : le bandeau cookies demande l'accord ; « Refuser » est aussi visible qu'« Accepter ».
 */
export const GA_ID = (import.meta.env.VITE_GA_ID as string | undefined)?.trim() || ''
export const ANALYTICS_ENABLED = /^G-[A-Z0-9]+$/i.test(GA_ID)

export type Consent = 'accepted' | 'refused' | null
const KEY = 'ng_consent'

export function readConsent(): Consent {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'accepted' || v === 'refused' ? v : null
  } catch {
    return null
  }
}

const listeners = new Set<() => void>()
/** Le bandeau s'abonne pour se rouvrir quand le visiteur veut changer d'avis */
export const onConsentReopen = (fn: () => void) => {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}
export const reopenConsent = () => listeners.forEach((fn) => fn())

type Gtag = (...args: unknown[]) => void
declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: Gtag
  }
}

let loaded = false

function loadAnalytics() {
  if (loaded || !ANALYTICS_ENABLED) return
  loaded = true
  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments)
  }
  window.gtag('js', new Date())
  // Les pages vues sont envoyées à la main à chaque changement de page (application d'une seule page)
  window.gtag('config', GA_ID, { send_page_view: false })
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`
  document.head.appendChild(script)
}

export function saveConsent(value: 'accepted' | 'refused') {
  try {
    localStorage.setItem(KEY, value)
  } catch {
    /* navigation privée : le choix ne vaut que pour cette visite */
  }
  if (value === 'accepted') {
    loadAnalytics()
    trackPageView(window.location.pathname)
  } else if (loaded) {
    // Retrait de l'accord : on coupe l'envoi et on efface les cookies Google Analytics
    window.gtag?.('consent', 'update', { analytics_storage: 'denied' })
    document.cookie.split(';').map((c) => c.split('=')[0].trim()).filter((n) => n.startsWith('_ga'))
      .forEach((name) => {
        document.cookie = `${name}=; Max-Age=0; path=/`
        document.cookie = `${name}=; Max-Age=0; path=/; domain=.${window.location.hostname}`
      })
  }
}

/** À appeler au démarrage : recharge l'outil si le visiteur avait déjà accepté */
export function initAnalytics() {
  if (ANALYTICS_ENABLED && readConsent() === 'accepted') loadAnalytics()
}

export function trackPageView(path: string) {
  if (!loaded || readConsent() !== 'accepted') return
  window.gtag?.('event', 'page_view', { page_path: path, page_location: window.location.href, page_title: document.title })
}
