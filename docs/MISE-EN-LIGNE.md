# Mise en ligne — Nature & Grâce

Le code est prêt. La mise en ligne demande trois comptes gratuits (ou presque) que seule la propriétaire du projet peut
créer : un pour le **site**, un pour l'**API**, un pour la **base de données**. Compter environ 1 heure la première fois.

| Élément | Service conseillé | Pourquoi |
| --- | --- | --- |
| Site (Vite + React) | **Vercel** | déjà prévu (`vercel.json`), gratuit, HTTPS automatique |
| API (NestJS) | **Render** (ou Railway) | lance `npm start`, HTTPS automatique |
| Base PostgreSQL | **Neon** | PostgreSQL géré, sauvegardes automatiques incluses |

## 1. Base de données (Neon)

1. Créer un projet sur neon.tech (région la plus proche : Europe). Copier l'adresse de connexion (`postgresql://…?sslmode=require`).
2. Sur votre ordinateur, dans `api/` : appliquer les migrations sur cette base, puis créer l'admin et les fiches :
   ```
   DATABASE_URL="<adresse Neon>" npm run prisma:migrate
   DATABASE_URL="<adresse Neon>" ADMIN_EMAIL="<votre e-mail>" ADMIN_INITIAL_PASSWORD="<mot de passe long>" npm run prisma:seed-admin
   DATABASE_URL="<adresse Neon>" npm run prisma:seed-products
   DATABASE_URL="<adresse Neon>" npm run prisma:seed-details
   ```
   Ne **pas** lancer `prisma:seed-demo` en production (produits de démonstration).
3. Sauvegardes : Neon garde un historique de restauration ; vérifier sa durée dans l'offre choisie.

## 2. API (Render)

1. Nouveau « Web Service » relié au dépôt GitHub, dossier racine `api`.
2. Build : `npm ci && npm run build` · Démarrage : `npm start` · Version de Node : 22.
3. Variables d'environnement (modèle complet : `api/.env.example`) :
   - `DATABASE_URL` (Neon), `JWT_SECRET` (nouvelle valeur aléatoire de 48 caractères ou plus)
   - `NODE_ENV=production`, `COOKIE_SECURE=true`, `TRUST_PROXY=true`
   - `WEB_ORIGIN=https://<adresse du site>`
   - Facultatif mais conseillé : `GEMINI_API_KEY`, `TURNSTILE_SECRET` + `TURNSTILE_HOSTNAMES=<domaine du site>` (sans localhost),
     `RESEND_API_KEY` + `MAIL_FROM`, `TWILIO_*`, `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI=https://<adresse de l'API>/api/customer/google/callback`
4. Vérifier : `https://<adresse de l'API>/api/health` doit afficher `{"status":"ok"}`.

> Site et API sur deux domaines différents : laisser `COOKIE_SAMESITE` vide. API sur un sous-domaine du site
> (ex. `api.natureetgrace.ci`) : `COOKIE_SAMESITE="lax"` (plus sûr).

## 3. Site (Vercel)

1. « Add New Project » → dépôt GitHub, dossier racine : la racine du dépôt. Vercel détecte Vite.
2. Variables : `VITE_API_URL=https://<adresse de l'API>/api`, `VITE_SITE_URL=https://<adresse du site>`,
   `VITE_TURNSTILE_SITEKEY` (si captcha), `VITE_GA_ID` (si mesure d'audience).
3. Déployer. Chaque fusion dans `main` redéploie automatiquement.
4. Nom de domaine : l'ajouter dans Vercel (et l'API en sous-domaine dans Render), puis mettre à jour `WEB_ORIGIN`,
   `VITE_SITE_URL`, `TURNSTILE_HOSTNAMES` et l'adresse de retour Google.

## 4. Surveillance

Dans GitHub : Settings → Secrets and variables → Actions → « New repository secret » :
- `HEALTH_URL` = `https://<adresse de l'API>/api/health`
- `SITE_URL` = `https://<adresse du site>`

Le contrôle « Surveillance » vérifie alors le site toutes les 15 minutes et prévient par e-mail en cas de panne
(GitHub → Settings → Notifications → Actions : cocher les e-mails pour les échecs).

## 5. Dernières vérifications

- [ ] Créer une commande test de bout en bout, puis l'annuler dans `/admin`.
- [ ] « Mot de passe oublié » : recevoir le code (e-mail ou SMS) et changer le mot de passe.
- [ ] L'alerte de nouvelle commande arrive bien sur le WhatsApp (ou par SMS) et l'e-mail de la boutique.
- [ ] `/admin` : changer le mot de passe initial.
- [ ] Remplir les mentions légales (identité de la boutique) dans les réglages de `/admin`.
