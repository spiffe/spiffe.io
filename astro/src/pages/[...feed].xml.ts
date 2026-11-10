import { getCollection } from "astro:content";
import site from "../data/site.json";
const escape = (s: string) =>
  s.replace(
    /[<>&"']/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!,
  );
const sections = [
  { route: "/", title: "SPIFFE", description: "" },
  ...site.pages.filter((p) => p.section),
];
export function getStaticPaths() {
  return sections.map((section) => ({
    params: { feed: section.route.slice(1) + "index" },
    props: { section },
  }));
}
export async function GET({ props }) {
  const { section } = props;
  const routes = new Set(
    site.pages
      .filter((p) => !p.section && p.route.startsWith(section.route))
      .map((p) => p.route),
  );
  const posts = (await getCollection("docs"))
    .filter((p) => routes.has(`/${p.id}/`))
    .sort(
      (a, b) =>
        (b.data.date?.getTime() || 0) - (a.data.date?.getTime() || 0) ||
        a.data.title.localeCompare(b.data.title),
    );
  const blog = section.route === "/blog/";
  const title = blog
    ? "SPIFFE Blog"
    : section.route === "/"
      ? "SPIFFE"
      : `${section.title} on SPIFFE`;
  const items = posts
    .map(({ id, data }) => {
      const url = `https://spiffe.io/${id}/`;
      const description = blog
        ? data.description || data.summary
        : data.summary;
      return `<item><title>${escape(data.title)}</title><link>${url}</link><guid>${url}</guid><description>${escape(description || "")}</description>${data.date ? `<pubDate>${data.date.toUTCString()}</pubDate>` : ""}${data.author ? `<author>${escape(data.author)}</author>` : ""}</item>`;
    })
    .join("");
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${escape(title)}</title><link>https://spiffe.io${section.route}</link><description>${escape(section.description || `Recent content in ${title}`)}</description><language>en-us</language><atom:link href="https://spiffe.io${section.route}index.xml" rel="self" type="application/rss+xml"/>${items}</channel></rss>`,
    { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } },
  );
}
