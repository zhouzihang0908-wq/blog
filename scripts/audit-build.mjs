import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const required = [
  'index.html',
  'posts/index.html',
  'tags/index.html',
  'archive/index.html',
  'projects/index.html',
  'about/index.html',
  'search/index.html',
  '404.html',
  'rss.xml',
  'robots.txt',
  'pagefind/pagefind.js'
];

const missing = required.filter((file) => !existsSync(join(root, file)));
if (missing.length) {
  console.error('Missing build outputs:', missing.join(', '));
  process.exit(1);
}

const index = readFileSync(join(root, 'index.html'), 'utf8');
const checks = [
  ['canonical domain', 'https://blog.zzhgod.top'],
  ['Open Graph title', 'property="og:title"'],
  ['theme bootstrap', 'dataset.theme'],
  ['Notion shell marker', 'notion-shell']
];

const failed = checks.filter(([, needle]) => !index.includes(needle));
if (failed.length) {
  console.error('Failed HTML checks:', failed.map(([name]) => name).join(', '));
  process.exit(1);
}

const rss = readFileSync(join(root, 'rss.xml'), 'utf8');
if (!rss.includes('https://blog.zzhgod.top')) {
  console.error('RSS does not include production domain');
  process.exit(1);
}

const pagefindSize = statSync(join(root, 'pagefind/pagefind.js')).size;
if (pagefindSize < 1000) {
  console.error('Pagefind output looks incomplete');
  process.exit(1);
}

console.log('Build audit passed.');
