# Original build handoff

Superseded for readiness and findings by `ADVERSARIAL-REVIEW.md`. This document records the earlier build handoff, before the private preview and upstream-based review branch were prepared.

Prepared 22 October 2026 for Andrés Vega.

## Decision

Start clean on current Astro and Starlight, retaining current upstream content and official assets. The supplied archives do not contain the May Astro project. The strongest reason for Starlight is the documentation workload and maintenance handoff: shared navigation, search, anchors, code rendering, and mobile behavior. Agent-generated HTML alone does not provide those facilities.

GitHub Pages remains the deployment target, as directed in the renewed brief. The May proposal's Cloudflare recommendation is superseded. No live repository, hosting account, DNS, or publication was changed.

## What changed since the May proposal

The current upstream repository pins Hugo 0.163.3. It already has a native blog, an ecosystem directory, and a build-time release-fetching path. The current public homepage has a Community Day 2026 announcement. The old argument that the site is still stuck on Hugo 0.68.3, has no blog, and has no release integration is no longer accurate.

The new build therefore stands on its information architecture, contributor workflow, and presentation. It should not be proposed as fixing work that maintainers have already done.

## Implemented

- One Starlight shell for the homepage, documentation, blog, and auxiliary pages.
- A light visual system using the official SPIFFE and SPIRE marks. No Tailwind, external font service, decorative animation, or separate marketing framework.
- A homepage organized around a concrete SPIFFE ID, an issuance mechanism, the core concepts, and the next action for each audience.
- A labeled SPIRE issuance lifecycle, with a separate readable mobile flow. The diagram distinguishes issuance from peer authentication and authorization. Agents can cache credentials; it is not a network trace of every Workload API call.
- Separate SPIFFE and SPIRE sidebars with an explicit project switch.
- Vendor-neutral SPIFFE use-case pages. SPIRE-specific deployment and integration procedures stay under SPIRE.
- A rendered specification explorer covering 13 upstream specification/process documents. Stability labels come from upstream. Filesystem delivery is included even though the current site's external-content list omits it.
- Current ecosystem entries with text and maintainer-type filters. Feature declarations are in a separate implementation matrix. Entries are not represented as certifications.
- The 14 current published blog posts, with their existing authors and dates. No invented WIT-SVID launch post.
- Downloads sourced from live GitHub release metadata, including platform-specific binaries and checksums. Historical/tutorial pins remain separate.
- The book, current Community Day agenda, and presentation archive retained.
- Static legacy redirects, including the supplied archives' aliases and current imported documentation aliases.
- GitHub Pages CI and a daily rebuild for release freshness. An optional repository-dispatch hook is documented accurately.

## Source and file changes

This is a new scaffold rather than a patch to the inaccessible May build. Main implementation files are listed in the root README. `review/source-manifest.json` maps imported documentation to its source. The two supplied archives were inspected and left intact.

The content pass rewrites the SPIFFE overview and public project introductions, adds the use-case introductions, separates the implementation matrix, and mechanically migrates the current upstream reference and tutorial material. It is not a claim that every inherited technical procedure has been independently executed or comprehensively rewritten.

## Verification and limits

The production build and exhaustive local-reference check are recorded in `build-checks.json`. A fresh `npm ci` followed by a production build is recorded in `clean-install.log` and `build.log`. GitHub release refresh was exercised successfully.

The supervised preview server became healthy. Its browser tab could not be inspected because the browser policy gate rejected the observation. No alternate browser mechanism was used. Consequently desktop/mobile appearance, keyboard navigation, live search queries, directory filtering, and browser console behavior remain **visually and interactively unverified**. The standalone homepage preview is a real derivative of the build, not a screenshot or evidence of visual QA.

Current upstream tutorial pins include SPIRE 1.11.2, OPA 0.50.2-envoy, and MetalLB 0.13.7 in their associated examples. Those pins were verified against the retrieved source and retained together with the examples. They should be updated and exercised together in the companion tutorial repository, rather than replaced with arbitrary current versions in website prose.

Source standards are pinned to the recorded revision. Updating the catalog and rendered documents is a reviewed editorial action; this build does not silently import changed normative requirements on every deployment.

The ecosystem matrix reflects the project's current declarations. It is not an independent conformance audit. The current upstream naming supersedes examples from the old handoff.

## Recommended review order

1. Homepage: thesis, density, visual rhythm, and diagram geometry at desktop and 375-pixel width.
2. SPIFFE overview and SPIRE concepts: switch between projects and confirm the sidebars stay focused.
3. Specifications: inspect a stable document and an incubating document, including anchors and source provenance.
4. Ecosystem: filter by name and maintainer type; compare the directory against the support matrix.
5. Search: query a term that occurs across specifications, SPIRE configuration, and blog posts.
6. Legacy addresses: follow an old documentation URL with a heading fragment.

After visual and interaction review, bring the build to the SSC or open a draft PR according to the maintainers' preference. The build is prepared for that discussion; this handoff does not claim community approval or production readiness.
