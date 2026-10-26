import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const [repository, revision] = process.argv.slice(2);
if (!/^spiffe\/[\w.-]+$/.test(repository || '') || !/^[\w.-]+$/.test(revision || '')) {
  throw new Error('Usage: npm run sources -- spiffe/REPOSITORY REVISION');
}
const { documents } = JSON.parse(await fs.readFile(new URL('../src/data/sources.json', import.meta.url), 'utf8'));
const selected = documents.filter(d => d.source.startsWith(`https://github.com/${repository}/blob/`));
if (!selected.length) throw new Error(`No imported documents from ${repository}`);
const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'spiffe-sources-'));
for (const doc of selected) {
  const [, oldRevision, sourcePath] = doc.source.match(/\/blob\/([^/]+)\/(.+)$/);
  const files = [];
  for (const [label, ref] of [['before', oldRevision], ['after', revision]]) {
    const response = await fetch(`https://raw.githubusercontent.com/${repository}/${ref}/${sourcePath}`);
    if (!response.ok) throw new Error(`${doc.page}: ${response.status} fetching ${ref}`);
    const file = path.join(dir, label, sourcePath);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, await response.text());
    files.push(file);
  }
  const diff = spawnSync('git', ['diff', '--no-index', '--', ...files], { encoding: 'utf8' });
  if (diff.status > 1 || diff.error) throw diff.error || new Error(diff.stderr);
  if (diff.stdout) console.log(`Page: src/content/docs/${doc.page}\n${diff.stdout}`);
}
console.log(`Source files: ${dir}`);
