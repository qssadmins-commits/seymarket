const Database = require("better-sqlite3");
const path = require("path");
const bcrypt = require("bcryptjs");

const dbPath = path.join(__dirname, "seymarket.sqlite");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS sellers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shop_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    description TEXT,
    location TEXT,
    contact_info TEXT,
    logo_image TEXT,
    verified INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seller_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    photo TEXT,
    gallery TEXT,
    stock INTEGER,
    views INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    reviewer_name TEXT NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    reason TEXT NOT NULL,
    details TEXT,
    resolved INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  );
`);

// --- Lightweight migration for databases created before these columns existed ---
// (SQLite's CREATE TABLE IF NOT EXISTS won't add new columns to an already-existing
// table, so any pre-existing seymarket.sqlite needs these added by hand.)
function ensureColumn(table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);
  if (!cols.includes(column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`Migrated: added ${table}.${column}`);
  }
}
ensureColumn("sellers", "verified", "INTEGER NOT NULL DEFAULT 0");
ensureColumn("products", "gallery", "TEXT");
ensureColumn("products", "stock", "INTEGER");
ensureColumn("products", "views", "INTEGER NOT NULL DEFAULT 0");

const CATEGORIES = [
  "Food & Drink",
  "Crafts & Art",
  "Clothing & Accessories",
  "Beauty & Wellness",
  "Home & Garden",
  "Other"
];

// --- Seed a default admin account on first run only ---
const adminCount = db.prepare("SELECT COUNT(*) AS c FROM admins").get().c;
if (adminCount === 0) {
  db.prepare(`
    INSERT INTO admins (name, email, password_hash)
    VALUES (?, ?, ?)
  `).run("Site Admin", "admin@seymarket.com", bcrypt.hashSync("admin1234", 10));
  console.log("Seeded default admin (email: admin@seymarket.com, password: admin1234)");
}

// --- Seed sample data on first run only ---
const sellerCount = db.prepare("SELECT COUNT(*) AS c FROM sellers").get().c;

if (sellerCount === 0) {
  const insertSeller = db.prepare(`
    INSERT INTO sellers (shop_name, email, password_hash, description, location, contact_info, logo_image, verified)
    VALUES (@shop_name, @email, @password_hash, @description, @location, @contact_info, @logo_image, @verified)
  `);
  const insertProduct = db.prepare(`
    INSERT INTO products (seller_id, name, price, description, category, photo, stock)
    VALUES (@seller_id, @name, @price, @description, @category, @photo, @stock)
  `);

  const demoPasswordHash = bcrypt.hashSync("demo1234", 10);

  const sellers = [
    {
      shop_name: "Anse Coco Crafts",
      email: "ansecoco@example.com",
      password_hash: demoPasswordHash,
      description: "Handmade coconut-shell and coco-de-mer inspired crafts, made on Praslin.",
      location: "Anse Lazio, Praslin",
      contact_info: "+248 2 512 340",
      logo_image: "https://picsum.photos/seed/ansecoco/200/200",
      verified: 1
    },
    {
      shop_name: "Take 5 Bakery",
      email: "take5@example.com",
      password_hash: demoPasswordHash,
      description: "Fresh Creole bread, cinnamon buns and coconut cakes, baked daily.",
      location: "Victoria, Mahe",
      contact_info: "+248 2 671 984",
      logo_image: "https://picsum.photos/seed/take5/200/200",
      verified: 1
    },
    {
      shop_name: "Ile Threads",
      email: "ilethreads@example.com",
      password_hash: demoPasswordHash,
      description: "Batik and screen-printed clothing with island-inspired patterns.",
      location: "Beau Vallon, Mahe",
      contact_info: "+248 2 789 213",
      logo_image: "https://picsum.photos/seed/ilethreads/200/200",
      verified: 0
    },
    {
      shop_name: "Praslin Pearls",
      email: "praslinpearls@example.com",
      password_hash: demoPasswordHash,
      description: "Natural soaps, coconut-oil skincare and handmade jewellery.",
      location: "Grand Anse, Praslin",
      contact_info: "+248 2 345 671",
      logo_image: "https://picsum.photos/seed/praslinpearls/200/200",
      verified: 1
    },
    {
      shop_name: "Green Grove Farm",
      email: "greengrove@example.com",
      password_hash: demoPasswordHash,
      description: "Home-grown fruit, vegetables and spices from a small family farm.",
      location: "Anse Royale, Mahe",
      contact_info: "+248 2 456 782",
      logo_image: "https://picsum.photos/seed/greengrove/200/200",
      verified: 0
    }
  ];

  const insertedIds = sellers.map((s) => insertSeller.run(s).lastInsertRowid);

  const products = [
    { seller_id: insertedIds[0], name: "Coco-de-mer keychain", price: 150, description: "Small polished coco-de-mer slice keychain.", category: "Crafts & Art", photo: "https://picsum.photos/seed/keychain/500/500", stock: 24 },
    { seller_id: insertedIds[0], name: "Coconut shell bowl set", price: 350, description: "Set of 2 hand-carved coconut shell bowls.", category: "Home & Garden", photo: "https://picsum.photos/seed/bowlset/500/500", stock: 6 },
    { seller_id: insertedIds[0], name: "Woven palm basket", price: 220, description: "Traditional woven palm-leaf basket, medium size.", category: "Crafts & Art", photo: "https://picsum.photos/seed/basket/500/500", stock: 0 },

    { seller_id: insertedIds[1], name: "Cinnamon buns (box of 6)", price: 120, description: "Soft cinnamon buns baked fresh every morning.", category: "Food & Drink", photo: "https://picsum.photos/seed/buns/500/500", stock: 15 },
    { seller_id: insertedIds[1], name: "Coconut cake", price: 180, description: "Whole coconut sponge cake with coconut cream filling.", category: "Food & Drink", photo: "https://picsum.photos/seed/coconutcake/500/500", stock: 8 },
    { seller_id: insertedIds[1], name: "Creole bread loaf", price: 45, description: "Traditional Creole white bread loaf.", category: "Food & Drink", photo: "https://picsum.photos/seed/breadloaf/500/500", stock: 30 },

    { seller_id: insertedIds[2], name: "Batik sarong", price: 280, description: "Hand-dyed batik sarong, one size fits most.", category: "Clothing & Accessories", photo: "https://picsum.photos/seed/sarong/500/500", stock: 12 },
    { seller_id: insertedIds[2], name: "Island print T-shirt", price: 190, description: "Screen-printed cotton T-shirt with fish-market pattern.", category: "Clothing & Accessories", photo: "https://picsum.photos/seed/tshirt/500/500", stock: 20 },

    { seller_id: insertedIds[3], name: "Coconut oil soap bar", price: 60, description: "Handmade cold-process soap with coconut oil.", category: "Beauty & Wellness", photo: "https://picsum.photos/seed/soap/500/500", stock: 40 },
    { seller_id: insertedIds[3], name: "Shell drop earrings", price: 140, description: "Hand-strung shell and glass bead earrings.", category: "Beauty & Wellness", photo: "https://picsum.photos/seed/earrings/500/500", stock: 10 },
    { seller_id: insertedIds[3], name: "Vanilla body scrub", price: 175, description: "Local vanilla and sugar body scrub, 250g jar.", category: "Beauty & Wellness", photo: "https://picsum.photos/seed/scrub/500/500", stock: 0 },

    { seller_id: insertedIds[4], name: "Breadfruit (each)", price: 25, description: "Fresh whole breadfruit, farm picked.", category: "Food & Drink", photo: "https://picsum.photos/seed/breadfruit/500/500", stock: 50 },
    { seller_id: insertedIds[4], name: "Vanilla pods (pack of 5)", price: 200, description: "Cured Bourbon vanilla pods, grown on-farm.", category: "Food & Drink", photo: "https://picsum.photos/seed/vanilla/500/500", stock: 9 }
  ];

  const insertedProductIds = products.map((p) => insertProduct.run(p).lastInsertRowid);

  console.log(`Seeded ${sellers.length} shops and ${products.length} products.`);

  // --- Seed a handful of demo reviews so the ratings UI has something to show ---
  const insertReview = db.prepare(`
    INSERT INTO reviews (product_id, reviewer_name, rating, comment)
    VALUES (@product_id, @reviewer_name, @rating, @comment)
  `);
  const demoReviews = [
    { product_id: insertedProductIds[0], reviewer_name: "Marie L.", rating: 5, comment: "Beautiful keepsake, exactly like the photo." },
    { product_id: insertedProductIds[0], reviewer_name: "James R.", rating: 4, comment: "Lovely finish, shipped fast within Mahe." },
    { product_id: insertedProductIds[3], reviewer_name: "Aline P.", rating: 5, comment: "Best cinnamon buns on the island, still warm on pickup." },
    { product_id: insertedProductIds[6], reviewer_name: "Sarah K.", rating: 5, comment: "Gorgeous colours and good quality fabric." },
    { product_id: insertedProductIds[6], reviewer_name: "Noah D.", rating: 3, comment: "Nice sarong but ran a bit small." },
    { product_id: insertedProductIds[9], reviewer_name: "Priya S.", rating: 4, comment: "Smells amazing and lasts a long time." }
  ];
  for (const r of demoReviews) insertReview.run(r);
}

module.exports = { db, CATEGORIES };
