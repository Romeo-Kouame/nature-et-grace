# TRD — Exigences techniques

## Vue d'ensemble

```
Navigateur ──► Site React (Vite, fichiers statiques)
     │
     └──► API NestJS ──► PostgreSQL (Prisma 7, adaptateur pg)
               └──► Google Gemini (IA, côté serveur uniquement)
```

Deux éléments à héberger : le site (dossier racine, sortie `dist/`) et l'API (dossier `api/`) avec sa base.

## Pile technique

| Partie | Choix | Pourquoi |
| --- | --- | --- |
| Site | React 18 + TypeScript, Vite 6 | Application rapide, une seule page, pas de serveur à faire tourner pour le site |
| Navigation | Routeur maison (`history.pushState`) dans `AppContext` | Peu de pages, aucune dépendance |
| Icônes | lucide-react | Légères, cohérentes |
| API | NestJS 11 (Express), CommonJS | Structure claire, validation par décorateurs |
| Base | PostgreSQL + Prisma 7.10 (`prisma-client`, `@prisma/adapter-pg`) | Schéma typé, migrations versionnées |
| Validation | class-validator (`whitelist`, `forbidNonWhitelisted`) | Rejette tout champ inattendu |
| Sessions | JWT dans un cookie `httpOnly` | Pas de jeton lisible par le JavaScript du navigateur |
| Mots de passe | bcryptjs (coût 12) | Hachage lent, standard |
| IA | `@google/genai` (Gemini), appelé par l'API | La clé ne quitte jamais le serveur |
| Images | Stockées en base (table `Image`), vérifiées par signature binaire | Aucun service de fichiers à gérer |

Versions minimales : Node 20.19 (recommandé 22+), TypeScript 5.6.

## Services tiers

| Service | Usage | Données envoyées |
| --- | --- | --- |
| WhatsApp (liens `wa.me`) | Commande et contact | Ce que le client choisit d'envoyer |
| Wave | Paiement (hors site) | Aucune par le site |
| Google Gemini | Conseiller IA, rédaction des fiches | Texte saisi dans le conseiller ; plafond `GEMINI_DAILY_LIMIT` par jour |
| Google Fonts | Polices Fraunces et Plus Jakarta Sans (licence SIL OFL) | Requête de police |
| Google Maps (facultatif) | Carte de la page Contact, chargée seulement au clic | Adresse de la boutique |
| Google Analytics 4 (facultatif) | Mesure d'audience, chargée seulement après accord | Pages vues |

## Variables d'environnement

Site (`.env`) : `VITE_API_URL`, `VITE_SITE_URL`, `VITE_GA_ID` (facultatif).

API (`api/.env`) : `DATABASE_URL`, `JWT_SECRET` (32 caractères minimum), `WEB_ORIGIN`, `COOKIE_SECURE`, `TRUST_PROXY`, `NODE_ENV`, `ADMIN_EMAIL`, `ADMIN_INITIAL_PASSWORD`, `GEMINI_API_KEY`, `GEMINI_DAILY_LIMIT`.

Les fichiers `.env` sont exclus de git ; seuls les `.env.example` sont publiés.

## Sécurité (résumé)

- Droits vérifiés côté serveur : `AdminGuard`, `CustomerGuard` ; un client n'accède qu'à ses propres commandes.
- Limites anti-abus par adresse IP sur la connexion, l'inscription, les commandes, les avis, les preuves, l'IA et le signalement d'erreurs.
- Consentements (CGV, publication d'un avis) vérifiés par le serveur ; champ piège anti-robots.
- Commande protégée contre le double envoi (`clientKey` unique) et la survente (décrément conditionnel du stock dans une transaction).
- CORS limité à `WEB_ORIGIN` et refus des écritures venant d'une autre origine.
- En production : redirection HTTPS, en-tête HSTS, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `x-powered-by` masqué.
- Erreurs imprévues journalisées (sans le contenu des requêtes) ; le visiteur ne reçoit qu'un message générique.
- La RLS (Row Level Security) de PostgreSQL n'est pas utilisée : seule l'API accède à la base, avec un seul utilisateur, et c'est elle qui applique les droits.

## Performance

- Catalogue, réglages et avis publics mis en cache 60 s par le navigateur.
- Index sur les commandes (client, statut, date), produits (actifs, rayon) et avis (publiés, date).
- Photos envoyées redimensionnées (1 400 px) et compressées dans le navigateur ; photos d'illustration en WebP.
- Administration : commandes en cours et des 3 derniers mois par défaut, historique complet sur demande.

## Surveillance et sauvegardes

- `GET /api/health` : 200 si l'API et la base répondent (à brancher sur UptimeRobot ou équivalent).
- `POST /api/client-errors` : erreurs survenues dans le navigateur des visiteurs, journalisées.
- `npm run db:backup` (dans `api/`) : sauvegarde `pg_dump`, 14 conservées ; `npm run db:restore-check` : test de restauration dans une base temporaire.
