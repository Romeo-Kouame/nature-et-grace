# NATURE & GRÂCE — travail réalisé

Ce document résume la première version de la boutique et les décisions retenues pour la suite.

## Objectif

Créer une boutique en ligne moderne, responsive et simple à administrer pour présenter les soins naturels NATURE & GRÂCE, recevoir des commandes sur le site et par WhatsApp, puis gérer le catalogue et les commandes depuis un espace privé.

## Choix retenus

- Interface : React + TypeScript, construite avec Vite.
- API : Node.js + NestJS (premier socle créé).
- Base de données : PostgreSQL avec Prisma (schéma et migration initiale créés).
- Déploiement de démonstration envisagé : Vercel.
- La propriétaire de la boutique sera l’unique administratrice. Elle pourra changer son mot de passe à la demande depuis son espace sécurisé.
- Numéro WhatsApp de la boutique : +225 07 17 68 47 51.

## Réalisé dans cette première version

- Page d’accueil de marque avec slogan et navigation.
- Présentation des valeurs et de l’histoire de la marque.
- Catalogue adaptatif avec beurre de cacao, savon noir de cabosse et huiles d’exemple.
- Panier avec modification des quantités et calcul des prix connus.
- Panier avec quantités, commande transmise à WhatsApp ou envoyée au serveur avec les coordonnées de livraison.
- Affichage des frais/délais comme éléments à confirmer avant validation définitive de la commande.
- Chargement du catalogue depuis l’API lorsqu’elle est configurée ; mode de démonstration local si l’API ne répond pas.
- Formulaire d’envoi de demande de commande avec nom, téléphone, commune et adresse.
- Espace `/admin` avec connexion, changement de mot de passe, ajout/modification de produits, prix, stock et visibilité, et suivi du statut des commandes.
- Réglages modifiables dans l’administration pour WhatsApp, zones et informations de livraison, et consignes Wave.
- Après une demande en ligne, raccourci WhatsApp pour transmettre une preuve Wave si elle est demandée.
- Présentation des zones de livraison citées : Abidjan, Bouaké, Daloa et autres communes sur demande.
- Affichage de Wave comme moyen de paiement, avec mention que les modalités seront précisées par la boutique.
- Mise en page responsive pour ordinateur et téléphone.
- Direction visuelle naturelle et élégante : tons verts et dorés, typographie éditoriale, illustrations de produits composées en CSS et logo fourni.
- Première API : catalogue, création de commande avec vérification des prix et du stock, connexion administrateur, changement de mot de passe, gestion des produits et suivi des statuts de commande.
- Schéma PostgreSQL, migration initiale, et scripts d’initialisation du compte administrateur et du catalogue d’exemple.
- Configuration Vercel pour la route `/admin` et exemples de variables d’environnement.

## Fichiers principaux

- `src/App.tsx` : contenu, catalogue temporaire, panier et interactions.
- `src/styles.css` : styles, illustrations CSS et adaptations mobiles.
- `src/main.tsx` : démarrage de l’application React.
- `src/AdminApp.tsx` : espace d’administration.
- `src/api.ts` : accès du site à l’API.
- `src/product-image.css` : affichage des photos produits quand une URL est configurée.
- `src/admin.css` et `src/checkout.css` : styles de l’administration et du formulaire de commande.
- `api/src/app.controller.ts` : routes de l’API et opérations métier de départ.
- `api/prisma/schema.prisma` : structure des données produits, commandes et administrateur.
- `api/prisma/migrations/20261110_initial/migration.sql` : migration de création des tables.
- `api/.env.example` : variables nécessaires au lancement local de l’API.
- `index.html` : titre et métadonnées du site.
- `logo.jpeg` : logo transmis pour le projet.
- `demande.txt` : demande initiale de la boutique.

## Données encore provisoires

- Les huiles de coco, de neem et de karité sont des exemples à confirmer par la propriétaire. Dans les données de démarrage, elles restent cachées jusqu’à activation depuis l’administration.
- Leurs prix et contenances sont à confirmer.
- Les frais et délais de livraison ne sont pas encore fournis. Une commande reçue par le site est une demande en attente, et la boutique doit confirmer ces éléments avant validation définitive.
- Les instructions détaillées de paiement Wave restent à préciser.
- Les visuels produits actuels sont des compositions graphiques de démonstration. Il faudra les remplacer ou les compléter avec les photos réelles des produits pour la version client finale.

## À terminer avant publication commerciale

1. Configurer une base PostgreSQL et faire un déploiement complet de démonstration sur Vercel.
2. Ajouter téléversement direct de photos produits ; les preuves Wave peuvent être envoyées par WhatsApp.
3. Recueillir les vrais produits, huiles, images, frais et délais de livraison.
4. Ajouter les informations légales et les conditions de vente avant publication.
5. Revoir la sécurité et vérifier le parcours sur téléphones et ordinateurs.

Le site et l’API sont raccordés au niveau du code, mais ils ne sont pas encore configurés avec une base en ligne ni déployés. Le paiement Wave reste une confirmation manuelle, à moins que la boutique fournisse les modalités d’une intégration officielle.
