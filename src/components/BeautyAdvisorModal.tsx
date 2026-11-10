import React, { useState } from 'react'
import { ArrowRight, Check, Leaf, MessageCircle, Plus, Sparkles, Sun, Moon, X } from 'lucide-react'
import { BeautyAdvice } from '../api'
import { requestBeautyAdvice } from '../gemini'
import { formatXof } from '../format'

export type AdvisorProduct = {
  id: string
  name: string
  category: string
  size: string
  price: number | null
  description: string
  tone?: string
  imageUrl?: string | null
}

interface BeautyAdvisorModalProps {
  isOpen: boolean
  onClose: () => void
  catalog: AdvisorProduct[]
  onAddToCart: (productId: string) => void
  onAddMultipleToCart: (productIds: string[]) => void
  waNumber: string
}

const PRESET_CONCERNS = [
  { label: '🧴 Peau très sèche & tiraillements', value: 'Peau sèche, déshydratée et rugueuse' },
  { label: '🌿 Acné & imperfections', value: 'Imperfections, acné, peau grasse et pores obstrués' },
  { label: '✨ Taches brunes & éclat', value: 'Taches pigmentaires, manque d’éclat et teint terne' },
  { label: '💧 Vergetures & fermeté', value: 'Vergetures, cicatrices, manque de souplesse cutanée' },
  { label: '💆‍♀️ Cheveux secs ou cassants', value: 'Cheveux secs, cassants, pointes abîmées' },
  { label: '🧔 Soin barbe douce', value: 'Entretien de la barbe, poils rêches et peau sous-jacente' },
]

export const BeautyAdvisorModal: React.FC<BeautyAdvisorModalProps> = ({
  isOpen,
  onClose,
  catalog,
  onAddToCart,
  onAddMultipleToCart,
  waNumber,
}) => {
  const [selectedConcern, setSelectedConcern] = useState<string>('')
  const [userInput, setUserInput] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [advice, setAdvice] = useState<BeautyAdvice | null>(null)
  const [addedAll, setAddedAll] = useState<boolean>(false)
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({})

  if (!isOpen) return null

  const handleSelectConcern = (concern: typeof PRESET_CONCERNS[number]) => {
    setSelectedConcern(concern.value)
    setUserInput(concern.value)
    void executeAdvice(concern.value)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!userInput.trim()) return
    void executeAdvice(userInput)
  }

  const executeAdvice = async (query: string) => {
    setLoading(true)
    setAddedAll(false)
    try {
      const result = await requestBeautyAdvice({
        message: query,
        skinType: selectedConcern || undefined,
        catalogProducts: catalog.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          size: p.size,
          price: p.price,
          description: p.description,
        })),
      })
      setAdvice(result)
    } catch (err) {
      console.error('Erreur Conseiller Beauté:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filtrer les produits recommandés parmi notre catalogue réel
  const recommendedProducts = advice
    ? catalog.filter((p) =>
        advice.recommendedProductIds.some(
          (recId) =>
            recId.toLowerCase() === p.id.toLowerCase() ||
            p.id.toLowerCase().includes(recId.toLowerCase()) ||
            recId.toLowerCase().includes(p.id.toLowerCase()) ||
            p.name.toLowerCase().includes(recId.toLowerCase()),
        ),
      )
    : []

  const handleAddAll = () => {
    if (!recommendedProducts.length) return
    const ids = recommendedProducts.map((p) => p.id)
    onAddMultipleToCart(ids)
    setAddedAll(true)
    const newAdded: Record<string, boolean> = {}
    ids.forEach((id) => {
      newAdded[id] = true
    })
    setAddedIds(newAdded)
  }

  const handleAddSingle = (id: string) => {
    onAddToCart(id)
    setAddedIds((prev) => ({ ...prev, [id]: true }))
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [id]: false }))
    }, 2000)
  }

  const money = formatXof

  const buildWhatsAppUrl = () => {
    if (!advice) return `https://wa.me/${waNumber}`
    const productNames = recommendedProducts.map((p) => `• ${p.name} (${p.size})`).join('\n')
    const message = `Bonjour NATURE & GRÂCE,\n\nGrâce à votre Conseiller Beauté IA Gemini, j'ai découvert le rituel recommandé pour mes besoins :\n\n"${advice.whatsappSummary}"\n\nProduits du rituel :\n${productNames}\n\nJ'aimerais commander ces soins. Pouvez-vous me préciser les frais et délais de livraison ? Merci !`
    return `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`
  }

  return (
    <div
      className="advisor-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="advisor-modal" role="dialog" aria-modal="true">
        <header className="advisor-header">
          <div>
            <div className="advisor-header-kicker">
              <Sparkles size={13} className="floating-advisor-sparkle" />
              <span>NATURE & GRÂCE · Intelligence Artificielle</span>
            </div>
            <h2>Conseiller Beauté & Soins Personnalisé</h2>
            <p>Propulsé par Google Gemini · Un rituel 100% naturel adapté à vos besoins spécifiques</p>
          </div>
          <button className="advisor-close-btn" onClick={onClose} aria-label="Fermer le conseiller beauté">
            <X size={20} />
          </button>
        </header>

        <div className="advisor-body">
          {/* Sélection rapide de préoccupation */}
          <section className="advisor-chips-section">
            <span>QUEL EST VOTRE OBJECTIF DE SOIN ?</span>
            <div className="advisor-chips">
              {PRESET_CONCERNS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`advisor-chip ${selectedConcern === c.value ? 'selected' : ''}`}
                  onClick={() => handleSelectConcern(c)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </section>

          {/* Formulaire de saisie personnalisée */}
          <form className="advisor-form" onSubmit={handleSubmit}>
            <div className="advisor-input-wrapper">
              <input
                className="advisor-input"
                type="text"
                placeholder="Ex. J'ai la peau réactive avec des petites taches brunes..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
              />
              <button className="advisor-submit" type="submit" disabled={loading || !userInput.trim()}>
                {loading ? (
                  'Consultation…'
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Créer mon rituel</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Loader */}
          {loading && (
            <div className="advisor-loading">
              <div className="advisor-spinner" />
              <p>Gemini analyse votre besoin et compose votre rituel de soins naturels personnalisé…</p>
            </div>
          )}

          {/* Résultat du conseil */}
          {!loading && advice && (
            <div className="advisor-result">
              {/* Carte de diagnostic */}
              <div className="advisor-diagnosis-card">
                <b>
                  <Leaf size={14} /> Votre Diagnostic Beauté Naturel
                </b>
                <p>{advice.diagnosis}</p>
              </div>

              {/* Rituels Matin & Soir */}
              <div className="advisor-routines-grid">
                <div className="advisor-routine-box">
                  <h4>
                    <Sun size={15} color="#d49a37" /> Rituel du Matin
                  </h4>
                  <ol>
                    {advice.routineMorning.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                </div>

                <div className="advisor-routine-box">
                  <h4>
                    <Moon size={15} color="#58768e" /> Rituel du Soir
                  </h4>
                  <ol>
                    {advice.routineEvening.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* Astuces naturelles */}
              {advice.naturalTips && advice.naturalTips.length > 0 && (
                <div className="advisor-tips-box">
                  <b>💡 Astuces & secrets de beauté au naturel</b>
                  <ul>
                    {advice.naturalTips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Produits recommandés */}
              {recommendedProducts.length > 0 && (
                <section className="advisor-products-section">
                  <div className="advisor-products-heading">
                    <h3>Les soins NATURE & GRÂCE de votre rituel</h3>
                    <span style={{ fontSize: '10px', color: '#738072' }}>
                      {recommendedProducts.length} soin{recommendedProducts.length > 1 ? 's' : ''} sélectionné{recommendedProducts.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="advisor-products-list">
                    {recommendedProducts.map((prod) => (
                      <div className="advisor-product-card" key={prod.id}>
                        <div className="advisor-product-card-info">
                          <b>{prod.name}</b>
                          <small>{prod.category} · {prod.size}</small>
                        </div>
                        <div className="advisor-product-card-bottom">
                          <strong>{money(prod.price)}</strong>
                          <button
                            type="button"
                            className="advisor-add-single-btn"
                            onClick={() => handleAddSingle(prod.id)}
                            aria-label={`Ajouter ${prod.name} au panier`}
                          >
                            {addedIds[prod.id] ? (
                              <>
                                <Check size={12} /> Ajouté
                              </>
                            ) : (
                              <>
                                <Plus size={12} /> Ajouter
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="advisor-actions-bar">
                    <button type="button" className="advisor-bundle-btn" onClick={handleAddAll}>
                      {addedAll ? (
                        <>
                          <Check size={16} /> Routine complète ajoutée au panier !
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} /> Ajouter toute la routine au panier ({recommendedProducts.length} soins)
                        </>
                      )}
                    </button>

                    <a
                      className="advisor-wa-btn"
                      href={buildWhatsAppUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle size={16} />
                      <span>Commander cette routine sur WhatsApp</span>
                      <ArrowRight size={14} />
                    </a>
                  </div>
                </section>
              )}

              {advice.isDemo && (
                <div className="advisor-demo-badge">
                  Mode Démonstration · Pour activer la génération en direct via Gemini 3.8 Flash, renseignez GEMINI_API_KEY.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
export default BeautyAdvisorModal
