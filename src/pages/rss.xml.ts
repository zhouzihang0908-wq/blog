export const prerender = true;
import rss from '@astrojs/rss';
import { entrySlug, getPublishedPosts } from '../lib/content';
import { SITE } from '../site.config';

export async function GET(context: { site?: URL }) {
  const posts = await getPublishedPosts();
  return rss({
    title: `${SITE.title} - 个人博客与技术笔记`,
    description: SITE.description,
    site: context.site ?? SITE.url,
    customData: '<language>zh-CN</language>',
    items: posts.map((post) => ({ title: post.data.title, description: post.data.description, pubDate: post.data.pubDate, link: `/posts/${entrySlug(post)}/`, categories: post.data.tags }))
  });
}
