import React from 'react'
import { Heart, Home, LayoutGrid, ShoppingCart, User as UserIcon } from 'lucide-react'
import { useApp } from '../context/AppContext'

/** Barre d'onglets du bas, sur téléphone uniquement. */
export const MobileTabBar: React.FC = () => {
  const { currentPath, navigate, favorites, cartCount, openCart, cartOpen, user, goToLogin } = useApp()
  const onAccountPage = ['/compte', '/commandes', '/connexion'].includes(currentPath)

  const tabs = [
    { key: 'home', label: 'Accueil', icon: Home, active: currentPath === '/' && !cartOpen, onClick: () => navigate('/') },
    {
      key: 'shop',
      label: 'Boutique',
      icon: LayoutGrid,
      active: (currentPath === '/boutique' || currentPath.startsWith('/produit/')) && !cartOpen,
      onClick: () => navigate('/boutique'),
    },
    { key: 'fav', label: 'Favoris', icon: Heart, active: currentPath === '/favoris' && !cartOpen, badge: favorites.length, onClick: () => navigate('/favoris') },
    { key: 'cart', label: 'Panier', icon: ShoppingCart, active: cartOpen, badge: cartCount, onClick: openCart },
    {
      key: 'account',
      label: user ? user.name.split(' ')[0] : 'Compte',
      icon: UserIcon,
      active: onAccountPage && !cartOpen,
      onClick: () => (user ? navigate('/compte') : goToLogin({ then: '/compte' })),
    },
  ]

  return (
    <nav className="ng-tabbar" aria-label="Navigation mobile">
      {tabs.map(({ key, label, icon: Icon, active, onClick, badge }) => (
        <button
          key={key}
          type="button"
          className={`ng-tab ${active ? 'active' : ''}`}
          onClick={onClick}
          aria-current={active ? 'page' : undefined}
          data-cart-target={key === 'cart' ? '' : undefined}
        >
          <Icon size={22} strokeWidth={active ? 2.3 : 1.8} />
          {badge ? <span className={`ng-count ${key === 'fav' ? 'ng-count--red' : ''}`}>{badge > 99 ? '99+' : badge}</span> : null}
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}

export default MobileTabBar
