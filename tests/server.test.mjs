import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:net';
import { DatabaseSync } from 'node:sqlite';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, before, test } from 'node:test';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
let baseUrl;
let databaseDirectory;
let serverProcess;

before(async () => {
  databaseDirectory = await mkdtemp(join(tmpdir(), 'btplease-test-'));
  const legacyDatabase = new DatabaseSync(join(databaseDirectory, 'test.sqlite'));
  legacyDatabase.exec(`
    CREATE TABLE equipment (
      id INTEGER PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      city TEXT NOT NULL,
      daily_rate INTEGER NOT NULL,
      rating REAL NOT NULL DEFAULT 0,
      description TEXT NOT NULL,
      daily_driver_rate INTEGER NOT NULL DEFAULT 0,
      delivery_fee INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE properties (
      id INTEGER PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      property_type TEXT NOT NULL,
      transaction_type TEXT NOT NULL,
      city TEXT NOT NULL,
      price INTEGER NOT NULL,
      price_unit TEXT NOT NULL,
      area_m2 INTEGER,
      bedrooms INTEGER,
      rating REAL NOT NULL DEFAULT 0,
      description TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  legacyDatabase.close();
  const portServer = createServer();
  await new Promise((resolve, reject) => {
    portServer.once('error', reject);
    portServer.listen(0, '127.0.0.1', resolve);
  });
  const { port } = portServer.address();
  await new Promise((resolve, reject) => portServer.close(error => error ? reject(error) : resolve()));
  baseUrl = `http://127.0.0.1:${port}`;
  serverProcess = spawn(process.execPath, ['server.mjs'], {
    cwd: projectRoot,
    env: { ...process.env, PORT: String(port), DATABASE_PATH: join(databaseDirectory, 'test.sqlite') },
    stdio: 'ignore'
  });

  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    if (serverProcess.exitCode !== null) throw new Error(`Server de test arrêté avec le code ${serverProcess.exitCode}`);
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {
      await new Promise(resolve => setTimeout(resolve, 60));
    }
  }
  serverProcess.kill();
  throw new Error('Le serveur de test ne répond pas.');
});

after(async () => {
  if (serverProcess && serverProcess.exitCode === null) {
    const closed = once(serverProcess, 'close');
    serverProcess.kill();
    await closed;
  }
  if (databaseDirectory) await rm(databaseDirectory, { recursive: true, force: true });
});

test('catalogue mixte, locations BTP et demandes immobilières fonctionnent', async () => {
  const pageResponse = await fetch(`${baseUrl}/`);
  assert.equal(pageResponse.status, 200);
  assert.match(await pageResponse.text(), /BTPLease Pro/);
  for (const asset of ['/styles.css', '/app.js', '/manifest.webmanifest']) {
    const assetResponse = await fetch(`${baseUrl}${asset}`);
    assert.equal(assetResponse.status, 200, `${asset} doit être servi`);
  }

  const healthResponse = await fetch(`${baseUrl}/api/health`);
  assert.equal(healthResponse.status, 200);
  assert.equal((await healthResponse.json()).status, 'ok');

  const catalogResponse = await fetch(`${baseUrl}/api/listings`);
  const catalog = await catalogResponse.json();
  assert.equal(catalogResponse.status, 200);
  assert.ok(catalog.items.length > 0);
  assert.ok(catalog.items.some(item => item.listingType === 'equipment'));
  assert.ok(catalog.items.some(item => item.listingType === 'property'));
  assert.ok(catalog.items.filter(item => item.listingType === 'equipment').every(item => item.imageUrl?.startsWith('https://images.pexels.com/')));
  const equipment = catalog.items.filter(item => item.listingType === 'equipment');
  assert.equal(equipment.length, 14);
  assert.equal(equipment.filter(item => item.category === 'Véhicules chantier').length, 2);
  assert.ok(equipment.some(item => item.slug === 'camion-benne-10t' && item.imageUrl.includes('/14475776/')));
  assert.ok(equipment.some(item => item.slug === 'camion-toupie-8m3' && item.imageUrl.includes('/34281022/')));
  assert.ok(catalog.items.filter(item => item.listingType === 'property').every(item => item.imageUrl?.startsWith('https://images.pexels.com/')));
  const pelle = catalog.items.find(item => item.slug === 'pelle-cat-320d');
  assert.ok(pelle);
  const equipmentFilterResponse = await fetch(`${baseUrl}/api/listings?type=equipment&city=Lom%C3%A9&maxPrice=90000`);
  const equipmentFilter = await equipmentFilterResponse.json();
  assert.equal(equipmentFilterResponse.status, 200);
  assert.ok(equipmentFilter.items.length > 0);
  assert.ok(equipmentFilter.items.every(item => item.listingType === 'equipment' && item.city === 'Lomé' && item.price <= 90000));
  const vehicleResponse = await fetch(`${baseUrl}/api/listings?type=equipment&category=${encodeURIComponent('Véhicules chantier')}`);
  const vehicles = await vehicleResponse.json();
  assert.equal(vehicleResponse.status, 200);
  assert.equal(vehicles.items.length, 2);
  assert.ok(vehicles.items.every(item => item.listingType === 'equipment' && item.category === 'Véhicules chantier'));
  const propertyResponse = await fetch(`${baseUrl}/api/listings?type=property&search=terrain`);
  const propertyCatalog = await propertyResponse.json();
  assert.equal(propertyResponse.status, 200);
  assert.ok(propertyCatalog.items.length >= 2);
  assert.ok(propertyCatalog.items.every(item => item.listingType === 'property' && item.transactionType === 'sale'));
  const terrain = propertyCatalog.items.find(item => item.slug === 'terrain-tokoin-lome');
  assert.ok(terrain);
  const apartmentResponse = await fetch(`${baseUrl}/api/listings?type=property&search=appartement`);
  const apartmentCatalog = await apartmentResponse.json();
  assert.equal(apartmentResponse.status, 200);
  assert.equal(apartmentCatalog.items[0].transactionType, 'rent');
  assert.equal(apartmentCatalog.items[0].priceUnit, 'mois');

  const bookingPayload = {
    equipmentId: pelle.id,
    customer: { name: 'Afi Mensah', email: 'afi@example.com' },
    startDate: '2098-11-10',
    endDate: '2098-11-12',
    withDriver: true,
    withDelivery: true
  };
  const bookingResponse = await fetch(`${baseUrl}/api/bookings`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(bookingPayload)
  });
  const booking = await bookingResponse.json();
  assert.equal(bookingResponse.status, 201);
  assert.equal(booking.days, 3);
  assert.equal(booking.rentalTotal, 255000);
  assert.equal(booking.driverTotal, 75000);
  assert.equal(booking.deliveryTotal, 45000);
  assert.equal(booking.securityDeposit, 76500);
  assert.equal(booking.totalAmount, 375000);

  const conflictResponse = await fetch(`${baseUrl}/api/bookings`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(bookingPayload)
  });
  assert.equal(conflictResponse.status, 409);

  assert.match(booking.ref, /^LOC-\d{8}-[A-F0-9]{32}$/);
  const lookupResponse = await fetch(`${baseUrl}/api/bookings/${booking.ref}`);
  const lookup = await lookupResponse.json();
  assert.equal(lookupResponse.status, 200);
  assert.equal(lookup.booking.ref, booking.ref);
  assert.equal(lookup.booking.equipment, 'Pelle hydraulique CAT 320D');
  assert.equal(Object.hasOwn(lookup.booking, 'customer_email'), false);

  const inquiryResponse = await fetch(`${baseUrl}/api/property-inquiries`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      propertyId: terrain.id,
      customer: { name: 'Ama Kossi', email: 'ama@example.com' },
      inquiryType: 'visit',
      preferredDate: '2098-11-20',
      message: 'Je souhaite visiter ce terrain.'
    })
  });
  const inquiry = await inquiryResponse.json();
  assert.equal(inquiryResponse.status, 201);
  assert.match(inquiry.ref, /^IMMO-\d{8}-[A-F0-9]{32}$/);
  assert.equal(inquiry.property, 'Terrain constructible à Tokoin');
  const inquiryLookupResponse = await fetch(`${baseUrl}/api/property-inquiries/${inquiry.ref}`);
  const inquiryLookup = await inquiryLookupResponse.json();
  assert.equal(inquiryLookupResponse.status, 200);
  assert.equal(inquiryLookup.inquiry.ref, inquiry.ref);
  assert.equal(inquiryLookup.inquiry.inquiryType, 'visit');
  assert.equal(inquiryLookup.inquiry.price, 18500000);
  assert.equal(Object.hasOwn(inquiryLookup.inquiry, 'customer_email'), false);
  assert.equal(inquiryLookup.inquiry.preferredDate, '2098-11-20');

  const invalidResponse = await fetch(`${baseUrl}/api/bookings`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...bookingPayload, startDate: '2098-02-31' })
  });
  assert.equal(invalidResponse.status, 400);
});
