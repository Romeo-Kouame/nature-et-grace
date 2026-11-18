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
      'Nourrit intensément les peaux sèches à très sèches',
      'Aide à garder la peau souple, notamment sur les zones sujettes aux vergetures',
      'Naturellement riche en matières grasses végétales nourrissantes',
      'Protège durablement la barrière cutanée contre la déshydratation',
    ],
    howToUse: [
      'Prélevez une petite noisette de beurre brut solide',
      'Faites-la fondre quelques secondes au creux de vos mains tièdes',
      'Massez en mouvements circulaires sur les zones ciblées (ventre, cuisses, coudes, talons, lèvres)',
      'Idéal en soin de nuit ou après la douche sur peau encore légèrement humide',
    ],
    ingredients: '100% Beurre de fèves de cacao (Theobroma Cacao) pur et non raffiné.',
    origin: 'Récolté et extrait artisanalement en Côte d’Ivoire.',
  },
  'chantilly-beurre-cacao': {
    benefits: [
      'Texture fouettée onctueuse qui fond immédiatement au contact de la peau',
      'Pénétration rapide sans film gras collant',
      'Hydrate et adoucit l’ensemble du corps avec un doux parfum gourmand naturel',
      'Excellente pour gainer et sceller l’hydratation des cheveux crépus, frisés ou secs',
    ],
    howToUse: [
      'Appliquez une noisette généreuse sur le corps après la douche',
      'Sur les cheveux : appliquez sur les pointes et longueurs après votre leave-in ou vaporisation d’eau',
      'Convient à toute la famille pour un usage quotidien',
    ],
    ingredients: 'Beurre de cacao pur fouetté, enrichi aux huiles végétales nourrissantes 100% pures.',
    origin: 'Formulé et fouetté avec soin en Côte d’Ivoire.',
  },
  'savon-noir-cabosse-cacao': {
    benefits: [
      'Nettoie en profondeur les impuretés sans décaper la barrière protectrice',
      'Convient aux peaux mixtes à grasses en quête de netteté',
      'Riche en minéraux issus des cendres de cabosse de cacao',
      'Laisse la peau propre et fraîche',
    ],
    howToUse: [
      'Faites mousser une petite quantité de savon entre vos mains humides',
      'Massez délicatement le visage ou le corps en évitant le contour immédiat des yeux',
      'Rincez abondamment à l’eau tiède puis appliquez votre Chantilly ou Beurre de cacao',
      'Utiliser 1 à 2 fois par jour selon la sensibilité de votre peau',
    ],
    ingredients: 'Cendres de cabosses de cacao brûlées traditionnellement, huiles végétales saponifiées douces.',
    origin: 'Savoir-faire artisanal traditionnel ivoirien.',
  },
  'huile-de-coco': {
    benefits: [
      'Huile végétale vierge ultra-nourrissante et protectrice',
      'Assouplit la peau et prévient la déshydratation',
      'Gaine la fibre capillaire et apporte de la brillance',
      'Idéale pour les bains d’huile et les massages relaxants',
    ],
    howToUse: [
      'En bain d’huile : appliquez sur les cheveux avant le shampooing, laissez poser 30 min sous serviette tiède',
      'Sur le corps : massez directement pour un fini soyeux et lumineux',
    ],
    ingredients: '100% Huile de noix de coco vierge de première pression.',
    origin: 'Origine naturelle.',
  },
  'huile-de-neem': {
    benefits: [
      'Huile traditionnellement utilisée dans les soins purifiants',
      'S’utilise en touche locale sur les petites imperfections',
      'Se mélange à une autre huile pour masser le cuir chevelu',
    ],
    howToUse: [
      'En application locale : déposez 1 à 2 gouttes directement sur les boutons le soir',
      'Sur le cuir chevelu : mélangez quelques gouttes à votre huile habituelle et massez avant le lavage',
    ],
    ingredients: '100% Huile de graines de neem (Azadirachta indica) pure.',
    origin: 'Origine végétale naturelle sélectionnée.',
  },
  'huile-de-karite': {
    benefits: [
      'Toute la richesse protectrice du karité dans une texture fluide facile à étaler',
      'Nourrit les peaux sèches et apaise la sensation de tiraillement',
      'Parfaite pour sceller l’hydratation cutanée et capillaire au quotidien',
    ],
    howToUse: [
      'Appliquez quelques gouttes sur peau propre et massez jusqu’à pénétration',
      'S’utilise aussi bien sur le corps, le visage que sur la barbe ou les longueurs de cheveux',
    ],
    ingredients: '100% Oléine de karité pure extraite avec douceur.',
    origin: 'Afrique de l’Ouest.',
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

