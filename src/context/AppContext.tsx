import React, { createContext, useContext, useEffect, useState } from 'react'
import { NotificationItem, Product, ProductCategory, User } from '../types'
import { INITIAL_PRODUCTS } from '../data/products'
import { api, ApiProduct } from '../api'

interface AppContextType {
  // Navigation / Router sans #
  currentPath: string
  navigate: (path: string) => void

  // Thème Mode Sombre / Clair
  theme: 'light' | 'dark'
  toggleTheme: () => void

  // Authentification Client
  user: User | null
  login: (userData: Omit<User, 'id'>) => void
  logout: () => void
  authModalOpen: boolean
  authModalReason: string
  openAuthModal: (reason?: string) => void
  closeAuthModal: () => void

  // Panier avec condition de connexion
  cart: Record<string, number>
  addToCart: (productId: string, quantity?: number) => boolean
  removeFromCart: (productId: string) => void
  changeQuantity: (productId: string, delta: number) => void
  clearCart: () => void
  cartCount: number
  cartTotal: number
  cartOpen: boolean
  setCartOpen: (open: boolean) => void

  // Favoris (Wishlist)
  favorites: string[]
  toggleFavorite: (productId: string) => void
  isFavorite: (productId: string) => boolean

  // Notifications
  notifications: NotificationItem[]
  unreadNotificationsCount: number
  markAllNotificationsRead: () => void

  // Produits & Recherche
  products: Product[]
  searchTerm: string
  setSearchTerm: (term: string) => void
  selectedCategory: ProductCategory
  setSelectedCategory: (cat: ProductCategory) => void

  /** true quand le catalogue vient de l'API (sinon : données de démonstration) */
  catalogLive: boolean

  // Toast
  toastMessage: string
  showToast: (msg: string) => void
}

/** Fusionne un produit de l'API avec les infos d'affichage locales du même slug. */
function mergeApiProduct(row: ApiProduct): Product {
  const local = INITIAL_PRODUCTS.find((p) => p.id === row.slug)
  const price = row.priceXof
  const oldPrice = local?.oldPrice && price !== null && local.oldPrice > price ? local.oldPrice : null
  return {
    rating: 5,
    reviewCount: 0,
    tone: 'cocoa',
    ...local,
    id: row.slug,
    apiId: row.id,
    name: row.name,
    category: row.category,
    size: row.size,
    description: row.description,
    price,
    stock: row.stock,
    imageUrl: row.imageUrl || local?.imageUrl || null,
    oldPrice,
    discount: oldPrice && price ? `-${Math.round((1 - price / oldPrice) * 100)}%` : null,
    isFlashSale: Boolean(oldPrice) && (local?.isFlashSale ?? false),
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined)

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: '⚡ Promotion Wave de la semaine',
    message: 'Profitez de la livraison offerte à Abidjan dès 10 000 FCFA d’achats réglés avec Wave !',
    time: 'Il y a 10 minutes',
    read: false,
    type: 'promo',
  },
  {
    id: 'notif-2',
    title: '🌿 Nouveauté en stock',
    message: 'La Chantilly de cacao 100g est de retour en quantité limitée !',
    time: 'Il y a 2 heures',
    read: false,
    type: 'stock',
  },
  {
    id: 'notif-3',
    title: '✨ Diagnostic Beauté IA disponible',
    message: 'Découvrez votre routine naturelle personnalisée avec notre Conseiller IA Gemini.',
    time: 'Hier',
    read: false,
    type: 'ai',
  },
]

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Navigation / Router sans #
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname || '/'
    }
    return '/'
  })

  const navigate = (path: string) => {
    if (path !== currentPath) {
      window.history.pushState(null, '', path)
      setCurrentPath(path)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/')
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // 2. Mode Sombre / Clair
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ng_theme') as 'light' | 'dark' | null
      if (saved) return saved
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
    }
    return 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('ng_theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  // 3. Authentification Client
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ng_user')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {
          return null
        }
      }
    }
    return null
  })

  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalReason, setAuthModalReason] = useState('')

  const openAuthModal = (reason = '') => {
    setAuthModalReason(reason)
    setAuthModalOpen(true)
  }

  const closeAuthModal = () => {
    setAuthModalOpen(false)
    setAuthModalReason('')
  }

  const login = (userData: Omit<User, 'id'>) => {
    const newUser: User = {
      id: 'usr_' + Date.now(),
      ...userData,
    }
    setUser(newUser)
    localStorage.setItem('ng_user', JSON.stringify(newUser))
    closeAuthModal()
    showToast(`Bienvenue, ${newUser.name} !`)
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('ng_user')
    showToast('Vous avez été déconnecté.')
  }

  // 4. Favoris
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ng_favorites')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {
          return []
        }
      }
    }
    return ['beurre-de-cacao-brut', 'chantilly-beurre-cacao']
  })

  const toggleFavorite = (productId: string) => {
    setFavorites((prev) => {
      const exists = prev.includes(productId)
      const next = exists ? prev.filter((id) => id !== productId) : [...prev, productId]
      localStorage.setItem('ng_favorites', JSON.stringify(next))
      showToast(exists ? 'Retiré de vos favoris' : 'Ajouté à vos favoris ❤️')
      return next
    })
  }

  const isFavorite = (productId: string) => favorites.includes(productId)

  // 5. Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>(DEFAULT_NOTIFICATIONS)

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  // 6. Panier (AVEC CONDITION DE CONNEXION)
  const [cart, setCart] = useState<Record<string, number>>({})
  const [cartOpen, setCartOpen] = useState(false)

  const addToCart = (productId: string, quantity = 1): boolean => {
    // RÈGLE OBLIGATOIRE : pour ajouter un produit, il faut être connecté !
    if (!user) {
      openAuthModal('Connectez-vous pour ajouter ce produit à votre panier et passer commande !')
      return false
    }

    setCart((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + quantity,
    }))
    showToast(`Produit ajouté au panier (${quantity})`)
    return true
  }

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const next = { ...prev }
      delete next[productId]
      return next
    })
  }

  const changeQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      const next = { ...prev, [productId]: (prev[productId] || 0) + delta }
      if (next[productId] <= 0) delete next[productId]
      return next
    })
  }

  const clearCart = () => setCart({})

  const cartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0)

  // Catalogue : l'API (gérée depuis l'admin) fait foi. Les données locales ne servent
  // qu'à enrichir l'affichage (notes, ancien prix…) ou de secours si l'API est injoignable.
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS)
  const [catalogLive, setCatalogLive] = useState(false)

  useEffect(() => {
    let cancelled = false
    api<ApiProduct[]>('/products')
      .then((rows) => {
        if (cancelled || !Array.isArray(rows)) return
        setProducts(rows.map(mergeApiProduct))
        setCatalogLive(true)
      })
      .catch(() => {
        /* API hors ligne : on garde le catalogue local */
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Retire du panier les produits disparus du catalogue
  useEffect(() => {
    setCart((prev) => {
      const ids = new Set(products.map((p) => p.id))
      const next = Object.fromEntries(Object.entries(prev).filter(([id]) => ids.has(id)))
      return Object.keys(next).length === Object.keys(prev).length ? prev : next
    })
  }, [products])

  const cartTotal = products.reduce((sum, item) => sum + (item.price ?? 0) * (cart[item.id] || 0), 0)

  // 7. Recherche & Filtre par Catégorie
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('Toutes les catégories')

  // 8. Toast notification
  const [toastMessage, setToastMessage] = useState('')

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? '' : prev))
    }, 2200)
  }

  return (
    <AppContext.Provider
      value={{
        currentPath,
        navigate,
        catalogLive,
        theme,
        toggleTheme,
        user,
        login,
        logout,
        authModalOpen,
        authModalReason,
        openAuthModal,
        closeAuthModal,
        cart,
        addToCart,
        removeFromCart,
        changeQuantity,
        clearCart,
        cartCount,
        cartTotal,
        cartOpen,
        setCartOpen,
        favorites,
        toggleFavorite,
        isFavorite,
        notifications,
        unreadNotificationsCount,
        markAllNotificationsRead,
        products,
        searchTerm,
        setSearchTerm,
        selectedCategory,
        setSelectedCategory,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp doit être utilisé au sein d’un AppProvider')
  return context
}
