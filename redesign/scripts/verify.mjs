import fs from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve('dist');
const files = [];
async function walk(dir) { for (const e of await fs.readdir(dir,{withFileTypes:true})) { const f = path.join(dir,e.name); if(e.isDirectory()) await walk(f); else files.push(f); } }
await walk(root);
const existing = new Set(files);
const htmlFiles = files.filter(f=>f.endsWith('.html'));
const ids = new Map(); const pages = new Map(); const errors=[];
const decode = s => s.replaceAll('&amp;','&').replaceAll('&#39;',"'").replaceAll('&quot;','"');
for(const file of htmlFiles) {
  const html = await fs.readFile(file,'utf8'); pages.set(file,html);
  ids.set(file,new Set([...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m=>decode(m[1]))));
  if (/@@SPIRE_|\{\{[<%]/.test(html)) errors.push(`${path.relative(root,file)}: unrendered source token`);
  if (!/<title>[^<]+<\/title>/.test(html)) errors.push(`${path.relative(root,file)}: missing title`);
}
let links=0;
for(const [file,html] of pages) {
  const route='/'+path.relative(root,file).replace(/index\.html$/,'');
  for(const match of html.matchAll(/\b(href|src)=["']([^"']*)["']/g)) {
    const ref=decode(match[2]);
    if (!ref || /^(?:https?:|mailto:|tel:|data:|javascript:|\/\/)/.test(ref)) continue;
    const u=new URL(ref, 'https://spiffe.io'+route);
    let pathname; try {pathname=decodeURIComponent(u.pathname);} catch {continue;}
    let target=path.join(root,pathname);
    if(pathname.endsWith('/')) target=path.join(target,'index.html');
    if(!existing.has(target) && !path.extname(target)) target=path.join(target,'index.html');
    links++;
    if(!existing.has(target)) {errors.push(`${route}: ${match[1]} ${ref} has no file`);continue;}
    if(u.hash && ids.has(target)) {
      let id;try{id=decodeURIComponent(u.hash.slice(1));}catch{continue;}
      if(!ids.get(target).has(id) && !/http-equiv=["']refresh/.test(pages.get(target))) errors.push(`${route}: missing anchor ${ref}`);
    }
  }
}
const summary={pages:htmlFiles.length,internalReferences:links,failures:[...new Set(errors)]};
await fs.mkdir('review',{recursive:true});await fs.writeFile('review/build-checks.json',JSON.stringify(summary,null,2)+'\n');
if(summary.failures.length) { console.error(summary.failures.slice(0,90).join('\n')); console.error(`${summary.failures.length} validation failures.`); process.exit(1); }
console.log(`Verified ${htmlFiles.length} HTML pages and ${links} internal references. No missing files, anchors, or release tokens.`);
