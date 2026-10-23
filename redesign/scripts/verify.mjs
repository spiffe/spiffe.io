import fs from 'node:fs/promises';
import path from 'node:path';
import { existsSync, statSync } from 'node:fs';
import { normalizeRoute, redirectMap, resolveRedirect, redirectScript } from './redirect-utils.mjs';

const root = path.resolve('dist');
const redirects = JSON.parse(await fs.readFile('src/data/redirects.json', 'utf8'));
const redirectRoutes = redirectMap(redirects);
const legacy = JSON.parse(await fs.readFile('src/data/legacy-routes.json', 'utf8'));
const files = [];
async function walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(file); else files.push(file);
  }
}
await walk(root);
const existing = new Set(files);
const caseAliases = new Map(files.map(file => [file.toLowerCase(), file]));
const pages = new Map();
const ids = new Map();
const errors = new Set();
const decode = s => s.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'")
  .replace(/&#(x[\da-f]+|\d+);/gi, (_, n) => String.fromCodePoint(n[0].toLowerCase() === 'x' ? parseInt(n.slice(1), 16) : Number(n)));
const routeFile = pathname => {
  let file = path.join(root, decodeURIComponent(pathname));
  if (pathname.endsWith('/') || (existsSync(file) ? statSync(file).isDirectory() : !path.extname(file))) file = path.join(file, 'index.html');
  return existing.has(file) || !existsSync(file) ? file : caseAliases.get(file.toLowerCase()) || file;
};
function destination(url) {
  const target = redirectRoutes.get(normalizeRoute(url.pathname));
  return target ? resolveRedirect(target, url.href) : url;
}
for (const file of files.filter(f => f.endsWith('.html'))) {
  const html = await fs.readFile(file, 'utf8');
  pages.set(file, html);
  const pageIds = new Set();
  for (const match of html.matchAll(/\sid=["']([^"']+)["']/g)) {
    const id = decode(match[1]);
    if (pageIds.has(id)) errors.add(`${path.relative(root, file)}: duplicate id ${id}`);
    pageIds.add(id);
  }
  ids.set(file, pageIds);
  if (/@@SPIRE_|\{\{[<%]|\{#[\w-]+\}/.test(html)) errors.add(`${path.relative(root, file)}: unrendered source token`);
  if (!/<title>[^<]+<\/title>/.test(html)) errors.add(`${file}: missing title`);
}
let links = 0;
function check(ref, route, allowRedirect = false) {
  const url = new URL(ref, 'https://spiffe.io' + route);
  if (url.origin !== 'https://spiffe.io') return;
  links++;
  if (!allowRedirect && redirectRoutes.has(normalizeRoute(url.pathname))) errors.add(`${route}: link to redirect ${ref}; use its final destination`);
  const original = routeFile(url.pathname);
  if (!existing.has(original)) { errors.add(`${route}: missing file ${ref}`); return; }
  const target = destination(url);
  const file = routeFile(target.pathname);
  if (!existing.has(file)) errors.add(`${route}: missing redirect destination ${ref}`);
  if (target.hash && ids.has(file) && !ids.get(file).has(decodeURIComponent(target.hash.slice(1)))) errors.add(`${route}: missing anchor ${ref}`);
}
for (const [file, html] of pages) {
  const route = '/' + path.relative(root, file).replace(/index\.html$/, '');
  for (const match of html.matchAll(/\s(?:href|src)=["']([^"']*)["']/g)) {
    const ref = decode(match[1]);
    if (ref && !/^(?:mailto:|tel:|data:|javascript:)/.test(ref)) check(ref, route);
  }
}
for (const route of legacy.paths) check(route, '/', true);
for (const [route, fragments] of Object.entries(legacy.fragments)) for (const fragment of fragments) check(`${route}#${fragment}`, '/', true);
for (const from of Object.keys(redirects)) {
  check(from, '/', true);
  const html = pages.get(routeFile(from));
  if (!html?.includes(redirectScript(redirects[from]))) errors.add(`${from}: redirect must preserve query and fragment`);
}
if (!existing.has(path.join(root, 'pagefind/pagefind.js'))) errors.add('Missing Pagefind search index');
if (errors.size) { console.error([...errors].join('\n')); process.exit(1); }
console.log(`Verified ${pages.size} HTML pages, ${links} internal references, ${Object.keys(redirects).length} redirects and ${legacy.paths.length} legacy routes.`);
