/**
 * Base de connaissances du chat (conseillère IA).
 *
 * PRODUCT_DETAILS est une copie de `src/data/productDetails.ts` (le site) : l'API ne peut pas importer
 * les fichiers du site. Quand vous modifiez une fiche produit là-bas, recopiez-la ici.
 * Les prix, stocks et réglages de livraison ne sont PAS ici : ils viennent toujours de la base de données.
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

/** Questions fréquentes qui ne dépendent pas des réglages de la boutique */
export const STATIC_FAQ = [
  {
    q: 'Comment se passe une commande ?',
    a: 'Ajoutez vos soins au panier, puis validez sur le site avec vos coordonnées (un compte client est nécessaire) ou envoyez votre panier sur WhatsApp. La boutique confirme le total, la livraison et le délai avant tout paiement.',
  },
  {
    q: 'Comment suivre ma commande ?',
    a: 'Connecté à votre compte, ouvrez « Vos commandes » : le suivi montre chaque étape. Vous pouvez aussi écrire à la boutique sur WhatsApp.',
  },
  {
    q: 'Comment utiliser le beurre de cacao brut s’il est solide ?',
    a: 'Il est naturellement compact à température ambiante. Prélevez une petite noisette et frottez-la quelques secondes entre vos mains : elle fond et devient facile à masser.',
  },
  {
    q: 'Les soins conviennent-ils aux peaux sensibles, aux femmes enceintes et aux enfants ?',
    a: 'Faites toujours un essai sur une petite zone de peau avant la première utilisation. Pendant la grossesse, pour un bébé ou en cas de peau très réactive, demandez l’avis d’un professionnel de santé.',
  },
  {
    q: 'Puis-je retourner un produit ?',
    a: 'Les conditions de retour et de remboursement sont détaillées sur la page « Retours et remboursements » du site ; la boutique répond aux cas particuliers sur WhatsApp.',
  },
]

