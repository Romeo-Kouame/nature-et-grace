import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import { ArrowRight, Search, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { formatXof, matchesQuery } from '../format'
import { ALL_CATEGORIES } from '../types'
import ProductVisual from './ProductVisual'

const MAX_SUGGESTIONS = 6
/** Délai avant d'appliquer la saisie à la boutique, pour ne pas recalculer à chaque lettre */
const DEBOUNCE_MS = 180

/**
 * Barre de recherche « en direct » :
 * - sur la page Boutique, la liste des produits se filtre pendant la saisie ;
 * - ailleurs, une liste de suggestions s'ouvre sous la barre (photo, nom, prix).
 * Le catalogue est déjà chargé dans le navigateur : la recherche ne fait aucun appel au serveur.
 * Utilisable au clavier : flèches haut/bas, Entrée, Échap.
 */
export const SearchBox: React.FC<{ className?: string; autoFocus?: boolean }> = ({ className = '', autoFocus = false }) => {
  const { products, catalogLoading, currentPath, navigate, searchTerm, setSearchTerm, setSelectedCategory } = useApp()
  const [value, setValue] = useState(searchTerm)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const rootRef = useRef<HTMLFormElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()
  const onShop = currentPath === '/boutique'

  // Ouverture depuis l'icône loupe de l'en-tête : le curseur est directement dans le champ
  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  // Recherche effacée ailleurs (bouton « × » de la boutique, autre barre…) : on se resynchronise
  useEffect(() => {
    if (normalizedEqual(searchTerm, value)) return
    if (document.activeElement !== inputRef.current) setValue(searchTerm)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm])

  // Sur la boutique, la grille suit la saisie (avec un léger délai)
  useEffect(() => {
    if (!onShop || document.activeElement !== inputRef.current) return
    const id = window.setTimeout(() => setSearchTerm(value.trim()), DEBOUNCE_MS)
    return () => window.clearTimeout(id)
  }, [value, onShop, setSearchTerm])

  // Fermeture au clic extérieur
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => rootRef.current && !rootRef.current.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const query = value.trim()
  const matches = useMemo(() => {
    if (query.length < 2) return []
    return products.filter((p) => matchesQuery(`${p.name} ${p.category} ${p.description} ${p.size} ${(p.details?.benefits ?? []).join(' ')}`, query))
  }, [products, query])
  const suggestions = matches.slice(0, MAX_SUGGESTIONS)

  // Pas de liste déroulante sur la boutique : les résultats s'affichent directement dans la page
  const showPanel = open && !onShop && query.length >= 2

  useEffect(() => setActive(-1), [query])

  const goToResults = () => {
    setSearchTerm(query)
    setSelectedCategory(ALL_CATEGORIES)
    setOpen(false)
    inputRef.current?.blur()
    if (!onShop) navigate('/boutique')
  }

  const goToProduct = (id: string) => {
    setOpen(false)
    setValue('')
    setSearchTerm('')
    inputRef.current?.blur()
    navigate(`/produit/${id}`)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (showPanel && active >= 0 && suggestions[active]) goToProduct(suggestions[active].id)
    else goToResults()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setOpen(false)
      return
    }
    if (!showPanel || !suggestions.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
    }
  }

  const clear = () => {
    setValue('')
    setSearchTerm('')
    inputRef.current?.focus()
  }

  return (
    <form className={`ng-search ${className}`} onSubmit={handleSubmit} role="search" ref={rootRef}>
      <Search size={18} />
      <input
        ref={inputRef}
        type="search"
        placeholder="Rechercher un soin : beurre de cacao, savon noir…"
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        aria-label="Rechercher un produit"
        role="combobox"
        aria-expanded={showPanel}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showPanel && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
      />
      {value && (
        <button type="button" className="ng-search-clear" onClick={clear} aria-label="Effacer la recherche">
          <X size={16} />
        </button>
      )}
      <button type="submit" aria-label="Rechercher">
        <Search size={17} />
      </button>

      {showPanel && (
        <div className="ng-suggest" role="presentation">
          {catalogLoading ? (
            <p className="ng-suggest-empty">Chargement du catalogue…</p>
          ) : suggestions.length === 0 ? (
            <p className="ng-suggest-empty">
              Aucun soin ne correspond à « {query} ». Essayez « cacao », « karité » ou « savon ».
            </p>
          ) : (
            <>
              <ul id={listId} role="listbox" aria-label="Suggestions">
                {suggestions.map((p, i) => (
                  <li
                    key={p.id}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={i === active}
                    className={`ng-suggest-item ${i === active ? 'active' : ''}`}
                    onMouseEnter={() => setActive(i)}
                    // mousedown plutôt que click : évite que le champ perde le focus et ferme la liste avant le clic
                    onMouseDown={(e) => {
                      e.preventDefault()
                      goToProduct(p.id)
                    }}
                  >
                    <span className="ng-suggest-img">
                      <ProductVisual product={p} size="thumb" />
                    </span>
                    <span className="ng-suggest-text">
                      <b>{p.name}</b>
                      <small>
                        {p.category} · {p.size}
                      </small>
                    </span>
                    <span className="ng-suggest-price">{formatXof(p.price)}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="ng-suggest-all"
                onMouseDown={(e) => {
                  e.preventDefault()
                  goToResults()
                }}
              >
                Voir {matches.length > 1 ? `les ${matches.length} résultats` : 'le résultat'} dans la boutique <ArrowRight size={15} />
              </button>
            </>
          )}
        </div>
      )}
    </form>
  )
}

const normalizedEqual = (a: string, b: string) => a.trim() === b.trim()

export default SearchBox
