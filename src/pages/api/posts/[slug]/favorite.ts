import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getDb } from '../../../../lib/server/db';
import { assertSameOrigin, json, jsonError, readJson } from '../../../../lib/server/http';
import { setPostFavorite } from '../../../../lib/server/interactions';

export const prerender = false;

const schema = z.object({ favorited: z.boolean() });

export const PUT: APIRoute = async ({ params, request, url, locals }) => {
  try {
    assertSameOrigin(request, url);
    if (!locals.user) return jsonError('请先登录', 401);
    const slug = params.slug;
    if (!slug) return jsonError('Missing post slug', 400);
    const body = schema.parse(await readJson(request));
    return json({ interactions: setPostFavorite(getDb(), locals.user.id, slug, body.favorited) });
  } catch (error) {
    if (error instanceof Response) return error;
    return jsonError(error instanceof Error ? error.message : '收藏失败', 400);
  }
};
