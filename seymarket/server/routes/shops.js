const express = require("express");
const { db } = require("../db/database");

const router = express.Router();

function publicSeller(row) {
  if (!row) return null;
  const { password_hash, ...rest } = row;
  return rest;
}

router.get("/", (req, res) => {
  const rows = db.prepare("SELECT * FROM sellers ORDER BY shop_name ASC").all();
  res.json(rows.map(publicSeller));
});

router.get("/:id", (req, res) => {
  const seller = db.prepare("SELECT * FROM sellers WHERE id = ?").get(req.params.id);
  if (!seller) return res.status(404).json({ error: "Shop not found." });
  const products = db.prepare("SELECT * FROM products WHERE seller_id = ? ORDER BY created_at DESC").all(req.params.id);
  res.json({ ...publicSeller(seller), products });
});

module.exports = router;
