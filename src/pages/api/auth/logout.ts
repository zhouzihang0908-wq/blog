import type { APIRoute } from 'astro';
import { SESSION_COOKIE_NAME, clearSessionCookie, deleteSessionByToken } from '../../../lib/server/auth';
import { getDb } from '../../../lib/server/db';
import { assertSameOrigin, json } from '../../../lib/server/http';

export const prerender = false;

export const POST: APIRoute = async ({ request, url, cookies }) => {
  try {
    assertSameOrigin(request, url);
    const token = cookies.get(SESSION_COOKIE_NAME)?.value;
    if (token) deleteSessionByToken(getDb(), token);
  } catch (error) {
    if (error instanceof Response) return error;
  }

  const accept = request.headers.get('accept') || '';
  if (accept.includes('application/json')) {
    return json({ ok: true }, { headers: { 'set-cookie': clearSessionCookie() } });
  }

  return new Response(null, {
    status: 303,
    headers: {
      location: '/',
      'set-cookie': clearSessionCookie()
    }
  });
};
