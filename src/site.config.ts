export const SITE = {
  title: 'zzhgod',
  name: 'zzhgod',
  url: 'https://blog.zzhgod.top',
  description: '记录 AI 工具、服务器运维、研究流程与个人项目的 Notion 风格知识库。',
  locale: 'zh-CN',
  author: 'zzhgod',
  email: 'hello@zzhgod.top',
  nav: [
    { label: '首页', href: '/' },
    { label: '文章', href: '/posts/' },
    { label: '项目', href: '/projects/' },
    { label: '归档', href: '/archive/' },
    { label: '关于', href: '/about/' },
    { label: '搜索', href: '/search/' }
  ],
  socials: [
    { label: 'GitHub', href: 'https://github.com/zhouzihang0908-wq' },
    { label: 'RSS', href: 'https://blog.zzhgod.top/rss.xml' }
  ]
} as const;
