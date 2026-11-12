import React, { useRef, useState } from 'react'
import { Check, Heart, MessageCircle, ShoppingCart, Star } from 'lucide-react'
import { Product } from '../types'
import { useApp } from '../context/AppContext'
import { formatXof } from '../format'
import ProductVisual from './ProductVisual'
import { flyToCart } from '../flyToCart'

export const BADGE_LABELS = { bestseller: 'Meilleure vente', new: 'Nouveau' } as const

interface ProductCardProps {
  product: Product
  /** 'grid' : carte verticale · 'row' : carte horizontale */
  variant?: 'grid' | 'row'
  /** Index pour décaler l'animation d'apparition */
  index?: number
}

export const formatPrice = formatXof

export const Stars: React.FC<{ rating: number; count?: number; size?: number }> = ({ rating, count, size = 13 }) => (
  <div className="ng-rating" aria-label={`Note ${rating.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} sur 5`}>
    {[1, 2, 3, 4, 5].map((i) => (
      <Star key={i} size={size} className={i <= Math.round(rating) ? '' : 'off'} fill="currentColor" strokeWidth={0} />
    ))}
    {count !== undefined && <span>({count})</span>}
  </div>
)

export const ProductCard: React.FC<ProductCardProps> = ({ product, variant = 'grid', index = 0 }) => {
  const { navigate, addToCart, toggleFavorite, isFavorite, ratingFor, catalogLive, waLink } = useApp()
  const [added, setAdded] = useState(false)
  const mediaRef = useRef<HTMLDivElement>(null)
  const altImage = product.gallery?.[0]
  const favorite = isFavorite(product.id)
  const rating = ratingFor(product.id)
  const outOfStock = catalogLive && product.stock <= 0
  const priceUnknown = product.price === null

  const handleBuy = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (priceUnknown) {
      window.open(waLink(`Bonjour NATURE & GRÂCE, quel est le prix de « ${product.name} » ?`), '_blank', 'noopener,noreferrer')
      return
    }
    if (addToCart(product.id, 1)) {
      flyToCart(mediaRef.current)
      setAdded(true)
      window.setTimeout(() => setAdded(false), 1400)
    }
  }

  const handleFav = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleFavorite(product.id)
  }

  return (
    <article
      className={`ng-card ${variant === 'row' ? 'ng-card--row' : ''}`}
      onClick={() => navigate(`/produit/${product.id}`)}
      data-reveal
      style={{ '--i': index % 6 } as React.CSSProperties}
    >
      <div className={`ng-card-media ${altImage && product.imageUrl ? 'has-alt' : ''}`} ref={mediaRef}>
        {product.badge && BADGE_LABELS[product.badge] && (
          <span className={`ng-badge-tag ng-badge-tag--${product.badge}`}>{BADGE_LABELS[product.badge]}</span>
        )}
        <button
          type="button"
          className={`ng-fav ${favorite ? 'active' : ''}`}
          onClick={handleFav}
          aria-label={favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Heart size={17} fill={favorite ? 'currentColor' : 'none'} />
        </button>
        <ProductVisual product={product} />
        {altImage && product.imageUrl && <img className="ng-card-alt" src={altImage} alt="" loading="lazy" aria-hidden="true" />}
        {outOfStock ? (
          <span className="ng-stock-tag">Rupture de stock</span>
        ) : catalogLive && product.stock <= 3 ? (
          <span className="ng-stock-tag">Plus que {product.stock}</span>
        ) : null}
      </div>

      <div className="ng-card-body">
        <span className="ng-card-cat">
          {product.category} · {product.size}
        </span>
        <h3 className="ng-card-title">
          <a
            href={`/produit/${product.id}`}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              navigate(`/produit/${product.id}`)
            }}
          >
            {product.name}
          </a>
        </h3>
        {rating && <Stars rating={rating.average} count={rating.count} />}
        <div className="ng-card-foot">
          <div className="ng-price">
            <b>{formatPrice(product.price)}</b>
          </div>
          <button
            type="button"
            className={`ng-cart-btn ${added ? 'added' : ''}`}
            onClick={handleBuy}
            aria-label={priceUnknown ? `Demander le prix de ${product.name} sur WhatsApp` : `Ajouter ${product.name} au panier`}
            title={priceUnknown ? 'Demander le prix sur WhatsApp' : 'Ajouter au panier'}
            disabled={outOfStock}
          >
            {added ? <Check size={18} /> : priceUnknown ? <MessageCircle size={18} /> : <ShoppingCart size={18} />}
          </button>
        </div>
      </div>
    </article>
  )
}

/** Carte « squelette » affichée pendant le chargement du catalogue */
export const ProductCardSkeleton: React.FC<{ variant?: 'grid' | 'row' }> = ({ variant = 'grid' }) => (
  <div className={`ng-card ng-card--skeleton ${variant === 'row' ? 'ng-card--row' : ''}`} aria-hidden="true">
    <div className="ng-card-media ng-skel" />
    <div className="ng-card-body">
      <span className="ng-skel ng-skel-line" style={{ width: '45%' }} />
      <span className="ng-skel ng-skel-line" style={{ width: '85%', height: 16 }} />
      <span className="ng-skel ng-skel-line" style={{ width: '35%', height: 18, marginTop: 'auto' }} />
    </div>
  </div>
)

/** Ordre « Notre sélection » : meilleures ventes, puis nouveautés, puis le reste */
export const BADGE_ORDER = (p: Product) => (p.badge === 'bestseller' ? 0 : p.badge === 'new' ? 1 : 2)

export default ProductCard
