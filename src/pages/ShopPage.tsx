import React, { useMemo, useState } from 'react'
import { ArrowUpDown, Sparkles, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import ProductCard, { BADGE_ORDER, ProductCardSkeleton } from '../components/ProductCard'
import { ALL_CATEGORIES } from '../types'
import { usePageMeta } from '../hooks/usePageMeta'

const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export const ShopPage: React.FC = () => {
  const { products, categories, selectedCategory, setSelectedCategory, searchTerm, setSearchTerm, setAdvisorOpen, catalogLoading } = useApp()
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured')
  usePageMeta(selectedCategory === ALL_CATEGORIES ? 'Boutique' : selectedCategory)

  const filteredProducts = useMemo(() => {
    let list = [...products]
    if (selectedCategory !== ALL_CATEGORIES) list = list.filter((p) => p.category === selectedCategory)
    if (searchTerm.trim()) {
      const q = normalize(searchTerm.trim())
      list = list.filter((p) => normalize(`${p.name} ${p.category} ${p.description}`).includes(q))
    }
    // Les prix à confirmer passent après les prix connus
    const price = (v: number | null, dir: 1 | -1) => (v === null ? Number.POSITIVE_INFINITY : dir * v)
    if (sortBy === 'price-asc') list.sort((a, b) => price(a.price, 1) - price(b.price, 1))
    else if (sortBy === 'price-desc') list.sort((a, b) => price(a.price, -1) - price(b.price, -1))
    else list.sort((a, b) => BADGE_ORDER(a) - BADGE_ORDER(b))
    return list
  }, [products, selectedCategory, searchTerm, sortBy])

  const chips = [ALL_CATEGORIES, ...categories]

  return (
    <div className="ng-container ng-shop">
      <div className="ng-shop-head">
        <div>
          <h1>
            Boutique <span>{filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''}</span>
          </h1>
          <p>Soins artisanaux ivoiriens au cacao et aux végétaux, pour la peau et les cheveux.</p>
        </div>
        <button type="button" className="ng-btn ng-btn--ghost ng-btn--sm" onClick={() => setAdvisorOpen(true)}>
          <Sparkles size={15} color="var(--ng-gold-600)" /> Rituel sur-mesure IA
        </button>
      </div>

      <div className="ng-toolbar">
        <div className="ng-chips" role="tablist" aria-label="Catégories">
          {chips.map((cat) => (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={selectedCategory === cat}
              className={`ng-chip ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === ALL_CATEGORIES ? 'Tout' : cat}
            </button>
          ))}
        </div>
        <label className="ng-sort">
          <ArrowUpDown size={15} />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} aria-label="Trier">
            <option value="featured">Notre sélection</option>
            <option value="price-asc">Prix croissant</option>
            <option value="price-desc">Prix décroissant</option>
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

      {catalogLoading ? (
        <div className="ng-grid ng-grid--shop" aria-busy="true" aria-label="Chargement des produits">
          {Array.from({ length: 8 }, (_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="ng-empty">
          <p>Aucun soin ne correspond à votre recherche.</p>
          <button
            type="button"
            className="ng-btn ng-btn--primary"
            onClick={() => {
              setSelectedCategory(ALL_CATEGORIES)
              setSearchTerm('')
            }}
          >
            Voir tous les produits
          </button>
        </div>
      ) : (
        <div className="ng-grid ng-grid--shop">
          {filteredProducts.map((p, i) => (
            <ProductCard product={p} key={p.id} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}

export default ShopPage
