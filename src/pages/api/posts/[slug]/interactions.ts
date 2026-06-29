import type { APIRoute } from 'astro';
import { getDb } from '../../../../lib/server/db';
import { json, jsonError } from '../../../../lib/server/http';
import { getPostInteractions } from '../../../../lib/server/interactions';

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  const slug = params.slug;
  if (!slug) return jsonError('Missing post slug', 400);
  const interactions = getPostInteractions(getDb(), slug, locals.user?.id);
  return json({ interactions, user: locals.user });
};
