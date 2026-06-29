import type { APIRoute } from 'astro';
import { deleteComment } from '../../../lib/server/comments';
import { getDb } from '../../../lib/server/db';
import { assertSameOrigin, json, jsonError } from '../../../lib/server/http';

export const prerender = false;

export const DELETE: APIRoute = async ({ params, request, url, locals }) => {
  try {
    assertSameOrigin(request, url);
    if (!locals.user) return jsonError('请先登录后再删除评论', 401);
    const id = params.id;
    if (!id) return jsonError('Missing comment id', 400);

    return json({ ok: true, result: deleteComment(getDb(), id, { id: locals.user.id, role: locals.user.role }) });
  } catch (error) {
    if (error instanceof Response) return error;
    if (error instanceof Error && /not found/i.test(error.message)) return jsonError('评论不存在', 404);
    if (error instanceof Error && /permission/i.test(error.message)) return jsonError('没有权限删除这条评论', 403);
    return jsonError(error instanceof Error ? error.message : '删除评论失败', 400);
  }
};
