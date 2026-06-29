import type Database from 'better-sqlite3';
import { getDb } from './db';
import { ensureAdminUser } from './users';

let bootstrapped = false;

export async function bootstrapAdminFromEnv(db: Database.Database = getDb()) {
  if (bootstrapped) return;
  const email = process.env.BLOG_ADMIN_EMAIL;
  const password = process.env.BLOG_ADMIN_PASSWORD;
  if (email && password) {
    await ensureAdminUser(db, { email, password, name: '站点管理员' });
  }
  bootstrapped = true;
}

export function resetBootstrapForTests() {
  bootstrapped = false;
}
