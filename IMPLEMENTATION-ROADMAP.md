# BTPLease Pro — Roadmap Implémentation

## Phase 1 : Fondations MVP (Semaines 1-4)

### Sprint 1.1 : Design System + Landing Page (Semaine 1)
- ✅ Palette couleurs + typo validées (Plus Jakarta Sans + Inter)
- ✅ Composants de base (buttons, cards, modals, inputs)
- ✅ Landing page marketing responsif
  - Hero avec image chantier + barre recherche
  - Stats (12k engins, 1.8k loueurs, 96% satisfaction)
  - Section « Comment ça marche » (3 étapes)
  - Témoignages clients, plans tarifaires, FAQ
  - CTA double « Créer compte » + « Parler à un expert »

### Sprint 1.2 : Search & Catalog (Semaine 2)
- ✅ Page recherche avec filtres
  - Catalogue unifié : engins BTP, terrains, logements, appartements et locaux
  - Recherche par mot-clé, secteur, catégorie et localisation (Mapbox)
  - Filtres latéraux : dates, budget, note min, disponibilité
  - Tri : pertinence, prix, rating
- ✅ Fiche engin détaillée
  - Photos, specs, prix jour/semaine/mois
  - Calendrier disponibilité, avis ★4.8+
  - CTA « Réserver maintenant »
- ✅ Fiche immobilière
  - Type de bien, ville, surface, caractéristiques, vente/location et unité de prix
  - Demande de visite ou d'informations avec référence privée de suivi
  - Aucun paiement, bail ou titre foncier validé automatiquement

### Sprint 1.3 : Réservation & Abonnement (Semaine 3)
- ✅ Tunnel réservation 4 étapes
  1. Sélection dates + lieu
  2. Choix options (chauffeur, assurance, livraison)
  3. Devis instantané + caution affichée
  4. Signature contrat PDF + paiement acompte 30% (mock)
- ✅ Système abonnement
  - Page pricing avec toggle annuel (-20%)
  - Modal choix plan + tunnel paiement (Stripe/Mobile Money mock)
  - localStorage pour état abonnement (essai 14j, dates renouvellement)

### Sprint 1.4 : Dashboard + Admin (Semaine 4)
- ✅ Dashboard loueur
  - Calendrier occupé/libre, revenus MRR, commissions
  - Annonces actives, avis reçus, messages
- ✅ Dashboard locataire
  - Historique réservations, factures, support
- ✅ Admin : validation annonces/KYC, litiges, stats MRR

**Données Seed** :
- 12 engins (CAT 320D, grue 20T, compacteur, groupe électro, etc.)
- 4 prestataires (conducteur, technicien, transporteur, topographe)
- 3 appels d'offres
- 3 plans abonnement

---

## Phase 2 : Intégrations Paiement & Services (Semaines 5-8)

### Sprint 2.1 : Paiements Réels (Semaine 5)
- Intégration Stripe (cartes, webhooks)
- Intégration FedaPay / CinetPay / Paystack (Mobile Money)
- Gestion escrow (autorisation, confirmation, remboursement)

### Sprint 2.2 : Prestations de Services (Semaine 6)
- Catalogue prestataires (conducteurs, techniciens, transporteurs)
- Profils vérifiés KYC + badges diplômes
- Devis sur demande, réservation service à l'heure/forfait

### Sprint 2.3 : Appels d'Offres (Semaine 7)
- Publication AO (titre, budget, délai, CCTP PDF)
- Réception offres chiffrées, comparatif côte-à-côte
- Attribution + bon de commande auto-généré

### Sprint 2.4 : Messagerie Temps Réel (Semaine 8)
- Chat WebSocket loueur/locataire
- Notifications SMS/WhatsApp/Email (Twilio, SendGrid mock)
- Historique messages persistant

---

## Phase 3 : Modules Avancés (Semaines 9-12)

### Sprint 3.1 : Maintenance & Carnet d'Entretien (Semaine 9)
- Historique maintenance par engin
- Alertes révision préventive (500h ou 12 mois)
- Checklist état des lieux (carburant, huile, freins, pneus)

### Sprint 3.2 : Assurance & Litiges (Semaine 10)
- Assurance optionnelle casse/vol (+8% prix)
- Workflow litige (photos, chat, médiation admin 24-48h)
- Restitution caution post-inspection

### Sprint 3.3 : Loyauté & Growth (Semaine 11)
- Programme parrainage (5k XOF / ami converti)
- Cashback 2% location ≥ 50k XOF
- Codes promo flash, remise saisonnière

### Sprint 3.4 : Mode Hors-Ligne + Analytics (Semaine 12)
- Service Worker : cache recherche, état des lieux offline
- Dashboards analytics (MRR, CAC, LTV, churn rate)
- Reports PDF mensuel/CSV export

---

## Phase 4 : Production & Déploiement (Semaines 13-16)

### Sprint 4.1 : Performance & Sécurité (Semaine 13)
- LCP <2s (lazy images, code splitting)
- RGPD : consentement, export données, droit oubli
- Rate limiting, RLS PostgreSQL, validation Zod

### Sprint 4.2 : Tests & QA (Semaine 14)
- E2E (Playwright) : recherche → réservation → paiement
- Unit tests (validation, calcul prix)
- Visual regression (Percy)

### Sprint 4.3 : Déploiement (Semaine 15)
- Vercel (front), Railway (back), GitHub Actions CI/CD
- Database PostgreSQL (Railway ou Vercel Postgres)
- DNS + SSL, monitoring Sentry

### Sprint 4.4 : Lancement Pilot (Semaine 16)
- Beta test 50 loueurs vérifiés
- Acquisition micro-influenceurs + WhatsApp
- Mesure conversion, retention, commission par catégorie

---

## Tech Stack Détail

| Couche | Tech |
|---|---|
| **Front** | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| **Gestion État** | Zustand ou Jotai (store panier, user, abonnement) |
| **Validation** | Zod (schémas) |
| **Formulaires** | React Hook Form |
| **Graphes** | Recharts (revenus, churn) |
| **Cartes** | Mapbox GL JS ou Leaflet + OpenStreetMap |
| **PDF** | PDFKit (contrats) + jsPDF (factures) |
| **Email** | Resend (templates React) |
| **Localisation** | next-intl (FR/EN) |
| **Back-End** | Node.js 18+ (Next.js API Routes ou Express separé) |
| **Database** | PostgreSQL + Prisma ORM |
| **Cache/Session** | Redis (panier, rateLimit) |
| **Upload** | S3 AWS ou Cloudinary (transform images) |
| **Queues Async** | Bull (Node-Redis) ou Bee-Queue |
| **Auth** | Firebase Auth ou Auth0 (OTP SMS, Google, Apple, 2FA) |
| **Paiements** | Stripe (webhook) + FedaPay/CinetPay (API) |
| **Real-Time** | Socket.io (chat WebSocket) |
| **Logs** | Winston ou Pino |
| **Erreurs** | Sentry |
| **Traces** | OpenTelemetry + Grafana |
| **Déploiement** | GitHub Actions → Vercel/Railway/Fly.io |

---

## Checklist Livraison MVP

### Fonctionnalité Core
- [ ] Catalogue immobilier et engins BTP avec filtres carte
- [ ] Fiche engin (photos, avis, prix)
- [ ] Annonces terrains, logements et locaux à louer/vendre
- [ ] Demandes de visite/informations immobilières
- [ ] Tunnel réservation 4 étapes
- [ ] Contrat PDF auto-généré
- [ ] Système abonnement (plans, gating)
- [ ] Paiement Stripe + Mobile Money (mock)
- [ ] Dashboard loueur (calendrier, revenus)
- [ ] Dashboard locataire (historique)
- [ ] Admin : validation annonces, litiges

### Données
- [ ] 12 engins seed (specs réalistes, images Unsplash)
- [ ] Annonces de démonstration de terrains, logements et locaux
- [ ] 4 prestataires (avec KYC mock)
- [ ] 3 appels d'offres
- [ ] 100+ avis clients

### Design
- [ ] Landing page (mobile + desktop)
- [ ] Design system (couleurs, typo, composants)
- [ ] Responsive (< 640px, 640-1024px, ≥ 1024px)
- [ ] Accessible (WCAG 2.1 AA minimum)

### Docs & Déploiement
- [ ] README + installation guide
- [ ] API docs (Swagger)
- [ ] Guide contribuables
- [ ] Deployed to Vercel + Railway
- [ ] Health check `/api/health`
- [ ] Sentry monitoring live

### Tests
- [ ] E2E : recherche → réserv → paiement (Playwright)
- [ ] Unit : calcul prix, validation formules
- [ ] Lighthouse score > 90 (perfo + SEO)

---

## KPIs Cibles (Après Lancement Pilot)

| Métrique | Cible |
|---|---|
| **Conversion** | 15-20% visitor → locataire payant |
| **CAC** (Cost Acquisition Customer) | < 2 000 XOF |
| **LTV** (Lifetime Value) | > 50 000 XOF |
| **Churn** | < 5% /mois |
| **MRR** | 2M+ XOF (après 6 mois) |
| **NPS** | > 50 |
| **Satisfaction** | > 95% |

---

## Risques & Mitigations

| Risque | Mitigation |
|---|---|
| Adoption loueurs faible | Onboarding white-glove (phone call), support dédié 1er mois |
| Fraude KYC | Liveness checks (facial recognition), partenaire vérification |
| Paiement échoué | Retry x3 avec backoff, email relance, support ticket |
| Litige non résolvable | Médiation tier-2 + remboursement garanti client |
| Maintenance engin mal déclarée | Engagement loueur, photo obligatoire état des lieux, assurance casse |

---

## Liens & Ressources

- **Design Kit** : Figma BTPLease Pro (TBD)
- **API Docs** : Swagger (http://localhost:3000/api-docs après déploiement)
- **Monitoring** : Sentry (https://sentry.io) + Grafana
- **Support** : hello@btpleasepro.com

---

**Créé** : 2026-10-01  
**Version** : 1.0  
**Status** : En cours de planification
