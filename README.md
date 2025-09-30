Reading Stars
=============

Turn minutes read into stars, badges, and class/team goals with simple student, parent, and teacher views.

Quick Start
-----------

1) Install Node 18+ and npm.

2) Install dependencies and start:

```
npm install
npm start
```

The server runs on http://localhost:3000 and serves the web UI.

Demo Logins
-----------

- Student: `alice` / `pass`
- Student: `bob` / `pass`
- Student: `cara` / `pass`
- Student: `diego` / `pass`
- Teacher: `teacher` / `pass`
- Parent: `parent` / `pass`

API Overview
------------

- POST `/api/auth/login` → returns `{ user, token }` where `token` is `x-user-id`
- GET `/api/auth/me` → returns `{ user }` for current token
- GET `/api/logs` → list logs visible to current user
- POST `/api/logs` → create reading log (student or parent)
- POST `/api/logs/:id/approve` → approve/reject (teacher)
- GET `/api/summary/student/:studentId` → totals, stars, badges
- GET `/api/summary/class/:classId` → class totals, per-student/team, goal progress
- GET `/api/summary/team/:teamId` → team totals and goal progress

Stars & Badges
--------------

- Stars: 1 star per 10 approved minutes
- Badges: awarded when total approved minutes meet thresholds (see `db/seed.sql`)

Data & Persistence
------------------

- SQLite database file: `data.sqlite` (auto-created on first run)
- Schema: `db/schema.sql`
- Seed data: `db/seed.sql`

Notes
-----

- This demo uses a very simple header-based auth via `x-user-id` for ease of testing. Replace with real auth for production.

# Read Rocket
MVP for a kids’ readathon coach app
