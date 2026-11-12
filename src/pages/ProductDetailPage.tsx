import React, { useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, ChevronRight, Heart, Leaf, MessageCircle, Minus, Plus, Share2, ShieldCheck, Sparkles, Truck } from 'lucide-react'
import { useApp } from '../context/AppContext'
import ProductCard, { BADGE_LABELS, Stars } from '../components/ProductCard'
import { flyToCart } from '../flyToCart'
import ProductVisual from '../components/ProductVisual'
import { PRODUCT_DETAILS, ProductDetails } from '../data/productDetails'
import { formatXof } from '../format'
import { usePageMeta } from '../hooks/usePageMeta'

const DEFAULT_DETAILS: ProductDetails = {
  benefits: ['Soin d’origine naturelle sélectionné par NATURE & GRÂCE', 'Pour nourrir et protéger la peau au quotidien'],
  howToUse: ['Appliquer sur peau propre et légèrement humide en massant délicatement.'],
  ingredients: 'Composition détaillée communiquée par la boutique sur demande.',
  origin: 'Côte d’Ivoire.',
}

const TABS = [
  { key: 'benefits', label: 'Bienfaits' },
  { key: 'howTo', label: 'Utilisation' },
  { key: 'ingredients', label: 'Composition' },
] as const

type TabKey = (typeof TABS)[number]['key']

export const ProductDetailPage: React.FC<{ productId: string }> = ({ productId }) => {
  const {
    products, navigate, addToCart, toggleFavorite, isFavorite, setSelectedCategory, setSearchTerm, showToast,
    ratingFor, reviews, catalogLive, maxQuantity, settings, waLink, setAdvisorOpen, setCartOpen, user,
  } = useApp()
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState<TabKey>('benefits')
  const [photoIndex, setPhotoIndex] = useState(0)
  const mediaRef = useRef<HTMLDivElement>(null)
  const product = products.find((p) => p.id === productId)
  usePageMeta(product?.name ?? 'Produit introuvable', product ? `${product.name} (${product.size}) — ${product.description}` : undefined)

  useEffect(() => {
    setQuantity(1)
    setActiveTab('benefits')
    setPhotoIndex(0)
  }, [productId])

  if (!product) {
    return (
      <div className="ng-container ng-subpage">
        <div className="ng-empty">
          <p>Ce produit n’existe pas ou n’est plus disponible.</p>
          <button type="button" className="ng-btn ng-btn--primary" onClick={() => navigate('/boutique')}>
            Voir la boutique <ArrowRight size={16} />
          </button>
        </div>
      </div>
    )
  }

  const favorite = isFavorite(product.id)
  const max = maxQuantity(product)
  const inStock = max > 0
  const priceKnown = product.price !== null
  const details = PRODUCT_DETAILS[product.id] ?? DEFAULT_DETAILS
  const total = product.price !== null ? product.price * quantity : null
  const rating = ratingFor(product.id)
  const photos = product.imageUrl ? [product.imageUrl, ...(product.gallery ?? [])] : []
  const currentPhoto = photos[Math.min(photoIndex, photos.length - 1)]
  const productReviews = reviews.filter((r) => r.productSlug === product.id).slice(0, 3)

  const similarProducts = [
    ...products.filter((p) => p.id !== product.id && p.category === product.category),
    ...products.filter((p) => p.id !== product.id && p.category !== product.category),
  ].slice(0, 4)

  const openCategory = () => {
    setSearchTerm('')
    setSelectedCategory(product.category)
    navigate('/boutique')
  }

  const whatsappText = !priceKnown
    ? `Bonjour NATURE & GRÂCE,\n\nJe suis intéressée par « ${product.name} ». Pouvez-vous m’indiquer son prix et sa contenance ? Merci !`
    : inStock
      ? `Bonjour NATURE & GRÂCE,\n\nJe souhaite commander :\n• ${product.name} (${product.size}) x${quantity} — ${formatXof(total)}\n\nPouvez-vous me préciser la livraison et le paiement Wave ? Merci !`
      : `Bonjour NATURE & GRÂCE,\n\n« ${product.name} » est en rupture sur le site. Pouvez-vous me prévenir dès son retour ? Merci !`

  const handleShare = async () => {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: product.name, url })
      else {
        await navigator.clipboard.writeText(url)
        showToast('Lien du produit copié')
      }
    } catch {
      /* partage annulé */
    }
  }

  const add = () => {
    // Client connecté : on montre le panier. Visiteur : il continue ses achats (le panier lui demandera de se connecter)
    if (!addToCart(product.id, quantity)) return
    flyToCart(mediaRef.current)
    if (user) window.setTimeout(() => setCartOpen(true), 650)
  }

  return (
    <div className="ng-container ng-subpage">
      <nav className="ng-breadcrumb" aria-label="Fil d’Ariane">
        <button type="button" onClick={() => navigate('/')}>
          Accueil
        </button>
        <ChevronRight size={14} />
        <button type="button" onClick={openCategory}>
          {product.category}
        </button>
        <ChevronRight size={14} />
        <span>{product.name}</span>
      </nav>

      <section className="ng-pdp">
        <div className="ng-pdp-gallery">
        <div className="ng-pdp-media" ref={mediaRef}>
          <div className="ng-pdp-media-actions">
            <button
              type="button"
              className={`ng-fav ${favorite ? 'active' : ''}`}
              onClick={() => toggleFavorite(product.id)}
              aria-label={favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <Heart size={18} fill={favorite ? 'currentColor' : 'none'} />
            </button>
            <button type="button" className="ng-fav" onClick={handleShare} aria-label="Partager ce produit">
              <Share2 size={17} />
            </button>
          </div>
          {product.badge && BADGE_LABELS[product.badge] && (
            <span className={`ng-badge-tag ng-badge-tag--${product.badge}`}>{BADGE_LABELS[product.badge]}</span>
          )}
          <ProductVisual key={currentPhoto ?? 'illustration'} product={{ ...product, imageUrl: currentPhoto ?? product.imageUrl }} size="hero" />
        </div>
        {photos.length > 1 && (
          <div className="ng-pdp-thumbs" role="group" aria-label="Photos du produit">
            {photos.map((url, i) => (
              <button
                key={url}
                type="button"
                className={i === photoIndex ? 'active' : ''}
                onClick={() => setPhotoIndex(i)}
                aria-label={`Voir la photo ${i + 1} sur ${photos.length}`}
                aria-pressed={i === photoIndex}
              >
                <img src={url} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        )}
        </div>

        <div className="ng-pdp-info">
          <span className="ng-eyebrow">
            {product.category} · {product.size}
          </span>
          <h1>{product.name}</h1>

          <div className="ng-pdp-meta">
            {rating && (
              <>
                <Stars rating={rating.average} size={15} />
                <span>
                  {rating.average.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} · {rating.count} avis
                </span>
              </>
            )}
            {catalogLive && (
              <span className={`ng-stock ${inStock ? (product.stock <= 3 ? 'low' : 'ok') : 'out'}`}>
                {inStock ? (product.stock <= 3 ? `Plus que ${product.stock} en stock` : 'En stock') : 'Rupture de stock'}
              </span>
            )}
          </div>

          <div className="ng-pdp-price">
            <b>{formatXof(product.price)}</b>
          </div>

          <p className="ng-pdp-desc">{product.description}</p>

          {priceKnown && inStock ? (
            <div className="ng-pdp-buy">
              <div className="ng-qty" role="group" aria-label="Quantité">
                <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Diminuer la quantité" disabled={quantity <= 1}>
                  <Minus size={16} />
                </button>
                <span aria-live="polite">{quantity}</span>
                <button type="button" onClick={() => setQuantity((q) => Math.min(max, q + 1))} aria-label="Augmenter la quantité" disabled={quantity >= max}>
                  <Plus size={16} />
                </button>
              </div>
              <button type="button" className="ng-btn ng-btn--primary ng-pdp-add" onClick={add}>
                Ajouter au panier · {formatXof(total)}
              </button>
            </div>
          ) : (
            <p className="ng-pdp-out">
              {priceKnown
                ? 'Ce soin est momentanément épuisé. Écrivez-nous pour être prévenue de son retour.'
                : 'Le prix et la contenance de ce soin sont communiqués par la boutique : demandez-les sur WhatsApp.'}
            </p>
          )}

          <a className="ng-btn ng-btn--wa" href={waLink(whatsappText)} target="_blank" rel="noreferrer">
            <MessageCircle size={18} /> {!priceKnown ? 'Demander le prix sur WhatsApp' : inStock ? 'Commander sur WhatsApp' : 'Me prévenir sur WhatsApp'}
          </a>

          <button type="button" className="ng-pdp-ai" onClick={() => setAdvisorOpen(true)}>
            <Sparkles size={16} />
            <span>
              Ce soin convient-il à ma peau ? <b>Demander au conseiller IA</b>
            </span>
          </button>

          <ul className="ng-pdp-trust">
            <li>
              <Truck size={18} /> {settings.deliveryCommunes}
            </li>
            <li>
              <ShieldCheck size={18} /> Paiement Wave après confirmation
            </li>
            <li>
              <Leaf size={18} /> Soin d’origine naturelle
            </li>
          </ul>

          <div className="ng-pdp-details">
            <div className="ng-segmented" role="tablist" aria-label="Informations produit">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === t.key}
                  className={activeTab === t.key ? 'active' : ''}
                  onClick={() => setActiveTab(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="ng-pdp-panel" key={activeTab} role="tabpanel">
              {activeTab === 'benefits' && (
                <ul className="ng-checklist">
                  {details.benefits.map((b) => (
                    <li key={b}>
                      <Check size={16} /> <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
              {activeTab === 'howTo' && (
                <>
                  <ol className="ng-steps">
                    {details.howToUse.map((h, i) => (
                      <li key={h}>
                        <span>{i + 1}</span> <p>{h}</p>
                      </li>
                    ))}
                  </ol>
                  <p className="ng-form-hint">
                    Faites d’abord un essai sur une petite zone de peau. Pendant la grossesse, pour un bébé ou une peau très réactive,
                    demandez conseil à un professionnel de santé.
                  </p>
                </>
              )}
              {activeTab === 'ingredients' && (
                <dl className="ng-specs">
                  <div>
                    <dt>Composition</dt>
                    <dd>{details.ingredients}</dd>
                  </div>
                  <div>
                    <dt>Origine</dt>
                    <dd>{details.origin}</dd>
                  </div>
                  <div>
                    <dt>Contenance</dt>
                    <dd>{product.size}</dd>
                  </div>
                </dl>
              )}
            </div>
          </div>
        </div>
      </section>


      {productReviews.length > 0 && (
        <section>
          <div className="ng-section-head">
            <h2>Avis sur ce soin</h2>
            <button type="button" className="ng-link" onClick={() => navigate('/temoignages')}>
              Tous les avis <ArrowRight size={15} />
            </button>
          </div>
          <div className="ng-reviews">
            {productReviews.map((rev) => (
              <article key={rev.id} className="ng-review-card">
                <div className="ng-review-top">
                  <Stars rating={rev.rating} size={14} />
                  <small>{new Date(rev.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</small>
                </div>
                <p>{rev.comment}</p>
                <footer>
                  <div className="ng-avatar">{rev.authorName.charAt(0).toUpperCase()}</div>
                  <div>
                    <b>{rev.authorName}</b>
                    <small>{rev.city}</small>
                  </div>
                </footer>
              </article>
            ))}
          </div>
        </section>
      )}

      {similarProducts.length > 0 && (
        <section>
          <div className="ng-section-head">
            <h2>Vous aimerez aussi</h2>
            <button type="button" className="ng-link" onClick={() => navigate('/boutique')}>
              Tout voir <ArrowRight size={15} />
            </button>
          </div>
          <div className="ng-grid">
            {similarProducts.map((p, i) => (
              <ProductCard product={p} key={p.id} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default ProductDetailPage
