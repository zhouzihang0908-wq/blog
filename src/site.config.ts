export const SITE = {
  title: 'zzhgod',
  name: 'zzhgod',
  url: 'https://blog.zzhgod.top',
  description: 'A personal knowledge base for AI tools, server operations, research notes, and projects.',
  locale: 'zh-CN',
  author: 'zzhgod',
  email: 'hello@zzhgod.top',
  nav: [
    { label: 'Home', href: '/' },
    { label: 'Posts', href: '/posts/' },
    { label: 'Projects', href: '/projects/' },
    { label: 'Archive', href: '/archive/' },
    { label: 'About', href: '/about/' },
    { label: 'Search', href: '/search/' }
  ],
  socials: [
    { label: 'GitHub', href: 'https://github.com/zhouzihang0908-wq' },
    { label: 'RSS', href: 'https://blog.zzhgod.top/rss.xml' }
  ]
} as const;
