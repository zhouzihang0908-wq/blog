import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

const dbPath = resolve(process.env.BLOG_DB_PATH || '.data/blog.sqlite');
mkdirSync(dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
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

const adminEmail = process.env.BLOG_ADMIN_EMAIL?.trim().toLowerCase();
const adminPassword = process.env.BLOG_ADMIN_PASSWORD;
if (adminEmail && adminPassword) {
  if (adminPassword.length < 8) {
    throw new Error('BLOG_ADMIN_PASSWORD must be at least 8 characters');
  }
  const now = new Date().toISOString();
  const passwordHash = bcrypt.hashSync(adminPassword, 12);
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
  if (existing) {
    db.prepare("UPDATE users SET role = 'admin', password_hash = ?, updated_at = ? WHERE id = ?").run(passwordHash, now, existing.id);
    console.log(`Promoted admin user: ${adminEmail}`);
  } else {
    db.prepare(`
      INSERT INTO users (id, email, name, password_hash, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'admin', ?, ?)
    `).run(`usr_${randomUUID()}`, adminEmail, '?????', passwordHash, now, now);
    console.log(`Created admin user: ${adminEmail}`);
  }
} else {
  console.log('BLOG_ADMIN_EMAIL/BLOG_ADMIN_PASSWORD not both set; skipped admin bootstrap.');
}

db.close();
console.log(`Database migrated: ${dbPath}`);
