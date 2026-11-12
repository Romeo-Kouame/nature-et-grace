import React, { useEffect, useState } from 'react'
import { ArrowRight, Check, Leaf, Lightbulb, MessageCircle, Moon, Plus, Sparkles, Sun, X } from 'lucide-react'
import { BeautyAdvice } from '../api'
import { requestBeautyAdvice } from '../gemini'
import { formatXof } from '../format'
import { useApp } from '../context/AppContext'
import ProductVisual from './ProductVisual'

const PRESET_CONCERNS = [
  { label: 'Peau sèche', value: 'Peau sèche, déshydratée et rugueuse' },
  { label: 'Imperfections', value: 'Petites imperfections, peau grasse et pores visibles' },
  { label: 'Teint terne', value: 'Teint terne, manque d’éclat' },
  { label: 'Vergetures', value: 'Peau qui manque de souplesse, zones sujettes aux vergetures' },
  { label: 'Cheveux secs', value: 'Cheveux secs, cassants, pointes abîmées' },
  { label: 'Barbe', value: 'Entretien de la barbe, poils rêches et peau en dessous' },
]

export const BeautyAdvisorModal: React.FC = () => {
  const { advisorOpen, setAdvisorOpen, products, addToCart, waLink, catalogLive, maxQuantity } = useApp()
  const [selectedConcern, setSelectedConcern] = useState('')
  const [userInput, setUserInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [advice, setAdvice] = useState<BeautyAdvice | null>(null)
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!advisorOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setAdvisorOpen(false)
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [advisorOpen, setAdvisorOpen])

  if (!advisorOpen) return null

  const close = () => setAdvisorOpen(false)

  const executeAdvice = async (query: string, concern = selectedConcern) => {
    setLoading(true)
    setAddedIds({})
    try {
      const result = await requestBeautyAdvice({
        message: query,
        skinType: concern || undefined,
        catalogProducts: products.map((p) => ({ id: p.id, name: p.name, category: p.category, size: p.size, price: p.price, description: p.description })),
      })
      setAdvice(result)
    } finally {
      setLoading(false)
    }
  }

  const recommended = advice ? products.filter((p) => advice.recommendedProductIds.includes(p.id)) : []
  const buyable = recommended.filter((p) => p.price !== null && maxQuantity(p) > 0)

  const addOne = (id: string) => {
    if (addToCart(id, 1)) setAddedIds((prev) => ({ ...prev, [id]: true }))
  }

  const addAll = () => {
    buyable.forEach((p) => addToCart(p.id, 1))
    setAddedIds(Object.fromEntries(buyable.map((p) => [p.id, true])))
  }

  const whatsappText = advice
    ? `Bonjour NATURE & GRÂCE,\n\nLe conseiller beauté du site m’a proposé ce rituel : ${advice.whatsappSummary}\n\nProduits :\n${recommended
        .map((p) => `• ${p.name} (${p.size})`)
        .join('\n')}\n\nJ’aimerais commander ces soins. Pouvez-vous me préciser la livraison ? Merci !`
    : ''

  return (
    <div className="ng-modal-overlay ng-advisor-overlay" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="ng-advisor" role="dialog" aria-modal="true" aria-labelledby="advisor-title">
        <header className="ng-advisor-head">
          <span className="ng-advisor-ico">
            <Sparkles size={20} />
          </span>
          <div>
            <h2 id="advisor-title">Conseiller beauté</h2>
            <p>Décrivez votre besoin : l’IA vous propose un rituel avec nos soins.</p>
          </div>
          <button type="button" className="ng-icon-btn" onClick={close} aria-label="Fermer le conseiller">
            <X size={20} />
          </button>
        </header>

        <div className="ng-advisor-body">
          <div className="ng-chips ng-advisor-chips" aria-label="Besoins fréquents">
            {PRESET_CONCERNS.map((c) => (
              <button
                key={c.value}
                type="button"
                className={`ng-chip ${selectedConcern === c.value ? 'active' : ''}`}
                onClick={() => {
                  setSelectedConcern(c.value)
                  setUserInput(c.value)
                  void executeAdvice(c.value, c.value)
                }}
                disabled={loading}
              >
                {c.label}
              </button>
            ))}
          </div>

          <form
            className="ng-advisor-form"
            onSubmit={(e) => {
              e.preventDefault()
              if (userInput.trim()) void executeAdvice(userInput.trim())
            }}
          >
            <input
              type="text"
              placeholder="Ex. j’ai la peau sèche sur les jambes et les coudes…"
              value={userInput}
              maxLength={600}
              onChange={(e) => setUserInput(e.target.value)}
              aria-label="Votre besoin"
            />
            <button className="ng-btn ng-btn--primary" type="submit" disabled={loading || !userInput.trim()}>
              <Sparkles size={15} /> {loading ? 'Un instant…' : 'Mon rituel'}
            </button>
          </form>

          {loading && (
            <div className="ng-advisor-loading" role="status">
              <span className="ng-spinner" />
              <p>Composition de votre rituel…</p>
            </div>
          )}

          {!loading && !advice && (
            <p className="ng-advisor-intro">
              <Leaf size={16} /> Choisissez un besoin ci-dessus ou décrivez-le avec vos mots. N’indiquez pas d’informations
              médicales ou personnelles sensibles.
            </p>
          )}

          {!loading && advice && (
            <div className="ng-advisor-result">
              <div className="ng-advisor-diag">
                <b>
                  <Leaf size={15} /> Notre lecture de votre besoin
                </b>
                <p>{advice.diagnosis}</p>
              </div>

              <div className="ng-advisor-routines">
                <div>
                  <h3>
                    <Sun size={16} /> Le matin
                  </h3>
                  <ol>
                    {advice.routineMorning.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                </div>
                <div>
                  <h3>
                    <Moon size={16} /> Le soir
                  </h3>
                  <ol>
                    {advice.routineEvening.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                </div>
              </div>

              {advice.naturalTips?.length > 0 && (
                <div className="ng-advisor-tips">
                  <b>
                    <Lightbulb size={15} /> Astuces
                  </b>
                  <ul>
                    {advice.naturalTips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {recommended.length > 0 && (
                <section className="ng-advisor-products">
                  <h3>Les soins de votre rituel</h3>
                  <ul>
                    {recommended.map((p) => {
                      const canBuy = p.price !== null && maxQuantity(p) > 0
                      return (
                        <li key={p.id}>
                          <span className="ng-advisor-thumb">
                            <ProductVisual product={p} size="thumb" />
                          </span>
                          <div>
                            <b>{p.name}</b>
                            <small>
                              {p.size} · {formatXof(p.price)}
                            </small>
                          </div>
                          {canBuy ? (
                            <button type="button" className={`ng-advisor-add ${addedIds[p.id] ? 'added' : ''}`} onClick={() => addOne(p.id)}>
                              {addedIds[p.id] ? <Check size={14} /> : <Plus size={14} />} {addedIds[p.id] ? 'Ajouté' : 'Ajouter'}
                            </button>
                          ) : (
                            <small className="ng-advisor-na">{p.price === null ? 'Prix à confirmer' : catalogLive ? 'En rupture' : ''}</small>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                  <div className="ng-advisor-actions">
                    {buyable.length > 1 && (
                      <button type="button" className="ng-btn ng-btn--primary" onClick={addAll}>
                        <Plus size={16} /> Tout ajouter au panier ({buyable.length})
                      </button>
                    )}
                    <a className="ng-btn ng-btn--wa" href={waLink(whatsappText)} target="_blank" rel="noreferrer">
                      <MessageCircle size={16} /> Commander ce rituel sur WhatsApp <ArrowRight size={14} />
                    </a>
                  </div>
                </section>
              )}

              <p className="ng-advisor-disclaimer">
                Conseils indicatifs générés automatiquement{advice.isDemo ? ' (mode démonstration)' : ''}. Ils ne remplacent pas
                l’avis d’un professionnel de santé. Faites un essai sur une petite zone de peau avant la première utilisation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BeautyAdvisorModal
