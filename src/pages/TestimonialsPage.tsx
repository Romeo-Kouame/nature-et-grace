import React, { useState } from 'react'
import { CheckCircle2, HeartHandshake, Leaf, MessageSquarePlus, Send, Sparkles, Star, Truck } from 'lucide-react'
import { INITIAL_REVIEWS } from '../data/products'
import { Review } from '../types'
import { useApp } from '../context/AppContext'

export const TestimonialsPage: React.FC<{ onOpenAdvisor: () => void }> = ({ onOpenAdvisor }) => {
  const { showToast, products } = useApp()
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS)
  const [filterRating, setFilterRating] = useState<number | 'all'>('all')

  // Formulaire d'avis
  const [showForm, setShowForm] = useState(false)
  const [authorName, setAuthorName] = useState('')
  const [location, setLocation] = useState('Cocody, Abidjan')
  const [rating, setRating] = useState(5)
  const [productName, setProductName] = useState('Chantilly de cacao & Savon noir')
  const [comment, setComment] = useState('')

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault()
    if (!authorName.trim() || !comment.trim()) return

    const newRev: Review = {
      id: 'rev-' + Date.now(),
      name: authorName.trim(),
      location: location.trim(),
      rating,
      date: 'Aujourd’hui',
      productName,
      comment: comment.trim(),
      verified: true,
    }

    setReviews([newRev, ...reviews])
    setShowForm(false)
    setAuthorName('')
    setComment('')
    showToast('Merci infiniment pour votre retour d’expérience !')
  }

  const filteredReviews = filterRating === 'all' ? reviews : reviews.filter((r) => r.rating === filterRating)

  return (
    <div style={{ padding: '30px 4% 70px', maxWidth: '1080px', margin: '0 auto' }}>
      {/* Entête Témoignages */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <span style={{ fontSize: '10px', color: 'var(--brand-gold)', letterSpacing: '0.16em', fontWeight: 600 }}>
          AVIS & RETOURS CLIENTS VÉRIFIÉS
        </span>
        <h1 style={{ font: "500 clamp(30px, 3.8vw, 44px)/1.15 'Playfair Display', serif", margin: '8px 0 12px', color: 'var(--text-primary)' }}>
          Ce que disent nos <em>clientes & clients.</em>
        </h1>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '580px', margin: '0 auto' }}>
          La transparence et l'amour du naturel sont au cœur de nos valeurs. Découvrez les avis authentiques de celles et ceux qui ont adopté le rituel NATURE & GRÂCE.
        </p>
      </div>

      {/* Carte Résumé des Notes */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          padding: '28px 34px',
          display: 'grid',
          gridTemplateColumns: '1fr 1.6fr auto',
          gap: '30px',
          alignItems: 'center',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '35px',
        }}
      >
        <div style={{ textAlign: 'center', borderRight: '1px solid var(--border-subtle)', paddingRight: '20px' }}>
          <b style={{ font: "700 48px 'Playfair Display', serif", color: 'var(--brand-gold)', display: 'block', lineHeight: 1 }}>
            4.9
          </b>
          <div style={{ color: 'var(--brand-gold)', fontSize: '18px', margin: '6px 0 4px', letterSpacing: '2px' }}>
            ★★★★★
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Basé sur 350+ avis vérifiés</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px' }}>
            <span>5 étoiles</span>
            <div style={{ flex: 1, height: '6px', background: 'var(--border-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{ width: '92%', height: '100%', background: 'var(--brand-gold)' }} />
            </div>
            <b>92%</b>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px' }}>
            <span>4 étoiles</span>
            <div style={{ flex: 1, height: '6px', background: 'var(--border-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{ width: '8%', height: '100%', background: 'var(--brand-gold)' }} />
            </div>
            <b>8%</b>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px' }}>
            <span>3 étoiles</span>
            <div style={{ flex: 1, height: '6px', background: 'var(--border-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{ width: '0%', height: '100%', background: 'var(--brand-gold)' }} />
            </div>
            <b>0%</b>
          </div>
        </div>

        <div>
          <button
            type="button"
            className="button primary"
            style={{ background: 'var(--brand-green)', borderColor: 'var(--brand-green)', fontSize: '11px', whiteSpace: 'nowrap' }}
            onClick={() => setShowForm(!showForm)}
          >
            <MessageSquarePlus size={15} /> Laisser un avis
          </button>
        </div>
      </div>

      {/* Formulaire pour laisser son avis */}
      {showForm && (
        <form
          onSubmit={handleAddReview}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--brand-gold)',
            borderRadius: '14px',
            padding: '24px 28px',
            marginBottom: '35px',
            animation: 'fadeIn 0.25s ease',
          }}
        >
          <h3 style={{ font: "500 20px 'Playfair Display', serif", margin: '0 0 16px', color: 'var(--text-primary)' }}>
            Partagez votre expérience avec nos soins
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '14px' }}>
            <div className="auth-field">
              <label>Votre nom</label>
              <input
                type="text"
                placeholder="Ex. Aminata Diallo"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label>Commune ou Ville</label>
              <input
                type="text"
                placeholder="Ex. Cocody, Yopougon, Bouaké..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label>Soin concerné</label>
              <select
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-strong)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                }}
              >
                {products.map((p) => (
                  <option value={p.name} key={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="auth-field">
              <label>Votre note</label>
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-strong)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                }}
              >
                <option value={5}>★★★★★ (5/5 Exceptionnel)</option>
                <option value={4}>★★★★☆ (4/5 Très satisfait)</option>
                <option value={3}>★★★☆☆ (3/5 Moyen)</option>
              </select>
            </div>
          </div>

          <div className="auth-field" style={{ marginBottom: '16px' }}>
            <label>Votre commentaire d’expérience</label>
            <textarea
              rows={3}
              placeholder="Décrivez comment vous avez utilisé le produit et les résultats constatés sur votre peau ou vos cheveux..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-strong)',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                fontFamily: 'inherit',
              }}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="button primary" style={{ background: 'var(--brand-green)', fontSize: '11.5px' }}>
              <Send size={14} /> Publier mon avis
            </button>
            <button
              type="button"
              className="button secondary-empty"
              style={{ fontSize: '11.5px' }}
              onClick={() => setShowForm(false)}
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Filtres par étoile */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button
          type="button"
          className={`jumia-cat-pill ${filterRating === 'all' ? 'selected' : ''}`}
          onClick={() => setFilterRating('all')}
        >
          Tous les avis ({reviews.length})
        </button>
        <button
          type="button"
          className={`jumia-cat-pill ${filterRating === 5 ? 'selected' : ''}`}
          onClick={() => setFilterRating(5)}
        >
          5 étoiles ({reviews.filter((r) => r.rating === 5).length})
        </button>
        <button
          type="button"
          className={`jumia-cat-pill ${filterRating === 4 ? 'selected' : ''}`}
          onClick={() => setFilterRating(4)}
        >
          4 étoiles ({reviews.filter((r) => r.rating === 4).length})
        </button>
      </div>

      {/* Grille des Avis */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '20px' }}>
        {filteredReviews.map((rev) => (
          <article
            key={rev.id}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '14px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '14px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ color: 'var(--brand-gold)', fontSize: '14px', letterSpacing: '2px' }}>
                  {'★'.repeat(rev.rating)}
                  {'☆'.repeat(5 - rev.rating)}
                </span>
                <small style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{rev.date}</small>
              </div>

              <span style={{ fontSize: '10px', color: 'var(--brand-gold)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                {rev.productName}
              </span>

              <p style={{ fontSize: '12px', lineHeight: 1.7, color: 'var(--text-secondary)', margin: 0 }}>
                {rev.comment}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--brand-green)',
                  color: 'white',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '11px',
                  fontWeight: 600,
                }}
              >
                {rev.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <b style={{ fontSize: '11.5px', color: 'var(--text-primary)', display: 'block' }}>{rev.name}</b>
                <small style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>{rev.location}</small>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontSize: '9.5px', fontWeight: 600 }}>
                <CheckCircle2 size={12} /> Vérifié
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
export default TestimonialsPage
