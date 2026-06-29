import { describe, expect, it } from 'vitest';
import { getRequestOrigin, isSameOriginWrite, sanitizeNextPath } from './http';

describe('http security helpers', () => {
  it('accepts same-origin writes and rejects cross-origin writes', () => {
    const current = new URL('https://blog.zzhgod.top/posts/welcome/');

    expect(isSameOriginWrite(new Headers({ origin: 'https://blog.zzhgod.top' }), current)).toBe(true);
    expect(isSameOriginWrite(new Headers({ referer: 'https://blog.zzhgod.top/posts/welcome/' }), current)).toBe(true);
    expect(isSameOriginWrite(new Headers({ origin: 'https://evil.example' }), current)).toBe(false);
  });

  it('allows server-to-server writes with no browser origin headers', () => {
    expect(isSameOriginWrite(new Headers(), new URL('http://localhost:4321/api/auth/logout'))).toBe(true);
  });

  it('uses BLOG_PUBLIC_ORIGIN when configured behind a reverse proxy', () => {
    expect(getRequestOrigin(new URL('http://127.0.0.1:4321/api'), 'https://blog.zzhgod.top')).toBe('https://blog.zzhgod.top');
  });

  it('sanitizes next redirects to local absolute paths only', () => {
    expect(sanitizeNextPath('/account/')).toBe('/account/');
    expect(sanitizeNextPath('https://evil.example')).toBe('/');
    expect(sanitizeNextPath('//evil.example')).toBe('/');
    expect(sanitizeNextPath('posts/welcome')).toBe('/');
  });
});
