import type Database from 'better-sqlite3';
import { z } from 'zod';
import type { CommentViewer, UserRole } from './types';
import { newId, normalizeSlug, nowIso } from './utils';

export type CommentStatus = 'pending' | 'approved' | 'rejected';

export interface CommentNode {
  id: string;
  postSlug: string;
  userId: string;
  parentId: string | null;
  body: string;
  status: CommentStatus;
  createdAt: string;
  updatedAt: string;
  authorName: string;
  authorRole: UserRole;
  replies: CommentNode[];
}

interface CommentRow {
  id: string;
  post_slug: string;
  user_id: string;
  parent_id: string | null;
  body: string;
  status: CommentStatus;
  created_at: string;
  updated_at: string;
  author_name: string;
  author_role: UserRole;
}

const bodySchema = z.string().trim().min(1, 'Comment body is required').max(2000, 'Comment body is too long');
const statusSchema = z.enum(['approved', 'rejected']);

function rowToComment(row: CommentRow): CommentNode {
  return {
    id: row.id,
    postSlug: row.post_slug,
    userId: row.user_id,
    parentId: row.parent_id,
    body: row.body,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    authorName: row.author_name,
    authorRole: row.author_role,
    replies: []
  };
}

function getCommentRow(db: Database.Database, id: string) {
  return db.prepare(`
    SELECT comments.*, users.name AS author_name, users.role AS author_role
    FROM comments
    JOIN users ON users.id = comments.user_id
    WHERE comments.id = ?
  `).get(id) as CommentRow | undefined;
}

function getUserRole(db: Database.Database, userId: string) {
  const row = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as { role: UserRole } | undefined;
  if (!row) throw new Error('User not found');
  return row.role;
}

export function createComment(db: Database.Database, input: { postSlug: string; userId: string; body: string; parentId?: string | null }) {
  const postSlug = normalizeSlug(input.postSlug);
  const body = bodySchema.parse(input.body);
  const role = getUserRole(db, input.userId);
  const timestamp = nowIso();
  const id = newId('cmt');
  let parentId = input.parentId || null;

  if (parentId) {
    const parent = getCommentRow(db, parentId);
    if (!parent) throw new Error('Parent comment not found');
    if (parent.post_slug !== postSlug) throw new Error('Parent comment belongs to another post');
    if (parent.parent_id) throw new Error('Comments support exactly one reply level');
  }

  const status: CommentStatus = role === 'admin' ? 'approved' : 'pending';
  db.prepare(`
    INSERT INTO comments (id, post_slug, user_id, parent_id, body, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, postSlug, input.userId, parentId, body, status, timestamp, timestamp);

  return rowToComment(getCommentRow(db, id)!);
}

export function moderateComment(db: Database.Database, id: string, status: 'approved' | 'rejected') {
  const parsed = statusSchema.parse(status);
  db.prepare('UPDATE comments SET status = ?, updated_at = ? WHERE id = ?').run(parsed, nowIso(), id);
  const row = getCommentRow(db, id);
  if (!row) throw new Error('Comment not found');
  return rowToComment(row);
}

export function listCommentsForPost(db: Database.Database, postSlug: string, viewer: CommentViewer | null) {
  const slug = normalizeSlug(postSlug);
  const rows = db.prepare(`
    SELECT comments.*, users.name AS author_name, users.role AS author_role
    FROM comments
    JOIN users ON users.id = comments.user_id
    WHERE comments.post_slug = ?
    ORDER BY comments.created_at ASC, comments.rowid ASC
  `).all(slug) as CommentRow[];

  const visible = rows.filter((row) => {
    if (viewer?.role === 'admin') return true;
    if (row.status === 'approved') return true;
    return Boolean(viewer && row.user_id === viewer.id);
  }).map(rowToComment);

  const byId = new Map(visible.map((comment) => [comment.id, comment]));
  const roots: CommentNode[] = [];

  for (const comment of visible) {
    if (comment.parentId && byId.has(comment.parentId)) {
      byId.get(comment.parentId)!.replies.push(comment);
    } else if (!comment.parentId) {
      roots.push(comment);
    }
  }

  return roots;
}

export function listCommentsForAdmin(db: Database.Database, status?: CommentStatus) {
  const rows = db.prepare(`
    SELECT comments.*, users.name AS author_name, users.role AS author_role
    FROM comments
    JOIN users ON users.id = comments.user_id
    ${status ? 'WHERE comments.status = ?' : ''}
    ORDER BY comments.created_at DESC, comments.rowid DESC
  `).all(...(status ? [status] : [])) as CommentRow[];
  return rows.map(rowToComment);
}
