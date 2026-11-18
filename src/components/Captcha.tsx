import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

/**
 * Captcha Cloudflare Turnstile (le plus souvent invisible : une simple case « vérification réussie »).
 * Le script n'est chargé que sur les formulaires qui en ont besoin, et seulement si une clé publique est configurée.
 * Le jeton est vérifié par l'API (jamais dans le navigateur) et ne sert qu'une fois :
 * après chaque envoi, le formulaire appelle `reset()` pour en obtenir un nouveau.
 */

const SITEKEY = (import.meta.env.VITE_TURNSTILE_SITEKEY as string | undefined)?.trim() ?? ''
export const CAPTCHA_ENABLED = SITEKEY.length > 0

export type CaptchaAction = 'login' | 'signup' | 'google' | 'review'

export interface CaptchaHandle {
  /** Jeton actuel, ou null s'il n'est pas (encore) disponible */
  token: () => string | null
  /** Nouveau jeton après un envoi (les jetons sont à usage unique) */
  reset: () => void
}

type TurnstileApi = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string
  reset: (id: string) => void
  remove: (id: string) => void
}
declare global {
  interface Window { turnstile?: TurnstileApi }
}

let scriptPromise: Promise<TurnstileApi> | null = null
function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.defer = true
      script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile indisponible')))
      script.onerror = () => {
        scriptPromise = null
        reject(new Error('Turnstile indisponible'))
      }
      document.head.appendChild(script)
    })
  }
  return scriptPromise
}

export const Captcha = forwardRef<CaptchaHandle, { action: CaptchaAction }>(({ action }, ref) => {
  const boxRef = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)
  const tokenRef = useRef<string | null>(null)
  const [failed, setFailed] = useState(false)

  useImperativeHandle(ref, () => ({
    token: () => tokenRef.current,
    reset: () => {
      tokenRef.current = null
      if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current)
    },
  }))

  useEffect(() => {
    if (!CAPTCHA_ENABLED) return
    let cancelled = false
    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !boxRef.current) return
        widgetId.current = turnstile.render(boxRef.current, {
          sitekey: SITEKEY,
          action,
          language: 'fr',
          theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
          size: 'flexible',
          callback: (token: string) => { tokenRef.current = token },
          'expired-callback': () => { tokenRef.current = null },
          'error-callback': () => { tokenRef.current = null },
        })
      })
      .catch(() => !cancelled && setFailed(true))
    return () => {
      cancelled = true
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current)
      widgetId.current = null
      tokenRef.current = null
    }
  }, [action])

  if (!CAPTCHA_ENABLED) return null
  return (
    <div className="ng-captcha">
      <div ref={boxRef} />
      {failed && <p className="ng-form-hint">La vérification anti-robot n’a pas pu se charger. Vérifiez votre connexion puis rechargez la page.</p>}
    </div>
  )
})
Captcha.displayName = 'Captcha'

/** Jeton à joindre à l'envoi ; lève une erreur lisible si la vérification n'est pas terminée. */
export function requireCaptcha(handle: CaptchaHandle | null): string | undefined {
  if (!CAPTCHA_ENABLED) return undefined
  const token = handle?.token()
  if (!token) throw new Error('Vérification anti-robot en cours… patientez une seconde puis réessayez.')
  return token
}

export default Captcha
