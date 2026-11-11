import { defineRouteMiddleware } from "@astrojs/starlight/route-data";
import { imageMetadata, inferRemoteSize } from "astro/assets/utils";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const imageOrigin =
  process.env.CONTEXT === "deploy-preview" && process.env.DEPLOY_PRIME_URL
    ? process.env.DEPLOY_PRIME_URL
    : "https://spiffe.io";
const imageCache = new Map<string, ReturnType<typeof imageMetadata>>();

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
    route.hasSidebar = false;
    route.toc = undefined;
  }
  route.pagination = { prev: undefined, next: undefined };
  const {
    image,
    imageAlt,
    title,
    description,
    date,
    modifiedDate,
    author,
    tags,
  } = route.entry.data;
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
      ...(modifiedDate
        ? [
            {
              tag: "meta" as const,
              attrs: {
                property: "article:modified_time",
                content: modifiedDate.toISOString(),
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
    image || "/img/logos/spiffe/horizontal/color/spiffe-horizontal-color.png",
    imageOrigin,
  );
  const alt = image ? imageAlt || title : "SPIFFE logo.";
  if (!imageCache.has(imageUrl.href)) {
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
