import type { APIRoute } from 'astro';
import { z } from 'zod';
import { createSession } from '../../../lib/server/auth';
import { getDb } from '../../../lib/server/db';
import { assertSameOrigin, getRequestOrigin, json, jsonError, readJson } from '../../../lib/server/http';
import { createUser } from '../../../lib/server/users';

export const prerender = false;

const schema = z.object({
  email: z.string(),
  name: z.string(),
  password: z.string()
});

export const POST: APIRoute = async ({ request, url }) => {
  try {
    assertSameOrigin(request, url);
    const body = schema.parse(await readJson(request));
    const db = getDb();
    const user = await createUser(db, body);
    const session = createSession(db, user.id, 30, getRequestOrigin(url).startsWith('https://'));

    return json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      next: '/account/'
    }, { headers: { 'set-cookie': session.cookie } });
  } catch (error) {
    if (error instanceof Response) return error;
    const message = error instanceof Error ? error.message : '注册失败';
    return jsonError(message, /already registered/i.test(message) ? 409 : 400);
  }
};
