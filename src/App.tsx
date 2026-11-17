import React, { useEffect } from 'react'
import { Check, MessageCircle } from 'lucide-react'
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
import CookieBanner from './components/CookieBanner'
import { initAnalytics, trackPageView } from './analytics'
import { SITE_URL, useJsonLd } from './hooks/useJsonLd'
import './nature.css'
import './pages.css'
import './checkout.css'
import './account.css'
import './visual.css'
import './login.css'

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
    case '/remboursement':
      return <LegalPage kind="remboursement" />
    case '/cookies':
      return <LegalPage kind="cookies" />
    default:
      return <NotFoundPage />
  }
}

function AppContent() {
  const { currentPath, toastMessage, waLink, settings } = useApp()
  useReveal()
  useEffect(() => initAnalytics(), [])
  // Une page vue par changement de page (uniquement si le visiteur a accepté la mesure d'audience)
  useEffect(() => trackPageView(currentPath), [currentPath])

  // Fiche entreprise pour Google (type « Store », une sorte de LocalBusiness), construite à partir des réglages de la boutique
  useJsonLd('business', {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: 'NATURE & GRÂCE',
    slogan: 'Prenez soin de vous naturellement',
    description: 'Soins naturels au beurre de cacao, karité, savon noir et huiles végétales de Côte d’Ivoire.',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.jpeg`,
    image: `${SITE_URL}/photos/a-hero.webp`,
    telephone: `+${settings.whatsappNumber}`,
    currenciesAccepted: 'XOF',
    paymentAccepted: 'Wave',
    areaServed: settings.deliveryCommunes,
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'CI',
      ...(settings.storeAddress ? { streetAddress: settings.storeAddress } : {}),
    },
  })

  // Page de connexion : page autonome, sans l'en-tête ni le pied de page du site (comme les grandes boutiques en ligne)
  if ((currentPath.replace(/\/+$/, '') || '/') === '/connexion') {
    return (
      <div className="app-shell app-shell--bare">
        <main id="contenu" key={currentPath}>
          <LoginPage />
        </main>
        {toastMessage && (
          <div className="ng-toast" role="status">
            <Check size={16} />
            <span>{toastMessage}</span>
          </div>
        )}
        <CookieBanner />
      </div>
    )
  }

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

      {/* Bouton WhatsApp flottant (ordinateur) : sur téléphone, la barre du bas le remplace */}
      <div className="ng-floating">
        <a className="ng-floating-wa" href={waLink()} target="_blank" rel="noreferrer" aria-label="Écrire à la boutique sur WhatsApp">
          <MessageCircle size={22} />
        </a>
      </div>

      <CookieBanner />
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
