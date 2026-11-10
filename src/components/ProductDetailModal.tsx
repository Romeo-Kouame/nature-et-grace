import React, { useState } from 'react'
import { Check, Heart, Leaf, MessageCircle, Minus, Plus, Sparkles, X } from 'lucide-react'
import { formatXof } from '../format'

export type DetailProduct = {
  id: string
  name: string
  category: string
  size: string
  price: number | null
  description: string
  tone: string
  imageUrl?: string | null
  badge?: string
}

interface ProductDetailModalProps {
  product: DetailProduct | null
  isOpen: boolean
  onClose: () => void
  onAddToCart: (productId: string, quantity: number) => void
  onAskAdvisor: (product: DetailProduct) => void
  waNumber: string
}

const PRODUCT_EXTRA_DATA: Record<
  string,
  {
    benefits: string[]
    howToUse: string[]
    ingredients: string
    origin: string
  }
> = {
  'beurre-de-cacao-brut': {
    benefits: [
      'Nourrit intensément les peaux sèches à très sèches',
      'Aide à prévenir et estomper l’apparence des vergetures et cicatrices',
      'Concentré naturel en antioxydants, polyphénols et vitamine E',
      'Protège durablement la barrière cutanée contre la déshydratation',
    ],
    howToUse: [
      'Prélevez une petite noisette de beurre brut solide',
      'Faites-la fondre quelques secondes au creux de vos mains tièdes',
      'Massez en mouvements circulaires sur les zones ciblées (ventre, cuisses, coudes, talons, lèvres)',
      'Idéal en soin de nuit ou après la douche sur peau encore légèrement humide',
    ],
    ingredients: '100% Beurre de fèves de cacao (Theobroma Cacao) pur et non raffiné.',
    origin: 'Récolté et extrait artisanalement en Côte d’Ivoire.',
  },
  'chantilly-beurre-cacao': {
    benefits: [
      'Texture fouettée onctueuse qui fond immédiatement au contact de la peau',
      'Pénétration rapide sans film gras collant',
      'Hydrate et adoucit l’ensemble du corps avec un doux parfum gourmand naturel',
      'Excellente pour gainer et sceller l’hydratation des cheveux crépus, frisés ou secs',
    ],
    howToUse: [
      'Appliquez une noisette généreuse sur le corps après la douche',
      'Sur les cheveux : appliquez sur les pointes et longueurs après votre leave-in ou vaporisation d’eau',
      'Convient à toute la famille pour un usage quotidien',
    ],
    ingredients: 'Beurre de cacao pur fouetté, enrichi aux huiles végétales nourrissantes 100% pures.',
    origin: 'Formulé et fouetté avec soin en Côte d’Ivoire.',
  },
  'savon-noir-cabosse-cacao': {
    benefits: [
      'Nettoie en profondeur les impuretés sans décaper la barrière protectrice',
      'Régule l’excès de sébum et aide à estomper les boutons et comédons',
      'Riche en minéraux issus des cendres de cabosse de cacao',
      'Révèle un teint net, frais et naturellement lumineux',
    ],
    howToUse: [
      'Faites mousser une petite quantité de savon entre vos mains humides',
      'Massez délicatement le visage ou le corps en évitant le contour immédiat des yeux',
      'Rincez abondamment à l’eau tiède puis appliquez votre Chantilly ou Beurre de cacao',
      'Utiliser 1 à 2 fois par jour selon la sensibilité de votre peau',
    ],
    ingredients: 'Cendres de cabosses de cacao brûlées traditionnellement, huiles végétales saponifiées douces.',
    origin: 'Savoir-faire artisanal traditionnel ivoirien.',
  },
  'huile-de-coco': {
    benefits: [
      'Huile végétale vierge ultra-nourrissante et protectrice',
      'Assouplit la peau et prévient la déshydratation',
      'Répare la fibre capillaire et apporte une brillance naturelle sublime',
      'Idéale pour les bains d’huile et les massages relaxants',
    ],
    howToUse: [
      'En bain d’huile : appliquez sur les cheveux avant le shampooing, laissez poser 30 min sous serviette tiède',
      'Sur le corps : massez directement pour un fini soyeux et lumineux',
    ],
    ingredients: '100% Huile de noix de coco vierge de première pression.',
    origin: 'Origine naturelle garantie.',
  },
  'huile-de-neem': {
    benefits: [
      'Reconnue pour ses vertus antibactériennes, purifiantes et assainissantes exceptionnelles',
      'Aide activement contre les imperfections cutanées et boutons récalcitrants',
      'Apaise les démangeaisons du cuir chevelu et prévient les pellicules',
    ],
    howToUse: [
      'En application locale : déposez 1 à 2 gouttes directement sur les boutons le soir',
      'Sur le cuir chevelu : mélangez quelques gouttes à votre huile habituelle et massez avant le lavage',
    ],
    ingredients: '100% Huile de graines de neem (Azadirachta indica) pure.',
    origin: 'Origine végétale naturelle sélectionnée.',
  },
  'huile-de-karite': {
    benefits: [
      'Toute la richesse protectrice du karité dans une texture fluide facile à étaler',
      'Restaure l’élasticité de la peau et apaise les tiraillements',
      'Parfaite pour sceller l’hydratation cutanée et capillaire au quotidien',
    ],
    howToUse: [
      'Appliquez quelques gouttes sur peau propre et massez jusqu’à pénétration',
      'S’utilise aussi bien sur le corps, le visage que sur la barbe ou les longueurs de cheveux',
    ],
    ingredients: '100% Oléine de karité pure extraite avec douceur.',
    origin: 'Afrique de l’Ouest.',
  },
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onAskAdvisor,
  waNumber,
}) => {
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState<'benefits' | 'howTo' | 'ingredients'>('benefits')
  const [added, setAdded] = useState(false)

  if (!isOpen || !product) return null

  const extra = PRODUCT_EXTRA_DATA[product.id] || {
    benefits: [
      'Soin 100% naturel formulé pour respecter votre équilibre cutané',
      'Apporte souplesse, douceur et éclat au quotidien',
      'Convient à tous types de peaux, même sensibles',
    ],
    howToUse: [
      'Appliquer une petite quantité sur peau propre et légèrement humide',
      'Masser délicatement jusqu’à absorption complète',
    ],
    ingredients: 'Ingrédients purs d’origine naturelle sélectionnés avec rigueur.',
    origin: 'Fait avec soin en Côte d’Ivoire.',
  }

  const money = formatXof

  const handleAdd = () => {
    onAddToCart(product.id, quantity)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const handleWhatsApp = () => {
    const text = `Bonjour NATURE & GRÂCE,\n\nJe suis intéressé(e) par votre soin :\n• ${product.name} (${product.size}) en quantité ${quantity} — ${money(product.price ? product.price * quantity : null)}\n\nPouvez-vous me confirmer la disponibilité et les modalités de livraison ? Merci !`
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      className="product-modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="product-modal" role="dialog" aria-modal="true" aria-labelledby="modal-product-title">
        <button className="product-modal-close" onClick={onClose} aria-label="Fermer la fiche produit">
          <X size={18} />
        </button>

        <div className="product-modal-grid">
          {/* Visuel produit */}
          <div className="product-modal-visual">
            {product.badge && <span className="product-modal-badge">{product.badge}</span>}
            <div className={`product-image ${product.tone} ${product.imageUrl ? 'has-photo' : ''}`}>
              <img className="real-product-image" src={product.imageUrl ?? undefined} alt={product.name} />
              <div className="product-ornament">✳</div>
              <div className="mini-product">
                <span>
                  {product.category === 'Huiles naturelles' ? 'N&G' : 'NATURE'}
                  <small>{product.category === 'Huiles naturelles' ? product.name.toUpperCase() : '& GRÂCE'}</small>
                </span>
              </div>
            </div>
          </div>

          {/* Contenu et Détails */}
          <div className="product-modal-content">
            <div>
              <span className="product-modal-category">{product.category}</span>
              <h2 className="product-modal-title" id="modal-product-title">
                {product.name}
              </h2>
              <div className="product-modal-meta-row">
                <span className="product-modal-price">{money(product.price)}</span>
                <span className="product-modal-size">{product.size}</span>
                <span className="product-stock-tag in-stock">
                  <span className="product-stock-dot" /> En stock
                </span>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.7, color: '#566453' }}>{product.description}</p>

            {/* Onglets interactifs */}
            <div>
              <div className="product-modal-tabs">
                <button
                  type="button"
                  className={`product-modal-tab ${activeTab === 'benefits' ? 'active' : ''}`}
                  onClick={() => setActiveTab('benefits')}
                >
                  Bienfaits & Propriétés
                </button>
                <button
                  type="button"
                  className={`product-modal-tab ${activeTab === 'howTo' ? 'active' : ''}`}
                  onClick={() => setActiveTab('howTo')}
                >
                  Rituel d'utilisation
                </button>
                <button
                  type="button"
                  className={`product-modal-tab ${activeTab === 'ingredients' ? 'active' : ''}`}
                  onClick={() => setActiveTab('ingredients')}
                >
                  Ingrédients & Origine
                </button>
              </div>

              <div className="product-modal-tab-panel">
                {activeTab === 'benefits' && (
                  <ul>
                    {extra.benefits.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                )}
                {activeTab === 'howTo' && (
                  <ul>
                    {extra.howToUse.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                )}
                {activeTab === 'ingredients' && (
                  <div>
                    <p style={{ margin: '0 0 8px 0' }}>
                      <strong>Formulation :</strong> {extra.ingredients}
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>Origine :</strong> {extra.origin}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions d'achat et conseil */}
            <div className="product-modal-actions">
              <div className="product-modal-buy-row">
                <div className="product-modal-qty">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    aria-label="Diminuer la quantité"
                  >
                    <Minus size={13} />
                  </button>
                  <span>{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    aria-label="Augmenter la quantité"
                  >
                    <Plus size={13} />
                  </button>
                </div>

                <button type="button" className="product-modal-add-btn" onClick={handleAdd}>
                  {added ? (
                    <>
                      <Check size={16} /> Ajouté au panier !
                    </>
                  ) : (
                    <>
                      <Plus size={16} /> Ajouter au panier
                    </>
                  )}
                </button>
              </div>

              <button type="button" className="product-modal-wa-btn" onClick={handleWhatsApp}>
                <MessageCircle size={15} /> Commander directement sur WhatsApp
              </button>

              <button
                type="button"
                className="product-modal-ai-btn"
                onClick={() => {
                  onClose()
                  onAskAdvisor(product)
                }}
              >
                <Sparkles size={14} /> Demander au Conseiller IA si ce soin correspond à votre peau
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default ProductDetailModal
