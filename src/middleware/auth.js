import { getDb } from '../db.js';

export function authOptional(req, _res, next) {
  const userId = req.headers['x-user-id'];
  if (userId) {
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(userId));
    if (user) {
      req.user = user;
    }
  }
  next();
}

export function authRequired(req, res, next) {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'Missing x-user-id header. Please login.' });
  }
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(userId));
  if (!user) {
    return res.status(401).json({ error: 'Invalid user' });
  }
  req.user = user;
  next();
}

export function requireRole(...roles) {
  return function roleMiddleware(req, res, next) {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

