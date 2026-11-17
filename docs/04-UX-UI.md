# UX/UI — Apparence et écrans

## Ambiance

Naturelle, élégante, simple. Inspiration « luxe naturel » : tons cacao et crème, vert profond et or, photos de terroir ouest-africain. Le site doit rester rapide et lisible sur un téléphone d'entrée de gamme.

## Couleurs (variables `--ng-*` dans `src/nature.css`)

| Rôle | Clair | Sombre |
| --- | --- | --- |
| Vert principal (boutons, liens) | `--ng-emerald` #0e4a35 | adapté au thème sombre |
| Or (accents) | `--ng-gold` #c59d4f | idem |
| Texte or lisible | `--ng-gold-text` #86672a | `--ng-gold-600` |
| Texte principal | `--ng-ink` #0f1d17 | clair |
| Texte secondaire | `--ng-muted` #5f6b66 | #8a9a92 |
| Vert WhatsApp (fond de bouton) | #167a45 | #167a45 |
| Texte vert WhatsApp | `--ng-wa-text` #167a45 | #3fbf77 |
| Cacao (bandeaux) | `--ng-cocoa` #4a2f1d | #e2c6a4 |

Tous les textes respectent un contraste d'au moins 4,5:1 (vérifié avec axe, normes WCAG AA, en clair et en sombre).

## Typographie

- Titres : **Fraunces** (à empattements).
- Texte : **Plus Jakarta Sans**.
- Les deux viennent de Google Fonts, sous licence libre SIL OFL : usage commercial autorisé.

## Composants

- **En-tête** : bandeau slogan, logo, recherche en direct, compte, aide, thème, panier ; menu de pages en dessous.
- **Barre d'onglets mobile** (fixe en bas) : Accueil, Boutique, Favoris, Panier, Compte. Elle tient lieu d'appel à l'action collant sur mobile.
- **Carte produit** : photo (2e photo au survol), pastille « Meilleure vente » ou « Nouveau », favori, rayon et contenance, nom, note, prix, bouton panier.
- **Rangée de produits** : défilement horizontal, flèches rondes au survol (ordinateur), glissé (téléphone), défilement automatique qui s'arrête au survol ou au toucher.
- **Fil d'Ariane** : liens réels, sous l'en-tête.
- **Boutons** : principal (vert plein), secondaire (contour), WhatsApp (vert WhatsApp), danger (rouge).
- **Formulaires** : libellés visibles, champs facultatifs signalés, erreurs sous le formulaire (`role="alert"`), boutons désactivés pendant l'envoi.
- **Toast** : message bref en bas de l'écran après une action.
- **Bouton WhatsApp flottant** (ordinateur).
- **Bandeau cookies** : seulement si la mesure d'audience est configurée ; « Refuser » et « Accepter » identiques.

## Écrans clés

- **Accueil** : pastilles de rayons, héros (slogan, « Découvrir la boutique », « Mon rituel IA »), « Commander, c'est simple » en 3 étapes, rayons, meilleures ventes (rangée), « Du cacao à votre soin », coffret mis en avant, bannières, tous les soins (rangée), avis, alerte nouveautés WhatsApp.
- **Boutique** : titre et nombre de produits, puces de rayons, tri. Vue « Tout » sans recherche : une rangée par rayon. Rayon, recherche ou tri : grille.
- **Fiche produit** : galerie, prix, stock, quantité, ajout au panier, WhatsApp, partage, bienfaits, utilisation, composition, avis, « Vous aimerez aussi ».
- **Panier** : tiroir latéral en 3 étapes (panier, coordonnées, confirmation).
- **Compte / Commandes** : cartes de formulaires ; suivi visuel en 5 étapes.
- **Contact** : cartes WhatsApp / Wave / Livraison, tableau des zones, carte et itinéraire, FAQ.

## Accessibilité

- Texte alternatif sur les photos porteuses de sens ; images décoratives ignorées par les lecteurs d'écran.
- Utilisable au clavier : lien « Aller au contenu », menus fermables avec Échap, recherche avec flèches et Entrée.
- Mode clair et sombre, animations réduites si le système le demande.
- Aucune page ne déborde en largeur de 320 à 768 px.
