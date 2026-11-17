import React, { useEffect, useState } from 'react'
import { Cookie } from 'lucide-react'
import { ANALYTICS_ENABLED, onConsentReopen, readConsent, saveConsent } from '../analytics'
import { useApp } from '../context/AppContext'

/**
 * Bandeau cookies : affiché seulement si un outil de mesure d'audience est configuré
 * et que le visiteur n'a pas encore choisi. « Refuser » et « Accepter » ont exactement le même poids visuel.
 */
export const CookieBanner: React.FC = () => {
  const { navigate } = useApp()
  const [open, setOpen] = useState(() => ANALYTICS_ENABLED && readConsent() === null)

  useEffect(() => onConsentReopen(() => setOpen(true)), [])

  if (!ANALYTICS_ENABLED || !open) return null

  const choose = (value: 'accepted' | 'refused') => {
    saveConsent(value)
    setOpen(false)
  }

  return (
    <div className="ng-cookies" role="dialog" aria-modal="false" aria-labelledby="ng-cookies-title">
      <div className="ng-cookies-text">
        <Cookie size={22} aria-hidden="true" />
        <div>
          <b id="ng-cookies-title">Mesure d’audience</b>
          <p>
            Avec votre accord, nous comptons les visites (Google Analytics) pour améliorer la boutique. Aucune publicité.
            Vous pouvez changer d’avis à tout moment.{' '}
            <a
              href="/cookies"
              onClick={(e) => {
                e.preventDefault()
                navigate('/cookies')
              }}
            >
              En savoir plus
            </a>
          </p>
        </div>
      </div>
      <div className="ng-cookies-actions">
        <button type="button" className="ng-btn ng-btn--ghost" onClick={() => choose('refused')}>
          Refuser
        </button>
        <button type="button" className="ng-btn ng-btn--ghost" onClick={() => choose('accepted')}>
          Accepter
        </button>
      </div>
    </div>
  )
}

export default CookieBanner
