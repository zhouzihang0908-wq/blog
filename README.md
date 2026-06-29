# zzhgod Notion 风格个人博客

这是部署在 `https://blog.zzhgod.top` 的 Astro + MDX + Tailwind + Pagefind 博客。当前版本已升级为 Astro SSR/Node 应用，支持用户登录注册、评论、点赞和收藏。

## Development

```bash
pnpm install
pnpm dev
```

本地开发默认使用 `.data/blog.sqlite`。生产环境变量可以参考 `.env.example`：

- `BLOG_DB_PATH`：SQLite 数据库路径
- `BLOG_SESSION_SECRET`：用于会话签名的随机密钥
- `BLOG_PUBLIC_ORIGIN`：公网访问地址，例如 `https://blog.zzhgod.top`
- `BLOG_ADMIN_EMAIL` / `BLOG_ADMIN_PASSWORD`：首次迁移时创建或提升管理员账号

## Checks

```bash
pnpm test
pnpm check
pnpm build
pnpm audit:build
```

## Writing

在 `src/content/posts/` 添加 `.mdx` 文章。生产构建会排除 `draft: true` 的草稿。

## Interactions

- 邮箱密码注册和登录
- HttpOnly Cookie 会话
- 文章点赞和收藏
- 评论与一级回复
- 非管理员评论默认进入 `pending` 审核状态，通过后变为 `approved`
- 管理员可以访问 `/admin/comments/` 审核评论

## Deployment

GitHub Actions 会构建 SSR release，上传到 `/opt/proxy/blog/releases/<version>`，安装生产依赖，运行 `scripts/migrate-db.mjs`，再更新 `/opt/proxy/blog/current` 并重启 `blog` Docker 容器。

部署前需要配置：

1. `/opt/proxy/blog/.env`：参考 `.env.example`
2. Nginx：参考 `deploy/nginx/blog.zzhgod.top.conf.example`
3. GitHub Secrets：
   - `BLOG_SSH_HOST`
   - `BLOG_SSH_PORT`
   - `BLOG_SSH_USER`
   - `BLOG_SSH_KEY_B64`

生产入口：

```bash
node dist/server/entry.mjs
```
