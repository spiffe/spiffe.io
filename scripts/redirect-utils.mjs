export const normalizeRoute = (pathname) => pathname.replace(/\/+$/, "") || "/";

export function redirectMap(redirects) {
  const routes = new Map();
  for (const [from, to] of Object.entries(redirects)) {
    const source = normalizeRoute(from);
    if (routes.has(source))
      throw new Error(`Duplicate redirect route: ${from}`);
    const target = new URL(to, "https://spiffe.io");
    if (target.origin !== "https://spiffe.io")
      throw new Error(`External redirect destination: ${from} → ${to}`);
    routes.set(source, to);
  }
  for (const [from, to] of routes) {
    const next = normalizeRoute(new URL(to, "https://spiffe.io").pathname);
    if (routes.has(next))
      throw new Error(
        `Redirect chain or loop: ${from} → ${to}. Point directly to content.`,
      );
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

// Rewrites a site link that hits a redirect to its destination, so pages link
// straight to content. Other links, including relative ones, are unchanged.
export function currentLink(href, routes) {
  if (!/^(?:\/(?!\/)|https:\/\/spiffe\.io\/)/.test(href)) return href;
  const url = new URL(href, "https://spiffe.io");
  const target = routes.get(normalizeRoute(url.pathname));
  if (!target) return href;
  const to = resolveRedirect(target, url.href);
  const origin = href.startsWith("/") ? "" : to.origin;
  return origin + to.pathname + to.search + to.hash;
}

// Netlify serves these as HTTP 301s ahead of the static stub pages ("!" forces
// the rule even though a file exists). Its edge normalises trailing slashes
// before matching and passes the inbound query string through; browsers keep
// the fragment across the redirect.
export function netlifyRedirects(redirects) {
  return Object.entries(redirects)
    .map(([from, to]) => `${normalizeRoute(from)} ${to} 301!\n`)
    .join("");
}

export function redirectScript(target) {
  const encoded = JSON.stringify(target).replaceAll("<", "\\u003c");
  return `<script>location.replace((${resolveRedirect.toString()})(${encoded},location.href).href)</script>`;
}
