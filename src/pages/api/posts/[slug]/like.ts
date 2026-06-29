import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getDb } from '../../../../lib/server/db';
import { assertSameOrigin, json, jsonError, readJson } from '../../../../lib/server/http';
import { setPostLike } from '../../../../lib/server/interactions';

export const prerender = false;

const schema = z.object({ liked: z.boolean() });

export const PUT: APIRoute = async ({ params, request, url, locals }) => {
  try {
    assertSameOrigin(request, url);
    if (!locals.user) return jsonError('请先登录', 401);
    const slug = params.slug;
    if (!slug) return jsonError('Missing post slug', 400);
    const body = schema.parse(await readJson(request));
    return json({ interactions: setPostLike(getDb(), locals.user.id, slug, body.liked) });
  } catch (error) {
    if (error instanceof Response) return error;
    return jsonError(error instanceof Error ? error.message : '点赞失败', 400);
  }
};
