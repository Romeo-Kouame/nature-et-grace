import React, { useEffect, useState } from 'react'
import { Check, MessageCircle, Sparkles } from 'lucide-react'
import { AppProvider, useApp } from './context/AppContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import MobileTabBar from './components/MobileTabBar'
import CartDrawer from './components/CartDrawer'
import BeautyAdvisorModal from './components/BeautyAdvisorModal'
import HomePage from './pages/HomePage'
import ShopPage from './pages/ShopPage'
import ProductDetailPage from './pages/ProductDetailPage'
import TestimonialsPage from './pages/TestimonialsPage'
import FavoritesPage from './pages/FavoritesPage'
import StoryPage from './pages/StoryPage'
import ContactPage from './pages/ContactPage'
import LegalPage from './pages/LegalPage'
import NotFoundPage from './pages/NotFoundPage'
import LoginPage from './pages/LoginPage'
import { AccountPage, OrdersPage } from './pages/AccountPages'
import { useReveal } from './hooks/useReveal'
import './nature.css'
import './pages.css'
import './checkout.css'
import './account.css'
import './visual.css'

function renderPage(path: string) {
  const clean = path.replace(/\/+$/, '') || '/'
  if (clean.startsWith('/produit/')) return <ProductDetailPage productId={decodeURIComponent(clean.slice('/produit/'.length).split('/')[0])} />
  switch (clean) {
    case '/':
      return <HomePage />
    case '/boutique':
      return <ShopPage />
    case '/temoignages':
      return <TestimonialsPage />
    case '/favoris':
      return <FavoritesPage />
    case '/histoire':
      return <StoryPage />
    case '/contact':
      return <ContactPage />
    case '/connexion':
      return <LoginPage />
    case '/compte':
      return <AccountPage />
    case '/commandes':
      return <OrdersPage />
    case '/mentions-legales':
      return <LegalPage kind="mentions" />
    case '/cgv':
      return <LegalPage kind="cgv" />
    case '/confidentialite':
      return <LegalPage kind="confidentialite" />
    default:
      return <NotFoundPage />
  }
}

function AppContent() {
  const { currentPath, toastMessage, waLink, setAdvisorOpen } = useApp()
  useReveal()
  // Le bouton du conseiller IA se réduit à une icône dès qu'on fait défiler la page
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 320)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="app-shell">
      <a className="ng-skip" href="#contenu">
        Aller au contenu
      </a>
      <Navbar />

      <main id="contenu" className="ng-page" key={currentPath}>
        {renderPage(currentPath)}
      </main>

      <Footer />
      <MobileTabBar />

      {toastMessage && (
        <div className="ng-toast" role="status">
          <Check size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Boutons flottants (ordinateur) : sur téléphone, la barre du bas les remplace */}
      <div className={`ng-floating ${scrolled ? 'compact' : ''}`}>
        <button type="button" className="ng-floating-ai" onClick={() => setAdvisorOpen(true)} aria-label="Conseiller beauté IA" title="Conseiller beauté IA">
          <Sparkles size={18} /> <span>Conseiller beauté IA</span>
        </button>
        <a className="ng-floating-wa" href={waLink()} target="_blank" rel="noreferrer" aria-label="Écrire à la boutique sur WhatsApp">
          <MessageCircle size={22} />
        </a>
      </div>

      <CartDrawer />
      <BeautyAdvisorModal />
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
