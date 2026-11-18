import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight, Check, Heart, Leaf, MessageCircle, Minus, Plus, Share2, ShieldCheck, Sparkles, Truck } from 'lucide-react'
import { useApp } from '../context/AppContext'
import ProductRail from '../components/ProductRail'
import { BADGE_LABELS, Stars } from '../components/ProductCard'
import { flyToCart } from '../flyToCart'
import ProductVisual from '../components/ProductVisual'
import { PRODUCT_DETAILS, ProductDetails } from '../data/productDetails'
import { categoryAndSize, formatXof, knownSize } from '../format'
import Breadcrumb from '../components/Breadcrumb'
import { usePageMeta } from '../hooks/usePageMeta'

const DEFAULT_DETAILS: ProductDetails = {
  benefits: ['Soin d’origine naturelle sélectionné par Nature & Grâce', 'Pour nourrir et protéger la peau au quotidien'],
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
  const [showBuyBar, setShowBuyBar] = useState(false)
  const product = products.find((p) => p.id === productId)
  usePageMeta(
    product?.name ?? 'Produit introuvable',
    product ? `${product.name}${knownSize(product.size) ? ` (${knownSize(product.size)})` : ''} — ${product.description}` : undefined,
  )

  useEffect(() => {
    setQuantity(1)
    setActiveTab('benefits')
    setPhotoIndex(0)
  }, [productId])

  // Téléphone : la barre d'achat est visible dès l'arrivée sur la fiche (elle remplace la barre d'onglets)
  useEffect(() => {
    setShowBuyBar(product !== undefined)
    return () => setShowBuyBar(false)
  }, [productId, product !== undefined])

  useEffect(() => {
    document.body.classList.toggle('has-buybar', showBuyBar)
    return () => document.body.classList.remove('has-buybar')
  }, [showBuyBar])

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
  ].slice(0, 10)

  const openCategory = () => {
    setSearchTerm('')
    setSelectedCategory(product.category)
    navigate('/boutique')
  }

  const whatsappText = !priceKnown
    ? `Bonjour Nature & Grâce,\n\nJe suis intéressée par « ${product.name} ». Pouvez-vous m’indiquer son prix et sa contenance ? Merci !`
    : inStock
      ? `Bonjour Nature & Grâce,\n\nJe souhaite commander :\n• ${product.name}${knownSize(product.size) ? ` (${knownSize(product.size)})` : ''} x${quantity} — ${formatXof(total)}\n\nPouvez-vous me préciser la livraison et le paiement Wave ? Merci !`
      : `Bonjour Nature & Grâce,\n\n« ${product.name} » est en rupture sur le site. Pouvez-vous me prévenir dès son retour ? Merci !`

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

  const trustItems = (
    <>
      <li>
        <Truck size={18} />
        <span>
          <b>Livraison</b> {settings.deliveryCommunes}
        </span>
      </li>
      <li>
        <ShieldCheck size={18} />
        <span>
          <b>Paiement Wave</b> Après confirmation de la boutique
        </span>
      </li>
      <li>
        <Leaf size={18} />
        <span>
          <b>Soin naturel</b> Sélectionné auprès de productrices ivoiriennes
        </span>
      </li>
    </>
  )

  const add = () => {
    // Le panier s'ouvre pour tout le monde ; la connexion n'est demandée qu'au moment de valider
    if (!addToCart(product.id, quantity)) return
    flyToCart(mediaRef.current)
    window.setTimeout(() => setCartOpen(true), 650)
  }

  return (
    <div className="ng-container ng-subpage">
      <Breadcrumb
        items={[
          { label: 'Boutique', path: '/boutique' },
          { label: product.category, path: '/boutique', onClick: openCategory },
          { label: product.name },
        ]}
      />

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
        {/* Ordinateur : les promesses de la boutique remplissent l'espace sous la photo */}
        <ul className="ng-pdp-trust ng-pdp-trust--side">{trustItems}</ul>
        </div>

        <div className="ng-pdp-info">
          <h1>{product.name}</h1>
          <p className="ng-pdp-cat">{categoryAndSize(product.category, product.size)}</p>

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

          <div className="ng-pdp-cta">
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

          <a className={`ng-btn ${priceKnown && inStock ? 'ng-btn--wa-outline' : 'ng-btn--wa'}`} href={waLink(whatsappText)} target="_blank" rel="noreferrer">
            <MessageCircle size={18} /> {!priceKnown ? 'Demander le prix sur WhatsApp' : inStock ? 'Commander sur WhatsApp' : 'Me prévenir sur WhatsApp'}
          </a>
          </div>

          <button type="button" className="ng-pdp-ai" onClick={() => setAdvisorOpen(true)}>
            <Sparkles size={16} />
            <span>
              Ce soin convient-il à ma peau ? <b>Demander à la conseillère</b>
            </span>
          </button>

          <ul className="ng-pdp-trust ng-pdp-trust--inline">{trustItems}</ul>

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
                    <dd>{knownSize(product.size) || 'Communiquée par la boutique sur demande'}</dd>
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
        <ProductRail title="Vous aimerez aussi" products={similarProducts} onSeeAll={() => navigate('/boutique')} />
      )}

      {/* Téléphone : barre d'achat collante en bas de l'écran, à la place de la barre d'onglets.
          Rendue hors de <main> : l'animation de la page (transform) empêcherait sinon le position: fixed. */}
      {createPortal(
      <div className={`ng-buybar ${showBuyBar ? 'show' : ''}`} aria-hidden={!showBuyBar}>
        {currentPhoto && <img src={currentPhoto} alt="" />}
        <div className="ng-buybar-info">
          <b>{product.name}</b>
          <span>{formatXof(product.price)}</span>
        </div>
        {priceKnown && inStock ? (
          <>
            <a className="ng-buybar-wa" href={waLink(whatsappText)} target="_blank" rel="noreferrer" aria-label="Commander sur WhatsApp">
              <MessageCircle size={19} />
            </a>
            <button type="button" className="ng-btn ng-btn--primary" onClick={add}>
              Ajouter au panier
            </button>
          </>
        ) : (
          <a className="ng-btn ng-btn--wa" href={waLink(whatsappText)} target="_blank" rel="noreferrer">
            <MessageCircle size={17} /> {!priceKnown ? 'Prix' : 'Me prévenir'}
          </a>
        )}
      </div>,
      document.querySelector('.app-shell') ?? document.body,
      )}
    </div>
  )
}

export default ProductDetailPage
