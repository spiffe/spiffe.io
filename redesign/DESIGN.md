# Site design

SPIFFE documentation explains the identity standard and specifications. SPIRE documentation follows an operator's path through understanding, trying, planning, deploying, and maintaining an implementation. Each has its own sidebar and an explicit project switch. The homepage, ecosystem directory, blog, and community pages share the same navigation and search.

Astro generates static HTML. Starlight supplies accessible documentation navigation, code rendering, heading links, and Pagefind search. Small components handle the homepage and directory filters without a client application framework.

Markdown and MDX are the content sources. Blog frontmatter supplies listings, publication dates, tags, social images, and RSS. Ecosystem records supply the directory and its filtered commercial view. Imported document sources are recorded in `src/data/sources.json`; specification licenses and attribution travel with the content. Source updates are reviewed as diffs, and tutorial versions are updated with their companion examples. Release metadata supplies downloads and current-release placeholders.

Netlify deploy previews build `redesign/` and publish its `dist/` directory. Production continues to use the root Hugo build. Switching the production build to Astro is a deployment decision for maintainers after review. Static redirect pages preserve legacy paths, queries, and fragments; the build checks their destinations. The generated site can also be served by another static host at the domain root.
