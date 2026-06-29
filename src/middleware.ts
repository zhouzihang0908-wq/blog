import { defineMiddleware } from 'astro:middleware';
import { SESSION_COOKIE_NAME, getUserBySessionToken } from './lib/server/auth';
import { bootstrapAdminFromEnv } from './lib/server/bootstrap';
import { getDb } from './lib/server/db';

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.user = null;

  if (context.isPrerendered) {
    return next();
  }

  try {
    const db = getDb();
    await bootstrapAdminFromEnv(db);
    const token = context.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      context.locals.user = getUserBySessionToken(db, token);
    }
  } catch (error) {
    console.error('Blog auth middleware failed:', error);
  }

  return next();
});
