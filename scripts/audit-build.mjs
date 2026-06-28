import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
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

const read = (file) => readFileSync(join(root, file), 'utf8');
const index = read('index.html');
const checks = [
  ['canonical domain', 'https://blog.zzhgod.top'],
  ['Open Graph title', 'property="og:title"'],
  ['absolute RSS alternate', 'href="https://blog.zzhgod.top/rss.xml"'],
  ['theme bootstrap', 'dataset.theme'],
  ['Notion shell marker', 'notion-shell']
];

const failed = checks.filter(([, needle]) => !index.includes(needle));
if (failed.length) {
  console.error('Failed HTML checks:', failed.map(([name]) => name).join(', '));
  process.exit(1);
}

const rss = read('rss.xml');
if (!rss.includes('https://blog.zzhgod.top')) {
  console.error('RSS does not include production domain');
  process.exit(1);
}

const sitemapIndex = read('sitemap-index.xml');
if (!sitemapIndex.includes('https://blog.zzhgod.top/sitemap-0.xml')) {
  console.error('Sitemap index does not use production domain');
  process.exit(1);
}

const sitemap = read('sitemap-0.xml');
for (const forbidden of ['/404', '/search', 'draft']) {
  if (sitemap.includes(forbidden)) {
    console.error(`Sitemap includes forbidden entry: ${forbidden}`);
    process.exit(1);
  }
}

const forbiddenDraftNeedles = ['Draft example', 'draft-example', 'This draft should'];
const htmlFiles = [];
const walk = (dir, prefix = '') => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, rel);
    else if (entry.isFile() && rel.endsWith('.html')) htmlFiles.push(rel);
  }
};
walk(root);
for (const file of htmlFiles) {
  const html = read(file);
  for (const needle of forbiddenDraftNeedles) {
    if (html.includes(needle)) {
      console.error(`Draft content leaked into ${file}`);
      process.exit(1);
    }
  }
}

const pagefindMeta = read('pagefind/pagefind-entry.json');
for (const needle of ['draft-example', 'Draft example']) {
  if (pagefindMeta.includes(needle)) {
    console.error(`Draft content leaked into Pagefind metadata: ${needle}`);
    process.exit(1);
  }
}

const pagefindSize = statSync(join(root, 'pagefind/pagefind.js')).size;
if (pagefindSize < 1000) {
  console.error('Pagefind output looks incomplete');
  process.exit(1);
}

console.log('Build audit passed.');
