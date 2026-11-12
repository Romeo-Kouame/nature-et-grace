import { ApiStoreSettings } from '../api'
import { Product, ProductShape } from '../types'

/** Ordre d'affichage des rayons connus ; une catégorie créée dans l'admin s'ajoute à la suite. */
export const KNOWN_CATEGORIES = ['Beurre de cacao', 'Beurre de karité', 'Savons naturels', 'Huiles naturelles', 'Soins & gommages', 'Rituels & Coffrets']

/**
 * Photos d'ambiance et de rayons : photos libres de droits prises en Afrique de l'Ouest
 * (dossier public/photos, crédits dans src/data/photoCredits.ts). À remplacer par celles de la marque.
 */
export const PHOTOS = {
  hero: '/photos/a-hero.webp',
  cabosse: '/photos/a-cabosse.webp',
  cabosseOuverte: '/photos/a-cabosse-ouverte.webp',
  plantation: '/photos/a-plantation.webp',
  cacaoPanier: '/photos/a-cacao-panier.webp',
  kariteFemmes: '/photos/a-karite-femmes.webp',
  kariteMarche: '/photos/a-karite-marche.webp',
  noixKarite: '/photos/a-noix-karite.webp',
  beurreCacao: '/photos/p-beurre-cacao-brut.webp',
  kariteFouette: '/photos/p-karite-fouette-2.webp',
  savonNoir: '/photos/p-savon-karite.webp',
}

export const CATEGORY_INFO: Record<string, { short: string; tag: string; image: string }> = {
  'Beurre de cacao': { short: 'Cacao', tag: 'Brut & chantilly', image: '/photos/p-beurre-cacao-brut-2.webp' },
  'Beurre de karité': { short: 'Karité', tag: 'Brut & fouetté', image: '/photos/p-karite-dore.webp' },
  'Savons naturels': { short: 'Savons', tag: 'Savon noir', image: '/photos/p-savon-cabosse.webp' },
  'Huiles naturelles': { short: 'Huiles', tag: 'Huiles végétales', image: '/photos/p-huile-baobab.webp' },
  'Soins & gommages': { short: 'Soins', tag: 'Masques & gommages', image: '/photos/p-gommage-feves.webp' },
  'Rituels & Coffrets': { short: 'Coffrets', tag: 'Idées cadeaux', image: '/photos/p-coffret-cacao.webp' },
}

/** Forme et teinte de l'illustration, déduites de la catégorie et du nom. */
export function productLook(p: { category: string; name: string; id?: string }): { shape: ProductShape; tone: string } {
  const text = `${p.category} ${p.name} ${p.id ?? ''}`.toLowerCase()
  if (text.includes('savon')) return { shape: 'bar', tone: 'soap' }
  if (text.includes('coffret') || text.includes('rituel')) return { shape: 'box', tone: 'gift' }
  if (text.includes('huile')) {
    if (text.includes('neem')) return { shape: 'bottle', tone: 'neem' }
    if (text.includes('karit')) return { shape: 'bottle', tone: 'shea' }
    return { shape: 'bottle', tone: 'coconut' }
  }
  if (text.includes('chantilly')) return { shape: 'jar', tone: 'whip' }
  if (text.includes('karit')) return { shape: 'jar', tone: 'shea' }
  return { shape: 'jar', tone: 'cocoa' }
}

/**
 * Catalogue de secours, affiché seulement si l'API ne répond pas.
 * Il reprend exactement le cahier des charges : les prix des huiles restent « à confirmer ».
 * Le stock n'est pas connu hors ligne : la commande passe alors par WhatsApp.
 */
export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'beurre-de-cacao-brut',
    imageUrl: '/photos/p-beurre-cacao-brut.webp',
    name: 'Beurre de cacao brut',
    category: 'Beurre de cacao',
    size: '100 g',
    price: 1500,
    stock: 1,
    description: 'Un beurre brut et non raffiné, riche et nourrissant, pour les peaux sèches, les zones rugueuses et les lèvres.',
    tone: 'cocoa',
  },
  {
    id: 'chantilly-beurre-cacao',
    imageUrl: '/photos/p-chantilly-cacao.webp',
    name: 'Chantilly de beurre de cacao',
    category: 'Beurre de cacao',
    size: '100 g',
    price: 2000,
    stock: 1,
    description: 'Le beurre de cacao fouetté en une texture légère et fondante, pour le corps et les cheveux.',
    tone: 'whip',
  },
  {
    id: 'savon-noir-cabosse-cacao',
    imageUrl: '/photos/p-savon-cabosse.webp',
    name: 'Savon noir de cabosse de cacao',
    category: 'Savons naturels',
    size: '100 g',
    price: 2000,
    stock: 1,
    description: 'Un savon traditionnel aux cendres de cabosse de cacao, pour une peau propre et délicatement fraîche.',
    tone: 'soap',
  },
  {
    id: 'huile-de-coco',
    imageUrl: '/photos/p-huile-coco.webp',
    name: 'Huile de coco',
    category: 'Huiles naturelles',
    size: 'À confirmer',
    price: null,
    stock: 1,
    description: 'Huile végétale polyvalente pour la peau et les cheveux. Contenance et prix communiqués par la boutique.',
    tone: 'coconut',
  },
]

/** Valeurs par défaut tant que les réglages de la boutique ne sont pas chargés. */
export const DEFAULT_SETTINGS: ApiStoreSettings = {
  whatsappNumber: '2250717684751',
  deliveryCommunes: 'Abidjan, Bouaké, Daloa et autres communes sur demande',
  deliveryInfo: 'Frais et délais communiqués avant la validation définitive.',
  waveInstructions: 'Les modalités de paiement Wave sont confirmées par la boutique.',
  waveNumber: '',
  deliveryZones: [],
  legalInfo: '',
}
