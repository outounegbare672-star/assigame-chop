import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || 4173);
const dataDirectory = join(root, 'data');
await mkdir(dataDirectory, { recursive: true });
const databasePath = process.env.DATABASE_PATH || join(dataDirectory, 'assigame-chop.sqlite');
await mkdir(dirname(databasePath), { recursive: true });
const database = new DatabaseSync(databasePath);
const types = { '.html': 'text/html; charset=utf-8', '.webmanifest': 'application/manifest+json; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };

database.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    sku TEXT UNIQUE,
    price REAL NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    image_url TEXT,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY,
    ref TEXT UNIQUE NOT NULL,
    customer_name TEXT,
    customer_email TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    total REAL NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    shipped_at TEXT
  );
  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    product_id INTEGER REFERENCES products(id),
    product_name TEXT,
    unit_price REAL NOT NULL,
    quantity INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
  CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
  CREATE TABLE IF NOT EXISTS equipment (
    id INTEGER PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    city TEXT NOT NULL,
    daily_rate INTEGER NOT NULL CHECK (daily_rate > 0),
    rating REAL NOT NULL DEFAULT 0,
    description TEXT NOT NULL,
    daily_driver_rate INTEGER NOT NULL DEFAULT 0,
    delivery_fee INTEGER NOT NULL DEFAULT 0,
    image_url TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS rental_bookings (
    id INTEGER PRIMARY KEY,
    ref TEXT UNIQUE NOT NULL,
    equipment_id INTEGER NOT NULL REFERENCES equipment(id),
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    days_count INTEGER NOT NULL,
    with_driver INTEGER NOT NULL DEFAULT 0,
    with_delivery INTEGER NOT NULL DEFAULT 0,
    rental_total INTEGER NOT NULL,
    security_deposit INTEGER NOT NULL,
    total_amount INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_rental_bookings_equipment_dates
    ON rental_bookings(equipment_id, start_date, end_date, status);
  CREATE INDEX IF NOT EXISTS idx_rental_bookings_email
    ON rental_bookings(customer_email, created_at);
  CREATE TABLE IF NOT EXISTS properties (
    id INTEGER PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    property_type TEXT NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('rent', 'sale')),
    city TEXT NOT NULL,
    price INTEGER NOT NULL CHECK (price > 0),
    price_unit TEXT NOT NULL,
    area_m2 INTEGER,
    bedrooms INTEGER,
    rating REAL NOT NULL DEFAULT 0,
    description TEXT NOT NULL,
    image_url TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS property_inquiries (
    id INTEGER PRIMARY KEY,
    ref TEXT UNIQUE NOT NULL,
    property_id INTEGER NOT NULL REFERENCES properties(id),
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    inquiry_type TEXT NOT NULL CHECK (inquiry_type IN ('visit', 'information')),
    preferred_date TEXT,
    message TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_property_inquiries_property
    ON property_inquiries(property_id, created_at);
`);

const propertyColumns = database.prepare('PRAGMA table_info(properties)').all();
if (!propertyColumns.some(column => column.name === 'image_url')) {
  database.exec('ALTER TABLE properties ADD COLUMN image_url TEXT');
}
const equipmentColumns = database.prepare('PRAGMA table_info(equipment)').all();
if (!equipmentColumns.some(column => column.name === 'image_url')) {
  database.exec('ALTER TABLE equipment ADD COLUMN image_url TEXT');
}

const seedEquipment = [
  ['pelle-cat-320d', 'Pelle hydraulique CAT 320D', 'Engins lourds', 'Lomé', 85000, 4.9, 'Pelle hydraulique adaptée aux travaux de terrassement et d’excavation.', 25000, 45000, 'https://images.pexels.com/photos/34891691/pexels-photo-34891691/free-photo-of-heavy-excavator-at-construction-site.jpeg?auto=compress&w=1200'],
  ['compacteur-wacker', 'Compacteur vibrant Wacker', 'Compacteurs', 'Accra', 42000, 4.8, 'Compacteur pour travaux routiers et préparation de plateforme.', 12000, 25000, 'https://images.pexels.com/photos/4390530/pexels-photo-4390530.jpeg?auto=compress&w=1200'],
  ['grue-mobile-20t', 'Grue mobile 20 tonnes', 'Grues', 'Abidjan', 150000, 5.0, 'Grue mobile pour levage sur chantier, opérateur disponible en option.', 40000, 80000, 'https://images.pexels.com/photos/35693092/pexels-photo-35693092.jpeg?auto=compress&w=1200'],
  ['groupe-electrogene-150kva', 'Groupe électrogène 150 kVA', 'Énergie', 'Ouagadougou', 67000, 4.7, 'Groupe électrogène pour alimentation temporaire de chantier.', 0, 20000, 'https://images.pexels.com/photos/5693845/pexels-photo-5693845.jpeg?auto=compress&w=1200'],
  ['betonniere-electrique', 'Bétonnière électrique', 'Bétonnières', 'Lomé', 28500, 4.6, 'Bétonnière électrique pour préparation de béton sur site.', 0, 12000, 'https://images.pexels.com/photos/19665533/pexels-photo-19665533/free-photo-of-concrete-mixer-at-construction-site.jpeg?auto=compress&w=1200'],
  ['echafaudage-aluminium', 'Échafaudage aluminium 50 m²', 'Échafaudages', 'Yaoundé', 35000, 4.8, 'Échafaudage modulaire avec éléments de sécurité.', 0, 18000, 'https://images.pexels.com/photos/33998580/pexels-photo-33998580/free-photo-of-intricate-scaffolding-on-urban-construction-site.jpeg?auto=compress&w=1200'],
  ['bulldozer-cat-d6t', 'Bulldozer CAT D6T', 'Engins lourds', 'Bamako', 125000, 4.9, 'Bulldozer pour nivellement et déplacement de matériaux.', 35000, 65000, 'https://images.pexels.com/photos/27453062/pexels-photo-27453062.jpeg?auto=compress&w=1200'],
  ['chargeur-komatsu', 'Chargeur frontal Komatsu', 'Engins lourds', 'Douala', 78000, 4.7, 'Chargeur frontal polyvalent pour manutention et chargement.', 22000, 40000, 'https://images.pexels.com/photos/33321431/pexels-photo-33321431.jpeg?auto=compress&w=1200'],
  ['epi-chantier', 'Équipements de protection (EPI)', 'Sécurité', 'Lomé', 15000, 4.9, 'Lot d’équipements de protection individuelle pour chantier.', 0, 8000, 'https://images.pexels.com/photos/8487719/pexels-photo-8487719.jpeg?auto=compress&w=1200'],
  ['coffrage-modulaire', 'Kit de coffrage modulaire', 'Coffrage', 'Abidjan', 22000, 4.8, 'Éléments de coffrage réutilisables pour travaux de béton.', 0, 15000, 'https://images.pexels.com/photos/37121406/pexels-photo-37121406/free-photo-of-construction-workers-pouring-concrete-on-job-site.jpeg?auto=compress&w=1200'],
  ['niveau-laser', 'Niveau laser de topographie', 'Topographie', 'Ouagadougou', 18500, 5.0, 'Niveau laser professionnel pour alignement et nivellement.', 0, 8000, 'https://images.pexels.com/photos/13279686/pexels-photo-13279686.jpeg?auto=compress&w=1200'],
  ['compresseur-100l', 'Compresseur portable 100 L', 'Outillage', 'Yaoundé', 12500, 4.7, 'Compresseur portable avec flexible pour outillage pneumatique.', 0, 8000, 'https://images.pexels.com/photos/20114436/pexels-photo-20114436.jpeg?auto=compress&w=1200'],
  ['camion-benne-10t', 'Camion benne de chantier 10 tonnes', 'Véhicules chantier', 'Cotonou', 65000, 4.7, 'Camion benne pour le transport et l’évacuation de matériaux sur chantier.', 18000, 45000, 'https://images.pexels.com/photos/14475776/pexels-photo-14475776.jpeg?auto=compress&w=1200'],
  ['camion-toupie-8m3', 'Camion toupie béton 8 m³', 'Véhicules chantier', 'Abidjan', 95000, 4.8, 'Camion malaxeur pour acheminer et couler le béton prêt à l’emploi.', 25000, 55000, 'https://images.pexels.com/photos/34281022/pexels-photo-34281022.jpeg?auto=compress&w=1200']
];
const insertEquipment = database.prepare(`
  INSERT OR IGNORE INTO equipment
    (slug, name, category, city, daily_rate, rating, description, daily_driver_rate, delivery_fee, image_url)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
for (const item of seedEquipment) insertEquipment.run(...item);
const previousEquipmentImages = {
  'bulldozer-cat-d6t': 'https://images.pexels.com/photos/18812420/pexels-photo-18812420/free-photo-of-yellow-bulldozer-over-soil.jpeg?auto=compress&w=1200',
  'grue-mobile-20t': 'https://images.pexels.com/photos/38520017/pexels-photo-38520017/free-photo-of-tower-crane-against-clear-sky.jpeg?auto=compress&w=1200',
  'chargeur-komatsu': 'https://images.pexels.com/photos/32021897/pexels-photo-32021897/free-photo-of-heavy-construction-site-with-excavator.jpeg?auto=compress&w=1200',
  'epi-chantier': 'https://images.pexels.com/photos/38706747/pexels-photo-38706747/free-photo-of-construction-worker-on-scaffolding-at-building-site.jpeg?auto=compress&w=1200',
  'compresseur-100l': 'https://images.pexels.com/photos/35042792/pexels-photo-35042792/free-photo-of-industrial-generator-in-snowy-outdoor-setting.jpeg?auto=compress&w=1200',
  'camion-benne-10t': 'https://images.pexels.com/photos/18805260/pexels-photo-18805260.jpeg?auto=compress&w=1200',
  'camion-toupie-8m3': 'https://images.pexels.com/photos/12032961/pexels-photo-12032961.jpeg?auto=compress&w=1200'
};
const updateEquipmentImage = database.prepare("UPDATE equipment SET image_url = ? WHERE slug = ? AND (image_url IS NULL OR image_url = '' OR image_url = ?)");
for (const item of seedEquipment) updateEquipmentImage.run(item[9], item[0], previousEquipmentImages[item[0]] || item[9]);
const seedProperties = [
  ['terrain-tokoin-lome', 'Terrain constructible à Tokoin', 'Terrain', 'sale', 'Lomé', 18500000, 'le bien', 600, null, 4.8, 'Parcelle de 600 m² située à Tokoin, adaptée à un projet résidentiel ou commercial. Titre foncier annoncé par le propriétaire.', 'https://images.pexels.com/photos/20074182/pexels-photo-20074182/free-photo-of-grassland-and-city-buildings-behind.jpeg?auto=compress&cs=tinysrgb&w=1200'],
  ['maison-familiale-be-lome', 'Maison familiale avec cour à Bè', 'Maison', 'rent', 'Lomé', 350000, 'mois', 180, 4, 4.7, 'Maison de quatre chambres avec cour intérieure, située dans un quartier résidentiel proche des commerces.', 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=1200'],
  ['appartement-2-chambres-abidjan', 'Appartement lumineux de 2 chambres', 'Appartement', 'rent', 'Abidjan', 425000, 'mois', 92, 2, 4.8, 'Appartement de deux chambres avec balcon et parking dans une résidence sécurisée à Cocody.', 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=1200'],
  ['local-commercial-plateau', 'Local commercial au Plateau', 'Local commercial', 'rent', 'Abidjan', 950000, 'mois', 120, null, 4.6, 'Local commercial de plain-pied avec vitrine sur rue passante, adapté à une activité de service ou de commerce.', 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1200'],
  ['terrain-calavi-cotonou', 'Terrain viabilisé à Calavi', 'Terrain', 'sale', 'Cotonou', 12500000, 'le bien', 500, null, 4.7, 'Terrain de 500 m² avec accès à la voie principale, proche des commodités de Calavi.', 'https://images.pexels.com/photos/33516339/pexels-photo-33516339/free-photo-of-aerial-view-of-farmlands-near-lilongwe-malawi.jpeg?auto=compress&cs=tinysrgb&w=1200'],
  ['villa-ngor-dakar', 'Villa avec jardin à Ngor', 'Villa', 'rent', 'Dakar', 1250000, 'mois', 240, 4, 4.9, 'Villa meublée avec jardin, quatre chambres et espace de stationnement, située à Ngor.', 'https://images.pexels.com/photos/280222/pexels-photo-280222.jpeg?auto=compress&cs=tinysrgb&w=1200']
];
const propertyCount = database.prepare('SELECT COUNT(*) AS count FROM properties').get().count;
if (propertyCount === 0) {
  const insertProperty = database.prepare(`
    INSERT INTO properties
      (slug, name, property_type, transaction_type, city, price, price_unit, area_m2, bedrooms, rating, description, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const item of seedProperties) insertProperty.run(...item);
}
const updatePropertyImage = database.prepare("UPDATE properties SET image_url = ? WHERE slug = ? AND (image_url IS NULL OR image_url = '' OR image_url LIKE 'https://images.unsplash.com/%' OR image_url LIKE '%/147411/%')");
for (const property of seedProperties) updatePropertyImage.run(property[11], property[0]);

const json = (response, status, payload) => { response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); response.end(JSON.stringify(payload)); };
async function readJson(request) {
  let body = '';
  for await (const chunk of request) body += chunk;
  if (body.length > 100000) throw new Error('Payload trop volumineux');
  return JSON.parse(body || '{}');
}
function makeOrderReference() { const date = new Date().toISOString().slice(0, 10).replaceAll('-', ''); return `CMD-${date}-${Date.now().toString().slice(-6)}`; }
function makeBookingReference(prefix = 'LOC') { const date = new Date().toISOString().slice(0, 10).replaceAll('-', ''); return `${prefix}-${date}-${randomBytes(16).toString('hex').toUpperCase()}`; }
function inputError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}
function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}
function listListings(url) {
  const conditions = [];
  const values = [];
  const search = (url.searchParams.get('search') || '').trim().slice(0, 100);
  const category = (url.searchParams.get('category') || '').trim().slice(0, 60);
  const city = (url.searchParams.get('city') || '').trim().slice(0, 80);
  const listingType = url.searchParams.get('type');
  const maxPrice = Number(url.searchParams.get('maxPrice'));
  if (listingType === 'equipment' || listingType === 'property') {
    conditions.push('listingType = ?');
    values.push(listingType);
  }
  if (search) {
    conditions.push('(name LIKE ? OR description LIKE ? OR category LIKE ? OR city LIKE ?)');
    values.push(...Array(4).fill(`%${search}%`));
  }
  if (category) {
    conditions.push('category = ?');
    values.push(category);
  }
  if (city) {
    conditions.push('city LIKE ?');
    values.push(`%${city}%`);
  }
  if (url.searchParams.has('maxPrice') && Number.isFinite(maxPrice) && maxPrice > 0) {
    conditions.push('price <= ?');
    values.push(Math.floor(maxPrice));
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return database.prepare(`
    SELECT * FROM (
      SELECT id, slug, name, category, city, daily_rate AS price, 'jour' AS priceUnit,
        rating, description, 'equipment' AS listingType, NULL AS transactionType,
        NULL AS areaM2, NULL AS bedrooms, image_url AS imageUrl, daily_driver_rate AS dailyDriverRate, delivery_fee AS deliveryFee
      FROM equipment
      UNION ALL
      SELECT id, slug, name, property_type AS category, city, price, price_unit AS priceUnit,
        rating, description, 'property' AS listingType, transaction_type AS transactionType,
        area_m2 AS areaM2, bedrooms, image_url AS imageUrl, 0 AS dailyDriverRate, 0 AS deliveryFee
      FROM properties
    ) listings ${where} ORDER BY rating DESC, name ASC
  `).all(...values);
}
function createPropertyInquiry(payload) {
  const customer = payload.customer || {};
  const customerName = typeof customer.name === 'string' ? customer.name.trim() : '';
  const customerEmail = typeof customer.email === 'string' ? customer.email.trim().toLowerCase() : '';
  const propertyId = Number(payload.propertyId);
  const inquiryType = payload.inquiryType;
  const preferredDate = payload.preferredDate || null;
  const message = typeof payload.message === 'string' ? payload.message.trim().slice(0, 1000) : '';
  if (customerName.length < 2 || customerName.length > 120) throw inputError('Indiquez un nom valide (2 à 120 caractères).');
  if (customerEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) throw inputError('Indiquez une adresse e-mail valide.');
  if (!Number.isInteger(propertyId) || propertyId < 1) throw inputError('Bien immobilier invalide.');
  if (!['visit', 'information'].includes(inquiryType)) throw inputError('Choisissez une demande de visite ou d’information.');
  if (preferredDate && (!validDate(preferredDate) || preferredDate < new Date().toISOString().slice(0, 10))) throw inputError('La date de visite souhaitée est invalide.');
  const property = database.prepare('SELECT * FROM properties WHERE id = ?').get(propertyId);
  if (!property) throw inputError('Bien immobilier introuvable.', 404);
  const ref = makeBookingReference('IMMO');
  database.prepare(`
    INSERT INTO property_inquiries (ref, property_id, customer_name, customer_email, inquiry_type, preferred_date, message)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(ref, propertyId, customerName, customerEmail, inquiryType, preferredDate, message);
  return {
    ref, status: 'pending', property: property.name, inquiryType, preferredDate,
    transactionType: property.transaction_type, price: property.price, priceUnit: property.price_unit, currency: 'XOF'
  };
}
function createRentalBooking(payload) {
  const customer = payload.customer || {};
  const customerName = typeof customer.name === 'string' ? customer.name.trim() : '';
  const customerEmail = typeof customer.email === 'string' ? customer.email.trim().toLowerCase() : '';
  const equipmentId = Number(payload.equipmentId);
  const startDate = payload.startDate;
  const endDate = payload.endDate;
  if (customerName.length < 2 || customerName.length > 120) throw inputError('Indiquez un nom valide (2 à 120 caractères).');
  if (customerEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) throw inputError('Indiquez une adresse e-mail valide.');
  if (!Number.isInteger(equipmentId) || equipmentId < 1) throw inputError('Matériel invalide.');
  if (!validDate(startDate) || !validDate(endDate) || endDate < startDate) throw inputError('Les dates de location sont invalides.');
  const today = new Date().toISOString().slice(0, 10);
  if (startDate < today) throw inputError('La date de début doit être aujourd’hui ou ultérieure.');
  const days = Math.floor((Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86400000) + 1;
  if (days > 90) throw inputError('Une demande de location ne peut pas dépasser 90 jours.');
  const withDriver = payload.withDriver === true;
  const withDelivery = payload.withDelivery === true;

  database.exec('BEGIN IMMEDIATE');
  try {
    const equipment = database.prepare('SELECT * FROM equipment WHERE id = ?').get(equipmentId);
    if (!equipment) throw inputError('Matériel introuvable.', 404);
    const overlap = database.prepare(`
      SELECT 1 FROM rental_bookings
      WHERE equipment_id = ? AND (
        status = 'confirmed' OR (status = 'pending' AND created_at >= datetime('now', '-24 hours'))
      )
        AND start_date <= ? AND end_date >= ?
      LIMIT 1
    `).get(equipmentId, endDate, startDate);
    if (overlap) throw inputError('Ce matériel a déjà une demande sur ces dates. Choisissez une autre période.', 409);
    if (withDriver && equipment.daily_driver_rate <= 0) throw inputError('Ce matériel ne propose pas de conducteur.');
    const rentalTotal = equipment.daily_rate * days;
    const driverTotal = withDriver ? equipment.daily_driver_rate * days : 0;
    const deliveryTotal = withDelivery ? equipment.delivery_fee : 0;
    const totalAmount = rentalTotal + driverTotal + deliveryTotal;
    const securityDeposit = Math.round(rentalTotal * 0.3);
    const ref = makeBookingReference();
    database.prepare(`
      INSERT INTO rental_bookings (
        ref, equipment_id, customer_name, customer_email, start_date, end_date, days_count,
        with_driver, with_delivery, rental_total, security_deposit, total_amount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(ref, equipmentId, customerName, customerEmail, startDate, endDate, days, Number(withDriver), Number(withDelivery), rentalTotal, securityDeposit, totalAmount);
    database.exec('COMMIT');
    return {
      ref, status: 'pending', equipment: equipment.name, days, dailyRate: equipment.daily_rate,
      rentalTotal, driverTotal, deliveryTotal, securityDeposit, totalAmount, currency: 'XOF'
    };
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}
async function createOrder(payload) {
  const customer = payload.customer || {};
  if (!Array.isArray(payload.items) || payload.items.length === 0) throw new Error('Le panier est vide');
  const items = payload.items.map(item => ({ productId: Number(item.productId), quantity: Number(item.quantity || 1) }));
  if (items.some(item => !Number.isInteger(item.productId) || !Number.isInteger(item.quantity) || item.quantity < 1)) throw new Error('Articles invalides');
  database.exec('BEGIN IMMEDIATE');
  try {
    const findProduct = database.prepare('SELECT id, name, price, stock FROM products WHERE id = ?');
    const updateStock = database.prepare('UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?');
    const orderItems = [];
    let total = 0;
    for (const item of items) {
      const product = findProduct.get(item.productId);
      if (!product) throw new Error(`Article introuvable: ${item.productId}`);
      if (product.stock < item.quantity) throw new Error(`Stock insuffisant pour ${product.name}`);
      updateStock.run(item.quantity, item.productId, item.quantity);
      orderItems.push({ ...item, name: product.name, price: product.price });
      total += product.price * item.quantity;
    }
    const ref = makeOrderReference();
    const order = database.prepare('INSERT INTO orders (ref, customer_name, customer_email, total) VALUES (?, ?, ?, ?)').run(ref, String(customer.name || '').slice(0, 160), String(customer.email || '').slice(0, 240), total);
    const insertItem = database.prepare('INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity) VALUES (?, ?, ?, ?, ?)');
    for (const item of orderItems) insertItem.run(order.lastInsertRowid, item.productId, item.name, item.price, item.quantity);
    database.exec('COMMIT');
    return { ref, status: 'pending', total, items: orderItems };
  } catch (error) { database.exec('ROLLBACK'); throw error; }
}

createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
  if (url.pathname === '/api/health') {
    json(response, 200, { service: 'btplease-pro', status: 'ok', mode: 'sqlite', database: 'ready' });
    return;
  }
  if (url.pathname === '/api/listings' && request.method === 'GET') {
    json(response, 200, { items: listListings(url), currency: 'XOF' });
    return;
  }
  if (url.pathname === '/api/bookings' && request.method === 'POST') {
    try { json(response, 201, createRentalBooking(await readJson(request))); }
    catch (error) { json(response, error.statusCode || 400, { error: error.message || 'Demande de location impossible' }); }
    return;
  }
  if (url.pathname === '/api/property-inquiries' && request.method === 'POST') {
    try { json(response, 201, createPropertyInquiry(await readJson(request))); }
    catch (error) { json(response, error.statusCode || 400, { error: error.message || 'Demande immobilière impossible' }); }
    return;
  }
  const bookingReferenceMatch = url.pathname.match(/^\/api\/(?:bookings|property-inquiries)\/((?:LOC|IMMO)-\d{8}-[A-F0-9]{32})$/);
  if (bookingReferenceMatch && request.method === 'GET') {
    const reference = bookingReferenceMatch[1];
    if (reference.startsWith('IMMO-')) {
      const inquiry = database.prepare(`
        SELECT i.ref, p.name AS property, i.inquiry_type AS inquiryType,
          i.preferred_date AS preferredDate, p.transaction_type AS transactionType,
          p.price, p.price_unit AS priceUnit,
          CASE WHEN i.status = 'pending' THEN 'En attente de réponse' ELSE i.status END AS status,
          i.created_at AS createdAt
        FROM property_inquiries i JOIN properties p ON p.id = i.property_id
        WHERE i.ref = ?
      `).get(reference);
      if (!inquiry) {
        json(response, 404, { error: 'Demande introuvable.' });
        return;
      }
      json(response, 200, { inquiry, currency: 'XOF' });
      return;
    }
    const booking = database.prepare(`
      SELECT b.ref, e.name AS equipment, b.start_date AS startDate, b.end_date AS endDate,
        b.days_count AS days, b.total_amount AS totalAmount,
        CASE WHEN b.status = 'pending' AND b.created_at < datetime('now', '-24 hours')
          THEN 'expired' ELSE b.status END AS status,
        b.created_at AS createdAt
      FROM rental_bookings b JOIN equipment e ON e.id = b.equipment_id
      WHERE b.ref = ?
    `).get(reference);
    if (!booking) {
      json(response, 404, { error: 'Demande introuvable.' });
      return;
    }
    json(response, 200, { booking, currency: 'XOF' });
    return;
  }
  if (url.pathname === '/api/orders' && request.method === 'POST') {
    try { json(response, 201, await createOrder(await readJson(request))); }
    catch (error) { json(response, 400, { error: error.message || 'Commande impossible' }); }
    return;
  }
  const requested = url.pathname === '/' ? '/index.html' : url.pathname;
  const filePath = normalize(join(root, requested));
  if (!filePath.startsWith(root)) {
    response.writeHead(403); response.end('Forbidden'); return;
  }
  try {
    const content = await readFile(filePath);
    response.writeHead(200, { 'content-type': types[extname(filePath)] || 'application/octet-stream', 'cache-control': 'no-cache' });
    response.end(content);
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
}).listen(port, () => console.log(`ASSIGAME-CHOP disponible sur http://localhost:${port}`));
