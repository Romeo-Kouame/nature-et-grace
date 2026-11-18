# App Flow — Parcours et navigation

## Pages et adresses

| Adresse | Page | Accès |
| --- | --- | --- |
| `/` | Accueil | Public |
| `/boutique` | Boutique (rangées par rayon, ou grille filtrée) | Public |
| `/produit/:slug` | Fiche produit | Public |
| `/temoignages` | Avis clients | Public |
| `/histoire` | Notre histoire | Public |
| `/contact` | Contact, livraison, FAQ, carte | Public |
| `/favoris` | Favoris (sur l'appareil) | Public |
| `/connexion`, `/connexion?inscription` | Connexion / création de compte (page autonome, sans menu) | Public |
| `/compte` | Votre compte | Client connecté |
| `/commandes` | Vos commandes | Client connecté |
| `/mentions-legales`, `/cgv`, `/confidentialite`, `/remboursement`, `/cookies` | Pages légales | Public |
| `/admin` | Administration | Propriétaire |
| toute autre adresse | Page 404 | Public |

Chaque élément du menu ouvre sa propre page, avec sa propre adresse. Le fil d'Ariane apparaît sur toutes les pages sauf l'accueil.

## Parcours d'achat

1. **Découverte** : accueil, boutique, recherche ou rayon.
   - Saisie dans la recherche : sur la boutique, la liste se filtre en direct ; ailleurs, des suggestions s'ouvrent. Clic sur une suggestion → fiche produit. Entrée ou « Voir les N résultats » → boutique filtrée.
2. **Ajout au panier** (carte ou fiche produit) : animation vers l'icône du panier. Fonctionne sans être connecté ; le panier est gardé sur l'appareil.
   - Produit « prix à confirmer » : le bouton ouvre WhatsApp avec une question sur le prix.
   - Produit en rupture : bouton désactivé.
3. **Ouverture du panier** :
   - Le panier s'ouvre pour tout le monde (articles, quantités, sous-total, fourchette des frais de livraison).
   - « Commander sur le site » : client connecté → étape Livraison ; visiteur → page `/connexion` (lien « Créer un compte » mis en avant), puis le panier se rouvre automatiquement après connexion ou inscription.
4. **Validation** : formulaire (nom, téléphone, zone, commune, adresse, précision facultative, enregistrer l'adresse) + case CGV obligatoire.
   - Frais et délai de la zone affichés dans le total.
   - Bouton désactivé pendant l'envoi ; un double envoi renvoie la même commande.
   - En cas d'échec (réseau, stock) : message clair + bouton « Finaliser sur WhatsApp ».
5. **Confirmation** : référence, total, consignes Wave, bouton « Envoyer la capture du paiement ».
6. **Preuve Wave** : la commande passe en « Paiement en vérification ». Le client suit sa commande dans `/commandes`.

## Statuts d'une commande

```
En attente de confirmation ──► Paiement en vérification ──► Confirmée ──► En préparation ──► Expédiée ──► Livrée
            └──────────────────────────────┴──────────► Annulée (le stock est remis)
```

## Compte client

- « Se connecter » (menu compte, menu mobile, panier, pages réservées) → page `/connexion` autonome : la marque à gauche, le formulaire à droite ; bouton « Retour à la boutique ».
- « Créer un nouveau compte » bascule sur le formulaire d'inscription sur la même page (`/connexion?inscription`) ; « J'ai déjà un compte » revient à la connexion.
- « Continuer avec Google » (si configuré) → Google → retour sur `/connexion` : compte connu → connecté et renvoyé à la page demandée ; nouveau client → « Dernière étape » (nom prérempli, téléphone, conditions) → compte créé ; e-mail déjà utilisé par un compte à mot de passe → message invitant à se connecter avec le mot de passe ; annulation ou erreur → message sur la page.
- « Mot de passe oublié ? » → téléphone ou e-mail (+ captcha) → code envoyé sur l'e-mail du compte ; réponse identique que le compte existe ou non, qu'il ait un e-mail ou non (« sans e-mail enregistré, écrivez-nous sur WhatsApp ») ; 3 envois par heure au plus → code à 6 chiffres + nouveau mot de passe → connectée, autres appareils déconnectés. Code faux ou expiré : message générique ; 5 essais au plus. Sans service d'envoi en production : invitation à écrire sur WhatsApp.
- Commande livrée → bouton « Donner mon avis » dans « Vos commandes » (ouvre le formulaire d'avis).

- Inscription réussie → toast de bienvenue, retour à la page demandée (ou au panier).
- Mauvais identifiants → un seul message générique.
- Changement de mot de passe → les autres appareils sont déconnectés.
- « Supprimer mon compte » → mot de passe demandé. Refusé si une commande est en cours. Sinon : compte et preuves supprimés, commandes anonymisées, retour à l'accueil avec un message.

## Avis

« Donner mon avis » → formulaire (note, prénom, ville, produit, texte, accord de publication) → message « publié après vérification ». Échec → lien pour envoyer l'avis sur WhatsApp.

## Conseillère IA (chat)

Bulle « Une question ? » en bas à droite (ordinateur), icône étoiles de l'en-tête (téléphone), « Mon rituel IA » (accueil), « Rituel sur-mesure IA » (boutique), « Demander au conseiller IA » (fiche produit) → fenêtre de chat.
- Message d'accueil et questions suggérées (adaptées à la fiche produit ouverte) → réponse en quelques secondes, avec les produits cités (voir la fiche, ajouter au panier).
- La conversation suit le fil (12 derniers messages) et reste le temps de l'onglet. « Nouvelle conversation » l'efface.
- Échec réseau → message dans le fil et bouton « Réessayer ». IA indisponible ou plafond atteint → réponses simples à partir des mêmes données.
- Icône WhatsApp dans l'en-tête du chat pour parler à la boutique. Échap ou la croix ferment la fenêtre.

## Administration

Connexion → onglets Commandes / Produits / Avis / Boutique. Les commandes se rafraîchissent chaque minute et les nouvelles sont signalées.

## Cas d'erreur communs à tout le site

- API injoignable ou trop lente (20 s) → message en français ; le catalogue de secours s'affiche et les commandes passent par WhatsApp.
- Plantage d'affichage → écran « Rechargez la page » avec lien WhatsApp ; l'erreur est signalée au serveur.
- Chargement → cartes « squelette » à la place des produits.
- Listes vides → message et action proposée (boutique vide, aucun résultat, aucune commande).
