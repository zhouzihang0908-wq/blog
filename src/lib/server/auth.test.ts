import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createSession, getUserBySessionToken, hashPassword, verifyPassword } from './auth';
import { createUser, ensureAdminUser, getUserByEmail } from './users';
import { migrate } from './db';

let db: Database.Database;

beforeEach(() => {
  db = new Database(':memory:');
  migrate(db);
});

afterEach(() => {
  db.close();
});

describe('authentication and users', () => {
  it('normalizes email, hashes passwords, and authenticates a valid password', async () => {
    const user = await createUser(db, {
      email: '  Reader@Example.COM ',
      name: 'Reader',
      password: 'correct horse battery staple'
    });

    expect(user.email).toBe('reader@example.com');
    expect(user.role).toBe('user');
    expect(user.passwordHash).not.toContain('correct horse');
    expect(await verifyPassword(user.passwordHash, 'correct horse battery staple')).toBe(true);
    expect(await verifyPassword(user.passwordHash, 'wrong password')).toBe(false);
  });

  it('rejects duplicate users case-insensitively', async () => {
    await createUser(db, { email: 'reader@example.com', name: 'Reader', password: 'password123' });

    await expect(createUser(db, { email: 'READER@example.com', name: 'Other', password: 'password123' })).rejects.toThrow(/already registered/i);
  });

  it('creates revocable HttpOnly session tokens stored as hashes', async () => {
    const user = await createUser(db, { email: 'reader@example.com', name: 'Reader', password: 'password123' });
    const session = createSession(db, user.id, 30);

    expect(session.cookie).toMatch(/blog_session=/);
    expect(session.cookie).toMatch(/HttpOnly/);
    expect(session.cookie).toMatch(/SameSite=Lax/);
    expect(session.token).not.toBe(session.storedHash);

    const sessionUser = getUserBySessionToken(db, session.token);
    expect(sessionUser?.email).toBe('reader@example.com');
  });

  it('bootstraps an admin from environment credentials and keeps the role on rerun', async () => {
    const admin = await ensureAdminUser(db, {
      email: 'Admin@Example.com',
      password: 'admin-password-123',
      name: '站点管理员'
    });

    expect(admin.email).toBe('admin@example.com');
    expect(admin.role).toBe('admin');

    await ensureAdminUser(db, {
      email: 'admin@example.com',
      password: 'new-admin-password-456',
      name: 'Ignored Name'
    });

    const stored = getUserByEmail(db, 'ADMIN@example.com');
    expect(stored?.role).toBe('admin');
    expect(stored?.name).toBe('站点管理员');
    expect(await verifyPassword(stored!.passwordHash, 'new-admin-password-456')).toBe(true);
  });

  it('repairs placeholder admin display names during bootstrap', async () => {
    await createUser(db, {
      email: 'bad-admin@example.com',
      name: '?'.repeat(5),
      password: 'old-password-123'
    });

    const repaired = await ensureAdminUser(db, {
      email: 'bad-admin@example.com',
      password: 'new-admin-password-456',
      name: '站点管理员'
    });

    expect(repaired.name).toBe('站点管理员');
    expect(repaired.role).toBe('admin');
  });

  it('uses bcrypt-compatible password hashes', async () => {
    const hash = await hashPassword('password123');

    expect(hash).toMatch(/^\$2[aby]\$/);
    expect(await verifyPassword(hash, 'password123')).toBe(true);
  });
});
