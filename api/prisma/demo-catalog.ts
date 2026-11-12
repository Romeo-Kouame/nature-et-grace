/**
 * Catalogue de DÉMONSTRATION : produits fictifs illustrés par des photos libres de droits
 * prises en Afrique de l'Ouest (dossier public/photos du site, crédits dans src/data/photoCredits.ts).
 * Il sert à présenter un site « rempli » en attendant les vrais produits et les vraies photos.
 *
 *   npm run prisma:seed-demo    → ajoute ou met à jour ces produits
 *   npm run prisma:remove-demo  → les retire (ou les masque s'ils ont déjà été commandés)
 *
 * Les trois produits réels du cahier des charges ne sont jamais modifiés, sauf pour recevoir
 * une photo d'illustration s'ils n'en ont pas encore.
 */
const P = (file: string) => `/photos/${file}.webp`

export type DemoProduct = {
  slug: string
  name: string
  category: string
  size: string
  priceXof: number | null
  stock: number
  description: string
  imageUrl: string
  gallery?: string[]
  badge?: 'bestseller' | 'new'
}

/** Produits réels : seule la photo est ajoutée si elle manque. */
export const REAL_PRODUCT_PHOTOS: Record<string, { imageUrl: string; gallery: string[] }> = {
  'beurre-de-cacao-brut': { imageUrl: P('p-beurre-cacao-brut'), gallery: [P('p-beurre-cacao-brut-2'), P('a-cabosse-ouverte')] },
  'chantilly-beurre-cacao': { imageUrl: P('p-chantilly-cacao'), gallery: [P('p-beurre-cacao-brut')] },
  'savon-noir-cabosse-cacao': { imageUrl: P('p-savon-cabosse'), gallery: [P('a-cabosse')] },
  'huile-de-coco': { imageUrl: P('p-huile-coco'), gallery: [P('p-huile-coco-2')] },
  'huile-de-karite': { imageUrl: P('p-huile-karite'), gallery: [P('a-noix-karite')] },
}

export const DEMO_PRODUCTS: DemoProduct[] = [
  // Beurre de cacao
  {
    slug: 'beurre-cacao-brut-250g', name: 'Beurre de cacao brut – grand format', category: 'Beurre de cacao', size: '250 g', priceXof: 3500, stock: 12,
    description: 'Le beurre de cacao brut en format familial, pour nourrir le corps, les coudes, les genoux et les talons au quotidien.',
    imageUrl: P('p-beurre-cacao-250'), gallery: [P('p-beurre-cacao-brut-2')], badge: 'bestseller',
  },
  {
    slug: 'pastilles-beurre-cacao', name: 'Pastilles de beurre de cacao', category: 'Beurre de cacao', size: '150 g', priceXof: 2500, stock: 8,
    description: 'Des pastilles faciles à doser, qui fondent au contact de la peau. Idéales pour préparer vos propres baumes.',
    imageUrl: P('p-pastilles-cacao'),
  },
  // Beurre de karité
  {
    slug: 'beurre-karite-brut', name: 'Beurre de karité brut', category: 'Beurre de karité', size: '250 g', priceXof: 2500, stock: 15,
    description: 'Un karité non raffiné, préparé de façon traditionnelle par des coopératives de femmes. Pour la peau sèche et les pointes des cheveux.',
    imageUrl: P('p-karite-brut'), gallery: [P('a-karite-femmes')], badge: 'bestseller',
  },
  {
    slug: 'karite-fouette-huiles-essentielles', name: 'Karité fouetté aux huiles essentielles', category: 'Beurre de karité', size: '200 g', priceXof: 3500, stock: 6,
    description: 'Le karité fouetté en une crème légère, parfumée aux huiles essentielles. Pénètre vite, sans effet gras.',
    imageUrl: P('p-karite-fouette'), gallery: [P('p-karite-fouette-2')], badge: 'new',
  },
  {
    slug: 'beurre-karite-boules', name: 'Beurre de karité en boules', category: 'Beurre de karité', size: '500 g', priceXof: 4000, stock: 10,
    description: 'Le karité tel qu’on le trouve sur les marchés : en boules, à conserver au frais et à utiliser sur tout le corps.',
    imageUrl: P('p-karite-boules'), gallery: [P('a-karite-marche')],
  },
  {
    slug: 'beurre-karite-dore', name: 'Beurre de karité doré', category: 'Beurre de karité', size: '250 g', priceXof: 3000, stock: 3,
    description: 'Un karité à la couleur dorée naturelle et au parfum de noisette, riche et fondant.',
    imageUrl: P('p-karite-dore'),
  },
  {
    slug: 'beurre-karite-pur', name: 'Beurre de karité pur – petit pot', category: 'Beurre de karité', size: '100 g', priceXof: 1500, stock: 20,
    description: 'Le format nomade, à glisser dans le sac pour les mains, les lèvres et les zones sèches.',
    imageUrl: P('p-karite-pur'), gallery: [P('a-noix-karite')],
  },
  // Savons
  {
    slug: 'savon-noir-karite', name: 'Savon noir au karité', category: 'Savons naturels', size: '120 g', priceXof: 2000, stock: 14,
    description: 'Un savon noir artisanal enrichi en beurre de karité, pour un nettoyage doux du visage et du corps.',
    imageUrl: P('p-savon-karite'), badge: 'new',
  },
  {
    slug: 'savon-noir-grand-pain', name: 'Savon noir artisanal – grand pain', category: 'Savons naturels', size: '300 g', priceXof: 3000, stock: 7,
    description: 'Le savon noir traditionnel en grand format, à découper selon vos besoins. Pour toute la famille.',
    imageUrl: P('p-savon-pain'),
  },
  // Huiles
  {
    slug: 'huile-de-palmiste', name: 'Huile de palmiste', category: 'Huiles naturelles', size: '100 ml', priceXof: 2000, stock: 9,
    description: 'L’huile tirée des amandes de palme, utilisée depuis toujours pour nourrir les cheveux crépus et le cuir chevelu.',
    imageUrl: P('p-huile-palmiste'), gallery: [P('p-huile-palmiste-2')],
  },
  {
    slug: 'huile-de-baobab', name: 'Huile de baobab', category: 'Huiles naturelles', size: '50 ml', priceXof: 3500, stock: 5,
    description: 'Une huile sèche et légère, appréciée pour l’élasticité de la peau et la brillance des cheveux.',
    imageUrl: P('p-huile-baobab'), badge: 'new',
  },
  // Soins & gommages
  {
    slug: 'masque-visage-cacao', name: 'Masque visage à la pâte de cacao', category: 'Soins & gommages', size: '100 g', priceXof: 2500, stock: 11,
    description: 'Un masque à la pâte de cacao pur, à mélanger avec un peu d’eau ou de miel. Pour un teint lumineux.',
    imageUrl: P('p-masque-cacao'),
  },
  {
    slug: 'gommage-feves-cacao', name: 'Gommage corps aux fèves de cacao', category: 'Soins & gommages', size: '200 g', priceXof: 3000, stock: 8,
    description: 'Des fèves de cacao finement broyées pour exfolier en douceur et révéler une peau lisse.',
    imageUrl: P('p-gommage-feves'), gallery: [P('a-cacao-panier')],
  },
  {
    slug: 'baume-levres-cacao', name: 'Baume à lèvres au cacao', category: 'Soins & gommages', size: '15 g', priceXof: 1000, stock: 25,
    description: 'Un baume tout simple au beurre de cacao pour protéger les lèvres du soleil et de l’harmattan.',
    imageUrl: P('p-baume-levres'), badge: 'bestseller',
  },
  {
    slug: 'fleurs-bissap-cheveux', name: 'Fleurs de bissap – rinçage capillaire', category: 'Soins & gommages', size: '100 g', priceXof: 1000, stock: 18,
    description: 'Les calices d’hibiscus séchés, à infuser pour un rinçage qui fait briller les cheveux.',
    imageUrl: P('p-bissap'), gallery: [P('p-bissap-2')],
  },
  // Coffrets
  {
    slug: 'coffret-rituel-cacao', name: 'Coffret Rituel cacao', category: 'Rituels & Coffrets', size: '3 soins', priceXof: 5500, stock: 6,
    description: 'Beurre de cacao brut, chantilly de cacao et savon noir de cabosse, réunis dans un coffret prêt à offrir.',
    imageUrl: P('p-coffret-cacao'), gallery: [P('a-hero')], badge: 'bestseller',
  },
  {
    slug: 'coffret-peau-douce-karite', name: 'Coffret Peau douce au karité', category: 'Rituels & Coffrets', size: '3 soins', priceXof: 6000, stock: 4,
    description: 'Karité fouetté, savon noir au karité et baume à lèvres : le rituel complet pour une peau douce toute la journée.',
    imageUrl: P('p-coffret-karite'), gallery: [P('p-karite-fouette')], badge: 'new',
  },
]
