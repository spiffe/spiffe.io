# SPIFFE.io: adversarial review

22 October 2026. Review of the renewed build, checked against the current `spiffe/spiffe.io` repository.

## Update after the review

The commercial-directory pass adds ten documented offerings and a dedicated commercial view containing 13 entries in total, including the three upstream integrations. The directory also adds nono as a community integration for JWT-SVID authentication from a sandbox supervisor. Messier 42 appears under the same evidence and ordering rules as the other vendors. The site now has 95 content pages. This partially addresses F7; matrix consolidation and the other findings remain open. The 94-page inventory below records the original reviewed snapshot.

## Verdict

**C+ overall. B for direction. D for merge readiness.** Keep the project split and the restrained presentation. Do another content and maintenance pass before asking maintainers to merge it. Visual execution remains ungraded because browser inspection was blocked by the environment's policy gate.

The build succeeds, but the earlier link-check result was too narrow to stand in for acceptance. It checks local file existence and selected anchors. It does not establish that the tutorials work, all existing behavior survives, or readers can complete their tasks.

This review is deliberately critical of our implementation. Inherited defects are identified as inherited; bringing them into a redesigned site does not make them resolved.

Build and serve the prototype using the commands in `README.md` to inspect the reviewed routes. All 94 content routes, the search index, both documentation sections, the ecosystem directory, and blog are included. It is not the official public site. Some inherited absolute links still leave the preview for spiffe.io; finding F4 documents them.

## Upstream is the baseline

The working repository is now a real clone of `https://github.com/spiffe/spiffe.io`, on review branch `redesign/site-refresh`, based on `42e7c82fc4a8117e2fc2d6933180279aae18adeb`. The latest commit is “Adds Aembit to list of commercial implementations (#419).” It is the same revision used for the original import, so the new fetch found no intervening upstream commits.

All **331 tracked upstream files remain byte-for-byte unchanged**. The prototype is additive under `redesign/`; the existing production source and workflow remain at the root. This is a safe review arrangement, not the proposed permanent directory structure or a completed cutover.

The preservation inventory accounts for **60 public content source files and one unpublished blog-authoring template**, with no unmapped content files. All 14 published blog posts are represented. The ecosystem retains the upstream entries, with the Rust SDK link updated to its published crate. Aembit's latest entry is present in the implementation matrix. Mapping a source to a destination proves coverage, not semantic equivalence. Rewritten introductions and auxiliary pages still need editorial comparison.

Before any eventual PR is merged, fetch upstream again, inspect every changed source against the inventory, and reconcile the migration. A point-in-time snapshot cannot protect future changes by itself. The `npm run check:upstream` review command now fetches upstream and fails on an advanced base or changed existing files. It is an explicit local check, not an installed upstream CI gate. No upstream push, PR, or official production deployment was made.

## Findings, in priority order

### F1. P1: The main quickstart promises a toolchain it cannot support

**Confirmed. Inherited content, amplified by the new primary CTA.**

The Linux/macOS quickstart twice states that Go 1.13 or higher is sufficient, while the build substitutes SPIRE v1.15.5. That release's `go.mod` declares Go 1.26.10. The prerequisites say “64 bit Linux,” but the download command always selects the amd64 archive. An ARM64 reader follows instructions for another architecture.

Source: `src/content/docs/docs/spire/try/getting-started-linux-macos-x.md`; authoritative requirement: [SPIRE v1.15.5 go.mod](https://github.com/spiffe/spire/blob/v1.15.5/go.mod), fetched and retained in the review evidence.

The `/spire/` primary CTA leads directly here. This undermines the strongest promise in the brief: anyone should be able to try SPIRE immediately.

**Required change:** provide an explicit platform choice and tested commands. Derive or link to the selected release's Go requirement. Execute the Linux quickstart through SVID retrieval, then separately validate the macOS path. Do not infer tutorial compatibility from a current release badge.

### F2. P1: Core concepts contain an incorrect description of JWT verification material

**Confirmed. Inherited content.**

The SPIFFE concepts page describes the JWT Workload API trust bundle as a set of certificates, then later describes JWT verification keys differently. The Workload API specification defines JWT bundles as JWK Sets. The same introduction describes an SVID as valid if signed by a trust-domain authority, omitting the other profile-specific validation requirements.

Sources: `src/content/docs/docs/spiffe/concepts.md`, `src/content/docs/docs/spiffe/specs/workload-api.md`, and the corresponding X.509/JWT profiles.

**Required change:** rewrite this short foundational page around the actual profiles. Distinguish a signature check from complete SVID validation. Describe the stable profiles clearly and identify incubating work separately. The first explanatory pages must be more reliable than inherited tutorial prose.

### F3. P1: The contributor workflow regresses upstream behavior

**Confirmed. Introduced by the migration.**

Of 79 rendered “Edit page” links, 64 point at an immutable commit; the remainder include external source documents. These links provide provenance, but they do not take a contributor to the migrated Markdown being rendered. Several new pages explicitly disable editing.

The blog index reads a separate `posts.json`. A new Markdown post can therefore render without being listed, and titles, dates, descriptions, and authors can drift across the index and article. Upstream already supplies a draft authoring template, tags, and an RSS template. The new build does not generate a blog RSS feed or carry the tag workflow through. It also applies one shared social image.

Sources: `src/components/BlogIndex.astro`, `src/data/posts.json`, article frontmatter, upstream `content/blog/2026-06-19-writing-a-blog-post/index.md`, `layouts/blog/rss.xml`, and `layouts/blog/list.html`.

**Required change:** derive the index and feed from one content collection with explicit draft/date behavior. Preserve article metadata and the authoring guide. Separate “Edit this page” from “Upstream source.” Point edit links at the actual source branch when the migration destination is established.

### F4. P1: Migration acceptance gives false confidence about link preservation

**Confirmed. The verifier misses these cases.**

The generated site contains 31 links using 20 absolute spiffe.io URLs. The verifier skips all HTTP(S) links, including its own production origin. One points to `/blog/2026-10-23-bottom-turtle-ha-deployment/`, which has no built destination; the corresponding published article uses the August date. Several other links rely on legacy redirects and leave the private preview.

The SPIFFE concepts heading renders the literal text `Further Reading {#spec}` and receives `further-reading-spec` as its ID. The old `#spec` fragment is absent. Preserving the fragment in a redirect does not preserve its target. The Filesystem Delivery page has two elements with `id="abstract"`.

The nested Helm page also has two GitHub blob links pointing at nonexistent source paths under `content/docs/spire-helm-charts-hardened-about/`, omitting the `latest` segment and using website-style paths as source paths.

Sources: `scripts/verify.mjs`, `src/content/docs/docs/spiffe/concepts.md`, `src/content/docs/docs/spiffe/specs/filesystem-delivery.md`, `src/content/docs/blog/2026-09-03-spire-under-kubernetes.md`, and `src/content/docs/docs/spire/helm/advanced/nested-spire.md`.

**Required change:** normalize links to the production origin into local checks, follow redirect targets before checking fragments, reject duplicate IDs and leftover heading syntax, and keep an explicit legacy-fragment map. Retain the useful 86-route coverage check, but do not call it complete link preservation.

### F5. P2: The split fixes navigation scope, but several destinations are empty signposts

**Confirmed structure; editorial judgment.**

The SPIFFE and SPIRE sidebars are genuinely separate, and most SPIRE groups start collapsed. That resolves the central navigation problem. However, the SPIRE documentation switch lands on an About page whose body is one sentence. Planning, maintenance, and several other section pages mostly contain links. Automatic previous/next navigation is disabled everywhere.

Readers can find the right project and still lack a recommended path through it. The three SPIFFE use-case pages are short introductions. “Authenticate to platforms” links outward for Google Cloud and omits the requested Postgres and SSH paths. Those omissions should be stated as unfinished scope.

**Required change:** make `/docs/spire/` or its current About destination a useful start page. Give each major section a short decision guide and a first recommended task. Keep explicit next steps within each project. Complete one end-to-end vendor-neutral application guide before expanding the catalog.

### F6. P2: The flagship diagram needs both a mechanism correction and a tablet layout

**Source-confirmed sizing risk and conceptual ambiguity; no visual observation claimed.**

The desktop SVG has a 1120-unit viewBox, with body labels around 12 units and code at 9.6. It remains active down to 651 CSS pixels. With the current page gutters, a 768-pixel viewport gives roughly 688 pixels to the diagram: body labels scale to about 7.4 CSS pixels. The mobile flow only replaces it below 650 pixels. Exact geometry still needs browser inspection.

The numbered request/issue/return sequence reads as a synchronous issuance round trip for each workload request. The caption acknowledges caching, but the main visual does not separate the agent's credential acquisition/rotation path from local attestation and delivery. It also generalizes across SVID types while the depicted cache lifecycle is chiefly an X.509 story. The official [SPIRE concepts documentation](https://spiffe.io/docs/latest/spire-about/spire-concepts/) describes the agent caching SVIDs before workload requests.

**Required change:** label it as an X.509-SVID example. Show an attested agent, server issuance/rotation into the agent cache, local selector matching and delivery of SVID/key/bundles, then a separate peer connection proving key possession. Keep authorization at the peer. Use a vertical or two-panel layout earlier than the present mobile breakpoint, with readable HTML labels.

### F7. P2: The directory does not yet fulfill the implementation-comparison promise

**Confirmed structure; editorial judgment.**

The directory filters project names and maintainer type. Interface support lives in a separate 12-column table, maintained separately from the project descriptions. Blank cells have no clear meaning: unsupported, unknown, or unreported. There is no per-entry verification date or evidence for a support declaration.

The current implementation avoids falsely claiming certification, which should be retained. But it does not yet make it easy to answer “which implementation serves the interface I need?”

**Required change:** use a shared structured record for the directory and support matrix. Distinguish declared support from unknown. Link evidence and a reviewed date where available. Keep the first version simple: supported interfaces, deployment model, and an outbound project link. Do not invent a certification program or unverified claims of completeness.

### F8. P2: The reference migration contains unfinished material and has no repeatable update path

**Confirmed, with inherited content distinguished from migration ownership.**

The nested Helm guide exposes a `fixme` sentence about CA TTLs and an `Example: TODO`. Historical companion tutorials retain SPIRE 1.11.2 and OPA 0.50.2-envoy. Keeping those coordinated pins is safer than blindly substituting latest versions, but it is not a content refresh. Specification documents are sensibly pinned to a revision, yet their transformation and refresh process is not shipped as a repeatable importer in the project.

**Required change:** correct or explicitly label unfinished authored guides. Keep historical tutorial versions coordinated and validate them as a set. Preserve canonical standards text and section maturity. Ship a small, reviewable import/update process with a readable diff; avoid manual copies silently diverging from upstream.

## Recommended information architecture

Keep one shell and one search index. Keep the two documentation trees. Reduce entry-point ambiguity rather than adding another navigation layer.

| Area | Main job | Recommended structure |
| --- | --- | --- |
| Home | Explain the model and provide a next action | Thesis and two CTAs; readable mechanism; three applications; project distinction; concise ecosystem/resources |
| SPIFFE | Understand or implement the standard | Overview; concepts; use SPIFFE; specifications |
| Specifications | Find the relevant contract and its maturity | Identity formats; credential delivery; trust/federation; incubating work; stability policy |
| SPIRE | Get a working identity system, then operate it | Start here; try; deploy; operate; reference; integrations; architectures |
| Implementations | Compare appropriate implementations | Shared project records with explicit interface support and evidence |
| Community | Contribute and understand governance | Contribution paths; groups/governance; event; security reporting; archives |
| Blog | Read and publish project work | One metadata source; dates/authors/tags; drafts; RSS; original URLs |

Keep the current homepage thesis as a candidate. The supporting copy already names SPIFFE and SPIRE clearly. The three-column explanation repeats some of that work; compress it after the mechanism is readable. Do not add more homepage sections to compensate for thin destinations.

Astro remains a reasonable choice for this documentation workload. The case for it is the shared docs shell and content pipeline. The replacement must preserve the existing contributor experience and current upstream capabilities to justify the migration cost.

## Ordered implementation plan

1. **Preserve upstream.** Already done for this review: real upstream branch, unchanged original tree, source inventory, and exact recorded base. Refresh it again before integration. Keep the root cutover as a separate, explicit change.
2. **Repair acceptance checks.** Cover same-origin absolute links, redirect fragments, duplicate IDs, import syntax, and blog publication metadata. These are observed risks, not speculative test expansion.
3. **Fix the first successful use.** Correct the concepts page and platform-specific quickstarts, then execute the advertised local path. Treat a retrieved SVID and an authenticated peer connection as distinct milestones.
4. **Restore contributor behavior.** Use one blog metadata source, port RSS/tags/draft authoring, and fix edit/source links. Make upstream document refresh reproducible.
5. **Refine the public journey.** Improve SPIRE's entry page, fill the most useful application guide, revise the mechanism, and consolidate ecosystem data.
6. **Complete browser acceptance.** Desktop/tablet/mobile layouts; keyboard search and both menus; directory filtering and empty state; one stable and one incubating spec; old URLs with fragments. Browser-policy restrictions prevented this review from performing those checks. Do not call the visual or interaction pass complete.

## Verification scope

The whole-site build passed again for the private review copy: 94 content pages, 205 static redirects, and a root 404 file, totaling 300 HTML outputs. The earlier 8,568-reference check still passes, and the new audit demonstrates why that is insufficient. All 86 URLs in the retrieved upstream sitemap are accounted for.

The adversarial pass parsed every generated HTML output and inspected the shared components, navigation configuration, release/build scripts, key audience journeys, representative specifications, and current upstream content/workflow. It did not execute deployment tutorials, perform a complete normative specification review, or observe browser rendering. No unsupported visual quality score or runtime search/filter success is claimed.

The preview changes only hosting identity and noindex metadata relative to the reviewed content. GitHub Pages remains the proposed official deployment target. The private preview is not a community-approved deployment.

## Page-by-page disposition

This inventory covers the 94 authored content routes. “Retain” means no page-specific defect was established in this pass; it does not certify every technical claim or tutorial command. Findings F1-F8 apply across the listed pages where relevant. Redirect-only outputs are recorded separately in the route map.

| Page | Disposition / next change |
| --- | --- |
| Identity workloads can prove. (`/`) | Keep thesis and explicit project distinction. Correct mechanism and tablet label sizing; compress repeated explanation. |
| Page not found (`/404/`) | Retain; verify hosted unknown-route behavior and useful recovery links. |
| From the project. (`/blog/`) | Derive listing from article metadata; restore tags and RSS. |
| [Re-Cap] SPIFFE Community Day: Fall 2018 (`/blog/2020-06-08-re-cap-spiffe-community-day-fall-2018/`) | Preserve author/date and historical claims. Restore tags/social metadata; normalize links to this site. |
| [Re-Cap] SPIFFE Community Day: Spring 2019 (`/blog/2020-06-09-re-cap-spiffe-community-day-spring-2019/`) | Preserve author/date and historical claims. Restore tags/social metadata; normalize links to this site. |
| [Re-Cap] SPIFFE Community Day: Fall 2019 (`/blog/2020-06-12-re-cap-spiffe-community-day-fall-2019/`) | Preserve author/date and historical claims. Restore tags/social metadata; normalize links to this site. |
| [Re-Cap] SPIFFE Community Day: Spring 2020 (`/blog/2020-06-18-spiffe-community-day-spring-2020/`) | Preserve author/date and historical claims. Restore tags/social metadata; normalize links to this site. |
| SPIFFE/SPIRE move to CNCF Incubation-level hosted projects! (`/blog/2020-06-22-spiffe-spire-move-to-cncf-incubation-level-hosted-projects/`) | Preserve author/date and historical claims. Restore tags/social metadata; normalize links to this site. |
| Scrutinizing SPIRE to Sensibly Strengthen SPIFFE Security (Part One) (`/blog/2020-09-25-scrutinizing-spire-security/`) | Preserve author/date and historical claims. Restore tags/social metadata; normalize links to this site. |
| Scrutinizing SPIRE to Sensibly Strengthen SPIFFE Security (Part Two) (`/blog/2020-09-25-scrutinizing-spire-to-sensibly-strengthen-spiffe-security-part-two/`) | Preserve author/date and historical claims. Restore tags/social metadata; normalize links to this site. |
| Enabling Authenticated Communication for Serverless Workloads with SPIRE (`/blog/2021-12-20-enabling-authenticated-communication-for-serverless-workloads-with-spire/`) | Preserve author/date and historical claims. Restore tags/social metadata; normalize links to this site. |
| SPIRE now runs on Windows! (`/blog/2022-05-20-spire-now-runs-on-windows/`) | Preserve author/date and historical claims. Restore tags/social metadata; normalize links to this site. |
| Hardening Istio security with SPIRE (`/blog/2022-06-16-hardening-istio-security-with-spire/`) | Preserve author/date and historical claims. Restore tags/social metadata; normalize links to this site. |
| The Bottom Turtle That Heals Itself - Design (`/blog/2026-07-19-bottom-turtle-ha-architecture/`) | Preserve author/date and historical claims. Restore tags/social metadata; normalize links to this site. |
| The SPIFFE Standard Roadmap (`/blog/2026-08-18-spiffe-standard-roadmap/`) | Preserve author/date and historical claims. Restore tags/social metadata; normalize links to this site. |
| The Bottom Turtle That Heals Itself - Deployment from Scratch (`/blog/2026-08-23-bottom-turtle-ha-deployment/`) | Preserve author/date and historical claims. Restore tags/social metadata; normalize links to this site. |
| Bottom Turtle Kubernetes - SPIRE Under Kubernetes, Not Just On Top of It (`/blog/2026-09-03-spire-under-kubernetes/`) | Repair the link to the missing October-dated deployment article; preserve authored text and metadata. |
| Solving the Bottom Turtle. (`/book/`) | Retain book download and credit. Keep an accessible download description. |
| Community Day 2026 (`/community-day-2026/`) | Preserve current upstream agenda and its provisional timing context; check table layout in browser. |
| A standard built in the open. (`/community/`) | Retain current event and governance paths. Add a direct vulnerability-reporting route. |
| Community Presentations (`/community/presentations/`) | Retain the archive as an archive; verify external recording links separately. |
| Documentation (`/docs/`) | Keep the two destinations. Link each to a useful start page. |
| SPIFFE Concepts (`/docs/spiffe/concepts/`) | P1: correct JWT bundle prose and validation language. Repair the literal heading marker and legacy fragment. |
| SPIFFE overview (`/docs/spiffe/overview/`) | Keep concise standard-level introduction and separation of identity from authorization. |
| Specifications (`/docs/spiffe/specs/`) | Group contracts by task and maturity; preserve section-specific stability caveat. |
| Broker API (`/docs/spiffe/specs/broker-api/`) | Retain canonical revision and maturity. Check hierarchy/anchors and separate source from edit link. |
| Broker endpoint (`/docs/spiffe/specs/broker-endpoint/`) | Retain canonical revision and maturity. Check hierarchy/anchors and separate source from edit link. |
| Federation (`/docs/spiffe/specs/federation/`) | Retain canonical revision and maturity. Check hierarchy/anchors and separate source from edit link. |
| Filesystem delivery (`/docs/spiffe/specs/filesystem-delivery/`) | Remove duplicate abstract ID. Preserve incubating status and canonical revision. |
| JWT-SVID (`/docs/spiffe/specs/jwt-svid/`) | Retain canonical revision and maturity. Check hierarchy/anchors and separate source from edit link. |
| SPIFFE ID (`/docs/spiffe/specs/spiffe-id/`) | Retain canonical revision and maturity. Check hierarchy/anchors and separate source from edit link. |
| SPIFFE framework (`/docs/spiffe/specs/spiffe/`) | Retain canonical revision and maturity. Check hierarchy/anchors and separate source from edit link. |
| Specification stability (`/docs/spiffe/specs/stability/`) | Retain canonical revision and maturity. Check hierarchy/anchors and separate source from edit link. |
| Trust domain and bundle (`/docs/spiffe/specs/trust-domain-and-bundle/`) | Retain canonical revision and maturity. Check hierarchy/anchors and separate source from edit link. |
| WIT-SVID (`/docs/spiffe/specs/wit-svid/`) | Retain canonical revision and maturity. Check hierarchy/anchors and separate source from edit link. |
| Workload API (`/docs/spiffe/specs/workload-api/`) | Retain canonical revision and maturity. Check hierarchy/anchors and separate source from edit link. |
| Workload endpoint (`/docs/spiffe/specs/workload-endpoint/`) | Retain canonical revision and maturity. Check hierarchy/anchors and separate source from edit link. |
| X.509-SVID (`/docs/spiffe/specs/x509-svid/`) | Retain canonical revision and maturity. Check hierarchy/anchors and separate source from edit link. |
| Authenticate across trust domains (`/docs/spiffe/use-cases/federation/`) | Keep independent trust-domain framing. Add a compact trust-bundle/verification mechanism. |
| Authenticate to platforms (`/docs/spiffe/use-cases/platform-authentication/`) | Complete a real platform-authentication path; add scoped Postgres/SSH coverage when sourced. |
| Authenticate between services (`/docs/spiffe/use-cases/service-authentication/`) | Keep authentication/authorization distinction. Add a runnable neutral application example. |
| About SPIRE (`/docs/spire/about/`) | Replace one-sentence landing with a start page and recommended learning path. |
| SPIRE Case Studies (`/docs/spire/about/case-studies/`) | Retain, with a focused content review and corrected source/edit ownership before cutover. |
| How does SPIRE compare to other tools? (`/docs/spire/about/comparisons/`) | Retain, with a focused content review and corrected source/edit ownership before cutover. |
| SPIRE Concepts (`/docs/spire/about/concepts/`) | Retain detailed lifecycle, reconcile homepage diagram with cache behavior, normalize old absolute links. |
| SPIRE Use Cases (`/docs/spire/about/use-cases/`) | Retain, with a focused content review and corrected source/edit ownership before cutover. |
| SPIRE Architectural Options (`/docs/spire/architecture/`) | Turn the short link hub into a concise decision guide with a recommended first task. |
| Deploying a Federated SPIRE Architecture (`/docs/spire/architecture/federation/`) | Retain architecture guidance. Reconcile pinned examples with companion repository before updating versions. |
| Deploying a Nested SPIRE Architecture (`/docs/spire/architecture/nested/`) | Retain architecture guidance. Reconcile pinned examples with companion repository before updating versions. |
| Deploying SPIRE (`/docs/spire/deploying/`) | Turn the short link hub into a concise decision guide with a recommended first task. |
| Configuring SPIRE (`/docs/spire/deploying/configuring/`) | Retain reference content. Fix source/edit ownership and verify against the documented SPIRE release. |
| Install SPIRE Agents (`/docs/spire/deploying/install-agents/`) | Retain reference content. Fix source/edit ownership and verify against the documented SPIRE release. |
| Install the SPIRE Server (`/docs/spire/deploying/install-server/`) | Retain reference content. Fix source/edit ownership and verify against the documented SPIRE release. |
| SPIFFE Library Usage Examples (`/docs/spire/deploying/libraries/`) | Retain reference content. Fix source/edit ownership and verify against the documented SPIRE release. |
| Registering workloads (`/docs/spire/deploying/registering/`) | Retain reference content. Fix source/edit ownership and verify against the documented SPIRE release. |
| SPIRE Agent Configuration Reference (`/docs/spire/deploying/spire_agent/`) | Retain reference content. Fix source/edit ownership and verify against the documented SPIRE release. |
| SPIRE Server Configuration Reference (`/docs/spire/deploying/spire_server/`) | Retain reference content. Fix source/edit ownership and verify against the documented SPIRE release. |
| Working with SVIDs (`/docs/spire/deploying/svids/`) | Retain reference content. Fix source/edit ownership and verify against the documented SPIRE release. |
| SPIRE Telemetry Configuration (`/docs/spire/deploying/telemetry_config/`) | Retain reference content. Fix source/edit ownership and verify against the documented SPIRE release. |
| Getting SPIRE (`/docs/spire/deploying/using_spire/`) | Normalize same-site links and align download/build guidance with the chosen quickstart. |
| About SPIRE Helm Charts Hardened (`/docs/spire/helm/`) | Turn the short link hub into a concise decision guide with a recommended first task. |
| SPIRE Helm Charts Hardened Advanced Configuration (`/docs/spire/helm/advanced/`) | Turn the short link hub into a concise decision guide with a recommended first task. |
| Federation (`/docs/spire/helm/advanced/federation/`) | Retain deployment guidance. Verify chart values, references, and upgrade assumptions against the selected chart version. |
| Local Mirrors (`/docs/spire/helm/advanced/mirror/`) | Retain deployment guidance. Verify chart values, references, and upgrade assumptions against the selected chart version. |
| Nested SPIRE (`/docs/spire/helm/advanced/nested-spire/`) | P1/P2: repair malformed source links; resolve visible fixme/TODO material with upstream maintainers. |
| Exposing Services (`/docs/spire/helm/exposing/`) | Retain deployment guidance. Verify chart values, references, and upgrade assumptions against the selected chart version. |
| Identifiers (`/docs/spire/helm/identifiers/`) | Retain deployment guidance. Verify chart values, references, and upgrade assumptions against the selected chart version. |
| Installation (`/docs/spire/helm/installation/`) | Retain deployment guidance. Verify chart values, references, and upgrade assumptions against the selected chart version. |
| Namespaces (`/docs/spire/helm/namespaces/`) | Retain deployment guidance. Verify chart values, references, and upgrade assumptions against the selected chart version. |
| Recommendations (`/docs/spire/helm/recommendations/`) | Retain deployment guidance. Verify chart values, references, and upgrade assumptions against the selected chart version. |
| Service Selection (`/docs/spire/helm/service-selection/`) | Turn the short link hub into a concise decision guide with a recommended first task. |
| upgrading (`/docs/spire/helm/upgrading/`) | Retain deployment guidance. Verify chart values, references, and upgrade assumptions against the selected chart version. |
| Using SVIDs to Authenticate to Other Platforms and Applications (`/docs/spire/integrations/platforms/`) | Turn the short link hub into a concise decision guide with a recommended first task. |
| AWS OIDC Authentication (`/docs/spire/integrations/platforms/oidc-federation-aws/`) | Keep implementation mechanics under SPIRE. Validate companion files and coordinated version pins; normalize old links. |
| Vault Integration Example (`/docs/spire/integrations/platforms/vault/`) | Keep implementation mechanics under SPIRE. Validate companion files and coordinated version pins; normalize old links. |
| Secure Microservices Communication (`/docs/spire/integrations/services/`) | Turn the short link hub into a concise decision guide with a recommended first task. |
| OPA Authorization with Envoy and JWT-SVIDs (`/docs/spire/integrations/services/envoy-jwt-opa/`) | Keep implementation mechanics under SPIRE. Validate companion files and coordinated version pins; normalize old links. |
| Using Envoy with JWT-SVIDs (`/docs/spire/integrations/services/envoy-jwt/`) | Keep implementation mechanics under SPIRE. Validate companion files and coordinated version pins; normalize old links. |
| OPA Authorization with Envoy and X.509-SVIDs (`/docs/spire/integrations/services/envoy-opa/`) | Keep implementation mechanics under SPIRE. Validate companion files and coordinated version pins; normalize old links. |
| Using Envoy with X.509-SVIDs (`/docs/spire/integrations/services/envoy-x509/`) | Keep implementation mechanics under SPIRE. Validate companion files and coordinated version pins; normalize old links. |
| Using Envoy with SPIRE (`/docs/spire/integrations/services/envoy/`) | Keep implementation mechanics under SPIRE. Validate companion files and coordinated version pins; normalize old links. |
| Maintaining SPIRE (`/docs/spire/maintenance/`) | Turn the short link hub into a concise decision guide with a recommended first task. |
| Upgrade/Downgrade SPIRE (`/docs/spire/maintenance/upgrading/`) | Retain, with a focused content review and corrected source/edit ownership before cutover. |
| Planning a SPIRE Deployment (`/docs/spire/planning/`) | Turn the short link hub into a concise decision guide with a recommended first task. |
| Extend SPIRE (`/docs/spire/planning/extending/`) | Retain, with a focused content review and corrected source/edit ownership before cutover. |
| Scaling SPIRE (`/docs/spire/planning/scaling_spire/`) | Retain, with a focused content review and corrected source/edit ownership before cutover. |
| Try SPIRE (`/docs/spire/try/`) | Turn the short link hub into a concise decision guide with a recommended first task. |
| Quickstart for Kubernetes (`/docs/spire/try/getting-started-k8s/`) | Execute the current Kubernetes path and verify image/config versions together. |
| Quickstart for Linux and MacOS X (`/docs/spire/try/getting-started-linux-macos-x/`) | P1: fix Go requirement and architecture selection; execute the advertised steps. |
| Quickstart for Docker (`/docs/spire/try/spire101/`) | Retain Docker entry path; validate it as an alternative first-run journey. |
| Get SPIRE. (`/downloads/`) | Retain live release assets and checksums. Connect platform choice to matching quickstart commands. |
| An ecosystem built on SPIFFE. (`/ecosystem/`) | Retain current upstream entries. Share records with the matrix and add interface-based comparison. |
| Implementation support matrix (`/ecosystem/matrix/`) | Retain declarations without certification claims. Define blanks and support evidence; replace wide-table-only comparison. |
| Run workload identity with SPIRE. (`/spire/`) | Keep self-service and community ownership positioning. Fix the quickstart reached by its primary CTA. |

## Review artifacts

- `review/adversarial-evidence.json`: generated-page observations, absolute URLs, IDs, edit-link counts, and headings.
- `review/upstream-preservation.json`: exact upstream revision, unchanged-file check, content mapping, and ecosystem comparison.
- `review/spire-v1.15.5-go.mod`: fetched release toolchain evidence.
- `review/build-checks.json` and `review/route-coverage.json`: earlier structural checks, with their limits explained above.
