import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import { unified } from "@astrojs/markdown-remark";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { headingAttributes, spireLatest } from "./scripts/markdown.mjs";

// In dev, re-pull the external docs when their descriptor changes.
const pullExternalOnChange = {
  name: "pull-external-on-change",
  hooks: {
    "astro:server:setup": ({ server }) => {
      server.watcher.add("external.yaml");
      server.watcher.on("change", (file) => {
        if (file.endsWith("/external.yaml"))
          spawn("python3", ["pull_external.py"], { stdio: "inherit" });
      });
    },
  },
};
// Pages use optimised copies from /_astro, but older links and embeds point at
// the bundle files, so publish those beside built pages too.
const bundleAssets = {
  name: "bundle-assets",
  hooks: {
    "astro:build:done": ({ dir }) => {
      const docs = "src/content/docs";
      const out = fileURLToPath(dir);
      for (const file of fs.readdirSync(docs, { recursive: true })) {
        const page = path.join(out, path.dirname(file), "index.html");
        if (/(^|\/)\.|\.mdx?$/.test(file) || !fs.existsSync(page)) continue;
        if (!fs.statSync(path.join(docs, file)).isFile()) continue;
        fs.cpSync(path.join(docs, file), path.join(out, file));
      }
    },
  },
};
export default defineConfig({
  site: "https://spiffe.io",
  output: "static",
  trailingSlash: "always",
  server: { host: "0.0.0.0", port: 4175 },
  redirects: JSON.parse(fs.readFileSync("./src/data/redirects.json", "utf8")),
  markdown: {
    processor: unified({
      smartypants: { dashes: "oldschool" },
      remarkPlugins: [headingAttributes, spireLatest],
    }),
  },
  integrations: [
    pullExternalOnChange,
    bundleAssets,
    starlight({
      title: "SPIFFE",
      description:
        "A universal identity control plane for distributed systems.",
      social: [
        {
          icon: "x.com",
          label: "X (formerly Twitter)",
          href: "https://x.com/SPIFFEio",
        },
        { icon: "github", label: "GitHub", href: "https://github.com/spiffe" },
        { icon: "slack", label: "Slack", href: "https://slack.spiffe.io/" },
        {
          icon: "stackOverflow",
          label: "Stack Overflow",
          href: "https://stackoverflow.com/questions/tagged/spiffe",
        },
        {
          icon: "youtube",
          label: "YouTube",
          href: "https://www.youtube.com/channel/UCVzeW7j02FDNggkI5JKPvJg/f",
        },
      ],
      expressiveCode: false,
      favicon: "/favicon.ico",
      customCss: [
        "./src/styles/fonts.css",
        "./src/styles/site.css",
      ],
      credits: false,
      disable404Route: true,
      // The route middleware builds the sidebar from the docs collection.
      sidebar: [],
      editLink: {
        baseUrl: "https://github.com/spiffe/spiffe.io/edit/master/",
      },
      tableOfContents: { minHeadingLevel: 1, maxHeadingLevel: 4 },
      routeMiddleware: "./src/route-middleware.ts",
      components: {
        Sidebar: "./src/components/Sidebar.astro",
        Header: "./src/components/Header.astro",
        ContentPanel: "./src/components/ContentPanel.astro",
        MarkdownContent: "./src/components/MarkdownContent.astro",
        PageTitle: "./src/components/PageTitle.astro",
        Hero: "./src/components/Hero.astro",
        Footer: "./src/components/Footer.astro",
        ThemeProvider: "./src/components/ThemeProvider.astro",
        ThemeSelect: "./src/components/Empty.astro",
      },
      head: [
        {
          tag: "link",
          attrs: {
            rel: "alternate",
            type: "application/rss+xml",
            title: "SPIFFE Blog",
            href: "/blog/index.xml",
          },
        },
      ],
    }),
  ],
});
