import type Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { createHmac, randomBytes } from 'node:crypto';
import { getUserById } from './users';
import type { AuthUser } from './types';
import { nowIso } from './utils';

export const SESSION_COOKIE_NAME = 'blog_session';
const DEFAULT_SESSION_DAYS = 30;

interface SessionRow {
  id: string;
  user_id: string;
  expires_at: string;
  created_at: string;
}

export function hashPassword(password: string) {
  return bcrypt.hashSync(password, 12);
}

export function verifyPassword(hash: string, password: string) {
  return bcrypt.compareSync(password, hash);
}

export function authenticateUser(db: Database.Database, email: string, password: string) {
  const row = db.prepare('SELECT id, password_hash FROM users WHERE email = ?').get(email.trim().toLowerCase()) as { id: string; password_hash: string } | undefined;
  if (!row || !verifyPassword(row.password_hash, password)) return null;
  return getUserById(db, row.id);
}

export function hashSessionToken(token: string, secret = process.env.BLOG_SESSION_SECRET || 'dev-insecure-session-secret') {
  return createHmac('sha256', secret).update(token).digest('base64url');
}

export function generateSessionToken() {
  return randomBytes(32).toString('base64url');
}

export function createSession(db: Database.Database, userId: string, days = DEFAULT_SESSION_DAYS, secure = process.env.NODE_ENV === 'production') {
  const token = generateSessionToken();
  const storedHash = hashSessionToken(token);
  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

  db.prepare('INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)').run(storedHash, userId, expiresAt, createdAt);

  return {
    token,
    storedHash,
    expiresAt,
    cookie: serializeSessionCookie(token, expiresAt, secure)
  };
}

export function serializeSessionCookie(token: string, expiresAt: string, secure = process.env.NODE_ENV === 'production') {
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Expires=${new Date(expiresAt).toUTCString()}`
  ];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export function deleteSessionByToken(db: Database.Database, token: string) {
  db.prepare('DELETE FROM sessions WHERE id = ?').run(hashSessionToken(token));
}

export function pruneExpiredSessions(db: Database.Database) {
  db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(nowIso());
}

export function getUserBySessionToken(db: Database.Database, token: string): AuthUser | null {
  if (!token) return null;
  pruneExpiredSessions(db);
  const row = db.prepare('SELECT * FROM sessions WHERE id = ? AND expires_at > ?').get(hashSessionToken(token), nowIso()) as SessionRow | undefined;
  if (!row) return null;
  const user = getUserById(db, row.user_id);
  if (!user) return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

