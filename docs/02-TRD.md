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
| Google Gemini | Chat de la conseillère IA (`POST /api/ai/chat`), rédaction des fiches | Messages du chat (12 derniers au plus) ; plafond `GEMINI_DAILY_LIMIT` par jour, puis réponses par mots-clés |
| Google (OAuth 2.0 / OpenID Connect) | « Continuer avec Google » : flux code + PKCE, sans script Google sur le site | Nom, e-mail vérifié et identifiant Google, reçus par l'API |
| Cloudflare Turnstile | Captcha des formulaires connexion, inscription, finalisation Google, avis ; vérifié par l'API (`siteverify`) | Signaux techniques du navigateur, adresse IP |
| Google Fonts | Polices Fraunces et Plus Jakarta Sans (licence SIL OFL) | Requête de police |
| Google Maps (facultatif) | Carte de la page Contact, chargée seulement au clic | Adresse de la boutique |
| Google Analytics 4 (facultatif) | Mesure d'audience, chargée seulement après accord | Pages vues |

## Variables d'environnement

Site (`.env`) : `VITE_API_URL`, `VITE_SITE_URL`, `VITE_GA_ID` (facultatif), `VITE_TURNSTILE_SITEKEY` (facultatif, clé publique du captcha).

API (`api/.env`) : `DATABASE_URL`, `JWT_SECRET` (32 caractères minimum), `WEB_ORIGIN`, `COOKIE_SECURE`, `COOKIE_SAMESITE`, `TRUST_PROXY`, `NODE_ENV`, `ADMIN_EMAIL`, `ADMIN_INITIAL_PASSWORD`, `GEMINI_API_KEY`, `GEMINI_DAILY_LIMIT`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` (connexion Google, facultatif), `TURNSTILE_SECRET`, `TURNSTILE_HOSTNAMES` (captcha, facultatif).

Les fichiers `.env` sont exclus de git ; seuls les `.env.example` sont publiés.

## Sécurité (résumé)

- Droits vérifiés côté serveur : `AdminGuard`, `CustomerGuard` ; un client n'accède qu'à ses propres commandes.
- Limites anti-abus par adresse IP sur la connexion, l'inscription, les commandes, les avis, les preuves, l'IA et le signalement d'erreurs.
- Connexion : en plus, blocage par compte visé après 10 échecs (8 pour l'admin) en 15 minutes ; temps de réponse identique que le compte existe ou non (pas de devinette des numéros inscrits).
- Taille des requêtes : 100 ko maximum, sauf l'envoi de photos (7 Mo). Seul le format JSON est accepté.
- Sessions : jeton marqué « client » ou « admin », chacun refusé par l'autre espace ; l'empreinte du mot de passe est un HMAC qui ne révèle rien du hachage.
- Une seule preuve de paiement par commande (la précédente est supprimée au remplacement) ; téléphone de commande vérifié au format ivoirien.
- Consentements (CGV, publication d'un avis) vérifiés par le serveur ; champ piège anti-robots.
- Commande protégée contre le double envoi (`clientKey` unique) et la survente (décrément conditionnel du stock dans une transaction).
- CORS limité à `WEB_ORIGIN` ; toute écriture doit porter un en-tête `Origin` (ou `Referer`) du site, sinon elle est refusée (anti-CSRF).
- En production : redirection HTTPS, en-tête HSTS, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `x-powered-by` masqué.
- Erreurs imprévues journalisées (sans le contenu des requêtes) ; le visiteur ne reçoit qu'un message générique.
- La RLS (Row Level Security) de PostgreSQL n'est pas utilisée : seule l'API accède à la base, avec un seul utilisateur, et c'est elle qui applique les droits.

## En-têtes du site (à configurer chez l'hébergeur du site)

L'API envoie ses propres en-têtes de sécurité, mais les pages du site sont servies par l'hébergeur du site. Y ajouter : `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`. Fichier de configuration à préparer selon l'hébergeur choisi.

## Performance

- Catalogue, réglages et avis publics mis en cache 60 s par le navigateur.
- Index sur les commandes (client, statut, date), produits (actifs, rayon) et avis (publiés, date).
- Photos envoyées redimensionnées (1 400 px) et compressées dans le navigateur ; photos d'illustration en WebP.
- Administration : commandes en cours et des 3 derniers mois par défaut, historique complet sur demande.

## Surveillance et sauvegardes

- `GET /api/health` : 200 si l'API et la base répondent. Surveillé toutes les 15 minutes par GitHub Actions (`.github/workflows/surveillance.yml`, secrets `HEALTH_URL` et `SITE_URL`) : un échec envoie un e-mail.
- `POST /api/client-errors` : erreurs survenues dans le navigateur des visiteurs, journalisées.
- `npm run db:backup` (dans `api/`) : sauvegarde `pg_dump`, 14 conservées (outils PostgreSQL trouvés automatiquement sous Windows, ou `PG_BIN`) ; `npm run db:restore-check` : test de restauration dans une base temporaire.
- Sauvegarde quotidienne locale : `api/scripts/planifier-sauvegarde.ps1` (tâche Windows à 21 h, à lancer une fois). En ligne : sauvegardes de l'hébergeur de la base.
- Vérification automatique (`.github/workflows/ci.yml`) : build du site, build et tests de l'API (`npm test`, lanceur intégré de Node), détecteur Impeccable (indicatif).

## Messages (e-mail, SMS, WhatsApp)

`api/src/notify.ts`, appels HTTP directs, sans dépendance : Resend (e-mail : `RESEND_API_KEY`, `MAIL_FROM`), Twilio (SMS : `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_SMS_FROM` ; WhatsApp : `TWILIO_WHATSAPP_FROM`). Sans fournisseur, en développement, les messages s'affichent dans le terminal de l'API ; en production, rien n'est journalisé.
- Code « mot de passe oublié » (e-mail ou SMS).
- Alerte de chaque nouvelle commande au numéro WhatsApp de la boutique (WhatsApp ou SMS) et à l'e-mail d'alerte des réglages.
- Suivi envoyé à la cliente à chaque changement de statut (confirmée, en préparation, expédiée, livrée, annulée).
