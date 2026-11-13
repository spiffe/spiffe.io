import { getContainerRenderer } from "@astrojs/mdx/container-renderer";
import { experimental_AstroContainer } from "astro/container";
import { loadRenderers } from "astro:container";
import { render } from "astro:content";
import {
  getPages,
  isSection,
  route,
  stripAnchors,
  type Page,
} from "../lib/content";
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
const container = await experimental_AstroContainer.create({
  renderers: await loadRenderers([getContainerRenderer()]),
});
// Rendering resolves MDX components and image placeholders that page.rendered still has.
// Hugo's automatic summaries end at the first paragraph after 70 words.
async function summary(page: Page) {
  const { Content } = await render(page);
  const html = stripAnchors(await container.renderToString(Content));
  const end = [...html.matchAll(/<\/p>/g)].find(
    (match) =>
      html
        .slice(0, match.index)
        .replace(/<[^>]*>/g, "")
        .trim()
        .split(/\s+/).length >= 70,
  );
  return html.slice(0, end ? end.index + 4 : undefined);
}
export async function getStaticPaths() {
  const pages = await getPages();
  const sections = [
    { route: "/", title: "SPIFFE", description: "" },
    ...pages
      .filter((p) => p.id !== "index" && isSection(p, pages))
      .map((p) => ({
        route: route(p),
        title: p.data.title,
        description: p.data.description || "",
      })),
  ];
  return sections.map((section) => ({
    params: { feed: section.route.slice(1) + "index" },
    props: { section, pages },
  }));
}
export async function GET({ props }) {
  const { section, pages } = props as {
    section: { route: string; title: string; description: string };
    pages: Page[];
  };
  const posts = pages
    .filter(
      (p) =>
        p.id !== "index" &&
        p.id !== "404" &&
        !isSection(p, pages) &&
        route(p).startsWith(section.route),
    )
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
  const items = (
    await Promise.all(
      posts.map(async (page) => {
        const { id, data } = page;
        const url = `https://spiffe.io/${id}/`;
        const description = blog
          ? data.description || (await summary(page))
          : await summary(page);
        return `<item><title>${escape(data.title)}</title><link>${url}</link><guid>${url}</guid><description>${escape(description || "")}</description>${data.date ? `<pubDate>${data.date.toUTCString()}</pubDate>` : ""}${data.author ? `<author>${escape(data.author)}</author>` : ""}</item>`;
      }),
    )
  ).join("");
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${escape(title)}</title><link>https://spiffe.io${section.route}</link><description>${escape(section.description || `Recent content in ${title}`)}</description><language>en-us</language><atom:link href="https://spiffe.io${section.route}index.xml" rel="self" type="application/rss+xml"/>${items}</channel></rss>`,
    { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } },
  );
}
