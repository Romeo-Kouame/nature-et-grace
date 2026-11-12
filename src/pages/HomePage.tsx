import React, { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Gift, Leaf, MessageCircle, MoreHorizontal, ShieldCheck, ShoppingBag, Sparkles, Truck, Wallet } from 'lucide-react'
import { useApp } from '../context/AppContext'
import ProductCard, { BADGE_ORDER, ProductCardSkeleton } from '../components/ProductCard'
import { CATEGORY_INFO, PHOTOS } from '../data/products'
import { formatXof } from '../format'
import { flyToCart } from '../flyToCart'
import { ALL_CATEGORIES } from '../types'
import { usePageMeta } from '../hooks/usePageMeta'

/** Du fruit au soin : le parcours raconté sur l'accueil (photos prises en Côte d'Ivoire et au Ghana) */
const JOURNEY = [
  { image: PHOTOS.cabosse, title: 'La cabosse', text: 'Le cacao mûrit sur les cacaoyers de Côte d’Ivoire, premier producteur au monde.' },
  { image: PHOTOS.cabosseOuverte, title: 'Les fèves', text: 'Les fèves sont extraites de la cabosse puis séchées au soleil.' },
  { image: PHOTOS.beurreCacao, title: 'Le beurre', text: 'Pressées, elles donnent un beurre brut, riche et nourrissant.' },
  { image: PHOTOS.kariteFouette, title: 'Votre soin', text: 'Fouetté, mélangé ou en savon : un soin simple pour la peau et les cheveux.' },
]

export const HomePage: React.FC = () => {
  const { products, categories, navigate, setSelectedCategory, setSearchTerm, reviews, settings, waLink, setAdvisorOpen, catalogLive, catalogLoading, addToCart } = useApp()
  const [reviewIndex, setReviewIndex] = useState(0)
  usePageMeta()

  const available = useMemo(
    () => products.filter((p) => p.price !== null && (!catalogLive || p.stock > 0)),
    [products, catalogLive],
  )
  const sorted = useMemo(() => [...(available.length ? available : products)].sort((a, b) => BADGE_ORDER(a) - BADGE_ORDER(b)), [available, products])
  const featured = sorted.slice(0, 4)
  const hasBestsellers = featured.some((p) => p.badge === 'bestseller')
  // Coffret mis en avant : le coffret disponible le mieux classé (meilleure vente d'abord)
  const giftBox = sorted.find((p) => p.category === 'Rituels & Coffrets' && p.imageUrl && p.price !== null)
  const homeReviews = reviews.slice(0, 6)

  useEffect(() => {
    if (homeReviews.length < 2) return
    const id = window.setInterval(() => setReviewIndex((i) => (i + 1) % homeReviews.length), 6000)
    return () => window.clearInterval(id)
  }, [homeReviews.length])

  const openCategory = (cat: string) => {
    setSearchTerm('')
    setSelectedCategory(cat)
    navigate('/boutique')
  }

  const review = homeReviews[reviewIndex % Math.max(1, homeReviews.length)]

  const steps = [
    { icon: ShoppingBag, title: 'Choisissez vos soins', text: 'Ajoutez les produits et les quantités souhaitées à votre panier.' },
    {
      icon: MessageCircle,
      title: 'Commandez',
      text: 'Validez sur le site avec vos coordonnées, ou envoyez votre panier sur WhatsApp en un clic.',
    },
    {
      icon: Wallet,
      title: 'Payez par Wave et recevez',
      text: 'La boutique vous confirme le total avec la livraison, puis vous payez par Wave.',
    },
  ]

  return (
    <div className="ng-container ng-home">
      {/* RAYONS EN PASTILLES */}
      <nav className="ng-cats" aria-label="Rayons">
        {categories.map((cat) => (
          <button key={cat} type="button" className="ng-cat" onClick={() => openCategory(cat)}>
            <span className="ng-cat-img">
              {CATEGORY_INFO[cat] ? <img src={CATEGORY_INFO[cat].image} alt="" loading="lazy" /> : <Leaf size={22} />}
            </span>
            {CATEGORY_INFO[cat]?.short ?? cat}
          </button>
        ))}
        <button type="button" className="ng-cat" onClick={() => openCategory(ALL_CATEGORIES)}>
          <span className="ng-cat-img">
            <MoreHorizontal size={24} />
          </span>
          Tout
        </button>
      </nav>

      {/* HERO */}
      <section className="ng-hero">
        <div className="ng-hero-copy">
          <span className="ng-eyebrow">
            <Leaf size={13} /> SOINS NATURELS · CÔTE D’IVOIRE
          </span>
          <h1>
            Prenez soin de vous
            <br />
            <span>naturellement.</span>
          </h1>
          <p>
            Beurre de cacao brut, chantilly de cacao, savon noir de cabosse et huiles végétales : des soins simples et
            naturels pour la peau et les cheveux.
          </p>
          <div className="ng-hero-actions">
            <button type="button" className="ng-btn ng-btn--primary" onClick={() => navigate('/boutique')}>
              Découvrir la boutique <ArrowRight size={17} />
            </button>
            <button type="button" className="ng-btn ng-btn--ghost" onClick={() => setAdvisorOpen(true)}>
              <Sparkles size={16} color="var(--ng-gold-600)" /> Mon rituel IA
            </button>
          </div>
        </div>

        <div className="ng-hero-art" aria-hidden="true">
          <div className="ng-hero-arch">
            <img src={PHOTOS.hero} alt="" />
          </div>
          <div className="ng-hero-badge">
            <small>SOINS AU</small>
            <b>Cacao</b>
            <small>IVOIRIEN</small>
          </div>
          <div className="ng-hero-chip">
            <span className="ng-chip-ico">
              <Wallet size={17} />
            </span>
            <span>
              <b>Paiement Wave</b>
              Commande site ou WhatsApp
            </span>
          </div>
        </div>

        <div className="ng-hero-trust">
          <div className="ng-trust">
            <Truck size={20} />
            <span>
              <b>Livraison</b>
              {settings.deliveryCommunes}
            </span>
          </div>
          <div className="ng-trust">
            <ShieldCheck size={20} />
            <span>
              <b>Paiement Wave</b>Frais annoncés avant de payer
            </span>
          </div>
          <div className="ng-trust">
            <Leaf size={20} />
            <span>
              <b>Soins naturels</b>Cacao et végétaux ivoiriens
            </span>
          </div>
        </div>
      </section>

      {/* COMMENT COMMANDER */}
      <section className="ng-how" data-reveal>
        <div className="ng-section-head">
          <h2>Commander, c’est simple</h2>
        </div>
        <ol className="ng-how-steps">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <li key={title}>
              <span className="ng-how-ico">
                <Icon size={20} />
                <i>{i + 1}</i>
              </span>
              <b>{title}</b>
              <p>{text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* NOS RAYONS */}
      <section>
        <div className="ng-section-head">
          <h2>Nos rayons</h2>
          <button type="button" className="ng-link" onClick={() => openCategory(ALL_CATEGORIES)}>
            Tout voir <ArrowRight size={15} />
          </button>
        </div>
        <div className="ng-cat-cards">
          {categories.map((cat, i) => {
            const count = products.filter((p) => p.category === cat).length
            const info = CATEGORY_INFO[cat]
            return (
              <button
                key={cat}
                type="button"
                className="ng-cat-card"
                onClick={() => openCategory(cat)}
                data-reveal
                style={{ '--i': i } as React.CSSProperties}
              >
                {info ? <img src={info.image} alt="" loading="lazy" /> : <span className="ng-cat-card-ico"><Leaf size={26} /></span>}
                <span>
                  <b>{cat}</b>
                  <small>
                    {count} produit{count > 1 ? 's' : ''}
                    {info ? ` · ${info.tag}` : ''}
                  </small>
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* PRODUITS À DÉCOUVRIR */}
      {catalogLoading ? (
        <section>
          <div className="ng-section-head">
            <h2>Nos meilleures ventes</h2>
          </div>
          <div className="ng-rows" aria-busy="true">
            {Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={i} variant="row" />)}
          </div>
        </section>
      ) : featured.length > 0 && (
        <section>
          <div className="ng-section-head">
            <div>
              <h2>{hasBestsellers ? 'Nos meilleures ventes' : 'À découvrir'}</h2>
              <p>Les soins préférés de nos clientes.</p>
            </div>
            <button type="button" className="ng-link" onClick={() => navigate('/boutique')}>
              Tout voir <ArrowRight size={15} />
            </button>
          </div>
          <div className="ng-rows">
            {featured.map((product, i) => (
              <ProductCard product={product} key={product.id} variant="row" index={i} />
            ))}
          </div>
        </section>
      )}

      {/* DU CACAO À VOTRE PEAU */}
      <section className="ng-journey ng-band ng-band--cream">
        <div className="ng-section-head ng-section-head--center">
          <span className="ng-eyebrow"><Leaf size={13} /> DE LA TERRE IVOIRIENNE À VOTRE PEAU</span>
          <h2>Du cacao à votre soin</h2>
          <p>Des ingrédients simples, une transformation artisanale, rien de superflu.</p>
        </div>
        <ol className="ng-journey-steps">
          {JOURNEY.map((step, i) => (
            <li key={step.title} data-reveal style={{ '--i': i } as React.CSSProperties}>
              <span className="ng-journey-img">
                <img src={step.image} alt="" loading="lazy" />
                <i>{i + 1}</i>
              </span>
              <b>{step.title}</b>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
        <button type="button" className="ng-btn ng-btn--ghost ng-journey-cta" onClick={() => navigate('/histoire')}>
          Lire notre histoire <ArrowRight size={16} />
        </button>
      </section>

      {/* COFFRET MIS EN AVANT */}
      {giftBox && (
        <section className="ng-gift" data-reveal>
          <div className="ng-gift-media" onClick={() => navigate(`/produit/${giftBox.id}`)}>
            <img src={giftBox.imageUrl ?? ''} alt={giftBox.name} loading="lazy" />
          </div>
          <div className="ng-gift-copy">
            <span className="ng-eyebrow ng-eyebrow--gold"><Gift size={13} /> IDÉE CADEAU</span>
            <h2>{giftBox.name}</h2>
            <p>{giftBox.description}</p>
            <div className="ng-gift-price">
              <b>{formatXof(giftBox.price)}</b>
              <small>{giftBox.size}</small>
            </div>
            <div className="ng-hero-actions">
              <button
                type="button"
                className="ng-btn ng-btn--primary"
                onClick={(e) => { if (addToCart(giftBox.id, 1)) flyToCart(e.currentTarget.closest('.ng-gift')) }}
              >
                <ShoppingBag size={17} /> Ajouter au panier
              </button>
              <button type="button" className="ng-btn ng-btn--ghost" onClick={() => openCategory('Rituels & Coffrets')}>
                Tous les coffrets <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* BANNIÈRES THÉMATIQUES */}
      <section className="ng-promos">
        <div className="ng-promo-card ng-promo-card--gold" data-reveal>
          <img src={PHOTOS.cacaoPanier} alt="" loading="lazy" />
          <h3>Rituel cacao</h3>
          <p>
            <b>Beurre brut & chantilly</b>
            Pour nourrir le corps, les zones sèches et les cheveux.
          </p>
          <button type="button" className="ng-btn ng-btn--dark ng-btn--sm" onClick={() => openCategory('Beurre de cacao')}>
            Découvrir <ArrowRight size={15} />
          </button>
        </div>
        <div className="ng-promo-card ng-promo-card--green" data-reveal style={{ '--i': 1 } as React.CSSProperties}>
          <img src={PHOTOS.savonNoir} alt="" loading="lazy" />
          <h3>Peau nette</h3>
          <p>
            <b>Savon noir de cabosse</b>
            Un savon traditionnel pour le visage et le corps.
          </p>
          <button type="button" className="ng-btn ng-btn--primary ng-btn--sm" onClick={() => openCategory('Savons naturels')}>
            Découvrir <ArrowRight size={15} />
          </button>
        </div>
      </section>

      {/* TOUS LES SOINS */}
      {products.length > 4 && (
        <section>
          <div className="ng-section-head">
            <h2>Tous nos soins</h2>
            <button type="button" className="ng-link" onClick={() => navigate('/boutique')}>
              Voir la boutique <ArrowRight size={15} />
            </button>
          </div>
          <div className="ng-scroller">
            {sorted.map((product, i) => (
              <ProductCard product={product} key={product.id} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* AVIS RÉELS (publiés par la boutique) */}
      {review && (
        <section className="ng-review" data-reveal>
          <div className="ng-review-who">
            <div className="ng-avatar">{review.authorName.charAt(0).toUpperCase()}</div>
            <div>
              <b>{review.authorName}</b>
              <small>
                {review.city}
                {review.productName ? ` · ${review.productName}` : ''}
              </small>
            </div>
          </div>
          <blockquote key={review.id}>« {review.comment} »</blockquote>
          {homeReviews.length > 1 && (
            <div className="ng-dots">
              {homeReviews.map((r, i) => (
                <button
                  key={r.id}
                  type="button"
                  className={i === reviewIndex ? 'active' : ''}
                  onClick={() => setReviewIndex(i)}
                  aria-label={`Avis ${i + 1}`}
                />
              ))}
            </div>
          )}
          <button type="button" className="ng-link" onClick={() => navigate('/temoignages')}>
            Tous les avis <ArrowRight size={15} />
          </button>
        </section>
      )}

      {/* NOUVEAUTÉS SUR WHATSAPP */}
      <section className="ng-newsletter" data-reveal>
        <span className="ng-newsletter-ico">
          <MessageCircle size={22} />
        </span>
        <div>
          <h3>Nouveautés et retours en stock</h3>
          <p>Demandez à être prévenue sur WhatsApp : nouvelles huiles, coffrets, réassorts.</p>
        </div>
        <a
          className="ng-btn ng-btn--primary"
          href={waLink('Bonjour NATURE & GRÂCE, je souhaite être prévenue de vos nouveautés et retours en stock.')}
          target="_blank"
          rel="noreferrer"
        >
          Me prévenir sur WhatsApp
        </a>
      </section>
    </div>
  )
}

export default HomePage
