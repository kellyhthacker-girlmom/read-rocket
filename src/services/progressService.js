import { getDb } from '../db.js';

export function calculateStarsFromMinutes(totalApprovedMinutes) {
  const minutesPerStar = 10; // 1 star per 10 minutes
  return Math.floor(totalApprovedMinutes / minutesPerStar);
}

export function getStudentTotals(studentId) {
  const db = getDb();
  const row = db.prepare(
    `SELECT COALESCE(SUM(CASE WHEN status='approved' THEN minutes ELSE 0 END),0) as total_minutes
     FROM reading_logs WHERE student_id = ?`
  ).get(studentId);
  const totalMinutes = row?.total_minutes || 0;
  const stars = calculateStarsFromMinutes(totalMinutes);
  const badges = db.prepare(
    `SELECT b.* FROM user_badges ub JOIN badges b ON b.id = ub.badge_id WHERE ub.user_id = ? ORDER BY b.threshold`
  ).all(studentId);
  return { totalMinutes, stars, badges };
}

export function recalculateBadgesForStudent(studentId) {
  const db = getDb();
  const { totalMinutes } = getStudentTotals(studentId);
  const candidateBadges = db.prepare('SELECT * FROM badges WHERE threshold <= ? ORDER BY threshold').all(totalMinutes);
  const ownedBadgeIds = new Set(
    db.prepare('SELECT badge_id FROM user_badges WHERE user_id = ?').all(studentId).map(r => r.badge_id)
  );
  const nowIso = new Date().toISOString();
  const insert = db.prepare('INSERT OR IGNORE INTO user_badges (user_id, badge_id, awarded_at) VALUES (?, ?, ?)');
  for (const badge of candidateBadges) {
    if (!ownedBadgeIds.has(badge.id)) {
      insert.run(studentId, badge.id, nowIso);
    }
  }
}

export function getGoalProgress(scope, scopeId) {
  const db = getDb();
  const goal = db.prepare('SELECT * FROM goals WHERE scope = ? AND scope_id = ? ORDER BY id DESC LIMIT 1').get(scope, scopeId);
  if (!goal) return null;
  let totalMinutes = 0;
  if (scope === 'class') {
    totalMinutes = db.prepare(
      `SELECT COALESCE(SUM(rl.minutes),0) as total
       FROM users u
       LEFT JOIN reading_logs rl ON rl.student_id = u.id AND rl.status='approved'
       WHERE u.role='student' AND u.class_id = ?`
    ).get(scopeId).total;
  } else {
    totalMinutes = db.prepare(
      `SELECT COALESCE(SUM(rl.minutes),0) as total
       FROM users u
       LEFT JOIN reading_logs rl ON rl.student_id = u.id AND rl.status='approved'
       WHERE u.role='student' AND u.team_id = ?`
    ).get(scopeId).total;
  }
  const percentage = Math.min(100, Math.round((totalMinutes / goal.target_minutes) * 100));
  return { goal, totalMinutes, percentage };
}

