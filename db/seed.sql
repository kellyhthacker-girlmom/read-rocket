INSERT INTO classes (name) VALUES
  ('Owls'),
  ('Foxes');

INSERT INTO teams (class_id, name) VALUES
  (1, 'Team A'),
  (1, 'Team B'),
  (2, 'Team C');

-- Demo users
INSERT INTO users (name, role, class_id, team_id, username, password) VALUES
  ('Alice Student', 'student', 1, 1, 'alice', 'pass'),
  ('Bob Student', 'student', 1, 1, 'bob', 'pass'),
  ('Cara Student', 'student', 1, 2, 'cara', 'pass'),
  ('Diego Student', 'student', 2, 3, 'diego', 'pass'),
  ('Tina Teacher', 'teacher', 1, NULL, 'teacher', 'pass'),
  ('Paula Parent', 'parent', NULL, NULL, 'parent', 'pass');

-- Link parent to students (parent_id field on students)
UPDATE users SET parent_id = (SELECT id FROM users WHERE username = 'parent') WHERE username IN ('alice','bob');

-- Badges by total approved minutes
INSERT INTO badges (name, description, criterion_type, threshold) VALUES
  ('Rising Reader', 'Read 60 minutes total', 'total_minutes', 60),
  ('Page Turner', 'Read 300 minutes total', 'total_minutes', 300),
  ('Book Explorer', 'Read 600 minutes total', 'total_minutes', 600),
  ('Star Reader', 'Read 1000 minutes total', 'total_minutes', 1000);

-- Sample logs (some pending, some approved)
INSERT INTO reading_logs (student_id, minutes, logged_at, note, status, approved_by, approved_at) VALUES
  ((SELECT id FROM users WHERE username = 'alice'), 20, DATE('now','-3 day'), 'Bedtime reading', 'approved', (SELECT id FROM users WHERE username='teacher'), DATE('now','-3 day')),
  ((SELECT id FROM users WHERE username = 'alice'), 15, DATE('now','-2 day'), 'Library time', 'approved', (SELECT id FROM users WHERE username='teacher'), DATE('now','-2 day')),
  ((SELECT id FROM users WHERE username = 'bob'), 30, DATE('now','-1 day'), 'Comics', 'pending', NULL, NULL),
  ((SELECT id FROM users WHERE username = 'cara'), 40, DATE('now','-1 day'), 'Fantasy novel', 'approved', (SELECT id FROM users WHERE username='teacher'), DATE('now','-1 day')),
  ((SELECT id FROM users WHERE username = 'diego'), 25, DATE('now'), 'Morning reading', 'pending', NULL, NULL);

-- Class and team goals
INSERT INTO goals (scope, scope_id, target_minutes, start_date, end_date) VALUES
  ('class', 1, 2000, DATE('now','-7 day'), DATE('now','+21 day')),
  ('team', 1, 800, DATE('now','-7 day'), DATE('now','+21 day')),
  ('team', 2, 800, DATE('now','-7 day'), DATE('now','+21 day')),
  ('class', 2, 1500, DATE('now','-7 day'), DATE('now','+21 day'));

