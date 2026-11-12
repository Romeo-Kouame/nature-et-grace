import React from 'react'
import { ArrowRight, Heart } from 'lucide-react'
import { useApp } from '../context/AppContext'
import ProductCard from '../components/ProductCard'
import { usePageMeta } from '../hooks/usePageMeta'

export const FavoritesPage: React.FC = () => {
  const { products, favorites, navigate } = useApp()
  const favoriteProducts = products.filter((p) => favorites.includes(p.id))
  usePageMeta('Mes favoris')

  return (
    <div className="ng-container ng-subpage">
      <header className="ng-page-head ng-page-head--left">
        <h1>
          Mes favoris <span>{favoriteProducts.length}</span>
        </h1>
        <p>Vos coups de cœur, prêts à rejoindre votre panier.</p>
      </header>

      {favoriteProducts.length === 0 ? (
        <div className="ng-empty ng-empty--icon">
          <span className="ng-empty-ico">
            <Heart size={28} />
          </span>
          <h3>Aucun favori pour l’instant</h3>
          <p>Touchez le cœur sur un produit pour le retrouver ici.</p>
          <button type="button" className="ng-btn ng-btn--primary" onClick={() => navigate('/boutique')}>
            Découvrir la boutique <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <div className="ng-grid">
          {favoriteProducts.map((p, i) => (
            <ProductCard product={p} key={p.id} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}

export default FavoritesPage
