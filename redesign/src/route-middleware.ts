import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
export const onRequest = defineRouteMiddleware((context) => {
  const route = context.locals.starlightRoute;
  const path = context.url.pathname;
  const section = path.startsWith('/docs/spiffe') ? 'SPIFFE' : path.startsWith('/docs/spire') ? 'SPIRE' : 'Project';
  const group = route.sidebar.find((item) => item.type === 'group' && item.label === section);
  if (group?.type === 'group') route.sidebar = group.entries;
  // Prevent automatically generated next/previous links crossing project boundaries.
  route.pagination = { prev: undefined, next: undefined };
});
