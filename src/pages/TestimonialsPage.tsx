import React, { useMemo, useState } from 'react'
import { MessageSquarePlus, Send, Star, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Stars } from '../components/ProductCard'
import { api } from '../api'
import { usePageMeta } from '../hooks/usePageMeta'

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

export const TestimonialsPage: React.FC = () => {
  const { products, reviews, reviewsLoaded, showToast, waLink } = useApp()
  usePageMeta('Avis clients', 'Les avis des clientes et clients de NATURE & GRÂCE sur nos soins au cacao, savons et huiles.')
  const [filter, setFilter] = useState<number | 'all'>('all')
  const [showForm, setShowForm] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [city, setCity] = useState('')
  const [rating, setRating] = useState(5)
  const [productSlug, setProductSlug] = useState('')
  const [comment, setComment] = useState('')

  const stats = useMemo(() => {
    const count = reviews.length
    const average = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0
    const distribution = [5, 4, 3, 2, 1].map((star) => {
      const n = reviews.filter((r) => r.rating === star).length
      return { star, n, pct: count ? Math.round((n / count) * 100) : 0 }
    })
    return { count, average, distribution }
  }, [reviews])

  const filtered = filter === 'all' ? reviews : reviews.filter((r) => r.rating === filter)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError('')
    try {
      const res = await api<{ message: string }>('/reviews', {
        method: 'POST',
        body: JSON.stringify({ authorName, city, rating, comment, productSlug: productSlug || undefined }),
      })
      showToast(res.message)
      setShowForm(false)
      setComment('')
    } catch (err) {
      const offline = err instanceof TypeError
      setError(offline ? 'Le site ne parvient pas à joindre la boutique. Vous pouvez envoyer votre avis sur WhatsApp.' : (err as Error).message)
    } finally {
      setSending(false)
    }
  }

  const productName = products.find((p) => p.id === productSlug)?.name
  const whatsappReview = `Bonjour NATURE & GRÂCE,\n\nVoici mon avis :\nPrénom : ${authorName}\nVille : ${city}\nProduit : ${productName ?? 'Non précisé'}\nNote : ${rating}/5\n\n${comment}`

  return (
    <div className="ng-container ng-subpage">
      <header className="ng-page-head">
        <span className="ng-eyebrow">AVIS CLIENTS</span>
        <h1>Vos retours sur nos soins.</h1>
        <p>Chaque avis est lu par la boutique avant d’être publié.</p>
      </header>

      {stats.count > 0 ? (
        <section className="ng-rating-summary">
          <div className="ng-rating-big">
            <b>{stats.average.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}</b>
            <Stars rating={stats.average} size={18} />
            <small>
              {stats.count} avis publié{stats.count > 1 ? 's' : ''}
            </small>
          </div>
          <div className="ng-rating-bars">
            {stats.distribution.map(({ star, pct }) => (
              <div key={star}>
                <span>
                  {star} <Star size={12} fill="currentColor" strokeWidth={0} />
                </span>
                <i>
                  <em style={{ width: `${pct}%` }} />
                </i>
                <b>{pct}%</b>
              </div>
            ))}
          </div>
          <button type="button" className="ng-btn ng-btn--primary" onClick={() => setShowForm(true)}>
            <MessageSquarePlus size={17} /> Donner mon avis
          </button>
        </section>
      ) : (
        <div className="ng-empty ng-empty--icon">
          <span className="ng-empty-ico">
            <Star size={28} />
          </span>
          <h3>{reviewsLoaded ? 'Aucun avis publié pour le moment' : 'Chargement des avis…'}</h3>
          <p>Vous avez essayé nos soins ? Votre retour aidera les prochaines clientes à choisir.</p>
          <button type="button" className="ng-btn ng-btn--primary" onClick={() => setShowForm(true)}>
            <MessageSquarePlus size={17} /> Donner le premier avis
          </button>
        </div>
      )}

      {stats.count > 1 && (
        <div className="ng-chips" style={{ marginBottom: 18 }}>
          {(['all', 5, 4, 3, 2, 1] as const).map((f) => {
            const n = f === 'all' ? reviews.length : reviews.filter((r) => r.rating === f).length
            if (f !== 'all' && n === 0) return null
            return (
              <button key={f} type="button" className={`ng-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f === 'all' ? 'Tous' : `${f} étoile${f > 1 ? 's' : ''}`} ({n})
              </button>
            )
          })}
        </div>
      )}

      <div className="ng-reviews">
        {filtered.map((rev, i) => (
          <article key={rev.id} className="ng-review-card" data-reveal style={{ '--i': i % 6 } as React.CSSProperties}>
            <div className="ng-review-top">
              <Stars rating={rev.rating} size={14} />
              <small>{formatDate(rev.createdAt)}</small>
            </div>
            {rev.productName && <span className="ng-review-product">{rev.productName}</span>}
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

      {showForm && (
        <div className="ng-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <form className="ng-modal" onSubmit={handleSubmit} role="dialog" aria-modal="true" aria-label="Donner mon avis">
            <div className="ng-modal-head">
              <h3>Donner mon avis</h3>
              <button type="button" className="ng-icon-btn" onClick={() => setShowForm(false)} aria-label="Fermer">
                <X size={20} />
              </button>
            </div>
            <div className="ng-form">
              <div className="ng-star-input" role="radiogroup" aria-label="Votre note">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={rating === n}
                    aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
                    className={n <= rating ? 'on' : ''}
                    onClick={() => setRating(n)}
                  >
                    <Star size={28} fill="currentColor" strokeWidth={0} />
                  </button>
                ))}
              </div>
              <div className="ng-form-row">
                <label>
                  Votre prénom
                  <input value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="Ex. Aminata" minLength={2} maxLength={60} required />
                </label>
                <label>
                  Commune ou ville
                  <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ex. Cocody" minLength={2} maxLength={60} required />
                </label>
              </div>
              <label>
                Produit
                <select value={productSlug} onChange={(e) => setProductSlug(e.target.value)}>
                  <option value="">Avis général sur la boutique</option>
                  {products.map((p) => (
                    <option value={p.id} key={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Votre expérience
                <textarea
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Comment l’avez-vous utilisé ? Qu’en avez-vous pensé ?"
                  minLength={10}
                  maxLength={1000}
                  required
                />
              </label>
              <p className="ng-form-hint">Votre avis est envoyé à la boutique et publié après vérification. Votre prénom et votre ville seront affichés.</p>
              {error && (
                <p className="ng-form-error" role="alert">
                  {error}{' '}
                  <a href={waLink(whatsappReview)} target="_blank" rel="noreferrer">
                    Envoyer sur WhatsApp
                  </a>
                </p>
              )}
              <button type="submit" className="ng-btn ng-btn--primary" disabled={sending}>
                <Send size={16} /> {sending ? 'Envoi…' : 'Envoyer mon avis'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default TestimonialsPage
