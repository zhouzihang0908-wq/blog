import { randomUUID } from 'node:crypto';

export function nowIso() {
  return new Date().toISOString();
}

export function newId(prefix: string) {
  return `${prefix}_${randomUUID()}`;
}

export function normalizeSlug(slug: string) {
  return slug.trim().replace(/^\/+|\/+$/g, '');
}
