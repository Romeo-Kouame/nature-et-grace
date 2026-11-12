# Prise en main du projet NATURE & GRÂCE

Guide pour installer, lancer et faire évoluer la boutique en local.

## 1. Prérequis

- Node.js 20 ou plus récent, et npm.
- Une base PostgreSQL (locale, Docker, ou hébergée comme Neon).

Le site utilise React, TypeScript et Vite. L'API utilise NestJS, Prisma et PostgreSQL.

## 2. Installer

```bash
npm install          # site
cd api && npm install  # API
```

Copier `.env.example` vers `.env` (racine) et `api/.env.example` vers `api/.env`, puis renseigner les vraies valeurs. Ces fichiers `.env` ne doivent jamais être publiés.

Dans `api/.env` :

| Variable | Rôle |
| --- | --- |
| `DATABASE_URL` | Chaîne de connexion PostgreSQL |
| `JWT_SECRET` | Clé aléatoire d'au moins 32 caractères (sessions admin) |
| `WEB_ORIGIN` | Adresse(s) du site autorisées, séparées par des virgules |
| `COOKIE_SECURE` | `true` en ligne (HTTPS), `false` en local |
| `TRUST_PROXY` | `true` une fois l'API derrière un hébergeur, pour que les limites anti-abus voient la vraie adresse IP |
| `ADMIN_EMAIL`, `ADMIN_INITIAL_PASSWORD` | Compte de la propriétaire (12 caractères minimum) |
| `GEMINI_API_KEY` | Facultatif : active la vraie IA (conseiller beauté, rédaction des fiches) |

La clé Gemini reste uniquement sur le serveur : le site n'appelle jamais Google directement.

## 3. Lancer en local

Terminal 1, l'API :

```bash
cd api
npm run prisma:generate
npm run prisma:migrate        # crée ou met à jour les tables
npm run prisma:seed-admin     # une seule fois : crée le compte admin
npm run prisma:seed-products  # catalogue de départ (stock à 0, huiles masquées)
npm run prisma:seed-demo      # facultatif : 17 produits de démonstration avec photos
npm run build && npm start    # ou : npm run start:dev
```

L'API écoute sur `http://localhost:3001/api`.

Terminal 2, le site :

```bash
npm run dev
```

Ouvrir `http://localhost:5173`. L'administration est sur `http://localhost:5173/admin`.

Si l'API ne répond pas, le site affiche un catalogue de secours (les trois produits du cahier des charges et une huile « prix à confirmer ») et les commandes passent par WhatsApp.

## 4. Ce qui se gère depuis l'administration

Aucune modification de code n'est nécessaire pour :

- **Produits** : ajout, modification, suppression, prix (vide = « prix à confirmer »), stock, visibilité, photo principale et jusqu'à 6 photos supplémentaires (envoyées depuis le téléphone ou l'ordinateur, redimensionnées automatiquement), pastille « Meilleure vente » ou « Nouveau », description avec aide de l'IA. Un produit déjà commandé est masqué au lieu d'être supprimé, pour garder l'historique.
- **Commandes** : suivi par statut, coordonnées du client, frais de livraison, bouton pour écrire au client sur WhatsApp, consultation de la capture de paiement Wave. Annuler une commande remet ses produits en stock. La liste se met à jour toute seule chaque minute et signale les nouvelles commandes.
- **Avis** : les avis déposés sur le site attendent une validation. La propriétaire peut aussi saisir un avis reçu sur WhatsApp.
- **Boutique** : numéro WhatsApp, numéro ou lien Wave, consignes de paiement, zones desservies, **frais et délais par zone**, identité légale de l'entreprise (affichée dans les mentions légales).

Ces réglages s'affichent partout sur le site (en-tête, pied de page, page contact, panier, pages légales).

## 5. Parcours de commande

1. Le client ajoute ses produits au panier (conservé sur son appareil), même sans être connecté.
2. **Pour ouvrir le panier, il doit être connecté** : sinon il est envoyé vers `/connexion` (connexion ou création de compte par numéro de téléphone), puis le panier se rouvre automatiquement avec ses articles.
3. Il valide sur le site (nom, téléphone, zone, commune, adresse) ou envoie son panier sur WhatsApp.
4. Il reçoit une référence à 6 caractères, le total avec livraison (ou « à confirmer ») et les consignes Wave.
5. Il peut envoyer la capture de son paiement depuis le site ; la commande passe alors en « Paiement à vérifier ». Ces captures ne sont visibles que depuis l'administration.

Le paiement Wave reste confirmé à la main par la boutique : il n'existe pas d'intégration automatique.

## 6. Comptes clients

- Identifiant : numéro ivoirien à 10 chiffres (ou e-mail s'il l'a renseigné), mot de passe de 8 caractères minimum, chiffré en base.
- Espace client : « Votre compte » (`/compte` : informations, adresse par défaut, mot de passe) et « Vos commandes » (`/commandes` : suivi en 5 étapes, envoi de la preuve Wave).
- Session de 30 jours ; changer de mot de passe déconnecte les autres appareils.
- Mot de passe oublié : pour l'instant, le client écrit à la boutique sur WhatsApp (pas encore de réinitialisation par SMS ou e-mail).

## 7. Photos

Les photos envoyées depuis l'administration et les preuves de paiement sont stockées dans la base (table `Image`), pour ne dépendre d'aucun service de fichiers. Tant qu'un produit n'a pas de photo, une illustration aux couleurs de la marque (pot, savon, flacon, coffret) s'affiche.

**Photos d'illustration provisoires.** En attendant les photos de la marque, le site utilise 35 photos libres de droits prises en Afrique de l'Ouest (karité du Ghana, cacao de Soubré et de Côte d'Ivoire, savon noir, coco de Bonoua, bissap), issues de Wikimedia Commons :

- fichiers dans `public/photos` (`p-…` pour les produits, `a-…` pour l'ambiance) ;
- crédits obligatoires (licences CC BY et CC BY-SA) dans `src/data/photoCredits.ts`, affichés dans les mentions légales ;
- photos d'ambiance et de rayons réglées dans `PHOTOS` et `CATEGORY_INFO` (`src/data/products.ts`).

**Catalogue de démonstration.** `npm run prisma:seed-demo` (dans `api`) ajoute 17 produits fictifs avec photos, prix et pastilles, et pose une photo sur les produits réels qui n'en ont pas. `npm run prisma:remove-demo` les retire d'un coup (un produit déjà commandé est masqué au lieu d'être supprimé). La liste est dans `api/prisma/demo-catalog.ts`. À retirer avant l'ouverture commerciale.

Quand les vraies photos arrivent : les envoyer depuis l'administration, remplacer les photos d'ambiance dans `public/photos` (mêmes noms) puis retirer les crédits devenus inutiles.

## 8. Où modifier quoi dans le code

| Besoin | Fichier |
| --- | --- |
| Textes de l'accueil | `src/pages/HomePage.tsx` |
| Bienfaits, utilisation et composition des produits | `src/data/productDetails.ts` |
| Catalogue de secours, rayons | `src/data/products.ts` |
| Questions fréquentes | `src/pages/ContactPage.tsx` |
| Mentions légales, CGV, confidentialité | `src/pages/LegalPage.tsx` |
| Couleurs et typographie | variables `--ng-*` en tête de `src/nature.css` |
| Panier, conseiller IA, éléments communs | `src/checkout.css` |
| Administration | `src/AdminApp.tsx`, `src/admin.css` |
| Routes de l'API | `api/src/app.controller.ts` |
| Structure de la base | `api/prisma/schema.prisma` (+ une migration par changement) |

## 9. Sécurité en place

- Session admin par cookie `httpOnly`, invalidée au changement de mot de passe.
- Limites anti-abus par adresse IP : connexion admin (8 essais / 15 min), commandes, avis, preuves de paiement et conseiller IA.
- La rédaction IA des fiches est réservée à l'admin (elle consomme le quota Gemini).
- Les images envoyées sont vérifiées (vrai JPEG, PNG ou WebP, 4 Mo maximum).
- Les écritures venant d'une autre origine que `WEB_ORIGIN` sont refusées.

## 10. Mise en ligne (à faire plus tard)

Deux éléments à héberger : le site (dossier racine, sortie `dist`) et l'API (dossier `api`) avec sa base PostgreSQL. Côté site, définir `VITE_API_URL` (adresse publique de l'API terminée par `/api`). Côté API, définir les variables du tableau ci-dessus avec `COOKIE_SECURE=true` et `TRUST_PROXY=true`, puis lancer `npm run prisma:migrate`.

Le fichier `vercel.json` renvoie toutes les adresses vers l'application, ce qui permet d'ouvrir directement `/boutique`, `/produit/...` ou `/admin`.

## 11. Commandes utiles

```bash
npm run dev      # site en local
npm run build    # version de production du site dans dist
npm run preview  # aperçu de la version de production
```

Dans `api` : `npm run build` compile l'API dans `dist`, `npm start` la démarre. `prisma:seed-admin` ne modifie jamais un compte existant.
