import type { APIRoute } from 'astro';
import { z } from 'zod';
import { moderateComment } from '../../../../lib/server/comments';
import { getDb } from '../../../../lib/server/db';
import { assertSameOrigin, json, jsonError, readJson } from '../../../../lib/server/http';

export const prerender = false;

const schema = z.object({ status: z.enum(['approved', 'rejected']) });

export const PATCH: APIRoute = async ({ params, request, url, locals }) => {
  try {
    assertSameOrigin(request, url);
    if (!locals.user || locals.user.role !== 'admin') return jsonError('需要管理员权限', 403);
    const id = params.id;
    if (!id) return jsonError('Missing comment id', 400);
    const body = schema.parse(await readJson(request));
    return json({ comment: moderateComment(getDb(), id, body.status) });
  } catch (error) {
    if (error instanceof Response) return error;
    return jsonError(error instanceof Error ? error.message : '审核失败', 400);
  }
};
