# SPIFFE.io renewed build

A reviewable Astro + Starlight implementation targeting GitHub Pages. Continue from this upstream checkout; see `UPSTREAM.md` and `review/ADVERSARIAL-REVIEW.md`. The homepage, documentation, project pages, and blog share one shell, one set of design tokens, and one Pagefind search index.

## Run

Use Node 24 and npm. Dependencies are locked.

```sh
npm ci
npm run dev
```

The development server listens on port 4173. To review the production search index, build and preview:

```sh
npm run build
npm run preview
```

After building, `dist/` is ready to serve with any static HTTP server. For example:

```sh
python3 -m http.server 8000 --directory dist
```

Open `http://localhost:8000`. Opening `dist/index.html` directly as a file does not resolve the site's root-relative URLs.

## Content model

| Area | Source |
| --- | --- |
| Homepage | `src/content/docs/index.mdx`, `src/components/Home.astro`, `Hero.astro`, `Issuance.astro` |
| Shared layout and visual tokens | `src/components/`, `src/styles/site.css` |
| SPIFFE documentation | `src/content/docs/docs/spiffe/` |
| SPIRE documentation | `src/content/docs/docs/spire/` |
| Specification catalog | `src/data/specs.json` |
| Ecosystem directory | `src/data/ecosystem.yaml` |
| Blog | `src/content/docs/blog/`, `src/data/posts.json` |
| Release metadata | `src/data/release.json`, `scripts/releases.mjs` |
| Legacy addresses | `src/data/redirects.json` |
| Upstream provenance | `review/source-manifest.json` |

Most corrections are Markdown edits. The new homepage has no client-side framework. The directory uses a small script for filtering. Search and documentation behavior come from Starlight.

The route middleware selects one project's sidebar for each documentation page. It does not hide the other project with CSS. The project switch provides a deliberate route between the two documentation sets. Automatically generated pagination is disabled so it cannot send readers across unrelated project boundaries.

## Release updates

Every build fetches the latest stable SPIRE release from GitHub. The same metadata supplies the homepage version, downloads, and release placeholders in Markdown and code blocks.

The proposed GitHub Pages workflow would rebuild daily, on pushes, and on manual dispatch. It also accepts a `spire-release` repository dispatch. A release in the separate `spiffe/spire` repository does **not** trigger the site by itself: immediate rebuilds require that repository to send the dispatch. The daily schedule works without that cross-repository change.

CI fails if current release metadata cannot be fetched. Local builds warn and use the checked-in snapshot. To explicitly build offline:

```sh
SPIFFE_OFFLINE=1 npm run build
```

`@@SPIRE_VERSION@@`, `@@SPIRE_TAG@@`, and `@@SPIRE_TARBALL@@` are authoring placeholders, resolved by the Markdown pipeline. Historical version examples and tutorial dependency pins are intentionally separate from the latest-release value.

## GitHub Pages

The prepared workflow is `redesign/.github/workflows/pages.yml` relative to the repository root. It is inactive in this review directory. It is intended for a later cutover, when the Astro source moves to the repository root and maintainers approve deployment. It would build pull requests and deploy the default branch. No official GitHub Pages deployment has been made.

Maintainers must enable GitHub Pages with GitHub Actions as its source. The configured production origin is `https://spiffe.io`, with no repository subpath. A fork hosted under a project subpath needs a deliberate base-path change; this build does not claim that configuration is tested.

GitHub Pages has no Cloudflare-style `_redirects` support. Astro emits static HTML redirect pages. A post-build step retains inbound query strings and fragments when JavaScript is available. The meta-refresh fallback remains available without JavaScript. These are static redirects, not HTTP 301 responses.

## Checks

`npm run build` compiles the site, creates the Pagefind index, prepares redirects, and checks every output HTML page for missing local files and anchors, unresolved release tokens, and missing page titles. Results are in `review/build-checks.json`.

This check does not validate external websites or execute infrastructure tutorials. Browser visual and interaction QA was blocked in the production environment used to create this handoff. See `review/REVIEW.md` for exact scope and remaining review work.

## Upstream ownership

The current website and specifications were used as the starting point, with source revisions recorded in the manifest. The scaffold is additive under `redesign/`. The existing Hugo site remains the production source during review.

The original site license is retained in `LICENSE`. The mirrored specifications are covered by `licenses/SPIFFE-specifications.txt`. Local rendering changes frontmatter, links, heading anchors, and punctuation; no normative requirement was intentionally changed. The canonical repository controls specification content.
