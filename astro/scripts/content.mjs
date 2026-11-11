import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { createMarkdownProcessor } from "@astrojs/markdown-remark";

export const repo = path.resolve("..");
export const readData = (name) =>
  YAML.parse(fs.readFileSync(path.join(repo, "data", `${name}.yaml`), "utf8"));
export const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const renderer = await createMarkdownProcessor({
  smartypants: { dashes: "oldschool" },
  syntaxHighlight: false,
});
export const markdown = async (text) =>
  (await renderer.render(text || "")).code;
const inline = async (text) =>
  (await markdown(text)).replace(/^<p>|<\/p>\s*$/g, "");
export const slug = (text) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .replace(/\s+/g, "-");
export const routeFor = (file) =>
  "/" +
  file
    .replace(/\.(md|html)$/, "")
    .replace(/(^|\/)_?index$/, "")
    .toLowerCase()
    .replace(/\/$/, "") +
  "/";
export function files(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((item) =>
      item.isDirectory()
        ? files(path.join(dir, item.name))
        : [path.join(dir, item.name)],
    );
}
export function readPages({ drafts = false } = {}) {
  return files(path.join(repo, "content"))
    .filter((f) => /\.(md|html)$/.test(f))
    .map((file) => {
      const raw = fs.readFileSync(file, "utf8");
      const match = raw.match(/^\s*---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
      const data = match ? YAML.parse(match[1]) : {};
      const source = path.relative(repo, file);
      return {
        source,
        file,
        data,
        body: raw.slice(match?.[0].length || 0),
        route: data.url || routeFor(source.slice(8)),
        section: /\/_index\./.test(file),
      };
    })
    .filter(
      (p) =>
        p.data.build?.render !== false &&
        (drafts ||
          (!p.data.draft &&
            !(p.data.date && new Date(p.data.date) > new Date()))),
    );
}
async function replaceAsync(text, regex, fn) {
  const matches = [...text.matchAll(regex)];
  for (const m of matches.reverse())
    text =
      text.slice(0, m.index) +
      (await fn(m)) +
      text.slice(m.index + m[0].length);
  return text;
}
const attrs = (text) =>
  Object.fromEntries(
    [...text.matchAll(/([\w-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]),
  );
export async function shortcodes(text, page, pages) {
  // Comments are not displayed, including the old shortcode examples inside them.
  text = text.replace(/<!--[\s\S]*?-->/g, "");
  text = await replaceAsync(
    text,
    /\{\{[<%]\s*(info|warning|danger|success|requirement)\s*[>%]\}\}([\s\S]*?)\{\{[<%]\s*\/\1\s*[>%]\}\}/g,
    async (m) =>
      `<aside class="admonition ${m[1]}">\n${await markdown(await shortcodes(m[2], page, pages))}\n</aside>\n`,
  );
  return replaceAsync(
    text,
    /\{\{[<%]\s*([^\s>]+)\s*(.*?)\s*[>%]\}\}/g,
    async (m) => {
      const name = m[1],
        a = attrs(m[2]),
        arg = m[2].match(/^"([^"]+)"/)?.[1];
      if (name === "spire-latest") {
        if (process.env.HIDE_RELEASES === "true") return `LATEST-${arg}`;
        const release = readData("releases").latest;
        if (!release.tag_name) return `LATEST-${arg}`;
        return {
          tag: release.tag_name,
          version: release.tag_name.replace(/^v/, ""),
          tarball: release.assets[0].name,
        }[arg];
      }
      if (name.startsWith("scarf/pixels/"))
        return fs.readFileSync(
          path.join(import.meta.dirname, "shortcodes", `${name}.html`),
          "utf8",
        );
      if (name === "figure")
        return `<figure><img src="${escape(a.src)}" style="width:${escape(a.width || 50)}%" alt="${escape(a.caption || a.alt || "")}" title="${escape(a.title || "")}">${a.caption ? `<figcaption>${await inline(a.caption)}</figcaption>` : ""}</figure>\n`;
      if (name === "sectiontoc")
        return (
          "<ul>\n" +
          pages
            .filter(
              (p) => p.data.navgroup === arg && (!p.section || p.data.toc),
            )
            .sort(order)
            .map(
              (p) =>
                `<li><a href="${p.route}">${escape(p.data.title)}</a><p>${escape(p.data.description || "")}</p></li>`,
            )
            .join("\n") +
          "\n</ul>\n"
        );
      if (name === "specs")
        return (
          "<ul>" +
          readData("spec")
            .documents.map(
              (d) =>
                `<li><a href="https://github.com/spiffe/spiffe/blob/main/standards/${escape(d.filename)}">${escape(d.title)}</a></li>`,
            )
            .join("") +
          "</ul>"
        );
      if (name === "ecosystem") {
        const labels = {
          official: "SPIFFE official project",
          community: "Community project",
          commercial: "Commercial project",
        };
        let html =
          "<p><strong>Key:</strong> " +
          Object.entries(labels)
            .map(
              ([k, v]) =>
                `<span class="project-kind ${k}" role="img" aria-label="${v}">${{ official: "★", community: "●", commercial: "◆" }[k]}</span> ${v}`,
            )
            .join(" ") +
          "</p>\n";
        for (const c of readData("ecosystem").categories.sort(order)) {
          html += `<h2 id="${slug(c.name)}">${escape(c.name)}</h2>\n${await markdown(c.description)}<ul>\n`;
          for (const p of c.projects.sort(order))
            html += `<li><span class="project-kind ${p.type}" role="img" aria-label="${labels[p.type] || labels.community}" title="${labels[p.type] || labels.community}">${{ official: "★", community: "●", commercial: "◆" }[p.type] || "●"}</span> <a href="${escape(p.link)}"><strong>${escape(p.name)}</strong></a>${p.description ? " - " + (await inline(p.description)) : ""}</li>\n`;
          html += "</ul>\n";
        }
        return html;
      }
      if (name === "acknowledgments")
        return (
          "<table><thead><tr><th>Name</th><th>Social media</th></tr></thead><tbody>" +
          readData(name)
            .map(
              (p) =>
                `<tr><td>${escape(p.name)}</td><td>${p.linkedin ? `<a href="https://www.linkedin.com/in/${escape(p.linkedin)}" aria-label="LinkedIn">in</a>` : ""} ${p.twitter ? `<a href="https://twitter.com/${escape(p.twitter)}" aria-label="Twitter">𝕏</a>` : ""}</td></tr>`,
            )
            .join("") +
          "</tbody></table>"
        );
      if (name === "presentations") {
        let html = "";
        for (const p of presentationOrder(readData(name)).filter(
          (p) => p.category === a.category,
        )) {
          const image = p.youtube
            ? `https://img.youtube.com/vi/${p.youtube}/1.jpg`
            : p.thumbnail;
          html += `<div class="presentation">${image ? `<a href="${escape(p.link)}"><img src="${escape(image)}" width="120" height="90" alt=""></a>` : ""}<div><a href="${escape(p.link)}"><strong>${escape(p.title)}</strong></a>${p.organizations ? " (" + escape(p.organizations) + ")" : ""}${p.description ? `<p>${escape(p.description)}</p>` : ""}<p><i>${p.venue ? "Presented" + (p.presenters ? " by " + escape(p.presenters) : "") : "By " + escape(p.presenters)}${p.venue ? " at " + escape(p.venue) : ""}${p.publication ? " in " + escape(p.publication) : ""}${p.date ? " on " + escape(p.date) : ""}.</i></p></div></div>\n`;
        }
        return html;
      }
      if (name === "releases") return releases();
      throw new Error(`${page.source}: unsupported shortcode ${name}`);
    },
  );
}
function presentationOrder(items) {
  // Match the existing list: entries without weights keep their position.
  for (let i = 1; i < items.length; i++)
    for (let j = i; j > 0 && items[j].weight < items[j - 1].weight; j--)
      [items[j], items[j - 1]] = [items[j - 1], items[j]];
  return items;
}
export const order = (a, b) =>
  ((a.data || a).weight || 0) - ((b.data || b).weight || 0) ||
  ((a.data || a).title || (a.data || a).name || "").localeCompare(
    (b.data || b).title || (b.data || b).name || "",
  );
function releases() {
  if (process.env.HIDE_RELEASES === "true") return "";
  const data = readData("releases");
  return (
    '<table class="releases"><thead><tr><th>Version</th><th>Click to copy link to clipboard</th><th>Click to trigger download</th></tr></thead><tbody>' +
    data.all
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((r) => {
        const links = [];
        for (const [platform, label, checksumLabel] of [
          [
            "linux-amd64",
            "Linux amd64 binaries (.tar.gz)",
            "Linux amd64 checksum (.txt)",
          ],
          ["linux-arm64", "Linux Arm (.tar.gz)", "Linux Arm Checksum (.txt)"],
          ["windows-amd64", "Windows (.tar.gz)", "Windows Checksum (.txt)"],
        ]) {
          const candidates = r.assets.filter(
            (a) =>
              a.name.startsWith("spire-") &&
              !a.name.startsWith("spire-extras-") &&
              a.name.includes(platform),
          );
          const checksum = candidates.find(
            (a) => a.name.includes("sha256") && a.name.includes(".txt"),
          );
          const binary = candidates.find(
            (a) => !(a.name.includes("sha256") && a.name.includes(".txt")),
          );
          if (binary && checksum)
            links.push(
              [label, binary.browser_download_url],
              [checksumLabel, checksum.browser_download_url],
            );
        }
        links.push(
          [
            "Source (.zip)",
            `https://github.com/spiffe/spire/archive/${r.tag_name}.zip`,
          ],
          [
            "Source (.tar.gz)",
            `https://github.com/spiffe/spire/archive/${r.tag_name}.tar.gz`,
          ],
        );
        return `<tr><td><a href="${escape(r.html_url)}">${escape(r.tag_name)}</a>${r.tag_name === data.latest.tag_name ? " <strong>LATEST</strong>" : ""}</td><td>${links.map(([label, url]) => `<button data-copy-url="${escape(url)}">${label}</button>`).join(" ")}</td><td>${links.map(([label, url]) => `<a href="${escape(url)}">${label}</a>`).join(" ")}</td></tr>`;
      })
      .join("") +
    "</tbody></table>"
  );
}
export async function eventContent(page) {
  const { event, agenda, tagline } = page.data;
  let html = tagline ? `<p>${escape(tagline)}</p>` : "";
  if (event)
    html += `<aside class="event-card"><ul>${["date", "time", "venue", "online"]
      .filter((k) => event[k])
      .map((k) => `<li>${escape(event[k])}</li>`)
      .join(
        "",
      )}</ul>${event.register ? `<a class="button" href="${escape(event.register)}">Register to attend</a>` : ""}${event.note ? `<p>${escape(event.note)}</p>` : ""}${(event.links || []).map((l) => `<a href="${escape(l.url)}">${escape(l.text)}</a>`).join(" ")}</aside>`;
  html += page.body;
  if (agenda) {
    html += `<section id="agenda"><h2>Agenda</h2><p>${escape(agenda.note || "")}</p><ol class="agenda-list">`;
    for (const a of agenda.items)
      html += `<li><p>${escape(a.start || "")}${a.end ? " - " + escape(a.end) : ""}${a.start && a.label ? " · " : ""}${escape(a.label || "")}</p><h3>${escape(a.title || "Title to be announced")}</h3>${a.speakers ? `<p>${a.speakers.map((s) => `<strong>${escape(s.name)}</strong> ${escape(s.org || "")}`).join(" ")}</p>` : ""}${await markdown(a.abstract)}</li>`;
    html += "</ol></section>";
  }
  return html;
}
