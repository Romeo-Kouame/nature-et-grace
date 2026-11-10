# Prise en main du projet NATURE & GRÂCE

Guide de démarrage pour ouvrir, modifier et préparer la première démonstration du site.

## 1. Prérequis

Installer une version récente de Node.js (20 ou supérieure) et npm. Le site utilise React, TypeScript et Vite ; l’API utilise NestJS, Prisma et PostgreSQL.

## 2. Installer le projet

Depuis le dossier du projet, ouvrir un terminal et lancer :

```bash
npm install
```

Copier `.env.example` vers `.env` à la racine du projet. Copier `api/.env.example` vers `api/.env`, puis remplacer les exemples par les vraies valeurs locales. Ne jamais envoyer ni publier ces fichiers `.env`.

### Configurer et démarrer l’API

Dans un deuxième terminal :

```bash
cd api
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed-admin
npm run prisma:seed-products
npm run start:dev
```

Avant les commandes Prisma, renseigner dans `api/.env` la chaîne `DATABASE_URL`, une longue clé aléatoire `JWT_SECRET`, ton adresse `ADMIN_EMAIL` et un mot de passe initial `ADMIN_INITIAL_PASSWORD` d’au moins 12 caractères. Créer d’abord la base PostgreSQL. L’API écoute sur `http://localhost:3001/api`.

Les produits de départ créés par le script ont un stock de zéro ; renseigner le stock réel depuis l’administration avant d’accepter des commandes. Les huiles d’exemple sont désactivées jusqu’à ce que leurs informations soient confirmées.

## 3. Démarrer le site en local

```bash
npm run dev
```

Vite affiche une adresse locale dans le terminal (généralement `http://localhost:5173`). Ouvrir cette adresse dans le navigateur. Arrêter le serveur avec `Ctrl+C`.

## 4. Modifier le catalogue de démonstration

Avec l’API connectée, le catalogue vient de PostgreSQL et se modifie dans l’administration (`/admin`). Le tableau `products` au début de `src/App.tsx` sert de catalogue de démonstration si l’API n’est pas configurée.

Chaque produit possède un identifiant, un nom, une catégorie, une contenance, un prix, une description et une classe visuelle. Les huiles utilisent `price: null` pour afficher « Prix à confirmer ». Remplacer ces exemples par les noms, prix, contenances et descriptions validés par la boutique.

Le logo fourni est `logo.jpeg` à la racine du projet. Pour la version finale, demander des photos produits nettes et cohérentes, puis mettre à jour les visuels de démonstration dans `src/App.tsx` et `src/styles.css`.

## 5. Modifier le numéro WhatsApp

Dans `src/App.tsx`, modifier `waNumber`. Utiliser le format international avec le code du pays, uniquement des chiffres, sans signe `+`, espace ni zéro national initial. Le numéro actuel correspond au +225 07 17 68 47 51 communiqué pour la boutique.

Le bouton de commande prépare un message contenant les articles et leurs quantités. Les prix non renseignés et la livraison sont à confirmer avec la boutique.

## 6. Modifier le style

Les couleurs, polices, espacements et règles d’affichage mobile sont dans `src/styles.css`. Les visuels de pots et bouteilles de la maquette sont dessinés en CSS. Les informations visibles dans le site (slogan, livraison, paiement) sont principalement dans `src/App.tsx`.

## 7. Utiliser l’administration

Ouvrir `/admin`, puis se connecter avec l’adresse et le mot de passe initial définis dans `api/.env`. Changer ce mot de passe depuis le bouton « Mot de passe » après la première connexion. L’administration permet de modifier WhatsApp, les zones et informations de livraison et les instructions Wave, d’ajouter ou modifier les produits, leur visibilité, leur prix et leur stock, puis de faire évoluer le statut des commandes.

Pour l’instant, les photos se renseignent avec une URL d’image. Le téléversement direct de fichiers n’est pas encore branché. Après l’envoi d’une demande de commande, le client peut ouvrir WhatsApp pour joindre sa preuve Wave si elle est demandée.

## 8. Préparer une démonstration Vercel

Le site et l’API peuvent être déployés comme deux projets Vercel reliés au même dépôt : le site avec le dossier racine du projet, l’API avec le dossier racine `api`. Pour le site, vérifier la commande `npm run build` et le dossier généré `dist`. Pour le projet API, configurer `DATABASE_URL`, `JWT_SECRET`, `WEB_ORIGIN`, `COOKIE_SECURE=true`, `ADMIN_EMAIL` et `ADMIN_INITIAL_PASSWORD` dans les variables d’environnement Vercel. `WEB_ORIGIN` accepte plusieurs origines séparées par des virgules ; y inscrire l’adresse publique stable du site et, au besoin, l’adresse de prévisualisation utilisée pour la démo.

Dans les variables du projet site, définir `VITE_API_URL` avec l’adresse publique de l’API terminée par `/api`. Renseigner `WEB_ORIGIN` avec l’adresse du site. Ne jamais placer un mot de passe ou une chaîne de connexion PostgreSQL dans le code front-end. Une base PostgreSQL hébergée (par exemple Neon) doit être créée et sa chaîne de connexion réservée au serveur.

Le dossier est initialisé en dépôt Git local. Le dépôt GitHub privé demandé sera créé sous `Romeo-Kouame` à la fin du travail ; la session GitHub de cette machine doit être renouvelée avant la création et l’envoi du code.

## 9. État des fonctions

La boutique et les fonctions serveur de base sont présentes. Pour les utiliser ensemble, configurer et lancer PostgreSQL et l’API, puis renseigner `VITE_API_URL`. Les commandes du site sont sauvegardées dans la base. Le paiement Wave n’est pas automatisé : la boutique le confirme avec le client. La livraison n’est pas chiffrée automatiquement.

Les photos de la maquette sont des illustrations CSS et les champs d’image de l’administration attendent une URL. Les photos réelles et le téléversement d’images sont à ajouter avant la mise en ligne commerciale.

## 10. Commandes utiles

```bash
npm run dev      # démarrage local
npm run build    # génération de la version de production dans dist
npm run preview  # aperçu local de la version construite
```

Dans le dossier `api`, `npm run build` génère l’API compilée. Après compilation, `npm run start` démarre la version compilée. Ne lancer `prisma:seed-admin` qu’une fois pour créer le compte initial ; le script ne réinitialise pas un mot de passe existant.
