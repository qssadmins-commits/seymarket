function requireAuth(req, res, next) {
  if (!req.session || !req.session.sellerId) {
    return res.status(401).json({ error: "You must be logged in as a seller to do this." });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session || !req.session.adminId) {
    return res.status(401).json({ error: "You must be logged in as an admin to do this." });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
