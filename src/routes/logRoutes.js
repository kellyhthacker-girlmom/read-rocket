import { Router } from 'express';
import { getDb } from '../db.js';
import { authRequired, requireRole } from '../middleware/auth.js';
import { recalculateBadgesForStudent } from '../services/progressService.js';

const router = Router();

// List logs visible to the user
router.get('/', authRequired, (req, res) => {
  const db = getDb();
  const user = req.user;
  let rows = [];
  if (user.role === 'student') {
    rows = db.prepare('SELECT * FROM reading_logs WHERE student_id = ? ORDER BY date(logged_at) DESC, id DESC').all(user.id);
  } else if (user.role === 'parent') {
    rows = db.prepare(
      `SELECT rl.* FROM reading_logs rl
       JOIN users s ON s.id = rl.student_id
       WHERE s.parent_id = ?
       ORDER BY date(rl.logged_at) DESC, rl.id DESC`
    ).all(user.id);
  } else if (user.role === 'teacher') {
    rows = db.prepare(
      `SELECT rl.* FROM reading_logs rl
       JOIN users s ON s.id = rl.student_id
       WHERE s.class_id = ?
       ORDER BY date(rl.logged_at) DESC, rl.id DESC`
    ).all(user.class_id);
  }
  res.json({ logs: rows });
});

// Create a new log (student or parent for child)
router.post('/', authRequired, (req, res) => {
  const db = getDb();
  const { minutes, loggedAt, note, studentId } = req.body;
  if (minutes == null || minutes < 0) return res.status(400).json({ error: 'minutes must be >= 0' });
  const isoDate = loggedAt || new Date().toISOString().slice(0, 10);

  let targetStudentId = null;
  if (req.user.role === 'student') {
    targetStudentId = req.user.id;
  } else if (req.user.role === 'parent') {
    const child = db.prepare('SELECT id FROM users WHERE id = ? AND parent_id = ?').get(Number(studentId), req.user.id);
    if (!child) return res.status(403).json({ error: 'Not your child' });
    targetStudentId = child.id;
  } else {
    return res.status(403).json({ error: 'Only students or parents can create logs' });
  }

  const stmt = db.prepare(
    'INSERT INTO reading_logs (student_id, minutes, logged_at, note, status) VALUES (?, ?, ?, ?, \"pending\")'
  );
  const info = stmt.run(targetStudentId, Number(minutes), isoDate, note || null);
  const created = db.prepare('SELECT * FROM reading_logs WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ log: created });
});

// Approve or reject (teacher only)
router.post('/:id/approve', authRequired, requireRole('teacher'), (req, res) => {
  const db = getDb();
  const { decision } = req.body; // 'approved' or 'rejected'
  if (!['approved', 'rejected'].includes(decision)) return res.status(400).json({ error: 'decision must be approved|rejected' });
  const log = db.prepare('SELECT rl.*, s.class_id FROM reading_logs rl JOIN users s ON s.id = rl.student_id WHERE rl.id = ?').get(Number(req.params.id));
  if (!log) return res.status(404).json({ error: 'Log not found' });
  if (log.class_id !== req.user.class_id) return res.status(403).json({ error: 'Not in your class' });
  const nowIso = new Date().toISOString();
  db.prepare('UPDATE reading_logs SET status = ?, approved_by = ?, approved_at = ? WHERE id = ?').run(decision, req.user.id, nowIso, log.id);
  if (decision === 'approved') {
    recalculateBadgesForStudent(log.student_id);
  }
  const updated = db.prepare('SELECT * FROM reading_logs WHERE id = ?').get(log.id);
  res.json({ log: updated });
});

export default router;

