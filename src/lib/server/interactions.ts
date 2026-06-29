import type Database from 'better-sqlite3';
import { normalizeSlug, nowIso } from './utils';

export interface PostInteractions {
  likeCount: number;
  favoriteCount: number;
  liked: boolean;
  favorited: boolean;
}

export function setPostLike(db: Database.Database, userId: string, postSlug: string, liked: boolean) {
  const slug = normalizeSlug(postSlug);
  if (liked) {
    db.prepare('INSERT OR IGNORE INTO post_likes (user_id, post_slug, created_at) VALUES (?, ?, ?)').run(userId, slug, nowIso());
  } else {
    db.prepare('DELETE FROM post_likes WHERE user_id = ? AND post_slug = ?').run(userId, slug);
  }
  return getPostInteractions(db, slug, userId);
}

export function setPostFavorite(db: Database.Database, userId: string, postSlug: string, favorited: boolean) {
  const slug = normalizeSlug(postSlug);
  if (favorited) {
    db.prepare('INSERT OR IGNORE INTO post_favorites (user_id, post_slug, created_at) VALUES (?, ?, ?)').run(userId, slug, nowIso());
  } else {
    db.prepare('DELETE FROM post_favorites WHERE user_id = ? AND post_slug = ?').run(userId, slug);
  }
  return getPostInteractions(db, slug, userId);
}

export function getPostInteractions(db: Database.Database, postSlug: string, userId?: string | null): PostInteractions {
  const slug = normalizeSlug(postSlug);
  const likeCount = (db.prepare('SELECT COUNT(*) AS count FROM post_likes WHERE post_slug = ?').get(slug) as { count: number }).count;
  const favoriteCount = (db.prepare('SELECT COUNT(*) AS count FROM post_favorites WHERE post_slug = ?').get(slug) as { count: number }).count;
  const liked = Boolean(userId && db.prepare('SELECT 1 FROM post_likes WHERE user_id = ? AND post_slug = ?').get(userId, slug));
  const favorited = Boolean(userId && db.prepare('SELECT 1 FROM post_favorites WHERE user_id = ? AND post_slug = ?').get(userId, slug));

  return { likeCount, favoriteCount, liked, favorited };
}

export function listFavoriteSlugs(db: Database.Database, userId: string) {
  const rows = db.prepare(`
    SELECT post_slug FROM post_favorites
    WHERE user_id = ?
    ORDER BY created_at DESC, rowid DESC
  `).all(userId) as Array<{ post_slug: string }>;
  return rows.map((row) => row.post_slug);
}
