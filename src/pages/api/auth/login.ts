import type { APIRoute } from 'astro';
import { z } from 'zod';
import { authenticateUser, createSession } from '../../../lib/server/auth';
import { getDb } from '../../../lib/server/db';
import { assertSameOrigin, getRequestOrigin, json, jsonError, readJson } from '../../../lib/server/http';

export const prerender = false;

const schema = z.object({
  email: z.string().min(1),
  password: z.string().min(1)
});

export const POST: APIRoute = async ({ request, url }) => {
  try {
    assertSameOrigin(request, url);
    const body = schema.parse(await readJson(request));
    const db = getDb();
    const user = authenticateUser(db, body.email, body.password);
    if (!user) return jsonError('邮箱或密码错误', 401);
    const session = createSession(db, user.id, 30, getRequestOrigin(url).startsWith('https://'));

    return json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } }, { headers: { 'set-cookie': session.cookie } });
  } catch (error) {
    if (error instanceof Response) return error;
    return jsonError(error instanceof Error ? error.message : '登录失败', 400);
  }
};
