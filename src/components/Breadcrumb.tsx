import React from 'react'
import { ChevronRight } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { SITE_URL, useJsonLd } from '../hooks/useJsonLd'

export type Crumb = { label: string; path?: string; onClick?: () => void }

/**
 * Fil d'Ariane : « Accueil › Boutique › Produit ».
 * Les étapes sont de vrais liens (suivis par les moteurs de recherche) et la page publie
 * les données structurées BreadcrumbList pour Google.
 */
export const Breadcrumb: React.FC<{ items: Crumb[] }> = ({ items }) => {
  const { navigate } = useApp()
  const all: Crumb[] = [{ label: 'Accueil', path: '/' }, ...items]

  useJsonLd('breadcrumb', {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: all.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      ...(c.path ? { item: `${SITE_URL}${c.path}` } : {}),
    })),
  })

  return (
    <nav className="ng-breadcrumb" aria-label="Fil d’Ariane">
      <ol>
        {all.map((c, i) => {
          const last = i === all.length - 1
          return (
            <li key={`${c.label}-${i}`}>
              {last ? (
                <span aria-current="page">{c.label}</span>
              ) : (
                <a
                  href={c.path ?? '#'}
                  onClick={(e) => {
                    e.preventDefault()
                    if (c.onClick) c.onClick()
                    else if (c.path) navigate(c.path)
                  }}
                >
                  {c.label}
                </a>
              )}
              {!last && <ChevronRight size={14} aria-hidden="true" />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default Breadcrumb
