import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://blog.zzhgod.top',
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/404') && !page.includes('/search')
    })
  ],
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark'
      },
      wrap: true
    }
  },
  build: {
    format: 'directory'
  },
  prefetch: true
});
