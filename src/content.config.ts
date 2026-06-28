import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    category: z.string().optional(),
    cover: z.string().optional(),
    draft: z.boolean().default(false),
    pinned: z.boolean().default(false),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional()
  })
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    status: z.enum(['active', 'done', 'archived']).default('active'),
    repo: z.string().url().optional(),
    demo: z.string().url().optional(),
    cover: z.string().optional(),
    draft: z.boolean().default(false)
  })
});

export const collections = { posts, projects };
