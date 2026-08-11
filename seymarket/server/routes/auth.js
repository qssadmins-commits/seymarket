const express = require("express");
const bcrypt = require("bcryptjs");
const { db } = require("../db/database");

const router = express.Router();

function publicSeller(row) {
  if (!row) return null;
  const { password_hash, ...rest } = row;
  return rest;
}

router.post("/signup", (req, res) => {
  const shop_name = (req.body.shop_name || "").trim();
  const email = (req.body.email || "").trim();
  const { password, description, location, contact_info } = req.body;

  if (!shop_name || !email || !password) {
    return res.status(400).json({ error: "Shop name, email and password are required." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  const existing = db.prepare("SELECT id FROM sellers WHERE email = ?").get(email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: "An account with that email already exists." });
  }

  const password_hash = bcrypt.hashSync(password, 10);
  const info = db.prepare(`
    INSERT INTO sellers (shop_name, email, password_hash, description, location, contact_info)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(shop_name, email.toLowerCase(), password_hash, description || "", location || "", contact_info || "");

  const seller = db.prepare("SELECT * FROM sellers WHERE id = ?").get(info.lastInsertRowid);
  req.session.sellerId = seller.id;
  res.status(201).json(publicSeller(seller));
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }
  const seller = db.prepare("SELECT * FROM sellers WHERE email = ?").get(email.toLowerCase().trim());
  if (!seller || !bcrypt.compareSync(password, seller.password_hash)) {
    return res.status(401).json({ error: "Incorrect email or password." });
  }
  req.session.sellerId = seller.id;
  res.json(publicSeller(seller));
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

router.get("/me", (req, res) => {
  if (!req.session.sellerId) return res.status(401).json({ error: "Not logged in." });
  const seller = db.prepare("SELECT * FROM sellers WHERE id = ?").get(req.session.sellerId);
  if (!seller) return res.status(401).json({ error: "Not logged in." });
  res.json(publicSeller(seller));
});

module.exports = router;
