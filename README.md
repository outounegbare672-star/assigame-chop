# BTPLease Pro

MVP web mobile-first réunissant l’immobilier et la location de matériel BTP dans un catalogue unique, en XOF. L’application utilise Node.js et SQLite, sans dépendance npm externe.

## Lancer l’application

Prérequis : Node.js 22.5 ou plus récent (le serveur utilise le module natif `node:sqlite`).

```sh
node server.mjs
```

Ouvrir ensuite <http://localhost:4173>. Le serveur crée automatiquement `data/assigame-chop.sqlite`, les équipements et les annonces immobilières de démonstration au premier démarrage.

## Fonctionnalités disponibles

- Catalogue commun pour terrains, logements, locaux commerciaux et matériel BTP.
- Filtres par secteur, catégorie, recherche textuelle, ville et budget.
- Filtres immobiliers distincts « À vendre » et « À louer ».
- Annonces immobilières de démonstration à vendre et à louer, avec photos de bâtiments, villas et terrains, prix, surface et caractéristiques.
- Photos de démonstration plus adaptées au matériel sur les cartes des 14 annonces BTP, dont les véhicules de chantier (camion benne et camion toupie).
- Fiche détaillée des biens avec photo, description, caractéristiques et accès direct à la demande de visite/informations.
- Demande de visite ou d’informations immobilières, enregistrée avec une référence privée de suivi.
- Demande de location d’engin avec dates, conducteur et livraison en option.
- Devis BTP calculé côté serveur : tarif × jours, options et caution indicative de 30 %.
- Détection transactionnelle des périodes qui se chevauchent pour un équipement; les demandes en attente expirent pour la disponibilité après 24 heures.
- Interface responsive en français, manifest PWA et données SQLite persistantes.
- Vérification de disponibilité du service avec `GET /api/health`.

Les données et photos d’illustration sont des exemples de démonstration, pas des annonces vérifiées. Les photos des annonces sont servies par Pexels et nécessitent une connexion Internet; remplacez-les par des images autorisées du bien ou du matériel réel avant publication.

## API

### `GET /api/listings`

Paramètres optionnels : `type` (`property` ou `equipment`), `search`, `category`, `city`, `maxPrice`.

```sh
curl "http://localhost:4173/api/listings?type=property&search=terrain&city=Lom%C3%A9"
```

Les éléments retournés indiquent leur type et leur unité de prix (`jour`, `mois` ou `le bien`).

### `POST /api/bookings`

Crée une demande de location pour un équipement :

```json
{
  "equipmentId": 1,
  "customer": { "name": "Afi Mensah", "email": "afi@example.com" },
  "startDate": "2026-11-10",
  "endDate": "2026-11-12",
  "withDriver": true,
  "withDelivery": false
}
```

Les dates sont inclusives. Une demande créée porte le statut `pending` et doit être confirmée par le responsable de l’annonce. La caution est indicative; aucun paiement n’est effectué.

### `POST /api/property-inquiries`

Crée une demande de visite ou d’informations pour une annonce immobilière :

```json
{
  "propertyId": 1,
  "customer": { "name": "Ama Kossi", "email": "ama@example.com" },
  "inquiryType": "visit",
  "preferredDate": "2026-11-20",
  "message": "Je souhaite visiter ce terrain."
}
```

`inquiryType` vaut `visit` ou `information`; la date et le message sont facultatifs. Une demande ne constitue ni une promesse de vente ni un contrat de location.

### Suivre une demande

- `GET /api/bookings/LOC-AAAAMMJJ-<référence privée>` pour une demande de matériel BTP.
- `GET /api/property-inquiries/IMMO-AAAAMMJJ-<référence privée>` pour une demande immobilière.

La référence donne accès au récapitulatif de la demande. Gardez-la confidentielle.

### `GET /api/health`

Retourne l’état de santé du serveur et de SQLite.

## Limites du MVP

L’application permet de parcourir les exemples et d’enregistrer des demandes; elle ne fournit pas encore de comptes annonceurs, de publication/modération d’annonces, de vérification juridique des titres, de contrats, de paiements, ni de validation ou de messagerie avec les annonceurs. Vérifiez directement le bien, le prix, les titres, les conditions et l’identité de l’annonceur avant tout engagement.

La spécification détaillée, le schéma cible et la feuille de route figurent dans [BTPLEASE-PRO-SPEC.md](./BTPLEASE-PRO-SPEC.md), [DATABASE-SCHEMA.md](./DATABASE-SCHEMA.md) et [IMPLEMENTATION-ROADMAP.md](./IMPLEMENTATION-ROADMAP.md). Ces documents décrivent une cible produit; toutes les tables du schéma ne sont pas encore utilisées par l’application.

## Déploiement Render

Le dépôt contient un blueprint Render qui démarre `node server.mjs` et surveille `/api/health`. Une instance éphémère/free ne garantit pas la conservation de SQLite après redéploiement ou mise en veille; un stockage persistant ou PostgreSQL est nécessaire avant d’enregistrer de vraies demandes.
