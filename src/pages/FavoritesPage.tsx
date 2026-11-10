import React from 'react'
import { Heart, ShoppingBag } from 'lucide-react'
import { useApp } from '../context/AppContext'
import ProductCardJumia from '../components/ProductCardJumia'

export const FavoritesPage: React.FC = () => {
  const { products, favorites, navigate } = useApp()

  const favoriteProducts = products.filter((p) => favorites.includes(p.id))

  return (
    <div style={{ padding: '30px 4% 70px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <span style={{ fontSize: '10px', color: 'var(--brand-gold)', letterSpacing: '0.14em', fontWeight: 600 }}>
          VOTRE LISTE D’ENVIES
        </span>
        <h1 style={{ font: "500 clamp(26px, 3.5vw, 36px) 'Playfair Display', serif", margin: '4px 0 6px', color: 'var(--text-primary)' }}>
          Mes Soins Favoris ({favoriteProducts.length})
        </h1>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
          Retrouvez tous vos coups de cœur NATURE & GRÂCE pour les ajouter facilement à votre panier.
        </p>
      </div>

      {favoriteProducts.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '70px 20px',
            background: 'var(--bg-surface)',
            borderRadius: '16px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ color: '#d1d5db', display: 'inline-block', marginBottom: '16px' }}>
            <Heart size={48} strokeWidth={1.5} />
          </div>
          <h3 style={{ font: "500 22px 'Playfair Display', serif", margin: '0 0 8px', color: 'var(--text-primary)' }}>
            Votre liste de favoris est vide
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '380px', margin: '0 auto 20px' }}>
            Cliquez sur le petit cœur présent sur les fiches produits pour sauvegarder vos soins préférés ici.
          </p>
          <button
            type="button"
            className="button primary"
            style={{ background: 'var(--brand-green)' }}
            onClick={() => navigate('/boutique')}
          >
            Découvrir le catalogue
          </button>
        </div>
      ) : (
        <div className="jumia-products-grid">
          {favoriteProducts.map((p) => (
            <ProductCardJumia product={p} key={p.id} />
          ))}
        </div>
      )}
    </div>
  )
}
export default FavoritesPage
