import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import { getCollection, type CollectionEntry } from "astro:content";
import YAML from "yaml";

export type Page = CollectionEntry<"docs">;

export const escape = (value: unknown) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );

const renderer = await createMarkdownProcessor({
  smartypants: { dashes: "oldschool" },
  syntaxHighlight: false,
});
export const markdown = async (text?: string) =>
  (await renderer.render(text || "")).code;
export const inline = async (text?: string) =>
  (await markdown(text)).replace(/^<p>|<\/p>\s*$/g, "");

export const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .replace(/\s+/g, "-");

type Weighted = { weight?: number; title?: string; name?: string };
export const order = (a: Weighted, b: Weighted) =>
  (a.weight || 0) - (b.weight || 0) ||
  (a.title || a.name || "").localeCompare(b.title || b.name || "");
export const pageOrder = (a: Page, b: Page) =>
  order(
    { weight: a.data.sidebar.order, title: a.data.title },
    { weight: b.data.sidebar.order, title: b.data.title },
  );

export const route = (page: Page) =>
  page.id === "index" ? "/" : `/${page.id}/`;

export async function getPages() {
  return getCollection(
    "docs",
    ({ data }) => import.meta.env.DEV || !data.draft,
  );
}

// A page is a section when other pages live below it, like Hugo's _index.md.
export const isSection = (page: Page, pages: Page[]) =>
  page.data.section || pages.some((p) => p.id.startsWith(page.id + "/"));

export const parseYaml = (text: string) => YAML.parse(text);

// Rendered page HTML without the heading anchors and attributes Starlight adds.
export const pageHtml = (page: Page) => stripAnchors(page.rendered?.html || "");
export const stripAnchors = (html: string) =>
  html
    .replace(
      /<div class="sl-heading-wrapper[^"]*">(<h\d[\s\S]*?<\/h\d>)<a class="sl-anchor-link"[\s\S]*?<\/a><\/div>/g,
      "$1",
    )
    .replaceAll(' dir="auto"', "");

export function readingTime(page: Page) {
  const text = pageHtml(page).replace(/<[^>]*>/g, "");
  return Math.max(1, Math.ceil((text.match(/\S+/g) || []).length / 212));
}
