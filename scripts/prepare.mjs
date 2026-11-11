import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { execFileSync } from "node:child_process";
import {
  repo,
  files,
  readPages,
  readData,
  shortcodes,
  eventContent,
  order,
  escape,
  markdown,
} from "./content.mjs";

// --drafts also includes draft and future-dated pages, for local development.
const pages = readPages({ drafts: process.argv.includes("--drafts") });
const target = "src/content/docs";
// Outputs are only rewritten when they change, and stale ones removed at the
// end, so `astro dev` sees just the edited files when this reruns.
const emitted = new Set();
function emit(file, contents) {
  emitted.add(path.resolve(file));
  const buffer = Buffer.from(contents);
  if (fs.existsSync(file) && fs.readFileSync(file).equals(buffer)) return;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, buffer);
}
const staticDir = path.join(repo, "static");
for (const file of files(staticDir)) {
  const rel = path.relative(staticDir, file);
  // The existing /docs redirect is generated with fragment/query preservation below.
  if (!rel.startsWith(`docs${path.sep}`))
    emit(path.join("public", rel), fs.readFileSync(file));
}
const redirects = {
  "/docs": "/docs/latest/spiffe-about/overview/",
  "/docs/latest/spire/developing/get-involved":
    "/docs/latest/spiffe-about/get-involved/",
  "/blog/2026-10-23-bottom-turtle-ha-deployment":
    "/blog/2026-08-23-bottom-turtle-ha-deployment/",
};
for (const p of pages)
  for (const alias of p.data.aliases || [])
    redirects[alias.replace(/\/$/, "")] = p.route;
const records = [];
for (const p of pages) {
  let body = await shortcodes(p.body, p, pages);
  // Preserve fragment URLs already used by published links.
  const anchors = {
    "Part 2: Configure DNS for the OIDC Discovery IP Address":
      "part-2-configure-dns-for-the-oidc-discovery-provider-ip-address",
    "8. Default Identity": "53-default-identity",
    "Namespace Creation Options": "namespace-creation-options.",
  };
  body = body.replace(/^(#{1,6}) (.+)$/gm, (line, level, title) =>
    anchors[title] ? `<span id="${anchors[title]}"></span>\n\n${line}` : line,
  );
  if (p.data.layout === "community-day")
    body = await eventContent({ ...p, body });
  // Hugo's automatic RSS summaries end at a paragraph after 70 words.
  const contentHtml = await markdown(body);
  const summaryEnd = [...contentHtml.matchAll(/<\/p>/g)].find(
    (match) =>
      contentHtml
        .slice(0, match.index)
        .replace(/<[^>]*>/g, "")
        .trim()
        .split(/\s+/).length >= 70,
  );
  const summary = contentHtml.slice(
    0,
    summaryEnd ? summaryEnd.index + 4 : undefined,
  );
  if (p.data.navgroup === "spiffe-specs" && p.data.externalSource)
    body =
      `<aside class="admonition info">This document is part of the SPIFFE standard. The canonical version can be found at <a href="${escape(p.data.externalSource)}">${escape(p.data.externalSource)}</a></aside>\n\n` +
      body;
  if (p.file.endsWith(".html")) body = body.replace(/\n\s*\n/g, "\n");
  for (const match of [
    ...body.matchAll(/(?:^|\n\n)([^\n<>]+)\n: ([^\n]+)/g),
  ].reverse()) {
    const rendered = await markdown(match[2]);
    body =
      body.slice(0, match.index) +
      `\n\n<dl><dt>${escape(match[1])}</dt><dd>${rendered}</dd></dl>\n` +
      body.slice(match.index + match[0].length);
  }
  const plain = (await markdown(body)).replace(/<[^>]*>/g, "");
  const readingTime = Math.max(
    1,
    Math.ceil((plain.match(/\S+/g) || []).length / 212),
  );
  if (p.route === "/blog/")
    body +=
      '\nimport BlogIndex from "../../../components/BlogIndex.astro";\n\n<BlogIndex />\n';
  // Astro serves bundle assets at the same public paths as Hugo.
  if (path.basename(p.file) === "index.md") {
    for (const asset of files(path.dirname(p.file)).filter(
      (f) => !f.endsWith(".md"),
    )) {
      const dest = path.join(
        "public",
        p.route,
        path.relative(path.dirname(p.file), asset),
      );
      emit(dest, fs.readFileSync(asset));
    }
  }
  body = body.replace(
    /!\[([^\]]*)\]\((?!https?:|\/|#)([^)]+)\)/g,
    (_, alt, url) => `![${alt}](${p.route}${url})`,
  );
  body = body.replace(/^```\s*syntaxhighlighter-pre/gm, "```text");
  // Legacy analytics handlers must not prevent the book's normal PDF link.
  body = body.replace(/\s+onclick="captureOutboundLink[^"\n]*"/g, "");
  const title =
    p.data.title || p.data.titleTag || path.basename(path.dirname(p.file));
  const image = p.data.images?.[0];
  const data = {
    title,
    description: p.data.description,
    slug: p.route.slice(1, -1),
    source: p.source,
    externalSource: p.data.externalSource,
    date: p.data.date,
    draft: p.data.draft,
    modifiedDate:
      p.route.startsWith("/blog/") && p.data.date
        ? p.data.lastmod ||
          execFileSync("git", ["log", "-1", "--format=%cI", "--", p.source], {
            cwd: repo,
            encoding: "utf8",
          }).trim() ||
          p.data.date
        : undefined,
    summary,
    author: p.data.author,
    tags: p.data.tags || [],
    readingTime,
    image: image
      ? /^https?:/.test(image)
        ? image
        : new URL(image, `https://spiffe.io${p.route}`).pathname
      : undefined,
    template: p.route.startsWith("/docs/") ? "doc" : "splash",
    editUrl:
      p.data.externalSource ||
      `https://github.com/spiffe/spiffe.io/edit/master/${p.source}`,
    tableOfContents: p.route.startsWith("/docs/")
      ? { minHeadingLevel: 1, maxHeadingLevel: 4 }
      : false,
    sidebar: { label: p.data.short || title, order: p.data.weight },
    hideTitle: p.data.layout === "centered",
    hideDescription: p.data.layout === "community-day",
  };
  const output = path.join(
    target,
    p.route,
    p.route === "/blog/" ? "index.mdx" : "index.md",
  );
  emit(output, `---\n${YAML.stringify(data)}---\n${body}\n`);
  records.push({
    route: p.route,
    title,
    description: p.data.description || "",
    source: p.source,
    navgroup: p.data.navgroup,
    section: p.section,
  });
}
const write = (file, data, body = "") =>
  emit(path.join(target, file), `---\n${YAML.stringify(data)}---\n${body}\n`);
write("index.md", {
  title: "SPIFFE",
  description: "A universal identity control plane for distributed systems.",
  template: "splash",
  hero: { title: "SPIFFE" },
  editUrl: false,
  tableOfContents: false,
});
write(
  "404.md",
  {
    title: "Oops! Not found",
    template: "splash",
    editUrl: false,
    tableOfContents: false,
  },
  "If only you could use SPIFFE for web pages, amirite?\n\nPerhaps you were looking for one of these pages:\n\n" +
    readData("links404")
      .map((l) => `- [${l.name}](${l.link})`)
      .join("\n"),
);
const groups = [
  ["SPIFFE", ["spiffe-about", "spiffe-specs"]],
  ["SPIRE", ["spire-about", "try", "planning", "deploying", "maintenance"]],
  [
    "Helm Charts Hardened",
    ["spire-helm-charts-hardened-about", "spire-helm-charts-hardened-advanced"],
  ],
  ["Integrate SPIRE", ["microservices", "keyless", "architecture"]],
];
const sidebar = groups.map(([label, kinds]) => ({
  label,
  items: kinds.flatMap((kind) => {
    const members = pages.filter((p) => p.data.navgroup === kind).sort(order),
      section = members.find((p) => p.section);
    const links = members
      .filter((p) => p !== section)
      .map((p) => ({ label: p.data.short || p.data.title, link: p.route }));
    return section
      ? [
          {
            label: section.data.short || section.data.title,
            items: [
              {
                label: section.data.short || section.data.title,
                link: section.route,
              },
              ...links,
            ],
          },
        ]
      : links;
  }),
}));
emit(
  "src/data/site.json",
  JSON.stringify({ pages: records, sidebar }, null, 2) + "\n",
);
emit("src/data/redirects.json", JSON.stringify(redirects, null, 2) + "\n");
function prune(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, item.name);
    if (!item.isDirectory()) {
      if (!emitted.has(path.resolve(file))) fs.rmSync(file);
    } else {
      prune(file);
      if (!fs.readdirSync(file).length) fs.rmdirSync(file);
    }
  }
}
for (const dir of [target, "public"]) if (fs.existsSync(dir)) prune(dir);
console.log(
  `Prepared ${records.length} upstream pages and ${Object.keys(redirects).length} existing aliases.`,
);
