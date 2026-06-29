import type Database from 'better-sqlite3';
import { z } from 'zod';
import { hashPassword } from './auth';
import type { DbUser, UserRole } from './types';
import { newId, nowIso } from './utils';

const userInputSchema = z.object({
  email: z.preprocess((value) => typeof value === 'string' ? normalizeEmail(value) : value, z.email()),
  name: z.string().trim().min(1, 'Name is required').max(60, 'Name is too long'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['user', 'admin']).optional().default('user')
});

const DEFAULT_ADMIN_NAME = '站点管理员';

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
  role?: UserRole;
}

interface UserRow {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isPlaceholderAdminName(name: string) {
  return name.trim() === '' || /^\?+$/.test(name.trim());
}

function rowToUser(row: UserRow): DbUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.password_hash,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function getUserByEmail(db: Database.Database, email: string) {
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizeEmail(email)) as UserRow | undefined;
  return row ? rowToUser(row) : null;
}

export function getUserById(db: Database.Database, id: string) {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
  return row ? rowToUser(row) : null;
}

export async function createUser(db: Database.Database, input: CreateUserInput) {
  const parsed = userInputSchema.parse(input);
  const existing = getUserByEmail(db, parsed.email);
  if (existing) {
    throw new Error('Email is already registered');
  }

  const timestamp = nowIso();
  const id = newId('usr');
  const passwordHash = hashPassword(parsed.password);

  db.prepare(`
    INSERT INTO users (id, email, name, password_hash, role, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, parsed.email, parsed.name, passwordHash, parsed.role, timestamp, timestamp);

  return getUserById(db, id)!;
}

export async function ensureAdminUser(db: Database.Database, input: { email: string; password: string; name?: string }) {
  const parsed = userInputSchema.parse({
    email: input.email,
    name: input.name || DEFAULT_ADMIN_NAME,
    password: input.password,
    role: 'admin'
  });
  const existing = getUserByEmail(db, parsed.email);
  const timestamp = nowIso();
  const passwordHash = hashPassword(parsed.password);

  if (existing) {
    if (isPlaceholderAdminName(existing.name)) {
      db.prepare(`
        UPDATE users
        SET name = ?, role = 'admin', password_hash = ?, updated_at = ?
        WHERE id = ?
      `).run(parsed.name, passwordHash, timestamp, existing.id);
    } else {
      db.prepare(`
        UPDATE users
        SET role = 'admin', password_hash = ?, updated_at = ?
        WHERE id = ?
      `).run(passwordHash, timestamp, existing.id);
    }
    return getUserById(db, existing.id)!;
  }

  const id = newId('usr');
  db.prepare(`
    INSERT INTO users (id, email, name, password_hash, role, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'admin', ?, ?)
  `).run(id, parsed.email, parsed.name, passwordHash, timestamp, timestamp);

  return getUserById(db, id)!;
}

export function listUsers(db: Database.Database) {
  const rows = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all() as UserRow[];
  return rows.map(rowToUser);
}

