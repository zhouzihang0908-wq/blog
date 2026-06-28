# zzhgod Notion 风格个人博客

这是部署在 `https://blog.zzhgod.top` 的 Astro + MDX + Tailwind + Pagefind 静态博客。

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

在 `src/content/posts/` 添加 `.mdx` 文件。生产构建会排除 `draft: true` 的草稿。

## Deployment

GitHub Actions 会构建 `main` 分支，上传到 `/opt/proxy/blog/releases/<version>`，再更新 `/opt/proxy/blog/current`。

需要的 GitHub Secrets：

- `BLOG_SSH_HOST`
- `BLOG_SSH_PORT`
- `BLOG_SSH_USER`
- `BLOG_SSH_KEY_B64`
