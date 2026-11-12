# NATURE & GRÂCE — état d'avancement

Boutique en ligne de soins naturels : présentation des produits, commande sur le site ou par WhatsApp, paiement Wave, administration par la propriétaire.

## Choix techniques

- Site : React + TypeScript (Vite).
- API : NestJS + Prisma + PostgreSQL.
- IA : Google Gemini, appelée uniquement depuis le serveur.
- WhatsApp de la boutique : +225 07 17 68 47 51 (modifiable dans l'administration).

## Fonctionnalités terminées

### Boutique

- Pages : accueil, boutique (rayons, recherche, tri par prix), fiche produit, avis clients, notre histoire, contact & livraison, favoris, mentions légales, conditions de vente, confidentialité, page 404.
- Slogan « Prenez soin de vous naturellement » et logo sur toutes les pages.
- Comptes clients (téléphone ou e-mail + mot de passe) : le panier n'est accessible qu'une fois connecté ; espace « Votre compte » et « Vos commandes » avec suivi.
- Panier conservé sur l'appareil, puis validation sur le site ou envoi du panier sur WhatsApp.
- Choix de la zone de livraison avec frais et délai affichés avant l'envoi (ou « à confirmer »).
- Après la commande : référence, total, consignes Wave et envoi de la capture de paiement depuis le site.
- Adresse de livraison enregistrée dans le compte du client.
- Produits « prix à confirmer » : pas d'ajout au panier, bouton pour demander le prix sur WhatsApp.
- Stock réel affiché (rupture, « plus que N »), quantités limitées au stock.
- Avis : seuls les avis validés par la boutique sont affichés ; notes calculées à partir de ces avis.
- Conseiller beauté IA (rituel matin et soir, ajout des soins au panier, envoi sur WhatsApp), avec rappel qu'il ne remplace pas un avis médical.
- Photos d'illustration provisoires prises en Afrique de l'Ouest (35 photos libres de droits, crédits dans les mentions légales) et catalogue de démonstration de 17 produits, retirable en une commande.
- Identité visuelle : titres à empattements, tons cacao et crème, section « Du cacao à votre soin », coffret cadeau mis en avant, pastilles « Meilleure vente » et « Nouveau ».
- Fiche produit avec galerie de photos ; deuxième photo au survol des cartes ; animation d'ajout au panier ; cartes de chargement.
- Mode clair et sombre, version téléphone avec barre d'onglets, titres de page pour les moteurs de recherche et les partages.

### Administration (`/admin`)

- Commandes : filtres par statut, recherche, détail client, frais de livraison, lien WhatsApp vers le client, consultation de la preuve Wave, alerte de nouvelles commandes, actualisation automatique. Annuler une commande remet le stock.
- Produits : ajout, modification, suppression (ou masquage si déjà commandé), photo principale et galerie (6 photos), pastille, rédaction de la description avec l'IA, alerte de stock faible.
- Avis : validation, retrait, suppression, saisie d'un avis reçu sur WhatsApp.
- Boutique : WhatsApp, Wave, zones et frais de livraison, identité légale.
- Changement de mot de passe.

### Sécurité

- Limites anti-abus (connexion admin, commandes, avis, preuves, IA).
- Génération IA des fiches réservée à l'admin ; aucune clé IA dans le navigateur.
- Images contrôlées (format réel, taille) ; preuves Wave visibles uniquement par l'admin.

## Vérifications faites

Testé en local sur une base PostgreSQL de test :

- 28 contrôles automatiques de l'API : commande avec frais, stock décrémenté puis rendu à l'annulation, preuve Wave, avis modérés, photos, suppression, blocage après trop d'essais de connexion, accès admin protégé.
- Parcours complet dans le navigateur (ordinateur et téléphone) : ajout au panier, commande, envoi de la preuve, administration.
- Aucune page ne déborde en largeur, de 320 à 768 px.

## Reste à faire

### Informations à fournir par la boutique

1. Photos réelles des produits (à envoyer depuis l'administration), puis retrait du catalogue de démonstration (`npm run prisma:remove-demo`).
2. Huiles : noms, contenances, prix, puis activation dans l'administration.
3. Frais et délais de livraison par zone.
4. Numéro ou lien Wave et consignes de paiement exactes.
5. Identité légale : raison sociale, RCCM, adresse.
6. Composition exacte de chaque produit (les textes de `src/data/productDetails.ts` sont à valider).
7. Photos d'ambiance de la marque pour remplacer les photos provisoires de `public/photos`.
8. Nouveau logo (prévu plus tard).

### Avant la mise en ligne commerciale

1. Héberger la base PostgreSQL, l'API et le site (voir `PRISE_EN_MAIN.md`, section 10).
2. Faire relire les conditions de vente et la politique de confidentialité.
3. Ajouter la clé Gemini sur le serveur pour activer la vraie IA (sinon mode démonstration).
4. Passer une commande test sur la version en ligne.
