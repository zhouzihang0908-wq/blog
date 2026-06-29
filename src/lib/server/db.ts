import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

let singleton: Database.Database | null = null;

export function resolveDbPath() {
  return process.env.BLOG_DB_PATH ? resolve(process.env.BLOG_DB_PATH) : resolve(process.cwd(), '.data', 'blog.sqlite');
}

export function openDatabase(file = resolveDbPath()) {
  if (file !== ':memory:') {
    mkdirSync(dirname(file), { recursive: true });
  }
  const db = new Database(file);
  migrate(db);
  return db;
}

export function getDb() {
  if (!singleton) {
    singleton = openDatabase();
  }
  return singleton;
}

export function closeDbForTests() {
  if (singleton) {
    singleton.close();
    singleton = null;
  }
}

export function migrate(db: Database.Database) {
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      post_slug TEXT NOT NULL,
      user_id TEXT NOT NULL,
      parent_id TEXT,
      body TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_comments_post_slug ON comments(post_slug);
    CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);
    CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);

    CREATE TABLE IF NOT EXISTS post_likes (
      user_id TEXT NOT NULL,
      post_slug TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (user_id, post_slug),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_post_likes_post_slug ON post_likes(post_slug);

    CREATE TABLE IF NOT EXISTS post_favorites (
      user_id TEXT NOT NULL,
      post_slug TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (user_id, post_slug),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_post_favorites_post_slug ON post_favorites(post_slug);
    CREATE INDEX IF NOT EXISTS idx_post_favorites_user_created ON post_favorites(user_id, created_at DESC);
  `);
}
