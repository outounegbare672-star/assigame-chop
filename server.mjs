import { createServer } from 'node:http';
import { mkdir, readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || 4173);
const dataDirectory = join(root, 'data');
await mkdir(dataDirectory, { recursive: true });
const database = new DatabaseSync(join(dataDirectory, 'assigame-chop.sqlite'));
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
`);

const seedProducts = [
  ['Enceinte Nomade Sira', 45000, 'Tech & Co'], ['Casque sans fil Kora', 29500, 'Tech & Co'],
  ['Robe Wax Baobab', 38000, 'Naya Studio'], ['Chemise Lin Horizon', 24000, 'Naya Studio'],
  ['Sneakers Dakar Terre', 42000, 'Naya Studio'], ['Sandales Cuir Kémi', 21500, 'Les Créations Awa'],
  ['Vase Terre & Soleil', 18500, 'Maison Kora'], ['Bougie Santal & Cèdre', 12500, 'Atelier Kémi'],
  ['Huile Corps Karité', 9500, 'Atelier Kémi'], ['Panier gourmand local', 22000, 'Maison Sira'],
  ['Sac Nubi en raphia', 32000, 'Les Créations Awa'], ['Lampe solaire portable', 16000, 'Tech & Co']
];
const productCount = database.prepare('SELECT COUNT(*) AS count FROM products').get().count;
if (productCount === 0) {
  const insertProduct = database.prepare('INSERT INTO products (name, sku, price, stock, description) VALUES (?, ?, ?, ?, ?)');
  for (const [name, price, shop] of seedProducts) insertProduct.run(name, `SKU-${name.toUpperCase().replace(/[^A-Z0-9]+/g, '-').slice(0, 22)}`, price, 100, `${shop} - article disponible`);
}

const json = (response, status, payload) => { response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' }); response.end(JSON.stringify(payload)); };
async function readJson(request) {
  let body = '';
  for await (const chunk of request) body += chunk;
  if (body.length > 100000) throw new Error('Payload trop volumineux');
  return JSON.parse(body || '{}');
}
function makeOrderReference() { const date = new Date().toISOString().slice(0, 10).replaceAll('-', ''); return `CMD-${date}-${Date.now().toString().slice(-6)}`; }
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
    json(response, 200, { service: 'assigame-chop', status: 'ok', mode: 'sqlite', database: 'ready' });
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
