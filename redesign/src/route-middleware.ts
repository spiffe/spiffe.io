import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import { imageMetadata, inferRemoteSize } from 'astro/assets/utils';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const imageOrigin = process.env.CONTEXT === 'deploy-preview' && process.env.DEPLOY_PRIME_URL
  ? process.env.DEPLOY_PRIME_URL
  : 'https://spiffe.io';
const imageCache = new Map<string, ReturnType<typeof imageMetadata>>();

export const onRequest = defineRouteMiddleware(async (context) => {
  const route = context.locals.starlightRoute;
  const path = context.url.pathname;
  if (path.startsWith('/blog/')) {
    route.hasSidebar = false;
    route.toc = undefined;
  }
  const { image, imageAlt, title } = route.entry.data;
  const isDocs = path.startsWith('/docs/');
  const imageUrl = new URL(image || (isDocs ? '/social-docs-v1.png' : '/social-wide-v2.png'), imageOrigin);
  const alt = image ? imageAlt || title : isDocs ? 'SPIFFE logo.' : 'SPIFFE: Identity workloads can prove.';
  if (!imageCache.has(imageUrl.href)) {
    imageCache.set(imageUrl.href, imageUrl.origin === new URL(imageOrigin).origin
      ? readFile(resolve('public', '.' + decodeURIComponent(imageUrl.pathname))).then(data => imageMetadata(data, imageUrl.href))
      : inferRemoteSize(imageUrl.href));
  }
  const { width, height, format } = await imageCache.get(imageUrl.href)!;
  const mime = `image/${format === 'jpg' ? 'jpeg' : format === 'svg' ? 'svg+xml' : format}`;
  route.head = route.head.filter(({ tag, attrs }) => tag !== 'meta' ||
    ![attrs?.property, attrs?.name].some(key => typeof key === 'string' &&
      (key === 'twitter:card' || /^og:image(?::|$)|^twitter:image(?::|$)/.test(key))));
  route.head.push(
    { tag: 'meta', attrs: { property: 'og:image', content: imageUrl.href } },
    { tag: 'meta', attrs: { property: 'og:image:width', content: String(width) } },
    { tag: 'meta', attrs: { property: 'og:image:height', content: String(height) } },
    { tag: 'meta', attrs: { property: 'og:image:type', content: mime } },
    { tag: 'meta', attrs: { property: 'og:image:alt', content: alt } },
    { tag: 'meta', attrs: { name: 'twitter:card', content: width > height ? 'summary_large_image' : 'summary' } },
    { tag: 'meta', attrs: { name: 'twitter:image', content: imageUrl.href } },
    { tag: 'meta', attrs: { name: 'twitter:image:alt', content: alt } },
  );
  const section = path.startsWith('/docs/spiffe') ? 'SPIFFE' : path.startsWith('/docs/spire') ? 'SPIRE' : 'Project';
  const group = route.sidebar.find((item) => item.type === 'group' && item.label === section);
  if (group?.type === 'group') route.sidebar = group.entries;
  // Prevent automatically generated next/previous links crossing project boundaries.
  route.pagination = { prev: undefined, next: undefined };
});
