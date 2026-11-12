import React, { useEffect, useRef, useState } from 'react'
import {
  BookOpen, ChevronDown, CircleHelp, FileText, Heart, Home, LayoutGrid, Leaf, LogOut, Menu, MessageCircle, Moon, Package, Search,
  ShoppingCart, Sparkles, Star, Sun, Truck, User as UserIcon, X,
} from 'lucide-react'
import { useApp, formatPhone } from '../context/AppContext'

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

export const Navbar: React.FC = () => {
  const {
    currentPath, navigate, theme, toggleTheme, cartCount, openCart, favorites, searchTerm, setSearchTerm, waLink, setAdvisorOpen,
    user, logout, goToLogin,
  } = useApp()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [searchInput, setSearchInput] = useState(searchTerm)
  const account = useDropdown()
  const help = useDropdown()

  useEffect(() => setSearchInput(searchTerm), [searchTerm])

  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawerOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawerOpen])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchTerm(searchInput.trim())
    navigate('/boutique')
  }

  const go = (path: string) => {
    navigate(path)
    setDrawerOpen(false)
    account.setOpen(false)
    help.setOpen(false)
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

  const searchForm = (extraClass = '') => (
    <form className={`ng-search ${extraClass}`} onSubmit={handleSearchSubmit} role="search">
      <Search size={18} />
      <input
        type="search"
        placeholder="Rechercher un soin : beurre de cacao, savon noir…"
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
        <div className="ng-promo">
          <p>
            <Leaf size={14} />
            <span>
              <b>Prenez soin de vous naturellement</b>
              <span className="ng-hide-sm"> · Commande sur le site ou WhatsApp · Paiement Wave</span>
            </span>
          </p>
        </div>

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
              aria-label="NATURE & GRÂCE, accueil"
            >
              <img src="/logo.jpeg" alt="" />
              <span>
                <b>Nature &amp; Grâce</b>
                <small>Cosmétique naturelle</small>
              </span>
            </a>

            {searchForm()}

            <div className="ng-actions">
              {/* COMPTE */}
              <div className="ng-dd ng-hide-sm" ref={account.ref}>
                <button
                  type="button"
                  className={`ng-hbtn ${account.open ? 'open' : ''}`}
                  onClick={() => {
                    account.setOpen((v) => !v)
                    help.setOpen(false)
                  }}
                  aria-expanded={account.open}
                  aria-haspopup="menu"
                >
                  <UserIcon size={21} />
                  <span>{user ? `Bonjour, ${firstName}` : 'Se connecter'}</span>
                  <ChevronDown size={16} className="ng-hbtn-chevron" />
                </button>
                {account.open && (
                  <div className="ng-dd-menu" role="menu">
                    {user ? (
                      <div className="ng-dd-user">
                        <span className="ng-avatar">{user.name.charAt(0).toUpperCase()}</span>
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
                      <UserIcon size={19} /> Votre compte
                    </button>
                    <button type="button" role="menuitem" className="ng-dd-item" onClick={() => goPrivate('/commandes')}>
                      <Package size={19} /> Vos commandes
                    </button>
                    <button type="button" role="menuitem" className="ng-dd-item" onClick={() => go('/favoris')}>
                      <Heart size={19} /> Favoris {favorites.length > 0 && <em>{favorites.length}</em>}
                    </button>
                    {user && (
                      <>
                        <div className="ng-dd-sep" />
                        <button type="button" role="menuitem" className="ng-dd-item ng-dd-item--danger" onClick={() => { account.setOpen(false); void logout() }}>
                          <LogOut size={19} /> Se déconnecter
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* AIDE */}
              <div className="ng-dd ng-hide-md" ref={help.ref}>
                <button
                  type="button"
                  className={`ng-hbtn ${help.open ? 'open' : ''}`}
                  onClick={() => {
                    help.setOpen((v) => !v)
                    account.setOpen(false)
                  }}
                  aria-expanded={help.open}
                  aria-haspopup="menu"
                >
                  <CircleHelp size={21} />
                  <span>Aide</span>
                  <ChevronDown size={16} className="ng-hbtn-chevron" />
                </button>
                {help.open && (
                  <div className="ng-dd-menu" role="menu">
                    <button type="button" role="menuitem" className="ng-dd-item" onClick={() => go('/contact')}>
                      <Truck size={19} /> Livraison et frais
                    </button>
                    <button type="button" role="menuitem" className="ng-dd-item" onClick={() => go('/contact')}>
                      <CircleHelp size={19} /> Questions fréquentes
                    </button>
                    <button type="button" role="menuitem" className="ng-dd-item" onClick={() => go('/cgv')}>
                      <FileText size={19} /> Conditions de vente
                    </button>
                    <div className="ng-dd-sep" />
                    <a role="menuitem" className="ng-dd-item ng-dd-item--wa" href={waLink()} target="_blank" rel="noreferrer" onClick={() => help.setOpen(false)}>
                      <MessageCircle size={19} /> Écrire sur WhatsApp
                    </a>
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

              <a className="ng-icon-btn ng-wa-btn ng-show-sm-only" href={waLink()} target="_blank" rel="noreferrer" aria-label="Écrire à la boutique sur WhatsApp">
                <MessageCircle size={20} />
              </a>

              {/* PANIER */}
              <button
                type="button"
                className="ng-hbtn ng-cart-hbtn"
                data-cart-target
                onClick={openCart}
                aria-label={`Panier, ${cartCount} article${cartCount > 1 ? 's' : ''}${user ? '' : ' (connexion requise)'}`}
              >
                <span className="ng-cart-ico">
                  <ShoppingCart size={23} />
                  {cartCount > 0 && <span className="ng-count">{cartCount > 99 ? '99+' : cartCount}</span>}
                </span>
                <span className="ng-hide-sm">Panier</span>
              </button>
            </div>
          </div>

          {searchForm('ng-search-mobile')}

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
            <button type="button" className="ng-nav-link ng-nav-ai" onClick={() => setAdvisorOpen(true)}>
              <Sparkles size={15} /> Conseiller beauté IA
            </button>
          </nav>
        </div>
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
                <span className="ng-avatar">{user.name.charAt(0).toUpperCase()}</span>
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
              <Sparkles size={19} color="var(--ng-gold-600)" /> Conseiller beauté IA
            </button>
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
