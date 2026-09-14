import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { loadEnv } from 'vite';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const frontendDirectory = resolve(currentDirectory, '..');
const distDirectory = resolve(frontendDirectory, 'dist');
const environment = loadEnv(process.env.NODE_ENV ?? 'production', frontendDirectory, 'VITE_');

const configuredUrl =
  process.env.VITE_SITE_URL ||
  environment.VITE_SITE_URL ||
  process.env.URL ||
  process.env.DEPLOY_PRIME_URL ||
  'http://localhost:5173';

function normalizeSiteUrl(value) {
  const parsed = new URL(value);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('VITE_SITE_URL must use http or https.');
  }
  return parsed.origin;
}

const siteUrl = normalizeSiteUrl(configuredUrl);
const indexPath = resolve(distDirectory, 'index.html');
const robotsPath = resolve(distDirectory, 'robots.txt');
const sitemapPath = resolve(distDirectory, 'sitemap.xml');

const [indexHtml] = await Promise.all([readFile(indexPath, 'utf8')]);

await Promise.all([
  writeFile(indexPath, indexHtml.replaceAll('__MATCHMYSIZE_SITE_URL__', siteUrl), 'utf8'),
  writeFile(
    robotsPath,
    `User-agent: *\nAllow: /\nDisallow: /app/\nDisallow: /auth/\nDisallow: /seller/\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
    'utf8',
  ),
  writeFile(
    sitemapPath,
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${siteUrl}/</loc>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n</urlset>\n`,
    'utf8',
  ),
]);

console.log(`Generated sitemap and robots.txt for ${siteUrl}`);
