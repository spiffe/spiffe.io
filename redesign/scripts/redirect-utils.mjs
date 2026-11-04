export const normalizeRoute = pathname => pathname.replace(/\/+$/, '') || '/';

export function redirectMap(redirects) {
  const routes = new Map();
  for (const [from, to] of Object.entries(redirects)) {
    const source = normalizeRoute(from);
    if (routes.has(source)) throw new Error(`Duplicate redirect route: ${from}`);
    const target = new URL(to, 'https://spiffe.io');
    if (target.origin !== 'https://spiffe.io') throw new Error(`External redirect destination: ${from} → ${to}`);
    routes.set(source, to);
  }
  for (const [from, to] of routes) {
    const next = normalizeRoute(new URL(to, 'https://spiffe.io').pathname);
    if (routes.has(next)) throw new Error(`Redirect chain or loop: ${from} → ${to}. Point directly to content.`);
  }
  return routes;
}

// Configured query values and fragments take precedence. Other inbound query
// parameters (including repeated values) and an unset fragment are preserved.
export function resolveRedirect(target, incoming) {
  const source = new URL(incoming);
  const destination = new URL(target, source);
  const configured = new Set(destination.searchParams.keys());
  for (const [key, value] of source.searchParams) {
    if (!configured.has(key)) destination.searchParams.append(key, value);
  }
  if (!destination.hash) destination.hash = source.hash;
  return destination;
}

export function redirectScript(target) {
  const encoded = JSON.stringify(target).replaceAll('<', '\\u003c');
  return `<script>location.replace((${resolveRedirect.toString()})(${encoded},location.href).href)</script>`;
}
