import { Router } from 'express';
import { getDb } from '../db.js';
import { authRequired } from '../middleware/auth.js';
import { getStudentTotals, calculateStarsFromMinutes, getGoalProgress } from '../services/progressService.js';

const router = Router();

router.get('/student/:studentId', authRequired, (req, res) => {
  const db = getDb();
  const studentId = Number(req.params.studentId);
  const student = db.prepare('SELECT * FROM users WHERE id = ? AND role = \"student\"').get(studentId);
  if (!student) return res.status(404).json({ error: 'Student not found' });
  // Authorization: student self, their parent, or their teacher (same class)
  const user = req.user;
  if (user.role === 'student' && user.id !== studentId) return res.status(403).json({ error: 'Forbidden' });
  if (user.role === 'parent' && student.parent_id !== user.id) return res.status(403).json({ error: 'Forbidden' });
  if (user.role === 'teacher' && user.class_id !== student.class_id) return res.status(403).json({ error: 'Forbidden' });
  const totals = getStudentTotals(studentId);
  res.json({ student, ...totals });
});

router.get('/class/:classId', authRequired, (req, res) => {
  const classId = Number(req.params.classId);
  const db = getDb();
  const students = db.prepare('SELECT * FROM users WHERE role = \"student\" AND class_id = ?').all(classId);
  const teamRows = db.prepare('SELECT * FROM teams WHERE class_id = ?').all(classId);
  const perStudent = students.map(s => ({ studentId: s.id, name: s.name, teamId: s.team_id, ...getStudentTotals(s.id) }));
  const classMinutes = perStudent.reduce((sum, s) => sum + s.totalMinutes, 0);
  const classStars = calculateStarsFromMinutes(classMinutes);
  const perTeam = teamRows.map(t => {
    const teamStudents = students.filter(s => s.team_id === t.id);
    const teamMinutes = teamStudents.reduce((sum, s) => sum + getStudentTotals(s.id).totalMinutes, 0);
    return { teamId: t.id, teamName: t.name, totalMinutes: teamMinutes, stars: calculateStarsFromMinutes(teamMinutes) };
  });
  const goalProgress = getGoalProgress('class', classId);
  res.json({ classId, totalMinutes: classMinutes, stars: classStars, perStudent, perTeam, goalProgress });
});

router.get('/team/:teamId', authRequired, (req, res) => {
  const teamId = Number(req.params.teamId);
  const db = getDb();
  const students = db.prepare('SELECT * FROM users WHERE role = \"student\" AND team_id = ?').all(teamId);
  const perStudent = students.map(s => ({ studentId: s.id, name: s.name, ...getStudentTotals(s.id) }));
  const teamMinutes = perStudent.reduce((sum, s) => sum + s.totalMinutes, 0);
  res.json({ teamId, totalMinutes: teamMinutes, stars: calculateStarsFromMinutes(teamMinutes), perStudent, goalProgress: getGoalProgress('team', teamId) });
});

export default router;

