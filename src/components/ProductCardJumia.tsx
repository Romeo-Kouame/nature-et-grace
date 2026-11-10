import React, { useState } from 'react'
import { Check, Heart, ShoppingCart, Star } from 'lucide-react'
import { Product } from '../types'
import { useApp } from '../context/AppContext'
import { formatXof } from '../format'

interface ProductCardProps {
  product: Product
  /** 'grid' : carte verticale · 'row' : carte horizontale (produits phares) */
  variant?: 'grid' | 'row'
  /** Index pour décaler l'animation d'apparition */
  index?: number
}

export const formatPrice = formatXof

export const Stars: React.FC<{ rating: number; count?: number; size?: number }> = ({ rating, count, size = 13 }) => (
  <div className="ng-rating" aria-label={`Note ${rating} sur 5`}>
    {[1, 2, 3, 4, 5].map((i) => (
      <Star key={i} size={size} className={i <= Math.round(rating) ? '' : 'off'} fill="currentColor" strokeWidth={0} />
    ))}
    {count !== undefined && <span>({count})</span>}
  </div>
)

export const ProductCardJumia: React.FC<ProductCardProps> = ({ product, variant = 'grid', index = 0 }) => {
  const { navigate, addToCart, toggleFavorite, isFavorite } = useApp()
  const [added, setAdded] = useState(false)
  const [imgFailed, setImgFailed] = useState(false)
  const favorite = isFavorite(product.id)

  const handleBuy = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (addToCart(product.id, 1)) {
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
      <div className="ng-card-media">
        {product.discount && <span className="ng-discount">{product.discount}</span>}
        <button
          type="button"
          className={`ng-fav ${favorite ? 'active' : ''}`}
          onClick={handleFav}
          aria-label={favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Heart size={17} fill={favorite ? 'currentColor' : 'none'} />
        </button>
        {product.imageUrl && !imgFailed ? (
          <img src={product.imageUrl} alt={product.name} loading="lazy" onError={() => setImgFailed(true)} />
        ) : (
          <div className="ng-card-fallback">N&amp;G</div>
        )}
        {product.stock <= 0 ? (
          <span className="ng-stock-tag">Rupture de stock</span>
        ) : product.stock <= 6 ? (
          <span className="ng-stock-tag">Plus que {product.stock}</span>
        ) : null}
      </div>

      <div className="ng-card-body">
        <span className="ng-card-cat">
          {product.category} · {product.size}
        </span>
        <h3 className="ng-card-title">{product.name}</h3>
        <Stars rating={product.rating} count={product.reviewCount} />
        <div className="ng-card-foot">
          <div className="ng-price">
            <b>{formatPrice(product.price)}</b>
            {product.oldPrice ? <s>{formatPrice(product.oldPrice)}</s> : null}
          </div>
          <button
            type="button"
            className={`ng-cart-btn ${added ? 'added' : ''}`}
            onClick={handleBuy}
            aria-label={`Ajouter ${product.name} au panier`}
            disabled={product.stock <= 0}
          >
            {added ? <Check size={18} /> : <ShoppingCart size={18} />}
          </button>
        </div>
      </div>
    </article>
  )
}

export default ProductCardJumia
