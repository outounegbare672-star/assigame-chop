# BTPLease Pro — Schéma Base de Données

## Overview

Modèle de données pour plateforme marketplace location BTP.  
**DB** : PostgreSQL + Prisma ORM

---

## Tables Principales

### 1. `users`

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  password_hash VARCHAR(255),
  
  -- Profil
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  
  -- Rôle(s)
  roles TEXT[] DEFAULT '{"locataire"}', -- ['locataire', 'loueur', 'prestataire', 'admin']
  
  -- KYC
  kyc_status VARCHAR(50) DEFAULT 'pending', -- pending | verified | rejected
  kyc_document_url TEXT, -- CNI/RCCM
  kyc_selfie_url TEXT,
  kyc_verified_at TIMESTAMP,
  
  -- Stripe / Mobile Money
  stripe_customer_id VARCHAR(255),
  payment_method_id VARCHAR(255),
  
  -- Préférences
  locale VARCHAR(10) DEFAULT 'fr', -- fr | en
  currency VARCHAR(3) DEFAULT 'XOF', -- XOF | EUR | USD
  timezone VARCHAR(50) DEFAULT 'Africa/Lagos',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  last_login_at TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_kyc_status ON users(kyc_status);
```

---

### 2. `seller_profiles` (Loueurs)

```sql
CREATE TABLE seller_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Profil Loueur
  company_name VARCHAR(255),
  company_logo_url TEXT,
  bio TEXT, -- max 500 chars
  
  -- Vérifié + Certifications
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP,
  is_premium BOOLEAN DEFAULT false,
  
  -- Certificats
  certification_urls TEXT[], -- ['url1', 'url2']
  
  -- Métriques
  rating DECIMAL(3, 2) DEFAULT 0, -- 0.00 - 5.00
  total_reviews INTEGER DEFAULT 0,
  response_time_hours DECIMAL(5, 2), -- moyenne
  
  -- Géolocalisation
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address VARCHAR(255),
  city VARCHAR(100),
  country VARCHAR(100),
  
  -- Paiement Payout
  payout_account_type VARCHAR(50), -- bank | mobile_money
  payout_account_number VARCHAR(255),
  payout_account_holder VARCHAR(255),
  
  -- Statistiques
  total_listings INTEGER DEFAULT 0,
  total_earnings DECIMAL(15, 2) DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_seller_profiles_user_id ON seller_profiles(user_id);
CREATE INDEX idx_seller_profiles_verified ON seller_profiles(is_verified);
```

---

### 3. `listings` (Annonces Engins)

```sql
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES seller_profiles(id) ON DELETE CASCADE,
  
  -- Détails
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL, -- pelle | grue | compacteur | etc.
  sub_category VARCHAR(100),
  
  -- Specs Techniques
  brand VARCHAR(100), -- CAT, Komatsu, Volvo, etc.
  model VARCHAR(100),
  year_manufactured INTEGER,
  hours_km INTEGER, -- heures moteur ou kilométrage
  condition VARCHAR(50), -- excellent | good | fair | poor
  
  -- Localisation
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address VARCHAR(255),
  city VARCHAR(100),
  
  -- Pricing
  price_per_day DECIMAL(15, 2),
  price_per_week DECIMAL(15, 2),
  price_per_month DECIMAL(15, 2),
  currency VARCHAR(3) DEFAULT 'XOF',
  
  -- Dépôt Caution
  security_deposit DECIMAL(15, 2), -- 30% prix location environ
  insurance_per_day DECIMAL(10, 2), -- optionnel +8%
  
  -- Options
  available_with_driver BOOLEAN DEFAULT false,
  driver_cost_per_day DECIMAL(10, 2),
  available_with_delivery BOOLEAN DEFAULT false,
  delivery_cost DECIMAL(15, 2),
  
  -- Disponibilité
  available_from DATE,
  available_until DATE,
  is_available BOOLEAN DEFAULT true,
  availability_status VARCHAR(50) -- available | unavailable | maintenance
  
  -- Médias
  image_urls TEXT[], -- ['url1', 'url2', ...]
  video_url TEXT,
  
  -- Documents
  registration_doc_url TEXT, -- carte grise
  insurance_doc_url TEXT,
  inspection_report_url TEXT,
  
  -- Statistiques
  rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  total_earnings DECIMAL(15, 2) DEFAULT 0,
  
  -- Modération
  status VARCHAR(50) DEFAULT 'pending', -- pending | approved | rejected | removed
  rejection_reason TEXT,
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_listings_seller_id ON listings(seller_id);
CREATE INDEX idx_listings_category ON listings(category);
CREATE INDEX idx_listings_city ON listings(city);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_is_available ON listings(is_available);
```

---

### 4. `listings_availability` (Calendrier Disponibilités)

```sql
CREATE TABLE listings_availability (
  id BIGSERIAL PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  
  available_date DATE NOT NULL,
  is_available BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  UNIQUE(listing_id, available_date)
);

CREATE INDEX idx_listings_availability_listing_id ON listings_availability(listing_id);
CREATE INDEX idx_listings_availability_date ON listings_availability(available_date);
```

---

### 5. `bookings` (Réservations Location)

```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  listing_id UUID NOT NULL REFERENCES listings(id),
  renter_id UUID NOT NULL REFERENCES users(id),
  seller_id UUID NOT NULL REFERENCES seller_profiles(id),
  
  -- Dates
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count INTEGER, -- auto-calculé
  
  -- Pricing
  daily_rate DECIMAL(15, 2),
  total_price DECIMAL(15, 2),
  security_deposit DECIMAL(15, 2),
  insurance_total DECIMAL(15, 2) DEFAULT 0,
  delivery_cost DECIMAL(15, 2) DEFAULT 0,
  driver_cost DECIMAL(15, 2) DEFAULT 0,
  
  -- Réductions
  promo_code_id UUID REFERENCES promo_codes(id),
  discount_amount DECIMAL(15, 2) DEFAULT 0,
  
  final_price DECIMAL(15, 2), -- total_price + insurance + delivery + driver - discount
  
  -- Options
  with_driver BOOLEAN DEFAULT false,
  driver_id UUID REFERENCES users(id),
  with_delivery BOOLEAN DEFAULT false,
  delivery_location VARCHAR(255),
  
  -- Statuts
  status VARCHAR(50) DEFAULT 'pending', -- pending | confirmed | active | completed | cancelled | disputed
  payment_status VARCHAR(50) DEFAULT 'pending', -- pending | partial | paid
  
  -- Contrat
  contract_url TEXT, -- PDF signé électroniquement
  contract_signed_at TIMESTAMP,
  
  -- État des lieux
  state_of_entry_photos TEXT[], -- photos entrée
  state_of_exit_photos TEXT[], -- photos sortie
  state_of_exit_validated BOOLEAN DEFAULT false,
  
  -- Escrow
  escrow_release_at TIMESTAMP, -- 48h après fin ou date fin +30j max
  
  -- Tracking
  tracking_url TEXT, -- suivi GPS en temps réel
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_bookings_renter_id ON bookings(renter_id);
CREATE INDEX idx_bookings_seller_id ON bookings(seller_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_start_date ON bookings(start_date);
```

---

### 6. `services` (Prestations Service)

```sql
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES users(id),
  
  -- Détails
  title VARCHAR(255) NOT NULL, -- "Conducteur CAT 320D", "Maintenance hydraulique"
  description TEXT,
  service_type VARCHAR(100), -- driver | maintenance | transport | engineering
  
  -- Expertise
  certifications TEXT[], -- ['CACES', 'CAP', ...]
  specialties TEXT[], -- ['Pelle', 'Grue', ...]
  
  -- Pricing
  hourly_rate DECIMAL(10, 2),
  flat_fee DECIMAL(15, 2),
  pricing_type VARCHAR(50), -- hourly | flat | both
  
  -- Disponibilité
  available_from DATE,
  available_until DATE,
  availability_slots TEXT, -- JSON: [{"start": "08:00", "end": "17:00", "day": "monday"}, ...]
  
  -- Localisation
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  city VARCHAR(100),
  radius_km INTEGER DEFAULT 50, -- rayon intervention
  
  -- Statistiques
  rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_jobs INTEGER DEFAULT 0,
  total_earnings DECIMAL(15, 2) DEFAULT 0,
  
  -- KYC
  is_verified BOOLEAN DEFAULT false,
  
  status VARCHAR(50) DEFAULT 'active', -- active | inactive | paused
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_services_provider_id ON services(provider_id);
CREATE INDEX idx_services_city ON services(city);
```

---

### 7. `service_bookings` (Réservation Services)

```sql
CREATE TABLE service_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id),
  client_id UUID NOT NULL REFERENCES users(id),
  provider_id UUID NOT NULL REFERENCES users(id),
  
  -- Détails
  title VARCHAR(255),
  description TEXT,
  
  -- Date/Durée
  start_datetime TIMESTAMP NOT NULL,
  end_datetime TIMESTAMP NOT NULL,
  duration_hours DECIMAL(5, 2),
  
  -- Pricing
  rate DECIMAL(10, 2),
  total_cost DECIMAL(15, 2),
  
  -- Location
  location VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Statuts
  status VARCHAR(50) DEFAULT 'pending', -- pending | confirmed | active | completed | cancelled
  payment_status VARCHAR(50) DEFAULT 'pending',
  
  -- Facture
  invoice_url TEXT,
  invoice_sent_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_service_bookings_client_id ON service_bookings(client_id);
CREATE INDEX idx_service_bookings_provider_id ON service_bookings(provider_id);
```

---

### 8. `tenders` (Appels d'Offres)

```sql
CREATE TABLE tenders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  issuer_id UUID NOT NULL REFERENCES users(id), -- donneur d'ordre
  
  -- Détails
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  
  -- Budget & Délai
  estimated_budget DECIMAL(15, 2),
  budget_currency VARCHAR(3) DEFAULT 'XOF',
  deadline DATE NOT NULL,
  
  -- Documents
  attachment_urls TEXT[], -- CCTP, plans PDF
  
  -- Critères
  selection_criteria TEXT[], -- ['price', 'reference', 'certification']
  
  -- Localisation
  location VARCHAR(255),
  city VARCHAR(100),
  
  -- Statuts
  status VARCHAR(50) DEFAULT 'open', -- open | evaluating | closed | awarded
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  closed_at TIMESTAMP
);

CREATE INDEX idx_tenders_issuer_id ON tenders(issuer_id);
CREATE INDEX idx_tenders_status ON tenders(status);
CREATE INDEX idx_tenders_deadline ON tenders(deadline);
```

---

### 9. `bids` (Offres pour Appels d'Offres)

```sql
CREATE TABLE bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL REFERENCES users(id), -- loueur ou prestataire
  
  -- Offre
  title VARCHAR(255),
  description TEXT,
  proposed_price DECIMAL(15, 2),
  currency VARCHAR(3) DEFAULT 'XOF',
  delivery_days INTEGER,
  
  -- Documents
  proposal_doc_url TEXT,
  
  -- Statuts
  status VARCHAR(50) DEFAULT 'submitted', -- submitted | accepted | rejected | withdrawn
  accepted_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_bids_tender_id ON bids(tender_id);
CREATE INDEX idx_bids_bidder_id ON bids(bidder_id);
CREATE INDEX idx_bids_status ON bids(status);
```

---

### 10. `subscriptions` (Abonnements)

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Plan
  plan_type VARCHAR(50), -- discovery | loueur_essential | loueur_pro | enterprise | prestataire_plus
  billing_cycle VARCHAR(50), -- monthly | yearly
  
  -- Pricing
  amount_xof DECIMAL(15, 2),
  currency VARCHAR(3) DEFAULT 'XOF',
  
  -- Dates
  started_at TIMESTAMP DEFAULT now(),
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  
  -- Trial
  trial_ends_at TIMESTAMP,
  is_trial BOOLEAN DEFAULT true,
  
  -- Statuts
  status VARCHAR(50) DEFAULT 'active', -- active | trial | cancelled | expired | past_due
  
  -- Stripe
  stripe_subscription_id VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  cancelled_at TIMESTAMP
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

---

### 11. `invoices` (Factures)

```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  booking_id UUID REFERENCES bookings(id),
  service_booking_id UUID REFERENCES service_bookings(id),
  subscription_id UUID REFERENCES subscriptions(id),
  
  -- Émetteur
  issued_by_id UUID NOT NULL REFERENCES users(id),
  issued_to_id UUID NOT NULL REFERENCES users(id),
  
  -- Détails
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  issue_date DATE DEFAULT current_date,
  due_date DATE,
  
  -- Montants
  subtotal DECIMAL(15, 2),
  tax_amount DECIMAL(15, 2),
  discount_amount DECIMAL(15, 2) DEFAULT 0,
  total_amount DECIMAL(15, 2),
  currency VARCHAR(3) DEFAULT 'XOF',
  
  -- Items
  line_items JSONB, -- [{"description": "...", "quantity": 1, "unit_price": ..., "total": ...}]
  
  -- Statuts
  status VARCHAR(50) DEFAULT 'draft', -- draft | issued | paid | overdue | cancelled
  
  -- PDF
  document_url TEXT,
  
  -- Paiement
  paid_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_invoices_issued_by ON invoices(issued_by_id);
CREATE INDEX idx_invoices_issued_to ON invoices(issued_to_id);
CREATE INDEX idx_invoices_status ON invoices(status);
```

---

### 12. `reviews` (Avis)

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Cible (produit ou utilisateur)
  listing_id UUID REFERENCES listings(id),
  seller_id UUID REFERENCES seller_profiles(id),
  service_id UUID REFERENCES services(id),
  
  -- Auteur
  author_id UUID NOT NULL REFERENCES users(id),
  
  -- Contenu
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  comment TEXT,
  
  -- Médias
  photo_urls TEXT[], -- photos état lieux ou prestation
  
  -- Modération
  status VARCHAR(50) DEFAULT 'pending', -- pending | approved | rejected
  rejection_reason TEXT,
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  approved_at TIMESTAMP
);

CREATE INDEX idx_reviews_listing_id ON reviews(listing_id);
CREATE INDEX idx_reviews_seller_id ON reviews(seller_id);
CREATE INDEX idx_reviews_author_id ON reviews(author_id);
CREATE INDEX idx_reviews_status ON reviews(status);
```

---

### 13. `disputes` (Litiges)

```sql
CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  booking_id UUID REFERENCES bookings(id),
  service_booking_id UUID REFERENCES service_bookings(id),
  
  -- Parties
  opened_by_id UUID NOT NULL REFERENCES users(id),
  defendant_id UUID NOT NULL REFERENCES users(id),
  
  -- Détails
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Évidences
  evidence_urls TEXT[], -- photos, vidéo, chat excerpts
  
  -- Statuts
  status VARCHAR(50) DEFAULT 'open', -- open | investigating | resolved | refunded | closed
  
  -- Résolution
  resolution_notes TEXT,
  refund_amount DECIMAL(15, 2),
  resolved_by_id UUID REFERENCES users(id), -- admin
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  resolved_at TIMESTAMP
);

CREATE INDEX idx_disputes_opened_by_id ON disputes(opened_by_id);
CREATE INDEX idx_disputes_status ON disputes(status);
```

---

### 14. `promo_codes` (Codes Promo)

```sql
CREATE TABLE promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  
  -- Réductions
  discount_type VARCHAR(50), -- percentage | fixed
  discount_value DECIMAL(10, 2),
  max_uses INTEGER DEFAULT 100,
  current_uses INTEGER DEFAULT 0,
  
  -- Validité
  valid_from DATE,
  valid_until DATE,
  
  -- Restrictions
  min_order_value DECIMAL(15, 2) DEFAULT 0,
  applicable_categories TEXT[], -- ['pelle', 'grue']
  
  status VARCHAR(50) DEFAULT 'active', -- active | inactive | expired
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_codes_status ON promo_codes(status);
```

---

### 15. `notifications` (Notifications)

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Contenu
  type VARCHAR(100), -- booking_confirmed | payment_failed | review_posted | message | etc.
  title VARCHAR(255),
  message TEXT,
  related_url TEXT,
  
  -- Canaux
  send_email BOOLEAN DEFAULT true,
  send_sms BOOLEAN DEFAULT false,
  send_push BOOLEAN DEFAULT true,
  
  -- Statuts
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
```

---

### 16. `messages` (Messagerie Privée)

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  sender_id UUID NOT NULL REFERENCES users(id),
  recipient_id UUID NOT NULL REFERENCES users(id),
  
  -- Contexte (réservation ou appel d'offres)
  booking_id UUID REFERENCES bookings(id),
  tender_id UUID REFERENCES tenders(id),
  
  -- Contenu
  content TEXT NOT NULL,
  attachment_urls TEXT[],
  
  -- Statuts
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_messages_booking_id ON messages(booking_id);
```

---

### 17. `maintenance_logs` (Carnet d'Entretien)

```sql
CREATE TABLE maintenance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  
  -- Maintenance
  maintenance_type VARCHAR(100), -- oil_change | filter | inspection | repair
  description TEXT,
  service_provider VARCHAR(255),
  
  -- Dates
  maintenance_date DATE,
  next_due_date DATE,
  
  -- Coûts
  cost DECIMAL(15, 2),
  
  -- Documents
  receipt_url TEXT,
  report_url TEXT,
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_maintenance_logs_listing_id ON maintenance_logs(listing_id);
CREATE INDEX idx_maintenance_logs_next_due_date ON maintenance_logs(next_due_date);
```

---

## Prisma Schema

Correspondance Prisma :

```prisma
model User {
  id                    String                   @id @default(cuid())
  email                 String                   @unique
  phone                 String?
  passwordHash          String?
  firstName             String?
  lastName              String?
  avatarUrl             String?
  roles                 String[]                 @default(["locataire"])
  
  kycStatus             String                   @default("pending")
  kycDocumentUrl        String?
  kycSelfieUrl          String?
  kycVerifiedAt         DateTime?
  
  stripeCustomerId      String?
  paymentMethodId       String?
  
  locale                String                   @default("fr")
  currency              String                   @default("XOF")
  timezone              String                   @default("Africa/Lagos")
  
  sellerProfile         SellerProfile?
  services              Service[]
  bookings              Booking[]
  serviceBookings       ServiceBooking[]
  reviews               Review[]
  subscriptions         Subscription[]
  
  createdAt             DateTime                 @default(now())
  updatedAt             DateTime                 @updatedAt
  lastLoginAt           DateTime?
  deletedAt             DateTime?
}

// ... (see Prisma generated schema from above SQL)
```

---

## Relations Clés

```
User (1) ──→ (1) SellerProfile
User (1) ──→ (N) Listings
Listing (1) ──→ (N) Bookings
Booking (1) ──→ (N) Reviews
User (1) ──→ (N) Services
Service (1) ──→ (N) ServiceBookings
User (1) ──→ (N) Tenders
Tender (1) ──→ (N) Bids
User (1) ──→ (1) Subscription
Booking (1) ──→ (N) Invoices
Dispute (1) ──→ (1) Booking
```

---

## Extension : annonces immobilières

Le MVP SQLite ajoute `properties` et `property_inquiries` au catalogue BTP. Le modèle de production recommandé est séparé des annonces d'équipement : vente et location ont des unités de prix différentes, et une prise de contact immobilière n'est pas une réservation d'engin.

### `properties`

```sql
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id UUID NOT NULL REFERENCES users(id),
  slug VARCHAR(180) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  property_type VARCHAR(80) NOT NULL, -- land | house | apartment | commercial
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('rent', 'sale')),
  description TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  address VARCHAR(255),
  area_m2 INTEGER CHECK (area_m2 > 0),
  bedrooms INTEGER CHECK (bedrooms >= 0),
  price DECIMAL(15, 2) NOT NULL CHECK (price > 0),
  price_period VARCHAR(20) NOT NULL, -- month | property
  currency VARCHAR(3) NOT NULL DEFAULT 'XOF',
  image_url TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'pending', -- pending | published | unavailable | rejected
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_properties_city_type ON properties(city, property_type);
CREATE INDEX idx_properties_transaction_status ON properties(transaction_type, status);
```

### `property_inquiries`

```sql
CREATE TABLE property_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref VARCHAR(48) UNIQUE NOT NULL,
  property_id UUID NOT NULL REFERENCES properties(id),
  customer_name VARCHAR(120) NOT NULL,
  customer_email VARCHAR(254) NOT NULL,
  inquiry_type VARCHAR(20) NOT NULL CHECK (inquiry_type IN ('visit', 'information')),
  preferred_date DATE,
  message VARCHAR(1000) NOT NULL DEFAULT '',
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_property_inquiries_property ON property_inquiries(property_id, created_at);
```

`image_url` référence la photo d'illustration de l'annonce. Les demandes sont des prises de contact, pas des ventes ou contrats de bail. Les annonces réelles devront être modérées et accompagnées de procédures de vérification des annonceurs, des photos et des titres.

---

**Créé** : 2026-10-01  
**Status** : Final  
