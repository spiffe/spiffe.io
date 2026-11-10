# SPIFFE.io

The Astro and Starlight site lives in `redesign/`. See [DESIGN.md](DESIGN.md) for its structure and deployment approach.

## Install and run

Use Node 24 and npm. From this directory:

```sh
npm ci
npm run dev
```

To build and preview the site, including search:

```sh
npm run build
npm run preview
```

Open <http://localhost:4173>. `npm run check` verifies the built links, anchors, redirects, legacy routes, and search index.

## Contribute

Follow the repository's [contribution instructions](../CONTRIBUTING.md), including DCO sign-off (`git commit -s`). Edit pages in `src/content/docs/`. SPIFFE concepts and specifications belong under `docs/spiffe/`; SPIRE setup and operations belong under `docs/spire/`. Keep legacy URLs in `src/data/redirects.json` and important inbound fragments in `src/data/legacy-routes.json`.

For a blog post, copy `src/content/docs/blog/_template.md` to a dated filename in the same directory. Fill in its metadata and set `draft: false` when ready. Draft and future-dated posts are excluded from production routes, the listing, search, and RSS. Images live in `public/blog-assets/`.

Ecosystem records live in `src/data/ecosystem.yaml` and `src/data/commercial-offerings.json`. Use concise capability descriptions, primary source links, and explicit identity roles.

## Maintain imported content

`src/data/sources.json` records canonical document locations and revisions. To compare an imported repository with a new revision:

```sh
npm run sources -- spiffe/spire v1.15.5
```

The command fetches the recorded and requested source versions into a temporary directory and prints a unified diff. Apply relevant changes to the mapped pages, including links and assets, then update their source revisions. Submit changes to externally maintained documents in their canonical repository first. Preserve specification text and maturity labels; keep tutorial dependencies coordinated with their examples.

`npm run check:upstream` compares the recorded website baseline with current `origin/master`. Reconcile changed content before updating that baseline.

Builds refresh SPIRE release metadata from GitHub; `npm run refresh:releases` refreshes it explicitly. `SPIFFE_OFFLINE=1 npm run build` uses the checked-in snapshot. Release tokens (`@@SPIRE_VERSION@@`, `@@SPIRE_TAG@@`) update current-release instructions; historical examples retain their own versions.
