# ASSIGAME-CHOP

MVP web responsive d'une marketplace e-commerce multi-vendeurs, pensee mobile-first pour l'Afrique francophone.

## Demarrer

Le MVP se lance sans dependance externe avec `node server.mjs`, puis s'ouvre sur http://localhost:4173. `npm start` est aussi disponible si la politique PowerShell autorise `npm.ps1`.

## Deployer gratuitement sur Render

1. Pousser ce dossier dans un depot GitHub.
2. Se connecter sur [Render](https://dashboard.render.com) avec GitHub.
3. Choisir **New +** puis **Blueprint** et selectionner le depot.
4. Render detecte [render.yaml](render.yaml), puis creer le Web Service `assigame-chop` avec le plan `Free`.
5. Attendre le build et ouvrir l'URL `https://assigame-chop.onrender.com` affichee par Render.

Le blueprint configure le lancement Node et le health check `/api/health`. Le service gratuit peut se mettre en veille apres une periode d'inactivite, ce qui rend le premier chargement plus lent.

## Inclus dans le MVP

- Accueil marketplace avec recherche produit/boutique et filtres de categories
- Cartes produits, wishlist, notation, badges verification et panier multi-produits
- Decouverte de boutiques verifiees et premium
- Modal d'abonnement acheteur avec essai gratuit de 7 jours
- Navigation mobile bottom bar et layout responsive desktop/mobile
- Base PWA via [manifest.webmanifest](manifest.webmanifest)
- Persistance locale du panier, favoris, abonnement, commandes et boutique via `localStorage`
- Serveur Node minimal avec `GET /api/health` pour le lancement local

## Architecture cible production

- **Web** : Next.js App Router, TypeScript, Tailwind CSS, PWA
- **Mobile** : Flutter, partage des contrats API avec le web
- **API** : NestJS, REST + WebSockets pour chat et suivi de commande
- **Donnees** : PostgreSQL avec Prisma, Redis pour panier/session/queues
- **Fichiers** : S3 ou Cloudinary avec transformations d'images et videos
- **Auth** : Firebase Auth ou Auth0, OTP SMS, Google, Apple, 2FA vendeur/admin
- **Paiement** : Stripe pour cartes, CinetPay/FedaPay/Paystack pour Mobile Money
- **Observabilite** : Sentry, OpenTelemetry, logs structures et alertes metier

## Modele de donnees principal

```text
User (id, role, phone, email, status, locale)
SellerProfile (userId, kycStatus, rating, payoutAccount)
Store (id, sellerId, slug, name, category, location, verifiedAt)
Subscription (id, userId, kind, plan, status, trialEndsAt, renewsAt)
Product (id, storeId, title, media[], price, stock, variants, status)
Cart (id, buyerId) -> CartItem (productId, quantity)
Order (id, buyerId, total, paymentStatus, fulfillmentStatus, escrowStatus)
OrderItem (orderId, productId, sellerId, price, quantity)
Review (id, authorId, productId, storeId, rating, moderationStatus)
Dispute (id, orderId, openedBy, status, resolution)
Coupon (id, code, type, value, startsAt, endsAt, maxUses)
Notification (id, userId, channel, type, payload, readAt)
```

## Regles business critiques

1. Un vendeur doit avoir une souscription active pour publier un produit.
2. Un acheteur peut naviguer et sauvegarder des favoris sans abonnement, mais la commande est bloquee sans abonnement actif.
3. Le paiement est capture dans un escrow jusqu'a confirmation de livraison ou expiration de la fenetre de reclamation.
4. Les droits d'acces sont controles cote serveur, jamais uniquement dans l'interface.
5. Les webhooks de paiement sont idempotents et journalises.

## Roadmap

**V1 production** : comptes, KYC, creation boutique, CRUD produits/media, plans vendeur/acheteur, panier multi-boutiques, checkout Stripe + Mobile Money, commandes, escrow, notifications email/SMS, admin moderation.

**V2** : chat temps reel, avis avances, parrainage, cashback, promos flash, analytics vendeur, recommandations personnalisees, factures PDF, support et litiges.

**Lancement** : pilote dans une ville avec 50 boutiques verifiees, acquisition par micro-influenceurs et WhatsApp, commission mesuree par categorie, puis extension regionale apres validation du taux de conversion et de la retention abonnement.

## Note

Cette livraison est un MVP local executable. Le lien public permanent, les paiements, le KYC, l'escrow, les notifications et les roles admin doivent etre branches a un hebergeur, une base de donnees et des fournisseurs externes avant mise en production. Aucune cle secrete ne doit etre ajoutee au code source.
