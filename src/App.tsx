import React, { FormEvent, useState } from 'react'
import {
  ArrowRight,
  Check,
  ChevronRight,
  Heart,
  Leaf,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  X,
} from 'lucide-react'
import { AppProvider, useApp } from './context/AppContext'
import NavbarJumia from './components/NavbarJumia'
import AuthModal from './components/AuthModal'
import BeautyAdvisorModal from './components/BeautyAdvisorModal'
import HomePage from './pages/HomePage'
import ShopPage from './pages/ShopPage'
import ProductDetailPage from './pages/ProductDetailPage'
import TestimonialsPage from './pages/TestimonialsPage'
import FavoritesPage from './pages/FavoritesPage'
import StoryPage from './pages/StoryPage'
import ContactPage from './pages/ContactPage'
import { api } from './api'
import './advisor.css'
import './enhancements.css'
import './jumia.css'
import './nature.css'
import MobileTabBar from './components/MobileTabBar'
import Footer from './components/Footer'
import { useReveal } from './hooks/useReveal'
import { formatXof } from './format'

function AppContent() {
  const {
    currentPath,
    navigate,
    products,
    cart,
    cartCount,
    cartTotal,
    cartOpen,
    setCartOpen,
    changeQuantity,
    clearCart,
    user,
    toastMessage,
    addToCart,
    openAuthModal,
  } = useApp()

  useReveal()
  const [advisorOpen, setAdvisorOpen] = useState(false)
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [orderMessage, setOrderMessage] = useState('')
  const [orderReference, setOrderReference] = useState('')

  const waNumber = '2250717684751'

  const selectedProducts = products.filter((p) => cart[p.id])

  const money = formatXof

  const handleWhatsAppOrder = () => {
    const lines = selectedProducts
      .map(
        (item) =>
          `• ${item.name} (${item.size}) x${cart[item.id]} — ${money(item.price === null ? null : item.price * cart[item.id])}`,
      )
      .join('\n')
    const customerInfo = user
      ? `\nClient : ${user.name} (${user.phone})\nCommune : ${user.commune || 'Abidjan'}`
      : ''
    const message = `Bonjour NATURE & GRÂCE, je souhaite commander :${customerInfo}\n\n${lines}\n\nTotal produits : ${money(cartTotal)}\nMerci de me préciser les frais et délais de livraison.`
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
  }

  const [orderFailed, setOrderFailed] = useState(false)
  const [orderSending, setOrderSending] = useState(false)

  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const missing = selectedProducts.filter((p) => !p.apiId)
    if (missing.length) {
      // Catalogue hors ligne : impossible d'enregistrer la commande sur le serveur
      setOrderFailed(true)
      setOrderMessage('La commande en ligne est momentanément indisponible. Finalisez-la sur WhatsApp, votre panier y sera transmis.')
      return
    }
    setOrderSending(true)
    setOrderFailed(false)
    setOrderMessage('')
    try {
      const order = await api<{ id: string }>('/orders', {
        method: 'POST',
        body: JSON.stringify({
          customerName: form.get('customerName'),
          phone: form.get('phone'),
          commune: form.get('commune'),
          address: form.get('address'),
          items: selectedProducts.map((p) => ({ productId: p.apiId, quantity: cart[p.id] })),
        }),
      })
      const reference = order.id.slice(-6).toUpperCase()
      setOrderReference(reference)
      setOrderMessage(
        `Commande ${reference} enregistrée ! La boutique vous contacte pour confirmer la livraison et le paiement Wave.`,
      )
      setShowOrderForm(false)
      clearCart()
    } catch (error) {
      // Rien n'a été enregistré : on le dit clairement et on propose WhatsApp
      setOrderFailed(true)
      setOrderMessage(
        `${error instanceof Error ? error.message : 'La commande n’a pas pu être envoyée.'} Vous pouvez la finaliser sur WhatsApp.`,
      )
    } finally {
      setOrderSending(false)
    }
  }

  // Routeur sans #
  const renderCurrentPage = () => {
    if (currentPath.startsWith('/produit/')) {
      const productId = currentPath.replace('/produit/', '').split('/')[0]
      return <ProductDetailPage productId={productId} onOpenAdvisor={() => setAdvisorOpen(true)} />
    }
    if (currentPath === '/boutique') {
      return <ShopPage onOpenAdvisor={() => setAdvisorOpen(true)} />
    }
    if (currentPath === '/temoignages') {
      return <TestimonialsPage onOpenAdvisor={() => setAdvisorOpen(true)} />
    }
    if (currentPath === '/favoris') {
      return <FavoritesPage />
    }
    if (currentPath === '/histoire') {
      return <StoryPage onOpenAdvisor={() => setAdvisorOpen(true)} />
    }
    if (currentPath === '/contact') {
      return <ContactPage />
    }
    return <HomePage onOpenAdvisor={() => setAdvisorOpen(true)} />
  }

  return (
    <div className="app-shell" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <NavbarJumia onOpenAdvisor={() => setAdvisorOpen(true)} />

      {/* Page active — fondu doux à chaque navigation */}
      <main style={{ flex: 1 }} className="ng-page" key={currentPath}>
        {renderCurrentPage()}
      </main>

      <Footer />

      <MobileTabBar />

      {/* TOAST FLOTTANT */}
      {toastMessage && (
        <div className="toast">
          <Check size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TIROIR DU PANIER */}
      {cartOpen && (
        <div
          className="overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setCartOpen(false)
          }}
        >
          <aside className="cart-drawer">
            <div className="drawer-heading">
              <div>
                <span>VOTRE SÉLECTION</span>
                <h2>
                  Mon panier <i>({cartCount})</i>
                </h2>
              </div>
              <button className="icon-button" onClick={() => setCartOpen(false)} aria-label="Fermer">
                <X />
              </button>
            </div>

            {selectedProducts.length === 0 ? (
              <div className="empty-cart">
                <ShoppingBag size={36} color="var(--brand-gold)" />
                <p>{orderMessage || 'Votre panier attend ses premiers essentiels.'}</p>
                {orderReference && (
                  <a
                    className="button primary"
                    href={`https://wa.me/${waNumber}?text=${encodeURIComponent(
                      `Bonjour, je souhaite transmettre la confirmation Wave pour ma commande ${orderReference}.`,
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Envoyer ma preuve sur WhatsApp <ArrowRight size={16} />
                  </a>
                )}
                <button
                  type="button"
                  className="button secondary-empty"
                  onClick={() => {
                    setCartOpen(false)
                    navigate('/boutique')
                  }}
                >
                  Découvrir la boutique
                </button>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {selectedProducts.map((item) => (
                    <div className="cart-item" key={item.id}>
                      <div className={`cart-thumb ${item.tone}`}>
                        {item.imageUrl ? <img src={item.imageUrl} alt="" /> : <span>N&G</span>}
                      </div>
                      <div className="cart-item-copy">
                        <b>{item.name}</b>
                        <small>
                          {item.size} · {money(item.price)}
                        </small>
                        <div className="quantity">
                          <button
                            type="button"
                            onClick={() => changeQuantity(item.id, -1)}
                            aria-label="Retirer un article"
                          >
                            <Minus size={13} />
                          </button>
                          <span>{cart[item.id]}</span>
                          <button
                            type="button"
                            onClick={() => changeQuantity(item.id, 1)}
                            aria-label="Ajouter un article"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>
                      <strong>{money(item.price === null ? null : item.price * cart[item.id])}</strong>
                    </div>
                  ))}
                </div>

                <div className="cart-summary">
                  <p>
                    <span>Sous-total produits</span>
                    <b>{money(cartTotal)}</b>
                  </p>
                  <small>Frais de livraison confirmés par la boutique selon votre commune.</small>

                  {showOrderForm ? (
                    <form className="order-form" onSubmit={submitOrder}>
                      <label>
                        Nom complet
                        <input name="customerName" defaultValue={user?.name || ''} minLength={2} required />
                      </label>
                      <label>
                        Téléphone WhatsApp
                        <input name="phone" type="tel" defaultValue={user?.phone || ''} minLength={8} required />
                      </label>
                      <label>
                        Commune de livraison
                        <input
                          name="commune"
                          defaultValue={user?.commune || 'Cocody, Abidjan'}
                          placeholder="Ex. Cocody, Yopougon, Marcory..."
                          required
                        />
                      </label>
                      <label>
                        Adresse précise de livraison
                        <textarea
                          name="address"
                          defaultValue={user?.address || ''}
                          placeholder="Quartier, carrefour, repère..."
                          minLength={5}
                          required
                        />
                      </label>
                      <button className="button primary checkout" type="submit" disabled={orderSending}>
                        {orderSending ? 'Envoi en cours…' : 'Valider ma commande'} <ArrowRight size={17} />
                      </button>
                      <button className="order-back" type="button" onClick={() => setShowOrderForm(false)}>
                        Retour au panier
                      </button>
                      {orderMessage && (
                        <p className={`order-message ${orderFailed ? 'is-error' : ''}`} role="alert">
                          {orderMessage}
                        </p>
                      )}
                      {orderFailed && (
                        <button type="button" className="button whatsapp-checkout" onClick={handleWhatsAppOrder}>
                          Finaliser sur WhatsApp
                        </button>
                      )}
                    </form>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="button primary checkout"
                        onClick={() => {
                          setShowOrderForm(true)
                          setOrderMessage('')
                        }}
                      >
                        Commander sur le site <ArrowRight size={17} />
                      </button>
                      <button type="button" className="button whatsapp-checkout" onClick={handleWhatsAppOrder}>
                        Continuer sur WhatsApp
                      </button>
                    </>
                  )}

                  <div className="wave-note">
                    <span>W</span>
                    <p>
                      Paiement par Wave Côte d’Ivoire
                      <br />
                      <small>Transfert direct sans frais après confirmation de la boutique.</small>
                    </p>
                  </div>
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      {/* BOUTON FLOTTANT DU CONSEILLER IA */}
      <button
        type="button"
        className="floating-advisor"
        onClick={() => setAdvisorOpen(true)}
        aria-label="Conseiller Beauté IA"
      >
        <Sparkles size={16} className="floating-advisor-sparkle" />
        <span>Conseiller Beauté IA</span>
      </button>

      {/* BOUTON FLOTTANT WHATSAPP */}
      <a
        className="floating-wa"
        href={`https://wa.me/${waNumber}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Contacter la boutique sur WhatsApp"
      >
        WA
      </a>

      {/* MODALE D'AUTHENTIFICATION CLIENT */}
      <AuthModal />

      {/* MODALE CONSEILLER BEAUTÉ IA GEMINI */}
      <BeautyAdvisorModal
        isOpen={advisorOpen}
        onClose={() => setAdvisorOpen(false)}
        catalog={products}
        onAddToCart={(id) => {
          if (!user) {
            openAuthModal('Connectez-vous pour ajouter ce rituel à votre panier !')
          } else {
            addToCart(id, 1)
          }
        }}
        onAddMultipleToCart={(ids) => {
          if (!user) {
            openAuthModal('Connectez-vous pour ajouter cette routine à votre panier !')
          } else {
            ids.forEach((id) => addToCart(id, 1))
          }
        }}
        waNumber={waNumber}
      />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
