import React from 'react'
import { API_BASE } from '../api'

type State = { failed: boolean }

/**
 * Filet de sécurité : si une erreur imprévue fait planter l'affichage, le visiteur voit un message clair
 * (avec WhatsApp pour commander quand même) au lieu d'un écran blanc. L'erreur est signalée au serveur.
 */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error) {
    reportClientError(error.message, window.location.pathname)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="ng-crash" role="alert">
        <img src="/logo.jpeg" alt="Nature & Grâce" width={72} height={72} />
        <h1>Oups, un problème d’affichage est survenu.</h1>
        <p>Rechargez la page. Si le problème continue, vous pouvez commander directement sur WhatsApp.</p>
        <div className="ng-crash-actions">
          <button type="button" onClick={() => window.location.reload()}>
            Recharger la page
          </button>
          <a href="https://wa.me/2250798419730" target="_blank" rel="noreferrer">
            Écrire sur WhatsApp
          </a>
        </div>
      </div>
    )
  }
}

/** Envoie au serveur un court message d'erreur (sans aucune donnée personnelle) pour qu'il soit journalisé. */
export function reportClientError(message: string, path: string) {
  try {
    void fetch(`${API_BASE}/client-errors`, {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: String(message).slice(0, 300), path: path.slice(0, 200) }),
    }).catch(() => undefined)
  } catch {
    /* le signalement ne doit jamais provoquer d'autre erreur */
  }
}

export default ErrorBoundary
