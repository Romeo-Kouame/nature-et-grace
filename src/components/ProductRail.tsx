import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { Product } from '../types'
import ProductCard, { ProductCardSkeleton } from './ProductCard'

interface ProductRailProps {
  title: string
  subtitle?: string
  products: Product[]
  /** Lien « Tout voir » à droite du titre */
  onSeeAll?: () => void
  seeAllLabel?: string
  loading?: boolean
  /** Défilement automatique (en ms) ; 0 pour le désactiver */
  autoplay?: number
}

/** En dessous de ce nombre, les cartes tiennent sur une ligne : on les montre en grille pleine largeur */
export const RAIL_MIN_PRODUCTS = 5

/**
 * Rangée de produits qui défile horizontalement, à la manière des grands sites marchands :
 * flèches sur ordinateur, glissé au doigt sur téléphone, et défilement automatique
 * qui s'arrête dès que le visiteur survole ou touche la rangée.
 */
export const ProductRail: React.FC<ProductRailProps> = ({
  title, subtitle, products, onSeeAll, seeAllLabel = 'Tout voir', loading = false, autoplay = 5000,
}) => {
  const trackRef = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)
  const paused = useRef(false)
  // Peu de produits : une grille qui occupe toute la largeur plutôt qu'une rangée à moitié vide
  const asGrid = !loading && products.length < RAIL_MIN_PRODUCTS

  const updateArrows = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    setCanPrev(el.scrollLeft > 4)
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    updateArrows()
    const el = trackRef.current
    if (!el) return
    el.addEventListener('scroll', updateArrows, { passive: true })
    window.addEventListener('resize', updateArrows)
    return () => {
      el.removeEventListener('scroll', updateArrows)
      window.removeEventListener('resize', updateArrows)
    }
  }, [updateArrows, products.length, loading])

  /** Avance d'environ une « page » de cartes (dir = 1 ou -1) */
  const scrollByPage = useCallback((dir: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    const card = el.firstElementChild as HTMLElement | null
    const step = card ? card.offsetWidth + 16 : 240
    const perPage = Math.max(1, Math.floor(el.clientWidth / step))
    el.scrollBy({ left: dir * step * perPage, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (!autoplay || loading || asGrid || products.length < 2) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => {
      const el = trackRef.current
      if (!el || paused.current || document.hidden) return
      // Rangée hors écran : inutile de la faire défiler
      const rect = el.getBoundingClientRect()
      if (rect.bottom < 0 || rect.top > window.innerHeight) return
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 4) el.scrollTo({ left: 0, behavior: 'smooth' })
      else scrollByPage(1)
    }, autoplay)
    return () => window.clearInterval(id)
  }, [autoplay, loading, asGrid, products.length, scrollByPage])

  const pause = () => { paused.current = true }
  const resume = () => { paused.current = false }

  return (
    <section className="ng-rail" aria-label={title}>
      <div className="ng-section-head">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {onSeeAll && (
          <button type="button" className="ng-link" onClick={onSeeAll}>
            {seeAllLabel} <ArrowRight size={15} />
          </button>
        )}
      </div>

      {asGrid ? (
        <div className="ng-grid ng-grid--fill" style={{ '--n': products.length } as React.CSSProperties}>
          {products.map((product, i) => <ProductCard product={product} key={product.id} index={i} />)}
        </div>
      ) : (
      <div className="ng-rail-wrap">
        <div
          className="ng-scroller ng-rail-track"
          ref={trackRef}
          onMouseEnter={pause}
          onMouseLeave={resume}
          onTouchStart={pause}
          onFocus={pause}
          onBlur={resume}
          aria-busy={loading || undefined}
        >
          {loading
            ? Array.from({ length: 5 }, (_, i) => <ProductCardSkeleton key={i} />)
            : products.map((product, i) => <ProductCard product={product} key={product.id} index={i} />)}
        </div>
        {canPrev && (
          <button type="button" className="ng-rail-side ng-rail-side--prev" onClick={() => scrollByPage(-1)} aria-label="Produits précédents">
            <ChevronLeft size={22} />
          </button>
        )}
        {canNext && (
          <button type="button" className="ng-rail-side ng-rail-side--next" onClick={() => scrollByPage(1)} aria-label="Produits suivants">
            <ChevronRight size={22} />
          </button>
        )}
      </div>
      )}
    </section>
  )
}

export default ProductRail
