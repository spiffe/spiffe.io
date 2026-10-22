import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { unified } from '@astrojs/markdown-remark';
import fs from 'node:fs';
import release from './src/data/release.json' with { type: 'json' };

// A single content pipeline renders prose, code examples, and download URLs.
function releaseTokens() {
  return (tree) => {
    const visit = (node) => {
      for (const key of ['value', 'url']) if (typeof node[key] === 'string') {
        node[key] = node[key].replaceAll('@@SPIRE_VERSION@@', release.version)
          .replaceAll('@@SPIRE_TAG@@', release.tag)
          .replaceAll('@@SPIRE_TARBALL@@', `spire-${release.version}-linux-amd64-musl.tar.gz`);
      }
      node.children?.forEach(visit);
    };
    visit(tree);
  };
}

export default defineConfig({
  site: 'https://spiffe.io',
  output: 'static',
  server: { host: '0.0.0.0', port: 4173 },
  trailingSlash: 'always',
  redirects: JSON.parse(fs.readFileSync('./src/data/redirects.json', 'utf8')),
  markdown: { processor: unified({ remarkPlugins: [releaseTokens] }) },
  integrations: [starlight({
    title: 'SPIFFE',
    description: 'The open standard for workload identity. Understand SPIFFE, run SPIRE, and build with the ecosystem.',
    favicon: '/img/logos/spiffe/icon/color/spiffe-icon-color.svg',
    customCss: ['./src/styles/site.css'],
    disable404Route: true,
    credits: false,
    routeMiddleware: './src/route-middleware.ts',
    components: {
      Header: './src/components/Header.astro',
      Hero: './src/components/Hero.astro',
      Sidebar: './src/components/Sidebar.astro',
      Footer: './src/components/Footer.astro',
      ThemeProvider: './src/components/ThemeProvider.astro',
      ThemeSelect: './src/components/Empty.astro',
    },
    head: [
      { tag: 'meta', attrs: { name: 'theme-color', content: '#ffffff' } },
      { tag: 'meta', attrs: { property: 'og:image', content: 'https://spiffe.io/social.png' } },
      { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
    ],
    sidebar: [
      { label: 'SPIFFE', items: [
        { label: 'Overview', slug: 'docs/spiffe/overview' },
        { label: 'Concepts', slug: 'docs/spiffe/concepts' },
        { label: 'Use SPIFFE', items: [{ autogenerate: { directory: 'docs/spiffe/use-cases' } }] },
        { label: 'Specifications', items: [{ autogenerate: { directory: 'docs/spiffe/specs' } }] },
      ]},
      { label: 'SPIRE', items: [
        { label: 'Understand', items: [{ autogenerate: { directory: 'docs/spire/about' } }] },
        { label: 'Try SPIRE', items: [{ autogenerate: { directory: 'docs/spire/try' } }] },
        { label: 'Plan', collapsed: true, items: [{ autogenerate: { directory: 'docs/spire/planning' } }] },
        { label: 'Deploy', collapsed: true, items: [{ autogenerate: { directory: 'docs/spire/deploying' } }] },
        { label: 'Operate', collapsed: true, items: [{ autogenerate: { directory: 'docs/spire/maintenance' } }] },
        { label: 'Helm charts', collapsed: true, items: [{ autogenerate: { directory: 'docs/spire/helm' } }] },
        { label: 'Integrations', collapsed: true, items: [{ autogenerate: { directory: 'docs/spire/integrations' } }] },
        { label: 'Architectures', collapsed: true, items: [{ autogenerate: { directory: 'docs/spire/architecture' } }] },
      ]},
      { label: 'Project', items: [
        { label: 'Ecosystem', link: '/ecosystem/' },
        { label: 'Implementation matrix', slug: 'ecosystem/matrix' },
        { label: 'Community', link: '/community/' },
        { label: 'Presentations', slug: 'community/presentations' },
        { label: 'Blog', link: '/blog/' },
        { label: 'The SPIFFE book', link: '/book/' },
      ]},
    ],
  })],
});
