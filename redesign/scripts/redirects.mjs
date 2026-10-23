import fs from 'node:fs/promises';
import path from 'node:path';
const redirects = JSON.parse(await fs.readFile('src/data/redirects.json','utf8'));
for (const [from,to] of Object.entries(redirects)) {
  const file=path.join('dist',from,'index.html');
  let html=await fs.readFile(file,'utf8');
  // Static hosts can serve these redirect files. Preserve inbound fragments in
  // the client redirect, with Astro's meta refresh as a no-JavaScript fallback.
  const script=`<script>location.replace(${JSON.stringify(to)}+location.search+location.hash)</script>`;
  html=html.replace('<body>',script+'<body>');
  await fs.writeFile(file,html);
}
console.log(`Prepared ${Object.keys(redirects).length} static redirects with fragment preservation.`);

// Static hosts use the root 404.html for missing routes.
await fs.copyFile('dist/404/index.html', 'dist/404.html');
