import { Router } from 'express';
import { getDb } from '../db.js';

const router = Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ user, token: String(user.id) });
});

router.get('/me', (req, res) => {
  // x-user-id header is optional; if missing, return guest
  const userId = req.headers['x-user-id'];
  if (!userId) return res.json({ user: null });
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(userId));
  res.json({ user: user || null });
});

export default router;

