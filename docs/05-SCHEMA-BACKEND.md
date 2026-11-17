# Schéma backend et connexion des utilisateurs

Source de vérité : `api/prisma/schema.prisma`. Toute modification passe par une nouvelle migration dans `api/prisma/migrations/`.

## Tables

### `Admin`
Compte de la propriétaire.
`id`, `email` (unique), `passwordHash`, `createdAt`, `updatedAt`.

### `Customer`
Compte client.
`id`, `name`, `phone` (unique, format `225` + 10 chiffres), `email` (unique, facultatif), `passwordHash`, `commune`, `address`, `deliveryZone`, `termsAcceptedAt` (date d'acceptation des CGV et de la confidentialité), `createdAt`, `updatedAt`.

### `Product`
`id`, `name`, `slug` (unique, utilisé dans les adresses), `category`, `description`, `size`, `priceXof` (vide = « prix à confirmer »), `imageUrl`, `gallery` (liste, 6 max), `badge` (`bestseller` | `new`), `stock`, `active`, dates.
Index : `(active, category)`.

### `Order`
`id`, `customerId` → `Customer` (mis à vide si le client est supprimé), `customerName`, `phone`, `commune`, `address`, `deliveryNote`, `status` (enum ci-dessous), `totalXof` (produits seuls), `deliveryZone`, `deliveryFeeXof` (vide = à confirmer), `paymentProofUrl`, `clientKey` (unique : anti double envoi), dates.
Index : `createdAt`, `(customerId, createdAt)`, `(status, createdAt)`.

Statuts (`OrderStatus`) : `pending`, `payment_review`, `confirmed`, `preparing`, `shipped`, `delivered`, `cancelled`.

### `OrderItem`
Ligne de commande, figée au moment de l'achat.
`id`, `orderId` → `Order` (suppression en cascade), `productId` → `Product` (suppression interdite : le produit est masqué à la place), `productName`, `productSize`, `unitPriceXof`, `quantity`.
Index : `orderId`, `productId`.

### `Review`
`id`, `authorName`, `city`, `productSlug`, `productName`, `rating` (1 à 5), `comment`, `published` (faux tant que la boutique n'a pas validé), `createdAt`.
Index : `(published, createdAt)`.

### `Image`
Photos produits et preuves de paiement, stockées en base.
`id`, `mime`, `data` (octets), `private` (vrai = preuve Wave, visible seulement par l'admin), `createdAt`.

### `StoreSettings`
Une seule ligne (`id = "store"`) : `whatsappNumber`, `deliveryCommunes`, `deliveryInfo`, `waveInstructions`, `waveNumber`, `deliveryZones` (JSON : `[{ name, feeXof, delay }]`), `legalInfo`, `storeAddress`, `updatedAt`.

## Relations

```
Customer 1 ──── * Order 1 ──── * OrderItem * ──── 1 Product
Review, Image, StoreSettings, Admin : indépendantes
```

## Règles métier garanties par la base et l'API

- Le stock ne devient jamais négatif : décrément conditionnel (`stock >= quantité`) dans la transaction de commande.
- Annuler une commande remet le stock ; la réactiver le reprend (refusé si le stock manque).
- Un produit déjà commandé ne peut pas être supprimé, seulement masqué.
- La suppression d'un compte anonymise ses commandes (nom, téléphone, adresse vidés) et supprime ses preuves de paiement.

## Connexion des utilisateurs

### Clients
1. Inscription : nom, téléphone, e-mail facultatif, mot de passe (8 caractères min.), acceptation des conditions → mot de passe haché avec bcrypt (coût 12).
2. Connexion par téléphone ou e-mail ; message d'erreur unique, quel que soit le champ faux ; 10 essais par 15 minutes.
3. Session : jeton JWT signé (`JWT_SECRET`) dans le cookie `ng_customer`, `httpOnly`, 30 jours. Le jeton contient une empreinte du mot de passe : en changer déconnecte les autres appareils.
4. Chaque route client (`/customer/*`, `/orders`) passe par `CustomerGuard`, qui recharge le client en base.

### Administration
- Cookie `ng_admin`, 8 heures, invalidé au changement de mot de passe (version = date de mise à jour du compte).
- 8 essais de connexion par 15 minutes ; mot de passe de 12 caractères minimum.
- Le compte est créé une fois avec `npm run prisma:seed-admin` (ne modifie jamais un compte existant).

### En production
`COOKIE_SECURE=true` : cookies `Secure` et `SameSite=None` (site et API sur des domaines différents), HTTPS obligatoire.
