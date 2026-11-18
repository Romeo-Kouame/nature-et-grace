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

- **Bandeau** (au-dessus de l'en-tête, non collant) : commande site ou WhatsApp, paiement Wave.
- **En-tête** (collant, une seule ligne, ombre légère au défilement) : logo · pages en pastilles (page active sur fond vert clair) · loupe, compte (avatar si connecté ; menu avec l'aide), thème, bouton « Panier » vert plein avec compteur doré. Recherche : panneau sous l'en-tête (loupe, touche `/` ou Ctrl+K, Échap pour fermer). Téléphone : menu, logo, conseillère IA, panier, recherche en dessous.
- **Barre d'onglets mobile** (fixe en bas) : Accueil, Boutique, Favoris, Panier, Compte. Elle tient lieu d'appel à l'action collant sur mobile.
- **Carte produit** : photo (2e photo au survol), pastille « Meilleure vente » ou « Nouveau », favori, rayon et contenance, nom, note, prix, bouton panier.
- **Rangée de produits** : défilement horizontal, flèches rondes au survol (ordinateur), glissé (téléphone), défilement automatique qui s'arrête au survol ou au toucher. Moins de 5 produits : grille pleine largeur sur ordinateur (cartes jusqu'à 380 px), glissé horizontal sur téléphone.
- **Carte produit (prix inconnu)** : « Prix sur demande », contenance masquée tant qu'elle vaut « À confirmer », bouton WhatsApp à la place du panier.
- **Photos produits** : traitement commun (légère désaturation, voile cacao en bas, filet fin) pour harmoniser des clichés pris dans des conditions différentes. À terme : photos refaites sur un même fond.
- **Nom de la marque** : toujours « Nature & Grâce » dans les textes (les majuscules restent réservées au logo).
- **Fil d'Ariane** : liens réels, sous l'en-tête.
- **Boutons** : principal (vert plein), secondaire (contour), WhatsApp (vert WhatsApp), danger (rouge).
- **Formulaires** : libellés visibles, champs facultatifs signalés, erreurs sous le formulaire (`role="alert"`), boutons désactivés pendant l'envoi.
- **Toast** : message bref en bas de l'écran après une action.
- **Chat de la conseillère IA** : bulle « Une question ? » en bas à droite (ordinateur) ; fenêtre de 400 × 640 px (plein écran sur téléphone), en-tête vert, bulles de la cliente en vert à droite, réponses en blanc à gauche, mini-cartes produits, questions suggérées, indicateur « écrit… ».
- **Bouton Google** (connexion) : contour, logo « G » officiel, séparateur « ou avec votre numéro ». **Captcha** Turnstile sous les champs.
- **Bandeau de promesses** (au-dessus du pied de page) : absent de l'accueil et des fiches produit, qui les affichent déjà.
- **Barre d'achat collante** (téléphone, fiche produit) : apparaît quand les boutons d'achat sortent de l'écran ; photo, nom, prix, « Ajouter » (ou WhatsApp si prix inconnu ou rupture), au-dessus de la barre d'onglets.
- **Bandeau cookies** : seulement si la mesure d'audience est configurée ; « Refuser » et « Accepter » identiques.

## Écrans clés

- **Accueil** : pastilles de rayons (téléphone uniquement ; la section « Nos rayons » est alors masquée), héros (slogan, « Découvrir la boutique », « Mon rituel IA »), « Commander, c'est simple » en 3 étapes (la 3e reprend la livraison), « Nos rayons » en grandes tuiles photo, meilleures ventes, « Du cacao à votre soin », coffret mis en avant, tous les soins (rangée), avis, alerte nouveautés WhatsApp. Retirés car répétitifs : puce « Paiement Wave » sur la photo, rangée de garanties sous le héros, bannières « Rituel cacao / Peau nette ».
- **Boutique** : titre et nombre de produits, puces de rayons, tri. Vue « Tout » sans recherche : grille unique tant que le catalogue a moins de 9 produits, puis une rangée par rayon (« Tout voir » seulement si le rayon a 5 produits ou plus). Rayon, recherche ou tri : grille.
- **Fiche produit** : galerie (vignettes si plusieurs photos ; sur ordinateur, trois cartes livraison / Wave / naturel sous la photo), prix, stock, quantité, ajout au panier, WhatsApp, partage, bienfaits, utilisation, composition, avis, « Vous aimerez aussi ».
- **Panier** : tiroir latéral en 3 étapes (panier, coordonnées, confirmation).
- **Connexion** (`/connexion`) : page autonome sur deux colonnes séparées par un filet. À gauche : retour à la boutique, logo, grand titre « Prenez soin de vous naturellement. » et montage de photos du terroir. À droite : champs arrondis, bouton vert plein « Se connecter », « Mot de passe oublié ? », séparateur, bouton contour « Créer un nouveau compte », rappel des conditions, aide WhatsApp. Sur téléphone, le titre passe au-dessus du formulaire et les photos sont masquées.
- **Compte / Commandes** : cartes de formulaires ; suivi visuel en 5 étapes.
- **Contact** : cartes WhatsApp / Wave / Livraison, tableau des zones, carte et itinéraire, FAQ.

## Accessibilité

- Texte alternatif sur les photos porteuses de sens ; images décoratives ignorées par les lecteurs d'écran.
- Utilisable au clavier : lien « Aller au contenu », menus fermables avec Échap, recherche avec flèches et Entrée.
- Mode clair et sombre, animations réduites si le système le demande.
- Aucune page ne déborde en largeur de 320 à 768 px.
