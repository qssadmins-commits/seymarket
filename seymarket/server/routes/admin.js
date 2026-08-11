const express = require("express");
const bcrypt = require("bcryptjs");
const { db } = require("../db/database");
const { requireAdmin } = require("./middleware");
const { deleteLocalPhoto } = require("./products");

const router = express.Router();

function publicAdmin(row) {
  if (!row) return null;
  const { password_hash, ...rest } = row;
  return rest;
}
function publicSeller(row) {
  if (!row) return null;
  const { password_hash, ...rest } = row;
  return rest;
}

// ---------- Admin auth ----------
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }
  const admin = db.prepare("SELECT * FROM admins WHERE email = ?").get(email.toLowerCase().trim());
  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return res.status(401).json({ error: "Incorrect email or password." });
  }
  req.session.adminId = admin.id;
  res.json(publicAdmin(admin));
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

router.get("/me", (req, res) => {
  if (!req.session.adminId) return res.status(401).json({ error: "Not logged in." });
  const admin = db.prepare("SELECT * FROM admins WHERE id = ?").get(req.session.adminId);
  if (!admin) return res.status(401).json({ error: "Not logged in." });
  res.json(publicAdmin(admin));
});

// ---------- Overview stats ----------
router.get("/stats", requireAdmin, (req, res) => {
  const shopCount = db.prepare("SELECT COUNT(*) AS c FROM sellers").get().c;
  const productCount = db.prepare("SELECT COUNT(*) AS c FROM products").get().c;
  const reviewCount = db.prepare("SELECT COUNT(*) AS c FROM reviews").get().c;
  const openReportCount = db.prepare("SELECT COUNT(*) AS c FROM reports WHERE resolved = 0").get().c;
  const newestShop = db.prepare("SELECT shop_name, created_at FROM sellers ORDER BY created_at DESC LIMIT 1").get();
  const byCategory = db.prepare(`
    SELECT category, COUNT(*) AS count
    FROM products
    GROUP BY category
    ORDER BY count DESC
  `).all();
  const topViewed = db.prepare(`
    SELECT products.name, products.views, sellers.shop_name
    FROM products
    JOIN sellers ON sellers.id = products.seller_id
    ORDER BY products.views DESC
    LIMIT 5
  `).all();
  res.json({ shopCount, productCount, reviewCount, openReportCount, newestShop: newestShop || null, byCategory, topViewed });
});

// ---------- Shop moderation ----------
router.get("/shops", requireAdmin, (req, res) => {
  const rows = db.prepare(`
    SELECT sellers.*, COUNT(products.id) AS product_count
    FROM sellers
    LEFT JOIN products ON products.seller_id = sellers.id
    GROUP BY sellers.id
    ORDER BY sellers.created_at DESC
  `).all();
  res.json(rows.map(publicSeller));
});

// Deletes a shop and (via ON DELETE CASCADE) all of its products
router.delete("/shops/:id", requireAdmin, (req, res) => {
  const seller = db.prepare("SELECT * FROM sellers WHERE id = ?").get(req.params.id);
  if (!seller) return res.status(404).json({ error: "Shop not found." });
  const products = db.prepare("SELECT photo FROM products WHERE seller_id = ?").all(req.params.id);
  db.prepare("DELETE FROM sellers WHERE id = ?").run(req.params.id); // cascades to products
  products.forEach((p) => deleteLocalPhoto(p.photo));
  res.json({ ok: true });
});

// Toggle a shop's "verified" badge
router.put("/shops/:id/verify", requireAdmin, (req, res) => {
  const seller = db.prepare("SELECT * FROM sellers WHERE id = ?").get(req.params.id);
  if (!seller) return res.status(404).json({ error: "Shop not found." });
  const nextValue = seller.verified ? 0 : 1;
  db.prepare("UPDATE sellers SET verified = ? WHERE id = ?").run(nextValue, req.params.id);
  res.json(publicSeller({ ...seller, verified: nextValue }));
});

// ---------- Product moderation (any product, any shop) ----------
router.get("/products", requireAdmin, (req, res) => {
  const { search } = req.query;
  let sql = `
    SELECT products.*, sellers.shop_name
    FROM products
    JOIN sellers ON sellers.id = products.seller_id
  `;
  const params = [];
  if (search && search.trim()) {
    sql += " WHERE products.name LIKE ? OR sellers.shop_name LIKE ?";
    const term = `%${search.trim()}%`;
    params.push(term, term);
  }
  sql += " ORDER BY products.created_at DESC";
  res.json(db.prepare(sql).all(...params));
});

router.delete("/products/:id", requireAdmin, (req, res) => {
  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found." });
  db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
  deleteLocalPhoto(product.photo);
  res.json({ ok: true });
});

// ---------- Reports (listings flagged by buyers) ----------
router.get("/reports", requireAdmin, (req, res) => {
  const { status } = req.query; // "open" | "resolved" | undefined (all)
  let sql = `
    SELECT reports.*, products.name AS product_name, products.photo AS product_photo, sellers.shop_name
    FROM reports
    JOIN products ON products.id = reports.product_id
    JOIN sellers ON sellers.id = products.seller_id
  `;
  if (status === "open") sql += " WHERE reports.resolved = 0";
  if (status === "resolved") sql += " WHERE reports.resolved = 1";
  sql += " ORDER BY reports.created_at DESC";
  res.json(db.prepare(sql).all());
});

router.put("/reports/:id/resolve", requireAdmin, (req, res) => {
  const report = db.prepare("SELECT * FROM reports WHERE id = ?").get(req.params.id);
  if (!report) return res.status(404).json({ error: "Report not found." });
  db.prepare("UPDATE reports SET resolved = 1 WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

router.delete("/reports/:id", requireAdmin, (req, res) => {
  const report = db.prepare("SELECT * FROM reports WHERE id = ?").get(req.params.id);
  if (!report) return res.status(404).json({ error: "Report not found." });
  db.prepare("DELETE FROM reports WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
