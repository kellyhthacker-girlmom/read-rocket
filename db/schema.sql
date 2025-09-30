-- Enable foreign keys
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  UNIQUE(class_id, name),
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student','teacher','parent')),
  class_id INTEGER,
  team_id INTEGER,
  parent_id INTEGER,
  username TEXT UNIQUE,
  password TEXT,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL,
  FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS reading_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  minutes INTEGER NOT NULL CHECK (minutes >= 0),
  logged_at TEXT NOT NULL, -- ISO date
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  approved_by INTEGER,
  approved_at TEXT,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  criterion_type TEXT NOT NULL CHECK (criterion_type IN ('total_minutes')),
  threshold INTEGER NOT NULL CHECK (threshold > 0)
);

CREATE TABLE IF NOT EXISTS user_badges (
  user_id INTEGER NOT NULL,
  badge_id INTEGER NOT NULL,
  awarded_at TEXT NOT NULL,
  PRIMARY KEY (user_id, badge_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scope TEXT NOT NULL CHECK (scope IN ('class','team')),
  scope_id INTEGER NOT NULL,
  target_minutes INTEGER NOT NULL CHECK (target_minutes > 0),
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL
);

-- Helper views
CREATE VIEW IF NOT EXISTS v_student_totals AS
SELECT u.id AS student_id,
       COALESCE(SUM(CASE WHEN rl.status = 'approved' THEN rl.minutes ELSE 0 END), 0) AS total_minutes
FROM users u
LEFT JOIN reading_logs rl ON rl.student_id = u.id
WHERE u.role = 'student'
GROUP BY u.id;

