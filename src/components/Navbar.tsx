import React, { useEffect, useRef, useState } from 'react'
import { BookOpen, CircleHelp, FileText, Heart, Home, LayoutGrid, LogOut, Menu, MessageCircle, Moon, Package, Search, Sparkles, Star, Sun, Truck, User as UserIcon, X } from 'lucide-react'
import CartIcon from './CartIcon'
import { useApp, formatPhone } from '../context/AppContext'
import SearchBox from './SearchBox'

const NAV_LINKS = [
  { path: '/', label: 'Accueil', icon: Home },
  { path: '/boutique', label: 'Boutique', icon: LayoutGrid },
  { path: '/temoignages', label: 'Avis clients', icon: Star },
  { path: '/histoire', label: 'Notre histoire', icon: BookOpen },
  { path: '/contact', label: 'Contact & livraison', icon: MessageCircle },
]

/** Menu déroulant : se ferme au clic extérieur et avec Échap. */
function useDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])
  return { open, setOpen, ref }
}

/** Vrai si le visiteur est en train d'écrire (on ne détourne pas alors le raccourci « / ») */
const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))

/**
 * En-tête du site, sur une seule ligne : logo · pages · actions (recherche, compte, thème, panier).
 * La conseillère IA s'ouvre par sa bulle en bas à droite (ordinateur) ou par l'icône étoiles de l'en-tête (téléphone).
 * La recherche s'ouvre dans un panneau sous l'en-tête (icône loupe, touche « / » ou Ctrl+K).
 * Sur téléphone : menu, logo, conseillère IA, panier, et la recherche juste en dessous.
 */
export const Navbar: React.FC = () => {
  const {
    currentPath, navigate, theme, toggleTheme, cartCount, openCart, favorites, waLink, setAdvisorOpen,
    user, logout, goToLogin,
  } = useApp()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const account = useDropdown()
  const headerRef = useRef<HTMLElement>(null)

  // Ombre légère dès que la page défile
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Changement de page : panneaux refermés
  useEffect(() => {
    setSearchOpen(false)
    setDrawerOpen(false)
  }, [currentPath])

  // Raccourcis clavier : « / » ou Ctrl+K ouvrent la recherche, Échap la ferme
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === '/' && !isTyping(e.target)) || (e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey))) {
        if (window.matchMedia('(max-width: 860px)').matches) return
        e.preventDefault()
        setSearchOpen(true)
      } else if (e.key === 'Escape') {
        setSearchOpen(false)
        setDrawerOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Clic hors de l'en-tête : la recherche se referme
  useEffect(() => {
    if (!searchOpen) return
    const onClick = (e: MouseEvent) => headerRef.current && !headerRef.current.contains(e.target as Node) && setSearchOpen(false)
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [searchOpen])

  const go = (path: string) => {
    navigate(path)
    setDrawerOpen(false)
    account.setOpen(false)
  }

  /** Page réservée aux clients connectés : sinon, connexion puis retour sur la page demandée */
  const goPrivate = (path: string) => {
    account.setOpen(false)
    setDrawerOpen(false)
    if (user) navigate(path)
    else goToLogin({ then: path })
  }

  const isActive = (path: string) => (path === '/boutique' ? currentPath === path || currentPath.startsWith('/produit/') : currentPath === path)
  const firstName = user?.name.split(' ')[0]
  const initial = user?.name.charAt(0).toUpperCase()

  return (
    <>
      <div className="ng-promo">
        <p>
          <Truck size={14} />
          <span>
            Commande sur le site ou sur WhatsApp<span className="ng-hide-sm"> · Paiement Wave après confirmation de la boutique</span>
          </span>
        </p>
      </div>

      <header className={`ng-header ${scrolled ? 'is-scrolled' : ''} ${searchOpen ? 'is-searching' : ''}`} ref={headerRef}>
        <div className="ng-container">
          <div className="ng-header-main">
            <button type="button" className="ng-icon-btn ng-menu-btn" onClick={() => setDrawerOpen(true)} aria-label="Ouvrir le menu">
              <Menu size={22} />
            </button>

            <a
              className="ng-logo"
              href="/"
              onClick={(e) => {
                e.preventDefault()
                navigate('/')
              }}
              aria-label="Nature & Grâce, accueil"
            >
              <img src="/logo.jpeg" alt="" />
              <span>
                <b>Nature &amp; Grâce</b>
                <small>Cosmétique naturelle</small>
              </span>
            </a>

            <nav className="ng-nav" aria-label="Navigation principale">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.path}
                  href={link.path}
                  className={`ng-nav-link ${isActive(link.path) ? 'active' : ''}`}
                  aria-current={isActive(link.path) ? 'page' : undefined}
                  onClick={(e) => {
                    e.preventDefault()
                    navigate(link.path)
                  }}
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="ng-actions">
              <button
                type="button"
                className={`ng-icon-btn ng-hide-sm ${searchOpen ? 'is-on' : ''}`}
                onClick={() => setSearchOpen((v) => !v)}
                aria-label={searchOpen ? 'Fermer la recherche' : 'Rechercher un soin'}
                aria-expanded={searchOpen}
                title="Rechercher (touche /)"
              >
                {searchOpen ? <X size={20} /> : <Search size={20} />}
              </button>

              {/* COMPTE (et aide) */}
              <div className="ng-dd ng-hide-sm" ref={account.ref}>
                <button
                  type="button"
                  className={`ng-icon-btn ng-account-btn ${account.open ? 'is-on' : ''}`}
                  onClick={() => account.setOpen((v) => !v)}
                  aria-expanded={account.open}
                  aria-haspopup="menu"
                  aria-label={user ? `Mon compte (${firstName})` : 'Se connecter ou créer un compte'}
                  title={user ? `Bonjour, ${firstName}` : 'Se connecter'}
                >
                  {user ? <span className="ng-avatar ng-avatar--sm">{initial}</span> : <UserIcon size={20} />}
                </button>
                {account.open && (
                  <div className="ng-dd-menu ng-dd-menu--right" role="menu">
                    {user ? (
                      <div className="ng-dd-user">
                        <span className="ng-avatar">{initial}</span>
                        <div>
                          <b>{user.name}</b>
                          <small>{user.email || formatPhone(user.phone)}</small>
                        </div>
                      </div>
                    ) : (
                      <div className="ng-dd-cta">
                        <button type="button" className="ng-btn ng-btn--primary ng-btn--block" onClick={() => { account.setOpen(false); goToLogin() }}>
                          Se connecter
                        </button>
                        <p>
                          Nouveau client ?{' '}
                          <button type="button" onClick={() => { account.setOpen(false); goToLogin({ mode: 'register' }) }}>
                            Créer un compte
                          </button>
                        </p>
                      </div>
                    )}
                    <div className="ng-dd-sep" />
                    <button type="button" role="menuitem" className="ng-dd-item" onClick={() => goPrivate('/compte')}>
                      <UserIcon size={18} /> Votre compte
                    </button>
                    <button type="button" role="menuitem" className="ng-dd-item" onClick={() => goPrivate('/commandes')}>
                      <Package size={18} /> Vos commandes
                    </button>
                    <button type="button" role="menuitem" className="ng-dd-item" onClick={() => go('/favoris')}>
                      <Heart size={18} /> Favoris {favorites.length > 0 && <em>{favorites.length}</em>}
                    </button>
                    <div className="ng-dd-sep" />
                    <p className="ng-dd-label">Aide</p>
                    <button type="button" role="menuitem" className="ng-dd-item" onClick={() => go('/contact')}>
                      <CircleHelp size={18} /> Livraison et questions fréquentes
                    </button>
                    <button type="button" role="menuitem" className="ng-dd-item" onClick={() => go('/cgv')}>
                      <FileText size={18} /> Conditions de vente
                    </button>
                    <a role="menuitem" className="ng-dd-item ng-dd-item--wa" href={waLink()} target="_blank" rel="noreferrer" onClick={() => account.setOpen(false)}>
                      <MessageCircle size={18} /> Écrire sur WhatsApp
                    </a>
                    {user && (
                      <>
                        <div className="ng-dd-sep" />
                        <button type="button" role="menuitem" className="ng-dd-item ng-dd-item--danger" onClick={() => { account.setOpen(false); void logout() }}>
                          <LogOut size={18} /> Se déconnecter
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                className="ng-icon-btn ng-hide-sm"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
                title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {/* Téléphone : la conseillère IA prend la place de WhatsApp (joignable depuis le chat et le menu) */}
              <button type="button" className="ng-icon-btn ng-ai-btn ng-show-sm-only" onClick={() => setAdvisorOpen(true)} aria-label="Poser une question à la conseillère IA">
                <Sparkles size={20} />
              </button>

              {/* PANIER */}
              <button
                type="button"
                className="ng-cart-pill"
                data-cart-target
                onClick={openCart}
                aria-label={`Panier, ${cartCount} article${cartCount > 1 ? 's' : ''}`}
              >
                <CartIcon size={19} />
                <span className="ng-hide-sm">Panier</span>
                {cartCount > 0 && <span className="ng-cart-pill-count">{cartCount > 99 ? '99+' : cartCount}</span>}
              </button>
            </div>
          </div>

          <SearchBox className="ng-search-mobile" />
        </div>

        {searchOpen && (
          <div className="ng-search-panel">
            <div className="ng-container">
              <SearchBox className="ng-search--panel" autoFocus />
              <p className="ng-search-hint">
                Astuce : touche <kbd>/</kbd> pour rechercher, <kbd>Échap</kbd> pour fermer.
              </p>
            </div>
          </div>
        )}
      </header>

      {drawerOpen && (
        <div className="ng-drawer-overlay" onMouseDown={(e) => e.target === e.currentTarget && setDrawerOpen(false)}>
          <aside className="ng-drawer" aria-label="Menu">
            <div className="ng-drawer-head">
              <button type="button" className="ng-logo" onClick={() => go('/')}>
                <img src="/logo.jpeg" alt="" />
                <span>
                  <b>Nature &amp; Grâce</b>
                  <small>Cosmétique naturelle</small>
                </span>
              </button>
              <button type="button" className="ng-icon-btn" onClick={() => setDrawerOpen(false)} aria-label="Fermer le menu">
                <X size={22} />
              </button>
            </div>

            {user ? (
              <div className="ng-dd-user ng-drawer-user">
                <span className="ng-avatar">{initial}</span>
                <div>
                  <b>Bonjour, {firstName}</b>
                  <small>{user.email || formatPhone(user.phone)}</small>
                </div>
              </div>
            ) : (
              <div className="ng-dd-cta ng-drawer-cta">
                <button type="button" className="ng-btn ng-btn--primary ng-btn--block" onClick={() => { setDrawerOpen(false); goToLogin() }}>
                  Se connecter
                </button>
                <p>
                  Nouveau client ?{' '}
                  <button type="button" onClick={() => { setDrawerOpen(false); goToLogin({ mode: 'register' }) }}>
                    Créer un compte
                  </button>
                </p>
              </div>
            )}

            <button type="button" className={`ng-drawer-link ${currentPath === '/compte' ? 'active' : ''}`} onClick={() => goPrivate('/compte')}>
              <UserIcon size={19} /> Votre compte
            </button>
            <button type="button" className={`ng-drawer-link ${currentPath === '/commandes' ? 'active' : ''}`} onClick={() => goPrivate('/commandes')}>
              <Package size={19} /> Vos commandes
            </button>
            <button type="button" className={`ng-drawer-link ${currentPath === '/favoris' ? 'active' : ''}`} onClick={() => go('/favoris')}>
              <Heart size={19} /> Favoris ({favorites.length})
            </button>

            <div className="ng-drawer-sep" />

            {NAV_LINKS.map(({ path, label, icon: Icon }) => (
              <button key={path} type="button" className={`ng-drawer-link ${isActive(path) ? 'active' : ''}`} onClick={() => go(path)}>
                <Icon size={19} /> {label}
              </button>
            ))}

            <div className="ng-drawer-sep" />

            <button
              type="button"
              className="ng-drawer-link"
              onClick={() => {
                setDrawerOpen(false)
                setAdvisorOpen(true)
              }}
            >
              <Sparkles size={19} color="var(--ng-gold-600)" /> Conseillère beauté
            </button>
            <a className="ng-drawer-link" href={waLink()} target="_blank" rel="noreferrer" onClick={() => setDrawerOpen(false)}>
              <MessageCircle size={19} color="var(--ng-wa-text)" /> Écrire sur WhatsApp
            </a>
            <button type="button" className="ng-drawer-link" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />} {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            </button>
            {user && (
              <button type="button" className="ng-drawer-link ng-drawer-link--danger" onClick={() => { setDrawerOpen(false); void logout() }}>
                <LogOut size={19} /> Se déconnecter
              </button>
            )}
          </aside>
        </div>
      )}
    </>
  )
}

export default Navbar
