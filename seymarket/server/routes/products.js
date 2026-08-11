const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { db, CATEGORIES } = require("../db/database");
const { requireAuth } = require("./middleware");

const router = express.Router();

const uploadDir = path.join(__dirname, "..", "public", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `product_${Date.now()}_${Math.round(Math.random() * 1e6)}${ext}`);
  }
});
const ALLOWED_EXT = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) return cb(new Error("Only image files are allowed."));
    cb(null, true);
  }
});
// Cover photo (field "photo") plus up to 4 extra gallery images (field "gallery")
const uploadProductImages = upload.fields([
  { name: "photo", maxCount: 1 },
  { name: "gallery", maxCount: 4 }
]);

// Removes an old product photo from disk, but only if it's a file we
// actually stored locally in /uploads (never touches external/demo URLs
// like the seeded picsum.photos images).
function deleteLocalPhoto(photoPath) {
  if (!photoPath || !photoPath.startsWith("/uploads/")) return;
  const filePath = path.join(uploadDir, path.basename(photoPath));
  fs.unlink(filePath, (err) => {
    if (err && err.code !== "ENOENT") console.error("Failed to remove old photo:", err.message);
  });
}

function parseGallery(row) {
  if (!row) return row;
  let gallery = [];
  try {
    gallery = row.gallery ? JSON.parse(row.gallery) : [];
  } catch {
    gallery = [];
  }
  return { ...row, gallery, in_stock: row.stock === null || row.stock > 0 };
}

const PRODUCT_SELECT = `
  SELECT products.*, sellers.shop_name, sellers.location, sellers.contact_info, sellers.verified AS shop_verified
  FROM products
  JOIN sellers ON sellers.id = products.seller_id
`;

router.get("/categories", (req, res) => {
  res.json(CATEGORIES);
});

// Browse / search / filter / paginate
const SORT_OPTIONS = {
  newest: "products.created_at DESC",
  price_asc: "products.price ASC",
  price_desc: "products.price DESC",
  name_asc: "products.name ASC",
  popular: "products.views DESC"
};

router.get("/", (req, res) => {
  const { search, category, sellerId, sort, priceMin, priceMax, inStock, verifiedOnly } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const pageSize = Math.min(48, Math.max(1, parseInt(req.query.pageSize, 10) || 12));

  let where = " WHERE 1=1";
  const params = [];

  if (search && search.trim()) {
    where += " AND (products.name LIKE ? OR products.description LIKE ?)";
    const term = `%${search.trim()}%`;
    params.push(term, term);
  }
  if (category && category.trim() && category !== "All") {
    where += " AND products.category = ?";
    params.push(category.trim());
  }
  if (sellerId) {
    where += " AND products.seller_id = ?";
    params.push(sellerId);
  }
  if (priceMin) {
    where += " AND products.price >= ?";
    params.push(parseFloat(priceMin));
  }
  if (priceMax) {
    where += " AND products.price <= ?";
    params.push(parseFloat(priceMax));
  }
  if (inStock === "1") {
    where += " AND (products.stock IS NULL OR products.stock > 0)";
  }
  if (verifiedOnly === "1") {
    where += " AND sellers.verified = 1";
  }

  const total = db.prepare(`SELECT COUNT(*) AS c FROM products JOIN sellers ON sellers.id = products.seller_id${where}`).get(...params).c;

  const sql = `${PRODUCT_SELECT}${where} ORDER BY ${SORT_OPTIONS[sort] || SORT_OPTIONS.newest} LIMIT ? OFFSET ?`;
  const rows = db.prepare(sql).all(...params, pageSize, (page - 1) * pageSize);

  res.json({
    items: rows.map(parseGallery),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  });
});

router.get("/:id", (req, res) => {
  const row = db.prepare(PRODUCT_SELECT + " WHERE products.id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Product not found." });
  db.prepare("UPDATE products SET views = views + 1 WHERE id = ?").run(req.params.id);
  res.json(parseGallery({ ...row, views: row.views + 1 }));
});

// ---------- Reviews ----------
router.get("/:id/reviews", (req, res) => {
  const product = db.prepare("SELECT id FROM products WHERE id = ?").get(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found." });
  const reviews = db.prepare("SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC").all(req.params.id);
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;
  res.json({ reviews, average: avg, count: reviews.length });
});

router.post("/:id/reviews", (req, res) => {
  const product = db.prepare("SELECT id FROM products WHERE id = ?").get(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found." });

  const reviewer_name = (req.body.reviewer_name || "").trim();
  const rating = parseInt(req.body.rating, 10);
  const comment = (req.body.comment || "").trim();

  if (!reviewer_name) return res.status(400).json({ error: "Please enter your name." });
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Rating must be between 1 and 5." });
  }
  if (reviewer_name.length > 60) return res.status(400).json({ error: "Name is too long." });
  if (comment.length > 800) return res.status(400).json({ error: "Comment is too long." });

  const info = db.prepare(`
    INSERT INTO reviews (product_id, reviewer_name, rating, comment)
    VALUES (?, ?, ?, ?)
  `).run(req.params.id, reviewer_name, rating, comment);

  const review = db.prepare("SELECT * FROM reviews WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json(review);
});

// ---------- Reports (buyer flags a listing for admin review) ----------
router.post("/:id/report", (req, res) => {
  const product = db.prepare("SELECT id FROM products WHERE id = ?").get(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found." });

  const reason = (req.body.reason || "").trim();
  const details = (req.body.details || "").trim();
  if (!reason) return res.status(400).json({ error: "Please choose a reason." });
  if (details.length > 800) return res.status(400).json({ error: "Details are too long." });

  db.prepare(`
    INSERT INTO reports (product_id, reason, details)
    VALUES (?, ?, ?)
  `).run(req.params.id, reason, details);

  res.status(201).json({ ok: true });
});

// Create product (auth required)
router.post("/", requireAuth, uploadProductImages, (req, res) => {
  const name = (req.body.name || "").trim();
  const { price, description, category, stock } = req.body;
  if (!name || !price || !category) {
    return res.status(400).json({ error: "Name, price and category are required." });
  }
  if (!CATEGORIES.includes(category)) {
    return res.status(400).json({ error: "Invalid category." });
  }
  const priceNum = parseFloat(price);
  if (isNaN(priceNum) || priceNum < 0) {
    return res.status(400).json({ error: "Price must be a positive number." });
  }
  let stockNum = null;
  if (stock !== undefined && stock !== "") {
    stockNum = parseInt(stock, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      return res.status(400).json({ error: "Stock must be zero or a positive whole number." });
    }
  }

  const files = req.files || {};
  const photo = files.photo?.[0] ? `/uploads/${files.photo[0].filename}` : "https://picsum.photos/seed/newitem/500/500";
  const gallery = (files.gallery || []).map((f) => `/uploads/${f.filename}`);

  const info = db.prepare(`
    INSERT INTO products (seller_id, name, price, description, category, photo, gallery, stock)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.session.sellerId, name, priceNum, description || "", category, photo, JSON.stringify(gallery), stockNum);

  const row = db.prepare(PRODUCT_SELECT + " WHERE products.id = ?").get(info.lastInsertRowid);
  res.status(201).json(parseGallery(row));
});

// Update product (auth required, must own it)
router.put("/:id", requireAuth, uploadProductImages, (req, res) => {
  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found." });
  if (product.seller_id !== req.session.sellerId) {
    return res.status(403).json({ error: "You can only edit your own listings." });
  }

  const name = req.body.name !== undefined ? req.body.name.trim() : undefined;
  const { price, description, category, stock } = req.body;
  const priceNum = price !== undefined ? parseFloat(price) : product.price;
  if (price !== undefined && (isNaN(priceNum) || priceNum < 0)) {
    return res.status(400).json({ error: "Price must be a positive number." });
  }
  if (category && !CATEGORIES.includes(category)) {
    return res.status(400).json({ error: "Invalid category." });
  }
  let stockNum = product.stock;
  if (stock !== undefined) {
    stockNum = stock === "" ? null : parseInt(stock, 10);
    if (stockNum !== null && (isNaN(stockNum) || stockNum < 0)) {
      return res.status(400).json({ error: "Stock must be zero or a positive whole number." });
    }
  }

  const files = req.files || {};
  const photo = files.photo?.[0] ? `/uploads/${files.photo[0].filename}` : product.photo;
  if (files.photo?.[0]) deleteLocalPhoto(product.photo);

  let gallery;
  if (files.gallery && files.gallery.length) {
    // New gallery images replace the old set (and the old ones are removed from disk)
    let oldGallery = [];
    try { oldGallery = product.gallery ? JSON.parse(product.gallery) : []; } catch { oldGallery = []; }
    oldGallery.forEach(deleteLocalPhoto);
    gallery = files.gallery.map((f) => `/uploads/${f.filename}`);
  } else {
    gallery = product.gallery ? JSON.parse(product.gallery) : [];
  }

  db.prepare(`
    UPDATE products SET name = ?, price = ?, description = ?, category = ?, photo = ?, gallery = ?, stock = ?
    WHERE id = ?
  `).run(
    name || product.name,
    priceNum,
    description !== undefined ? description : product.description,
    category || product.category,
    photo,
    JSON.stringify(gallery),
    stockNum,
    req.params.id
  );

  const row = db.prepare(PRODUCT_SELECT + " WHERE products.id = ?").get(req.params.id);
  res.json(parseGallery(row));
});

// Delete product (auth required, must own it)
router.delete("/:id", requireAuth, (req, res) => {
  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found." });
  if (product.seller_id !== req.session.sellerId) {
    return res.status(403).json({ error: "You can only delete your own listings." });
  }
  db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
  deleteLocalPhoto(product.photo);
  try {
    (JSON.parse(product.gallery || "[]")).forEach(deleteLocalPhoto);
  } catch { /* ignore malformed gallery JSON */ }
  res.json({ ok: true });
});

module.exports = router;
module.exports.deleteLocalPhoto = deleteLocalPhoto;
