# Plan d'implémentation

Ordre de développement suivi, puis étapes restantes. ✅ = fait, ⏳ = à faire.

## Phase 1 — Fondations ✅
1. Site React + TypeScript (Vite), identité visuelle, pages principales.
2. API NestJS + Prisma + PostgreSQL, schéma initial, compte admin.
3. Catalogue branché sur l'API, catalogue de secours si l'API ne répond pas.

## Phase 2 — Vente ✅
4. Panier sur l'appareil, commande sur le site ou WhatsApp.
5. Zones et frais de livraison affichés avant l'envoi.
6. Consignes Wave et envoi de la preuve de paiement.
7. Administration : commandes, produits, avis, réglages.

## Phase 3 — Comptes et confiance ✅
8. Comptes clients, panier réservé aux connectés, suivi des commandes.
9. Avis modérés, conseiller beauté IA côté serveur.
10. Photos d'illustration ouest-africaines, catalogue de démonstration.

## Phase 4 — Expérience ✅
11. Rangées de produits qui défilent, recherche en direct, une page par élément du menu.

## Phase 5 — Mise en conformité CLAUDE.md ✅
12. Consentements vérifiés côté serveur, anti-spam, anti double commande, suppression du compte.
13. Pages remboursement et cookies, bandeau cookies conditionnel, mesure d'audience avec accord.
14. Sitemap, robots.txt, fil d'Ariane, données Google, descriptions uniques.
15. Écran de secours en cas de plantage, journalisation des erreurs, page de surveillance.
16. Index, cache, plafond IA, sauvegardes et test de restauration, contrastes WCAG AA.
17. Passage à Prisma 7.

## Phase 6 — Avant l'ouverture ⏳
18. Contenu de la boutique : photos réelles, prix des huiles, frais par zone, numéro Wave, identité légale, adresse, compositions à valider.
19. Retirer le catalogue de démonstration : `npm run prisma:remove-demo` (dans `api/`).
20. Hébergement :
    - base PostgreSQL (ex. Neon) ;
    - API (`api/`) avec `NODE_ENV=production`, `COOKIE_SECURE=true`, `TRUST_PROXY=true`, puis `npm run prisma:migrate` ;
    - site (racine) avec `VITE_API_URL`, `VITE_SITE_URL`, éventuellement `VITE_GA_ID`.
21. Brancher la surveillance sur `GET /api/health` et programmer `npm run db:backup` chaque jour (+ un `db:restore-check` par mois).
22. Soumettre `https://<domaine>/sitemap.xml` dans Google Search Console ; créer la fiche Google Business.
23. Faire relire CGV, confidentialité, remboursement et cookies.
24. Commande test complète sur la version en ligne.

## Phase 7 — Ensuite ⏳
- Réinitialisation du mot de passe (SMS ou e-mail) et confirmation de l'inscription par e-mail : nécessite un service d'envoi.
- Paiement Wave automatique si Wave propose une API marchande adaptée.
- Pagination côté serveur du catalogue si celui-ci dépasse quelques centaines de produits.
- Contenu de confiance : vraie photo de l'équipe, témoignages détaillés, engagement de délai de réponse.
