import React, { FormEvent, useEffect, useMemo, useState } from 'react'
import { ArrowRight, Leaf, Mail, MoreHorizontal, ShieldCheck, Sparkles, Star, Truck, Zap } from 'lucide-react'
import { useApp } from '../context/AppContext'
import ProductCardJumia, { formatPrice } from '../components/ProductCardJumia'
import { CATEGORY_AVATARS, INITIAL_REVIEWS } from '../data/products'
import { ProductCategory } from '../types'

const HERO_IMAGE = 'https://images.unsplash.com/photo-1573461160327-b450ce3d8e7f?auto=format&fit=crop&w=900&q=80'
const PROMO_CACAO_IMAGE = 'https://images.unsplash.com/photo-1599305090598-fe179d501227?auto=format&fit=crop&w=700&q=80'
const PROMO_SOAP_IMAGE = 'https://images.unsplash.com/photo-1590439471364-192aa70c0b53?auto=format&fit=crop&w=700&q=80'

const SHORT_LABELS: Record<string, string> = {
  'Beurre de cacao': 'Cacao',
  'Savons naturels': 'Savons',
  'Huiles naturelles': 'Huiles',
  'Rituels & Coffrets': 'Coffrets',
}

/** Fin de la vente flash : dimanche soir 23:59:59 (renouvelée chaque semaine). */
function nextSundayEnd() {
  const d = new Date()
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7))
  d.setHours(23, 59, 59, 0)
  if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 7)
  return d.getTime()
}

function useCountdown() {
  const [target, setTarget] = useState(nextSundayEnd)
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])
  useEffect(() => {
    if (now >= target) setTarget(nextSundayEnd())
  }, [now, target])
  const diff = Math.max(0, target - now)
  return {
    days: Math.floor(diff / 864e5),
    hours: Math.floor(diff / 36e5) % 24,
    minutes: Math.floor(diff / 6e4) % 60,
    seconds: Math.floor(diff / 1e3) % 60,
  }
}

const pad = (n: number) => String(n).padStart(2, '0')

export const HomePage: React.FC<{ onOpenAdvisor: () => void }> = ({ onOpenAdvisor }) => {
  const { products, navigate, setSelectedCategory, setSearchTerm, showToast } = useApp()
  const countdown = useCountdown()
  const [reviewIndex, setReviewIndex] = useState(0)
  const [email, setEmail] = useState('')

  const flashProducts = useMemo(() => products.filter((p) => p.isFlashSale), [products])
  const bestSellers = useMemo(() => [...products].sort((a, b) => b.reviewCount - a.reviewCount), [products])
  const dealProduct = useMemo(() => {
    const pct = (d?: string | null) => Number(String(d ?? '').replace(/[^0-9]/g, '')) || 0
    return [...flashProducts].sort((a, b) => pct(b.discount) - pct(a.discount))[0] ?? products[0]
  }, [flashProducts, products])

  useEffect(() => {
    const id = window.setInterval(() => setReviewIndex((i) => (i + 1) % INITIAL_REVIEWS.length), 6000)
    return () => window.clearInterval(id)
  }, [])

  const openCategory = (cat: ProductCategory | 'all') => {
    setSearchTerm('')
    setSelectedCategory(cat === 'all' ? 'Toutes les catégories' : cat)
    navigate('/boutique')
  }

  const subscribe = (e: FormEvent) => {
    e.preventDefault()
    showToast('Merci ! Vous recevrez nos offres en avant-première.')
    setEmail('')
  }

  const review = INITIAL_REVIEWS[reviewIndex]

  return (
    <div className="ng-container ng-home">
      {/* 1. RAYONS EN PASTILLES */}
      <nav className="ng-cats" aria-label="Rayons">
        {CATEGORY_AVATARS.map((cat) => (
          <button key={cat.name} type="button" className="ng-cat" onClick={() => openCategory(cat.name)}>
            <span className="ng-cat-img">
              <img src={cat.image} alt="" loading="lazy" />
            </span>
            {SHORT_LABELS[cat.name] ?? cat.name}
          </button>
        ))}
        <button type="button" className="ng-cat" onClick={() => openCategory('all')}>
          <span className="ng-cat-img">
            <MoreHorizontal size={24} />
          </span>
          Tout
        </button>
      </nav>

      {/* 2. HERO */}
      <section className="ng-hero">
        <div className="ng-hero-copy">
          <span className="ng-eyebrow">
            <Leaf size={13} /> 100% NATUREL · CÔTE D’IVOIRE
          </span>
          <h1>
            La beauté naturelle,
            <br />
            <span>au cœur du cacao.</span>
          </h1>
          <p>
            Beurre de cacao brut, savons noirs artisanaux et huiles vierges pressées à froid. Des soins purs, livrés chez
            vous à Abidjan.
          </p>
          <div className="ng-hero-actions">
            <button type="button" className="ng-btn ng-btn--primary" onClick={() => navigate('/boutique')}>
              Découvrir la boutique <ArrowRight size={17} />
            </button>
            <button type="button" className="ng-btn ng-btn--ghost" onClick={onOpenAdvisor}>
              <Sparkles size={16} color="var(--ng-gold-600)" /> Mon rituel IA
            </button>
          </div>
        </div>

        <div className="ng-hero-art" aria-hidden="true">
          <div className="ng-hero-arch">
            <img src={HERO_IMAGE} alt="" />
          </div>
          <div className="ng-hero-badge">
            <small>JUSQU’À</small>
            <b>-25%</b>
            <small>CETTE SEMAINE</small>
          </div>
          <div className="ng-hero-chip">
            <span className="ng-chip-ico">
              <Star size={17} fill="currentColor" strokeWidth={0} />
            </span>
            <span>
              <b>4,9 / 5</b>
              +400 clientes ravies
            </span>
          </div>
        </div>

        <div className="ng-hero-trust">
          <div className="ng-trust">
            <Truck size={20} />
            <span>
              <b>Livraison 24 h</b>Offerte dès 10 000 FCFA
            </span>
          </div>
          <div className="ng-trust">
            <ShieldCheck size={20} />
            <span>
              <b>Paiement Wave</b>Sécurisé, sans frais
            </span>
          </div>
          <div className="ng-trust">
            <Leaf size={20} />
            <span>
              <b>100% naturel</b>Sans paraben ni additif
            </span>
          </div>
        </div>
      </section>

      {/* 3. VENTE FLASH */}
      {dealProduct && (
        <section className="ng-flash" id="vente-flash" data-reveal>
          <div className="ng-flash-img" onClick={() => navigate(`/produit/${dealProduct.id}`)}>
            {dealProduct.imageUrl && <img src={dealProduct.imageUrl} alt={dealProduct.name} />}
          </div>
          <div className="ng-flash-copy">
            <h3>
              <Zap size={19} fill="currentColor" /> Vente flash
            </h3>
            <p>{dealProduct.name}</p>
            <div className="ng-flash-price">
              <b>{formatPrice(dealProduct.price)}</b>
              {dealProduct.oldPrice ? <s>{formatPrice(dealProduct.oldPrice)}</s> : null}
            </div>
            <button type="button" className="ng-btn ng-btn--gold ng-btn--sm" onClick={() => navigate(`/produit/${dealProduct.id}`)}>
              J’en profite <ArrowRight size={15} />
            </button>
          </div>
          <div className="ng-countdown" role="timer" aria-label="Fin de la vente flash">
            {(
              [
                ['JOURS', countdown.days],
                ['HRS', countdown.hours],
                ['MIN', countdown.minutes],
                ['SEC', countdown.seconds],
              ] as const
            ).map(([label, value]) => (
              <div key={label}>
                <b key={value}>{pad(value)}</b>
                <small>{label}</small>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. RAYONS POPULAIRES */}
      <section>
        <div className="ng-section-head">
          <h2>Nos rayons</h2>
          <button type="button" className="ng-link" onClick={() => openCategory('all')}>
            Tout voir <ArrowRight size={15} />
          </button>
        </div>
        <div className="ng-cat-cards">
          {CATEGORY_AVATARS.map((cat, i) => {
            const count = products.filter((p) => p.category === cat.name).length
            return (
              <button
                key={cat.name}
                type="button"
                className="ng-cat-card"
                onClick={() => openCategory(cat.name)}
                data-reveal
                style={{ '--i': i } as React.CSSProperties}
              >
                <img src={cat.image} alt="" loading="lazy" />
                <span>
                  <b>{cat.name}</b>
                  <small>
                    {count} produit{count > 1 ? 's' : ''} · {cat.tag}
                  </small>
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* 5. PRODUITS PHARES */}
      <section>
        <div className="ng-section-head">
          <div>
            <h2>Produits phares</h2>
            <p>Les prix doux de la semaine, en quantité limitée.</p>
          </div>
          <button type="button" className="ng-link" onClick={() => navigate('/boutique')}>
            Tout voir <ArrowRight size={15} />
          </button>
        </div>
        <div className="ng-rows">
          {flashProducts.slice(0, 4).map((product, i) => (
            <ProductCardJumia product={product} key={product.id} variant="row" index={i} />
          ))}
        </div>
      </section>

      {/* 6. BANNIÈRES THÉMATIQUES */}
      <section className="ng-promos">
        <div className="ng-promo-card ng-promo-card--gold" data-reveal>
          <img src={PROMO_CACAO_IMAGE} alt="" loading="lazy" />
          <h3>Rituel Cacao</h3>
          <p>
            <b>Jusqu’à -25%</b>
            Beurre brut & chantilly pour corps et cheveux.
          </p>
          <button type="button" className="ng-btn ng-btn--dark ng-btn--sm" onClick={() => openCategory('Beurre de cacao')}>
            Découvrir <ArrowRight size={15} />
          </button>
        </div>
        <div className="ng-promo-card ng-promo-card--green" data-reveal style={{ '--i': 1 } as React.CSSProperties}>
          <img src={PROMO_SOAP_IMAGE} alt="" loading="lazy" />
          <h3>Peau nette & purifiée</h3>
          <p>
            <b>Savons artisanaux</b>
            Aux cendres de cabosse, pour visage et corps.
          </p>
          <button type="button" className="ng-btn ng-btn--primary ng-btn--sm" onClick={() => openCategory('Savons naturels')}>
            Découvrir <ArrowRight size={15} />
          </button>
        </div>
      </section>

      {/* 7. MEILLEURES VENTES */}
      <section>
        <div className="ng-section-head">
          <h2>Meilleures ventes</h2>
          <button type="button" className="ng-link" onClick={() => navigate('/boutique')}>
            Tout voir <ArrowRight size={15} />
          </button>
        </div>
        <div className="ng-scroller">
          {bestSellers.map((product, i) => (
            <ProductCardJumia product={product} key={product.id} index={i} />
          ))}
        </div>
      </section>

      {/* 8. AVIS CLIENTE */}
      {review && (
        <section className="ng-review" data-reveal>
          <div className="ng-review-who">
            <div className="ng-avatar">{review.name.charAt(0)}</div>
            <div>
              <b>{review.name}</b>
              <small>{review.verified ? 'Cliente vérifiée' : review.location}</small>
            </div>
          </div>
          <blockquote key={review.id}>« {review.comment} »</blockquote>
          <div className="ng-dots">
            {INITIAL_REVIEWS.map((r, i) => (
              <button
                key={r.id}
                type="button"
                className={i === reviewIndex ? 'active' : ''}
                onClick={() => setReviewIndex(i)}
                aria-label={`Avis ${i + 1}`}
              />
            ))}
          </div>
        </section>
      )}

      {/* 9. NEWSLETTER */}
      <section className="ng-newsletter" data-reveal>
        <span className="ng-newsletter-ico">
          <Mail size={22} />
        </span>
        <div>
          <h3>Offres exclusives & conseils beauté</h3>
          <p>Recevez nos ventes flash en avant-première.</p>
        </div>
        <form onSubmit={subscribe}>
          <input
            type="email"
            required
            placeholder="Votre adresse e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Adresse e-mail"
          />
          <button type="submit" className="ng-btn ng-btn--primary">
            S’inscrire
          </button>
        </form>
      </section>
    </div>
  )
}

export default HomePage
