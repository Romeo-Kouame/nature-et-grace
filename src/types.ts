export type ProductCategory =
  | 'Toutes les catégories'
  | 'Beurre de cacao'
  | 'Savons naturels'
  | 'Huiles naturelles'
  | 'Rituels & Coffrets'

export type Product = {
  /** Slug, utilisé dans les URL (/produit/:id) et le panier */
  id: string
  /** Identifiant en base (API) — requis pour enregistrer une commande */
  apiId?: string
  name: string
  category: string
  size: string
  price: number | null
  oldPrice?: number | null
  discount?: string | null
  rating: number
  reviewCount: number
  stock: number
  description: string
  tone: string
  imageUrl?: string | null
  badge?: string
  isFlashSale?: boolean
  features?: string[]
}

export type User = {
  id: string
  name: string
  email: string
  phone: string
  commune?: string
  address?: string
}

export type NotificationItem = {
  id: string
  title: string
  message: string
  time: string
  read: boolean
  type: 'promo' | 'stock' | 'ai' | 'info'
}

export type Review = {
  id: string
  name: string
  location: string
  rating: number
  date: string
  productName: string
  comment: string
  verified: boolean
}
