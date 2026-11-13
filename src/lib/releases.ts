import fs from "node:fs";
import YAML from "yaml";

type Asset = { name: string; browser_download_url: string };
export type Release = {
  tag_name: string;
  html_url: string;
  created_at: string;
  assets: Asset[];
};

// Written by pull_external.py; empty when HIDE_RELEASES=true.
export function readReleases(): { latest: Partial<Release>; all: Release[] } {
  const file = "src/data/releases.yaml";
  if (process.env.HIDE_RELEASES === "true" || !fs.existsSync(file))
    return { latest: {}, all: [] };
  return YAML.parse(fs.readFileSync(file, "utf8"));
}
