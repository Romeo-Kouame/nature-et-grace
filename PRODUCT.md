# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Clientes (et clients) en Côte d'Ivoire**, le plus souvent sur un téléphone d'entrée de gamme et une connexion variable. Elles cherchent un soin naturel pour la peau ou les cheveux, veulent connaître le prix et les frais de livraison avant de s'engager, commander simplement et payer par Wave.
- **La propriétaire de la boutique**, qui gère seule les commandes, les paiements Wave, les produits, le stock, les avis et les réglages depuis `/admin`, sans toucher au code.

## Product Purpose

Boutique en ligne de soins naturels ivoiriens (beurre de cacao brut, chantilly de beurre de cacao, savon noir de cabosse de cacao, huiles végétales). Elle permet de vendre sans dépendre uniquement des échanges WhatsApp, tout en gardant WhatsApp comme canal de conseil et de secours à chaque étape.

Réussite :
- une commande se passe sur téléphone en moins de 2 minutes ;
- le total affiché ne change pas entre l'affichage et la confirmation, sauf les frais annoncés « à confirmer » ;
- la propriétaire n'a besoin d'aucune modification de code pour la gestion courante.

## Positioning

Une sélection de soins naturels **achetés à des productrices ivoiriennes** et revendus par la boutique, avec des prix clairs en FCFA, une livraison annoncée avant le paiement, un paiement Wave confirmé par une personne réelle et des conseils sur WhatsApp ou par la conseillère IA. La boutique ne fabrique pas elle-même les produits : aucun texte ne doit laisser entendre une fabrication maison.

## Operating Context

- Commande : panier (compte client obligatoire), puis validation sur le site ou envoi du panier sur WhatsApp. La boutique confirme le total, la livraison et le délai, puis la cliente paie par Wave et peut envoyer sa capture de paiement.
- Livraison : Abidjan, Bouaké, Daloa et d'autres communes sur demande. Frais et délais par zone, réglés dans l'administration (certains « à confirmer »).
- Connexion : téléphone ou e-mail et mot de passe, ou compte Google (puis téléphone demandé).
- Conseillère IA (chat) : répond à partir du catalogue et des réglages réels, sans rien inventer.

## Capabilities and Constraints

- Stack existante : Vite + React + TypeScript (site), NestJS + Prisma + PostgreSQL (API dans `api/`). CSS maison (variables `--ng-*`), icônes lucide-react.
- Catalogue actuel très réduit (4 produits) : les mises en page doivent rester belles avec peu de produits comme avec beaucoup.
- Produit sans prix connu : « Prix sur demande », pas d'ajout au panier, demande via WhatsApp.
- Paiement Wave confirmé à la main ; pas de paiement automatique.
- Hors périmètre pour l'instant : réinitialisation du mot de passe par SMS ou e-mail, plusieurs langues.
- Règles du projet dans `CLAUDE.md` (sécurité, légal, pas de dark patterns, pas de faux avis, accessibilité, performance).

## Brand Commitments

- **Fixes** : le nom « Nature & Grâce » (écrit ainsi dans les textes), le **logo actuel** (`public/logo.jpeg`), le **slogan** « Prenez soin de vous naturellement », un **ton chaleureux et bienveillant, au féminin** (la clientèle est surtout féminine).
- Tout le reste de l'identité visuelle peut évoluer si c'est mieux.

## Evidence on Hand

- **Vrais avis clients** : la propriétaire en a ou en aura (saisie possible dans l'administration à partir des avis reçus sur WhatsApp). N'afficher que des avis réels et validés.
- Photos produits actuelles (`public/photos/`) : prises dans des conditions différentes (fonds et lumières variés), pas encore refaites.
- Photos d'ambiance du terroir (cacao, cabosses, karité) dans `public/photos/`, crédits dans `src/data/photoCredits.ts`.
- **Absences à ne jamais combler par de l'invention** : pas de photos de l'équipe ou d'un atelier, pas d'étude de cas, pas de chiffres de ventes, pas de certifications, pas de presse, pas de promotions.

## Product Principles

1. **La clarté avant tout** : prix, frais, délais et étapes visibles avant tout engagement, sans frais caché.
2. **Le téléphone d'abord** : chaque écran doit être rapide et simple sur un petit téléphone avec une connexion moyenne.
3. **Une vraie personne derrière** : WhatsApp et la boutique restent joignables à chaque étape ; la conseillère IA aide sans jamais promettre ni inventer.
4. **La vérité sur l'origine** : des soins naturels ivoiriens sélectionnés auprès de productrices, présentés sans exagération ni promesse médicale.

## Accessibility & Inclusion

WCAG 2.1 AA visé (contrastes d'au moins 4,5:1 en clair et en sombre, utilisable au clavier, texte alternatif). Mode clair et sombre, animations réduites si le système le demande, aucune page qui déborde de 320 à 768 px. Lisibilité sur écrans peu lumineux et en plein soleil.
