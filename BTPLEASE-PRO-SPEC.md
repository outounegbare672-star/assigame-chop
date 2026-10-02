# BTPLease Pro — Spécification Produit SaaS

## 🎯 Vision & Objectifs

**Marketplace de projets BTP et immobiliers** — matériel, terrains, logements et locaux en Afrique de l'Ouest.

Connecte :
- **Clients** (entreprises BTP, artisans, particuliers et chercheurs de biens immobiliers)
- **Annonceurs de matériel BTP** (propriétaires d'engins/matériels)
- **Annonceurs immobiliers** (propriétaires, agences et gestionnaires de biens)
- **Prestataires de services** (conducteurs, techniciens, transporteurs)
- **Donneurs d'ordre** (appels d'offres)
- **Admin Plateforme** (validation KYC, modération, litiges, analytics)

Revenus : **abonnements récurrents** + **commissions sur transactions** + **services premium**.

Cible : **mobile-first** (70% smartphone chantier), français par défaut, devise **XOF / EUR / USD**, paiements **Mobile Money + Carte + Virement**.

---

## 📊 Personas & Rôles (Espaces Dédiés)

### 1. **Client** (BTP et immobilier)
- Recherche et compare les engins BTP, terrains, logements et locaux
- Réserve un équipement ou demande des informations/une visite immobilière
- Dashboard : historique réservations, factures, support, avis
- Plan : Découverte gratuit ou Premium

### 2. **Annonceur de matériel BTP** (Propriétaire d'engins)
- Publie parc d'engins, gère calendrier/disponibilités, prix, caution, livraison
- Contrats électroniques, suivi GPS chauffeur, maintenance préventive
- Plans : Essentiel (5 annonces, 14j essai), **Pro (illimité, -8% commission)**, Entreprise

### 3. **Annonceur immobilier** (Propriétaire, agence ou gestionnaire)
- Publie terrains, maisons, appartements et locaux à louer ou à vendre
- Renseigne le prix et son unité, la ville, la surface et les caractéristiques
- Reçoit les demandes d'information et de visite
- Vérifie l'identité des demandeurs et les documents des biens avant tout engagement

### 4. **Prestataire Service** (Conducteur, Technicien, Transporteur)
- Profil vérifié KYC avec diplômes/certifications, badge fiabilité
- Devis sur demande, réservation à l'heure/forfait, messagerie privée
- Dashboard : offres reçues, revenus, évaluations, disponibilité
- Plan : Prestataire Plus (4 900 XOF/mois, 0% commission 1er mois)

### 5. **Donneur d'Ordre** (Entreprise, Chef de Projet)
- Publie appels d'offres (titre, budget, délai, CCTP, plans PDF)
- Reçoit dossiers/offres chiffrées, messagerie privée, tableau comparatif
- Attribution rapide + génération bon de commande
- Dashboard : appels publiés, soumissions, économies réalisées

### 6. **Admin Plateforme**
- Validation KYC (CNI, RCCM), modération annonces, gestion litiges/remboursements
- Tableau de bord MRR, churn, commissions, analytics, CMS pages/tarifs/bannières
- Gestion codes promo, support tier-2

---

## 🏗️ Modules Fonctionnels Détaillés

### A. Catalogue & Recherche (Cœur)

**Catégories** :
- Engins lourds (pelles, bulldozers, grues, chargeurs)
- Compacteurs, Bétonnières, Échafaudages
- Groupes électrogènes, Outillage
- Véhicules chantier, Équipements sécurité EPI
- Coffrage, Topographie

**Fiche Produit Riche** :
- Photos multiples, vidéo, specs techniques, année, heures/km, localisation GPS
- Disponibilité temps réel (calendrier interactif)
- Prix /jour /semaine /mois, caution, options (avec/sans conducteur, livraison)
- Documents (carte grise, assurance, VGP, certificat de conformité)
- Avis client (min 4.5★ = badge "Vérifié")

**Recherche Avancée** :
- Mot-clé, catégorie, rayon km + carte interactive (Mapbox/Leaflet)
- Dates (calendrier sélection), budget min/max, note mini
- Filtres : « disponible maintenant », « avec chauffeur », « livraison incluse »
- Tri : pertinence, prix croissant/décroissant, rating, nouveauté

**Comparateur** : côte-à-côte max 3 annonces, export PDF

---

### A bis. Immobilier (Extension de la marketplace)

**Types de biens** :
- Terrains à louer ou à vendre
- Maisons, villas et appartements à louer ou à vendre
- Locaux commerciaux et professionnels à louer ou à vendre

**Annonce immobilière** :
- Type de bien, ville, description, surface et caractéristiques utiles (ex. nombre de chambres)
- Prix annoncé et unité explicite (par mois ou pour le bien)
- Statut location/vente, photos et documents soumis à vérification

**Recherche et prise de contact** :
- Catalogue immobilier intégré aux annonces de matériel BTP, avec filtres de secteur et catégorie
- Filtrage par mot-clé, ville et budget affiché
- Demande de visite avec date souhaitée facultative ou demande d'informations
- Référence privée permettant de suivre la demande
- Pas de vente, bail, paiement ou validation du titre foncier finalisé par le MVP

---

### B. Réservation & Location

**Tunnel 4 étapes** :
1. Sélection dates + lieu livraison
2. Choix options (chauffeur, assurance casse, livraison, équipement additionnel)
3. Devis instantané + détail caution
4. Paiement acompte 30% + signature contrat électronique (PDF)

**Contrat Électronique** :
- Auto-généré PDF + état des lieux entrée/sortie avec photos
- Checklist maintenance (inspirée ECOVERSE : carburant, huile, filtres, freins, pneus)
- QR code suivi, horaires exactes début/fin, kilométrage initial

**Calendrier & Disponibilités** :
- Vue mensuelle loueur, blocage auto anti double-réservation
- Prolongation en 1 clic, annulation flexible (7j gratuit, puis frais)

**Caution** :
- Pré-autorisation (30% prix location) restituée après inspection
- Restitution 48h après état des lieux validé par les deux parties

---

### C. Prestations de Services

**Catalogue Services** :
- Conduite d'engin (horaire, forfait, certification requise)
- Maintenance/Réparation (vidange, révision, diagnostic panne)
- Transport exceptionnel (remorquage, logistique chantier)
- Étude technique (topographie, plan aménagement, devis)

**Profils Prestataires** :
- Vérifiés KYC (CNI, RCCM valide)
- Diplômes/certifications visibles (CACES, CAP, diplôme technique)
- Badge fiabilité (basé avis), taux réponse instantanée
- Tarif horaire/forfait flexible

**Réservation Service** :
- Devis sur demande, messagerie privée avec prestataire
- Calendrier dispo, facturation après prestation validée

---

### D. Appels d'Offres

**Publication** :
- Titre, description, lot, budget estimé, délai livraison
- Documents (CCTP, plans PDF, termes de référence)
- Critères (prix, délai, référence client, certification)

**Réponses** :
- Dépôt dossier chiffré (format libre)
- Messagerie privée → clarifications → révision prix
- Tableau comparatif côte-à-côte pour donneur d'ordre

**Attribution** :
- Notification winners/losers, génération bon de commande
- Paiement acompte (30%), solde à livraison

---

### E. Modules Transversaux (Obligatoires)

**Livraison & Logistique** :
- Calcul frais selon distance + poids engin
- Suivi GPS temps réel chauffeur, notification client

**Assurance & Sécurité** :
- Assurance casse/vol intégrée (optionnel, +8% prix)
- Dépôt litige (photos, vidéo, chat), médiation admin 24-48h

**Maintenance & Carnet d'Entretien** :
- Historique par engin (revision, panne, durée vie)
- Alertes révision préventive (tous les 500h ou 12 mois)
- Diagnostics partagés entre loueur et prestataires

**Marketplace Pièces & Occasion** :
- Vente pièces détachées partenaires
- Engins d'occasion avec historique complet

**Avis & Confiance** :
- Double notation (locataire note loueur, loueur note locataire)
- Commentaires modérés (interdit hors-sujet, insultes)
- Score fiabilité = (nb avis positifs / nb total) × 100

**Messagerie Temps Réel** :
- Chat direct loueur/locataire, prestataire/client
- Notifications SMS/WhatsApp/Email/Push (configurable)

**Facturation** :
- Devis auto-générés (PDF, Mail), factures TVA
- Reçus, exports comptables CSV (pour compta vendeur)

**Programme Fidélité** :
- Parrainage : 5 000 XOF pour chaque ami converti
- Cashback 2% par location ≥ 50 000 XOF
- Codes promo flash (7j), remise saisonnière (été BTP)

**Centre d'Aide** :
- FAQ par rôle (loueur, locataire, prestataire)
- Chatbot IA pour triage automatique support
- Support ticket 24/7, SLA 24h réponse

**Mode Hors-Ligne Partiel** :
- Cache recherche (10 dernières requêtes)
- Cache état des lieux + photos (téléchargement)
- Synchronisation auto au retour réseau

**Admin & Back-Office** :
- Validation annonces (contenu, images spammées)
- KYC workflow (CNI/RCCM/selfie)
- Tableau litiges, remboursements, stats MRR/churn
- CMS pages (tarifs, bannières), gestion codes promo

---

## 💳 Système d'Abonnement (Obligatoire)

Implémentation **type Stripe Billing** (simulable en localStorage) :

| Plan | Cible | Prix XOF/mois | Annuel | Fonctionnalités | Commission |
|---|---|---|---|---|---|
| **Découverte** | Locataire occasionnel | 0 | 0 | Recherche, 1 réserv/mois, support std | 12% |
| **Loueur Essentiel** | Petit loueur (≤5 engins) | 9 900 | 7 920 | 5 annonces, calendrier, stats base, 14j essai | 8% |
| **Loueur Pro ⭐** | Flotte moyenne | 24 900 | 19 920 | Annonces illim, badge Pro, devis auto, support prioritaire | 5% |
| **Entreprise/Fleet** | Grands groupes | 59 900 | 47 920 | Multi-agences, rôles équipe, API, appels d'offres illim, account manager | 3% |
| **Prestataire Plus** | Artisans/techniciens | 4 900 | 3 920 | Profil premium, réponses prioritaires, 0% commission services 1er mois | 0% (1 mois) |

**Exigences Abonnement** :

- Page **Pricing** : toggle Mensuel/Annuel, comparateur, CTA, FAQ
- Tunnel : choix plan → résumé → paiement (carte + Mobile Money mock) → facture → activation immédiate + email
- Gestion : upgrade/downgrade/annulation, essai gratuit 14j, prorata, relances impayés
- Gating : si quota dépassé → paywall élégant avec upsell (jamais page blanche)
- Admin : MRR, churn rate, taux conversion, liste abonnés

---

## 🎨 Design — Professionnel & Esthétique (Priorité Haute)

**Style** : « BTP Premium Confiance » — robuste mais épuré, inspiré Airbnb Pro + Caterpillar + Linear.

**Palette Couleurs** :
- Noir charbon : `#111827` (header)
- Jaune sécurité : `#F59E0B` / `#FFB800` (CTA, badges)
- Vert validation : `#16A34A` (disponible, action positive)
- Gris chantier : `#F3F4F6` (fonds)
- Blanc : `#FFFFFF` (panneaux)
- Contraste AA minimum (WCAG 2.1)

**Typographie** :
- Titres : « Plus Jakarta Sans » ou « Sora » bold (taille clamp)
- Texte : « Inter » 400/500/700 (généreux whitespace)

**Composants** :
- Cards engins : photo + badge dispo + prix + note ★4.8
- Navbar sticky + recherche hero avec carte interactive
- Filtres latéraux collapse/expand
- Stepper réservation (étape 1→2→3→4)
- Dashboard sidebar + KPI cards + graphiques Recharts
- Tableaux premium (tri, filtres, pagination)
- Badges vérifiés (checkmark doré), skeleton loaders, empty states illustrés
- Toasts notifications (succès vert, erreur rouge)

**Micro-Interactions** :
- Hover lift (+1px translateY), transitions .2s ease
- Animations Framer-Motion sobres (scale, fade)

**Landing Page Marketing** :
- Hero : image chantier + barre recherche (CTA primaire)
- Logos clients certifiés (CAT, Komatsu, Volvo)
- Stats (12k+ engins, 1.8k loueurs, 96% satisfaction)
- « Comment ça marche » : 3 étapes illustrées (Recherche → Réserve → Livre)
- Top catégories (grille 4 colonnes)
- Témoignages 3 clients (notes ★5, guillemets)
- Plans tarifaires (toggle annuel), FAQ, CTA double, Footer complet

**Responsive** :
- Mobile (< 640px) : bottom nav, stack 1 colonne
- Tablette (640-1024px) : 2 colonnes
- Desktop (≥ 1024px) : 4 colonnes, layout full width

**Mode Sombre** : bonus pour dashboards (toggle haut-droit)

**Images** :
- Unsplash : pelle, grue, chantier Afrique (libres)
- Placeholders propres (pas de lorem ipsum : « Pelle CAT 320D, Lomé »)
- Optimisation : format webp, lazy loading

---

## 🔧 Architecture Technique Cible

**Front-End** :
- Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- Gestion état : Zustand ou Jotai
- Validation : Zod
- Formulaires : React Hook Form
- Graphes : Recharts
- Cartes : Mapbox GL JS ou Leaflet
- PDF : PDFKit (côté client/serveur)
- Email : Resend (templates)
- Localisation : next-intl (FR/EN)

**Back-End** :
- Node.js 18+ (ou Deno/Bun future)
- API REST + WebSockets (Socket.io) pour chat temps réel
- Base données : PostgreSQL + Prisma ORM
- Cache/Session : Redis (panier, rateLimit)
- Upload fichiers : S3 (AWS) ou Cloudinary (images/vidéos transformées)
- Queues : Bull (Node-Redis) pour jobs async (emails, PDFs, KYC)
- Auth : Firebase Auth ou Auth0 (OTP SMS, Google, Apple, 2FA)
- Paiements : Stripe (cartes) + FedaPay/CinetPay/Paystack (Mobile Money)

**Observabilité** :
- Sentry (errors), OpenTelemetry (traces)
- Logs structurés (Winston/Pino), dashboards Grafana
- Alertes métier (paiement échoué, KYC rejeté, litige ouvert)

**Déploiement** :
- Vercel (front Next.js), Railway/Fly.io/Render (back API)
- GitHub Actions CI/CD, semantic-release versioning
- Database : Railway PostgreSQL ou Vercel Postgres

**Données de Démo** :
- 12 engins réalistes (pelle CAT 320D 85k XOF/j, grue 20T 150k XOF/j, etc.)
- 4 prestataires vérifiés (conducteur, technicien, transporteur, topographe)
- 3 appels d'offres BTP (terrassement, bâtiment, route)
- 3 plans abonnement + utilisateurs seed (loueur, locataire, admin)

**Performance** :
- LCP <2s (lazy images, code splitting)
- SEO : meta tags, sitemap.xml, robots.txt, schema.org
- Pagination (20 items/page)
- Service Worker offline-first (recherche cache)

**Sécurité** :
- Auth JWT + refresh tokens, RBAC serverside
- Validation Zod côté client + serveur
- RLS PostgreSQL (Row-Level Security)
- Sanitization uploads (extension blanche, antivirus)
- RGPD : consentement, export données, droit oubli
- Rate limiting API (100 req/min par IP)
- CORS configuré, CSP headers

---

## 📄 Pages / Écrans (Minimum)

```
/                           Landing page marketing
/recherche                  Catalogue + filtres
/engin/[id]                 Fiche détail engin + réservation
/reservation/[id]           Tunnel réservation 4 étapes
/services                   Catalogue prestataires
/prestataire/[id]           Fiche profil + devis
/appels-offres              Liste appels d'offres publiés
/appel-offre/[id]           Détail AO + dépôt offre + comparatif
/publier-engin              Formulaire création annonce
/publier-service            Formulaire création prestation
/dashboard/                 Overview KPI + stats perso
/dashboard/calendrier       Calendrier disponibilités loueur
/dashboard/reservations     Historique réservations locataire
/dashboard/revenus          Graphes revenus loueur (MRR, CAC, LTV)
/dashboard/parc             Gestion engins/annonces
/dashboard/abonnement       Gestion plan + facturation
/dashboard/messages         Messagerie privée
/dashboard/avis             Avis reçus + note fiabilité
/dashboard/parametres       Profil, KYC, paiement
/pricing                    Plans tarifaires + toggle annuel/mensuel
/checkout                   Page récap + paiement abonnement
/commande/[ref]             Confirmation + facture order
/auth/login                 Connexion email/Google/OTP
/auth/signup                Inscription par rôle
/auth/kyc                   Upload CNI/RCCM/selfie
/admin/                     Dashboard admin (stats, users, litiges)
/admin/validation           Queue validation annonces/KYC
/admin/litiges              Gestion disputes, remboursements
```

---

## ✅ Livrables Attendus (V1)

1. **Arborescence + schéma BDD**
   - Tables : users, sellers, listings, bookings, services, tenders, bids, subscriptions, invoices, reviews, disputes, notifications

2. **Design System**
   - Palette couleurs, typo (Plus Jakarta Sans + Inter)
   - Composants réutilisables (buttons, cards, modals, forms)
   - Spacing scale (4px, 8px, 16px, 24px, 32px, 48px)

3. **Code Fonctionnel (Parcours Critiques)**
   - ✅ Recherche + filtres (map interactive)
   - ✅ Fiche engin + avis
   - ✅ Tunnel réservation 4 étapes
   - ✅ Système abonnement (toggle annuel, gating)
   - ✅ Paiement (Stripe mock + Mobile Money mock)
   - ✅ Dashboard loueur (calendrier, revenus)
   - ✅ Contrats PDF auto-générés

4. **Données de Démo**
   - Seed 12 engins, 4 prestataires, 3 appels d'offres, 50 annonces
   - Images Unsplash réelles, prix XOF réalistes

5. **Documentation**
   - README installation + déploiement
   - API docs (Swagger/OpenAPI)
   - Guide contribuables

6. **Tests & Validation**
   - E2E (Playwright) : recherche → réservation → paiement
   - Unit tests services critiques (calcul prix, validation KYC)
   - Visual regression (Percy)

---

## 🗺️ Roadmap V2 (Futur)

- **Mobile** : Flutter app (partage API avec web)
- **IoT** : capteurs heures moteur, maintenance préventive IA
- **Scoring crédit** : prêt equipment pour petits loueurs
- **Assurance** : intégration courtier (casse, vol, RC)
- **Chat IA** : chatbot supportAgent (FAQ, recommandations, triage)
- **Marketplace pièces** : vente spare parts, service après-vente
- **Factorage** : financement factures loueurs
- **Fractionné** : partage coût location entre petits chantiers

---

## 🎯 Règles Business Critiques

1. Un loueur doit avoir un abonnement **actif** pour publier une annonce.
2. Un locataire peut rechercher/sauvegarder favoris sans abonnement, mais réservation **bloquée sans plan actif**.
3. Paiement capturé en **escrow** jusqu'à confirmation livraison ou expiration fenêtre réclamation (30j).
4. **Contrôle d'accès côté serveur** (jamais UI-only), vérification rôle + permissions.
5. Webhooks paiement **idempotents** et journalisés.
6. **Caution** : pré-autorisée 30% (non débité si annulation < 7j), restituée 48h après inspection.
7. Commissions déduites à chaque paiement locataire, virées loueur 48h.
8. **KYC obligatoire** avant 1ère annonce loueur (CNI + RCCM valides).

---

## 🚀 Constraints & Conseils

✅ Code propre, commenté en français, modulaire  
✅ Pas de données fictives absurdes (prix XOF réalistes)  
✅ Tout bouton doit agir (ou toast « Bientôt disponible »)  
✅ Gestion erreurs robuste (fetch fail → retry + toast)  
✅ Empty states illustrés (« Aucune réservation » → icône + CTA)  
✅ Mobile-first design responsive

---

## 📞 Support

Plateforme : **BTPLease Pro**  
Contact : `hello@btpleasepro.com`  
Régions : Lomé • Abidjan • Dakar • Ouagadougou • Yaoundé
