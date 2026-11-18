/**
 * Base de connaissances du chat (conseillère IA) : questions fréquentes qui ne dépendent pas des réglages.
 * Les fiches produits, prix, stocks et réglages de livraison viennent toujours de la base de données
 * (fiches modifiables dans l'espace boutique).
 */
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

