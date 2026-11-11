import fs from "node:fs";
import YAML from "yaml";

// Preserve Hugo's explicit heading anchors without displaying the attribute syntax.
export function headingAttributes() {
  return (tree) => {
    const visit = (node) => {
      if (node.type === "heading") {
        const last = node.children.at(-1);
        const match = last?.value?.match(/\s*\{#([^}]+)\}\s*$/);
        if (match) {
          last.value = last.value.slice(0, match.index);
          node.data = {
            ...node.data,
            hProperties: { ...node.data?.hProperties, id: match[1] },
          };
        }
      }
      node.children?.forEach(visit);
    };
    visit(tree);
  };
}

export function latestSpireRelease() {
  const file = "src/data/releases.yaml";
  if (process.env.HIDE_RELEASES === "true" || !fs.existsSync(file)) return {};
  return YAML.parse(fs.readFileSync(file, "utf8")).latest || {};
}

// SPIRE_LATEST_TAG, _VERSION and _TARBALL can appear in prose, code and link URLs.
export function spireLatest() {
  return (tree) => {
    const release = latestSpireRelease();
    const values = release.tag_name && {
      TAG: release.tag_name,
      VERSION: release.tag_name.replace(/^v/, ""),
      TARBALL: release.assets[0].name,
    };
    const replace = (text) =>
      text.replace(/SPIRE_LATEST_(TAG|VERSION|TARBALL)/g, (_, key) =>
        values ? values[key] : `LATEST-${key.toLowerCase()}`,
      );
    const visit = (node) => {
      if (typeof node.value === "string") node.value = replace(node.value);
      if (typeof node.url === "string") node.url = replace(node.url);
      node.children?.forEach(visit);
    };
    visit(tree);
  };
}
