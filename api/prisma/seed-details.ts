import 'dotenv/config'
import { createPrismaClient } from '../src/db'

/**
 * Remplit la fiche détaillée (bienfaits, utilisation, composition, origine) des produits qui n'en ont pas encore.
 * Ne remplace jamais une fiche déjà rédigée dans l'espace boutique.
 * Usage : npm run prisma:seed-details
 */
export type ProductDetails = { benefits: string[]; howToUse: string[]; ingredients: string; origin: string }

export const PRODUCT_DETAILS: Record<string, ProductDetails> = {
  'beurre-de-cacao-brut': {
    benefits: [
      'Nourrit les peaux sèches à très sèches',
      'Laisse la peau souple et douce au toucher',
      'Riche en matières grasses végétales',
      'Laisse un film léger qui aide la peau à garder son confort',
    ],
    howToUse: [
      'Prélevez une petite noisette de beurre brut solide',
      'Faites-la fondre quelques secondes au creux de vos mains tièdes',
      'Massez en mouvements circulaires sur les zones sèches (coudes, genoux, talons, lèvres, corps)',
      'Idéal le soir ou après la douche, sur peau encore légèrement humide',
    ],
    ingredients: 'Beurre de fèves de cacao (Theobroma cacao) brut, non raffiné.',
    origin: 'Préparé par des productrices en Côte d’Ivoire, sélectionné par Nature & Grâce.',
  },
  'chantilly-beurre-cacao': {
    benefits: [
      'Texture fouettée et onctueuse qui fond au contact de la peau',
      'S’étale facilement, sans effet collant',
      'Adoucit l’ensemble du corps, avec la douce odeur naturelle du cacao',
      'Gaine les longueurs des cheveux crépus, frisés ou secs',
    ],
    howToUse: [
      'Appliquez une noisette sur le corps après la douche',
      'Sur les cheveux : appliquez sur les pointes et les longueurs, après votre leave-in ou un peu d’eau',
      'Convient à un usage quotidien',
    ],
    ingredients: 'Beurre de cacao fouetté et huiles végétales. Composition exacte communiquée par la boutique sur demande.',
    origin: 'Préparé par des productrices en Côte d’Ivoire, sélectionné par Nature & Grâce.',
  },
  'savon-noir-cabosse-cacao': {
    benefits: [
      'Nettoie la peau en douceur',
      'Apprécié des peaux mixtes à grasses',
      'Savon traditionnel préparé à partir de cendres de cabosse de cacao',
      'Laisse la peau propre et fraîche',
    ],
    howToUse: [
      'Faites mousser une petite quantité de savon entre vos mains humides',
      'Massez délicatement le visage ou le corps en évitant le contour des yeux',
      'Rincez à l’eau tiède, puis appliquez la chantilly ou le beurre de cacao',
      'Une à deux fois par jour selon votre peau ; faites d’abord un essai sur une petite zone',
    ],
    ingredients: 'Cendres de cabosses de cacao et huiles végétales saponifiées.',
    origin: 'Savon traditionnel préparé par des productrices en Côte d’Ivoire, sélectionné par Nature & Grâce.',
  },
  'huile-de-coco': {
    benefits: [
      'Huile végétale nourrissante pour la peau et les cheveux',
      'Laisse la peau douce et satinée',
      'Gaine la fibre capillaire et apporte de la brillance',
      'Idéale pour les bains d’huile et les massages',
    ],
    howToUse: [
      'En bain d’huile : appliquez sur les cheveux avant le shampooing et laissez poser 30 minutes sous une serviette tiède',
      'Sur le corps : massez directement pour un fini soyeux',
    ],
    ingredients: 'Huile de noix de coco. Contenance et composition exacte communiquées par la boutique.',
    origin: 'Sélectionnée auprès de productrices ivoiriennes.',
  },
  'huile-de-neem': {
    benefits: [
      'Huile traditionnellement utilisée dans les soins purifiants',
      'S’utilise en touche locale sur les petites imperfections',
      'Se mélange à une autre huile pour masser le cuir chevelu',
    ],
    howToUse: [
      'En touche locale : 1 à 2 gouttes le soir sur une petite imperfection, après un essai sur une petite zone',
      'Sur le cuir chevelu : mélangez quelques gouttes à votre huile habituelle et massez avant le lavage',
    ],
    ingredients: 'Huile de graines de neem (Azadirachta indica).',
    origin: 'Sélectionnée par Nature & Grâce.',
  },
  'huile-de-karite': {
    benefits: [
      'La douceur du karité dans une texture fluide, facile à étaler',
      'Nourrit les peaux sèches et réduit la sensation de tiraillement',
      'Aide à garder l’hydratation de la peau et des cheveux au quotidien',
    ],
    howToUse: [
      'Appliquez quelques gouttes sur peau propre et massez jusqu’à pénétration',
      'S’utilise sur le corps, le visage, la barbe ou les longueurs de cheveux',
    ],
    ingredients: 'Oléine de karité.',
    origin: 'Afrique de l’Ouest, sélectionnée par Nature & Grâce.',
  },
}

const prisma = createPrismaClient()

async function main() {
  let filled = 0
  for (const [slug, d] of Object.entries(PRODUCT_DETAILS)) {
    const product = await prisma.product.findUnique({ where: { slug } })
    if (!product) continue
    const empty = !product.benefits.length && !product.howToUse.length && !product.ingredients && !product.origin
    if (!empty) continue
    await prisma.product.update({ where: { slug }, data: { benefits: d.benefits, howToUse: d.howToUse, ingredients: d.ingredients, origin: d.origin } })
    filled += 1
  }
  console.log(`${filled} fiche(s) produit remplie(s). Les fiches déjà rédigées n'ont pas été modifiées.`)
}

main().finally(() => prisma.$disconnect())
