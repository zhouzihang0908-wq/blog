import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createComment, listCommentsForPost, moderateComment } from './comments';
import { migrate } from './db';
import { createUser } from './users';

let db: Database.Database;
let readerId: string;
let adminId: string;

beforeEach(async () => {
  db = new Database(':memory:');
  migrate(db);
  const reader = await createUser(db, { email: 'reader@example.com', name: 'Reader', password: 'password123' });
  const admin = await createUser(db, { email: 'admin@example.com', name: 'Admin', password: 'password123', role: 'admin' });
  readerId = reader.id;
  adminId = admin.id;
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
});
