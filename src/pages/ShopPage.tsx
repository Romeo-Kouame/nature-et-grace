import React, { useMemo, useState } from 'react'
import { ArrowUpDown, Sparkles, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import ProductCardJumia from '../components/ProductCardJumia'
import { CATEGORIES } from '../data/products'
import { ProductCategory } from '../types'

export const ShopPage: React.FC<{ onOpenAdvisor: () => void }> = ({ onOpenAdvisor }) => {
  const { products, selectedCategory, setSelectedCategory, searchTerm, setSearchTerm } = useApp()
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured')

  const filteredProducts = useMemo(() => {
    let list = [...products]

    // Filtre par catégorie
    if (selectedCategory !== 'Toutes les catégories') {
      list = list.filter((p) => p.category === selectedCategory)
    }

    // Filtre par recherche
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      )
    }

    // Tri
    if (sortBy === 'price-asc') {
      list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
    } else if (sortBy === 'rating') {
      list.sort((a, b) => b.rating - a.rating)
    }

    return list
  }, [products, selectedCategory, searchTerm, sortBy])

  const LABELS: Record<string, string> = { 'Toutes les catégories': 'Tout' }

  return (
    <div className="ng-container ng-shop">
      <div className="ng-shop-head">
        <div>
          <h1>
            Boutique <span>{filteredProducts.length} produits</span>
          </h1>
          <p>Soins artisanaux ivoiriens, riches en bienfaits végétaux pour la peau et les cheveux.</p>
        </div>
        <button type="button" className="ng-btn ng-btn--ghost ng-btn--sm" onClick={onOpenAdvisor}>
          <Sparkles size={15} color="var(--ng-gold-600)" /> Rituel sur-mesure IA
        </button>
      </div>

      <div className="ng-toolbar">
        <div className="ng-chips" role="tablist" aria-label="Catégories">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={selectedCategory === cat}
              className={`ng-chip ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat as ProductCategory)}
            >
              {LABELS[cat] ?? cat}
            </button>
          ))}
        </div>
        <label className="ng-sort">
          <ArrowUpDown size={15} />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} aria-label="Trier">
            <option value="featured">Recommandés</option>
            <option value="price-asc">Prix croissant</option>
            <option value="price-desc">Prix décroissant</option>
            <option value="rating">Mieux notés</option>
          </select>
        </label>
      </div>

      {searchTerm && (
        <div className="ng-search-tag">
          Résultats pour « <b>{searchTerm}</b> »
          <button type="button" onClick={() => setSearchTerm('')} aria-label="Effacer la recherche">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Grille Jumia */}
      {filteredProducts.length === 0 ? (
        <div className="ng-empty">
          <p>
            Aucun soin ne correspond à votre sélection actuelle.
          </p>
          <button
            type="button"
            className="ng-btn ng-btn--primary"
            onClick={() => {
              setSelectedCategory('Toutes les catégories')
              setSearchTerm('')
            }}
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="jumia-products-grid">
          {filteredProducts.map((p, i) => (
            <ProductCardJumia product={p} key={p.id} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
export default ShopPage
