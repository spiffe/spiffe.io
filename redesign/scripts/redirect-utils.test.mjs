import { test } from 'node:test';
import assert from 'node:assert/strict';
import { redirectMap, resolveRedirect, redirectScript } from './redirect-utils.mjs';
import vm from 'node:vm';

test('redirects must lead directly to content, independent of trailing slashes', () => {
  assert.equal(redirectMap({ '/old/': '/current/' }).get('/old'), '/current/');
  for (const routes of [
    { '/old': '/middle/', '/middle': '/current/' },
    { '/old/': '/old' },
    { '/one': '/two/', '/two': '/one/' },
    { '/old': '/current/', '/old/': '/other/' },
    { '/old': 'https://other.example/' },
  ]) assert.throws(() => redirectMap(routes));
});

test('destination query and fragment take precedence while preserving other incoming values', () => {
  const incoming = 'https://spiffe.io/old/?mode=old&tag=a&tag=b#old-heading';
  assert.equal(resolveRedirect('/current/', incoming).href, 'https://spiffe.io/current/?mode=old&tag=a&tag=b#old-heading');
  assert.equal(resolveRedirect('/current/?mode=new#new-heading', incoming).href, 'https://spiffe.io/current/?mode=new&tag=a&tag=b#new-heading');
});

test('generated client redirect runs the same URL resolution without breaking script boundaries', () => {
  let result;
  const location = { href: 'https://preview.example/old/?check=redirect#spec', replace: url => result = url };
  const script = redirectScript('/current/?value=%3C/script%3E');
  vm.runInNewContext(script.slice(8, -9), { URL, Set, location });
  assert.equal(result, 'https://preview.example/current/?value=%3C%2Fscript%3E&check=redirect#spec');
  assert.equal((redirectScript('/current/?value=</script>').match(/<\/script>/g) || []).length, 1);
});
