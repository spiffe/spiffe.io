import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repo = path.dirname(project);
const manifest = JSON.parse(fs.readFileSync(path.join(project, 'review/source-manifest.json'), 'utf8'));
const git = (...args) => execFileSync('git', args, { cwd: repo, encoding: 'utf8' }).trim();
const upstream = 'https://github.com/spiffe/spiffe.io.git';
const remote = git('remote', 'get-url', 'origin');
if (![upstream, upstream.replace(/\.git$/, '')].includes(remote)) {
  throw new Error('Run this check from the upstream spiffe/spiffe.io checkout.');
}

git('fetch', '--no-tags', 'origin', 'master');
const base = manifest.site.revision;
const current = git('rev-parse', 'origin/master');
if (current !== base) {
  console.error(`Upstream advanced from ${base} to ${current}. Reconcile these changes before updating the baseline:`);
  console.error(git('diff', '--name-status', `${base}..origin/master`));
  process.exit(1);
}
const changes = git('diff', '--name-status', base, '--', '.', ':(exclude)redesign');
if (changes) {
  console.error('Existing upstream files changed. Review this explicitly before cutover:\n' + changes);
  process.exit(1);
}
console.log(`Upstream is unchanged at ${current}. Existing source files are preserved.`);
