import React, { useEffect, useRef, useState } from 'react'
import {
  Bell,
  BookOpen,
  ChevronRight,
  Heart,
  Home,
  LayoutGrid,
  LogOut,
  Menu,
  MessageCircle,
  Moon,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  Sun,
  Truck,
  User as UserIcon,
  X,
} from 'lucide-react'
import { useApp } from '../context/AppContext'

interface NavbarJumiaProps {
  onOpenAdvisor: () => void
}

const NAV_LINKS = [
  { path: '/', label: 'Accueil', icon: Home },
  { path: '/boutique', label: 'Boutique', icon: LayoutGrid },
  { path: '/temoignages', label: 'Avis clients', icon: Star },
  { path: '/histoire', label: 'Notre histoire', icon: BookOpen },
  { path: '/contact', label: 'Contact & livraison', icon: MessageCircle },
]

/** Ferme un menu déroulant au clic extérieur. */
function useClickOutside(ref: React.RefObject<HTMLElement>, onOutside: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [active, onOutside, ref])
}

export const NavbarJumia: React.FC<NavbarJumiaProps> = ({ onOpenAdvisor }) => {
  const {
    currentPath,
    navigate,
    theme,
    toggleTheme,
    user,
    logout,
    openAuthModal,
    cartCount,
    setCartOpen,
    favorites,
    notifications,
    unreadNotificationsCount,
    markAllNotificationsRead,
    searchTerm,
    setSearchTerm,
  } = useApp()

  const [notifOpen, setNotifOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [searchInput, setSearchInput] = useState(searchTerm)

  const notifRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)
  useClickOutside(notifRef, () => setNotifOpen(false), notifOpen)
  useClickOutside(userRef, () => setUserMenuOpen(false), userMenuOpen)

  useEffect(() => setSearchInput(searchTerm), [searchTerm])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchTerm(searchInput)
    navigate('/boutique')
  }

  const go = (path: string) => {
    navigate(path)
    setDrawerOpen(false)
  }

  const searchForm = (extraClass = '') => (
    <form className={`ng-search ${extraClass}`} onSubmit={handleSearchSubmit} role="search">
      <Search size={18} />
      <input
        type="search"
        placeholder="Rechercher un soin, beurre de cacao, savon noir…"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        aria-label="Rechercher un produit"
      />
      <button type="submit" aria-label="Rechercher">
        <Search size={17} />
      </button>
    </form>
  )

  return (
    <>
      <header className="ng-header">
        {/* Bandeau promo fin */}
        <div className="ng-promo">
          <button type="button" onClick={() => navigate('/boutique')}>
            <Truck size={15} />
            <span>
              <b>Livraison offerte</b> dès 10 000 FCFA à Abidjan
              <span className="ng-hide-sm"> · Paiement sécurisé Wave</span>
            </span>
            <ChevronRight size={15} />
          </button>
        </div>

        <div className="ng-container">
          <div className="ng-header-main">
            <button type="button" className="ng-icon-btn ng-menu-btn" onClick={() => setDrawerOpen(true)} aria-label="Ouvrir le menu">
              <Menu size={22} />
            </button>

            <button type="button" className="ng-logo" onClick={() => navigate('/')} aria-label="Accueil NATURE & GRÂCE">
              <img src="/logo.jpeg" alt="" />
              <span>
                <b>Nature &amp; Grâce</b>
                <small>Cosmétique naturelle</small>
              </span>
            </button>

            {searchForm()}

            <div className="ng-actions">
              <button
                type="button"
                className="ng-icon-btn ng-hide-sm"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
                title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              <div ref={notifRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="ng-icon-btn"
                  onClick={() => {
                    setNotifOpen((v) => !v)
                    setUserMenuOpen(false)
                  }}
                  aria-label="Notifications"
                >
                  <Bell size={20} />
                  {unreadNotificationsCount > 0 && <span className="ng-count ng-count--red">{unreadNotificationsCount}</span>}
                </button>
                {notifOpen && (
                  <div className="ng-dropdown">
                    <div className="ng-dropdown-head">
                      <span>Notifications</span>
                      {unreadNotificationsCount > 0 && (
                        <button type="button" onClick={markAllNotificationsRead}>
                          Tout marquer comme lu
                        </button>
                      )}
                    </div>
                    {notifications.map((n) => (
                      <div className="ng-notif" key={n.id}>
                        <b>{n.title}</b>
                        <span>{n.message}</span>
                        <small>{n.time}</small>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div ref={userRef} style={{ position: 'relative' }} className="ng-hide-sm">
                <button
                  type="button"
                  className="ng-account-btn"
                  onClick={() => {
                    if (!user) return openAuthModal()
                    setUserMenuOpen((v) => !v)
                    setNotifOpen(false)
                  }}
                >
                  <UserIcon size={20} />
                  <span>{user ? user.name.split(' ')[0] : 'Connexion'}</span>
                </button>
                {userMenuOpen && user && (
                  <div className="ng-dropdown" style={{ width: 240 }}>
                    <div className="ng-notif">
                      <b>{user.name}</b>
                      <small>
                        {user.phone}
                        {user.commune ? ` · ${user.commune}` : ''}
                      </small>
                    </div>
                    <button
                      type="button"
                      className="ng-menu-item"
                      onClick={() => {
                        navigate('/favoris')
                        setUserMenuOpen(false)
                      }}
                    >
                      <Heart size={17} /> Mes favoris ({favorites.length})
                    </button>
                    <button
                      type="button"
                      className="ng-menu-item danger"
                      onClick={() => {
                        logout()
                        setUserMenuOpen(false)
                      }}
                    >
                      <LogOut size={17} /> Se déconnecter
                    </button>
                  </div>
                )}
              </div>

              <button type="button" className="ng-icon-btn ng-hide-sm" onClick={() => navigate('/favoris')} aria-label="Mes favoris">
                <Heart size={20} />
                {favorites.length > 0 && <span className="ng-count ng-count--red">{favorites.length}</span>}
              </button>

              <a
                className="ng-icon-btn ng-show-sm ng-wa-btn"
                href="https://wa.me/2250717684751"
                target="_blank"
                rel="noreferrer"
                aria-label="Écrire à la boutique sur WhatsApp"
              >
                <MessageCircle size={20} />
              </a>

              <button type="button" className="ng-icon-btn" onClick={() => setCartOpen(true)} aria-label="Ouvrir le panier">
                <ShoppingBag size={20} />
                {cartCount > 0 && <span className="ng-count">{cartCount}</span>}
              </button>
            </div>
          </div>

          {searchForm('ng-search-mobile')}

          <nav className="ng-nav" aria-label="Navigation principale">
            {NAV_LINKS.map((link) => (
              <button
                key={link.path}
                type="button"
                className={`ng-nav-link ${currentPath === link.path ? 'active' : ''}`}
                onClick={() => navigate(link.path)}
              >
                {link.label}
              </button>
            ))}
            <button type="button" className="ng-nav-link ng-nav-ai" onClick={onOpenAdvisor}>
              <Sparkles size={15} /> Conseiller beauté IA
            </button>
          </nav>
        </div>
      </header>

      {/* Tiroir de navigation mobile */}
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

            {NAV_LINKS.map(({ path, label, icon: Icon }) => (
              <button key={path} type="button" className={`ng-drawer-link ${currentPath === path ? 'active' : ''}`} onClick={() => go(path)}>
                <Icon size={19} /> {label}
              </button>
            ))}
            <button type="button" className={`ng-drawer-link ${currentPath === '/favoris' ? 'active' : ''}`} onClick={() => go('/favoris')}>
              <Heart size={19} /> Mes favoris ({favorites.length})
            </button>

            <div className="ng-drawer-sep" />

            <button
              type="button"
              className="ng-drawer-link"
              onClick={() => {
                setDrawerOpen(false)
                onOpenAdvisor()
              }}
            >
              <Sparkles size={19} color="var(--ng-gold-600)" /> Conseiller beauté IA
            </button>
            <button type="button" className="ng-drawer-link" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />} {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            </button>
            {user ? (
              <button
                type="button"
                className="ng-drawer-link"
                style={{ color: 'var(--ng-red)' }}
                onClick={() => {
                  logout()
                  setDrawerOpen(false)
                }}
              >
                <LogOut size={19} /> Se déconnecter
              </button>
            ) : (
              <button
                type="button"
                className="ng-drawer-link"
                onClick={() => {
                  setDrawerOpen(false)
                  openAuthModal()
                }}
              >
                <UserIcon size={19} /> Connexion / Inscription
              </button>
            )}
          </aside>
        </div>
      )}
    </>
  )
}

export default NavbarJumia
