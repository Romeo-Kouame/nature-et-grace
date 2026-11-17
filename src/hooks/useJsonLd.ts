import { useEffect } from 'react'

/** Adresse publique du site (pour les liens absolus des données structurées et du sitemap) */
export const SITE_URL = ((import.meta.env.VITE_SITE_URL as string | undefined) || window.location.origin).replace(/\/$/, '')

/**
 * Ajoute (ou met à jour) un bloc de données structurées JSON-LD dans <head>, lu par Google.
 * `data` à null retire le bloc.
 */
export function useJsonLd(id: string, data: Record<string, unknown> | null) {
  const json = data ? JSON.stringify(data) : ''
  useEffect(() => {
    const elementId = `ld-${id}`
    let el = document.getElementById(elementId) as HTMLScriptElement | null
    if (!json) {
      el?.remove()
      return
    }
    if (!el) {
      el = document.createElement('script')
      el.type = 'application/ld+json'
      el.id = elementId
      document.head.appendChild(el)
    }
    el.textContent = json
    return () => {
      document.getElementById(elementId)?.remove()
    }
  }, [id, json])
}
