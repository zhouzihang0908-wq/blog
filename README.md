# zzhgod Notion-style personal blog

Astro + MDX + Tailwind + Pagefind static blog for `https://blog.zzhgod.top`.

## Development

```bash
pnpm install
pnpm dev
```

## Checks

```bash
pnpm check
pnpm build
pnpm audit:build
```

## Writing

Add `.mdx` files in `src/content/posts/`. Production builds exclude posts with `draft: true`.

## Deployment

GitHub Actions builds `main`, uploads to `/opt/proxy/blog/releases/<version>`, then updates `/opt/proxy/blog/current`.

Required GitHub Secrets:

- `BLOG_SSH_HOST`
- `BLOG_SSH_PORT`
- `BLOG_SSH_USER`
- `BLOG_SSH_KEY`
