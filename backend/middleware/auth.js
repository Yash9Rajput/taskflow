const jwt = require('jsonwebtoken');
const { getDb } = require('../db/database');

// NOTE: getDb().prepare(...).get() returns a Promise on PostgreSQL, so it MUST be
// awaited. Without `await`, req.user would be a Promise (req.user.role === undefined),
// which makes requireAdmin reject every request with 403.
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  try {
    const db = getDb();
    const user = await db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(payload.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware DB error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = { authenticate, requireAdmin };
