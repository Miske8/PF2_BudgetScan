/**
 * Migration 001 — schéma initial (version exécutable de 001_init.sql).
 * Le fichier .sql sibling reste la référence documentaire du schéma.
 */

export const MIGRATION_001_INIT = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id         TEXT PRIMARY KEY,
  user_id    TEXT REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  color      TEXT NOT NULL,
  icon       TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  UNIQUE (user_id, name)
);

CREATE TABLE IF NOT EXISTS budgets (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  month       INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year        INTEGER NOT NULL,
  amount      REAL NOT NULL CHECK (amount > 0),
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL,
  UNIQUE (user_id, category_id, month, year)
);

CREATE TABLE IF NOT EXISTS scanned_tickets (
  id               TEXT PRIMARY KEY,
  user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image_uri        TEXT NOT NULL,
  extracted_amount REAL,
  extracted_date   INTEGER,
  raw_text         TEXT,
  created_at       INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS expenses (
  id                TEXT PRIMARY KEY,
  user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  amount            REAL NOT NULL CHECK (amount > 0),
  date              INTEGER NOT NULL,
  category_id       TEXT NOT NULL REFERENCES categories(id),
  note              TEXT,
  receipt_image_uri TEXT,
  ticket_id         TEXT REFERENCES scanned_tickets(id) ON DELETE SET NULL,
  created_at        INTEGER NOT NULL,
  updated_at        INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date);
CREATE INDEX IF NOT EXISTS idx_expenses_category  ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_period     ON budgets(user_id, month, year);
`;
