export function getRequestOrigin(currentUrl: URL, configuredOrigin = process.env.BLOG_PUBLIC_ORIGIN) {
  return configuredOrigin?.replace(/\/$/, '') || currentUrl.origin;
}

export function isSameOriginWrite(headers: Headers, currentUrl: URL, configuredOrigin = process.env.BLOG_PUBLIC_ORIGIN) {
  const expectedOrigin = getRequestOrigin(currentUrl, configuredOrigin);
  const origin = headers.get('origin');
  if (origin) return origin === expectedOrigin;

  const referer = headers.get('referer');
  if (referer) {
    try {
      return new URL(referer).origin === expectedOrigin;
    } catch {
      return false;
    }
  }

  return true;
}

export function sanitizeNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/';
  return value;
}

export function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function jsonError(message: string, status = 400) {
  return json({ error: message }, { status });
}

export async function readJson<T = unknown>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new Error('Invalid JSON body');
  }
}

export function assertSameOrigin(request: Request, currentUrl: URL) {
  if (!isSameOriginWrite(request.headers, currentUrl)) {
    throw new Response(JSON.stringify({ error: 'Cross-origin write rejected' }), {
      status: 403,
      headers: { 'content-type': 'application/json; charset=utf-8' }
    });
  }
}
