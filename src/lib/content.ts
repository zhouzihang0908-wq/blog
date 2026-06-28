import { getCollection, type CollectionEntry } from 'astro:content';

export type PostEntry = CollectionEntry<'posts'>;
export type ProjectEntry = CollectionEntry<'projects'>;

export function entrySlug(entry: { id: string }) {
  return entry.id.replace(/\\/g, '/').replace(/\.(mdx?|markdown)$/i, '');
}

export function sortByDate<T extends { data: { pubDate: Date; pinned?: boolean } }>(entries: T[]) {
  return entries.sort((a, b) => {
    if (a.data.pinned !== b.data.pinned) return a.data.pinned ? -1 : 1;
    return b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
  });
}

export async function getPublishedPosts() {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  return sortByDate(posts);
}

export async function getPublishedProjects() {
  const projects = await getCollection('projects', ({ data }) => !data.draft);
  return projects.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

export function readingTime(body = '') {
  const chineseChars = (body.match(/[\u4e00-\u9fff]/g) ?? []).length;
  const latinWords = (body.replace(/[\u4e00-\u9fff]/g, ' ').match(/[A-Za-z0-9_]+/g) ?? []).length;
  const minutes = Math.max(1, Math.ceil((chineseChars / 450) + (latinWords / 220)));
  return `${minutes} min read`;
}

export function slugify(value: string) {
  return value.trim().toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '') || 'untitled';
}

export async function getTagMap() {
  const posts = await getPublishedPosts();
  const map = new Map<string, PostEntry[]>();
  for (const post of posts) {
    for (const tag of post.data.tags) {
      const current = map.get(tag) ?? [];
      current.push(post);
      map.set(tag, current);
    }
  }
  return [...map.entries()].map(([tag, posts]) => ({ tag, slug: slugify(tag), posts })).sort((a, b) => a.tag.localeCompare(b.tag, 'zh-CN'));
}

export function groupPostsByYear(posts: PostEntry[]) {
  return posts.reduce<Record<string, PostEntry[]>>((acc, post) => {
    const year = String(post.data.pubDate.getFullYear());
    acc[year] ??= [];
    acc[year].push(post);
    return acc;
  }, {});
}
