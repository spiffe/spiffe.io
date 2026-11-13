import { defineRouteMiddleware } from "@astrojs/starlight/route-data";
import { imageMetadata, inferRemoteSize } from "astro/assets/utils";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import {
  getPages,
  pageOrder,
  route as pageRoute,
  type Page,
} from "./lib/content";

const imageOrigin =
  process.env.CONTEXT === "deploy-preview" && process.env.DEPLOY_PRIME_URL
    ? process.env.DEPLOY_PRIME_URL
    : "https://spiffe.io";
const imageCache = new Map<string, ReturnType<typeof imageMetadata>>();

const sidebarGroups: [string, string[]][] = [
  ["SPIFFE", ["spiffe-about", "spiffe-specs"]],
  ["SPIRE", ["spire-about", "try", "planning", "deploying", "maintenance"]],
  [
    "Helm Charts Hardened",
    ["spire-helm-charts-hardened-about", "spire-helm-charts-hardened-advanced"],
  ],
  ["Integrate SPIRE", ["microservices", "keyless", "architecture"]],
];
type SidebarEntry = ReturnType<typeof link> | ReturnType<typeof group>;
const link = (
  page: Page,
  label = page.data.sidebar.label || page.data.title,
) => ({
  type: "link" as const,
  label,
  href: pageRoute(page),
  isCurrent: false,
  badge: undefined,
  attrs: {},
});
const group = (label: string, entries: SidebarEntry[]) => ({
  type: "group" as const,
  label,
  entries,
  collapsed: false,
  badge: undefined,
});
// Each directory is a group headed by its index page, like the Hugo navgroups.
async function buildSidebar() {
  const pages = await getPages();
  return sidebarGroups.map(([label, dirs]) =>
    group(
      label,
      dirs.flatMap((dir) => {
        const id = `docs/latest/${dir}`;
        const members = pages
          .filter((p) => p.id.startsWith(id + "/"))
          .sort(pageOrder)
          .map((p) => link(p));
        const section = pages.find((p) => p.id === id);
        if (!section) return members;
        const sectionLabel = section.data.sidebar.label || section.data.title;
        return [group(sectionLabel, [link(section, "Overview"), ...members])];
      }),
    ),
  );
}
let sidebar: ReturnType<typeof buildSidebar> | undefined;
const markCurrent = (entries: SidebarEntry[], path: string): SidebarEntry[] =>
  entries.map((e) =>
    e.type === "link"
      ? { ...e, isCurrent: e.href === path }
      : { ...e, entries: markCurrent(e.entries, path) },
  );

const modifiedDates = new Map<string, Date | undefined>();
function modifiedDate(page: Page) {
  if (page.data.lastmod) return page.data.lastmod;
  const file = page.filePath!;
  if (!modifiedDates.has(file)) {
    const committed = execFileSync(
      "git",
      ["log", "-1", "--format=%cI", "--", file],
      { encoding: "utf8" },
    ).trim();
    modifiedDates.set(file, committed ? new Date(committed) : page.data.date);
  }
  return modifiedDates.get(file);
}

export const onRequest = defineRouteMiddleware(async (context) => {
  const route = context.locals.starlightRoute;
  const path = context.url.pathname;
  if (path === "/") {
    const title = route.head.find((item) => item.tag === "title");
    if (title)
      title.content =
        "SPIFFE | Secure Production Identity Framework for Everyone";
  }
  if (!path.startsWith("/docs/")) {
    route.entry.data.template = "splash";
    route.hasSidebar = false;
    route.toc = undefined;
  } else {
    // Rebuilt per request in dev so new and renamed pages show up.
    if (!sidebar || import.meta.env.DEV) sidebar = buildSidebar();
    route.sidebar = markCurrent(await sidebar, path);
  }
  route.pagination = { prev: undefined, next: undefined };
  const { image, imageAlt, title, description, date, author, tags } =
    route.entry.data;
  route.head = route.head.filter(
    ({ tag, attrs }) =>
      tag !== "meta" ||
      ![attrs?.property, attrs?.name].some(
        (key) =>
          typeof key === "string" &&
          (key === "twitter:card" ||
            /^og:image(?::|$)|^twitter:image(?::|$)/.test(key)),
      ),
  );
  if (path.startsWith("/blog/")) {
    const type = route.head.find(({ attrs }) => attrs?.property === "og:type");
    if (type?.attrs) type.attrs.content = date ? "article" : "website";
    route.head.push(
      { tag: "meta", attrs: { name: "twitter:title", content: title } },
      {
        tag: "meta",
        attrs: { name: "twitter:description", content: description || "" },
      },
      ...(date
        ? [
            {
              tag: "meta" as const,
              attrs: {
                property: "article:published_time",
                content: date.toISOString(),
              },
            },
          ]
        : []),
      ...(date
        ? [
            {
              tag: "meta" as const,
              attrs: {
                property: "article:modified_time",
                content: modifiedDate(route.entry)!.toISOString(),
              },
            },
          ]
        : []),
      ...(author
        ? [
            {
              tag: "meta" as const,
              attrs: { property: "article:author", content: author },
            },
          ]
        : []),
      ...tags.map((tag) => ({
        tag: "meta" as const,
        attrs: { property: "article:tag", content: tag },
      })),
    );
    // Preserve the existing summary card for posts without their own image.
    if (!image) {
      route.head.push({
        tag: "meta",
        attrs: { name: "twitter:card", content: "summary" },
      });
      return;
    }
  }
  const imageUrl = new URL(
    image?.src ||
      "/img/logos/spiffe/horizontal/color/spiffe-horizontal-color.png",
    imageOrigin,
  );
  const alt = image ? imageAlt || title : "SPIFFE logo.";
  if (image) imageCache.set(imageUrl.href, Promise.resolve(image));
  else if (!imageCache.has(imageUrl.href)) {
    imageCache.set(
      imageUrl.href,
      imageUrl.origin === new URL(imageOrigin).origin
        ? readFile(
            resolve("public", "." + decodeURIComponent(imageUrl.pathname)),
          ).then((data) => imageMetadata(data, imageUrl.href))
        : inferRemoteSize(imageUrl.href),
    );
  }
  const { width, height, format } = await imageCache.get(imageUrl.href)!;
  const mime = `image/${format === "jpg" ? "jpeg" : format === "svg" ? "svg+xml" : format}`;
  route.head.push(
    { tag: "meta", attrs: { property: "og:image", content: imageUrl.href } },
    {
      tag: "meta",
      attrs: { property: "og:image:width", content: String(width) },
    },
    {
      tag: "meta",
      attrs: { property: "og:image:height", content: String(height) },
    },
    { tag: "meta", attrs: { property: "og:image:type", content: mime } },
    { tag: "meta", attrs: { property: "og:image:alt", content: alt } },
    {
      tag: "meta",
      attrs: {
        name: "twitter:card",
        content: width > height ? "summary_large_image" : "summary",
      },
    },
    { tag: "meta", attrs: { name: "twitter:image", content: imageUrl.href } },
    { tag: "meta", attrs: { name: "twitter:image:alt", content: alt } },
  );
});
