import React, { useState } from 'react'
import { Heart, Home, LayoutGrid, LogOut, MessageCircle, Moon, Sun, Tag, User as UserIcon } from 'lucide-react'
import { useApp } from '../context/AppContext'

/** Fait défiler jusqu'à la vente flash (sur l'accueil, en y revenant si besoin). */
export function scrollToFlash(navigate: (p: string) => void, currentPath: string) {
  const scroll = () => document.getElementById('vente-flash')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  if (currentPath === '/') scroll()
  else {
    navigate('/')
    window.setTimeout(scroll, 450)
  }
}

export const MobileTabBar: React.FC = () => {
  const { currentPath, navigate, favorites, user, openAuthModal, logout, theme, toggleTheme } = useApp()
  const [accountOpen, setAccountOpen] = useState(false)

  const tabs = [
    { key: 'home', label: 'Accueil', icon: Home, active: currentPath === '/', onClick: () => navigate('/') },
    {
      key: 'shop',
      label: 'Rayons',
      icon: LayoutGrid,
      active: currentPath === '/boutique' || currentPath.startsWith('/produit/'),
      onClick: () => navigate('/boutique'),
    },
    { key: 'deals', label: 'Promos', icon: Tag, active: false, onClick: () => scrollToFlash(navigate, currentPath) },
    {
      key: 'fav',
      label: 'Favoris',
      icon: Heart,
      active: currentPath === '/favoris',
      badge: favorites.length,
      onClick: () => navigate('/favoris'),
    },
    {
      key: 'account',
      label: user ? user.name.split(' ')[0] : 'Compte',
      icon: UserIcon,
      active: accountOpen,
      onClick: () => (user ? setAccountOpen(true) : openAuthModal()),
    },
  ]

  return (
    <>
      <nav className="ng-tabbar" aria-label="Navigation mobile">
        {tabs.map(({ key, label, icon: Icon, active, onClick, badge }) => (
          <button key={key} type="button" className={`ng-tab ${active ? 'active' : ''}`} onClick={onClick} aria-current={active ? 'page' : undefined}>
            <Icon size={22} strokeWidth={active ? 2.3 : 1.8} />
            {badge ? <span className="ng-count ng-count--red">{badge}</span> : null}
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {accountOpen && user && (
        <div className="ng-sheet-overlay" onMouseDown={(e) => e.target === e.currentTarget && setAccountOpen(false)}>
          <div className="ng-sheet" role="dialog" aria-label="Mon compte">
            <div className="ng-sheet-grab" />
            <div className="ng-sheet-user">
              <div className="ng-avatar">{user.name.charAt(0).toUpperCase()}</div>
              <div>
                <b>{user.name}</b>
                <small>
                  {user.phone}
                  {user.commune ? ` · ${user.commune}` : ''}
                </small>
              </div>
            </div>
            <button
              type="button"
              className="ng-menu-item"
              onClick={() => {
                setAccountOpen(false)
                navigate('/favoris')
              }}
            >
              <Heart size={18} /> Mes favoris ({favorites.length})
            </button>
            <button
              type="button"
              className="ng-menu-item"
              onClick={() => {
                setAccountOpen(false)
                navigate('/contact')
              }}
            >
              <MessageCircle size={18} /> Contact & livraison
            </button>
            <button type="button" className="ng-menu-item" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />} {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            </button>
            <button
              type="button"
              className="ng-menu-item danger"
              onClick={() => {
                logout()
                setAccountOpen(false)
              }}
            >
              <LogOut size={18} /> Se déconnecter
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default MobileTabBar
