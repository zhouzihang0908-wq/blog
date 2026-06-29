import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { migrate } from './db';
import { createUser } from './users';
import { getPostInteractions, listFavoriteSlugs, setPostFavorite, setPostLike } from './interactions';

let db: Database.Database;
let userId: string;

beforeEach(async () => {
  db = new Database(':memory:');
  migrate(db);
  const user = await createUser(db, { email: 'reader@example.com', name: 'Reader', password: 'password123' });
  userId = user.id;
});

afterEach(() => {
  db.close();
});

describe('post interactions', () => {
  it('counts likes idempotently per user and post', () => {
    expect(getPostInteractions(db, 'welcome', userId)).toMatchObject({ likeCount: 0, liked: false });

    setPostLike(db, userId, 'welcome', true);
    setPostLike(db, userId, 'welcome', true);
    expect(getPostInteractions(db, 'welcome', userId)).toMatchObject({ likeCount: 1, liked: true });

    setPostLike(db, userId, 'welcome', false);
    expect(getPostInteractions(db, 'welcome', userId)).toMatchObject({ likeCount: 0, liked: false });
  });

  it('counts favorites idempotently and lists a user favorites newest first', () => {
    setPostFavorite(db, userId, 'welcome', true);
    setPostFavorite(db, userId, 'welcome', true);
    setPostFavorite(db, userId, 'server-notes', true);

    expect(getPostInteractions(db, 'welcome', userId)).toMatchObject({ favoriteCount: 1, favorited: true });
    expect(listFavoriteSlugs(db, userId)).toEqual(['server-notes', 'welcome']);

    setPostFavorite(db, userId, 'welcome', false);
    expect(getPostInteractions(db, 'welcome', userId)).toMatchObject({ favoriteCount: 0, favorited: false });
    expect(listFavoriteSlugs(db, userId)).toEqual(['server-notes']);
  });
});
