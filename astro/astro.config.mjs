import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import { unified } from "@astrojs/markdown-remark";
import fs from "node:fs";
import { headingAttributes } from "./scripts/markdown.mjs";
const { sidebar } = JSON.parse(fs.readFileSync("./src/data/site.json", "utf8"));
export default defineConfig({
  site: "https://spiffe.io",
  output: "static",
  trailingSlash: "always",
  server: { host: "0.0.0.0", port: 4175 },
  redirects: JSON.parse(fs.readFileSync("./src/data/redirects.json", "utf8")),
  markdown: {
    processor: unified({
      smartypants: { dashes: "oldschool" },
      remarkPlugins: [headingAttributes],
    }),
  },
  integrations: [
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
      customCss: ["./src/styles/site.css"],
      credits: false,
      disable404Route: true,
      sidebar,
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
