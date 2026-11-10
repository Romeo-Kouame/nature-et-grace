import React, { useState } from 'react'
import {
  ArrowLeft,
  Check,
  Heart,
  Leaf,
  MessageCircle,
  Minus,
  Plus,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import ProductCardJumia from '../components/ProductCardJumia'
import { formatXof } from '../format'

interface ProductDetailPageProps {
  productId: string
  onOpenAdvisor: () => void
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
  'coffret-rituel-eclat': {
    benefits: [
      'Le rituel beauté 100% complet pour nettoyer, hydrater et régénérer',
      'Réunit le Savon noir, la Chantilly fondante et le Beurre brut',
      'Permet d’économiser 1 500 FCFA par rapport à l’achat individuel',
      'Présenté dans un emballage soigné prêt à offrir',
    ],
    howToUse: [
      'Matin : Nettoyer avec le savon noir puis appliquer la Chantilly de cacao',
      'Soir : Nettoyer en douceur et nourrir en profondeur avec le Beurre brut',
    ],
    ingredients: 'Assortiment de nos trois soins naturels phares certifiés sans additifs.',
    origin: 'Artisanat naturel de Côte d’Ivoire.',
  },
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ productId, onOpenAdvisor }) => {
  const { products, navigate, addToCart, toggleFavorite, isFavorite } = useApp()
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState<'benefits' | 'howTo' | 'ingredients'>('benefits')

  const product = products.find((p) => p.id === productId) || products[0]
  const favorite = isFavorite(product.id)

  // Produits similaires : même catégorie ou complémentaires, hors produit actuel
  const similarProducts = products
    .filter((p) => p.id !== product.id && (p.category === product.category || p.category === 'Beurre de cacao'))
    .slice(0, 4)

  const extra = PRODUCT_EXTRA_DATA[product.id] || {
    benefits: [
      'Formule 100% pure et naturelle issue de matières premières sélectionnées',
      'Nourrit, régénère et protège la peau au quotidien',
    ],
    howToUse: ['Appliquer sur peau propre et légèrement humide en massant délicatement.'],
    ingredients: 'Ingrédients purs d’origine naturelle de Côte d’Ivoire.',
    origin: 'Fait avec soin en Côte d’Ivoire.',
  }

  const money = formatXof

  const handleBuy = () => {
    addToCart(product.id, quantity)
  }

  const handleWhatsApp = () => {
    const text = `Bonjour NATURE & GRÂCE,\n\nJe souhaite commander le soin suivant vu sur votre site :\n• ${product.name} (${product.size}) en quantité ${quantity} — ${money(product.price ? product.price * quantity : null)}\n\nPouvez-vous me préciser les modalités de livraison à domicile et paiement Wave ? Merci !`
    window.open(`https://wa.me/2250717684751?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div style={{ padding: '20px 4% 60px' }}>
      {/* Fil d'ariane & retour */}
      <button
        type="button"
        style={{
          background: 'none',
          border: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          color: 'var(--text-secondary)',
          fontSize: '11.5px',
          cursor: 'pointer',
          marginBottom: '18px',
        }}
        onClick={() => navigate('/boutique')}
      >
        <ArrowLeft size={15} /> Retour au catalogue
      </button>

      {/* Carte Détail Produit */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: '1fr 1.3fr',
          gap: '30px',
          padding: '30px',
          marginBottom: '45px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Visuel Produit */}
        <div style={{ position: 'relative', background: 'var(--bg-subtle)', borderRadius: '12px', minHeight: '340px', display: 'grid', placeItems: 'center', padding: '24px' }}>
          {product.discount && <span className="jumia-discount-tag">{product.discount}</span>}
          <button
            type="button"
            className={`jumia-fav-btn ${favorite ? 'active' : ''}`}
            onClick={() => toggleFavorite(product.id)}
            style={{ top: '14px', right: '14px' }}
            aria-label={favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <Heart size={18} fill={favorite ? 'currentColor' : 'none'} />
          </button>

          <div className={`product-image ${product.tone} ${product.imageUrl ? 'has-photo' : ''}`} style={{ width: '100%', height: '100%' }}>
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

        {/* Détails & Achat */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '10px', color: 'var(--brand-gold)', letterSpacing: '0.12em', fontWeight: 600, textTransform: 'uppercase' }}>
              {product.category} · {product.size}
            </span>
            <h1 style={{ font: "500 clamp(24px, 2.5vw, 32px)/1.15 'Playfair Display', serif", margin: '6px 0 8px', color: 'var(--text-primary)' }}>
              {product.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
              <span className="jumia-stars">★ {product.rating}</span>
              <span style={{ color: 'var(--text-muted)' }}>({product.reviewCount} avis clients vérifiés)</span>
              <span className="product-stock-tag in-stock">
                <span className="product-stock-dot" /> {product.stock > 0 ? `${product.stock} disponibles en inventaire` : 'Rupture'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--brand-gold)' }}>{money(product.price)}</span>
            {product.oldPrice && <span style={{ fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>{money(product.oldPrice)}</span>}
            {product.discount && (
              <span style={{ background: '#ffe4e6', color: '#e11d48', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>
                Économie de {money((product.oldPrice ?? 0) - (product.price ?? 0))}
              </span>
            )}
          </div>

          <p style={{ fontSize: '12px', lineHeight: 1.7, color: 'var(--text-secondary)', margin: 0 }}>{product.description}</p>

          {/* Onglets Bienfaits / Utilisation / Ingrédients */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
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
                Rituel d’utilisation
              </button>
              <button
                type="button"
                className={`product-modal-tab ${activeTab === 'ingredients' ? 'active' : ''}`}
                onClick={() => setActiveTab('ingredients')}
              >
                Ingrédients & Origine
              </button>
            </div>

            <div className="product-modal-tab-panel" style={{ minHeight: '90px', padding: '12px 0' }}>
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
                  <p style={{ margin: '0 0 6px 0' }}>
                    <strong>Composition :</strong> {extra.ingredients}
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>Origine :</strong> {extra.origin}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions d'Achat (avec vérification de connexion automatique !) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="product-modal-qty">
                <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                  <Minus size={13} />
                </button>
                <span>{quantity}</span>
                <button type="button" onClick={() => setQuantity(quantity + 1)}>
                  <Plus size={13} />
                </button>
              </div>

              <button
                type="button"
                className="jumia-buy-btn"
                style={{ padding: '12px 20px', fontSize: '12.5px' }}
                onClick={handleBuy}
              >
                Ajouter au panier ({money(product.price ? product.price * quantity : null)})
              </button>
            </div>

            <button type="button" className="product-modal-wa-btn" onClick={handleWhatsApp}>
              <MessageCircle size={16} /> Commander ce soin sur WhatsApp
            </button>

            <button type="button" className="product-modal-ai-btn" onClick={onOpenAdvisor}>
              <Sparkles size={14} /> Demander au Conseiller IA si ce soin correspond à votre peau
            </button>
          </div>
        </div>
      </div>

      {/* SECTION PRODUITS SIMILAIRES */}
      <section style={{ marginTop: '50px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
          <div>
            <span style={{ fontSize: '10px', color: 'var(--brand-gold)', letterSpacing: '0.14em', fontWeight: 600 }}>
              RECOMMANDATIONS
            </span>
            <h2 style={{ font: "500 26px 'Playfair Display', serif", margin: '4px 0 0', color: 'var(--text-primary)' }}>
              Produits Similaires & Complémentaires
            </h2>
          </div>
          <button
            type="button"
            className="text-link"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand-gold)', fontWeight: 600, fontSize: '11px' }}
            onClick={() => navigate('/boutique')}
          >
            Voir toute la sélection
          </button>
        </div>

        <div className="jumia-products-grid">
          {similarProducts.map((p) => (
            <ProductCardJumia product={p} key={p.id} />
          ))}
        </div>
      </section>
    </div>
  )
}
export default ProductDetailPage
