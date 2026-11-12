import { useEffect } from 'react'

const BRAND = 'NATURE & GRÂCE'
const DEFAULT_DESCRIPTION =
  'Soins naturels au beurre de cacao de Côte d’Ivoire : beurre de cacao brut, chantilly, savon noir de cabosse et huiles végétales. Commande sur le site ou WhatsApp, paiement Wave.'

function setMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.content = content
}

/** Titre d'onglet et description de la page (moteurs de recherche et partages WhatsApp). */
export function usePageMeta(title?: string, description = DEFAULT_DESCRIPTION) {
  useEffect(() => {
    const fullTitle = title ? `${title} · ${BRAND}` : `${BRAND} — Prenez soin de vous naturellement`
    document.title = fullTitle
    setMeta('meta[name="description"]', 'name', 'description', description)
    setMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle)
    setMeta('meta[property="og:description"]', 'property', 'og:description', description)
  }, [title, description])
}
