/** « Tout » ou le nom d'une catégorie du catalogue (les catégories viennent de l'administration). */
export type ProductCategory = string
export const ALL_CATEGORIES = 'Toutes les catégories'

/** Forme du produit affiché : 'jar' pot, 'bar' savon, 'bottle' flacon, 'box' coffret. */
export type ProductShape = 'jar' | 'bar' | 'bottle' | 'box'

export type Product = {
  /** Slug, utilisé dans les URL (/produit/:id) et le panier */
  id: string
  /** Identifiant en base (API) — requis pour enregistrer une commande */
  apiId?: string
  name: string
  category: string
  size: string
  price: number | null
  stock: number
  description: string
  /** Teinte de l'illustration affichée tant qu'il n'y a pas de vraie photo */
  tone: string
  imageUrl?: string | null
  /** Photos supplémentaires (galerie de la fiche, 2e photo au survol) */
  gallery?: string[]
  /** Pastille « Meilleure vente » ou « Nouveau » choisie dans l'administration */
  badge?: 'bestseller' | 'new' | null
}
