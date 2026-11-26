import fs from "node:fs/promises";
import path from "node:path";
import {
  netlifyRedirects,
  redirectMap,
  redirectScript,
} from "./redirect-utils.mjs";
const redirects = JSON.parse(
  await fs.readFile("src/data/redirects.json", "utf8"),
);
redirectMap(redirects);
for (const [from, to] of Object.entries(redirects)) {
  const file = path.join("dist", from, "index.html");
  let html = await fs.readFile(file, "utf8");
  // Fallback for hosts without server-side redirects, such as astro preview.
  // Preserve inbound fragments in the client redirect, with Astro's meta
  // refresh as a no-JavaScript fallback.
  const script = redirectScript(to);
  html = html.replace("<body>", script + "<body>");
  await fs.writeFile(file, html);
}
// Netlify answers these routes with real HTTP 301s, so search engines see a
// permanent move rather than a noindexed page with a meta refresh.
await fs.writeFile("dist/_redirects", netlifyRedirects(redirects));

console.log(
  `Prepared ${Object.keys(redirects).length} HTTP and static redirects with fragment preservation.`,
);

// Static hosts use the root 404.html for missing routes.
await fs.copyFile("dist/404/index.html", "dist/404.html");

// Preserve the sitemap URL advertised by the current site.
await fs.copyFile("dist/sitemap-index.xml", "dist/sitemap.xml");
