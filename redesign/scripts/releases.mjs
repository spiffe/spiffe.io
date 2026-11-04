import fs from 'node:fs/promises';
const file = new URL('../src/data/release.json', import.meta.url);
const cached = JSON.parse(await fs.readFile(file, 'utf8'));
if (process.env.SPIFFE_OFFLINE === '1') {
  console.log(`Offline build: release snapshot ${cached.tag}, fetched ${cached.fetchedAt}.`);
} else {
  try {
    const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'spiffe-io-build' };
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const response = await fetch('https://api.github.com/repos/spiffe/spire/releases/latest', { headers, signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);
    const r = await response.json();
    if (r.draft || r.prerelease || !/^v\d+\.\d+\.\d+$/.test(r.tag_name) || !Array.isArray(r.assets)) throw new Error('Unexpected release metadata');
    const data = { tag:r.tag_name, version:r.tag_name.slice(1), publishedAt:r.published_at, url:r.html_url, fetchedAt:new Date().toISOString(), assets:r.assets.map(a => ({name:a.name,url:a.browser_download_url})) };
    for (const a of data.assets) if (!a.url.startsWith(`https://github.com/spiffe/spire/releases/download/${data.tag}/`)) throw new Error('Unexpected asset URL');
    if (!data.assets.some(a => a.name === `spire-${data.version}-linux-amd64-musl.tar.gz`)) throw new Error('Expected Linux release asset is missing');
    await fs.writeFile(file, JSON.stringify(data,null,2)+'\n');
    console.log(`Release metadata refreshed: ${data.tag}`);
  } catch (error) {
    if (process.env.CI || process.argv.includes('--refresh')) throw error;
    console.warn(`Release refresh failed: ${error.message}. Local build uses snapshot ${cached.tag} from ${cached.fetchedAt}. CI fails instead of publishing stale metadata.`);
  }
}
