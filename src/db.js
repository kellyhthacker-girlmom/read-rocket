import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..');
const DB_FILE = path.join(DATA_DIR, 'data.sqlite');
const SCHEMA_FILE = path.join(__dirname, '..', 'db', 'schema.sql');
const SEED_FILE = path.join(__dirname, '..', 'db', 'seed.sql');

let dbInstance = null;

export function getDb() {
  if (!dbInstance) {
    dbInstance = new Database(DB_FILE);
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('foreign_keys = ON');
  }
  return dbInstance;
}

export async function ensureDatabase() {
  const isNew = !fs.existsSync(DB_FILE);
  const db = getDb();

  // Apply schema
  const schemaSql = fs.readFileSync(SCHEMA_FILE, 'utf-8');
  db.exec(schemaSql);

  // Seed if new or empty users table
  const row = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (isNew || row.count === 0) {
    const seedSql = fs.readFileSync(SEED_FILE, 'utf-8');
    db.exec(seedSql);
  }
}

