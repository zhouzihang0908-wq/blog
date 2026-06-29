import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createComment, deleteComment, listCommentsForPost, moderateComment } from './comments';
import { migrate } from './db';
import { createUser } from './users';

let db: Database.Database;
let readerId: string;
let adminId: string;
let otherUserId: string;

beforeEach(async () => {
  db = new Database(':memory:');
  migrate(db);
  const reader = await createUser(db, { email: 'reader@example.com', name: 'Reader', password: 'password123' });
  const admin = await createUser(db, { email: 'admin@example.com', name: 'Admin', password: 'password123', role: 'admin' });
  const otherUser = await createUser(db, { email: 'other@example.com', name: 'Other', password: 'password123' });
  readerId = reader.id;
  adminId = admin.id;
  otherUserId = otherUser.id;
});

afterEach(() => {
  db.close();
});

describe('comments', () => {
  it('stores non-admin comments as pending and only exposes them to the author or admins', () => {
    const pending = createComment(db, {
      postSlug: 'welcome',
      userId: readerId,
      body: '这是一条等待审核的评论。'
    });

    expect(pending.status).toBe('pending');
    expect(listCommentsForPost(db, 'welcome', null)).toHaveLength(0);
    expect(listCommentsForPost(db, 'welcome', { id: readerId, role: 'user' })).toHaveLength(1);
    expect(listCommentsForPost(db, 'welcome', { id: adminId, role: 'admin' })).toHaveLength(1);
  });

  it('publishes approved comments and supports exactly one reply level', () => {
    const root = createComment(db, { postSlug: 'welcome', userId: readerId, body: 'Root comment' });
    moderateComment(db, root.id, 'approved');

    const reply = createComment(db, { postSlug: 'welcome', userId: adminId, parentId: root.id, body: 'Thanks!' });
    expect(reply.parentId).toBe(root.id);
    expect(reply.status).toBe('approved');

    expect(() => createComment(db, { postSlug: 'welcome', userId: readerId, parentId: reply.id, body: 'Nested reply' })).toThrow(/one reply level/i);

    const comments = listCommentsForPost(db, 'welcome', null);
    expect(comments).toHaveLength(1);
    expect(comments[0].replies).toHaveLength(1);
    expect(comments[0].replies[0].body).toBe('Thanks!');
  });

  it('rejects empty or overlong comment bodies', () => {
    expect(() => createComment(db, { postSlug: 'welcome', userId: readerId, body: '   ' })).toThrow(/comment body/i);
    expect(() => createComment(db, { postSlug: 'welcome', userId: readerId, body: 'x'.repeat(2001) })).toThrow(/comment body/i);
  });

  it('lets users delete their own comments', () => {
    const comment = createComment(db, { postSlug: 'welcome', userId: readerId, body: 'I should be able to remove this.' });

    const result = deleteComment(db, comment.id, { id: readerId, role: 'user' });

    expect(result.deleted).toBe(true);
    expect(listCommentsForPost(db, 'welcome', { id: readerId, role: 'user' })).toHaveLength(0);
  });

  it('rejects deleting another user comment for normal users', () => {
    const comment = createComment(db, { postSlug: 'welcome', userId: readerId, body: 'Only my author or an admin can delete this.' });

    expect(() => deleteComment(db, comment.id, { id: otherUserId, role: 'user' })).toThrow(/permission/i);
    expect(listCommentsForPost(db, 'welcome', { id: readerId, role: 'user' })).toHaveLength(1);
  });

  it('lets admins delete any user comment', () => {
    const comment = createComment(db, { postSlug: 'welcome', userId: readerId, body: 'Admin can remove this.' });

    const result = deleteComment(db, comment.id, { id: adminId, role: 'admin' });

    expect(result.deleted).toBe(true);
    expect(listCommentsForPost(db, 'welcome', { id: adminId, role: 'admin' })).toHaveLength(0);
  });

  it('deletes replies when a parent comment is deleted', () => {
    const root = createComment(db, { postSlug: 'welcome', userId: adminId, body: 'Root comment' });
    const reply = createComment(db, { postSlug: 'welcome', userId: readerId, parentId: root.id, body: 'Reply comment' });

    expect(listCommentsForPost(db, 'welcome', { id: adminId, role: 'admin' })[0].replies[0].id).toBe(reply.id);

    deleteComment(db, root.id, { id: adminId, role: 'admin' });

    expect(listCommentsForPost(db, 'welcome', { id: adminId, role: 'admin' })).toHaveLength(0);
  });
});
