import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import AdminApp from './AdminApp'
import ErrorBoundary, { reportClientError } from './components/ErrorBoundary'

// Erreurs hors affichage (code asynchrone) : signalées au serveur pour garder une trace
window.addEventListener('error', (e) => reportClientError(e.message, window.location.pathname))
window.addEventListener('unhandledrejection', (e) => {
  const reason = e.reason instanceof Error ? e.reason.message : String(e.reason)
  // Les pannes réseau sont déjà affichées au visiteur et ne sont pas des bugs
  if (!/joindre la boutique|Failed to fetch/i.test(reason)) reportClientError(reason, window.location.pathname)
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>{window.location.pathname.startsWith('/admin') ? <AdminApp /> : <App />}</ErrorBoundary>
  </React.StrictMode>,
)
