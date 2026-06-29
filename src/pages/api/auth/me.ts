import type { APIRoute } from 'astro';
import { json } from '../../../lib/server/http';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  return json({ user: locals.user });
};
