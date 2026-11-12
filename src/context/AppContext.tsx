import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { ALL_CATEGORIES, Product, ProductCategory } from '../types'
import { DEFAULT_SETTINGS, INITIAL_PRODUCTS, KNOWN_CATEGORIES, productLook } from '../data/products'
import { api, ApiCustomer, ApiProduct, ApiReview, ApiStoreSettings, resolveImageUrl } from '../api'

type Rating = { average: number; count: number }

interface AppContextType {
  currentPath: string
  navigate: (path: string) => void

  theme: 'light' | 'dark'
  toggleTheme: () => void

  cart: Record<string, number>
  /** Renvoie false si le produit ne peut pas être ajouté (prix à confirmer, rupture). */
  addToCart: (productId: string, quantity?: number) => boolean
  removeFromCart: (productId: string) => void
  changeQuantity: (productId: string, delta: number) => void
  clearCart: () => void
  cartCount: number
  cartTotal: number
  cartOpen: boolean
  setCartOpen: (open: boolean) => void
  /** Quantité maximale commandable d'un produit (stock réel si le catalogue est en ligne). */
  maxQuantity: (product: Product) => number

  favorites: string[]
  toggleFavorite: (productId: string) => void
  isFavorite: (productId: string) => boolean

  products: Product[]
  /** true quand le catalogue vient de l'API (sinon : catalogue de secours) */
  catalogLive: boolean
  catalogLoading: boolean
  categories: string[]
  searchTerm: string
  setSearchTerm: (term: string) => void
  selectedCategory: ProductCategory
  setSelectedCategory: (cat: ProductCategory) => void

  settings: ApiStoreSettings
  /** Lien WhatsApp de la boutique, avec un message prérempli facultatif. */
  waLink: (text?: string) => string
  waDisplay: string

  reviews: ApiReview[]
  reviewsLoaded: boolean
  ratingFor: (productId: string) => Rating | null
  refreshReviews: () => void

  /** Client connecté (null si visiteur) */
  user: ApiCustomer | null
  /** true une fois la session vérifiée auprès du serveur */
  authReady: boolean
  login: (identifier: string, password: string) => Promise<void>
  register: (data: { name: string; phone: string; email?: string; password: string }) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: ApiCustomer) => void
  /** Ouvre le panier, ou envoie vers la connexion puis rouvre le panier après coup */
  openCart: () => void
  /** Envoie vers la page de connexion en retenant où revenir ensuite */
  goToLogin: (options?: { then?: string; openCart?: boolean; mode?: 'login' | 'register' }) => void

  advisorOpen: boolean
  setAdvisorOpen: (open: boolean) => void

  toastMessage: string
  showToast: (msg: string) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

/** Lecture/écriture locale protégée : le navigateur peut refuser le stockage (navigation privée). */
function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}
function writeLocal(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* stockage indisponible : sans conséquence */
  }
}

/** « 2250717684751 » → « +225 07 17 68 47 51 » */
export function formatPhone(digits: string) {
  const d = digits.replace(/\D/g, '')
  if (d.startsWith('225') && d.length === 13) return `+225 ${d.slice(3).replace(/(\d{2})(?=\d)/g, '$1 ')}`
  return `+${d}`
}

function fromApi(row: ApiProduct): Product {
  return {
    id: row.slug,
    apiId: row.id,
    name: row.name,
    category: row.category,
    size: row.size,
    description: row.description,
    price: row.priceXof,
    stock: row.stock,
    imageUrl: resolveImageUrl(row.imageUrl),
    gallery: (row.gallery ?? []).map((url) => resolveImageUrl(url)).filter((url): url is string => Boolean(url)),
    badge: row.badge ?? null,
    tone: productLook({ category: row.category, name: row.name, id: row.slug }).tone,
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation sans #
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname || '/')
  const navigate = useCallback((path: string) => {
    if (path !== window.location.pathname + window.location.search) {
      window.history.pushState(null, '', path)
      setCurrentPath(new URL(path, window.location.origin).pathname)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])
  useEffect(() => {
    const onPop = () => setCurrentPath(window.location.pathname || '/')
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // Thème
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = readLocal<'light' | 'dark' | null>('ng_theme', null)
    if (saved) return saved
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    writeLocal('ng_theme', theme)
  }, [theme])
  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'))

  // Toast
  const [toastMessage, setToastMessage] = useState('')
  const toastTimer = useRef<number>()
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToastMessage(''), 2600)
  }, [])

  // Catalogue : l'API (gérée depuis l'admin) fait foi.
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS)
  const [catalogLive, setCatalogLive] = useState(false)
  /** Vrai tant que la première réponse de l'API n'est pas arrivée (affichage de cartes « squelettes ») */
  const [catalogLoading, setCatalogLoading] = useState(true)
  useEffect(() => {
    let cancelled = false
    api<ApiProduct[]>('/products')
      .then((rows) => {
        if (cancelled || !Array.isArray(rows)) return
        setProducts(rows.map(fromApi))
        setCatalogLive(true)
      })
      .catch(() => {
        /* API hors ligne : catalogue de secours */
      })
      .finally(() => {
        if (!cancelled) setCatalogLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const categories = useMemo(() => {
    const present = [...new Set(products.map((p) => p.category))]
    const known = KNOWN_CATEGORIES.filter((c) => present.includes(c))
    return [...known, ...present.filter((c) => !KNOWN_CATEGORIES.includes(c)).sort()]
  }, [products])

  // Réglages de la boutique (WhatsApp, livraison, Wave…)
  const [settings, setSettings] = useState<ApiStoreSettings>(DEFAULT_SETTINGS)
  useEffect(() => {
    api<ApiStoreSettings>('/store-settings')
      .then((s) => setSettings({ ...DEFAULT_SETTINGS, ...s, deliveryZones: Array.isArray(s.deliveryZones) ? s.deliveryZones : [] }))
      .catch(() => undefined)
  }, [])
  const waLink = useCallback(
    (text?: string) => `https://wa.me/${settings.whatsappNumber}${text ? `?text=${encodeURIComponent(text)}` : ''}`,
    [settings.whatsappNumber],
  )

  // Avis publiés
  const [reviews, setReviews] = useState<ApiReview[]>([])
  const [reviewsLoaded, setReviewsLoaded] = useState(false)
  const refreshReviews = useCallback(() => {
    api<ApiReview[]>('/reviews')
      .then((rows) => setReviews(Array.isArray(rows) ? rows : []))
      .catch(() => setReviews([]))
      .finally(() => setReviewsLoaded(true))
  }, [])
  useEffect(refreshReviews, [refreshReviews])
  const ratingFor = useCallback(
    (productId: string): Rating | null => {
      const list = reviews.filter((r) => r.productSlug === productId)
      if (!list.length) return null
      return { average: list.reduce((s, r) => s + r.rating, 0) / list.length, count: list.length }
    },
    [reviews],
  )

  // Favoris
  const [favorites, setFavorites] = useState<string[]>(() => readLocal<string[]>('ng_favorites', []))
  useEffect(() => writeLocal('ng_favorites', favorites), [favorites])
  const toggleFavorite = (productId: string) => {
    const exists = favorites.includes(productId)
    setFavorites((prev) => (exists ? prev.filter((id) => id !== productId) : [...prev, productId]))
    showToast(exists ? 'Retiré de vos favoris' : 'Ajouté à vos favoris')
  }
  const isFavorite = (productId: string) => favorites.includes(productId)

  // Panier, conservé sur l'appareil
  const [cart, setCart] = useState<Record<string, number>>(() => readLocal<Record<string, number>>('ng_cart', {}))
  const [cartOpen, setCartOpen] = useState(false)
  useEffect(() => writeLocal('ng_cart', cart), [cart])

  const maxQuantity = useCallback((product: Product) => (catalogLive ? Math.max(0, product.stock) : 20), [catalogLive])

  const addToCart = (productId: string, quantity = 1): boolean => {
    const product = products.find((p) => p.id === productId)
    if (!product) return false
    if (product.price === null) {
      showToast('Prix à confirmer : demandez-le sur WhatsApp')
      return false
    }
    const max = maxQuantity(product)
    const current = cart[productId] || 0
    if (max <= 0) {
      showToast('Ce produit est en rupture de stock')
      return false
    }
    const next = Math.min(max, current + quantity)
    if (next === current) {
      showToast(`Stock disponible : ${max} au maximum`)
      return false
    }
    setCart((prev) => ({ ...prev, [productId]: next }))
    showToast(next - current > 1 ? `${next - current} articles ajoutés au panier` : 'Ajouté au panier')
    return true
  }

  const removeFromCart = (productId: string) =>
    setCart((prev) => {
      const next = { ...prev }
      delete next[productId]
      return next
    })

  const changeQuantity = (productId: string, delta: number) => {
    const product = products.find((p) => p.id === productId)
    setCart((prev) => {
      const max = product ? maxQuantity(product) : 99
      const value = Math.min(max, (prev[productId] || 0) + delta)
      const next = { ...prev, [productId]: value }
      if (value <= 0) delete next[productId]
      return next
    })
  }

  const clearCart = () => setCart({})

  // Quand le vrai catalogue arrive : on retire les produits disparus et on ajuste au stock réel
  useEffect(() => {
    setCart((prev) => {
      const next: Record<string, number> = {}
      for (const [id, qty] of Object.entries(prev)) {
        const product = products.find((p) => p.id === id)
        if (!product || product.price === null) continue
        const allowed = Math.min(qty, maxQuantity(product))
        if (allowed > 0) next[id] = allowed
      }
      const same = Object.keys(next).length === Object.keys(prev).length && Object.entries(next).every(([id, q]) => prev[id] === q)
      return same ? prev : next
    })
  }, [products, maxQuantity])

  const cartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0)
  const cartTotal = products.reduce((sum, item) => sum + (item.price ?? 0) * (cart[item.id] || 0), 0)

  // Recherche & rayon
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>(ALL_CATEGORIES)

  // Compte client : la session est un cookie sécurisé, on demande au serveur qui est connecté
  const [user, setUser] = useState<ApiCustomer | null>(null)
  const [authReady, setAuthReady] = useState(false)
  useEffect(() => {
    writeLocal('ng_customer', null) // ancienne mémorisation locale des coordonnées, remplacée par le compte
    api<ApiCustomer>('/customer/me')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setAuthReady(true))
  }, [])

  const goToLogin = useCallback(
    (options: { then?: string; openCart?: boolean; mode?: 'login' | 'register' } = {}) => {
      const then = options.then ?? (window.location.pathname.startsWith('/connexion') ? '/' : window.location.pathname)
      try {
        sessionStorage.setItem('ng_after_login', JSON.stringify({ then, openCart: Boolean(options.openCart) }))
      } catch {
        /* stockage indisponible */
      }
      setCartOpen(false)
      navigate(options.mode === 'register' ? '/connexion?inscription' : '/connexion')
    },
    [navigate],
  )

  /** Après connexion ou inscription : retour à la page d'origine, panier rouvert si besoin */
  const afterAuth = (customer: ApiCustomer, welcome: string) => {
    setUser(customer)
    let next = { then: '/', openCart: false }
    try {
      next = { ...next, ...JSON.parse(sessionStorage.getItem('ng_after_login') || '{}') }
      sessionStorage.removeItem('ng_after_login')
    } catch {
      /* rien */
    }
    navigate(next.then || '/')
    if (next.openCart) setCartOpen(true)
    showToast(welcome)
  }

  const login = async (identifier: string, password: string) => {
    const customer = await api<ApiCustomer>('/customer/login', { method: 'POST', body: JSON.stringify({ identifier, password }) })
    afterAuth(customer, `Bonjour ${customer.name.split(' ')[0]} !`)
  }

  const register = async (data: { name: string; phone: string; email?: string; password: string }) => {
    const customer = await api<ApiCustomer>('/customer/register', { method: 'POST', body: JSON.stringify(data) })
    afterAuth(customer, `Bienvenue ${customer.name.split(' ')[0]}, votre compte est créé !`)
  }

  const logout = async () => {
    await api('/customer/logout', { method: 'POST' }).catch(() => undefined)
    setUser(null)
    setCartOpen(false)
    showToast('Vous êtes déconnecté(e).')
    if (['/compte', '/commandes'].includes(window.location.pathname)) navigate('/')
  }

  const openCart = () => {
    if (user) setCartOpen(true)
    else goToLogin({ openCart: true })
  }

  const [advisorOpen, setAdvisorOpen] = useState(false)

  return (
    <AppContext.Provider
      value={{
        currentPath,
        navigate,
        theme,
        toggleTheme,
        cart,
        addToCart,
        removeFromCart,
        changeQuantity,
        clearCart,
        cartCount,
        cartTotal,
        cartOpen,
        setCartOpen,
        maxQuantity,
        favorites,
        toggleFavorite,
        isFavorite,
        products,
        catalogLive,
        catalogLoading,
        categories,
        searchTerm,
        setSearchTerm,
        selectedCategory,
        setSelectedCategory,
        settings,
        waLink,
        waDisplay: formatPhone(settings.whatsappNumber),
        reviews,
        reviewsLoaded,
        ratingFor,
        refreshReviews,
        user,
        authReady,
        login,
        register,
        logout,
        setUser,
        openCart,
        goToLogin,
        advisorOpen,
        setAdvisorOpen,
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
