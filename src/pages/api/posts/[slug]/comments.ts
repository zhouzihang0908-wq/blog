import type { APIRoute } from 'astro';
import { z } from 'zod';
import { createComment, listCommentsForPost } from '../../../../lib/server/comments';
import { getDb } from '../../../../lib/server/db';
import { assertSameOrigin, json, jsonError, readJson } from '../../../../lib/server/http';

export const prerender = false;

const schema = z.object({
  body: z.string(),
  parentId: z.string().optional().nullable()
});

export const GET: APIRoute = async ({ params, locals }) => {
  const slug = params.slug;
  if (!slug) return jsonError('Missing post slug', 400);
  const viewer = locals.user ? { id: locals.user.id, role: locals.user.role } : null;
  return json({ comments: listCommentsForPost(getDb(), slug, viewer) });
};

export const POST: APIRoute = async ({ params, request, url, locals }) => {
  try {
    assertSameOrigin(request, url);
    if (!locals.user) return jsonError('请先登录后评论', 401);
    const slug = params.slug;
    if (!slug) return jsonError('Missing post slug', 400);
    const body = schema.parse(await readJson(request));
    const comment = createComment(getDb(), {
      postSlug: slug,
      userId: locals.user.id,
      body: body.body,
      parentId: body.parentId
    });
    return json({ comment, message: comment.status === 'pending' ? '评论已提交，审核通过后公开显示。' : '评论已发布。' }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    return jsonError(error instanceof Error ? error.message : '评论失败', 400);
  }
};
