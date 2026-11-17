# Bonnes pratiques du projet

Ce fichier liste les règles à respecter sur ce projet. Avant de déclarer une fonctionnalité terminée, vérifie les sections concernées. Si une règle ne s'applique pas au projet (pas de paiement, pas de comptes utilisateurs, etc.), ignore-la. Si une règle ne peut pas être respectée, dis-le clairement au lieu de la sauter en silence.

---

## 1. Avant de coder : les 6 documents de référence

Ces documents doivent exister avant d'écrire du code. S'il en manque un, demande-le ou propose de le rédiger.

- [ ] **PRD (exigences produit)** : vue d'ensemble de l'idée et détail de chaque fonctionnalité, pour savoir exactement ce qu'on construit.
- [ ] **TRD (exigences techniques)** : choix techniques (stack, API utilisées, services tiers).
- [ ] **App Flow** : étapes de l'application, navigation et parcours utilisateur. Précise ce qui se passe après chaque action (clic sur un bouton, page affichée ensuite, etc.).
- [ ] **UX/UI** : apparence et ambiance (couleurs, typographie, composants, style) et aspect attendu de chaque écran.
- [ ] **Schéma backend** : organisation des données (tables, colonnes, relations) et fonctionnement de la connexion des utilisateurs.
- [ ] **Plan d'implémentation** : étapes de développement dans l'ordre exact, pour savoir par quoi commencer et comment avancer.

---

## 2. Sécurité

### Secrets et clés
- [ ] Les clés API sont dans le fichier `.env`, jamais dans le code.
- [ ] Le `.env` est dans le `.gitignore`.
- [ ] Aucune clé secrète dans le front-end : seule la clé publique va côté client.

### Authentification et comptes
- [ ] Les mots de passe sont hachés, jamais lisibles.
- [ ] Les sessions expirent.
- [ ] Confirmation par email à l'inscription.
- [ ] Rate limiting sur la page de connexion.
- [ ] Un seul message d'erreur générique à la connexion, que ce soit l'email ou le mot de passe qui est faux.

### Autorisations et base de données
- [ ] Les droits sont vérifiés côté serveur, jamais côté navigateur.
- [ ] La RLS (Row Level Security) est activée sur la base de données.
- [ ] Les entrées sont validées avant d'aller en base de données.

### Fichiers envoyés par les utilisateurs
- [ ] Taille maximum imposée.
- [ ] Type de fichier vérifié.

### Réseau et configuration
- [ ] HTTPS forcé partout.
- [ ] CORS configuré.
- [ ] Webhooks protégés par vérification de signature.
- [ ] Dépendances à jour.

### En production
- [ ] Les messages d'erreur détaillés sont coupés (rien de technique visible par le visiteur).
- [ ] Les `console.log` ne sont pas verbeux et n'affichent aucune donnée sensible.

---

## 3. Légal et conformité

### Pages obligatoires
- [ ] Mentions légales.
- [ ] Politique de confidentialité.
- [ ] Conditions générales (CGU / CGV).
- [ ] Politique de remboursement.
- [ ] Politique cookies.

### Cookies et consentement
- [ ] Bandeau cookies avec un bouton « Refuser » aussi visible que « Accepter ».
- [ ] Consentement vérifié sur les formulaires.

### Données personnelles
- [ ] Ne collecter que les données réellement nécessaires.
- [ ] Vérifier les outils tiers intégrés (quelles données ils collectent et où elles vont).
- [ ] Prévoir un moyen de demander la suppression de ses données.
- [ ] Demander l'accord des parents si des données de mineurs sont collectées.

### Emails
- [ ] Lien de désinscription dans chaque email.

### Droits d'utilisation
- [ ] Vérifier le droit d'utiliser les polices et les images.

---

## 4. Pratiques loyales

- [ ] Aucun piège qui force la main de l'utilisateur (dark patterns).
- [ ] Aucun frais caché.
- [ ] Aucun faux avis : uniquement de vrais avis clients.
- [ ] Aucune promesse qui ne peut pas être prouvée.

---

## 5. Robustesse et gestion des erreurs

### États de l'interface
- [ ] Afficher un message clair quand quelque chose plante.
- [ ] Afficher un indicateur de chargement plutôt qu'un écran blanc.
- [ ] Prévoir l'affichage des états vides (quand il n'y a rien à afficher).

### Pannes
- [ ] Gérer les requêtes qui échouent.
- [ ] Gérer les API qui ne répondent pas.

### Actions en double
- [ ] Empêcher le double-clic sur « Envoyer ».
- [ ] Empêcher le double paiement.

### Formulaires
- [ ] Validation des formulaires.
- [ ] Protection antispam.
- [ ] Page de remerciement après l'envoi d'un formulaire.

---

## 6. Performance et maîtrise des coûts

### Limites et plafonds
- [ ] Limiter le nombre de requêtes par visiteur.
- [ ] Plafonner les appels API.
- [ ] Plafonner les dépenses chez les fournisseurs d'API.

### Données
- [ ] Ne charger que les données affichées.
- [ ] Ajouter des index pour accélérer les recherches.
- [ ] Découper les longues listes en pages (pagination).
- [ ] Garder en mémoire ce qui ne change pas (cache).

### Fichiers et images
- [ ] Compresser les images.
- [ ] Compresser les fichiers envoyés.
- [ ] Limiter le poids des fichiers envoyés.

### Vitesse
- [ ] Vérifier la vitesse de chargement des pages.

---

## 7. Surveillance et sauvegardes

- [ ] Être alerté si le site tombe.
- [ ] Garder une trace de chaque erreur.
- [ ] Tester avec plusieurs visiteurs en même temps.
- [ ] Sauvegarde automatique de la base de données.
- [ ] Vérifier que la sauvegarde fonctionne (test de restauration).

---

## 8. SEO et bases techniques

### Balises et référencement
- [ ] Titre de page unique sur chaque page (meta title).
- [ ] Meta description sur chaque page.
- [ ] Sitemap généré.
- [ ] Fichier `robots.txt`.
- [ ] Liens internes entre les pages.
- [ ] Fil d'Ariane.
- [ ] Schéma LocalBusiness (données structurées Google Business).

### Présentation du site
- [ ] Favicon.
- [ ] Image de prévisualisation pour les réseaux sociaux.
- [ ] Site responsive.
- [ ] Page 404 personnalisée.
- [ ] Liens cassés réparés.

### Mesure
- [ ] Outil d'analytics en place (Google Analytics ou équivalent).

---

## 9. Accessibilité

- [ ] Texte alternatif (balise `alt`) sur toutes les images.
- [ ] Contraste des couleurs suffisant.
- [ ] Site utilisable entièrement au clavier.

---

## 10. Conversion et confiance

### Appels à l'action
- [ ] Un seul call to action principal, clair.
- [ ] CTA visible sans scroller.
- [ ] CTA sticky sur mobile.

### Preuves et réassurance
- [ ] Vrais avis clients.
- [ ] Section étude de cas.
- [ ] Vraie photo de l'équipe.
- [ ] Promesse de temps de réponse ou de livraison.
- [ ] FAQ.
- [ ] Google Maps avec itinéraire.
